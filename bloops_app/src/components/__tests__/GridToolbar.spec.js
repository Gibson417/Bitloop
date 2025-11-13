import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import GridToolbar from '../GridToolbar.svelte';

describe('GridToolbar', () => {
  it('renders all three drawing tools', () => {
    render(GridToolbar, { selectedTool: 'paint' });
    
    expect(screen.getByRole('button', { name: /single note/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /erase/i })).toBeInTheDocument();
  });

  it('shows the paint tool as active by default', () => {
    render(GridToolbar, { selectedTool: 'paint' });
    
    const paintBtn = screen.getByRole('button', { name: /paint/i });
    expect(paintBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the single note tool as active when selected', () => {
    render(GridToolbar, { selectedTool: 'single' });
    
    const singleBtn = screen.getByRole('button', { name: /single note/i });
    expect(singleBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the erase tool as active when selected', () => {
    render(GridToolbar, { selectedTool: 'erase' });
    
    const eraseBtn = screen.getByRole('button', { name: /erase/i });
    expect(eraseBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('dispatches toolchange event when single note tool is clicked', async () => {
    const user = userEvent.setup();
    const { component } = render(GridToolbar, { selectedTool: 'paint' });
    
    const handler = vi.fn();
    component.$on('toolchange', handler);
    
    const singleBtn = screen.getByRole('button', { name: /single note/i });
    await user.click(singleBtn);
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { tool: 'single' }
      })
    );
  });

  it('dispatches toolchange event when paint tool is clicked', async () => {
    const user = userEvent.setup();
    const { component } = render(GridToolbar, { selectedTool: 'single' });
    
    const handler = vi.fn();
    component.$on('toolchange', handler);
    
    const paintBtn = screen.getByRole('button', { name: /paint/i });
    await user.click(paintBtn);
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { tool: 'paint' }
      })
    );
  });

  it('dispatches toolchange event when erase tool is clicked', async () => {
    const user = userEvent.setup();
    const { component } = render(GridToolbar, { selectedTool: 'paint' });
    
    const handler = vi.fn();
    component.$on('toolchange', handler);
    
    const eraseBtn = screen.getByRole('button', { name: /erase/i });
    await user.click(eraseBtn);
    
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { tool: 'erase' }
      })
    );
  });

  it('applies custom track color to buttons', () => {
    const customColor = '#ff5500';
    render(GridToolbar, { selectedTool: 'paint', trackColor: customColor });
    
    const paintBtn = screen.getByRole('button', { name: /paint/i });
    // Browser converts hex to RGB, so check for the RGB equivalent
    expect(paintBtn).toHaveAttribute('style', expect.stringContaining('rgb(255, 85, 0)'));
  });
});
