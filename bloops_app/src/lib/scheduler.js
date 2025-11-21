/**
 * UNKNOWN WebAudio scheduler with lookahead.
 *
 * The scheduler queues playback steps slightly ahead of the audio clock to
 * ensure smooth playback. Consumers should provide an `onStep` callback which
 * receives `(stepIndex, stepStartTime, stepDuration)`.
 */
export class Scheduler {
  constructor(context, tempo = 120, stepsPerBeat = 4) {
    this.context = context;
    this.tempo = tempo;
    this.stepsPerBeat = stepsPerBeat;
    this.isPlaying = false;
    this.currentStep = 0;
    this.lookahead = 0.1; // seconds
    this.scheduleAhead = 0.2; // seconds
    this.timerID = null;
    this.onStep = () => {};
    this.nextStepTime = 0;
  }

  setTempo(tempo) {
    this.tempo = tempo;
  }

  setStepsPerBeat(stepsPerBeat) {
    this.stepsPerBeat = stepsPerBeat;
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.context.currentTime;
    this.schedule();
  }

  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
    this.timerID = null;
  }

  schedule() {
    if (!this.isPlaying) return;
    const secondsPerBeat = 60 / this.tempo;
    const secondsPerStep = secondsPerBeat / this.stepsPerBeat;
    const now = this.context.currentTime;

    while (this.nextStepTime < now + this.scheduleAhead) {
      this.onStep(this.currentStep, this.nextStepTime, secondsPerStep);
      this.nextStepTime += secondsPerStep;
      this.currentStep += 1;
    }

    this.timerID = setTimeout(() => this.schedule(), this.lookahead * 1000);
  }
}
