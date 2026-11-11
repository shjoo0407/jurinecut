// 프레임 디자인: 검은 바탕에 자수 패치 스티커를 사진 가장자리에 걸쳐 붙인다.
// 스티커는 '주리랑' 글자, 통기타, 피아노 건반, '41st Homecoming' 배지, '어우름 창립제'.
// 세로 네 컷은 사진이 길어서 스티커를 조금 키우고 마이크 스티커를 하나 더 붙인다.

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
  // s는 스티커 크기 배율. 스티커가 커져도 캔버스 가장자리와의 간격은 그대로 두도록 위치에도 곱한다.
  drawOverlay(ctx, { W, H, footerTop, layoutId }) {
    const strip = layoutId === 'strip';
    const s = strip ? 1.2 : 1;
    const footerY = (footerTop + H) / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7d7d86';
    ctx.font = `600 34px ${SANS}`;
    ctx.fillText(`주리네컷  ·  ${CONFIG.eventDate}`, W / 2, footerY + 70);

    // 세로 네 컷은 아래쪽이 좁아서 별을 날짜 오른쪽으로 옮긴다
    const [starX, starY] = strip ? [W / 2 + 230, footerY + 60] : [W / 2 - 250, footerY - 10];
    sparkle(ctx, starX, starY, 26, GOLD);
    sparkle(ctx, starX + 45, starY + 38, 12, THREAD);
    sparkle(ctx, W - 32, strip ? footerTop - 520 : footerTop * 0.76, 18, THREAD);

    // '주리랑' 글자 패치: 오른쪽 위 모서리
    patch(ctx, { x: W - 40 - 190 * s, y: 46 + 66 * s, w: 380, h: 132, rotate: 6, shape: 'round', scale: s }, () => {
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 76px ${SANS}`;
      ctx.fillText('주리랑', 22, 4);
      sparkle(ctx, -118, -2, 22, GOLD);
    });

    // 마이크 모양 스티커(세로 네 컷만): 오른쪽 가장자리, 첫째·둘째 사진 사이. 머리가 왼쪽 위를 향한다.
    if (strip) micSticker(ctx, { x: W - 150, y: footerTop * 0.26, rotate: -30, scale: 1.5 });

    // 통기타 모양 스티커: 왼쪽 가장자리, 위아래 사진 사이. 넥이 오른쪽 위를 향한다.
    guitarSticker(ctx, { x: 175 * s, y: footerTop / 2 + 30, rotate: 32, scale: 1.4 * s });

    // 피아노 건반 패치: 오른쪽 가장자리. 2×2는 2번·4번 사진 사이(기타와 마주 보게),
    // 세로 네 컷은 셋째·넷째 사진 사이
    const pianoY = strip ? footerTop * 0.76 : footerTop / 2 + 20;
    patch(ctx, { x: W - 10 - 170 * s, y: pianoY, w: 340, h: 156, rotate: 7, shape: 'round', scale: s }, () => {
      drawKeys(ctx);
    });

    // 41st 배지: 왼쪽 아래 모서리
    patch(ctx, { x: 214 * s, y: footerTop + 6, w: 250, h: 286, rotate: -10, shape: 'hexagon', scale: s }, () => {
      sparkle(ctx, 0, -78, 20, THREAD);
      ctx.fillStyle = GOLD;
      ctx.font = `800 78px ${LATIN}`;
      ctx.fillText('41st', 0, 2);
      ctx.font = `700 22px ${LATIN}`;
      ctx.fillText('HOMECOMING', 0, 58);
    });

    // '어우름 창립제' 패치: 오른쪽 아래 모서리
    patch(ctx, { x: W - 65 - 235 * s, y: footerTop + 20, w: 470, h: 140, rotate: -5, shape: 'round', scale: s }, () => {
      ctx.fillStyle = GOLD;
      ctx.font = `800 66px ${SANS}`;
      ctx.fillText(CONFIG.eventTitle, 0, 4);
    });
  },
};

// 자수 패치: 그림자 → 크림색 테두리 → 짙은 바탕 → 실 결 → 바느질 점선 → 내용
function patch(ctx, { x, y, w, h, rotate, shape, scale = 1 }, drawContent) {
  const border = 12;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);

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
  threadTexture(ctx, w, h, 1);

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

// 실 결: 짙은 바탕 위에 아주 옅은 사선을 촘촘히 긋는다. 방금 만든 경로 안쪽에만 그린다.
function threadTexture(ctx, w, h, scale) {
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.045)';
  ctx.lineWidth = 2 / scale;
  for (let d = -w - h; d < w + h; d += 7 / scale) {
    ctx.beginPath();
    ctx.moveTo(d - h / 2, -h / 2);
    ctx.lineTo(d + h / 2, h / 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 모양대로 오려낸 자수 스티커: 크림색 테두리가 윤곽을 따라가고 안쪽은 짙은 바탕.
// centerY는 그림 좌표에서 스티커 가운데의 y. 그 점을 (x, y)에 놓는다.
function cutSticker(ctx, { x, y, rotate, scale, centerY }, drawOutline, drawDetails) {
  const unit = 1 / scale; // 캔버스 1px에 해당하는 그림 좌표 길이
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.translate(0, -centerY);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 테두리: 윤곽을 굵게 칠해 바깥으로 12px 두른다(안쪽으로 번진 부분은 바탕이 덮는다)
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 8;
  drawOutline(ctx);
  ctx.lineWidth = 24 * unit;
  ctx.strokeStyle = THREAD;
  ctx.stroke();
  ctx.restore();

  drawOutline(ctx);
  ctx.fillStyle = INK;
  ctx.fill();
  threadTexture(ctx, 400, 600, scale);

  drawDetails(unit);
  ctx.restore();
}

// 통기타 모양 스티커: 금색 울림구멍·브리지·프렛·줄감개, 크림색 줄.
// 기타 좌표는 머리 끝 y=-188부터 몸통 끝 y=92까지다.
function guitarSticker(ctx, placement) {
  cutSticker(ctx, { ...placement, centerY: -48 }, guitarOutline, (unit) => guitarDetails(ctx, unit));
}

function guitarDetails(ctx, unit) {
  // 바느질 점선: 몸통 안쪽을 한 바퀴
  ctx.save();
  ctx.translate(0, 16);
  ctx.scale(0.84, 0.87);
  ctx.translate(0, -16);
  ctx.beginPath();
  guitarBody(ctx);
  ctx.restore();
  ctx.setLineDash([9 * unit, 7 * unit]);
  ctx.lineWidth = 2.5 * unit;
  ctx.strokeStyle = 'rgba(243, 239, 230, 0.35)';
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 5 * unit;
  ctx.beginPath();
  ctx.arc(0, -2, 15, 0, Math.PI * 2); // 울림구멍
  ctx.stroke();
  ctx.fillRect(-18, 54, 36, 8);       // 브리지

  ctx.lineWidth = 2.5 * unit;         // 프렛
  ctx.beginPath();
  for (const fret of [-82, -104, -124, -142]) {
    ctx.moveTo(-9, fret);
    ctx.lineTo(9, fret);
  }
  ctx.stroke();
  for (const [px, py] of [[-6, -176], [6, -176], [-6, -162], [6, -162]]) { // 줄감개
    ctx.beginPath();
    ctx.arc(px, py, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = THREAD;           // 줄
  ctx.lineWidth = 1.4 * unit;
  ctx.beginPath();
  for (const sx of [-5, -1.7, 1.7, 5]) {
    ctx.moveTo(sx, 58);
    ctx.lineTo(sx, -150);
  }
  ctx.stroke();
}

// 기타 전체 윤곽: 몸통 + 넥 + 머리. 겹치는 부분은 하나로 칠해진다.
function guitarOutline(ctx) {
  ctx.beginPath();
  guitarBody(ctx);
  ctx.rect(-10, -150, 20, 100);
  if (ctx.roundRect) ctx.roundRect(-14, -188, 28, 42, 8);
  else ctx.rect(-14, -188, 28, 42);
}

// 몸통: 아래쪽 큰 원과 위쪽 작은 원을 이어 붙인 모양(두 원이 만나는 점에서 잘록해진다)
function guitarBody(ctx) {
  const lower = { y: 40, r: 52 };
  const upper = { y: -22, r: 38 };
  const d = lower.y - upper.y;
  const a = (lower.r ** 2 - upper.r ** 2 + d ** 2) / (2 * d); // 아래 원 중심에서 두 원이 만나는 높이까지
  const half = Math.sqrt(lower.r ** 2 - a ** 2);               // 두 원이 만나는 점의 x
  const meetY = lower.y - a;
  const lowerStart = Math.atan2(meetY - lower.y, half);
  const upperStart = Math.atan2(meetY - upper.y, -half);
  ctx.moveTo(half, meetY);
  ctx.arc(0, lower.y, lower.r, lowerStart, Math.PI - lowerStart);
  ctx.arc(0, upper.y, upper.r, upperStart, Math.PI * 3 - upperStart);
  ctx.closePath();
}

// 마이크 모양 스티커: 동그란 머리(금색 그물망), 금색 띠, 아래로 가늘어지는 손잡이.
// 마이크 좌표는 머리 끝 y=-102부터 손잡이 끝 y=122까지다.
const MIC_HEAD = { y: -60, r: 42 };

function micSticker(ctx, placement) {
  cutSticker(ctx, { ...placement, centerY: 10 }, micOutline, (unit) => micDetails(ctx, unit));
}

function micOutline(ctx) {
  ctx.beginPath();
  ctx.arc(0, MIC_HEAD.y, MIC_HEAD.r, 0, Math.PI * 2);
  ctx.rect(-24, -24, 48, 18);       // 머리와 손잡이 사이 띠
  ctx.moveTo(-20, -8);              // 손잡이: 아래로 갈수록 가늘고 끝은 둥글다
  ctx.lineTo(20, -8);
  ctx.lineTo(12, 110);
  ctx.arc(0, 110, 12, 0, Math.PI);
  ctx.closePath();
}

function micDetails(ctx, unit) {
  // 그물망: 머리 안쪽에 금색 사선을 엇갈려 긋는다
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, MIC_HEAD.y, MIC_HEAD.r - 10, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2 * unit;
  ctx.beginPath();
  for (let d = -80; d <= 80; d += 10) {
    ctx.moveTo(d - 40, MIC_HEAD.y - 40);
    ctx.lineTo(d + 40, MIC_HEAD.y + 40);
    ctx.moveTo(d + 40, MIC_HEAD.y - 40);
    ctx.lineTo(d - 40, MIC_HEAD.y + 40);
  }
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 4 * unit;
  ctx.beginPath();
  ctx.arc(0, MIC_HEAD.y, MIC_HEAD.r - 9, 0, Math.PI * 2); // 그물망 테두리
  ctx.stroke();
  ctx.fillRect(-24, -24, 48, 18);                          // 띠

  // 손잡이 스위치와 바느질 점선
  ctx.strokeStyle = THREAD;
  ctx.lineWidth = 2.5 * unit;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-5, 18, 10, 26, 5);
  else ctx.rect(-5, 18, 10, 26);
  ctx.stroke();
  ctx.setLineDash([9 * unit, 7 * unit]);
  ctx.strokeStyle = 'rgba(243, 239, 230, 0.35)';
  ctx.beginPath();
  ctx.moveTo(-10, 54);
  ctx.lineTo(-6, 112);
  ctx.moveTo(10, 54);
  ctx.lineTo(6, 112);
  ctx.stroke();
  ctx.setLineDash([]);
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
