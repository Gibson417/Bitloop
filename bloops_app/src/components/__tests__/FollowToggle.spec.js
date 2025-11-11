import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import FollowToggle from '../FollowToggle.svelte';

describe('FollowToggle component', () => {
  it('emits toggle event with new value when clicked', async () => {
    const { component, getByRole } = render(FollowToggle, {
      props: { active: true }
    });

    const toggle = vi.fn();
    component.$on('toggle', toggle);

    const button = getByRole('button', { name: 'Disable follow mode' });
    await fireEvent.click(button);

    expect(toggle).toHaveBeenCalledWith(expect.objectContaining({ detail: { value: false } }));
  });
});
