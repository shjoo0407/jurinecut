import { CONFIG } from './config.js';
import { publicImageUrl } from './storage.js';

// 손님이 QR로 여는 사진 저장 페이지.
// 부스의 인터넷이 느리면 사진이 조금 늦게 올라올 수 있어서, 없으면 잠시 뒤 다시 불러온다.

const RETRY_MS = 5000;
const MAX_TRIES = 60; // 약 5분

const img = document.querySelector('#photo');
const status = document.querySelector('#status');
const saveButton = document.querySelector('#save');
const hint = document.querySelector('#hint');

const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const id = new URLSearchParams(location.search).get('id') ?? '';
let file = null;
let tries = 0;

document.querySelector('#event-line').textContent = `${CONFIG.eventTitle} · ${CONFIG.eventDate}`;

if (/^[A-Za-z0-9_-]{16,64}$/.test(id) && CONFIG.supabaseUrl) {
  img.addEventListener('load', onLoaded);
  img.addEventListener('error', onMissing);
  load();
} else {
  status.textContent = '사진 주소가 올바르지 않아요. QR을 다시 찍어주세요.';
}

function load() {
  tries += 1;
  // 아직 안 올라온 사진의 '없음' 응답이 캐시되지 않도록, 다시 시도할 때는 주소 끝을 바꾼다
  img.src = tries === 1 ? publicImageUrl(id) : `${publicImageUrl(id)}?t=${Date.now()}`;
}

function onMissing() {
  if (tries >= MAX_TRIES) {
    status.textContent = '아직 사진이 올라오지 않았어요. 잠시 뒤 이 페이지를 새로고침해 주세요.';
    return;
  }
  status.textContent = '사진을 준비하고 있어요. 잠시만 기다려 주세요…';
  setTimeout(load, RETRY_MS);
}

async function onLoaded() {
  img.dataset.ready = '';
  status.hidden = true;
  hint.textContent = isIOS
    ? "'사진 저장하기'를 누르고 '이미지 저장'을 고르면 사진 앱에 저장돼요. 사진을 길게 눌러도 저장할 수 있어요."
    : "'사진 저장하기'를 누르면 휴대폰에 내려받아져요. 사진을 길게 눌러도 저장할 수 있어요.";

  // 아이폰 공유 시트는 버튼을 누른 직후에 열어야 해서, 파일을 미리 받아 둔다
  try {
    const response = await fetch(img.src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    file = new File([await response.blob()], `jurinecut-${id.slice(0, 6)}.jpg`, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('사진 미리 받기 실패', err);
  }
  saveButton.disabled = false;
}

saveButton.addEventListener('click', async () => {
  // 아이폰은 공유 시트의 '이미지 저장'이 사진 앱으로 바로 들어간다
  if (isIOS && file && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }
  // 그 밖의 휴대폰은 파일로 내려받는다
  const link = document.createElement('a');
  link.href = file ? URL.createObjectURL(file) : img.src;
  link.download = file?.name ?? 'jurinecut.jpg';
  link.click();
});
