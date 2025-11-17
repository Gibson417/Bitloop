<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  const closeGuide = () => {
    dispatch('close');
  };
  
  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeGuide();
    }
  };
  
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      closeGuide();
    }
  };
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="guide-overlay" on:click={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="guide-title">
  <div class="guide-modal">
    <button 
      type="button" 
      class="close-btn" 
      on:click={closeGuide}
      aria-label="Close guide"
      title="Close guide (Esc)"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
    
    <div class="guide-header">
      <div class="guide-icon">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2 id="guide-title">Welcome to Bloops!</h2>
      <p class="guide-subtitle">A chiptune loop sequencer for creating retro-style music</p>
    </div>
    
    <div class="guide-content">
      <section class="guide-section">
        <h3>Getting Started</h3>
        <p>Bloops is a browser-based music sequencer inspired by classic chiptune trackers. Click on the grid to add notes, adjust track parameters, and create your own retro loops.</p>
      </section>
      
      <section class="guide-section">
        <h3>Key Shortcuts</h3>
        <div class="shortcuts-grid">
          <div class="shortcut-item">
            <kbd>Space</kbd>
            <span>Play / Pause</span>
          </div>
          <div class="shortcut-item">
            <kbd>Esc</kbd>
            <span>Close dialogs</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl/Cmd + Z</kbd>
            <span>Undo</span>
          </div>
          <div class="shortcut-item">
            <kbd>Ctrl/Cmd + Y</kbd>
            <span>Redo</span>
          </div>
        </div>
      </section>
      
      <section class="guide-section">
        <h3>Quick Tips</h3>
        <ul class="tips-list">
          <li>
            <svg class="tip-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Click on the grid to add or remove notes</span>
          </li>
          <li>
            <svg class="tip-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Use the track controls to adjust volume, waveform, and effects</span>
          </li>
          <li>
            <svg class="tip-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Save your sessions using the footer controls</span>
          </li>
          <li>
            <svg class="tip-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>Toggle "Follow" mode to keep the playhead visible while playing</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</div>

<style>
  .guide-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .guide-modal {
    position: relative;
    max-width: 640px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    background: linear-gradient(145deg, rgba(26, 29, 40, 0.98), rgba(18, 21, 30, 0.98));
    border: 1.5px solid rgba(var(--color-accent-rgb), 0.3);
    border-radius: 16px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(var(--color-accent-rgb), 0.1);
    animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
    color: var(--color-text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .close-btn:hover {
    background: rgba(255, 100, 100, 0.15);
    border-color: rgba(255, 100, 100, 0.4);
    color: var(--color-text);
    transform: scale(1.05);
  }

  .close-btn:focus-visible {
    outline: 2px solid rgba(var(--color-accent-rgb), 0.6);
    outline-offset: 2px;
  }

  .close-btn svg {
    width: 18px;
    height: 18px;
  }

  .guide-header {
    padding: 32px 32px 24px;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .guide-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    padding: 16px;
    border-radius: 16px;
    background: linear-gradient(145deg, rgba(var(--color-accent-rgb), 0.15), rgba(var(--color-accent-rgb), 0.08));
    border: 1.5px solid rgba(var(--color-accent-rgb), 0.3);
    color: rgba(var(--color-accent-rgb), 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .guide-icon svg {
    width: 32px;
    height: 32px;
  }

  .guide-header h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--color-text);
    margin: 0 0 8px;
    letter-spacing: -0.01em;
  }

  .guide-subtitle {
    font-size: 0.95rem;
    color: var(--color-text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .guide-content {
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .guide-section h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: rgba(var(--color-accent-rgb), 0.95);
    margin: 0 0 16px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .guide-section p {
    font-size: 0.95rem;
    line-height: 1.6;
    color: var(--color-text-muted);
    margin: 0;
  }

  .shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
  }

  kbd {
    display: inline-block;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    color: rgba(var(--color-accent-rgb), 0.95);
    background: rgba(var(--color-accent-rgb), 0.12);
    border: 1px solid rgba(var(--color-accent-rgb), 0.3);
    border-radius: 4px;
    white-space: nowrap;
  }

  .shortcut-item span {
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .tips-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .tips-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: rgba(var(--color-accent-rgb), 0.05);
    border-left: 3px solid rgba(var(--color-accent-rgb), 0.4);
    border-radius: 6px;
  }

  .tip-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: rgba(var(--color-accent-rgb), 0.8);
    margin-top: 2px;
  }

  .tips-list li span {
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  @media (max-width: 640px) {
    .guide-modal {
      max-height: 95vh;
      border-radius: 12px;
    }

    .guide-header {
      padding: 24px 24px 20px;
    }

    .guide-icon {
      width: 56px;
      height: 56px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .guide-icon svg {
      width: 28px;
      height: 28px;
    }

    .guide-header h2 {
      font-size: 1.5rem;
    }

    .guide-subtitle {
      font-size: 0.9rem;
    }

    .guide-content {
      padding: 24px;
      gap: 24px;
    }

    .shortcuts-grid {
      grid-template-columns: 1fr;
    }

    .close-btn {
      top: 16px;
      right: 16px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .guide-overlay,
    .guide-modal {
      animation: none;
    }
  }
</style>
