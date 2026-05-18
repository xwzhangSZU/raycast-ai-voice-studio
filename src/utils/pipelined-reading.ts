import type { AudioPlayer } from "./audio-player";

export interface PipelinedPlaybackCallbacks {
  onChunkReady?: (index: number, total: number) => Promise<void> | void;
  onFirstAudioReady?: () => Promise<void> | void;
}

export class ChunkSynthesisError extends Error {
  readonly index: number;
  readonly total: number;
  readonly cause: unknown;

  constructor(index: number, total: number, cause: unknown) {
    const base = cause instanceof Error ? cause.message : String(cause);
    super(total > 1 ? `Chunk ${index + 1}/${total} failed: ${base}` : base);
    this.name = "ChunkSynthesisError";
    this.index = index;
    this.total = total;
    this.cause = cause;
  }
}

/**
 * Per-provider bindings supplied by the thin wrapper modules. Keeps the
 * synthesis API and stop-signal source out of the shared loop so OpenAI and
 * MiMo (and any future provider) share one implementation.
 */
export interface PipelineProvider<O> {
  synthesize: (text: string, options: O, signal: AbortSignal) => Promise<string>;
  hasStopRequest: () => Promise<boolean>;
}

type AudioOptions = { format: string; playbackRate: number };
type SynthesisResult = { audio: string } | { error: unknown };

/**
 * Play chunks sequentially while synthesizing the next chunk during current
 * playback. Provider-agnostic: the synthesis call and stop-signal check are
 * injected via `provider`.
 */
export async function playChunksWithLookahead<O extends AudioOptions>(
  chunks: string[],
  options: O,
  player: AudioPlayer,
  provider: PipelineProvider<O>,
  callbacks: PipelinedPlaybackCallbacks = {},
): Promise<void> {
  if (chunks.length === 0) return;

  let currentJob: Promise<SynthesisResult> | null = startSynthesisJob(provider, chunks[0], options, player.signal);

  for (let index = 0; index < chunks.length && currentJob; index++) {
    const result = await currentJob;
    if (await shouldStop(player, provider)) break;

    if ("error" in result) {
      if (player.isStopped()) break;
      throw new ChunkSynthesisError(index, chunks.length, result.error);
    }

    if (await shouldStop(player, provider)) break;

    currentJob =
      index + 1 < chunks.length ? startSynthesisJob(provider, chunks[index + 1], options, player.signal) : null;

    await callbacks.onChunkReady?.(index, chunks.length);
    if (index === 0) {
      await callbacks.onFirstAudioReady?.();
    }

    await player.playAudio(result.audio, options.format, options.playbackRate);
    if (await shouldStop(player, provider)) break;
  }
}

async function shouldStop<O>(player: AudioPlayer, provider: PipelineProvider<O>): Promise<boolean> {
  if (player.isStopped()) return true;
  if (await provider.hasStopRequest()) {
    player.stopPlayback();
    return true;
  }
  return false;
}

function startSynthesisJob<O>(
  provider: PipelineProvider<O>,
  text: string,
  options: O,
  signal: AbortSignal,
): Promise<SynthesisResult> {
  return provider.synthesize(text, options, signal).then(
    (audio) => ({ audio }),
    (error) => ({ error }),
  );
}
