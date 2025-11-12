import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SettingsMenu from '../SettingsMenu.svelte';

describe('SettingsMenu component', () => {
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
});
