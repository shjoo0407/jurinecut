import { CONFIG } from './config.js';
import { LAYOUTS, CELL_ASPECT, renderComposite } from './compose.js';
import { startCamera, capture } from './camera.js';
import { canRecordVideo, recordClip, composeVideo } from './video.js';
import { unlockAudio, beep, shutter } from './sound.js';
import {
  isConfigured, newPhotoId, photoPageUrl, saveFile, uploadFile, retryPending, pendingCount,
} from './storage.js';

// 부스 화면 흐름: 시작 → 레이아웃 → 촬영 → 확인 → QR → 다시 시작
// 촬영하는 동안 컷마다 짧은 영상도 녹화해 두었다가, 저장하면 영상 한 편으로 합쳐 함께 올린다.

const $ = (selector) => document.querySelector(selector);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PREVIEW_SCALE = 0.75;

const state = {
  screen: 'start',
  session: 0,           // 처음으로 돌아갈 때마다 바뀐다. 늦게 끝난 업로드가 다음 손님 화면을 건드리지 않게 한다.
  layout: LAYOUTS.grid,
  shots: [],            // 찍은 사진(캔버스)
  clips: [],            // 컷마다 녹화한 영상 { blob, duration }
  shooting: false,
  saving: false,
  stream: null,
  wakeLock: null,
  resultUrl: null,
  qrTimer: null,
  lastTouch: Date.now(),
};

const actions = {
  start: startSession,
  home: goHome,
  'pick-layout': (el) => pickLayout(el.dataset.id),
  'back-layout': () => show('layout'),
  'shoot-start': runSequence,
  retake: enterShoot,
  save: saveResult,
};

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (el && !el.disabled) actions[el.dataset.action]?.(el);
});

// ---- 화면 전환 ----

function show(name) {
  for (const el of document.querySelectorAll('.screen')) {
    el.classList.toggle('active', el.id === `screen-${name}`);
  }
  state.screen = name;
  state.lastTouch = Date.now();
}

function goHome() {
  state.session += 1;
  clearInterval(state.qrTimer);
  releaseShots();
  state.saving = false;
  show('start');
  updateStatusLine();
}

async function startSession() {
  enterFullscreen();
  unlockAudio();
  keepAwake();
  if (await ensureCamera()) show('layout');
}

// 사파리 탭에서 쓸 때 주소창을 숨긴다. 홈 화면 앱은 이미 전체 화면이라 건너뛴다.
function enterFullscreen() {
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (standalone || document.fullscreenElement || document.webkitFullscreenElement) return;
  const el = document.documentElement;
  const request = el.requestFullscreen ?? el.webkitRequestFullscreen;
  request?.call(el)?.catch?.(() => {});
}

// ---- 레이아웃 고르기 ----

function pickLayout(id) {
  state.layout = LAYOUTS[id];
  enterShoot();
}

function renderLayoutChoices() {
  $('#layout-choices').replaceChildren(
    ...Object.values(LAYOUTS).map((layout) => {
      const card = document.createElement('button');
      card.className = 'card';
      card.dataset.action = 'pick-layout';
      card.dataset.id = layout.id;
      const name = document.createElement('strong');
      name.textContent = layout.name;
      const desc = document.createElement('span');
      desc.textContent = layout.desc;
      card.append(renderComposite(layout, [], 0.25), name, desc);
      return card;
    }),
  );
}

// ---- 촬영 ----

// 아이패드는 카메라가 꺼진 채 1분이 지나면 권한을 다시 묻는다.
// 그래서 앱이 켜질 때 한 번 켜고 끄지 않으며, 정말 끊긴 경우에만 다시 요청한다.
async function ensureCamera() {
  if (state.stream?.getVideoTracks().some((track) => track.readyState === 'live')) return true;
  try {
    state.stream = await startCamera($('#video'));
    return true;
  } catch (err) {
    console.error(err);
    toast('카메라를 켤 수 없어요. 브라우저에서 카메라 권한을 허용해 주세요.');
    return false;
  }
}

async function enterShoot() {
  if (!(await ensureCamera())) return;
  releaseShots();
  renderSlots();
  $('#shot-counter').textContent = `${state.layout.shots}컷 촬영`;
  $('#shoot-idle').hidden = false;
  show('shoot');
  $('#video').play().catch(() => {});
}

async function runSequence() {
  if (state.shooting) return;
  state.shooting = true;
  $('#shoot-idle').hidden = true;
  try {
    const total = state.layout.shots;
    for (let i = 0; i < total; i++) {
      $('#shot-counter').textContent = `${i + 1} / ${total}`;
      const clip = startClip();
      await countdown(CONFIG.countdownSeconds);
      replay($('#flash'), 'on');
      shutter();
      state.shots.push(capture($('#video'), CELL_ASPECT, CONFIG.mirror));
      renderSlots();
      await sleep(200); // 셔터 직후 모습까지 영상에 담는다
      const recorded = await clip?.stop().catch((err) => console.warn('컷 영상 녹화 실패', err));
      if (recorded) state.clips.push(recorded);
      await sleep(700);
    }
  } finally {
    state.shooting = false;
  }
  showReview();
}

function startClip() {
  if (!canRecordVideo()) return null;
  try {
    return recordClip(state.stream);
  } catch (err) {
    console.warn('컷 영상 녹화를 시작하지 못했어요', err);
    return null;
  }
}

async function countdown(seconds) {
  const el = $('#countdown');
  for (let s = seconds; s > 0; s--) {
    el.textContent = s;
    replay(el, 'tick');
    beep(s === 1 ? 1320 : 880);
    await sleep(1000);
  }
  el.textContent = '';
}

function renderSlots() {
  const box = $('#shot-slots');
  box.className = `slots ${state.layout.id}`;
  box.replaceChildren(
    ...Array.from({ length: state.layout.shots }, (_, i) => {
      const slot = document.createElement('div');
      slot.className = 'slot';
      if (state.shots[i]) slot.append(state.shots[i]);
      else slot.textContent = i + 1;
      return slot;
    }),
  );
}

// 아이패드 사파리는 캔버스 메모리 한도가 작아서, 다 쓴 그림은 크기를 0으로 줄여 바로 돌려준다
function releaseShots() {
  releaseCanvases('#review-preview canvas');
  for (const shot of state.shots) shot.width = shot.height = 0;
  state.shots = [];
  state.clips = [];
}

function releaseCanvases(selector) {
  for (const canvas of document.querySelectorAll(selector)) canvas.width = canvas.height = 0;
}

// ---- 확인 ----

function showReview() {
  releaseCanvases('#review-preview canvas');
  $('#review-preview').replaceChildren(renderComposite(state.layout, state.shots, PREVIEW_SCALE));
  show('review');
}

// ---- 저장 → QR ----

async function saveResult() {
  if (state.saving) return;
  state.saving = true;
  const session = state.session;
  const id = newPhotoId();
  const layout = state.layout;
  const clips = state.clips;
  state.clips = [];

  const canvas = renderComposite(layout, state.shots);
  const photo = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', CONFIG.jpegQuality));
  canvas.width = canvas.height = 0;
  if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
  state.resultUrl = URL.createObjectURL(photo);

  $('#qr-photo').src = state.resultUrl;
  $('#qr-code').src = makeQr(photoPageUrl(id));
  $('#qr-home').textContent = '처음으로';
  setQrState('uploading');
  const hasVideo = clips.length === layout.shots;
  setVideoState(hasVideo ? 'making' : 'none');
  show('qr');

  // 영상은 사진과 따로 뒤에서 만들어 올린다. 손님 페이지가 영상이 올라올 때까지 기다린다.
  if (hasVideo) makeVideo(id, layout, clips, session);

  const result = await storeFile(`${id}.jpg`, photo);
  if (session !== state.session) return;
  setQrState(result);
  startQrTimer();
}

async function makeVideo(id, layout, clips, session) {
  let result = 'failed';
  try {
    const video = await composeVideo(layout, clips);
    const ext = video.type.includes('mp4') ? 'mp4' : 'webm';
    result = await storeFile(`${id}.${ext}`, video);
  } catch (err) {
    console.error('영상 만들기 실패', err);
  }
  if (session === state.session) setVideoState(result);
}

// 아이패드에 먼저 백업해 두고 올린다. 올리기에 실패해도 나중에 다시 올린다.
async function storeFile(name, blob) {
  if (!isConfigured()) return 'demo';
  await saveFile(name, blob).catch((err) => console.error('백업 실패', name, err));
  try {
    await uploadFile(name, blob);
    return 'ready';
  } catch (err) {
    console.error('업로드 실패', name, err);
    return 'delayed';
  }
}

const QR_MESSAGES = {
  uploading: '사진을 올리는 중이에요…',
  ready: '휴대폰 카메라로 QR을 찍으면\n사진을 저장할 수 있어요',
  delayed: '인터넷이 느려서 사진이 조금 늦게 올라가요.\nQR을 찍어두고 잠시 뒤 다시 열어주세요.',
  demo: '테스트 모드예요.\n저장소가 연결되지 않아 사진이 올라가지 않았어요.',
};

const VIDEO_MESSAGES = {
  none: '',
  making: '🎬 촬영 영상을 만드는 중이에요…',
  ready: '🎬 촬영 영상도 같은 QR에서 받을 수 있어요',
  delayed: '🎬 영상은 인터넷이 느려서 조금 늦게 올라가요',
  demo: '🎬 테스트 모드라 영상은 올라가지 않았어요',
  failed: '🎬 영상은 만들지 못했어요. 사진은 그대로 받을 수 있어요',
};

function setQrState(name) {
  $('#qr-panel').dataset.state = name;
  $('#qr-message').textContent = QR_MESSAGES[name];
}

function setVideoState(name) {
  $('#qr-video').textContent = VIDEO_MESSAGES[name];
}

function startQrTimer() {
  let left = CONFIG.qrScreenSeconds;
  const button = $('#qr-home');
  button.textContent = `처음으로 (${left})`;
  clearInterval(state.qrTimer);
  state.qrTimer = setInterval(() => {
    left -= 1;
    button.textContent = `처음으로 (${left})`;
    if (left <= 0) goHome();
  }, 1000);
}

function makeQr(url) {
  const qr = window.qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  return qr.createDataURL(8, 4);
}

// ---- 현장 운영 ----

// 손님이 중간에 떠나면 일정 시간 뒤 처음 화면으로 돌아간다(촬영 중에는 제외)
document.addEventListener('pointerdown', () => { state.lastTouch = Date.now(); }, true);
setInterval(() => {
  const idle = Date.now() - state.lastTouch > CONFIG.idleResetSeconds * 1000;
  const resettable = ['layout', 'review'].includes(state.screen)
    || (state.screen === 'shoot' && !state.shooting);
  if (idle && resettable) goHome();
}, 5000);

// 못 올린 파일은 30초마다, 그리고 인터넷이 다시 연결될 때 다시 올린다
async function syncPending() {
  await retryPending().catch((err) => console.warn('다시 올리기 실패', err));
  updateStatusLine();
}
setInterval(syncPending, 30_000);
window.addEventListener('online', syncPending);

async function updateStatusLine() {
  const el = $('#status-line');
  if (!isConfigured()) {
    el.textContent = '테스트 모드 · 사진 저장소 미연결';
    return;
  }
  const count = await pendingCount().catch(() => 0);
  el.textContent = count ? `아직 못 올린 파일 ${count}개 · 자동으로 다시 올리는 중` : '';
}

// 행사 내내 화면이 꺼지지 않게 한다
async function keepAwake() {
  if (!('wakeLock' in navigator) || (state.wakeLock && !state.wakeLock.released)) return;
  try {
    state.wakeLock = await navigator.wakeLock.request('screen');
  } catch (err) {
    console.warn('화면 켜짐 유지 실패', err);
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.wakeLock) keepAwake();
});

// 두 손가락 확대 막기(아이패드 사파리)
document.addEventListener('gesturestart', (event) => event.preventDefault());

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 4000);
}

// CSS 애니메이션을 처음부터 다시 재생한다
function replay(el, className) {
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
}

// ---- 시작 ----

$('#event-line').textContent = `${CONFIG.eventTitle} · ${CONFIG.eventSubtitle}`;
$('.viewfinder').classList.toggle('mirror', CONFIG.mirror);
renderLayoutChoices();
syncPending();
ensureCamera(); // 운영진이 앱을 켤 때 권한을 한 번 허용해 두면 손님에게는 묻지 않는다
