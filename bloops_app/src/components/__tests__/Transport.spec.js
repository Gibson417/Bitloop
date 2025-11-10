import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Transport from '../Transport.svelte';

describe('Transport component', () => {
  it('emits toggle events', async () => {
    const { component, getByLabelText, getByText } = render(Transport, {
      props: { playing: false, follow: true }
    });

    const togglePlay = vi.fn();
    const toggleFollow = vi.fn();

    component.$on('toggleplay', togglePlay);
    component.$on('togglefollow', toggleFollow);

    await fireEvent.click(getByLabelText('Play'));
    expect(togglePlay).toHaveBeenCalled();

    await fireEvent.click(getByText('Follow'));
    expect(toggleFollow).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: false } }));
  });
});
