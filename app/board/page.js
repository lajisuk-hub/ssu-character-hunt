'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { PLACES } from '../../lib/content';
import { loadPlayers, rank } from '../../lib/store';

// 강의실 화면에 띄우는 순위표: 5초마다 새로 읽는다
export default function Board() {
  const [list, setList] = useState([]);
  const [err, setErr] = useState(false);
  const [qr, setQr] = useState('');

  useEffect(() => {
    QRCode.toDataURL(location.origin, { width: 320, margin: 1 }).then(setQr).catch(() => {});
    let alive = true;
    const read = () => loadPlayers().then(l => { if (alive) { setList(rank(l)); setErr(false); } }).catch(() => alive && setErr(true));
    read();
    const t = setInterval(read, 5000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <main className="board">
      <header>
        <div>
          <p className="eyebrow">숭실대학교 교육대학원 유아교육전공</p>
          <h1>숭실 캐릭터 찾기 순위표</h1>
          <p className="muted">참가 {list.length}명 · 완주 {list.filter(p => p.score === PLACES.length).length}명{err ? ' · 연결을 다시 시도하고 있어요' : ''}</p>
        </div>
        {qr && <figure><img src={qr} alt="참가 주소 QR" /><figcaption>휴대폰으로 찍어 참가</figcaption></figure>}
      </header>
      {list.length === 0 && <p className="board-empty">아직 참가한 분이 없어요.</p>}
      <ol>
        {list.map((p, i) => (
          <li key={p.id}>
            <span className="rank">{i + 1}</span>
            <b>{p.name}</b>
            <span className="dots">{PLACES.map(x => <img key={x.id} className={p.done?.[x.id] ? 'on' : ''} src={x.char.img} alt="" />)}</span>
            <span className="score">{p.score}/{PLACES.length}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
