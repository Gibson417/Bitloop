import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import TrackSelector from '../TrackSelector.svelte';

describe('TrackSelector ghost toggle', () => {
  const tracks = [
    {
      id: 1,
      name: 'Track 1',
      color: '#78D2B9',
      waveform: 'square',
      mute: false,
      solo: false,
      ghostVisible: false
    },
    {
      id: 2,
      name: 'Track 2',
      color: '#A88EF6',
      waveform: 'sine',
      mute: false,
      solo: false,
      ghostVisible: false
    }
  ];

  it('renders ghost toggle button for each track', () => {
    const { container } = render(TrackSelector, {
      props: {
        tracks,
        selected: 0,
        maxTracks: 10
      }
    });

    const ghostButtons = container.querySelectorAll('.toggle-btn.ghost');
    expect(ghostButtons.length).toBe(2);
  });

  it('dispatches toggleghost event when ghost button is clicked', async () => {
    const { container, component } = render(TrackSelector, {
      props: {
        tracks,
        selected: 0,
        maxTracks: 10
      }
    });

    const toggleghost = vi.fn();
    component.$on('toggleghost', toggleghost);

    const ghostButton = container.querySelector('.toggle-btn.ghost');
    await fireEvent.click(ghostButton);

    expect(toggleghost).toHaveBeenCalled();
    expect(toggleghost.mock.calls[0][0].detail.index).toBe(0);
  });

  it('shows active state when ghostVisible is true', () => {
    const tracksWithGhost = [
      { ...tracks[0], ghostVisible: true },
      tracks[1]
    ];

    const { container } = render(TrackSelector, {
      props: {
        tracks: tracksWithGhost,
        selected: 0,
        maxTracks: 10
      }
    });

    const ghostButtons = container.querySelectorAll('.toggle-btn.ghost');
    expect(ghostButtons[0].classList.contains('active')).toBe(true);
    expect(ghostButtons[1].classList.contains('active')).toBe(false);
  });

  it('has correct aria attributes', () => {
    const { container } = render(TrackSelector, {
      props: {
        tracks,
        selected: 0,
        maxTracks: 10
      }
    });

    const ghostButton = container.querySelector('.toggle-btn.ghost');
    expect(ghostButton.getAttribute('aria-pressed')).toBe('false');
    expect(ghostButton.getAttribute('aria-label')).toContain('Show ghost notes');
  });

  it('updates aria-label when ghostVisible changes', () => {
    const tracksWithGhost = [
      { ...tracks[0], ghostVisible: true },
      tracks[1]
    ];

    const { container } = render(TrackSelector, {
      props: {
        tracks: tracksWithGhost,
        selected: 0,
        maxTracks: 10
      }
    });

    const ghostButton = container.querySelector('.toggle-btn.ghost');
    expect(ghostButton.getAttribute('aria-pressed')).toBe('true');
    expect(ghostButton.getAttribute('aria-label')).toContain('Hide ghost notes');
  });
});
