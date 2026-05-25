/**
 * moduleBridge.ts — читает сгенерированные ассеты из localStorage всех модулей.
 */

export interface BridgeAudioAsset {
  id: string; title: string; source: "music" | "voice" | "upload";
  url: string; duration: string; createdAt: string;
}
export interface BridgeVideoAsset {
  id: string; title: string; sceneNumber: number;
  url: string; previewUrl: string; duration: string;
  firstFrameUrl?: string; lastFrameUrl?: string;
}
export interface BridgeImageAsset {
  id: string; title: string; url: string;
  type: "first_frame" | "last_frame" | "frame";
}

export function getMusicAssets(): BridgeAudioAsset[] {
  try {
    const raw = localStorage.getItem("aura_music_module_state");
    if (!raw) return [];
    const state = JSON.parse(raw);
    return (state.generatedAudio ?? [])
      .filter((t: any) => t.url && !t.url.includes("soundhelix"))
      .map((t: any): BridgeAudioAsset => ({
        id: t.id, title: t.title ?? "Music Track", source: "music",
        url: t.url, duration: t.duration ?? "—", createdAt: t.createdAt ?? "",
      }));
  } catch { return []; }
}

export function getVoiceAssets(): BridgeAudioAsset[] {
  try {
    const raw = localStorage.getItem("aura_voice_module_state");
    if (!raw) return [];
    const state = JSON.parse(raw);
    return (state.generatedVoiceAudios ?? [])
      .filter((a: any) => a.url && !a.url.includes("soundhelix"))
      .map((a: any): BridgeAudioAsset => ({
        id: a.id, title: a.textRef ?? "Voice Line", source: "voice",
        url: a.url, duration: a.duration ?? "—", createdAt: a.createdAt ?? "",
      }));
  } catch { return []; }
}

export function getVideoAssets(): BridgeVideoAsset[] {
  try {
    const raw = localStorage.getItem("video_generator_blocks");
    if (!raw) return [];
    const blocks: any[] = JSON.parse(raw);
    return blocks
      .filter(b => b.selectedVideoId)
      .map(b => {
        const vid = (b.generatedVideos ?? []).find((v: any) => v.id === b.selectedVideoId);
        if (!vid?.url || vid.url.includes("giphy.com")) return null;
        return {
          id: vid.id, title: `${b.sceneTitle} (Сцена ${b.sceneNumber ?? 0})`,
          sceneNumber: b.sceneNumber ?? 0, url: vid.url, previewUrl: vid.previewUrl ?? vid.url,
          duration: b.duration ?? "5 сек",
          firstFrameUrl: b.firstFrameImage ?? undefined,
          lastFrameUrl: b.lastFrameImage ?? undefined,
        } as BridgeVideoAsset;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.sceneNumber - b.sceneNumber) as BridgeVideoAsset[];
  } catch { return []; }
}

export function getFrameAssets(): BridgeImageAsset[] {
  try {
    const raw = localStorage.getItem("video_generator_blocks");
    if (!raw) return [];
    const blocks: any[] = JSON.parse(raw);
    const assets: BridgeImageAsset[] = [];
    for (const block of blocks) {
      if (block.firstFrameImage?.startsWith("data:"))
        assets.push({ id: `ff-${block.id}`, title: `First Frame — ${block.sceneTitle}`, url: block.firstFrameImage, type: "first_frame" });
      if (block.lastFrameImage?.startsWith("data:"))
        assets.push({ id: `lf-${block.id}`, title: `Last Frame — ${block.sceneTitle}`, url: block.lastFrameImage, type: "last_frame" });
    }
    // Also check frame generator state
    const fgRaw = localStorage.getItem("aura_frame_generator_state");
    if (fgRaw) {
      const fgState = JSON.parse(fgRaw);
      (fgState.generatedFrameImages ?? []).forEach((img: any) => {
        if (img.url?.startsWith("data:"))
          assets.push({ id: img.id, title: img.sceneName ?? "Frame", url: img.url, type: "frame" });
      });
    }
    return assets;
  } catch { return []; }
}

export interface AllBridgeAssets {
  music: BridgeAudioAsset[]; voice: BridgeAudioAsset[];
  video: BridgeVideoAsset[]; frames: BridgeImageAsset[];
}

export function getAllBridgeAssets(): AllBridgeAssets {
  return { music: getMusicAssets(), voice: getVoiceAssets(), video: getVideoAssets(), frames: getFrameAssets() };
}
