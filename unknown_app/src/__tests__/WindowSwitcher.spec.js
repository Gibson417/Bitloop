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

  it('should disable both buttons with only one window', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 0,
        totalWindows: 1,
        trackColor: '#78D2B9'
      }
    });

    const prevButton = screen.getByLabelText('Previous window');
    const nextButton = screen.getByLabelText('Next window');
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('should display current window position', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 1,
        totalWindows: 5,
        trackColor: '#78D2B9'
      }
    });

    const windowNumber = screen.getByLabelText('Current window position');
    expect(windowNumber).toBeInTheDocument();
    expect(windowNumber).toHaveTextContent('2 / 5');
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

  it('should have proper ARIA labels', () => {
    render(WindowSwitcher, {
      props: {
        currentWindow: 1,
        totalWindows: 3,
        trackColor: '#78D2B9'
      }
    });

    const navigation = screen.getByRole('navigation', { name: 'Grid window navigation' });
    const windowNumber = screen.getByLabelText('Current window position');

    expect(navigation).toBeInTheDocument();
    expect(windowNumber).toBeInTheDocument();
  });

  it('should have fixed width layout', () => {
    const { container } = render(WindowSwitcher, {
      props: {
        currentWindow: 0,
        totalWindows: 4,
        trackColor: '#78D2B9'
      }
    });

    const windowSwitcher = container.querySelector('[data-component="WindowSwitcher"]');
    
    // Verify the component exists and has the fixed width class applied
    expect(windowSwitcher).toBeInTheDocument();
    expect(windowSwitcher).toHaveClass('window-switcher');
  });
});
