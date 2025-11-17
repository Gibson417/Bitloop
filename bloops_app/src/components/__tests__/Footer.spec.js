import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import Footer from '../Footer.svelte';

describe('Footer component', () => {
  it('renders footer text', () => {
    const { getByText } = render(Footer);
    expect(getByText('Bloops - Dot grid sequencer')).toBeTruthy();
  });

  it('has correct structure', () => {
    const { container } = render(Footer);
    const footer = container.querySelector('footer.footer');
    expect(footer).toBeTruthy();
    expect(footer.getAttribute('data-component')).toBe('Footer');
  });
});
