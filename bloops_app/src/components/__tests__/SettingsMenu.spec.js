import { render, fireEvent } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SettingsMenu from '../SettingsMenu.svelte';

describe('SettingsMenu component', () => {
  it('opens menu when gear button is clicked', async () => {
    const { getByLabelText, container } = render(SettingsMenu);

    await fireEvent.click(getByLabelText('Settings'));

    const dropdown = container.querySelector('.settings-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('renders ThemeSelector inside dropdown', async () => {
    const { getByLabelText, container } = render(SettingsMenu);

    await fireEvent.click(getByLabelText('Settings'));

    const themeSelector = container.querySelector('.theme-selector-wrapper');
    expect(themeSelector).toBeTruthy();
  });

  it('toggles open state when button is clicked multiple times', async () => {
    const { getByLabelText, container } = render(SettingsMenu);

    const button = getByLabelText('Settings');

    // Open
    await fireEvent.click(button);
    let dropdown = container.querySelector('.settings-dropdown');
    expect(dropdown).toBeTruthy();

    // Close
    await fireEvent.click(button);
    dropdown = container.querySelector('.settings-dropdown');
    expect(dropdown).toBeFalsy();

    // Open again
    await fireEvent.click(button);
    dropdown = container.querySelector('.settings-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('has proper accessibility attributes', () => {
    const { getByLabelText } = render(SettingsMenu);

    const button = getByLabelText('Settings');
    expect(button.getAttribute('aria-haspopup')).toBe('true');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('updates aria-expanded when menu opens', async () => {
    const { getByLabelText } = render(SettingsMenu);

    const button = getByLabelText('Settings');
    
    await fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });
});
