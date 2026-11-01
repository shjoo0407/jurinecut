// 프레임 디자인. 주리랑 로고(반짝이는 별)와 '어우름 창립제' 포스터
// (블라인드 사이로 들어오는 노을빛, 숲속 무대, 전구 줄)를 참고했다.
// 프레임마다 배경 그리기 함수와 글자·로고·자리 표시 색을 정한다.

export const FRAMES = [
  {
    id: 'golden',
    name: '골든아워',
    text: '#ffffff',
    sub: 'rgba(255, 255, 255, 0.85)',
    logo: '#ffffff',
    placeholder: 'rgba(255, 255, 255, 0.35)',
    drawBackground: drawBlinds,
  },
  {
    id: 'white',
    name: '화이트',
    text: '#1b1b1f',
    sub: '#7c7c86',
    logo: '#1b1b1f',
    placeholder: '#ececf0',
    drawBackground(ctx, box) {
      fill(ctx, box, '#ffffff');
      drawFooterSparkles(ctx, box, '#1b1b1f');
    },
  },
  {
    id: 'film',
    name: '필름',
    text: '#ffffff',
    sub: '#a3a3ad',
    logo: '#ffffff',
    placeholder: '#26262c',
    radius: 4,
    drawBackground(ctx, box) {
      fill(ctx, box, '#0d0d0f');
      drawSprockets(ctx, box);
    },
  },
  {
    id: 'score',
    name: '오선지',
    text: '#3a2c24',
    sub: '#8c7a6b',
    logo: '#3a2c24',
    placeholder: '#e8dccb',
    drawBackground(ctx, box) {
      fill(ctx, box, '#f7f0e4');
      drawStaves(ctx, box, 'rgba(58, 44, 36, 0.16)');
    },
  },
  {
    id: 'lights',
    name: '전구 불빛',
    text: '#fff6e6',
    sub: '#e9c98f',
    logo: '#f2c46d',
    placeholder: '#2a2219',
    drawBackground(ctx, box) {
      const { W, H } = box;
      const glow = ctx.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, W * 0.8);
      glow.addColorStop(0, '#2e2318');
      glow.addColorStop(1, '#0c0a08');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
      drawBokeh(ctx, box, { seed: 11, count: 46, rgb: '255, 196, 110' });
      drawStringLights(ctx, box);
      drawFooterSparkles(ctx, box, '#f2c46d');
    },
  },
  {
    id: 'forest',
    name: '숲속 무대',
    text: '#f4efe2',
    sub: '#cdbf95',
    logo: '#d9b866',
    placeholder: '#2c3a2f',
    drawBackground(ctx, box) {
      const { W, H } = box;
      const ground = ctx.createLinearGradient(0, 0, 0, H);
      ground.addColorStop(0, '#22312a');
      ground.addColorStop(1, '#0f1813');
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, W, H);
      drawBokeh(ctx, box, { seed: 5, count: 60, rgb: '214, 200, 120' });
    },
  },
];

function fill(ctx, { W, H }, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

// 포스터의 블라인드: 노을빛 위에 회청색 블라인드 날개를 겹치고, 아래는 어둡게 해 흰 글씨를 살린다
function drawBlinds(ctx, { W, H }) {
  const light = ctx.createLinearGradient(0, 0, W, H);
  light.addColorStop(0, '#ffd789');
  light.addColorStop(0.5, '#e39b3f');
  light.addColorStop(1, '#5b6531');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);

  const slat = 62;
  const gap = 14;
  for (let y = -30; y < H; y += slat + gap) {
    const shade = ctx.createLinearGradient(0, y, 0, y + slat);
    shade.addColorStop(0, '#d3d9de');
    shade.addColorStop(0.5, '#a9b2bb');
    shade.addColorStop(1, '#78828c');
    ctx.fillStyle = shade;
    ctx.fillRect(0, y, W, slat);
  }

  // 블라인드 줄은 가운데 하나만. 네 컷일 때는 사진 사이 틈으로 지나간다.
  ctx.strokeStyle = 'rgba(244, 240, 232, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(W / 2, 0);
  ctx.lineTo(W / 2, H);
  ctx.stroke();

  const dusk = ctx.createLinearGradient(0, H - 380, 0, H);
  dusk.addColorStop(0, 'rgba(22, 24, 30, 0)');
  dusk.addColorStop(0.6, 'rgba(22, 24, 30, 0.6)');
  dusk.addColorStop(1, 'rgba(22, 24, 30, 0.8)');
  ctx.fillStyle = dusk;
  ctx.fillRect(0, H - 380, W, 380);
}

// 필름 가장자리의 구멍
function drawSprockets(ctx, { W, H }) {
  ctx.fillStyle = '#e8e8ec';
  for (let x = 24; x < W; x += 72) {
    for (const y of [16, H - 44]) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, 38, 26, 5);
      else ctx.rect(x, y, 38, 26);
      ctx.fill();
    }
  }
}

// 다섯 줄짜리 오선을 일정 간격으로 반복해 악보 종이처럼 보이게 한다
function drawStaves(ctx, { W, H }, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let top = 24; top < H; top += 120) {
    for (let line = 0; line < 5; line++) {
      const y = top + line * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }
}

// 초점이 나간 전구 불빛, 나뭇잎 사이 햇빛 같은 동그란 빛망울
function drawBokeh(ctx, { W, H }, { seed, count, rgb }) {
  const rand = seeded(seed);
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 24 + rand() * 70;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, `rgba(${rgb}, ${0.18 + rand() * 0.22})`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 포스터의 전구 줄: 위쪽 여백을 따라 살짝 늘어진 전선과 전구
function drawStringLights(ctx, { W }) {
  const sag = (x) => 18 + 22 * Math.sin((Math.PI * x) / W);
  ctx.strokeStyle = 'rgba(40, 32, 22, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 20) ctx.lineTo(x, sag(x));
  ctx.stroke();

  for (let x = 45; x < W; x += 90) {
    const y = sag(x) + 10;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 30);
    halo.addColorStop(0, 'rgba(255, 214, 140, 0.9)');
    halo.addColorStop(1, 'rgba(255, 214, 140, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff1cf';
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 로고의 네 갈래 별을 행사 이름 오른쪽에 몇 개 띄운다
function drawFooterSparkles(ctx, { H, footerTop }, color) {
  const cy = (footerTop + H) / 2;
  ctx.fillStyle = color;
  sparkle(ctx, 730, cy - 34, 26);
  sparkle(ctx, 768, cy + 4, 13);
  sparkle(ctx, 712, cy + 20, 9);
}

function sparkle(ctx, x, y, r) {
  const w = r * 0.62;
  const k = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + k, y - k, x + w, y);
  ctx.quadraticCurveTo(x + k, y + k, x, y + r);
  ctx.quadraticCurveTo(x - k, y + k, x - w, y);
  ctx.quadraticCurveTo(x - k, y - k, x, y - r);
  ctx.fill();
}

// 미리보기와 실제 사진에서 무늬 위치가 같도록 고정된 난수열을 쓴다
function seeded(seed) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}
