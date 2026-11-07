'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { PLACES } from '../lib/content';

// 지도: 오픈스트리트맵(무료·키 없음). 찾은 곳은 캐릭터, 못 찾은 곳은 물음표로 보인다.
export default function MapView({ pos, done }) {
  const box = useRef(null);
  const map = useRef(null);
  const L = useRef(null);
  const pins = useRef({});
  const me = useRef(null);
  const followed = useRef(false);

  const icon = (p, got) => L.current.divIcon({
    className: '',
    iconSize: [46, 46], iconAnchor: [23, 23],
    html: got ? `<div class="pin got"><img src="${p.char.img}" alt=""></div>` : '<div class="pin">?</div>',
  });

  useEffect(() => {
    let dead = false;
    import('leaflet').then(mod => {
      if (dead || map.current) return;
      L.current = mod.default || mod;
      const m = L.current.map(box.current, { zoomControl: false, attributionControl: true });
      L.current.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap',
      }).addTo(m);
      m.fitBounds(PLACES.map(p => [p.lat, p.lng]), { padding: [36, 36] });
      for (const p of PLACES) pins.current[p.id] = L.current.marker([p.lat, p.lng], { icon: icon(p, !!done[p.id]), keyboard: false }).addTo(m);
      map.current = m;
      if (pos) drawMe();
    });
    return () => { dead = true; map.current?.remove(); map.current = null; };
    // 지도는 한 번만 만든다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawMe() {
    const ll = [pos.lat, pos.lng];
    if (!me.current) {
      me.current = L.current.circleMarker(ll, { radius: 9, color: '#fff', weight: 3, fillColor: '#e0533a', fillOpacity: 1 }).addTo(map.current);
    } else me.current.setLatLng(ll);
    if (!followed.current) { followed.current = true; map.current.setView(ll, 17); }
  }
  useEffect(() => { if (map.current && pos) drawMe(); });
  useEffect(() => {
    if (!map.current) return;
    for (const p of PLACES) pins.current[p.id]?.setIcon(icon(p, !!done[p.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return <div ref={box} className="map" />;
}
