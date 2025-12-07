import { writable } from 'svelte/store';

// Store to track which menu is currently open (if any)
// null = no menu open, otherwise contains the menu identifier
export const openMenu = writable(null);

// Function to open a specific menu (closes all others)
export function setOpenMenu(menuId) {
  openMenu.set(menuId);
}

// Function to close the currently open menu
export function closeAllMenus() {
  openMenu.set(null);
}
