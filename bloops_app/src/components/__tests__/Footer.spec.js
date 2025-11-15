import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer.svelte';

describe('Footer component', () => {
  it('renders patterns section', () => {
    const { getByText } = render(Footer, {
      props: {
        patterns: [{ id: 'p1', name: 'Pattern 1' }],
        selectedPattern: 0
      }
    });

    expect(getByText('Patterns')).toBeTruthy();
  });

  it('renders pattern list', () => {
    const { getByDisplayValue } = render(Footer, {
      props: {
        patterns: [
          { id: 'p1', name: 'Pattern 1' },
          { id: 'p2', name: 'Pattern 2' }
        ],
        selectedPattern: 0
      }
    });

    expect(getByDisplayValue('Pattern 1')).toBeTruthy();
    expect(getByDisplayValue('Pattern 2')).toBeTruthy();
  });

  it('emits patternadd when New Pattern is clicked', async () => {
    const patternAdd = vi.fn();
    const { component, getByText } = render(Footer, {
      props: {
        patterns: [{ id: 'p1', name: 'Pattern 1' }],
        selectedPattern: 0
      }
    });

    component.$on('patternadd', patternAdd);
    await fireEvent.click(getByText('New Pattern'));

    expect(patternAdd).toHaveBeenCalled();
  });

  it('emits patternselect when a pattern is clicked', async () => {
    const patternSelect = vi.fn();
    const { component, container } = render(Footer, {
      props: {
        patterns: [
          { id: 'p1', name: 'Pattern 1' },
          { id: 'p2', name: 'Pattern 2' }
        ],
        selectedPattern: 0
      }
    });

    component.$on('patternselect', patternSelect);
    
    const patternItems = container.querySelectorAll('.pattern-item');
    await fireEvent.click(patternItems[1]);

    expect(patternSelect).toHaveBeenCalledWith(expect.objectContaining({ 
      detail: { index: 1 } 
    }));
  });
});
