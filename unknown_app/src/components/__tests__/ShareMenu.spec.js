import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import ShareMenu from '../ShareMenu.svelte';

describe('ShareMenu component', () => {
  const defaultProps = {
    shareStatus: 'idle',
    shareMessage: '',
    shareLink: ''
  };

  it('opens menu when toggle is clicked', async () => {
    const { getByLabelText, getByText } = render(ShareMenu, { props: defaultProps });

    await fireEvent.click(getByLabelText('Share or Export'));

    expect(getByText('Share loop')).toBeTruthy();
    expect(getByText('Render WAV')).toBeTruthy();
  });

  it('emits share event when Share loop is selected', async () => {
    const { component, getByLabelText, getByText } = render(ShareMenu, { props: defaultProps });
    const share = vi.fn();
    component.$on('share', share);

    await fireEvent.click(getByLabelText('Share or Export'));
    await fireEvent.click(getByText('Share loop'));

    expect(share).toHaveBeenCalled();
  });

  it('displays feedback message and link when provided', () => {
    const testLink = 'https://example.com/loop';
    const { getByDisplayValue, getByText } = render(ShareMenu, {
      props: {
        shareStatus: 'copied',
        shareMessage: 'Share link copied',
        shareLink: testLink
      }
    });

    expect(getByText('Share link copied')).toBeTruthy();
    expect(getByDisplayValue(testLink)).toBeTruthy();
  });
});
