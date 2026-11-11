import { CONFIG } from './config.js';
import { publicFileUrl } from './storage.js';

// 손님이 QR로 여는 사진·영상 저장 페이지.
// 부스의 인터넷이 느리면 늦게 올라올 수 있어서, 없으면 잠시 뒤 다시 불러온다.
// 영상은 부스가 사진을 올린 뒤에 만들기 시작하므로 사진보다 조금 늦게 올라온다.

const RETRY_MS = 5000;
const MAX_TRIES = 60; // 약 5분

const $ = (selector) => document.querySelector(selector);
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const id = new URLSearchParams(location.search).get('id') ?? '';
const files = { photo: null, clip: null };

$('#event-line').textContent = `${CONFIG.eventTitle} · ${CONFIG.eventDate}`;

if (/^[A-Za-z0-9_-]{16,64}$/.test(id) && CONFIG.supabaseUrl) {
  waitForPhoto();
  waitForClip();
} else {
  $('#status').textContent = '사진 주소가 올바르지 않아요. QR을 다시 찍어주세요.';
  $('#clip-box').hidden = true;
  $('#save-clip').hidden = true;
}

function waitForPhoto(tries = 1) {
  const img = $('#photo');
  const url = publicFileUrl(`${id}.jpg`);
  img.onload = async () => {
    img.dataset.ready = '';
    $('#status').hidden = true;
    $('#hint').textContent = isIOS
      ? "'저장하기'를 누르고 '이미지 저장' 또는 '비디오 저장'을 고르면 사진 앱에 저장돼요. 길게 눌러도 저장할 수 있어요."
      : "'저장하기'를 누르면 휴대폰에 내려받아져요. 사진은 길게 눌러도 저장할 수 있어요.";
    files.photo = await prefetch(url, `jurinecut-${id.slice(0, 6)}.jpg`);
    $('#save').disabled = false;
  };
  img.onerror = () => {
    if (tries >= MAX_TRIES) {
      $('#status').textContent = '아직 사진이 올라오지 않았어요. 잠시 뒤 이 페이지를 새로고침해 주세요.';
      return;
    }
    $('#status').textContent = '사진을 준비하고 있어요. 잠시만 기다려 주세요…';
    setTimeout(() => waitForPhoto(tries + 1), RETRY_MS);
  };
  // 아직 안 올라온 파일의 '없음' 응답이 캐시되지 않도록, 다시 시도할 때는 주소 끝을 바꾼다
  img.src = tries === 1 ? url : `${url}?t=${Date.now()}`;
}

// 아이패드 부스는 mp4, 다른 브라우저로 테스트하면 webm이 올라온다
async function waitForClip(tries = 1) {
  for (const ext of ['mp4', 'webm']) {
    const url = publicFileUrl(`${id}.${ext}`);
    const response = await fetch(`${url}?t=${Date.now()}`, { method: 'HEAD' }).catch(() => null);
    if (response?.ok) {
      const video = $('#clip');
      video.src = url;
      video.hidden = false;
      $('#clip-status').hidden = true;
      files.clip = await prefetch(url, `jurinecut-${id.slice(0, 6)}.${ext}`);
      $('#save-clip').disabled = false;
      return;
    }
  }
  if (tries >= MAX_TRIES) {
    $('#clip-status').textContent = '영상이 아직 없어요. 잠시 뒤 새로고침해 보세요.';
    return;
  }
  setTimeout(() => waitForClip(tries + 1), RETRY_MS);
}

// 아이폰 공유 시트는 버튼을 누른 직후에 열어야 해서, 파일을 미리 받아 둔다
async function prefetch(url, name) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    return new File([blob], name, { type: blob.type });
  } catch (err) {
    console.warn('미리 받기 실패', url, err);
    return null;
  }
}

async function saveFile(file, fallbackUrl) {
  // 아이폰은 공유 시트의 '이미지 저장'·'비디오 저장'이 사진 앱으로 바로 들어간다
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
  link.href = file ? URL.createObjectURL(file) : fallbackUrl;
  link.download = file?.name ?? '';
  link.click();
}

$('#save').addEventListener('click', () => saveFile(files.photo, $('#photo').src));
$('#save-clip').addEventListener('click', () => saveFile(files.clip, $('#clip').src));
