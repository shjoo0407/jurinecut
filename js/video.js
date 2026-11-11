import { CONFIG } from './config.js';
import { CANVAS, renderLayer, drawCover, withCellClip } from './compose.js';
import { audioContext, loadMusic } from './sound.js';

// 촬영 과정 영상.
// 1) 컷마다 카운트다운 동안 카메라 영상을 녹화해 두고
// 2) 다 찍으면 네 영상을 프레임 칸에 동시에 재생하면서 캔버스를 다시 녹화해 한 편으로 만든다.

const SCALE = 0.6;          // 1080 x 948
const FPS = 30;
const BITRATE = 4_000_000;
const HIDDEN = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none';

export const canRecordVideo = () =>
  CONFIG.videoEnabled && 'MediaRecorder' in window && 'captureStream' in HTMLCanvasElement.prototype;

// 아이패드 사파리는 mp4, 크롬은 webm으로 녹화된다
function recorderFor(stream) {
  const mimeType = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((type) => MediaRecorder.isTypeSupported(type));
  return new MediaRecorder(stream, { videoBitsPerSecond: BITRATE, ...(mimeType && { mimeType }) });
}

function recordInto(recorder) {
  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size) chunks.push(event.data);
  };
  return new Promise((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType.split(';')[0] }));
  });
}

// 카메라 영상 녹화를 시작한다. stop()을 부르면 { blob, duration(초) }를 돌려준다.
export function recordClip(stream) {
  const recorder = recorderFor(stream);
  const done = recordInto(recorder);
  const startedAt = performance.now();
  recorder.start();
  return {
    async stop() {
      if (recorder.state !== 'inactive') recorder.stop();
      return { blob: await done, duration: (performance.now() - startedAt) / 1000 };
    },
  };
}

// 녹화해 둔 컷 영상들을 프레임에 넣어 영상 한 편(Blob)으로 만든다
export async function composeVideo(layout, clips) {
  const videos = await Promise.all(clips.map((clip) => loadVideo(clip.blob)));
  if (!videos.some(Boolean)) throw new Error('컷 영상을 하나도 열지 못했어요');
  const duration = Math.max(...clips.map((clip) => clip.duration));

  const background = renderLayer(layout, 'background', SCALE);
  const overlay = renderLayer(layout, 'overlay', SCALE);
  const canvas = document.createElement('canvas');
  canvas.width = background.width;
  canvas.height = background.height;
  const ctx = canvas.getContext('2d');

  const draw = () => {
    ctx.drawImage(background, 0, 0);
    ctx.save();
    ctx.scale(SCALE, SCALE);
    layout.cells.forEach((cell, i) => {
      const video = videos[i];
      if (video?.readyState >= 2) {
        withCellClip(ctx, cell, () =>
          drawCover(ctx, video, video.videoWidth, video.videoHeight, cell, CONFIG.mirror));
      }
    });
    ctx.restore();
    ctx.drawImage(overlay, 0, 0);
  };

  const stream = canvas.captureStream(FPS);
  const music = await attachMusic(stream, duration);
  const recorder = recorderFor(stream);
  const done = recordInto(recorder);

  try {
    await Promise.all(videos.filter(Boolean).map((video) => video.play()));
    draw();
    recorder.start();
    music?.start();
    const startedAt = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        draw();
        const elapsed = (performance.now() - startedAt) / 1000;
        const allEnded = videos.every((video) => !video || video.ended);
        if (elapsed >= duration || (allEnded && elapsed > 0.5)) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    recorder.stop();
    return await done;
  } finally {
    music?.stop();
    stream.getTracks().forEach((track) => track.stop());
    for (const video of videos) {
      if (!video) continue;
      URL.revokeObjectURL(video.src);
      video.remove();
    }
    for (const c of [canvas, background, overlay]) c.width = c.height = 0;
  }
}

// 아이패드 사파리는 화면에 붙어 있지 않은 영상은 그림을 내주지 않을 수 있어서, 보이지 않게 붙여 둔다
function loadVideo(blob) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.style.cssText = HIDDEN;
    const timer = setTimeout(() => resolve(video.readyState >= 1 ? video : null), 8000);
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      resolve(video);
    };
    video.onerror = () => {
      clearTimeout(timer);
      video.remove();
      resolve(null);
    };
    video.src = URL.createObjectURL(blob);
    document.body.append(video);
  });
}

// 영상에 배경음악을 깐다. 스피커로는 나가지 않고 녹화에만 들어간다. 끝 0.6초는 소리를 줄인다.
async function attachMusic(stream, duration) {
  const ctx = audioContext();
  if (!CONFIG.videoMusic || !ctx?.createMediaStreamDestination) return null;
  try {
    const buffer = await loadMusic();
    const destination = ctx.createMediaStreamDestination();
    const gain = ctx.createGain();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain).connect(destination);
    stream.addTrack(destination.stream.getAudioTracks()[0]);
    return {
      start() {
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.setValueAtTime(0.9, now + Math.max(0, duration - 0.6));
        gain.gain.linearRampToValueAtTime(0, now + duration);
        source.start();
      },
      stop() {
        try { source.stop(); } catch { /* 이미 멈춤 */ }
        destination.stream.getTracks().forEach((track) => track.stop());
      },
    };
  } catch (err) {
    console.warn('영상에 음악을 넣지 못했어요', err);
    return null;
  }
}
