import { CONFIG } from './config.js';
import { LAYOUTS, CELL_ASPECT, loadAssets, renderComposite } from './compose.js';
import { FRAMES } from './frames.js';
import { startCamera, capture } from './camera.js';
import { unlockAudio, beep, shutter } from './sound.js';
import {
  isConfigured, newPhotoId, photoPageUrl, savePhoto, uploadPhoto, retryPending, pendingCount,
} from './storage.js';

// 부스 화면 흐름: 시작 → 레이아웃 → 촬영 → 프레임 고르기 → QR → 다시 시작
// 프레임은 찍은 사진을 넣어 보면서 고른다.

const $ = (selector) => document.querySelector(selector);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PREVIEW_SCALE = 0.75;
const THUMB_SCALE = 0.2;

const state = {
  screen: 'start',
  session: 0,           // 처음으로 돌아갈 때마다 바뀐다. 늦게 끝난 업로드가 다음 손님 화면을 건드리지 않게 한다.
  layout: LAYOUTS.grid,
  frame: FRAMES[0],
  shots: [],
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
  'choose-frame': (el) => chooseFrame(el.dataset.id),
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
  const sample = FRAMES.find((frame) => frame.id === 'white');
  $('#layout-choices').replaceChildren(
    ...Object.values(LAYOUTS).map((layout) =>
      choiceCard('pick-layout', layout.id, layout.name, layout.desc, renderComposite(layout, sample, [], 0.25)),
    ),
  );
}

function choiceCard(action, id, title, desc, canvas) {
  const card = document.createElement('button');
  card.className = 'card';
  card.dataset.action = action;
  card.dataset.id = id;
  const name = document.createElement('strong');
  name.textContent = title;
  card.append(canvas, name);
  if (desc) {
    const sub = document.createElement('span');
    sub.textContent = desc;
    card.append(sub);
  }
  return card;
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
      await countdown(CONFIG.countdownSeconds);
      replay($('#flash'), 'on');
      shutter();
      state.shots.push(capture($('#video'), CELL_ASPECT, CONFIG.mirror));
      renderSlots();
      await sleep(900);
    }
  } finally {
    state.shooting = false;
  }
  showFramePicker();
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
  releaseCanvases('#pick-preview canvas, #pick-choices canvas');
  for (const shot of state.shots) shot.width = shot.height = 0;
  state.shots = [];
}

function releaseCanvases(selector) {
  for (const canvas of document.querySelectorAll(selector)) canvas.width = canvas.height = 0;
}

// ---- 프레임 고르기: 찍은 사진을 프레임마다 넣어 보여준다 ----

function showFramePicker() {
  state.frame = FRAMES[0];
  releaseCanvases('#pick-choices canvas');
  $('#pick-choices').replaceChildren(
    ...FRAMES.map((frame) => {
      const card = choiceCard('choose-frame', frame.id, frame.name, '',
        renderComposite(state.layout, frame, state.shots, THUMB_SCALE));
      card.classList.toggle('selected', frame === state.frame);
      return card;
    }),
  );
  renderPreview();
  show('pick');
}

function chooseFrame(id) {
  state.frame = FRAMES.find((frame) => frame.id === id);
  for (const card of document.querySelectorAll('#pick-choices .card')) {
    card.classList.toggle('selected', card.dataset.id === id);
  }
  renderPreview();
}

function renderPreview() {
  releaseCanvases('#pick-preview canvas');
  $('#pick-preview').replaceChildren(renderComposite(state.layout, state.frame, state.shots, PREVIEW_SCALE));
}

// ---- 저장 → QR ----

async function saveResult() {
  if (state.saving) return;
  state.saving = true;
  const session = state.session;
  const id = newPhotoId();

  const canvas = renderComposite(state.layout, state.frame, state.shots);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', CONFIG.jpegQuality));
  canvas.width = canvas.height = 0;
  if (state.resultUrl) URL.revokeObjectURL(state.resultUrl);
  state.resultUrl = URL.createObjectURL(blob);

  $('#qr-photo').src = state.resultUrl;
  $('#qr-code').src = makeQr(photoPageUrl(id));
  $('#qr-home').textContent = '처음으로';
  setQrState('uploading');
  show('qr');

  let result = 'demo';
  if (isConfigured()) {
    // 아이패드에 먼저 백업해 두고 올린다. 올리기에 실패해도 나중에 다시 올린다.
    await savePhoto(id, blob).catch((err) => console.error('백업 실패', err));
    try {
      await uploadPhoto(id, blob);
      result = 'ready';
    } catch (err) {
      console.error('업로드 실패', err);
      result = 'delayed';
    }
  }
  if (session !== state.session) return;
  setQrState(result);
  startQrTimer();
}

const QR_MESSAGES = {
  uploading: '사진을 올리는 중이에요…',
  ready: '휴대폰 카메라로 QR을 찍으면\n사진을 저장할 수 있어요',
  delayed: '인터넷이 느려서 사진이 조금 늦게 올라가요.\nQR을 찍어두고 잠시 뒤 다시 열어주세요.',
  demo: '테스트 모드예요.\n저장소가 연결되지 않아 사진이 올라가지 않았어요.',
};

function setQrState(name) {
  $('#qr-panel').dataset.state = name;
  $('#qr-message').textContent = QR_MESSAGES[name];
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
  const resettable = ['layout', 'pick'].includes(state.screen)
    || (state.screen === 'shoot' && !state.shooting);
  if (idle && resettable) goHome();
}, 5000);

// 못 올린 사진은 30초마다, 그리고 인터넷이 다시 연결될 때 다시 올린다
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
  el.textContent = count ? `아직 못 올린 사진 ${count}장 · 자동으로 다시 올리는 중` : '';
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
loadAssets()
  .catch((err) => console.warn('로고를 불러오지 못했어요', err))
  .finally(renderLayoutChoices);
syncPending();
ensureCamera(); // 운영진이 앱을 켤 때 권한을 한 번 허용해 두면 손님에게는 묻지 않는다
