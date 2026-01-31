/**
 * Audio processing utilities for voice calls
 * Node.js compatible version (uses audio-decode instead of FFmpeg)
 */

import { AudioFrame, combineAudioFrames } from "@livekit/rtc-node";
import decode from "audio-decode";

// Re-export for convenience
export { AudioFrame, combineAudioFrames };

// WAV file header constants
const RIFF_HEADER = new TextEncoder().encode("RIFF");
const WAVE_HEADER = new TextEncoder().encode("WAVE");
const FMT_HEADER = new TextEncoder().encode("fmt ");
const DATA_HEADER = new TextEncoder().encode("data");

interface WavOptions {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
}

/**
 * Create a WAV file header
 */
function createWavHeader(dataLength: number, options: WavOptions): Uint8Array {
  const { sampleRate, numChannels, bitsPerSample } = options;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF chunk descriptor
  new Uint8Array(header, 0, 4).set(RIFF_HEADER);
  view.setUint32(4, 36 + dataLength, true); // File size - 8
  new Uint8Array(header, 8, 4).set(WAVE_HEADER);

  // fmt sub-chunk
  new Uint8Array(header, 12, 4).set(FMT_HEADER);
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  new Uint8Array(header, 36, 4).set(DATA_HEADER);
  view.setUint32(40, dataLength, true);

  return new Uint8Array(header);
}

/**
 * Convert raw PCM data to WAV format
 */
export function pcmToWav(
  pcmData: Uint8Array,
  sampleRate: number = 48000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Uint8Array {
  const header = createWavHeader(pcmData.length, {
    sampleRate,
    numChannels,
    bitsPerSample,
  });

  const wav = new Uint8Array(header.length + pcmData.length);
  wav.set(header, 0);
  wav.set(pcmData, header.length);

  return wav;
}

/**
 * Convert AudioFrame to raw PCM bytes
 */
export function audioFrameToBytes(frame: AudioFrame): Uint8Array {
  return new Uint8Array(
    frame.data.buffer,
    frame.data.byteOffset,
    frame.data.byteLength
  );
}

/**
 * Collector for AudioFrames from LiveKit
 */
export class AudioFrameCollector {
  private frames: AudioFrame[] = [];
  private totalSamples = 0;

  add(frame: AudioFrame): void {
    this.frames.push(frame);
    this.totalSamples += frame.samplesPerChannel;
  }

  getCombined(): AudioFrame | null {
    if (this.frames.length === 0) return null;
    return combineAudioFrames(this.frames);
  }

  getBytes(): Uint8Array {
    const combined = this.getCombined();
    if (!combined) return new Uint8Array(0);
    return audioFrameToBytes(combined);
  }

  getWav(): Uint8Array {
    if (this.frames.length === 0) return new Uint8Array(0);
    const first = this.frames[0]!;
    const pcm = this.getBytes();
    return pcmToWav(pcm, first.sampleRate, first.channels, 16);
  }

  clear(): void {
    this.frames = [];
    this.totalSamples = 0;
  }

  getDurationSeconds(): number {
    if (this.frames.length === 0) return 0;
    const sampleRate = this.frames[0]!.sampleRate;
    return this.totalSamples / sampleRate;
  }

  get isEmpty(): boolean {
    return this.frames.length === 0;
  }

  get length(): number {
    return this.frames.length;
  }
}

/**
 * Decode MP3 to PCM using audio-decode (pure JavaScript, no FFmpeg)
 * @param mp3Data - MP3 audio bytes from OpenAI TTS
 * @param targetSampleRate - Target sample rate (default 48000 for LiveKit)
 * @returns PCM Int16Array ready for LiveKit
 */
export async function mp3ToPcm(
  mp3Data: Uint8Array,
  targetSampleRate: number = 48000
): Promise<Int16Array> {
  // Decode MP3 to AudioBuffer
  const audioBuffer = await decode(Buffer.from(mp3Data));

  // Get channel data (use first channel for mono)
  const channelData = audioBuffer.getChannelData(0);

  // Resample if needed
  let samples: Float32Array;
  if (audioBuffer.sampleRate !== targetSampleRate) {
    samples = resampleFloat32(channelData, audioBuffer.sampleRate, targetSampleRate);
  } else {
    samples = channelData;
  }

  // Convert Float32 (-1 to 1) to Int16 (-32768 to 32767)
  const int16Samples = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]!));
    int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return int16Samples;
}

/**
 * Simple linear interpolation resampler for Float32Array
 */
function resampleFloat32(
  samples: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIdx = i * ratio;
    const srcIdxFloor = Math.floor(srcIdx);
    const srcIdxCeil = Math.min(srcIdxFloor + 1, samples.length - 1);
    const frac = srcIdx - srcIdxFloor;

    result[i] = samples[srcIdxFloor]! * (1 - frac) + samples[srcIdxCeil]! * frac;
  }

  return result;
}

/**
 * Combine multiple audio segments into one
 */
export function combineAudioSegments(segments: Uint8Array[]): Uint8Array {
  const totalLength = segments.reduce((acc, seg) => acc + seg.length, 0);
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  for (const segment of segments) {
    combined.set(segment, offset);
    offset += segment.length;
  }

  return combined;
}
