import { LocalStorage } from "@raycast/api";
import { buildOptionsAsync, buildOptionsFromPrefs } from "../api/qwen-tts";
import type { QwenTTSModel, TTSOptions } from "../api/qwen-tts-types";
import { getVoiceById } from "../constants/qwen-tts-voices";

const QUICK_READ_VOICE_KEY = "qwen-quick-read-voice-override";

export async function buildDefaultOptionsFromPrefs(): Promise<TTSOptions> {
  const voiceOverride = await getQuickReadVoiceOverride();
  return buildOptionsAsync(voiceOverride || undefined);
}

export async function getActiveQuickReadVoiceId(): Promise<{ voiceId: string; isOverride: boolean }> {
  const voiceOverride = await getQuickReadVoiceOverride();
  if (voiceOverride) {
    return { voiceId: voiceOverride, isOverride: true };
  }

  return { voiceId: (await buildOptionsFromPrefs()).voice, isOverride: false };
}

export async function getQuickReadVoiceOverride(): Promise<string | null> {
  const voiceId = await LocalStorage.getItem<string>(QUICK_READ_VOICE_KEY);
  return voiceId?.trim() || null;
}

export async function setQuickReadVoiceOverride(voiceId: string): Promise<void> {
  await LocalStorage.setItem(QUICK_READ_VOICE_KEY, voiceId);
}

export async function clearQuickReadVoiceOverride(): Promise<void> {
  await LocalStorage.removeItem(QUICK_READ_VOICE_KEY);
}

/**
 * Drop the Quick Read voice override when it is not available on the given model, so switching
 * the model (e.g. from a flash-only dialect voice back to qwen-tts-latest) cannot leave Quick
 * Read pointing at a voice the model rejects. A valid override is kept untouched.
 */
export async function dropQuickReadVoiceOverrideIfInvalid(model: QwenTTSModel): Promise<void> {
  const override = await getQuickReadVoiceOverride();
  if (!override) return;
  const voice = getVoiceById(override);
  if (!voice || !voice.models.includes(model)) {
    await clearQuickReadVoiceOverride();
  }
}
