import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import Footer from '../Footer.svelte';

describe('Footer component', () => {
  it('renders export menu toggle button', () => {
    const { getByLabelText } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'idle',
        shareMessage: '',
        shareLink: ''
      }
    });

    const exportButton = getByLabelText('Share or Export');
    expect(exportButton).toBeTruthy();
  });

  it('opens export menu when toggle is clicked', async () => {
    const { getByLabelText, getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'idle',
        shareMessage: '',
        shareLink: ''
      }
    });

    const exportButton = getByLabelText('Share or Export');
    await fireEvent.click(exportButton);

    // Verify menu items are visible
    expect(getByText('Share loop')).toBeTruthy();
    expect(getByText('Render WAV')).toBeTruthy();
    expect(getByText('Render MIDI')).toBeTruthy();
    expect(getByText('Export JSON')).toBeTruthy();
    expect(getByText('Import JSON')).toBeTruthy();
  });

  it('emits share event when Share loop button is clicked', async () => {
    const { component, getByLabelText, getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'idle',
        shareMessage: '',
        shareLink: ''
      }
    });

    const shareEvent = vi.fn();
    component.$on('share', shareEvent);

    // Open the export menu
    const exportButton = getByLabelText('Share or Export');
    await fireEvent.click(exportButton);

    // Click the Share loop button
    const shareButton = getByText('Share loop');
    await fireEvent.click(shareButton);

    expect(shareEvent).toHaveBeenCalled();
  });

  it('displays share feedback when share status is copied', () => {
    const { getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'copied',
        shareMessage: 'Share link copied to clipboard',
        shareLink: 'https://example.com?share=abc123'
      }
    });

    expect(getByText('Share link copied to clipboard')).toBeTruthy();
  });

  it('displays share link input when share link is provided', () => {
    const testShareLink = 'https://example.com?share=abc123';
    const { container } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'copied',
        shareMessage: 'Share link copied to clipboard',
        shareLink: testShareLink
      }
    });

    const shareInput = container.querySelector('.share-link');
    expect(shareInput).toBeTruthy();
    expect(shareInput.value).toBe(testShareLink);
  });

  it('displays error feedback when share fails', () => {
    const { getByText, container } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'error',
        shareMessage: 'Unable to share right now. Please try again.',
        shareLink: ''
      }
    });

    expect(getByText('Unable to share right now. Please try again.')).toBeTruthy();
    const feedbackElement = container.querySelector('.share-feedback.error');
    expect(feedbackElement).toBeTruthy();
  });

  it('hides share feedback when status is idle', () => {
    const { container } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'idle',
        shareMessage: '',
        shareLink: ''
      }
    });

    const feedbackElement = container.querySelector('.share-feedback');
    expect(feedbackElement).toBeFalsy();
  });

  it('selects all text when share link input is focused', async () => {
    const testShareLink = 'https://example.com?share=abc123';
    const { container } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'copied',
        shareMessage: 'Share link copied to clipboard',
        shareLink: testShareLink
      }
    });

    const shareInput = container.querySelector('.share-link');
    expect(shareInput).toBeTruthy();

    // Mock select method
    shareInput.select = vi.fn();
    
    await fireEvent.focus(shareInput);
    expect(shareInput.select).toHaveBeenCalled();
  });

  it('emits render event for WAV export', async () => {
    const { component, getByLabelText, getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'idle',
        shareMessage: '',
        shareLink: ''
      }
    });

    const renderEvent = vi.fn();
    component.$on('render', renderEvent);

    const exportButton = getByLabelText('Share or Export');
    await fireEvent.click(exportButton);

    const renderButton = getByText('Render WAV');
    await fireEvent.click(renderButton);

    expect(renderEvent).toHaveBeenCalled();
  });

  it('emits rendermidi event for MIDI export', async () => {
    const { component, getByLabelText, getByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'idle',
        shareMessage: '',
        shareLink: ''
      }
    });

    const renderMidiEvent = vi.fn();
    component.$on('rendermidi', renderMidiEvent);

    const exportButton = getByLabelText('Share or Export');
    await fireEvent.click(exportButton);

    const renderMidiButton = getByText('Render MIDI');
    await fireEvent.click(renderMidiButton);

    expect(renderMidiEvent).toHaveBeenCalled();
  });

  it('closes export menu after clicking a menu item', async () => {
    const { getByLabelText, getByText, queryByText } = render(Footer, {
      props: {
        projects: [],
        currentId: null,
        shareStatus: 'idle',
        shareMessage: '',
        shareLink: ''
      }
    });

    const exportButton = getByLabelText('Share or Export');
    await fireEvent.click(exportButton);

    // Verify menu is open
    expect(getByText('Share loop')).toBeTruthy();

    // Click a menu item
    const shareButton = getByText('Share loop');
    await fireEvent.click(shareButton);

    // Menu should be closed now (items should not be visible)
    // Note: The menu items are conditionally rendered, so they won't exist in the DOM
    expect(queryByText('Share loop')).toBeFalsy();
  });
});
