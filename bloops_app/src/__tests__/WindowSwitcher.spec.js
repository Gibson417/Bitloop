import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import WindowSwitcher from '../components/WindowSwitcher.svelte';

describe('WindowSwitcher', () => {
  it('should render prev and next buttons', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 0,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const prevButton = screen.getByLabelText('Previous window');
    const nextButton = screen.getByLabelText('Next window');

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('should disable prev button on first window', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 0,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const prevButton = screen.getByLabelText('Previous window');
    expect(prevButton).toBeDisabled();
  });

  it('should disable next button on last window', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 3,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const nextButton = screen.getByLabelText('Next window');
    expect(nextButton).toBeDisabled();
  });

  it('should render correct number of window indicators', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 1,
        totalWindows: 5,
        trackColor: '#78D2B9'
      }
    });

    const indicators = screen.getAllByRole('tab');
    expect(indicators).toHaveLength(5);
  });

  it('should dispatch switch event when clicking next button', async () => {
    const user = userEvent.setup();
    const { component } = render(WindowSwitcher, {
      props: {
        currentWindow: 0,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const switchHandler = vi.fn();
    component.$on('switch', switchHandler);

    const nextButton = screen.getByLabelText('Next window');
    await user.click(nextButton);

    expect(switchHandler).toHaveBeenCalledTimes(1);
    expect(switchHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { window: 1 }
      })
    );
  });

  it('should dispatch switch event when clicking previous button', async () => {
    const user = userEvent.setup();
    const { component } = render(WindowSwitcher, {
      props: {
        currentWindow: 2,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const switchHandler = vi.fn();
    component.$on('switch', switchHandler);

    const prevButton = screen.getByLabelText('Previous window');
    await user.click(prevButton);

    expect(switchHandler).toHaveBeenCalledTimes(1);
    expect(switchHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { window: 1 }
      })
    );
  });

  it('should dispatch switch event when clicking window indicator', async () => {
    const user = userEvent.setup();
    const { component } = render(WindowSwitcher, {
      props: {
        currentWindow: 0,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const switchHandler = vi.fn();
    component.$on('switch', switchHandler);

    const indicators = screen.getAllByRole('tab');
    await user.click(indicators[2]); // Click third window

    expect(switchHandler).toHaveBeenCalledTimes(1);
    expect(switchHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { window: 2 }
      })
    );
  });

  it('should mark current window indicator as selected', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 2,
        totalWindows: 5,
        trackColor: '#78D2B9'
      }
    });

    const indicators = screen.getAllByRole('tab');
    expect(indicators[2]).toHaveAttribute('aria-selected', 'true');
    expect(indicators[0]).toHaveAttribute('aria-selected', 'false');
    expect(indicators[1]).toHaveAttribute('aria-selected', 'false');
    expect(indicators[3]).toHaveAttribute('aria-selected', 'false');
    expect(indicators[4]).toHaveAttribute('aria-selected', 'false');
  });

  it('should have proper ARIA labels', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 1,
        totalWindows: 3,
        trackColor: '#78D2B9'
      }
    });

    const navigation = screen.getByRole('navigation', { name: 'Grid window navigation' });
    const tablist = screen.getByRole('tablist', { name: 'Grid windows' });

    expect(navigation).toBeInTheDocument();
    expect(tablist).toBeInTheDocument();
  });

  it('should meet minimum touch target size (44x44px)', () => {
    const { container } = render(WindowSwitcher, {
      props: {
        currentWindow: 0,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const prevButton = screen.getByLabelText('Previous window');
    const nextButton = screen.getByLabelText('Next window');

    // Get computed styles
    const prevStyles = window.getComputedStyle(prevButton);
    const nextStyles = window.getComputedStyle(nextButton);

    // CSS specifies 44px x 44px for nav buttons
    expect(prevStyles.width).toBe('44px');
    expect(prevStyles.height).toBe('44px');
    expect(nextStyles.width).toBe('44px');
    expect(nextStyles.height).toBe('44px');
  });
});
