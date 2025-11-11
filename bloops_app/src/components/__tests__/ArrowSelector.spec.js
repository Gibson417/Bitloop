import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ArrowSelector from '../ArrowSelector.svelte';

describe('ArrowSelector component', () => {
  it('renders with label and displays current value', () => {
    const options = ['option1', 'option2', 'option3'];
    const { getByText } = render(ArrowSelector, {
      props: {
        id: 'test-selector',
        label: 'Test Label',
        options,
        value: 'option2'
      }
    });

    expect(getByText('Test Label')).toBeTruthy();
    expect(getByText('option2')).toBeTruthy();
  });

  it('emits change event when up arrow is clicked', async () => {
    const options = ['option1', 'option2', 'option3'];
    const { component, getByLabelText } = render(ArrowSelector, {
      props: {
        id: 'test-selector',
        label: 'Test',
        options,
        value: 'option2'
      }
    });

    const handleChange = vi.fn();
    component.$on('change', handleChange);

    await fireEvent.click(getByLabelText('Next Test'));
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 'option3' }
      })
    );
  });

  it('emits change event when down arrow is clicked', async () => {
    const options = ['option1', 'option2', 'option3'];
    const { component, getByLabelText } = render(ArrowSelector, {
      props: {
        id: 'test-selector',
        label: 'Test',
        options,
        value: 'option2'
      }
    });

    const handleChange = vi.fn();
    component.$on('change', handleChange);

    await fireEvent.click(getByLabelText('Previous Test'));
    
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 'option1' }
      })
    );
  });

  it('cycles to first option when up arrow clicked on last option', async () => {
    const options = ['option1', 'option2', 'option3'];
    const { component, getByLabelText } = render(ArrowSelector, {
      props: {
        id: 'test-selector',
        label: 'Test',
        options,
        value: 'option3'
      }
    });

    const handleChange = vi.fn();
    component.$on('change', handleChange);

    await fireEvent.click(getByLabelText('Next Test'));
    
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 'option1' }
      })
    );
  });

  it('cycles to last option when down arrow clicked on first option', async () => {
    const options = ['option1', 'option2', 'option3'];
    const { component, getByLabelText } = render(ArrowSelector, {
      props: {
        id: 'test-selector',
        label: 'Test',
        options,
        value: 'option1'
      }
    });

    const handleChange = vi.fn();
    component.$on('change', handleChange);

    await fireEvent.click(getByLabelText('Previous Test'));
    
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 'option3' }
      })
    );
  });

  it('handles object options with value and label', async () => {
    const options = [
      { value: 0, label: 'Zero' },
      { value: 1, label: 'One' },
      { value: 2, label: 'Two' }
    ];
    const { component, getByText, getByLabelText } = render(ArrowSelector, {
      props: {
        id: 'test-selector',
        label: 'Test',
        options,
        value: 1
      }
    });

    expect(getByText('One')).toBeTruthy();

    const handleChange = vi.fn();
    component.$on('change', handleChange);

    await fireEvent.click(getByLabelText('Next Test'));
    
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 2 }
      })
    );
  });

  it('supports custom value formatter', () => {
    const options = ['a', 'b', 'c'];
    const formatter = (val) => val.toUpperCase();
    const { getByText } = render(ArrowSelector, {
      props: {
        id: 'test-selector',
        label: 'Test',
        options,
        value: 'b',
        valueFormatter: formatter
      }
    });

    expect(getByText('B')).toBeTruthy();
  });
});
