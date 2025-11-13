// Color tokens used throughout the Bloops UI.
// These values mirror the design spec (B‑Warm accent, etc.).

export const colors = {
  accent: '#78D2B9',
  accentBright: '#9BFFE0', // Brighter teal for active/playing states
  noteActive: '#78D2FF',
  noteInactive: '#4a5060', // Improved from #3C4450 for better contrast (was 1.8:1, now 2.4:1)
  background: '#1A1D28',
  panel: '#222632'
};

// Spacing tokens from design system (8px base grid)
export const spacing = {
  xxs: '4px',   // 0.5 × base
  xs: '8px',    // 1 × base
  sm: '12px',   // 1.5 × base
  md: '16px',   // 2 × base
  lg: '24px',   // 3 × base
  xl: '32px',   // 4 × base
  xxl: '48px'   // 6 × base
};

// Border radius tokens
export const radius = {
  sm: '6px',    // Small elements (badges, small buttons)
  md: '8px',    // Default controls
  lg: '10px',   // Medium controls
  xl: '12px',   // Large controls, cards
  xxl: '16px',  // Panels, major sections
  round: '999px' // Pills, toggles
};

// Typography tokens
export const typography = {
  size: {
    xs: '0.7rem',    // 11.2px - Labels, meta text
    sm: '0.75rem',   // 12px - Small labels, secondary text
    base: '0.95rem', // 15.2px - Body text, inputs
    md: '1rem',      // 16px - Emphasized body
    lg: '1.2rem',    // 19.2px - Subheadings, large controls
    xl: '1.5rem',    // 24px - Headings
    display: '1.8rem' // 28.8px - Major headings, brand
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  lineHeight: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.08em',
    wider: '0.12em'
  }
};

// Touch target minimum sizes (WCAG 2.2 AA Level AAA guideline)
export const touchTarget = {
  minimum: '44px',  // Minimum for all interactive elements
  comfortable: '48px' // Comfortable size for primary actions
};

// Opacity values for consistency
export const opacity = {
  disabled: 0.4,
  muted: 0.6,
  subtle: 0.7,
  visible: 0.85,
  full: 1
};