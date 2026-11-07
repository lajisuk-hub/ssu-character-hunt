'use client';
import { useEffect, useRef, useState } from 'react';
import { PLACES } from '../lib/content';

// 글을 눌러 고치는 칸: 다른 곳을 누를 때 저장, 붙여넣기는 글자만
function EditableText({ value, onChange, className }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current && ref.current.textContent !== value) ref.current.textContent = value; }, [value]);
  return (
    <span ref={ref} className={`editable ${className || ''}`} contentEditable suppressContentEditableWarning
      onBlur={e => { const t = e.currentTarget.textContent.trim(); if (t) onChange(t); else e.currentTarget.textContent = value; }}
      onPaste={e => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); }}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
  );
}

export default function Certificate({ name, onName, onBack }) {
  const paper = useRef(null);
  const [img, setImg] = useState('');
  const [blob, setBlob] = useState(null);
  const [making, setMaking] = useState(true);
  const today = new Date();
  const dateText = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  // 저장 단추를 누른 뒤 만들면 크롬이 내려받기를 막으므로, 미리 그림을 만들어 둔다
  useEffect(() => {
    let dead = false;
    setMaking(true);
    (async () => {
      await document.fonts?.ready;
      const { default: html2canvas } = await import('html2canvas');
      const el = paper.current;
      el.classList.add('shooting');
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#fffdf6', useCORS: true });
      el.classList.remove('shooting');
      if (dead) return;
      setImg(canvas.toDataURL('image/jpeg', 0.92));
      canvas.toBlob(b => { if (!dead) { setBlob(b); setMaking(false); } }, 'image/jpeg', 0.92);
    })().catch(() => { if (!dead) setMaking(false); });
    return () => { dead = true; };
  }, [name]);

  const file = blob ? new File([blob], `숭실캐릭터찾기_완주인증서_${name}.jpg`, { type: 'image/jpeg' }) : null;
  const canShare = !!file && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] });

  return (
    <div className="page">
      <header className="bar"><button className="plain" onClick={onBack}>← 도감</button><b>완주 인증서</b></header>
      <p className="muted">✏️ 이름을 누르면 바로 고칠 수 있어요.</p>

      <div className="cert" ref={paper}>
        <p className="cert-top">COMPLETION</p>
        <h2>완주 인증서</h2>
        <p className="cert-name"><EditableText value={name} onChange={onName} /></p>
        <p className="cert-body">위 사람은 숭실 캠퍼스 {PLACES.length}곳을 모두 찾아가<br />캐릭터를 만나고 미션을 완수하였기에<br />이 인증서를 드립니다.</p>
        <div className="cert-chars">{PLACES.map(p => <img key={p.id} src={p.char.img} alt="" />)}</div>
        <p className="cert-date">{dateText}</p>
        <p className="cert-org">숭실대학교 교육대학원 유아교육전공<br />현장역량강화 워크숍</p>
      </div>

      {making && <p className="muted center-text">인증서를 만들고 있어요…</p>}
      {!making && blob && (
        <div className="cert-actions">
          {canShare && <button className="big" onClick={() => navigator.share({ files: [file], title: '완주 인증서' }).catch(() => {})}>📲 사진으로 저장·공유</button>}
          <a className={canShare ? 'btn-sub' : 'big'} href={img} download={file.name}>📥 파일로 내려받기</a>
          <p className="small">안 되면 아래 그림을 길게 눌러 저장해 주세요.</p>
          <img className="cert-result" src={img} alt="완주 인증서 그림" />
        </div>
      )}
      {!making && !blob && <p className="warn">인증서 그림을 만들지 못했어요. 이 화면을 캡처해 주세요.</p>}
    </div>
  );
}
