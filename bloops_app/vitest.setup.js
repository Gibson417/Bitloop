import { afterEach, beforeAll, beforeEach, vi } from 'vitest';
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

  // Add PointerEvent polyfill for jsdom
  if (!globalThis.PointerEvent) {
    globalThis.PointerEvent = class PointerEvent extends MouseEvent {
      constructor(type, init = {}) {
        super(type, init);
        this.pointerId = init.pointerId || 0;
        this.width = init.width || 1;
        this.height = init.height || 1;
        this.pressure = init.pressure || 0;
        this.tangentialPressure = init.tangentialPressure || 0;
        this.tiltX = init.tiltX || 0;
        this.tiltY = init.tiltY || 0;
        this.twist = init.twist || 0;
        this.pointerType = init.pointerType || '';
        this.isPrimary = init.isPrimary || false;
      }
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
});

// Mock canvas context - done in beforeEach to override jsdom's implementation
beforeEach(() => {
  const mockGradient = {
    addColorStop: vi.fn()
  };
  
  const mockPattern = {};
  
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(contextType) {
    if (contextType === '2d') {
      if (!this._mockContext) {
        this._mockContext = {
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
          createLinearGradient: vi.fn(() => mockGradient),
          createRadialGradient: vi.fn(() => mockGradient),
          createPattern: vi.fn(() => mockPattern),
          save: vi.fn(),
          restore: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          translate: vi.fn(),
          transform: vi.fn(),
          setLineDash: vi.fn(),
          getLineDash: vi.fn(() => []),
          fillStyle: '',
          strokeStyle: '',
          lineWidth: 1,
          lineCap: 'butt',
          lineJoin: 'miter',
          miterLimit: 10,
          shadowColor: '',
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          font: '',
          textAlign: 'start',
          textBaseline: 'alphabetic',
          globalAlpha: 1,
          globalCompositeOperation: 'source-over',
          measureText: vi.fn(() => ({ width: 0 })),
          canvas: this
        };
      }
      return this._mockContext;
    }
    return originalGetContext?.call(this, contextType);
  };
});

afterEach(() => {
  cleanup();
});
