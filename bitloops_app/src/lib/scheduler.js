/**
 * Simple placeholder for the audio scheduler.
 *
 * The scheduler should implement a lookahead loop that queues events ahead
 * of the current playback time to ensure smooth playback. It should also
 * provide start/stop functions and expose a callback when each step begins.
 */

export class Scheduler {
  constructor(context, tempo = 120) {
    this.context = context;
    this.tempo = tempo;
    this.isPlaying = false;
    this.currentStep = 0;
    this.lookahead = 0.1; // seconds
    this.scheduleAhead = 0.2; // seconds
    this.timerID = null;
    this.onStep = () => {};
    this.nextStepTime = 0;
  }
  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.schedule();
  }
  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
  }
  schedule() {
    if (!this.isPlaying) return;
    const secondsPerBeat = 60 / this.tempo;
    const secondsPerStep = secondsPerBeat / 4; // default 16th note resolution
    const now = this.context.currentTime;
    while (this.nextStepTime < now + this.scheduleAhead) {
      this.onStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += secondsPerStep;
      this.currentStep++;
    }
    this.timerID = setTimeout(() => this.schedule(), this.lookahead * 1000);
  }
}