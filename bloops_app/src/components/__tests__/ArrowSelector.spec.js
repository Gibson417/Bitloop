import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ArrowSelector from '../ArrowSelector.svelte';

describe('ArrowSelector component', () => {
  describe('with string array options', () => {
    const stringOptions = ['Major', 'Minor', 'Dorian', 'Phrygian'];

    it('renders with initial value', () => {
      const { getByText } = render(ArrowSelector, {
        props: {
          options: stringOptions,
          value: 'Minor',
          label: 'Scale'
        }
      });

      expect(getByText('Scale')).toBeInTheDocument();
      expect(getByText('Minor')).toBeInTheDocument();
    });

    it('cycles to next option when right arrow is clicked', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: stringOptions,
          value: 'Minor',
          label: 'Scale'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const nextButton = getByLabelText('Select next Scale');
      await fireEvent.click(nextButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 'Dorian' } })
      );
    });

    it('cycles to previous option when left arrow is clicked', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: stringOptions,
          value: 'Minor',
          label: 'Scale'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const prevButton = getByLabelText('Select previous Scale');
      await fireEvent.click(prevButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 'Major' } })
      );
    });

    it('wraps to first option when clicking right on last option', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: stringOptions,
          value: 'Phrygian',
          label: 'Scale'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const nextButton = getByLabelText('Select next Scale');
      await fireEvent.click(nextButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 'Major' } })
      );
    });

    it('wraps to last option when clicking left on first option', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: stringOptions,
          value: 'Major',
          label: 'Scale'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const prevButton = getByLabelText('Select previous Scale');
      await fireEvent.click(prevButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 'Phrygian' } })
      );
    });
  });

  describe('with object array options', () => {
    const objectOptions = [
      { value: 0, label: 'C' },
      { value: 1, label: 'C♯/D♭' },
      { value: 2, label: 'D' },
      { value: 3, label: 'D♯/E♭' }
    ];

    it('renders with initial object value', () => {
      const { getByText } = render(ArrowSelector, {
        props: {
          options: objectOptions,
          value: 1,
          label: 'Root note'
        }
      });

      expect(getByText('Root note')).toBeInTheDocument();
      expect(getByText('C♯/D♭')).toBeInTheDocument();
    });

    it('cycles to next option when right arrow is clicked', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: objectOptions,
          value: 1,
          label: 'Root note'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const nextButton = getByLabelText('Select next Root note');
      await fireEvent.click(nextButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 2 } })
      );
    });

    it('cycles to previous option when left arrow is clicked', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: objectOptions,
          value: 2,
          label: 'Root note'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const prevButton = getByLabelText('Select previous Root note');
      await fireEvent.click(prevButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 1 } })
      );
    });

    it('wraps to first option when clicking right on last option', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: objectOptions,
          value: 3,
          label: 'Root note'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const nextButton = getByLabelText('Select next Root note');
      await fireEvent.click(nextButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 0 } })
      );
    });

    it('wraps to last option when clicking left on first option', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: objectOptions,
          value: 0,
          label: 'Root note'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const prevButton = getByLabelText('Select previous Root note');
      await fireEvent.click(prevButton);

      expect(changeFn).toHaveBeenCalledWith(
        expect.objectContaining({ detail: { value: 3 } })
      );
    });
  });

  describe('ARIA labels', () => {
    it('has proper ARIA labels for left and right buttons', () => {
      const { getByLabelText } = render(ArrowSelector, {
        props: {
          options: ['A', 'B', 'C'],
          value: 'A',
          label: 'Test'
        }
      });

      expect(getByLabelText('Select previous Test')).toBeInTheDocument();
      expect(getByLabelText('Select next Test')).toBeInTheDocument();
    });

    it('updates ARIA labels when label prop changes', () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: ['A', 'B', 'C'],
          value: 'A',
          label: 'First'
        }
      });

      component.$set({ label: 'Second' });

      expect(getByLabelText('Select previous Second')).toBeInTheDocument();
      expect(getByLabelText('Select next Second')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles empty options array gracefully', () => {
      const { container } = render(ArrowSelector, {
        props: {
          options: [],
          value: null,
          label: 'Empty'
        }
      });

      expect(container.querySelector('.arrow-selector')).toBeInTheDocument();
    });

    it('does not emit change event when options are empty', async () => {
      const { component, getByLabelText } = render(ArrowSelector, {
        props: {
          options: [],
          value: null,
          label: 'Empty'
        }
      });

      const changeFn = vi.fn();
      component.$on('change', changeFn);

      const nextButton = getByLabelText('Select next Empty');
      await fireEvent.click(nextButton);

      expect(changeFn).not.toHaveBeenCalled();
    });
  });
});
