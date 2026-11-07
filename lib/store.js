import { createClient } from '@supabase/supabase-js';
import { PLACES } from './content';

// 전시회 앱들과 같은 Supabase 프로젝트·표·버킷을 쓴다(공개용 키). 줄 이름은 sch-p-<이름> 으로 구분한다.
// 이 표는 지우기가 막혀 있어서, 관리 화면의 「숨기기」는 hidden 표시만 한다.
const SUPABASE_URL = 'https://pgywpdodatjfpivxmymn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_FeO3LdfFBB6KEwblcZPa2w_sW9dVuUg';
const TABLE = 'suseong_hub_content';
const BUCKET = 'suseong-hub';
const P = 'sch-p-';
const PIN_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'; // 1234
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const hex = s => [...new TextEncoder().encode(s)].map(b => b.toString(16).padStart(2, '0')).join('');
export const cleanName = s => String(s || '').trim().replace(/\s+/g, ' ').slice(0, 20);
const rowId = name => P + hex(cleanName(name));

export async function checkPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('') === PIN_HASH;
}

export async function loadPlayer(name) {
  const { data, error } = await supabase.from(TABLE).select('data').eq('id', rowId(name)).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.data || null;
}

// 서버와 기기의 기록을 장소별로 합친다. 다른 기기에서 빈 화면으로 들어와도 기록이 지워지지 않는다.
export async function saveProgress(name, done) {
  const server = await loadPlayer(name);
  const merged = { ...(server?.done || {}), ...done };
  const count = PLACES.filter(p => merged[p.id]).length;
  const row = {
    ...(server || {}),
    name: cleanName(name),
    done: merged,
    startedAt: server?.startedAt || Date.now(),
    updatedAt: Date.now(),
    finishedAt: count === PLACES.length ? server?.finishedAt || Date.now() : null,
  };
  const { error } = await supabase.from(TABLE).upsert({ id: rowId(name), data: row });
  if (error) throw new Error(error.message);
  return row;
}

export async function loadPlayers(includeHidden = false) {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(TABLE).select('id,data').like('id', `${P}%`).range(from, from + 999);
    if (error) throw new Error(error.message);
    all.push(...data);
    if (data.length < 1000) break;
  }
  const list = all.map(r => ({ id: r.id, ...r.data }));
  return includeHidden ? list : list.filter(p => !p.hidden);
}

export async function setHidden(player, hidden) {
  const { id, ...data } = player;
  const { error } = await supabase.from(TABLE).upsert({ id, data: { ...data, hidden } });
  if (error) throw new Error(error.message);
}

// 사진은 긴 변 1280px JPEG로 줄여 올린다
export async function uploadPhoto(name, placeId, file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url; });
    const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
    const path = `ssu-hunt/${hex(cleanName(name))}/${placeId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
    if (error) throw new Error(error.message);
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  } finally { URL.revokeObjectURL(url); }
}

// 많이 찾은 순, 같으면 먼저 끝낸 순
export function rank(players) {
  const score = p => PLACES.filter(x => p.done?.[x.id]).length;
  return [...players]
    .map(p => ({ ...p, score: score(p) }))
    .sort((a, b) => b.score - a.score || (a.finishedAt || a.updatedAt || 0) - (b.finishedAt || b.updatedAt || 0));
}
