import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SettingsMenu from '../SettingsMenu.svelte';

describe('SettingsMenu component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Mock window.location.reload
    delete window.location;
    window.location = { reload: vi.fn() };
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
  });

  it('opens menu when toggle is clicked', async () => {
    const { getByLabelText, getByText } = render(SettingsMenu);

    await fireEvent.click(getByLabelText('Settings'));

    expect(getByText('Theme')).toBeTruthy();
  });

  it('renders theme selector inside the menu', async () => {
    const { getByLabelText, getByText } = render(SettingsMenu);

    await fireEvent.click(getByLabelText('Settings'));

    // Check that the theme selector's label is visible
    expect(getByText('Theme')).toBeTruthy();
    // Check for navigation buttons
    expect(getByLabelText('Select previous Theme')).toBeTruthy();
    expect(getByLabelText('Select next Theme')).toBeTruthy();
  });

  it('toggles menu visibility when button is clicked', async () => {
    const { getByLabelText, queryByText } = render(SettingsMenu);

    // Initially menu should be closed
    expect(queryByText('Theme')).toBeFalsy();

    // Open the menu
    await fireEvent.click(getByLabelText('Settings'));
    expect(queryByText('Theme')).toBeTruthy();

    // Close the menu
    await fireEvent.click(getByLabelText('Settings'));
    expect(queryByText('Theme')).toBeFalsy();
  });

  it('renders Developer Mode section in the menu', async () => {
    const { getByLabelText, getByText } = render(SettingsMenu);

    await fireEvent.click(getByLabelText('Settings'));

    // Check that Developer Mode toggle is visible
    expect(getByText(/Developer Mode/i)).toBeTruthy();
  });

  it('renders Reset App button in the menu', async () => {
    const { getByLabelText } = render(SettingsMenu);

    await fireEvent.click(getByLabelText('Settings'));

    // Check that Reset App button is visible by its aria-label
    expect(getByLabelText('Reset App')).toBeTruthy();
  });

  it('toggles dev mode when Dev Mode button is clicked', async () => {
    const { getByLabelText } = render(SettingsMenu);

    await fireEvent.click(getByLabelText('Settings'));
    
    // Find the button by its aria-label (initial state is OFF)
    const devModeBtn = getByLabelText('Toggle Dev Mode ON');
    
    // Initially should be off (false or null)
    const initialValue = localStorage.getItem('bloops-dev-mode');
    expect(initialValue === null || initialValue === 'false').toBe(true);
    
    // Click to toggle on
    await fireEvent.click(devModeBtn);
    expect(localStorage.getItem('bloops-dev-mode')).toBe('true');
    
    // Click to toggle off - after toggle, aria-label changes
    const devModeBtnOn = getByLabelText('Toggle Dev Mode OFF');
    await fireEvent.click(devModeBtnOn);
    expect(localStorage.getItem('bloops-dev-mode')).toBe('false');
  });

  it('clears localStorage and reloads when Reset App is clicked', async () => {
    const { getByLabelText } = render(SettingsMenu);
    
    // Set some localStorage data
    localStorage.setItem('test-key', 'test-value');
    localStorage.setItem('bloops-project', '{}');

    await fireEvent.click(getByLabelText('Settings'));
    
    const resetBtn = getByLabelText('Reset App');
    await fireEvent.click(resetBtn);
    
    // Check that confirm was called
    expect(window.confirm).toHaveBeenCalled();
    
    // Check that localStorage was cleared
    expect(localStorage.getItem('test-key')).toBeNull();
    expect(localStorage.getItem('bloops-project')).toBeNull();
    
    // Check that page reload was called
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('does not clear localStorage when Reset App is cancelled', async () => {
    const { getByLabelText } = render(SettingsMenu);
    
    // Mock confirm to return false (user cancelled)
    window.confirm = vi.fn(() => false);
    
    // Set some localStorage data
    localStorage.setItem('test-key', 'test-value');

    await fireEvent.click(getByLabelText('Settings'));
    
    const resetBtn = getByLabelText('Reset App');
    await fireEvent.click(resetBtn);
    
    // Check that confirm was called
    expect(window.confirm).toHaveBeenCalled();
    
    // Check that localStorage was NOT cleared
    expect(localStorage.getItem('test-key')).toBe('test-value');
    
    // Check that page reload was NOT called
    expect(window.location.reload).not.toHaveBeenCalled();
  });
});
