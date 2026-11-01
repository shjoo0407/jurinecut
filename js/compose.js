import { CONFIG } from './config.js';

// 휴대폰에 저장되는 최종 사진 한 장의 크기(px). 아래쪽에 로고와 행사 이름이 들어간다.
export const CANVAS = { width: 1800, height: 1580 };

// 컷 하나의 가로:세로 비율. 아이패드를 가로로 세우므로 가로로 긴 4:3을 쓴다.
export const CELL_ASPECT = 4 / 3;

const SANS = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const LATIN = '"Helvetica Neue", "Apple SD Gothic Neo", sans-serif';

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

// 레이아웃과 프레임에 맞춰 사진들을 한 장으로 합친다.
// photos가 비어 있으면 번호가 적힌 자리 표시로 채운다(레이아웃 고르기 화면의 미리보기용).
export function renderComposite(layout, frame, photos = [], scale = 1) {
  const { width: W, height: H } = CANVAS;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const footerTop = Math.max(...layout.cells.map((cell) => cell.y + cell.h));
  frame.drawBackground(ctx, { W, H, footerTop });

  layout.cells.forEach((cell, i) => {
    ctx.save();
    clipRounded(ctx, cell, frame.radius ?? 14);
    if (photos[i]) {
      ctx.drawImage(photos[i], cell.x, cell.y, cell.w, cell.h);
    } else {
      ctx.fillStyle = frame.placeholder;
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      ctx.fillStyle = frame.sub;
      ctx.font = `300 ${Math.round(cell.h / 4)}px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), cell.x + cell.w / 2, cell.y + cell.h / 2);
    }
    ctx.restore();
  });

  drawFooter(ctx, frame, W, (footerTop + H) / 2);
  return canvas;
}

// 아래쪽: 왼쪽에 로고와 행사 이름, 오른쪽에 주리네컷과 날짜
function drawFooter(ctx, frame, W, centerY) {
  let textX = 60;
  const mark = logoIn(frame.logo);
  if (mark) {
    const h = 150;
    const w = (h * mark.width) / mark.height;
    ctx.drawImage(mark, 60, centerY - h / 2, w, h);
    textX += w + 34;
  }

  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = frame.text;
  ctx.font = `300 68px ${SANS}`;
  ctx.fillText(CONFIG.eventTitle, textX, centerY + 6);
  ctx.fillStyle = frame.sub;
  ctx.font = `300 34px ${LATIN}`;
  ctx.fillText(CONFIG.eventSubtitle, textX + 2, centerY + 56);

  ctx.textAlign = 'right';
  ctx.fillStyle = frame.text;
  ctx.font = `600 46px ${SANS}`;
  ctx.fillText('주리네컷', W - 60, centerY + 6);
  ctx.fillStyle = frame.sub;
  ctx.font = `300 32px ${LATIN}`;
  ctx.fillText(CONFIG.eventDate, W - 60, centerY + 56);
}

// 검은 로고를 프레임에 맞는 색으로 바꾼다. 색마다 한 번만 만든다.
function logoIn(color) {
  if (!logo || !color) return null;
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

function clipRounded(ctx, { x, y, w, h }, radius) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.clip();
}
