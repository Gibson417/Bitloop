import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import App from '../App.svelte';

describe('Zoom Level and Note Length Synchronization', () => {
  beforeEach(() => {
    // Mock localStorage
    const mockStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        for (const key in mockStorage) {
          delete mockStorage[key];
        }
      })
    };

    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    // Mock AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => ({
      createGain: vi.fn(() => ({
        gain: { setValueAtTime: vi.fn(), value: 1 },
        connect: vi.fn()
      })),
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: vi.fn(), value: 440 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass',
        frequency: { setValueAtTime: vi.fn(), value: 1000 },
        Q: { setValueAtTime: vi.fn(), value: 1 },
        connect: vi.fn()
      })),
      createDelay: vi.fn(() => ({
        delayTime: { setValueAtTime: vi.fn(), value: 0 },
        connect: vi.fn()
      })),
      createConvolver: vi.fn(() => ({
        buffer: null,
        connect: vi.fn()
      })),
      createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn()
      })),
      createBuffer: vi.fn(() => ({})),
      destination: {},
      currentTime: 0,
      resume: vi.fn().mockResolvedValue(undefined),
      state: 'running'
    }));
  });

  it('should automatically update note length when zoom level changes', async () => {
    const { container } = render(App);
    
    // Wait for the component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Find the note length selector - it should initially be at 8 (1/8 note) by default
    const noteLengthDisplay = container.querySelector('.note-length-group .selector-value');
    expect(noteLengthDisplay).toBeTruthy();
    
    // Initial note length should be 8 (1/8)
    const initialNoteLength = noteLengthDisplay?.textContent;
    expect(initialNoteLength).toBe('1/8');
    
    // Find the zoom level display - it should initially be at 16 by default
    const zoomDisplay = container.querySelector('.zoom-level');
    expect(zoomDisplay).toBeTruthy();
    expect(zoomDisplay?.textContent).toBe('16');
    
    // Find the zoom out button (−) and click it to change zoom from 16 to 8
    const zoomOutButton = container.querySelector('button[aria-label="Zoom out"]');
    expect(zoomOutButton).toBeTruthy();
    
    // Click the zoom out button
    zoomOutButton?.click();
    
    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    // After clicking zoom out, zoom should be 8
    expect(zoomDisplay?.textContent).toBe('8');
    
    // Note length should also update to 8 (1/8) to match the zoom level
    expect(noteLengthDisplay?.textContent).toBe('1/8');
  });

  it('should update note length when zooming in', async () => {
    const { container } = render(App);
    
    // Wait for the component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Find the zoom level display
    const zoomDisplay = container.querySelector('.zoom-level');
    expect(zoomDisplay).toBeTruthy();
    
    // Initial zoom should be 16
    expect(zoomDisplay?.textContent).toBe('16');
    
    // Find the note length display
    const noteLengthDisplay = container.querySelector('.note-length-group .selector-value');
    expect(noteLengthDisplay).toBeTruthy();
    
    // Find the zoom in button (+) and click it to change zoom from 16 to 32
    const zoomInButton = container.querySelector('button[aria-label="Zoom in"]');
    expect(zoomInButton).toBeTruthy();
    
    // Click the zoom in button
    zoomInButton?.click();
    
    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    // After clicking zoom in, zoom should be 32
    expect(zoomDisplay?.textContent).toBe('32');
    
    // Note length should also update to 32 (1/32) to match the zoom level
    expect(noteLengthDisplay?.textContent).toBe('1/32');
  });

  it('should maintain note length synchronization through multiple zoom changes', async () => {
    const { container } = render(App);
    
    // Wait for the component to mount
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const zoomDisplay = container.querySelector('.zoom-level');
    const noteLengthDisplay = container.querySelector('.note-length-group .selector-value');
    const zoomInButton = container.querySelector('button[aria-label="Zoom in"]');
    const zoomOutButton = container.querySelector('button[aria-label="Zoom out"]');
    
    // Start at zoom 16, note length 1/8 (by default)
    expect(zoomDisplay?.textContent).toBe('16');
    
    // Zoom in to 32
    zoomInButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(zoomDisplay?.textContent).toBe('32');
    expect(noteLengthDisplay?.textContent).toBe('1/32');
    
    // Zoom in to 64
    zoomInButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(zoomDisplay?.textContent).toBe('64');
    expect(noteLengthDisplay?.textContent).toBe('1/64');
    
    // Zoom out to 32
    zoomOutButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(zoomDisplay?.textContent).toBe('32');
    expect(noteLengthDisplay?.textContent).toBe('1/32');
    
    // Zoom out to 16
    zoomOutButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(zoomDisplay?.textContent).toBe('16');
    expect(noteLengthDisplay?.textContent).toBe('1/16');
    
    // Zoom out to 8
    zoomOutButton?.click();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(zoomDisplay?.textContent).toBe('8');
    expect(noteLengthDisplay?.textContent).toBe('1/8');
  });
});
