'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PLACES, NEAR_METERS, TYPE_LABEL } from '../lib/content';
import { cleanName, loadPlayer, saveProgress, uploadPhoto } from '../lib/store';
import MapView from './MapView';
import Certificate from './Certificate';

const KEY = 'ssu-hunt-player';
const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const writeLocal = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* 저장 안 돼도 서버에 남는다 */ } };

function meters(a, b) {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function Game() {
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('');
  const [done, setDone] = useState({});
  const [screen, setScreen] = useState('start');
  const [pos, setPos] = useState(null);
  const [geoErr, setGeoErr] = useState('');
  const [place, setPlace] = useState(null);
  const [manual, setManual] = useState(false);
  const [caught, setCaught] = useState(null);
  const [notice, setNotice] = useState('');
  const watch = useRef(null);

  useEffect(() => {
    const s = readLocal();
    if (s?.name) { setName(s.name); setDone(s.done || {}); }
    setReady(true);
    return () => { if (watch.current != null) navigator.geolocation?.clearWatch(watch.current); };
  }, []);

  const startGps = useCallback(() => {
    if (!navigator.geolocation) { setGeoErr('이 휴대폰에서는 위치를 쓸 수 없어요.'); return; }
    if (watch.current != null) return;
    watch.current = navigator.geolocation.watchPosition(
      p => { setGeoErr(''); setPos({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); },
      e => setGeoErr(e.code === 1 ? '위치 사용이 꺼져 있어요. 아래 「위치가 안 잡혀요」를 눌러 주세요.' : '위치를 찾고 있어요. 건물 밖으로 나오면 더 잘 잡혀요.'),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
    );
  }, []);

  async function begin(n) {
    const clean = cleanName(n);
    if (!clean) return;
    let merged = readLocal()?.name === clean ? readLocal().done || {} : {};
    try { merged = { ...(await loadPlayer(clean))?.done, ...merged }; } catch { setNotice('인터넷이 약해요. 기록은 이 휴대폰에 먼저 남겨 둘게요.'); }
    setName(clean); setDone(merged);
    writeLocal({ name: clean, done: merged });
    saveProgress(clean, merged).catch(() => {});
    startGps();
    setScreen('map');
  }

  async function finish(p, rec) {
    const entry = { ...rec, at: Date.now(), manual };
    const next = { ...done, [p.id]: entry };
    setDone(next);
    writeLocal({ name, done: next });
    try { await saveProgress(name, next); setNotice(''); }
    catch { setNotice('인터넷이 약해서 순위표에는 조금 늦게 올라가요.'); }
    setCaught(p);
    setScreen('caught');
  }

  const count = PLACES.filter(p => done[p.id]).length;
  const allDone = count === PLACES.length;
  const left = PLACES.filter(p => !done[p.id]);
  const withDist = pos ? left.map(p => ({ p, d: meters(pos, p) })).sort((a, b) => a.d - b.d) : left.map(p => ({ p, d: null }));
  const next = withDist[0];
  const near = !!pos && next && next.d <= NEAR_METERS + Math.min(pos.acc || 0, 25);

  if (!ready) return null;

  if (screen === 'start') return <Start initial={name} count={count} onStart={begin} />;

  if (screen === 'camera') {
    return <CameraHunt place={place} onCatch={() => setScreen('mission')} onBack={() => setScreen('map')} />;
  }
  if (screen === 'mission') {
    return <Mission place={place} name={name} onDone={rec => finish(place, rec)} onBack={() => setScreen('map')} />;
  }
  if (screen === 'caught') {
    return (
      <div className="page center">
        <div className="caught-burst"><img src={caught.char.img} alt={caught.char.name} /></div>
        <h1>{caught.char.name}를 찾았어요!</h1>
        <p className="muted">{caught.name} 미션 완료 · {count}/{PLACES.length}</p>
        {notice && <p className="warn">{notice}</p>}
        {allDone
          ? <button className="big" onClick={() => setScreen('cert')}>🎓 완주 인증서 받기</button>
          : <button className="big" onClick={() => setScreen('map')}>다음 장소 찾으러 가기</button>}
      </div>
    );
  }
  if (screen === 'dex') {
    return (
      <div className="page">
        <header className="bar"><button className="plain" onClick={() => setScreen('map')}>← 지도</button><b>내 도감 {count}/{PLACES.length}</b></header>
        <div className="dex">
          {PLACES.map(p => (
            <div key={p.id} className={done[p.id] ? 'card got' : 'card'}>
              <img src={p.char.img} alt={done[p.id] ? p.char.name : '아직 못 찾은 캐릭터'} />
              <b>{done[p.id] ? p.char.name : '???'}</b>
              <small>{p.name}</small>
            </div>
          ))}
        </div>
        {allDone && <button className="big" onClick={() => setScreen('cert')}>🎓 완주 인증서 받기</button>}
      </div>
    );
  }
  if (screen === 'list') {
    return (
      <div className="page">
        <header className="bar"><button className="plain" onClick={() => setScreen('map')}>← 지도</button><b>직접 찾기</b></header>
        <p className="muted">위치가 잡히지 않을 때 쓰는 방법이에요. 실제로 그 장소에 도착했을 때 눌러 주세요.</p>
        <ul className="list">
          {PLACES.map(p => (
            <li key={p.id}>
              <div><b>{p.name}</b><small>{p.hint}</small></div>
              {done[p.id]
                ? <span className="tag">완료</span>
                : <button onClick={() => { setPlace(p); setManual(true); setScreen('camera'); }}>도착했어요</button>}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (screen === 'cert') {
    return <Certificate name={name} onName={n => { setName(n); writeLocal({ name: n, done }); }} onBack={() => setScreen('dex')} />;
  }

  // 지도 화면
  return (
    <div className="map-screen">
      <MapView pos={pos} done={done} />
      <div className="map-top">
        <b>{name} 님</b>
        <button onClick={() => setScreen('dex')}>📖 도감 {count}/{PLACES.length}</button>
      </div>
      <div className="map-card">
        {allDone ? (
          <>
            <h2>모두 찾았어요! 🎉</h2>
            <button className="big" onClick={() => setScreen('cert')}>🎓 완주 인증서 받기</button>
          </>
        ) : near ? (
          <>
            <p className="eyebrow">가까이에 뭔가 있어요!</p>
            <h2>{next.p.name}</h2>
            <button className="big pulse" onClick={() => { setPlace(next.p); setManual(false); setScreen('camera'); }}>📷 캐릭터 찾기</button>
          </>
        ) : (
          <>
            <p className="eyebrow">{pos ? '가장 가까운 곳' : '내 위치를 찾고 있어요'}</p>
            <h2>{next?.p.name}{next?.d != null && <span className="dist"> {Math.round(next.d)}m</span>}</h2>
            <p className="muted">{next?.p.hint}</p>
          </>
        )}
        {geoErr && <p className="warn">{geoErr}</p>}
        {notice && <p className="warn">{notice}</p>}
        {!allDone && <button className="link" onClick={() => setScreen('list')}>위치가 안 잡혀요</button>}
      </div>
    </div>
  );
}

function Start({ initial, count, onStart }) {
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const go = async e => { e.preventDefault(); if (!cleanName(v) || busy) return; setBusy(true); await onStart(v); setBusy(false); };
  return (
    <form className="page center start" onSubmit={go}>
      <div className="hero-row">{PLACES.slice(0, 3).map(p => <img key={p.id} src={p.char.img} alt="" />)}</div>
      <p className="eyebrow">숭실대학교 교육대학원 유아교육전공</p>
      <h1>숭실 캐릭터 찾기</h1>
      <p className="muted">캠퍼스 {PLACES.length}곳에 숨은 캐릭터를 찾아 미션을 풀어 보세요.</p>
      <label>이름<input value={v} onChange={e => setV(e.target.value)} maxLength={20} placeholder="이름을 넣어 주세요" autoComplete="name" /></label>
      <button className="big" disabled={!cleanName(v) || busy}>{busy ? '준비하고 있어요…' : count ? '이어서 하기' : '시작하기'}</button>
      <p className="small">다음 화면에서 위치 사용을 허락해 주세요. 위치는 캐릭터를 찾는 데만 쓰고 저장하지 않아요.</p>
      <p className="small">걸을 때는 휴대폰 대신 앞을 봐 주세요.</p>
    </form>
  );
}

function CameraHunt({ place, onCatch, onBack }) {
  const video = useRef(null);
  const [mode, setMode] = useState('loading');
  const [show, setShow] = useState(false);
  const [spot] = useState(() => ({ left: 22 + Math.random() * 40, top: 24 + Math.random() * 30 }));

  useEffect(() => {
    let stream, stopped = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('none');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        video.current.srcObject = stream;
        await video.current.play().catch(() => {});
        setMode('camera');
      } catch { if (!stopped) setMode('nocam'); }
    })();
    const t = setTimeout(() => setShow(true), 1300);
    return () => { stopped = true; clearTimeout(t); stream?.getTracks().forEach(tr => tr.stop()); };
  }, []);

  return (
    <div className={`cam ${mode}`}>
      <video ref={video} playsInline muted autoPlay />
      <div className="cam-top">
        <button onClick={onBack}>← 지도</button>
        <span>{show ? `${place.char.name}를 눌러 주세요!` : `${place.name} 주변을 살펴보는 중…`}</span>
      </div>
      {mode === 'nocam' && <p className="cam-note">카메라를 쓸 수 없어서 그림으로 보여 드려요.</p>}
      {show && (
        <button className="cam-char" style={{ left: `${spot.left}%`, top: `${spot.top}%` }} onClick={onCatch} aria-label={`${place.char.name} 누르기`}>
          <img src={place.char.img} alt={place.char.name} />
        </button>
      )}
    </div>
  );
}

function Mission({ place, name, onDone, onBack }) {
  const m = place.mission;
  const [picked, setPicked] = useState(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const correct = m.type === 'quiz' && picked === m.answer;

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function submit() {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      if (m.type === 'quiz') await onDone({ type: 'quiz', answer: m.options[m.answer] });
      else if (m.type === 'photo') await onDone({ type: 'photo', photo: await uploadPhoto(name, place.id, file) });
      else await onDone({ type: m.type, answer: text.trim() });
    } catch { setErr('올리지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.'); setBusy(false); }
  }

  return (
    <div className="page mission">
      <header className="bar"><button className="plain" onClick={onBack}>← 지도</button><b>{place.name}</b></header>
      <div className="mission-head">
        <img src={place.char.img} alt={place.char.name} />
        <div><span className="tag">{TYPE_LABEL[m.type]}</span><h2>{m.q}</h2></div>
      </div>

      {m.type === 'quiz' && (
        <div className="options">
          {m.options.map((o, i) => (
            <button key={o} disabled={correct} className={picked === i ? (i === m.answer ? 'right' : 'wrong') : ''} onClick={() => setPicked(i)}>{o}</button>
          ))}
          {picked != null && !correct && <p className="warn">다시 골라 보세요.</p>}
          {correct && <p className="good">정답이에요! {m.explain}</p>}
        </div>
      )}
      {m.type === 'photo' && (
        <div className="photo-box">
          {preview && <img src={preview} alt="찍은 사진" />}
          <label className="file">
            {preview ? '📷 다시 찍기' : '📷 사진 찍기'}
            <input type="file" accept="image/*" capture="environment" onChange={e => {
              const f = e.target.files?.[0];
              if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
            }} />
          </label>
        </div>
      )}
      {(m.type === 'text' || m.type === 'ai') && (
        <textarea rows={7} value={text} onChange={e => setText(e.target.value)} maxLength={3000}
          placeholder={m.type === 'ai' ? 'AI의 답을 여기에 붙여 넣어 주세요' : '여기에 적어 주세요'} />
      )}

      {err && <p className="warn">{err}</p>}
      <button className="big" disabled={busy || (m.type === 'quiz' ? !correct : m.type === 'photo' ? !file : text.trim().length < 5)} onClick={submit}>
        {busy ? '올리고 있어요…' : '미션 완료'}
      </button>
    </div>
  );
}

