/* ==========================================================================
   GRAFIK SVG ringan (tanpa pustaka): garis, batang, donat — dengan tooltip.
   Warna kategorikal: urutan tetap (tervalidasi palet: ungu, oranye, aqua, biru, kuning, magenta).
   ========================================================================== */
(function () {
'use strict';
const { esc, fmtN } = SP;
const SERIES = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)', 'var(--s6)'];
const OTHER = '#B9B3C6';

function mount(el, render) {
  el.classList.add('chart');
  el._render = render; el._w = el.clientWidth || 300;
  render(el._w);
  if (window.ResizeObserver && !el._ro) {
    el._ro = new ResizeObserver(() => { const nw = el.clientWidth; if (nw && Math.abs(nw - el._w) > 4) { el._w = nw; el._render(nw); } });
    el._ro.observe(el);
  }
}
function tipOn(el) { let t = el.querySelector('.tip'); if (!t) { t = document.createElement('div'); t.className = 'tip'; el.appendChild(t); } return t; }
function tipShow(el, x, y, html) { const t = tipOn(el); t.innerHTML = html; t.style.left = x + 'px'; t.style.top = y + 'px'; t.style.display = 'block'; }
function tipHide(el) { const t = el.querySelector('.tip'); if (t) t.style.display = 'none'; }
function niceMax(v) { if (v <= 4) return 4; const p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
function emptyMsg(el, h) { el.innerHTML = '<div class="muted small" style="height:' + (h || 160) + 'px;display:grid;place-items:center;border:1px dashed var(--c-border-s);border-radius:6px">Belum ada data untuk periode ini.</div>'; }

/** Grafik garis 1 seri + area, crosshair & tooltip */
function line(el, data, o) {
  o = o || {};
  const H = o.height || 220, unit = o.unit || '';
  if (!data || !data.length) return emptyMsg(el, H);
  mount(el, W => {
    const pl = 36, pr = 12, pt = 12, pb = 26, iw = W - pl - pr, ih = H - pt - pb;
    const max = niceMax(Math.max.apply(null, data.map(d => d.y)) || 1);
    const X = i => pl + (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw), Y = v => pt + ih - (v / max) * ih;
    let grid = '';
    for (let i = 0; i <= 4; i++) { const v = max * i / 4, y = Y(v); grid += '<line class="' + (i ? 'grid-l' : 'base-l') + '" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (pl - 6) + '" y="' + (y + 3) + '" text-anchor="end">' + fmtN(v) + '</text>'; }
    const step = Math.ceil(data.length / Math.max(2, Math.floor(iw / 70)));
    let xl = ''; data.forEach((d, i) => { if (i % step === 0 || i === data.length - 1) xl += '<text class="ax" x="' + X(i) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(d.x) + '</text>'; });
    const pts = data.map((d, i) => X(i) + ',' + Y(d.y)).join(' ');
    const area = 'M' + X(0) + ',' + Y(0) + ' L' + pts.replace(/ /g, ' L') + ' L' + X(data.length - 1) + ',' + Y(0) + ' Z';
    let len = 0; for (let i = 1; i < data.length; i++) len += Math.hypot(X(i) - X(i - 1), Y(data[i].y) - Y(data[i - 1].y));
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik garis') + '">' +
      '<defs><linearGradient id="gradP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--c-primary)" stop-opacity=".22"/><stop offset="1" stop-color="var(--c-primary)" stop-opacity="0"/></linearGradient></defs>' +
      grid + xl + '<path class="area" d="' + area + '"/><polyline class="line draw" style="--len:' + Math.ceil(len) + '" points="' + pts + '"/>' +
      '<line class="cross" x1="0" x2="0" y1="' + pt + '" y2="' + (pt + ih) + '" stroke="#9A93A8" stroke-dasharray="3 3" style="display:none"/>' +
      '<circle class="dotm" r="5" fill="var(--c-primary)" stroke="#fff" stroke-width="2" style="display:none"/>' +
      '<rect x="' + pl + '" y="' + pt + '" width="' + iw + '" height="' + ih + '" fill="transparent" class="hitarea"/></svg>';
    const svg = el.querySelector('svg'), cross = svg.querySelector('.cross'), dot = svg.querySelector('.dotm');
    const move = e => {
      const r = svg.getBoundingClientRect(), x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const i = Math.max(0, Math.min(data.length - 1, Math.round(((x - pl) / iw) * (data.length - 1))));
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.style.display = ''; dot.setAttribute('cx', X(i)); dot.setAttribute('cy', Y(data[i].y)); dot.style.display = '';
      tipShow(el, X(i), Y(data[i].y), esc(data[i].x) + '<br><b>' + fmtN(data[i].y) + '</b> ' + esc(unit));
    };
    const leave = () => { cross.style.display = 'none'; dot.style.display = 'none'; tipHide(el); };
    const hit = svg.querySelector('.hitarea');
    hit.addEventListener('mousemove', move); hit.addEventListener('touchstart', move, { passive: true }); hit.addEventListener('mouseleave', leave);
  });
}

/** Batang horizontal (label panjang, peringkat) */
function barH(el, data, o) {
  o = o || {};
  if (!data || !data.length) return emptyMsg(el, 160);
  const row = 30, H = data.length * row + 8, unit = o.unit || '';
  mount(el, W => {
    const lw = Math.min(200, Math.max(110, W * .38)), vw = 44, iw = W - lw - vw - 8;
    const max = Math.max.apply(null, data.map(d => d.y)) || 1, maxCh = Math.max(8, Math.floor((lw - 14) / 6.8));
    let s = '';
    data.forEach((d, i) => {
      const y = i * row + 4, w = Math.max(2, (d.y / max) * iw), full = String(d.x), lbl = full.length > maxCh ? full.slice(0, maxCh - 1).trim() + '…' : full;
      s += '<text class="ax" x="' + (lw - 8) + '" y="' + (y + 15) + '" text-anchor="end" style="font-family:var(--font);font-size:12px;fill:var(--c-text)"><title>' + esc(full) + '</title>' + esc(lbl) + '</text>' +
        '<rect class="bar grow-b" style="animation-delay:' + i * 40 + 'ms" x="' + lw + '" y="' + (y + 3) + '" width="' + w + '" height="' + (row - 12) + '" rx="4" data-i="' + i + '"/>' +
        '<text class="ax" x="' + (lw + w + 6) + '" y="' + (y + 15) + '">' + fmtN(d.y) + '</text>' +
        '<rect x="0" y="' + y + '" width="' + W + '" height="' + row + '" fill="transparent" data-i="' + i + '" class="hit"/>';
    });
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik batang') + '">' + s + '</svg>';
    el.querySelectorAll('.hit').forEach(h => {
      h.addEventListener('mouseenter', () => { const d = data[h.dataset.i]; tipShow(el, lw + (d.y / max) * iw / 2, Number(h.getAttribute('y')) + 4,
        esc(d.x) + '<br><b>' + fmtN(d.y) + '</b> ' + esc(unit) + (d.selesai !== undefined ? ' · ' + fmtN(d.selesai) + ' selesai' : '')); });
      h.addEventListener('mouseleave', () => tipHide(el));
    });
  });
}

/** Batang vertikal (kategori sedikit, mis. per tingkat) */
function barV(el, data, o) {
  o = o || {};
  const H = o.height || 220, unit = o.unit || '';
  if (!data || !data.length) return emptyMsg(el, H);
  mount(el, W => {
    const pl = 36, pr = 8, pt = 16, pb = 26, iw = W - pl - pr, ih = H - pt - pb, n = data.length;
    const max = niceMax(Math.max.apply(null, data.map(d => d.y)) || 1), slot = iw / n, bw = Math.min(56, slot * .56);
    let s = '';
    for (let i = 0; i <= 4; i++) { const v = max * i / 4, y = pt + ih - (v / max) * ih; s += '<line class="' + (i ? 'grid-l' : 'base-l') + '" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (pl - 6) + '" y="' + (y + 3) + '" text-anchor="end">' + fmtN(v) + '</text>'; }
    data.forEach((d, i) => {
      const h = Math.max(d.y ? 2 : 0, (d.y / max) * ih), x = pl + slot * i + (slot - bw) / 2, y = pt + ih - h;
      s += '<rect class="bar grow-v" style="animation-delay:' + i * 60 + 'ms" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="4"/>' +
        '<text class="ax" x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" style="fill:var(--c-text)">' + fmtN(d.y) + '</text>' +
        '<text class="ax" x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(String(d.x).length > 12 ? String(d.x).slice(0, 11) + '…' : d.x) + '</text>' +
        '<rect class="hit" data-i="' + i + '" x="' + (pl + slot * i) + '" y="' + pt + '" width="' + slot + '" height="' + ih + '" fill="transparent"/>';
    });
    el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" height="' + H + '" role="img" aria-label="' + esc(o.label || 'Grafik batang') + '">' + s + '</svg>';
    el.querySelectorAll('.hit').forEach(h => {
      h.addEventListener('mouseenter', () => { const i = Number(h.dataset.i), d = data[i];
        tipShow(el, pl + slot * i + slot / 2, pt + ih - (d.y / max) * ih, esc(d.x) + '<br><b>' + fmtN(d.y) + '</b> ' + esc(unit) + (d.selesai !== undefined ? ' · ' + fmtN(d.selesai) + ' selesai' : '')); });
      h.addEventListener('mouseleave', () => tipHide(el));
    });
  });
}

/** Donat: maks. 5 irisan + "Lainnya", legenda dengan nilai (identitas tidak hanya lewat warna) */
function donut(el, data, o) {
  o = o || {};
  if (!data || !data.length) return emptyMsg(el, 170);
  let d = data.slice().sort((a, b) => b.y - a.y);
  if (d.length > 6) { const rest = d.slice(5).reduce((s, x) => s + x.y, 0); d = d.slice(0, 5).concat([{ x: 'Lainnya', y: rest, other: true }]); }
  const total = d.reduce((s, x) => s + x.y, 0) || 1, R = 70, r = 46, C = 85;
  let a0 = -Math.PI / 2, paths = '';
  d.forEach((x, i) => {
    const a1 = a0 + (x.y / total) * Math.PI * 2, gap = d.length > 1 ? .025 : 0;
    const p = (rad, ang) => (C + rad * Math.cos(ang)).toFixed(2) + ',' + (C + rad * Math.sin(ang)).toFixed(2);
    const s0 = a0 + gap / 2, s1 = Math.max(s0, a1 - gap / 2), large = s1 - s0 > Math.PI ? 1 : 0;
    const path = d.length === 1 ? 'M' + p(R, 0) + ' A' + R + ',' + R + ' 0 1 1 ' + p(R, Math.PI) + ' A' + R + ',' + R + ' 0 1 1 ' + p(R, 0) + ' M' + p(r, 0) + ' A' + r + ',' + r + ' 0 1 0 ' + p(r, Math.PI) + ' A' + r + ',' + r + ' 0 1 0 ' + p(r, 0) + 'Z'
      : 'M' + p(R, s0) + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + p(R, s1) + ' L' + p(r, s1) + ' A' + r + ',' + r + ' 0 ' + large + ' 0 ' + p(r, s0) + 'Z';
    paths += '<path d="' + path + '" fill="' + (x.other ? OTHER : SERIES[i]) + '" fill-rule="evenodd" data-i="' + i + '" style="cursor:pointer;transition:opacity .15s"/>';
    a0 = a1;
  });
  el.classList.add('chart');
  el.innerHTML = '<div class="donut-wrap"><svg viewBox="0 0 170 170" width="170" height="170" role="img" aria-label="' + esc(o.label || 'Grafik donat') + '" style="animation:popIn .5s var(--ease)">' + paths +
    '<text x="85" y="82" text-anchor="middle" style="font-size:24px;font-weight:700;fill:var(--c-text)">' + fmtN(total) + '</text><text x="85" y="100" text-anchor="middle" class="ax">' + esc(o.unit || 'total') + '</text></svg>' +
    '<div class="legend">' + d.map((x, i) => '<div class="li" data-i="' + i + '"><span class="sw" style="background:' + (x.other ? OTHER : SERIES[i]) + '"></span><span class="trunc">' + esc(x.x) + '</span><span class="v">' + fmtN(x.y) + ' · ' + Math.round(x.y / total * 100) + '%</span></div>').join('') + '</div></div>';
  const svg = el.querySelector('svg');
  svg.querySelectorAll('path').forEach(pth => {
    pth.addEventListener('mouseenter', () => { svg.querySelectorAll('path').forEach(q => { q.style.opacity = q === pth ? 1 : .45; }); const x = d[pth.dataset.i];
      tipShow(el, 85, 30, esc(x.x) + '<br><b>' + fmtN(x.y) + '</b> (' + Math.round(x.y / total * 100) + '%)'); });
    pth.addEventListener('mouseleave', () => { svg.querySelectorAll('path').forEach(q => { q.style.opacity = 1; }); tipHide(el); });
  });
}

window.Charts = { line, barH, barV, donut };
})();
