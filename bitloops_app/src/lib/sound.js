const contextWaveCache = new WeakMap();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getCacheForContext = (context) => {
  if (!contextWaveCache.has(context)) {
    contextWaveCache.set(context, new Map());
  }
  return contextWaveCache.get(context);
};

export const getCustomWave = (context, shape = 0.5) => {
  if (!context?.createPeriodicWave) return null;
  const normalized = clamp(Number.isFinite(shape) ? shape : parseFloat(shape) || 0.5, 0, 1);
  const key = normalized.toFixed(2);
  const cache = getCacheForContext(context);
  if (cache.has(key)) {
    return cache.get(key);
  }

  const harmonics = 12;
  const real = new Float32Array(harmonics + 1);
  const imag = new Float32Array(harmonics + 1);

  for (let i = 1; i <= harmonics; i += 1) {
    const sineComponent = (1 - normalized) * (1 / i);
    const sawComponent = normalized * (1 / i);
    const squareComponent = normalized * (i % 2 ? 1 / i : 0);
    real[i] = squareComponent;
    imag[i] = sineComponent + sawComponent;
  }

  const periodicWave = context.createPeriodicWave(real, imag, { disableNormalization: false });
  cache.set(key, periodicWave);
  return periodicWave;
};

export const connectTrackEffects = (context, track, sourceNode, destinationNode, startTime = context?.currentTime ?? 0) => {
  if (!context || !sourceNode || !destinationNode) return;
  const effects = track?.effects ?? {};
  let currentNode = sourceNode;

  // Bitcrusher effect (bit reduction and sample rate reduction)
  if (effects.bitcrushBits && effects.bitcrushBits < 16) {
    const bitcrush = context.createScriptProcessor(256, 1, 1);
    const bits = clamp(effects.bitcrushBits ?? 16, 1, 16);
    const sampleRateReduction = clamp(effects.bitcrushRate ?? 1, 1, 50);
    let lastSample = 0;
    let sampleCounter = 0;
    
    bitcrush.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      const step = Math.pow(0.5, bits);
      
      for (let i = 0; i < input.length; i++) {
        sampleCounter++;
        if (sampleCounter >= sampleRateReduction) {
          sampleCounter = 0;
          lastSample = Math.floor(input[i] / step) * step;
        }
        output[i] = lastSample;
      }
    };
    
    currentNode.connect(bitcrush);
    currentNode = bitcrush;
  }

  // Filter effect
  if (effects.filterType && effects.filterType !== 'none') {
    const filter = context.createBiquadFilter();
    filter.type = effects.filterType;
    filter.frequency.setValueAtTime(effects.filterCutoff ?? 1800, startTime);
    filter.Q.setValueAtTime(effects.filterQ ?? 0.7, startTime);
    currentNode.connect(filter);
    currentNode = filter;
  }

  // Reverb effect (simple convolver-based reverb)
  const reverbMix = clamp(effects.reverbMix ?? 0, 0, 1);
  if (reverbMix > 0) {
    const dryGain = context.createGain();
    dryGain.gain.setValueAtTime(1 - reverbMix, startTime);
    currentNode.connect(dryGain);
    dryGain.connect(destinationNode);

    // Create simple reverb using multiple delays
    const reverbTime = clamp(effects.reverbTime ?? 1, 0.1, 5);
    const wetGain = context.createGain();
    wetGain.gain.setValueAtTime(reverbMix, startTime);
    
    // Create a simple reverb with multiple delay lines
    const delays = [0.037, 0.041, 0.043, 0.047];
    delays.forEach((delayTime, index) => {
      const delay = context.createDelay(5);
      delay.delayTime.setValueAtTime(delayTime * reverbTime, startTime);
      const feedback = context.createGain();
      feedback.gain.setValueAtTime(0.5 - (index * 0.1), startTime);
      
      currentNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);
    });
    
    wetGain.connect(destinationNode);
    return;
  }

  // Delay effect
  const mix = clamp(effects.delayMix ?? 0, 0, 0.9);
  if (mix > 0) {
    const dryGain = context.createGain();
    dryGain.gain.setValueAtTime(1 - mix, startTime);
    currentNode.connect(dryGain);
    dryGain.connect(destinationNode);

    const delayNode = context.createDelay(1);
    delayNode.delayTime.setValueAtTime(clamp(effects.delayTime ?? 0.25, 0.05, 0.8), startTime);
    const feedbackGain = context.createGain();
    feedbackGain.gain.setValueAtTime(clamp(effects.delayFeedback ?? 0.3, 0, 0.9), startTime);
    const wetGain = context.createGain();
    wetGain.gain.setValueAtTime(mix, startTime);

    currentNode.connect(delayNode);
    delayNode.connect(wetGain);
    wetGain.connect(destinationNode);
    delayNode.connect(feedbackGain);
    feedbackGain.connect(delayNode);
    return;
  }

  currentNode.connect(destinationNode);
};

export const getTrackDisplayWaveform = (track) => {
  if (!track) return 'unknown';
  if (track.waveform !== 'custom') return track.waveform;
  const intensity = Math.round(clamp(track.customShape ?? 0.5, 0, 1) * 100);
  return `custom ${intensity}%`;
};

export const SHARE_TEXT = 'Check out my BitLoops loop!';

export const encodeShareSnapshot = (snapshot) => {
  if (!snapshot) return '';
  const json = JSON.stringify(snapshot);
  if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
    return Buffer.from(json, 'utf-8').toString('base64url');
  }
  let base64;
  if (typeof TextEncoder === 'undefined') {
    base64 = btoa(unescape(encodeURIComponent(json)));
  } else {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(json);
    let binary = '';
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const decodeShareSnapshot = (encoded) => {
  if (!encoded) return null;
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const base64 = `${normalized}${padding}`;
  let json;
  try {
    if (typeof window === 'undefined' && typeof Buffer !== 'undefined') {
      json = Buffer.from(base64, 'base64').toString('utf-8');
    } else {
      const binary = atob(base64);
      if (typeof TextDecoder === 'undefined') {
        json = decodeURIComponent(escape(binary));
      } else {
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const decoder = new TextDecoder();
        json = decoder.decode(bytes);
      }
    }
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode shared snapshot', error);
    return null;
  }
};

export const buildShareUrl = (snapshot) => {
  if (typeof window === 'undefined') return '';
  const encoded = encodeShareSnapshot(snapshot);
  if (!encoded) return '';
  const url = new URL(window.location.href);
  url.searchParams.set('share', encoded);
  return url.toString();
};

export const clamp01 = (value) => clamp(Number.isFinite(value) ? value : parseFloat(value) || 0, 0, 1);
