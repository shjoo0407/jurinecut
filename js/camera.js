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

// 미리보기는 영상 가운데를 aspect 비율로 잘라 보여준다(CSS object-fit: cover).
// 사진도 같은 영역을 잘라야 화면에서 본 그대로 찍힌다.
export function capture(video, aspect, mirror) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const sw = Math.min(vw, vh * aspect);
  const sh = sw / aspect;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext('2d');
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}
