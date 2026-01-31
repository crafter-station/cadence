/**
 * AI services for voice call testing
 * Uses AI SDK (works in Node.js)
 */

import { openai } from "@ai-sdk/openai";
import {
  experimental_generateSpeech as generateSpeech,
  generateText,
  experimental_transcribe as transcribe,
} from "ai";

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Transcribe audio to text using OpenAI Whisper
 */
export async function transcribeAudio(audioWav: Uint8Array): Promise<string> {
  const result = await transcribe({
    model: openai.transcription("whisper-1"),
    audio: audioWav,
  });
  return result.text;
}

/**
 * Generate customer response based on conversation history
 * @param systemPrompt - The personality prompt for the customer
 * @param conversationHistory - The conversation so far
 */
export async function generateCustomerResponse(
  systemPrompt: string,
  conversationHistory: Message[]
): Promise<string> {
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
  ];

  const result = await generateText({
    model: openai("gpt-4o"),
    messages,
    maxOutputTokens: 300,
    temperature: 0.8,
  });

  return result.text;
}

export type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

/**
 * Convert text to speech using OpenAI TTS
 */
export async function synthesizeSpeech(
  text: string,
  voice: Voice = "onyx"
): Promise<Uint8Array> {
  const result = await generateSpeech({
    model: openai.speech("tts-1"),
    text,
    voice,
  });
  return result.audio.uint8Array;
}
