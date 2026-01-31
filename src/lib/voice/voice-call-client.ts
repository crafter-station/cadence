/**
 * Voice call client for Trigger.dev tasks
 * Handles WebRTC connection, audio processing, and conversation flow
 */

import {
  Room,
  RoomEvent,
  AudioStream,
  AudioSource,
  AudioFrame,
  LocalAudioTrack,
  RemoteAudioTrack,
  RemoteTrackPublication,
  RemoteParticipant,
  TrackKind,
  DisconnectReason,
  TrackPublishOptions,
  TrackSource,
} from "@livekit/rtc-node";

import { AudioFrameCollector, pcmToWav, mp3ToPcm } from "./audio-utils";
import {
  transcribeAudio,
  generateCustomerResponse,
  synthesizeSpeech,
  type Message,
} from "./ai-service";

export interface VoiceCallMessage {
  role: "agent" | "user";
  content: string;
  timestamp: number;
  durationMs?: number;
}

export interface VoiceCallClientOptions {
  personalityPrompt: string;
  maxDurationMs?: number;
  maxTurns?: number;
  onMessage?: (message: VoiceCallMessage) => Promise<void> | void;
  onError?: (error: Error) => void;
}

export interface VoiceCallResult {
  success: boolean;
  error?: string;
}

export class VoiceCallClient {
  private room: Room;
  private options: Required<Omit<VoiceCallClientOptions, "onMessage" | "onError">> &
    Pick<VoiceCallClientOptions, "onMessage" | "onError">;
  private audioStream: AudioStream | null = null;
  private audioSource: AudioSource | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private isConnected = false;

  // Audio collection
  private agentAudioCollector = new AudioFrameCollector();
  private combinedAudioFrames: AudioFrame[] = [];

  // Conversation state
  private conversationHistory: Array<{ role: "agent" | "user"; text: string; timestamp: number }> =
    [];
  private startTime = Date.now(); // Initialize immediately to avoid timing issues
  private isProcessing = false;
  private agentIsTalking = true;
  private processingTimer: ReturnType<typeof setTimeout> | null = null;

  // Completion handling
  private resolveCompletion: ((result: VoiceCallResult) => void) | null = null;
  private isEnding = false;

  constructor(options: VoiceCallClientOptions) {
    this.options = {
      maxDurationMs: 180_000, // 3 minutes default
      maxTurns: 20,
      ...options,
    };
    this.room = new Room();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.room.on(RoomEvent.Connected, () => {
      console.log("[VoiceCall] Connected to room");
      this.isConnected = true;
      this.startTime = Date.now();
    });

    this.room.on(RoomEvent.Disconnected, (reason: DisconnectReason) => {
      console.log("[VoiceCall] Disconnected:", DisconnectReason[reason]);
      this.isConnected = false;
      this.endCall("disconnected");
    });

    this.room.on(
      RoomEvent.TrackSubscribed,
      async (
        track: RemoteAudioTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant
      ) => {
        if (track.kind === TrackKind.KIND_AUDIO) {
          console.log("[VoiceCall] Agent audio track subscribed");
          await this.setupAudioStream(track);
        }
      }
    );

    this.room.on(
      RoomEvent.DataReceived,
      (
        payload: Uint8Array,
        participant?: RemoteParticipant,
        kind?: number,
        topic?: string
      ) => {
        this.handleDataEvent(payload);
      }
    );
  }

  private handleDataEvent(payload: Uint8Array): void {
    try {
      const text = new TextDecoder().decode(payload);
      const event = JSON.parse(text);
      const eventType = event.event_type || "unknown";

      if (eventType === "agent_start_talking") {
        this.agentIsTalking = true;
        if (this.processingTimer) {
          clearTimeout(this.processingTimer);
          this.processingTimer = null;
        }
        console.log("[VoiceCall] Agent started talking");
      } else if (eventType === "agent_stop_talking") {
        this.agentIsTalking = false;
        console.log("[VoiceCall] Agent stopped talking");

        // Wait for sustained silence before processing
        if (this.processingTimer) clearTimeout(this.processingTimer);
        this.processingTimer = setTimeout(() => {
          this.processAgentAudio();
        }, 4500); // 4.5s silence threshold
      }
    } catch {
      // Ignore non-JSON data
    }
  }

  private async setupAudioStream(track: RemoteAudioTrack): Promise<void> {
    this.audioStream = new AudioStream(track, 48000, 1);
    const reader = this.audioStream.getReader();

    const readFrames = async () => {
      try {
        while (true) {
          const { value: frame, done } = await reader.read();
          if (done) break;
          if (frame && this.agentIsTalking) {
            this.agentAudioCollector.add(frame);
            this.combinedAudioFrames.push(frame);
          }
        }
      } catch (error) {
        console.error("[VoiceCall] Audio stream error:", error);
      }
    };

    readFrames();
  }

  private async processAgentAudio(): Promise<void> {
    if (this.agentIsTalking || this.isProcessing || this.agentAudioCollector.isEmpty) {
      return;
    }

    this.isProcessing = true;

    try {
      const audioWav = this.agentAudioCollector.getWav();
      const duration = this.agentAudioCollector.getDurationSeconds();
      this.agentAudioCollector.clear();

      if (duration < 0.5) {
        console.log("[VoiceCall] Audio too short, skipping");
        this.isProcessing = false;
        return;
      }

      // Transcribe agent audio
      const agentText = await transcribeAudio(audioWav);

      if (!agentText || agentText.trim().length === 0) {
        console.log("[VoiceCall] Empty transcription, skipping");
        this.isProcessing = false;
        return;
      }

      // Record agent turn
      const agentTimestamp = Date.now() - this.startTime;
      const agentMessage: VoiceCallMessage = {
        role: "agent",
        content: agentText,
        timestamp: agentTimestamp,
      };
      this.conversationHistory.push({
        role: "agent",
        text: agentText,
        timestamp: agentTimestamp,
      });
      await this.options.onMessage?.(agentMessage);

      console.log(`[Agent] ${agentText}`);

      // Check if agent said goodbye - end after this turn
      const shouldEnd = this.shouldEndConversation(agentText);
      if (shouldEnd) {
        console.log("[VoiceCall] Goodbye detected, will end after response");
      }

      // Debug timing
      const elapsed = Date.now() - this.startTime;
      console.log(`[VoiceCall] Time elapsed: ${elapsed}ms / ${this.options.maxDurationMs}ms`);

      // Generate customer response
      const history: Message[] = this.conversationHistory.map((t) => ({
        role: t.role === "agent" ? "user" : "assistant",
        content: t.text,
      }));

      const responseText = await generateCustomerResponse(
        this.options.personalityPrompt,
        history
      );

      if (!responseText || responseText.trim().length === 0) {
        console.log("[VoiceCall] Empty response, skipping");
        this.isProcessing = false;
        return;
      }

      // Synthesize speech
      const responseAudio = await synthesizeSpeech(responseText);

      // Record customer turn
      const customerTimestamp = Date.now() - this.startTime;
      const customerMessage: VoiceCallMessage = {
        role: "user",
        content: responseText,
        timestamp: customerTimestamp,
      };
      this.conversationHistory.push({
        role: "user",
        text: responseText,
        timestamp: customerTimestamp,
      });
      await this.options.onMessage?.(customerMessage);

      console.log(`[Customer] ${responseText}`);

      // Send audio to LiveKit
      await this.publishAudio(responseAudio);

      // Check limits AFTER completing the turn
      const customerTurns = this.conversationHistory.filter((t) => t.role === "user").length;
      const elapsedAfterTurn = Date.now() - this.startTime;

      if (shouldEnd) {
        console.log("[VoiceCall] Ending conversation (goodbye detected)");
        await this.endCall("completed");
        return;
      }

      if (customerTurns >= this.options.maxTurns) {
        console.log(`[VoiceCall] Max turns reached (${customerTurns}/${this.options.maxTurns})`);
        await this.endCall("completed");
        return;
      }

      if (elapsedAfterTurn >= this.options.maxDurationMs) {
        console.log(`[VoiceCall] Max duration reached (${elapsedAfterTurn}ms/${this.options.maxDurationMs}ms)`);
        await this.endCall("completed");
        return;
      }
    } catch (error) {
      console.error("[VoiceCall] Processing error:", error);
      this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.isProcessing = false;
    }
  }

  private shouldEndConversation(text: string): boolean {
    const endPhrases = [
      "adios",
      "adiós",
      "hasta luego",
      "hasta pronto",
      "chao",
      "bye",
      "goodbye",
      "gracias por tu tiempo",
      "eso seria todo",
      "eso sería todo",
      "que tengas",
      "buen dia",
      "buen día",
      "is there anything else",
      "have a great day",
      "thank you for contacting",
    ];
    const lowerText = text.toLowerCase();
    return endPhrases.some((phrase) => lowerText.includes(phrase));
  }

  private async publishAudio(mp3Audio: Uint8Array): Promise<void> {
    if (!this.isConnected || !this.room.localParticipant) {
      return;
    }

    // Create audio source if needed
    if (!this.audioSource) {
      this.audioSource = new AudioSource(48000, 1);
      this.localAudioTrack = LocalAudioTrack.createAudioTrack(
        "customer-microphone",
        this.audioSource
      );
      const publishOptions = new TrackPublishOptions({
        source: TrackSource.SOURCE_MICROPHONE,
      });
      await this.room.localParticipant.publishTrack(this.localAudioTrack, publishOptions);
    }

    // Convert MP3 to PCM
    const pcmData = await mp3ToPcm(mp3Audio, 48000);

    // Send in chunks (480 samples = 10ms at 48kHz)
    const SAMPLES_PER_FRAME = 480;
    for (let i = 0; i < pcmData.length; i += SAMPLES_PER_FRAME) {
      const end = Math.min(i + SAMPLES_PER_FRAME, pcmData.length);
      const chunk = pcmData.slice(i, end);
      const frame = new AudioFrame(chunk, 48000, 1, chunk.length);
      await this.audioSource.captureFrame(frame);
      this.combinedAudioFrames.push(frame);
    }
  }

  async connect(url: string, token: string): Promise<void> {
    await this.room.connect(url, token, {
      autoSubscribe: true,
      dynacast: false,
    });
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    if (this.audioSource) {
      await this.audioSource.close();
      this.audioSource = null;
    }
    if (this.localAudioTrack) {
      await this.localAudioTrack.close(false);
      this.localAudioTrack = null;
    }
    await this.room.disconnect();
    this.isConnected = false;
  }

  private async endCall(reason: string): Promise<void> {
    if (this.isEnding) return;
    this.isEnding = true;

    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
      this.processingTimer = null;
    }

    await this.disconnect();

    if (this.resolveCompletion) {
      this.resolveCompletion({
        success: reason === "completed" || reason === "disconnected",
        error: reason === "completed" ? undefined : reason,
      });
    }
  }

  waitForCompletion(): Promise<VoiceCallResult> {
    return new Promise((resolve) => {
      this.resolveCompletion = resolve;

      // Timeout safety
      setTimeout(() => {
        if (!this.isEnding) {
          this.endCall("timeout");
        }
      }, this.options.maxDurationMs + 30_000);
    });
  }

  getCombinedAudioWav(): Uint8Array {
    if (this.combinedAudioFrames.length === 0) {
      return new Uint8Array(0);
    }

    // Calculate total size
    let totalBytes = 0;
    for (const frame of this.combinedAudioFrames) {
      totalBytes += frame.data.byteLength;
    }

    // Combine all frames
    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    for (const frame of this.combinedAudioFrames) {
      const bytes = new Uint8Array(
        frame.data.buffer,
        frame.data.byteOffset,
        frame.data.byteLength
      );
      combined.set(bytes, offset);
      offset += bytes.length;
    }

    return pcmToWav(combined, 48000, 1, 16);
  }

  getAudioDurationSeconds(): number {
    let totalSamples = 0;
    for (const frame of this.combinedAudioFrames) {
      totalSamples += frame.samplesPerChannel;
    }
    return totalSamples / 48000;
  }

  getTranscript(): VoiceCallMessage[] {
    return this.conversationHistory.map((t) => ({
      role: t.role,
      content: t.text,
      timestamp: t.timestamp,
    }));
  }
}
