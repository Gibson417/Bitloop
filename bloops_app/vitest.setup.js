import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

beforeAll(() => {
  if (!globalThis.window) {
    globalThis.window = globalThis;
  }

  if (!globalThis.requestAnimationFrame) {
    globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  }

  if (!globalThis.cancelAnimationFrame) {
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }

  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (!globalThis.AudioContext) {
    class MockAudioContext {
      constructor() {
        this.currentTime = 0;
      }
      resume = vi.fn(async () => {});
      createGain() {
        return {
          gain: { setValueAtTime: vi.fn() },
          connect: vi.fn()
        };
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        };
      }
      createBuffer() {
        return {
          getChannelData: () => new Float32Array(1)
        };
      }
      createBufferSource() {
        return {
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        };
      }
      close = vi.fn(async () => {});
      destination = {};
    }
    globalThis.AudioContext = MockAudioContext;
    globalThis.webkitAudioContext = MockAudioContext;
  }

  if (!HTMLCanvasElement.prototype.getContext) {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      strokeRect: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
      font: '',
      measureText: vi.fn(() => ({ width: 0 }))
    }));
  }
});

afterEach(() => {
  cleanup();
});
