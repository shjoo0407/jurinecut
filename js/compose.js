import { CONFIG } from './config.js';

// 휴대폰에 저장되는 최종 사진 한 장의 크기(px)
export const CANVAS = { width: 1800, height: 1500 };

// 컷 하나의 가로:세로 비율. 아이패드를 가로로 세우므로 가로로 긴 4:3을 쓴다.
export const CELL_ASPECT = 4 / 3;

const FONT = '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';

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
    footerY: 1414,
  },
  single: {
    id: 'single',
    name: '한 컷',
    desc: '한 번 찍어 크게',
    shots: 1,
    cells: [{ x: 60, y: 60, w: 1680, h: 1260 }],
    footerY: 1410,
  },
};

// 레이아웃과 프레임에 맞춰 사진들을 한 장으로 합친다.
// photos가 비어 있으면 번호가 적힌 자리 표시로 채운다(프레임 고르기 화면의 미리보기용).
export function renderComposite(layout, frame, photos = [], scale = 1) {
  const { width: W, height: H } = CANVAS;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  frame.drawBackground(ctx, W, H);

  layout.cells.forEach((cell, i) => {
    ctx.save();
    clipRounded(ctx, cell, frame.radius ?? 14);
    if (photos[i]) {
      ctx.drawImage(photos[i], cell.x, cell.y, cell.w, cell.h);
    } else {
      ctx.fillStyle = frame.placeholder;
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
      ctx.fillStyle = frame.sub;
      ctx.font = `700 ${Math.round(cell.h / 4)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), cell.x + cell.w / 2, cell.y + cell.h / 2);
    }
    ctx.restore();
  });

  drawFooter(ctx, layout, frame, W);
  return canvas;
}

function drawFooter(ctx, layout, frame, W) {
  ctx.textBaseline = 'middle';

  ctx.fillStyle = frame.text;
  ctx.textAlign = 'left';
  ctx.font = `800 76px ${FONT}`;
  ctx.fillText('주리네컷', 60, layout.footerY);

  ctx.fillStyle = frame.sub;
  ctx.textAlign = 'right';
  ctx.font = `500 36px ${FONT}`;
  ctx.fillText(`${CONFIG.eventTitle} · ${CONFIG.eventDate}`, W - 60, layout.footerY);
}

function clipRounded(ctx, { x, y, w, h }, radius) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.clip();
}
