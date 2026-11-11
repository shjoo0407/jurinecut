import { CONFIG } from './config.js';

// 사진·영상 저장 담당.
// 1) 아이패드 안(IndexedDB)에 먼저 백업하고  2) 수파베이스에 올린다.
// 올리기에 실패한 파일은 백업에서 꺼내 나중에 다시 올린다.
// 파일 이름은 '<사진 ID>.jpg', '<사진 ID>.mp4'처럼 같은 ID에 확장자만 다르다.

const DB_NAME = 'jurinecut-files';
const STORE = 'files';
const PENDING = 0;
const UPLOADED = 1;

let client = null;
let dbPromise = null;
let retrying = false;
const inFlight = new Set();

export const isConfigured = () => Boolean(CONFIG.supabaseUrl && CONFIG.supabaseKey);

// 추측할 수 없는 22자리 무작위 문자열. 이 값이 곧 사진 주소가 된다.
export function newPhotoId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function photoPageUrl(id) {
  return new URL(`photo.html?id=${id}`, location.href).href;
}

export function publicFileUrl(name) {
  return `${CONFIG.supabaseUrl}/storage/v1/object/public/${CONFIG.bucket}/${name}`;
}

export async function saveFile(name, blob) {
  await withStore('readwrite', (store) =>
    store.put({ name, blob, createdAt: Date.now(), status: PENDING }),
  );
}

export async function uploadFile(name, blob) {
  if (!isConfigured()) throw new Error('사진 저장소가 설정되지 않았어요');
  inFlight.add(name);
  try {
    const { error } = await getClient()
      .storage.from(CONFIG.bucket)
      .upload(name, blob, { contentType: blob.type, upsert: false });
    // 앞선 시도가 실제로는 성공했는데 응답만 못 받은 경우도 성공으로 본다
    if (error && !/already exists|duplicate/i.test(error.message)) throw error;
    await markUploaded(name);
  } finally {
    inFlight.delete(name);
  }
}

// 못 올린 파일을 다시 올린다. 실패한 파일은 건너뛰고 다음 기회에 다시 시도한다.
// (계속 거절되는 파일 하나가 뒤에 있는 사진들까지 막지 않게 한다)
export async function retryPending() {
  if (retrying || !isConfigured() || !navigator.onLine) return;
  retrying = true;
  try {
    const names = await withStore('readonly', (store) => store.index('status').getAllKeys(PENDING));
    for (const name of names) {
      if (inFlight.has(name)) continue;
      const item = await withStore('readonly', (store) => store.get(name));
      await uploadFile(name, item.blob).catch((err) => console.warn('다시 올리기 실패', name, err));
    }
  } finally {
    retrying = false;
  }
}

export function pendingCount() {
  return withStore('readonly', (store) => store.index('status').count(PENDING));
}

function markUploaded(name) {
  return withStore('readwrite', (store) => {
    const request = store.get(name);
    request.onsuccess = () => {
      if (request.result) store.put({ ...request.result, status: UPLOADED });
    };
  });
}

function getClient() {
  client ??= window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetchWithTimeout },
  });
  return client;
}

// 와이파이가 불안정할 때 업로드가 끝없이 걸려 있지 않도록 시간 제한을 둔다
function fetchWithTimeout(url, options = {}) {
  const signal = options.signal ?? AbortSignal.timeout?.(CONFIG.uploadTimeoutSeconds * 1000);
  return fetch(url, { ...options, signal });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'name' }).createIndex('status', 'status');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore(mode, fn) {
  dbPromise ??= openDb();
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
