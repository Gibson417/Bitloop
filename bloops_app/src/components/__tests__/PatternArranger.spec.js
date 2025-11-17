import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import PatternArranger from '../PatternArranger.svelte';

describe('PatternArranger component', () => {
  it('renders pattern management section', () => {
    const { getByText } = render(PatternArranger, {
      props: {
        patterns: [{ id: 'p1', name: 'Pattern 1', bars: 2 }],
        selectedPattern: 0
      }
    });

    expect(getByText('Patterns')).toBeTruthy();
    expect(getByText('Pattern Arranger')).toBeTruthy();
  });

  it('renders pattern list', () => {
    const { getByDisplayValue } = render(PatternArranger, {
      props: {
        patterns: [
          { id: 'p1', name: 'Pattern 1', bars: 2 },
          { id: 'p2', name: 'Pattern 2', bars: 4 }
        ],
        selectedPattern: 0
      }
    });

    expect(getByDisplayValue('Pattern 1')).toBeTruthy();
    expect(getByDisplayValue('Pattern 2')).toBeTruthy();
  });

  it('emits patternadd when add pattern button is clicked', async () => {
    const patternAdd = vi.fn();
    const { component, container } = render(PatternArranger, {
      props: {
        patterns: [{ id: 'p1', name: 'Pattern 1', bars: 2 }],
        selectedPattern: 0
      }
    });

    component.$on('patternadd', patternAdd);
    
    const addButton = container.querySelector('.add-pattern-btn');
    await fireEvent.click(addButton);

    expect(patternAdd).toHaveBeenCalled();
  });

  it('emits patternselect when a pattern is clicked', async () => {
    const patternSelect = vi.fn();
    const { component, container } = render(PatternArranger, {
      props: {
        patterns: [
          { id: 'p1', name: 'Pattern 1', bars: 2 },
          { id: 'p2', name: 'Pattern 2', bars: 4 }
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

  it('shows selected pattern with visual indicator', () => {
    const { container } = render(PatternArranger, {
      props: {
        patterns: [
          { id: 'p1', name: 'Pattern 1', bars: 2 },
          { id: 'p2', name: 'Pattern 2', bars: 4 }
        ],
        selectedPattern: 1
      }
    });

    const patternItems = container.querySelectorAll('.pattern-item');
    expect(patternItems[0].classList.contains('selected')).toBe(false);
    expect(patternItems[1].classList.contains('selected')).toBe(true);
  });

  it('has add to lane button for each pattern', () => {
    const { container } = render(PatternArranger, {
      props: {
        patterns: [
          { id: 'p1', name: 'Pattern 1', bars: 2 }
        ],
        selectedPattern: 0
      }
    });

    const paletteActions = container.querySelectorAll('.palette-action');
    expect(paletteActions.length).toBeGreaterThan(0);
  });
});
