import { drawCover } from './compose.js';

// 아이패드 전면 카메라를 켜고, 미리보기에 보이는 영역 그대로 사진을 잘라낸다.

export async function startCamera(video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1440 } },
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function capture(video, aspect, mirror) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const w = Math.round(Math.min(vw, vh * aspect));
  const h = Math.round(w / aspect);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), video, vw, vh, { x: 0, y: 0, w, h }, mirror);
  return canvas;
}
