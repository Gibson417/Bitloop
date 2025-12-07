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

    await fireEvent.click(getByLabelText('Project Menu'));

    expect(getByText('Save Project')).toBeTruthy();
    expect(getByText('Load Project')).toBeTruthy();
  });

  it('emits export event when Save Project is selected', async () => {
    const { component, getByLabelText, getByText } = render(ShareMenu, { props: defaultProps });
    const exportEvent = vi.fn();
    component.$on('export', exportEvent);

    await fireEvent.click(getByLabelText('Project Menu'));
    await fireEvent.click(getByText('Save Project'));

    expect(exportEvent).toHaveBeenCalled();
  });

  it('displays feedback message and link when provided', () => {
    const { getByText } = render(ShareMenu, {
      props: {
        shareStatus: 'ready',
        shareMessage: 'Project exported successfully',
        shareLink: ''
      }
    });

    expect(getByText('Project exported successfully')).toBeTruthy();
  });
});
