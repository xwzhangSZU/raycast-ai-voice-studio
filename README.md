# AI Voice Studio

AI Voice Studio is a small Raycast extension for turning text into speech without leaving your keyboard.

It began as a MiniMax reading helper and has grown into a modest multi-provider voice workspace. The goal is not to be a full audio production suite. It is meant to do a few everyday things well: read selected text, keep long readings resumable, test voice settings quickly, and make it easy to try different AI speech providers from the same Raycast surface.

## Why This Exists

Reading on screen is not always the nicest way to work through text. Sometimes you want to listen to a draft, a long article, a paragraph from a browser tab, or a bit of reference material while your eyes get a break.

AI Voice Studio tries to make that flow simple:

- Select text or copy it to the clipboard.
- Run a Raycast command.
- Hear the result with your chosen provider and voice.
- Stop, resume, restart, or adjust speed when the text is longer than expected.

The extension is deliberately practical. Provider details stay configurable, but common reading actions stay close at hand.

## Providers

### MiniMax

MiniMax is the most complete reading path in this extension. It is best suited for longer text and repeated reading workflows.

- Quick Read from selected text or clipboard.
- Resume and restart the last reading session.
- Menu-bar reading status for current progress.
- Speed controls that can carry across paused sessions.
- Lookahead synthesis for smoother chunk-to-chunk playback.
- Voice picker for built-in, cloned, generated, and custom voice IDs.
- Voice cloning with upload cache and preview playback.
- Token Plan and Open Platform API key modes.
- China and Global endpoint support.

### MiMo

MiMo is the expressive voice path. It is useful when you want more control over delivery, emotion, rhythm, and speaking style.

- Quick Read with MiMo.
- TTS Studio for typed, selected, pasted, or clipboard text.
- Voice picker and quick-read voice selection.
- Natural-language director prompt.
- Style, rhythm, emotion, vocal texture, and expression tags.
- Lookahead playback with stop-request safeguards.
- Menu-bar status and speed controls.

### OpenAI

OpenAI support is intentionally lightweight: a clear Speech API reading path with a familiar voice list.

- Quick Read with OpenAI.
- Voice picker and quick-read voice selection.
- `gpt-4o-mini-tts` by default, with `tts-1` and `tts-1-hd` available as legacy options.
- Built-in voices such as `cedar`, `marin`, `coral`, `alloy`, `nova`, and `shimmer`.
- Optional speaking instructions for supported models.
- MP3 and WAV response formats.
- Lookahead playback with stop-request safeguards.

## Commands

| Command | Provider | What It Does |
| --- | --- | --- |
| Quick Read | Default provider | Reads selected text or clipboard text. Run again to stop. |
| Setup Voice Defaults | Shared | Configures the default provider and one provider's voice/model/speed settings at a time. |
| Test Voice Setup | Shared | Generates and plays a short sample so you can confirm the current setup works. |
| Stop Reading | Shared | Stops current playback. |
| Increase Reading Speed | Shared | Speeds up the next segment or playback. |
| Decrease Reading Speed | Shared | Slows down the next segment or playback. |
| Resume Last Reading | MiniMax | Continues the previous MiniMax reading session. |
| Restart Last Reading | MiniMax | Starts the previous MiniMax reading session again. |
| Read with MiniMax Voice | MiniMax | Lets you pick a MiniMax voice before reading. |
| Set MiniMax Quick Read Voice | MiniMax | Sets the MiniMax voice used by Quick Read. |
| Clone MiniMax Voice | MiniMax | Uploads audio and creates a cloned MiniMax voice. |
| MiniMax Reading Status | MiniMax | Shows menu-bar reading controls and progress. |
| TTS Studio | MiMo | Opens MiMo's expressive speech controls. |
| Quick Read with MiMo | MiMo | Reads directly with MiMo, regardless of the default provider. |
| Read with MiMo Voice | MiMo | Lets you pick a MiMo voice before reading. |
| Set MiMo Quick Read Voice | MiMo | Sets the MiMo voice used by Quick Read. |
| MiMo Reading Status | MiMo | Shows menu-bar MiMo playback and speed controls. |
| Quick Read with OpenAI | OpenAI | Reads directly with OpenAI, regardless of the default provider. |
| Read with OpenAI Voice | OpenAI | Lets you pick an OpenAI voice before reading. |
| Set OpenAI Quick Read Voice | OpenAI | Sets the OpenAI voice used by Quick Read. |

## Setup

Install dependencies and start Raycast development mode:

```bash
npm install
npm run dev
```

Add API keys in Raycast Preferences:

- MiniMax Token Plan Key
- MiniMax Open Platform API Key
- MiMo Token Plan API Key
- OpenAI API Key

Then run **Setup Voice Defaults** to choose the default provider and configure provider-specific model, voice, speed, format, style, region, and endpoint options. API keys stay in Raycast Preferences; everyday voice settings live in the setup command so the Preferences sidebar stays manageable.

Run **Test Voice Setup** after adding or changing a key. It calls the selected provider, plays a short sample, and reports enough feedback to tell whether the provider path is working.

## Development

Common local checks:

```bash
npm run verify
```

Useful focused checks:

```bash
npm run verify:runtime
npm run verify:provider-settings
npm run verify:provider-contracts
npm run verify:pipeline-lookahead
npm run verify:audio-player
npm run build
npm run lint
npx tsc --noEmit
npm audit
```

For a local macOS playback smoke test that uses real `afplay`:

```bash
npm run verify:local-playback
```

Live provider smoke tests are opt-in because they call real TTS APIs:

```bash
npm run verify:live-env
AI_VOICE_STUDIO_LIVE=1 AI_VOICE_STUDIO_PROVIDERS=openai OPENAI_API_KEY=... npm run verify:live-smoke
npm run verify:goal
```

`verify:live-env` reports only whether provider keys are present. It does not print key values or call provider APIs.

## Design Notes

- Provider settings are intentionally scoped by provider, so MiniMax, MiMo, OpenAI, and future providers do not share voice or playback state by accident.
- MiniMax long-form reading stores resumable sessions and keeps speed changes visible to the next segment.
- MiMo and OpenAI reading paths use lookahead synthesis while preserving stop behavior, so prepared audio does not keep playing after a stop request.
- The shared audio player uses macOS `afplay` and cleans up temporary audio after playback.
- Command icons are deliberately unified under the AI Voice Studio icon so provider-specific commands still feel like one extension.

## Adding Another Provider

The extension is organized so another provider can be added without mixing settings into existing providers. A new provider should follow the same shape:

- `src/api/<provider>-tts.ts`
- `src/api/<provider>-types.ts`
- `src/constants/<provider>-voices.ts`
- `src/utils/<provider>-*`
- provider-scoped LocalStorage and preference names
- direct provider commands first, then shared Quick Read integration once the provider is stable

## A Small Caveat

AI speech APIs change, voices move, and latency varies by region and provider. This project tries to make those edges visible rather than pretend they do not exist. If a provider path fails, the extension should point you toward the missing key, setting, or provider response instead of failing silently.
