import { CONFIG } from './config.js';

// 배경음악, 카운트다운 소리, 셔터 소리.
// 아이패드는 <audio>의 음량을 바꿀 수 없어서, 배경음악도 Web Audio로 틀어 음량을 조절한다.

const MUSIC_URL = 'assets/bgm.m4a';

let ctx = null;
let musicGain = null;
let musicBuffer = null;
let musicSource = null;
let musicOn = true;

// 아이패드는 사용자가 화면을 누른 뒤에만 소리를 낼 수 있어서, 첫 터치 때 한 번 호출한다
export function unlockAudio() {
  if (!ctx) {
    // 무음 모드에서도 배경음악이 나오도록 '재생' 용도로 알린다(사파리 16.4 이상)
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = ctx.createGain();
    musicGain.gain.value = CONFIG.musicVolume;
    musicGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export const audioContext = () => ctx;

// 영상에도 같은 노래를 깔기 위해 음원을 한 번 풀어 둔다
export async function loadMusic() {
  if (!musicBuffer && ctx) {
    const response = await fetch(MUSIC_URL);
    musicBuffer = await ctx.decodeAudioData(await response.arrayBuffer());
  }
  return musicBuffer;
}

export async function startMusic() {
  if (!musicOn || musicSource || !ctx) return;
  const buffer = await loadMusic().catch((err) => console.warn('배경음악을 불러오지 못했어요', err));
  if (!buffer || !musicOn || musicSource) return;
  musicSource = ctx.createBufferSource();
  musicSource.buffer = buffer;
  musicSource.loop = true;
  musicSource.connect(musicGain);
  musicSource.start();
}

export function toggleMusic() {
  musicOn = !musicOn;
  if (musicOn) {
    startMusic();
  } else if (musicSource) {
    musicSource.stop();
    musicSource = null;
  }
  return musicOn;
}

// 촬영하는 동안은 카운트다운 소리가 잘 들리게 음악을 줄인다
export function duckMusic(on) {
  if (!musicGain) return;
  const target = on ? CONFIG.musicVolume * 0.35 : CONFIG.musicVolume;
  musicGain.gain.setTargetAtTime(target, ctx.currentTime, 0.2);
}

export function beep(frequency = 880, duration = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// 짧게 잦아드는 잡음으로 '찰칵' 소리를 흉내 낸다
export function shutter() {
  if (!ctx) return;
  const length = Math.floor(ctx.sampleRate * 0.15);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0.6;
  source.buffer = buffer;
  source.connect(gain).connect(ctx.destination);
  source.start();
}
