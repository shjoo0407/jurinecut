// 프레임 디자인: 검은 바탕에 자수 패치 스티커를 사진 가장자리에 걸쳐 붙인다.
// 스티커는 '주리랑' 글자, 통기타, 피아노 건반, '41st Homecoming' 배지, '어우름 창립제'.

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

  // 사진 위에 올라가는 스티커와 날짜. 레이아웃이 달라도 가장자리 근처의 같은 자리에 붙는다.
  drawOverlay(ctx, { W, H, footerTop }) {
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

    // 통기타 패치: 왼쪽 가장자리, 위아래 사진 사이
    patch(ctx, { x: 170, y: footerTop / 2 + 30, w: 300, h: 224, rotate: -8, shape: 'oval' }, () => {
      drawGuitar(ctx, 0.75);
    });

    // 피아노 건반 패치: 오른쪽 가장자리, 아래쪽 사진 옆
    patch(ctx, { x: W - 180, y: footerTop * 0.76, w: 340, h: 156, rotate: 7, shape: 'round' }, () => {
      drawKeys(ctx);
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

// 금색 선으로 그린 통기타. 넥이 오른쪽 위를 향하게 비스듬히 눕힌다.
// 몸통은 아래쪽 큰 원과 위쪽 작은 원을 이어 붙인 모양이다.
function drawGuitar(ctx, scale) {
  const lower = { y: 40, r: 52 };
  const upper = { y: -22, r: 38 };
  const d = lower.y - upper.y;
  const a = (lower.r ** 2 - upper.r ** 2 + d ** 2) / (2 * d); // 아래 원 중심에서 두 원이 만나는 높이까지
  const half = Math.sqrt(lower.r ** 2 - a ** 2);               // 두 원이 만나는 점의 x
  const meetY = lower.y - a;
  const lowerStart = Math.atan2(meetY - lower.y, half);
  const upperStart = Math.atan2(meetY - upper.y, -half);

  ctx.save();
  ctx.rotate(1.0); // 가로로 긴 타원 패치에 맞게 많이 눕힌다
  ctx.scale(scale, scale);
  ctx.translate(0, 47); // 머리(-186)부터 몸통 끝(92)까지의 가운데를 원점에 맞춘다
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 6;

  ctx.beginPath();
  ctx.arc(0, lower.y, lower.r, lowerStart, Math.PI - lowerStart);
  ctx.arc(0, upper.y, upper.r, upperStart, Math.PI * 3 - upperStart);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -2, 14, 0, Math.PI * 2); // 울림구멍
  ctx.stroke();
  ctx.fillRect(-16, 56, 32, 7);       // 브리지

  ctx.beginPath();                    // 넥
  ctx.moveTo(-8, -57);
  ctx.lineTo(-8, -150);
  ctx.moveTo(8, -57);
  ctx.lineTo(8, -150);
  ctx.stroke();

  ctx.beginPath();                    // 머리
  if (ctx.roundRect) ctx.roundRect(-12, -184, 24, 34, 6);
  else ctx.rect(-12, -184, 24, 34);
  ctx.stroke();
  for (const [x, y] of [[-18, -174], [-18, -160], [18, -174], [18, -160]]) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.lineWidth = 2;                  // 프렛과 줄
  ctx.beginPath();
  for (const y of [-82, -104, -124, -142]) {
    ctx.moveTo(-8, y);
    ctx.lineTo(8, y);
  }
  for (const x of [-4, 0, 4]) {
    ctx.moveTo(x, 56);
    ctx.lineTo(x, -150);
  }
  ctx.stroke();
  ctx.restore();
}

// 피아노 건반: 금색 덮개 아래 흰 건반 10개(도부터 미까지), 그 위에 검은 건반을 얹는다
function drawKeys(ctx) {
  const count = 10;
  const keyW = 24;
  const keyH = 78;
  const gap = 3;
  const total = count * keyW + (count - 1) * gap;
  const left = -total / 2;
  const top = -keyH / 2 + 8;

  ctx.fillStyle = GOLD;
  ctx.fillRect(left - 4, top - 14, total + 8, 10);

  ctx.fillStyle = THREAD;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(left + i * (keyW + gap), top, keyW, keyH, [0, 0, 4, 4]);
    else ctx.rect(left + i * (keyW + gap), top, keyW, keyH);
    ctx.fill();
  }

  ctx.fillStyle = INK;
  for (const i of [0, 1, 3, 4, 5, 7, 8]) { // 이 흰 건반 오른쪽에 검은 건반이 있다
    const x = left + (i + 1) * (keyW + gap) - gap / 2;
    ctx.fillRect(x - 8, top, 16, keyH * 0.58);
  }
}

// 네 갈래 별
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
