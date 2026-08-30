import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'resident-evil-3d-muted';
const MASTER_LEVEL = 0.1;
const FIRE_LEVEL = 0.024;
const SCHEDULE_AHEAD_TIME = 0.35;
const SCHEDULER_INTERVAL_MS = 140;
const CHORD_DURATION = 2.8;
const CHORD_STEP = 2.3;

const CHORDS = [
  [45, 52, 57, 60],
  [43, 50, 55, 59],
  [41, 48, 53, 57],
  [38, 45, 50, 53],
];

const MELODY = [
  { note: 72, offset: 0.35, duration: 0.65 },
  { note: 69, offset: 1.15, duration: 0.7 },
  { note: 67, offset: 1.95, duration: 0.75 },
  { note: 64, offset: 2.7, duration: 0.85 },
];

function midiToFrequency(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function createNoiseBuffer(audioContext, duration = 3) {
  const length = Math.floor(audioContext.sampleRate * duration);
  const buffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  let previous = 0;

  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = (previous + 0.025 * white) / 1.025;
    data[index] = previous * 2.2;
  }

  return buffer;
}

function rampGain(gainNode, value, now, time = 0.9) {
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(gainNode.gain.value, now);
  gainNode.gain.linearRampToValueAtTime(value, now + time);
}

function createFilter(audioContext, type, frequency, q = 0.7) {
  const filter = audioContext.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  return filter;
}

function schedulePadVoice(audioContext, destination, frequency, time, duration, gainValue) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequency, time);

  const subOscillator = audioContext.createOscillator();
  subOscillator.type = 'sine';
  subOscillator.frequency.setValueAtTime(frequency * 0.5, time);

  const filter = createFilter(audioContext, 'lowpass', 920, 0.35);
  const gain = audioContext.createGain();

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(gainValue, time + 0.55);
  gain.gain.linearRampToValueAtTime(gainValue * 0.72, time + duration * 0.6);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  oscillator.connect(filter);
  subOscillator.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  oscillator.start(time);
  subOscillator.start(time);
  oscillator.stop(time + duration + 0.05);
  subOscillator.stop(time + duration + 0.05);
}

function scheduleLeadNote(audioContext, destination, frequency, time, duration) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, time);

  const shimmer = audioContext.createOscillator();
  shimmer.type = 'triangle';
  shimmer.frequency.setValueAtTime(frequency * 2, time);

  const filter = createFilter(audioContext, 'lowpass', 1800, 0.5);
  const gain = audioContext.createGain();

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(0.015, time + 0.08);
  gain.gain.linearRampToValueAtTime(0.009, time + duration * 0.7);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

  oscillator.connect(filter);
  shimmer.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  oscillator.start(time);
  shimmer.start(time);
  oscillator.stop(time + duration + 0.05);
  shimmer.stop(time + duration + 0.05);
}

function createAmbientGraph(audioContext) {
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioContext.destination);

  const noiseBuffer = createNoiseBuffer(audioContext);

  const roomNoise = audioContext.createBufferSource();
  roomNoise.buffer = noiseBuffer;
  roomNoise.loop = true;

  const roomFilter = createFilter(audioContext, 'lowpass', 280, 0.75);
  const roomGain = audioContext.createGain();
  roomGain.gain.value = 0.18;

  roomNoise.connect(roomFilter);
  roomFilter.connect(roomGain);
  roomGain.connect(masterGain);

  const fireNoise = audioContext.createBufferSource();
  fireNoise.buffer = noiseBuffer;
  fireNoise.loop = true;

  const fireBandpass = createFilter(audioContext, 'bandpass', 1350, 0.8);
  const fireLowpass = createFilter(audioContext, 'lowpass', 2400, 0.4);
  const fireGain = audioContext.createGain();
  fireGain.gain.value = 0;

  fireNoise.connect(fireBandpass);
  fireBandpass.connect(fireLowpass);
  fireLowpass.connect(fireGain);
  fireGain.connect(masterGain);

  const drone = audioContext.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = 45;

  const droneGain = audioContext.createGain();
  droneGain.gain.value = 0.012;

  const pulse = audioContext.createOscillator();
  pulse.type = 'sine';
  pulse.frequency.value = 0.08;

  const pulseGain = audioContext.createGain();
  pulseGain.gain.value = 0.008;

  pulse.connect(pulseGain);
  pulseGain.connect(droneGain.gain);
  drone.connect(droneGain);
  droneGain.connect(masterGain);

  roomNoise.start();
  fireNoise.start();
  drone.start();
  pulse.start();

  const compositionGain = audioContext.createGain();
  compositionGain.gain.value = 1;
  compositionGain.connect(masterGain);

  let nextChordTime = audioContext.currentTime + 0.12;
  let chordIndex = 0;

  const schedulePass = () => {
    while (nextChordTime < audioContext.currentTime + SCHEDULE_AHEAD_TIME) {
      const chord = CHORDS[chordIndex % CHORDS.length];

      chord.forEach((note, noteIndex) => {
        schedulePadVoice(
          audioContext,
          compositionGain,
          midiToFrequency(note),
          nextChordTime,
          CHORD_DURATION,
          noteIndex === 0 ? 0.012 : 0.009,
        );
      });

      if (chordIndex % 2 === 0) {
        MELODY.forEach(({ duration, note, offset }) => {
          scheduleLeadNote(
            audioContext,
            compositionGain,
            midiToFrequency(note),
            nextChordTime + offset,
            duration,
          );
        });
      }

      chordIndex += 1;
      nextChordTime += CHORD_STEP;
    }
  };

  const schedulerId = window.setInterval(schedulePass, SCHEDULER_INTERVAL_MS);
  schedulePass();

  return {
    audioContext,
    fireGain,
    masterGain,
    stop() {
      window.clearInterval(schedulerId);
      roomNoise.stop();
      fireNoise.stop();
      drone.stop();
      pulse.stop();
      masterGain.disconnect();
    },
  };
}

export function useAmbientAudio(progressRef, ready) {
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(STORAGE_KEY) === 'true';
  });
  const [activated, setActivated] = useState(false);
  const graphRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(muted));
    }
  }, [muted]);

  const ensureStarted = useCallback(async () => {
    if (!ready || typeof window === 'undefined') {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    if (!graphRef.current) {
      const audioContext = new AudioContextClass();
      graphRef.current = createAmbientGraph(audioContext);
    }

    if (graphRef.current.audioContext.state === 'suspended') {
      await graphRef.current.audioContext.resume();
    }

    setActivated(true);
  }, [ready]);

  const toggleMuted = useCallback(async () => {
    if (!activated) {
      await ensureStarted();
      setMuted(false);
      return;
    }

    setMuted((current) => !current);
  }, [activated, ensureStarted]);

  useEffect(() => {
    const graph = graphRef.current;

    if (!graph || !activated) {
      return;
    }

    rampGain(
      graph.masterGain,
      muted ? 0 : MASTER_LEVEL,
      graph.audioContext.currentTime,
      1.2,
    );
  }, [activated, muted]);

  useEffect(() => {
    if (!ready || typeof window === 'undefined') {
      return undefined;
    }

    let frameId = 0;

    const tick = () => {
      const graph = graphRef.current;

      if (graph) {
        const progress = progressRef.current.current;
        const firePresence = Math.max(
          0,
          Math.min(1, (progress - 0.46) / 0.22),
        );
        const endFade = 1 - Math.max(0, Math.min(1, (progress - 0.86) / 0.14));
        const fireLevel = muted ? 0 : FIRE_LEVEL * firePresence * endFade;

        graph.fireGain.gain.setTargetAtTime(
          fireLevel,
          graph.audioContext.currentTime,
          0.3,
        );
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [muted, progressRef, ready]);

  useEffect(() => {
    return () => {
      if (graphRef.current) {
        const audioContext = graphRef.current.audioContext;
        graphRef.current.stop();
        audioContext.close();
      }
    };
  }, []);

  return {
    activated,
    ensureStarted,
    muted,
    toggleMuted,
  };
}
