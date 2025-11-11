import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Transport from '../Transport.svelte';

describe('Transport component', () => {
  it('emits toggleplay when the play button is clicked', async () => {
    const { component, getByLabelText } = render(Transport, {
      props: { playing: false }
    });

    const togglePlay = vi.fn();
    component.$on('toggleplay', togglePlay);

    await fireEvent.click(getByLabelText('Play'));
    expect(togglePlay).toHaveBeenCalled();
  });
});
