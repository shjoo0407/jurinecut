import { FRAME } from './frames.js';

// 휴대폰에 저장되는 최종 사진 한 장의 크기(px). 아래쪽에 스티커와 날짜가 들어간다.
export const CANVAS = { width: 1800, height: 1580 };

// 컷 하나의 가로:세로 비율. 아이패드를 가로로 세우므로 가로로 긴 4:3을 쓴다.
export const CELL_ASPECT = 4 / 3;

export const LAYOUTS = {
  grid: {
    id: 'grid',
    name: '네 컷',
    desc: '네 번 찍어 2×2로',
    shots: 4,
    cells: [
      { x: 60, y: 60, w: 825, h: 619 },
      { x: 915, y: 60, w: 825, h: 619 },
      { x: 60, y: 709, w: 825, h: 619 },
      { x: 915, y: 709, w: 825, h: 619 },
    ],
  },
  single: {
    id: 'single',
    name: '한 컷',
    desc: '한 번 찍어 크게',
    shots: 1,
    cells: [{ x: 60, y: 60, w: 1680, h: 1260 }],
  },
};

let logo = null;
const tintedLogos = new Map();

// 합성은 그 자리에서 바로 그려야 해서, 로고 이미지를 미리 불러 둔다
export async function loadAssets() {
  const img = new Image();
  img.src = 'assets/logo.png';
  await img.decode();
  logo = img;
}

// 찍은 사진들을 프레임에 넣어 한 장으로 합친다.
// photos가 비어 있으면 번호가 적힌 자리 표시로 채운다(레이아웃 고르기 화면의 미리보기용).
export function renderComposite(layout, photos = [], scale = 1) {
  const { canvas, ctx } = makeCanvas(scale);
  const box = frameBox(layout);
  FRAME.drawBackground(ctx, box);
  layout.cells.forEach((cell, i) => {
    withCellClip(ctx, cell, () => {
      if (photos[i]) {
        ctx.drawImage(photos[i], cell.x, cell.y, cell.w, cell.h);
      } else {
        drawPlaceholder(ctx, cell, i + 1);
      }
    });
  });
  FRAME.drawOverlay(ctx, box, { logoIn });
  return canvas;
}

// 영상 합성용: 사진 칸 아래에 깔리는 배경, 위에 올라가는 스티커를 따로 그려 둔다
export function renderLayer(layout, which, scale) {
  const { canvas, ctx } = makeCanvas(scale);
  const box = frameBox(layout);
  if (which === 'background') FRAME.drawBackground(ctx, box);
  else FRAME.drawOverlay(ctx, box, { logoIn });
  return canvas;
}

// 원본(카메라 영상 등)의 가운데를 칸 비율로 잘라 그린다. 거울 모드면 좌우를 뒤집는다.
// 카메라 미리보기(CSS object-fit: cover)와 같은 영역이라 화면에서 본 그대로 담긴다.
export function drawCover(ctx, source, sourceW, sourceH, { x, y, w, h }, mirror) {
  const aspect = w / h;
  const sw = Math.min(sourceW, sourceH * aspect);
  const sh = sw / aspect;
  ctx.save();
  if (mirror) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
  } else {
    ctx.translate(x, y);
  }
  ctx.drawImage(source, (sourceW - sw) / 2, (sourceH - sh) / 2, sw, sh, 0, 0, w, h);
  ctx.restore();
}

export function withCellClip(ctx, cell, draw) {
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cell.x, cell.y, cell.w, cell.h, FRAME.radius);
  else ctx.rect(cell.x, cell.y, cell.w, cell.h);
  ctx.clip();
  draw();
  ctx.restore();
}

function drawPlaceholder(ctx, cell, number) {
  ctx.fillStyle = FRAME.placeholder;
  ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
  ctx.fillStyle = FRAME.placeholderText;
  ctx.font = `300 ${Math.round(cell.h / 4)}px "Apple SD Gothic Neo", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(number), cell.x + cell.w / 2, cell.y + cell.h / 2);
}

function frameBox(layout) {
  const footerTop = Math.max(...layout.cells.map((cell) => cell.y + cell.h));
  return { W: CANVAS.width, H: CANVAS.height, footerTop };
}

function makeCanvas(scale) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(CANVAS.width * scale);
  canvas.height = Math.round(CANVAS.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  return { canvas, ctx };
}

// 검은 로고를 원하는 색으로 바꾼다. 색마다 한 번만 만든다.
function logoIn(color) {
  if (!logo) return null;
  if (!tintedLogos.has(color)) {
    const canvas = document.createElement('canvas');
    canvas.width = logo.naturalWidth;
    canvas.height = logo.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(logo, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    tintedLogos.set(color, canvas);
  }
  return tintedLogos.get(color);
}
