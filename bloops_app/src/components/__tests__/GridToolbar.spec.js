import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import GridToolbar from '../GridToolbar.svelte';

describe('GridToolbar', () => {
  it('renders the unified Draw tool', () => {
    render(GridToolbar);
    
    expect(screen.getByRole('button', { name: /draw/i })).toBeInTheDocument();
  });

  it('renders undo and redo buttons', () => {
    render(GridToolbar, { canUndo: true, canRedo: true });
    
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  it('disables undo button when canUndo is false', () => {
    render(GridToolbar, { canUndo: false });
    
    const undoBtn = screen.getByRole('button', { name: /undo/i });
    expect(undoBtn).toBeDisabled();
  });

  it('disables redo button when canRedo is false', () => {
    render(GridToolbar, { canRedo: false });
    
    const redoBtn = screen.getByRole('button', { name: /redo/i });
    expect(redoBtn).toBeDisabled();
  });

  it('enables undo button when canUndo is true', () => {
    render(GridToolbar, { canUndo: true });
    
    const undoBtn = screen.getByRole('button', { name: /undo/i });
    expect(undoBtn).not.toBeDisabled();
  });

  it('enables redo button when canRedo is true', () => {
    render(GridToolbar, { canRedo: true });
    
    const redoBtn = screen.getByRole('button', { name: /redo/i });
    expect(redoBtn).not.toBeDisabled();
  });

  it('dispatches undo event when undo button is clicked', async () => {
    const user = userEvent.setup();
    const { component } = render(GridToolbar, { canUndo: true });
    
    const handler = vi.fn();
    component.$on('undo', handler);
    
    const undoBtn = screen.getByRole('button', { name: /undo/i });
    await user.click(undoBtn);
    
    expect(handler).toHaveBeenCalled();
  });

  it('dispatches redo event when redo button is clicked', async () => {
    const user = userEvent.setup();
    const { component } = render(GridToolbar, { canRedo: true });
    
    const handler = vi.fn();
    component.$on('redo', handler);
    
    const redoBtn = screen.getByRole('button', { name: /redo/i });
    await user.click(redoBtn);
    
    expect(handler).toHaveBeenCalled();
  });

  it('applies custom track color to Draw button', () => {
    const customColor = '#ff5500';
    render(GridToolbar, { trackColor: customColor });
    
    const drawBtn = screen.getByRole('button', { name: /draw/i });
    // Browser converts hex to RGB, so check for the RGB equivalent
    expect(drawBtn).toHaveAttribute('style', expect.stringContaining('rgb(255, 85, 0)'));
  });
});
