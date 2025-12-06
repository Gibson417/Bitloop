<script>
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { colors } from '../lib/colorTokens.js';
  import { BASE_RESOLUTION } from '../store/projectStore.js';
  import { theme } from '../store/themeStore.js';

  export let notes = [];
  export let rows = 8;
  export let columns = 16;
  export let stepsPerBar = 16;
  export let playheadStep = 0;
  export let playheadProgress = 0;
  export let trackColor = colors.accent;
  export let follow = true;
  export let isPlaying = false;
  export let noteLabels = [];
  // noteLengthDenominator: e.g. 16 for 1/16, 32 for 1/32, 64 for 1/64 - used for note duration when placing
  export const noteLengthSteps = 1; // backwards-compat (grouping factor)
  export let noteLengthDenominator = undefined;
  export let manualWindow = null; // Manual window override (null = auto-follow playhead)
  export let zoomLevel = 1; // Grid resolution denominator: 1, 2, 4, 8, 16, 32, 64 (controls grid density)

  const dispatch = createEventDispatcher();

  // Articulation gap: reserve one extra storage step after each note to prevent merging
  const ARTICULATION_GAP = 1;

  let canvas;
  let scroller;
  let ctx;
  let layout = { cellSize: 32, width: 0, height: 0, dpr: 1 };
  let pointerActive = false;
  let paintValue = true;
  let paintedCells = new Set();
  let paintedRanges = new Map(); // Track painted ranges per row: row -> array of {start, end}
  let resizeObserver;
  let eraseMode = false; // Track if shift/alt key is held for explicit erase
  let extendMode = false; // Track if ctrl/cmd key is held for note extension
  
  // Keyboard navigation state
  let focusedRow = 0;
  let focusedCol = 0;
  let keyboardMode = false;

  // Track current theme to trigger redraw on theme change
  let currentTheme;
  const unsubscribeTheme = theme.subscribe((value) => {
    currentTheme = value;
  });

  // Compute cursor style based on erase mode and extend mode
  $: cursorStyle = eraseMode ? 'not-allowed' : extendMode ? 'col-resize' : 'crosshair';


  const hexToRgba = (hex, alpha = 1) => {
    const fallback = hex ?? colors.accent;
    const clean = fallback.replace('#', '');
    const bigint = parseInt(clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Convert boolean matrix to note events for rendering
  const extractNoteEvents = (notesMatrix, rows) => {
    const events = [];
    for (let row = 0; row < rows; row++) {
      const rowNotes = notesMatrix?.[row] ?? [];
      let noteStart = -1;
      
      for (let step = 0; step < rowNotes.length; step++) {
        if (rowNotes[step]) {
          if (noteStart === -1) {
            noteStart = step;
          }
        } else if (noteStart !== -1) {
          // End of note
          events.push({ row, start: noteStart, length: step - noteStart });
          noteStart = -1;
        }
      }
      
      // Handle note that extends to end
      if (noteStart !== -1) {
        events.push({ row, start: noteStart, length: rowNotes.length - noteStart });
      }
    }
    return events;
  };

  const getStyles = () => {
    const style = getComputedStyle(canvas);
    return {
      background: style.getPropertyValue('--color-grid-bg')?.trim() || style.getPropertyValue('--color-panel')?.trim() || colors.panel,
      backgroundEnd: style.getPropertyValue('--color-grid-bg-end')?.trim() || 'rgba(14, 16, 22, 0.92)',
      grid: style.getPropertyValue('--color-grid-line')?.trim() || 'rgba(255,255,255,0.08)',
      inactive:
        style.getPropertyValue('--color-note-inactive')?.trim() || colors.noteInactive,
      playhead:
        style.getPropertyValue('--color-playhead')?.trim() || hexToRgba(trackColor, 0.9)
    };
  };

  const MIN_CELL_SIZE = 44; // WCAG 2.5.5 Level AAA touch target size (desktop)
  const MIN_CELL_SIZE_MOBILE = 28; // Exceeds WCAG 2.5.5 Level AA minimum (24px) with comfortable margin
  const MIN_VISIBLE_COLUMNS = 8; // Minimum columns to show (half bar of 16th notes)
  const MAX_CELL_SIZE = 96; // Maximum cell size for optimal visual balance
  const MOBILE_BREAKPOINT = 768; // Width threshold for mobile vs desktop cell sizing
  const BOUNDARY_TOLERANCE = 0.01; // Floating-point tolerance for detecting bar/beat boundaries

  const updateLayout = () => {
    if (!canvas || !scroller) {
      return;
    }
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const safeRows = Math.max(rows || 8, 1);
    const logicalColumns = Math.max(columns || 16, 1); // logical total steps (bars * stepsPerBar)
    const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
    // storageColumns is high-res internal storage length (bars * BASE_RESOLUTION)
    const storageColumns = Math.max(1, Math.floor(logicalColumns * (BASE_RESOLUTION / stepsPerBarSafe)));
    
    // Calculate visible columns based on available screen width and minimum cell size
    // Use smaller cell size on mobile to maintain touch accessibility while fitting more columns
    // Mobile: 28px cells (exceeds WCAG 2.5.5 Level AA 24px requirement)
    // Desktop: 44px cells (meets WCAG 2.5.5 Level AAA requirement)
    const isMobile = (scroller.clientWidth || 0) < MOBILE_BREAKPOINT;
    const minCellSize = isMobile ? MIN_CELL_SIZE_MOBILE : MIN_CELL_SIZE;
    
    // Determine how many columns can fit at the minimum cell size
    const availableWidth = scroller.clientWidth || (MIN_VISIBLE_COLUMNS * minCellSize);
    const maxColumnsForWidth = Math.floor(availableWidth / minCellSize);
    
    // Calculate total display columns based on zoom level
    // Zoom determines grid resolution: how many columns represent the full sequence
    const zoom = Number(zoomLevel) || 16;
    const logicalToDisplayScale = zoom / stepsPerBarSafe;
    const totalDisplayColumns = Math.floor(logicalColumns * logicalToDisplayScale);
    
    // Visible columns is constrained by screen width, not zoom level
    // Must be divisible by stepsPerBar for proper 4/4 time signature alignment (complete bars)
    // If that's not possible, fall back to quarter-note alignment (divisible by 4)
    let rawVisibleColumns = Math.max(MIN_VISIBLE_COLUMNS, Math.min(maxColumnsForWidth, totalDisplayColumns));
    let visibleColumns = Math.floor(rawVisibleColumns / stepsPerBarSafe) * stepsPerBarSafe; // Round down to nearest multiple of stepsPerBar
    if (visibleColumns < MIN_VISIBLE_COLUMNS) {
      // If we can't fit a complete bar, fall back to quarter-note alignment (if stepsPerBar is divisible by 4)
      if (stepsPerBarSafe % 4 === 0) {
        const stepsPerQuarterBar = Math.max(1, Math.floor(stepsPerBarSafe / 4));
        visibleColumns = Math.floor(rawVisibleColumns / stepsPerQuarterBar) * stepsPerQuarterBar;
      } else if (stepsPerBarSafe % 2 === 0) {
        // Fall back to half-bar alignment if quarter-bar doesn't divide evenly
        const stepsPerHalfBar = Math.max(1, Math.floor(stepsPerBarSafe / 2));
        visibleColumns = Math.floor(rawVisibleColumns / stepsPerHalfBar) * stepsPerHalfBar;
      }
      // Ensure we still meet minimum visible columns requirement
      if (visibleColumns < MIN_VISIBLE_COLUMNS) {
        visibleColumns = MIN_VISIBLE_COLUMNS; // MIN_VISIBLE_COLUMNS is 8, which is divisible by 4
      }
    }
    
    const cellSize = Math.max(minCellSize, Math.min(MAX_CELL_SIZE, Math.floor(availableWidth / visibleColumns)));
    // Width is calculated based on visible columns
    const width = visibleColumns * cellSize;
    const height = safeRows * cellSize;

    layout = { cellSize, width, height, dpr };

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (!ctx) {
      ctx = canvas.getContext('2d');
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

    const draw = () => {
      if (!ctx) return;
      const safeRows = Math.max(rows || 8, 1);
      const safeColumns = Math.max(columns || 16, 1);
      // ...existing code...
      const styles = getStyles();
      ctx.clearRect(0, 0, layout.width, layout.height);
      const backgroundGradient = ctx.createLinearGradient(0, 0, 0, layout.height);
      backgroundGradient.addColorStop(0, styles.background);
      backgroundGradient.addColorStop(1, styles.backgroundEnd);
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, layout.width, layout.height);

      // Calculate display columns based on zoom level (grid density/resolution)
      const logicalColumns = Math.max(columns || 16, 1);
      const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
      const storageColumns = Math.max(1, Math.floor(logicalColumns * (BASE_RESOLUTION / stepsPerBarSafe)));
      const cellSize = layout.cellSize;
      
      // Calculate display columns and visible columns
      // Zoom determines the grid resolution/density
      // Visible columns is determined by physical screen constraints (from updateLayout)
      const zoom = Number(zoomLevel) || 16;
      const logicalToDisplayScale = zoom / stepsPerBarSafe;
      
      // Calculate visible columns from layout width (matches updateLayout calculation)
      const isMobile = (scroller?.clientWidth || 0) < MOBILE_BREAKPOINT;
      const minCellSize = isMobile ? MIN_CELL_SIZE_MOBILE : MIN_CELL_SIZE;
      const visibleColumns = Math.floor(layout.width / layout.cellSize);
      
      // Use manual window if set, otherwise follow playhead only if follow mode is enabled
      // Window offset is in display coordinates
      const currentWindow = manualWindow !== null ? manualWindow : (follow ? Math.floor((playheadStep * logicalToDisplayScale) / visibleColumns) : 0);
      const windowOffset = currentWindow * visibleColumns;
      
      // Dispatch window info for external components
      // Total windows should be calculated in display coordinates
      const totalDisplayColumns = logicalColumns * logicalToDisplayScale;
      const totalWindows = Math.ceil(totalDisplayColumns / visibleColumns);
      dispatch('windowinfo', { currentWindow, totalWindows });

      // Draw grid lines (vertical only, with different intensities for bars and quarter-bars)
      ctx.save();
      ctx.lineWidth = 1;
      
      // Calculate quarter-bar step size in logical steps
      const stepsPerQuarterBar = Math.max(1, Math.floor(stepsPerBarSafe / 4));
      
      // Determine if we're in a "zoomed" view (showing more than default 1/16 resolution)
      const isZoomed = zoom && zoom > stepsPerBarSafe;
      
      for (let col = 0; col < visibleColumns; col++) {
        // Map displayed column back to logical step using inverse scale
        // Display column → logical step
        const displayCol = windowOffset + col;
        const logicalStep = displayCol / logicalToDisplayScale;
        
        // Check if this logical step aligns with bar or quarter-bar boundaries
        const isBarBoundary = Math.abs(logicalStep % stepsPerBarSafe) < BOUNDARY_TOLERANCE;
        const isQuarterBarBoundary = Math.abs(logicalStep % stepsPerQuarterBar) < BOUNDARY_TOLERANCE;
        
        // In zoomed mode, draw sub-beat ticks for all columns
        // In normal mode, only draw lines at quarter-bar increments or bar boundaries
        const shouldDraw = isZoomed || isQuarterBarBoundary || isBarBoundary;
        
        if (!shouldDraw) continue;
        
        const x = col * cellSize + 0.5;
        
        // Use different opacity/color for bar boundaries vs quarter-bar boundaries vs sub-beats
        if (isBarBoundary) {
          ctx.strokeStyle = hexToRgba(trackColor, 0.75); // Increased for better visibility
        } else if (isQuarterBarBoundary) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'; // Increased for better visibility
        } else if (isZoomed) {
          ctx.strokeStyle = hexToRgba(trackColor, 0.18); // Increased for better visibility
        } else {
          continue; // Skip non-boundary lines in normal view
        }
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, layout.height);
        ctx.stroke();
      }
      
      // Draw closing line at right edge only if it aligns with a bar boundary
      // This prevents showing partial bars at the edge of the visible area
      // The main loop stops at visibleColumns-1 to avoid drawing the closing line unconditionally
      const rightEdgeDisplayCol = windowOffset + visibleColumns;
      const rightEdgeLogicalStep = rightEdgeDisplayCol / logicalToDisplayScale;
      const isRightEdgeBarBoundary = Math.abs(rightEdgeLogicalStep % stepsPerBarSafe) < BOUNDARY_TOLERANCE;
      
      if (isRightEdgeBarBoundary) {
        const x = visibleColumns * cellSize + 0.5;
        ctx.strokeStyle = hexToRgba(trackColor, 0.75);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, layout.height);
        ctx.stroke();
      }
      
      ctx.restore();

      // Draw notes as events (dots with duration bars)
      ctx.save();
      
      // Extract note events from boolean matrix
      const noteEvents = extractNoteEvents(notes, rows);
      
      // Draw each note event
      for (const event of noteEvents) {
        const { row, start, length } = event;
        
        // Convert storage coordinates to logical coordinates
        const logicalStartCol = (start * logicalColumns) / storageColumns;
        const logicalEndCol = ((start + length) * logicalColumns) / storageColumns;
        
        // Convert logical coordinates to display coordinates using scale factor
        const displayStartCol = logicalStartCol * logicalToDisplayScale;
        const displayEndCol = logicalEndCol * logicalToDisplayScale;
        
        // Skip if note is outside current window (window is in display coordinates)
        if (displayStartCol >= windowOffset + visibleColumns || displayEndCol <= windowOffset) continue;
        
        // Adjust display position relative to window
        const windowDisplayStartCol = displayStartCol - windowOffset;
        const windowDisplayEndCol = displayEndCol - windowOffset;
        
        // Skip if note is completely outside visible area
        if (windowDisplayStartCol >= visibleColumns || windowDisplayEndCol <= 0) continue;
        
        // Draw note start dot
        const startX = windowDisplayStartCol * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;
        const radius = cellSize * 0.15;
        
        ctx.shadowColor = hexToRgba(trackColor, 0.7);
        ctx.shadowBlur = cellSize * 0.5;
        ctx.fillStyle = hexToRgba(trackColor, 0.9);
        ctx.beginPath();
        ctx.arc(startX, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = hexToRgba(trackColor, 0.45);
        ctx.arc(startX, cy, radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw duration bar if note spans multiple cells
        const displayLength = windowDisplayEndCol - windowDisplayStartCol;
        if (displayLength > 1) {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          
          const barY = cy;
          const barHeight = cellSize * 0.15;
          const barStartX = startX + radius;
          const barEndX = (windowDisplayEndCol * cellSize) - cellSize / 2;
          const barWidth = Math.max(0, barEndX - barStartX);
          
          if (barWidth > 0) {
            // Draw duration bar
            ctx.fillStyle = hexToRgba(trackColor, 0.5);
            ctx.fillRect(barStartX, barY - barHeight / 2, barWidth, barHeight);
            
            // Draw end cap
            ctx.fillStyle = hexToRgba(trackColor, 0.7);
            ctx.beginPath();
            ctx.arc(barEndX, barY, barHeight / 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      // Draw inactive note placeholders
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < visibleColumns; col++) {
          // Map displayed column (in current window) back to logical step
          // Each display column represents (stepsPerBarSafe / zoom) logical steps
          const logicalStartStep = (windowOffset + col) / logicalToDisplayScale;
          const logicalEndStep = (windowOffset + col + 1) / logicalToDisplayScale;
          
          // Map logical steps to storage indices
          const storageStart = Math.floor((logicalStartStep * storageColumns) / logicalColumns);
          const storageEnd = Math.ceil((logicalEndStep * storageColumns) / logicalColumns);
          
          // Check if ANY cell in the storage range is active
          const rowNotes = notes?.[row] ?? [];
          const isActive = rowNotes.slice(storageStart, storageEnd).some(Boolean);
          
          if (!isActive) {
            const cx = col * cellSize + cellSize / 2;
            const cy = row * cellSize + cellSize / 2;
            const radius = cellSize * 0.15;
            
            // Draw hollow circle (stroke only)
            ctx.strokeStyle = styles.inactive;
            ctx.lineWidth = cellSize * 0.06; // Stroke width proportional to cell size
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // Draw keyboard focus indicator
      if (keyboardMode) {
        ctx.save();
        ctx.strokeStyle = hexToRgba(trackColor, 0.9);
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        const focusX = focusedCol * cellSize;
        const focusY = focusedRow * cellSize;
        ctx.strokeRect(focusX + 2, focusY + 2, cellSize - 4, cellSize - 4);
        ctx.restore();
      }

  // Playhead (show within current window)
  // Calculate playhead position relative to current window
  // Convert playhead logical step to display coordinates
  const playheadDisplayStep = playheadStep * logicalToDisplayScale;
  const playheadStepInWindow = playheadDisplayStep - windowOffset;
  const playheadX = (playheadStepInWindow + playheadProgress * logicalToDisplayScale) * layout.cellSize;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const glowIntensity = isPlaying 
        ? (prefersReducedMotion ? 0.3 : 0.3 + Math.sin(Date.now() * 0.003) * 0.1)
        : 0.2;
      const glowWidth = layout.cellSize * (isPlaying ? 2.5 : 1.5);
      const playheadGlow = ctx.createLinearGradient(playheadX - glowWidth, 0, playheadX + glowWidth, 0);
      playheadGlow.addColorStop(0, 'transparent');
      playheadGlow.addColorStop(0.5, hexToRgba(trackColor, glowIntensity));
      playheadGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = playheadGlow;
      ctx.fillRect(playheadX - glowWidth, 0, glowWidth * 2, layout.height);
      ctx.strokeStyle = styles.playhead;
      ctx.lineWidth = isPlaying ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, layout.height);
      ctx.stroke();
      if (isPlaying) {
        ctx.shadowColor = hexToRgba(trackColor, 0.5);
        ctx.shadowBlur = 8;
        ctx.strokeStyle = hexToRgba(trackColor, 0.8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, layout.height);
        ctx.stroke();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
    };

  const handlePointerDown = (event) => {
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    // Check if shift or alt key is held for explicit erase mode
    eraseMode = event.shiftKey || event.altKey;
    // Check if ctrl/cmd key is held for note extension mode
    extendMode = event.ctrlKey || event.metaKey;
    pointerActive = false; // Reset to allow paintValue determination
    paintedCells = new Set(); // Clear painted cells for new gesture
    paintedRanges = new Map(); // Clear painted ranges for new gesture
    handlePointer(event);
  };

  const handlePointer = (event) => {
    if (!canvas || !scroller) return;
    const rect = canvas.getBoundingClientRect();
    // No horizontal scroll in static grid mode
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / layout.cellSize);
    const row = Math.floor(y / layout.cellSize);
    
    const sourceColumns = Math.max(columns || 16, 1);
    const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
    // Use zoomLevel for grid density calculation
    const zoom = Number(zoomLevel) || 16;
    // Visible columns is determined by layout width, not zoom level
    const visibleColumns = Math.floor(layout.width / layout.cellSize);
    if (row < 0 || row >= rows || col < 0 || col >= visibleColumns) return;

    // Calculate scale factor for mapping logical steps to display columns
    const logicalToDisplayScale = zoom / stepsPerBarSafe;

    // Calculate window offset - use manual window if set, otherwise follow playhead only if follow mode is enabled
    const currentWindow = manualWindow !== null ? manualWindow : (follow ? Math.floor((playheadStep * logicalToDisplayScale) / visibleColumns) : 0);
    const windowOffset = currentWindow * visibleColumns;
    
    // Map window column to logical column using inverse scale
    // Display column → logical step
    const displayCol = windowOffset + col;
    const logicalCol = displayCol / logicalToDisplayScale;
    if (logicalCol >= sourceColumns) return;

    // Calculate storage position directly from display column to support fine-grained placement
    // When zoom > stepsPerBar, we have finer resolution than logical grid
    // Map display column directly to storage resolution to preserve precision
    const storagePerLogical = BASE_RESOLUTION / Math.max(1, stepsPerBarSafe);
    const storagePerDisplay = BASE_RESOLUTION / Math.max(1, zoom);
    const storageStart = Math.max(0, Math.floor(displayCol * storagePerDisplay));

    // Calculate note length based on noteLengthDenominator (e.g., 16 for 1/16, 32 for 1/32)
    // This determines the duration of placed notes, independent of zoom level
    const noteDenom = Number(noteLengthDenominator) || stepsPerBarSafe;
    const fullNoteStorageLength = Math.max(1, Math.round((BASE_RESOLUTION / noteDenom)));
    // Use full note length - no reduction. Notes should span their full duration.
    const noteStorageLength = fullNoteStorageLength;

    // Calculate full cell width for detection purposes based on current zoom level
    // This ensures we detect notes at the correct resolution for the current grid density
    const fullStorageLength = Math.max(1, Math.round(storagePerDisplay));

    // Determine current state at the underlying storage slice we're about to modify
    const sliceStart = storageStart;
    const sliceEnd = storageStart + fullStorageLength;
    const currentSlice = (notes?.[row] ?? []).slice(sliceStart, sliceEnd);
    // Use some(Boolean) instead of every(Boolean) to detect if ANY part has notes
    // This fixes erasing when notes were placed at different resolutions
    const current = currentSlice.length > 0 && currentSlice.some(Boolean);

    // Determine the value to paint for this specific cell and the storage length to use
    let cellPaintValue;
    let storageLength;

    if (!pointerActive) {
      // First cell in the gesture - determine action based on cell's current state
      pointerActive = true;

      if (eraseMode) {
        // Shift/Alt: always erase full cell width
        paintValue = false;
        cellPaintValue = false;
        storageLength = fullStorageLength;
      } else if (extendMode) {
        // Ctrl/Cmd: extend mode - determine value from first cell and apply to all
        paintValue = !current;
        cellPaintValue = paintValue;
        storageLength = fullStorageLength; // Use full width to create continuous notes
      } else {
        // Unified draw mode: toggle based on current cell state
        // First click determines the action (add or remove)
        paintValue = !current;
        cellPaintValue = paintValue;
        // Add articulation gap to prevent adjacent notes from merging
        // Reduce by 1 storage step when placing notes (paintValue=true) to create separation
        // Use full length when erasing (paintValue=false) to fully clear notes
        storageLength = paintValue && noteStorageLength > 1 
          ? noteStorageLength - 1  // Gap for articulation
          : noteStorageLength;      // Full length for erasing
      }
    } else {
      // Subsequent cells during drag - apply the same action consistently
      if (extendMode || eraseMode) {
        // In extend or erase mode: use the initially determined paintValue and full width
        cellPaintValue = paintValue;
        storageLength = fullStorageLength;
      } else {
        // Unified draw mode: apply the same action (paintValue) to all dragged cells
        cellPaintValue = paintValue;
        // Apply the same gap logic as the first cell
        storageLength = paintValue && noteStorageLength > 1
          ? noteStorageLength - 1  // Gap for articulation
          : noteStorageLength;      // Full length for erasing
      }
    }

    const key = `${row}:${storageStart}`;
    // Allow the same cell to be painted again if this is a fresh pointer down (consecutive clicks)
    // but prevent repainting during the same drag gesture
    if (paintedCells.has(key) && pointerActive) return;
    
    // Check if this position would overlap with any previously painted note on this row
    // This prevents placing notes too close together during drag operations
    if (cellPaintValue && pointerActive) {
      const rowRanges = paintedRanges.get(row) || [];
      const noteEnd = storageStart + storageLength;
      
      // For articulation: reserve one extra storage step after the note as a gap
      // This ensures adjacent notes don't merge, even for 1/64th notes
      // The gap is visual only - it's not painted, just reserved in the range tracking
      const reservedEnd = noteEnd + ARTICULATION_GAP;
      
      // Check if the new note would overlap with any existing painted range
      const overlaps = rowRanges.some(range => {
        // Two ranges overlap if: start1 < end2 && start2 < end1
        return storageStart < range.end && reservedEnd > range.start;
      });
      
      if (overlaps) {
        return; // Skip this note - it would overlap with a previously placed note
      }
      
      // Add this range (including gap) to the painted ranges for this row
      rowRanges.push({ start: storageStart, end: reservedEnd });
      paintedRanges.set(row, rowRanges);
    }
    
    paintedCells.add(key);

    // Dispatch notechange using storage indices: { row, start, length, value, storage: true }
    // The `storage: true` flag helps consumers know start/length are high-resolution indices.
    dispatch('notechange', { row, start: storageStart, length: storageLength, value: cellPaintValue, storage: true });
  };

  const handlePointerMove = (event) => {
    // Allow dragging in all modes: normal draw, extend, and erase
    // In normal draw mode, each cell gets a note of the selected length
    // In extend mode (Ctrl/Cmd), notes are extended to fill cells
    // In erase mode (Shift/Alt), notes are erased
    if (!pointerActive) return;
    handlePointer(event);
  };

  const releasePointer = (event) => {
    if (canvas) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (e) {
        // Ignore if capture was not set.
      }
    }
    pointerActive = false;
    paintedCells = new Set();
    paintedRanges = new Map(); // Clear painted ranges when gesture ends
    eraseMode = false; // Reset erase mode when pointer is released
    extendMode = false; // Reset extend mode when pointer is released
  };

  const handlePointerUp = (event) => {
    releasePointer(event);
  };

  const handlePointerCancel = (event) => {
    releasePointer(event);
  };

  // Keyboard navigation handlers
  const handleKeyDown = (event) => {
    if (!canvas || !scroller) return;
    
    // Allow spacebar to bubble up to global play/pause handler
    if (event.key === ' ') {
      return; // Don't handle spacebar here, let it bubble to App.svelte
    }
    
    const sourceColumns = Math.max(columns || 16, 1);
    const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
    // Use zoomLevel for grid density calculation
    const zoom = Number(zoomLevel) || 16;
    // Visible columns is determined by layout width, not zoom level
    const visibleColumns = Math.floor(layout.width / layout.cellSize);

    // Arrow keys for navigation
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      keyboardMode = true;
      focusedRow = Math.max(0, focusedRow - 1);
      draw();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      keyboardMode = true;
      focusedRow = Math.min(rows - 1, focusedRow + 1);
      draw();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      keyboardMode = true;
      focusedCol = Math.max(0, focusedCol - 1);
      // No scrolling in static grid mode
      draw();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      keyboardMode = true;
      focusedCol = Math.min(visibleColumns - 1, focusedCol + 1);
      // No scrolling in static grid mode
      draw();
    } else if (event.key === 'Enter') {
      // Enter to toggle note at focused cell
      event.preventDefault();
      keyboardMode = true;
      
      // Calculate scale factor for mapping logical steps to display columns
      const logicalToDisplayScale = zoom / stepsPerBarSafe;
      
      // Calculate window offset - use manual window if set, otherwise follow playhead only if follow mode is enabled
      const currentWindow = manualWindow !== null ? manualWindow : (follow ? Math.floor((playheadStep * logicalToDisplayScale) / visibleColumns) : 0);
      const windowOffset = currentWindow * visibleColumns;
      
      // Map display column directly to storage position for fine-grained placement
      const displayCol = windowOffset + focusedCol;
      const storagePerDisplay = BASE_RESOLUTION / Math.max(1, zoom);
      const storageStart = Math.floor(displayCol * storagePerDisplay);
      
      const storageColumns = Math.max(1, Math.floor(sourceColumns * (BASE_RESOLUTION / stepsPerBarSafe)));
      
      // Calculate note length based on noteLengthDenominator (for duration, independent of zoom)
      const noteDenom = Number(noteLengthDenominator) || stepsPerBarSafe;
      const fullNoteStorageLength = Math.max(1, Math.round((BASE_RESOLUTION / noteDenom)));
      // Use full note length - no reduction. Notes should span their full duration.
      const noteStorageLength = fullNoteStorageLength;
      const storageLength = noteStorageLength;
      
      // Calculate full cell width for detection purposes based on current zoom level
      const fullStorageLength = Math.max(1, Math.round(storagePerDisplay));
      
      // Get current state of the cell - use some() to detect ANY active notes
      const sliceStart = storageStart;
      const sliceEnd = storageStart + fullStorageLength;
      const currentSlice = (notes?.[focusedRow] ?? []).slice(sliceStart, sliceEnd);
      const current = currentSlice.length > 0 && currentSlice.some(Boolean);
      
      // Toggle the note
      dispatch('notechange', { 
        row: focusedRow, 
        start: storageStart, 
        length: storageLength, 
        value: !current, 
        storage: true 
      });
    }
  };

  const handleCanvasFocus = () => {
    // When canvas receives focus via tab, enable keyboard mode
    keyboardMode = true;
    draw();
  };

  const handleCanvasBlur = () => {
    // When canvas loses focus, disable keyboard mode
    keyboardMode = false;
    draw();
  };

  const handleCanvasClick = () => {
    // When clicked, disable keyboard mode (pointer takes over)
    keyboardMode = false;
  };

  onMount(() => {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    updateLayout();
    
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateLayout());
      if (scroller) resizeObserver.observe(scroller);
    }
    
    // Track modifier keys for erase and extend modes while hovering
    const handleKeyDownGlobal = (e) => {
      if (e.shiftKey || e.altKey) {
        eraseMode = true;
      }
      if (e.ctrlKey || e.metaKey) {
        extendMode = true;
      }
    };
    
    const handleKeyUpGlobal = (e) => {
      // Only disable erase mode if neither shift nor alt is held
      if (!e.shiftKey && !e.altKey) {
        eraseMode = false;
      }
      // Only disable extend mode if neither ctrl nor cmd is held
      if (!e.ctrlKey && !e.metaKey) {
        extendMode = false;
      }
    };
    
    const handleWindowResize = () => updateLayout();
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('keydown', handleKeyDownGlobal);
    window.addEventListener('keyup', handleKeyUpGlobal);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('keydown', handleKeyDownGlobal);
      window.removeEventListener('keyup', handleKeyUpGlobal);
    };
  });

  onDestroy(() => {
    if (resizeObserver && scroller) {
      resizeObserver.unobserve(scroller);
      resizeObserver.disconnect();
    }
    unsubscribeTheme?.();
  });

  $: drawTrigger = {
    notes,
    playheadStep,
    playheadProgress,
    trackColor,
    isPlaying,
    stepsPerBar,
    zoomLevel,
    columns,
    rows,
    currentTheme,
    manualWindow
  };

  $: if (canvas && scroller && columns && rows) {
    if (!ctx && canvas) {
      ctx = canvas.getContext('2d');
    }
    if (ctx) {
      updateLayout();
    }
  }

  $: if (ctx) {
    drawTrigger;
    draw();
  }

  // Scrolling disabled - using static grid with window switching
  // $: if (follow && isPlaying && scroller) {
  //   const sourceColumns = Math.max(columns || 16, 1);
  //   const stepsPerBarSafe = Math.max(stepsPerBar || 16, 1);
  //   const denom = Number(noteLengthDenominator) || null;
  //   const displayColumns = denom && Number.isFinite(denom) && denom > 0
  //     ? Math.max(1, Math.floor((sourceColumns * denom) / stepsPerBarSafe))
  //     : Math.max(1, Math.floor(sourceColumns / Math.max(1, Math.round(noteLengthSteps || 1))));
  //   const playheadX = ((playheadStep + playheadProgress) * (displayColumns / sourceColumns)) * layout.cellSize;
  //   const center = playheadX - scroller.clientWidth / 2;
  //   const target = Math.max(0, center);
  //   if (Math.abs(scroller.scrollLeft - target) > 2) {
  //     scroller.scrollTo({ left: target, behavior: 'smooth' });
  //   }
  // }
</script>

<div class="grid-container" data-component="Grid">
  <div class="note-labels" style={`height: ${layout.height || 256}px`}>
    {#if noteLabels.length === 0}
      <div class="note-label" style={`color: var(--color-text-muted); height: 32px;`}>
        Loading...
      </div>
    {/if}
    {#each noteLabels as label, index (index)}
      <div
        class="note-label"
        style={`color: ${hexToRgba(trackColor, 0.8)}; height: ${layout.cellSize}px;`}
      >
        {label}
      </div>
    {/each}
  </div>
  <div class="grid-wrapper" bind:this={scroller}>
    {#if !canvas}
      <div style="color: white; padding: 20px;">Grid initializing...</div>
    {/if}
    <canvas
      class="grid-canvas"
      bind:this={canvas}
      tabindex="0"
      role="grid"
      aria-label="Note grid - click to add/remove notes, hold Ctrl/Cmd and drag to extend notes, hold Shift or Alt and drag to erase, use arrow keys to navigate, Enter to toggle notes"
      style="cursor: {cursorStyle};"
      on:pointerdown={handlePointerDown}
      on:pointermove={handlePointerMove}
      on:pointerup={handlePointerUp}
      on:pointerleave={handlePointerCancel}
      on:pointercancel={handlePointerCancel}
      on:keydown={handleKeyDown}
      on:focus={handleCanvasFocus}
      on:blur={handleCanvasBlur}
      on:click={handleCanvasClick}
    ></canvas>
  </div>
</div>

<style>
  .grid-container {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 256px;
    gap: 8px;
  }

  .note-labels {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 0;
    min-width: 48px;
    background: var(--color-grid-bg);
    border-radius: 12px;
    border: 1px solid rgba(var(--color-text), 0.08);
    overflow: hidden;
  }

  .note-label {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-align: center;
    flex: 0 0 auto;
    min-height: 32px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .grid-wrapper {
    position: relative;
    flex: 1; /* Expand to fill available space */
    height: 100%;
    min-height: 256px;
    overflow-x: auto; /* Allow horizontal scrolling on mobile when needed */
    overflow-y: hidden;
    background: var(--color-panel);
    border-radius: 12px;
    border: 1px solid rgba(var(--color-text), 0.08);
    scrollbar-color: rgba(var(--color-accent-rgb), 0.4) rgba(0, 0, 0, 0.4);
    scrollbar-width: thin;
    display: flex;
    justify-content: center;
    align-items: center;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  }

  .grid-canvas {
    touch-action: none;
    display: block;
    /* Reset debug visuals */
    background: transparent;
    border: none;
    outline: none;
    /* Improve touch responsiveness */
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Remove min-width constraint on mobile to prevent overflow and touch input misalignment */
  @media (min-width: 768px) {
    .grid-canvas {
      min-width: 512px;
      min-height: 352px; /* Ensure 44px cells for 8 rows on desktop */
    }
  }

  .grid-canvas:focus-visible {
    outline: 3px solid rgba(var(--color-accent-rgb), 0.8);
    outline-offset: -3px;
    border-radius: 11px;
  }

  .grid-wrapper::-webkit-scrollbar {
    height: 10px;
  }

  .grid-wrapper::-webkit-scrollbar-track {
    background: rgba(12, 14, 20, 0.55);
    border-radius: 999px;
  }

  .grid-wrapper::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.65), rgba(var(--color-note-active-rgb), 0.55));
    border-radius: 999px;
    border: 2px solid rgba(12, 14, 20, 0.55);
  }

  .grid-wrapper::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.85), rgba(var(--color-note-active-rgb), 0.75));
  }
</style>
