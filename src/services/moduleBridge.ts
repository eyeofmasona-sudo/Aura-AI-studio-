/**
 * moduleBridge.ts
 * Единая точка чтения сгенерированных ассетов из всех модулей.
 * Все модули сохраняют state в localStorage — этот файл умеет их читать
 * и отдавать только нужные данные (аудио, видео, кадры) в нормализованном виде.
 */

// ─── Нормализованные типы для редакторов ─────────────────────────────────────

export interface BridgeAudioAsset {
  id: string;
  title: string;
  source: "music" | "voice" | "upload";
  url: string;       // objectURL или dataURL
  duration: string;
  createdAt: string;
}

export interface BridgeVideoAsset {
  id: string;
  title: string;
  sceneNumber: number;
  url: string;       // objectURL или dataURL (gif/mp4)
  previewUrl: string;
  duration: string;
  firstFrameUrl?: string;
  lastFrameUrl?: string;
}

export interface BridgeImageAsset {
  id: string;
  title: string;
  url: string;       // dataURL
  type: "first_frame" | "last_frame" | "frame";
}

// ─── Читаем музыкальный модуль ────────────────────────────────────────────────

export function getMusicAssets(): BridgeAudioAsset[] {
  try {
    const raw = localStorage.getItem("aura_music_module_state");
    if (!raw) return [];
    const state = JSON.parse(raw);
    const tracks = state.generatedAudio ?? [];
    return tracks
      .filter((t: any) => t.url && !t.url.includes("soundhelix"))
      .map((t: any): BridgeAudioAsset => ({
        id: t.id,
        title: t.title ?? "Music Track",
        source: "music",
        url: t.url,
        duration: t.duration ?? "—",
        createdAt: t.createdAt ?? "",
      }));
  } catch {
    return [];
  }
}

// ─── Читаем голосовой модуль ─────────────────────────────────────────────────

export function getVoiceAssets(): BridgeAudioAsset[] {
  try {
    const raw = localStorage.getItem("aura_voice_module_state");
    if (!raw) return [];
    const state = JSON.parse(raw);
    const audios = state.generatedVoiceAudios ?? [];
    return audios
      .filter((a: any) => a.url && !a.url.includes("soundhelix"))
      .map((a: any): BridgeAudioAsset => ({
        id: a.id,
        title: a.textRef ?? "Voice Line",
        source: "voice",
        url: a.url,
        duration: a.duration ?? "—",
        createdAt: a.createdAt ?? "",
      }));
  } catch {
    return [];
  }
}

// ─── Читаем видео-генератор ───────────────────────────────────────────────────

export function getVideoAssets(): BridgeVideoAsset[] {
  try {
    const raw = localStorage.getItem("video_generator_blocks");
    if (!raw) return [];
    const blocks: any[] = JSON.parse(raw);
    const assets: BridgeVideoAsset[] = [];

    for (const block of blocks) {
      if (!block.selectedVideoId) continue;
      const selectedVid = (block.generatedVideos ?? []).find(
        (v: any) => v.id === block.selectedVideoId
      );
      if (!selectedVid?.url) continue;
      // skip Giphy mocks
      if (selectedVid.url.includes("giphy.com")) continue;

      assets.push({
        id: selectedVid.id,
        title: `${block.sceneTitle} (Сцена ${block.sceneNumber})`,
        sceneNumber: block.sceneNumber ?? 0,
        url: selectedVid.url,
        previewUrl: selectedVid.previewUrl ?? selectedVid.url,
        duration: block.duration ?? "5 сек",
        firstFrameUrl: block.firstFrameImage ?? undefined,
        lastFrameUrl: block.lastFrameImage ?? undefined,
      });
    }

    return assets.sort((a, b) => a.sceneNumber - b.sceneNumber);
  } catch {
    return [];
  }
}

// ─── Читаем кадры из видео-блоков ────────────────────────────────────────────

export function getFrameAssets(): BridgeImageAsset[] {
  try {
    const raw = localStorage.getItem("video_generator_blocks");
    if (!raw) return [];
    const blocks: any[] = JSON.parse(raw);
    const assets: BridgeImageAsset[] = [];

    for (const block of blocks) {
      if (block.firstFrameImage?.startsWith("data:")) {
        assets.push({
          id: `ff-${block.id}`,
          title: `First Frame — ${block.sceneTitle}`,
          url: block.firstFrameImage,
          type: "first_frame",
        });
      }
      if (block.lastFrameImage?.startsWith("data:")) {
        assets.push({
          id: `lf-${block.id}`,
          title: `Last Frame — ${block.sceneTitle}`,
          url: block.lastFrameImage,
          type: "last_frame",
        });
      }
    }
    return assets;
  } catch {
    return [];
  }
}

// ─── Сводная функция ─────────────────────────────────────────────────────────

export interface AllBridgeAssets {
  music: BridgeAudioAsset[];
  voice: BridgeAudioAsset[];
  video: BridgeVideoAsset[];
  frames: BridgeImageAsset[];
}

export function getAllBridgeAssets(): AllBridgeAssets {
  return {
    music: getMusicAssets(),
    voice: getVoiceAssets(),
    video: getVideoAssets(),
    frames: getFrameAssets(),
  };
}
