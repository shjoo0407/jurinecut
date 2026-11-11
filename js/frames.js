// 프레임 디자인: 검은 바탕에 자수 패치 스티커를 사진 모서리에 걸쳐 붙인다.
// 스티커는 주리랑 로고, '주리랑' 글자, '어우름 창립제', '41st Homecoming' 배지.

import { CONFIG } from './config.js';

const SANS = '"Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const LATIN = '"Avenir Next", "Helvetica Neue", sans-serif';

const INK = '#141416';    // 패치 바탕
const THREAD = '#f3efe6'; // 테두리 실(크림색)
const GOLD = '#f5c451';   // 포스터 노을빛에서 가져온 강조색

export const FRAME = {
  radius: 22,
  placeholder: '#1e1e22',
  placeholderText: '#55555c',

  drawBackground(ctx, { W, H }) {
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, W, H);
  },

  // 사진 위에 올라가는 스티커와 날짜. 레이아웃이 달라도 네 모서리 근처에 같은 자리로 붙는다.
  drawOverlay(ctx, { W, H, footerTop }, { logoIn }) {
    const footerY = (footerTop + H) / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7d7d86';
    ctx.font = `600 34px ${SANS}`;
    ctx.fillText(`주리네컷  ·  ${CONFIG.eventDate}`, W / 2, footerY + 70);

    sparkle(ctx, W / 2 - 250, footerY - 10, 26, GOLD);
    sparkle(ctx, W / 2 - 205, footerY + 28, 12, THREAD);
    sparkle(ctx, W - 32, footerTop - 520, 18, THREAD);

    // '주리랑' 글자 패치: 오른쪽 위 모서리
    patch(ctx, { x: W - 230, y: 112, w: 380, h: 132, rotate: 6, shape: 'round' }, () => {
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 76px ${SANS}`;
      ctx.fillText('주리랑', 22, 4);
      sparkle(ctx, -118, -2, 22, GOLD);
    });

    // 로고 패치: 왼쪽 가장자리 가운데
    patch(ctx, { x: 170, y: footerTop / 2 + 30, w: 300, h: 224, rotate: -8, shape: 'oval' }, () => {
      const mark = logoIn(GOLD);
      if (!mark) return;
      const h = 150;
      const w = (h * mark.width) / mark.height;
      ctx.drawImage(mark, -w / 2, -h / 2, w, h);
    });

    // 41st 배지: 왼쪽 아래 모서리
    patch(ctx, { x: 214, y: footerTop + 6, w: 250, h: 286, rotate: -10, shape: 'hexagon' }, () => {
      sparkle(ctx, 0, -78, 20, THREAD);
      ctx.fillStyle = GOLD;
      ctx.font = `800 78px ${LATIN}`;
      ctx.fillText('41st', 0, 2);
      ctx.font = `700 22px ${LATIN}`;
      ctx.fillText('HOMECOMING', 0, 58);
    });

    // '어우름 창립제' 패치: 오른쪽 아래 모서리
    patch(ctx, { x: W - 300, y: footerTop + 20, w: 470, h: 140, rotate: -5, shape: 'round' }, () => {
      ctx.fillStyle = GOLD;
      ctx.font = `800 66px ${SANS}`;
      ctx.fillText(CONFIG.eventTitle, 0, 4);
    });
  },
};

// 자수 패치: 그림자 → 크림색 테두리 → 짙은 바탕 → 실 결 → 바느질 점선 → 내용
function patch(ctx, { x, y, w, h, rotate, shape }, drawContent) {
  const border = 12;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotate * Math.PI) / 180);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  outline(ctx, shape, w, h);
  ctx.fillStyle = THREAD;
  ctx.fill();
  ctx.restore();

  outline(ctx, shape, w - border * 2, h - border * 2);
  ctx.fillStyle = INK;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.lineWidth = 2;
  for (let d = -w - h; d < w + h; d += 7) {
    ctx.beginPath();
    ctx.moveTo(d - h / 2, -h / 2);
    ctx.lineTo(d + h / 2, h / 2);
    ctx.stroke();
  }
  ctx.restore();

  ctx.setLineDash([9, 7]);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = 'rgba(243, 239, 230, 0.35)';
  outline(ctx, shape, w - border * 2 - 18, h - border * 2 - 18);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawContent();
  ctx.restore();
}

// (0, 0)을 가운데로 하는 도형 경로
function outline(ctx, shape, w, h) {
  ctx.beginPath();
  if (shape === 'oval') {
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'hexagon') {
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      const px = (w / 2) * Math.cos(angle);
      const py = (h / 2) * Math.sin(angle);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    const r = Math.min(h / 2, 34);
    if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r);
    else ctx.rect(-w / 2, -h / 2, w, h);
  }
}

// 로고의 네 갈래 별
function sparkle(ctx, x, y, r, color) {
  const w = r * 0.62;
  const k = r * 0.1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k, y - k, x + w, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + r);
  ctx.quadraticCurveTo(x - k, y + k, x - w, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - r);
  ctx.fill();
}
