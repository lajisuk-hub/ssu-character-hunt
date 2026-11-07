'use client';
import { useEffect, useState } from 'react';
import { PLACES, TYPE_LABEL } from '../../lib/content';
import { checkPin, loadPlayers, rank, setHidden } from '../../lib/store';

// 수강생 답·사진 모아 보기. 화면만 잠그는 간단한 비밀번호다.
export default function Admin() {
  const [ok, setOk] = useState(false);
  const [pin, setPin] = useState('');
  const [bad, setBad] = useState(false);
  const [list, setList] = useState([]);
  const [view, setView] = useState('place');
  const [err, setErr] = useState('');

  const read = () => loadPlayers(true).then(l => { setList(rank(l)); setErr(''); }).catch(() => setErr('기록을 읽지 못했어요.'));
  useEffect(() => { if (ok) read(); }, [ok]);

  if (!ok) {
    return (
      <form className="page center" onSubmit={async e => { e.preventDefault(); (await checkPin(pin)) ? setOk(true) : setBad(true); }}>
        <h1>모아 보기</h1>
        <label>비밀번호<input type="password" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} /></label>
        {bad && <p className="warn">비밀번호가 달라요.</p>}
        <button className="big">들어가기</button>
      </form>
    );
  }
  const shown = list.filter(p => !p.hidden);
  const hidden = list.filter(p => p.hidden);
  const Answer = ({ r }) => r.photo
    ? <a href={r.photo} target="_blank" rel="noreferrer"><img className="thumb" src={r.photo} alt="올린 사진" /></a>
    : <p className="answer">{r.answer}</p>;

  return (
    <main className="admin">
      <header className="bar">
        <b>모아 보기 · {shown.length}명</b>
        <span>
          <button className={view === 'place' ? 'on' : ''} onClick={() => setView('place')}>장소별</button>
          <button className={view === 'person' ? 'on' : ''} onClick={() => setView('person')}>사람별</button>
          <button onClick={read}>새로고침</button>
        </span>
      </header>
      {err && <p className="warn">{err}</p>}

      {view === 'place' && PLACES.map(p => {
        const rows = shown.filter(s => s.done?.[p.id]);
        return (
          <section key={p.id}>
            <h2>{p.name} <small>{TYPE_LABEL[p.mission.type]} · {rows.length}명</small></h2>
            <p className="muted">{p.mission.q}</p>
            {rows.map(s => (
              <div className="row" key={s.id}>
                <b>{s.name}{s.done[p.id].manual ? ' (직접 찾기)' : ''}</b>
                <Answer r={s.done[p.id]} />
              </div>
            ))}
          </section>
        );
      })}

      {view === 'person' && shown.map(s => (
        <section key={s.id}>
          <h2>{s.name} <small>{s.score}/{PLACES.length}</small>
            <button className="mini" onClick={async () => { await setHidden(s, true); read(); }}>숨기기</button>
          </h2>
          {PLACES.filter(p => s.done?.[p.id]).map(p => (
            <div className="row" key={p.id}>
              <b>{p.name}{s.done[p.id].manual ? ' (직접 찾기)' : ''}</b>
              <Answer r={s.done[p.id]} />
            </div>
          ))}
        </section>
      ))}
      {view === 'person' && hidden.length > 0 && (
        <section>
          <h2>숨긴 사람</h2>
          {hidden.map(s => (
            <div className="row" key={s.id}><b>{s.name}</b>
              <button className="mini" onClick={async () => { await setHidden(s, false); read(); }}>되살리기</button>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
