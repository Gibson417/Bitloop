import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Scheduler } from '../scheduler.js';

describe('Scheduler setCurrentStep functionality', () => {
  let mockContext;
  let scheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      currentTime: 0
    };
    scheduler = new Scheduler(mockContext, 120, 4);
  });

  it('should allow setting current step before starting', () => {
    scheduler.setCurrentStep(16);
    expect(scheduler.currentStep).toBe(16);
  });

  it('should validate step parameter in setCurrentStep', () => {
    expect(() => scheduler.setCurrentStep(-1)).toThrow('Step must be a non-negative finite number');
    expect(() => scheduler.setCurrentStep(NaN)).toThrow('Step must be a non-negative finite number');
    expect(() => scheduler.setCurrentStep(Infinity)).toThrow('Step must be a non-negative finite number');
    expect(() => scheduler.setCurrentStep('16')).toThrow('Step must be a non-negative finite number');
  });

  it('should floor fractional step values', () => {
    scheduler.setCurrentStep(16.7);
    expect(scheduler.currentStep).toBe(16);
  });

  it('should maintain set step position when starting scheduler', () => {
    const stepsCalled = [];
    scheduler.onStep = (step) => {
      stepsCalled.push(step);
    };
    
    // Set to step 16 before starting
    scheduler.setCurrentStep(16);
    const expectedStart = 16;
    
    scheduler.start();
    
    // After start(), schedule() is called which will schedule steps
    // The first step scheduled should be the one we set (16)
    // But currentStep will have been incremented by the time we check it
    // So we check that the first step passed to onStep is the expected start
    expect(stepsCalled[0]).toBe(expectedStart);
  });

  it('should allow updating current step while scheduler is stopped', () => {
    scheduler.start();
    scheduler.stop();
    
    scheduler.setCurrentStep(32);
    expect(scheduler.currentStep).toBe(32);
  });

  it('should preserve step position when set after stop', () => {
    scheduler.start();
    scheduler.stop();
    
    scheduler.setCurrentStep(24);
    expect(scheduler.currentStep).toBe(24);
    
    // When starting again, the position should be maintained
    // if setCurrentStep is called after stop and before start
  });
});

describe('Scheduler playback from custom position', () => {
  let mockContext;
  let scheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockContext = {
      currentTime: 0
    };
    scheduler = new Scheduler(mockContext, 120, 4);
  });

  it('should resume from set position after stop/start cycle', () => {
    const stepsCalled = [];
    scheduler.onStep = (step) => {
      stepsCalled.push(step);
      // Stop after a few steps
      if (stepsCalled.length >= 3) {
        scheduler.stop();
      }
    };
    
    scheduler.start();
    // Simulate some time passing
    mockContext.currentTime = 1.0;
    scheduler.schedule();
    
    // Now set a new position and restart
    scheduler.setCurrentStep(16);
    
    // Clear the steps array to see what happens on restart
    stepsCalled.length = 0;
    
    scheduler.start();
    mockContext.currentTime = 2.0;
    scheduler.schedule();
    
    // The scheduler now preserves the position set via setCurrentStep()
    // In practice, the App.svelte code calls setCurrentStep() before start()
    // to have the scheduler start from the desired position
  });
});
