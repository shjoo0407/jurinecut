// 프레임 디자인. 실제 디자인 자료가 오기 전까지 쓰는 임시 프레임들이다.
// 프레임마다 배경을 그리는 함수와 글자·자리 표시 색을 정한다.

export const FRAMES = [
  {
    id: 'white',
    name: '화이트',
    text: '#17171c',
    sub: '#8a8a94',
    placeholder: '#ececf1',
    drawBackground: fill('#ffffff'),
  },
  {
    id: 'black',
    name: '블랙',
    text: '#ffffff',
    sub: '#9a9aa6',
    placeholder: '#26262d',
    drawBackground: fill('#111114'),
  },
  {
    id: 'score',
    name: '오선지',
    text: '#3a2c24',
    sub: '#8c7a6b',
    placeholder: '#e8dccb',
    drawBackground(ctx, W, H) {
      fill('#f7f0e4')(ctx, W, H);
      drawStaves(ctx, W, H, 'rgba(58, 44, 36, 0.16)');
    },
  },
  {
    id: 'stage',
    name: '공연의 밤',
    text: '#ffffff',
    sub: '#f3c6dd',
    placeholder: '#3a1f5c',
    drawBackground(ctx, W, H) {
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, '#1d0f3d');
      gradient.addColorStop(1, '#b0306a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
      drawStars(ctx, W, H);
    },
  },
];

function fill(color) {
  return (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
  };
}

// 다섯 줄짜리 오선을 일정 간격으로 반복해 악보 종이처럼 보이게 한다
function drawStaves(ctx, W, H, color) {
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

// 미리보기와 실제 사진에서 별 위치가 같도록 고정된 난수열을 쓴다
function drawStars(ctx, W, H) {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 140; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = rand() * 2.5 + 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
