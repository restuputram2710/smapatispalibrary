/* ==========================================================================
   INTI: ikon, utilitas, penyimpanan lokal, klien API, router
   ========================================================================== */
(function () {
'use strict';
const VERSION = '1.1.0';

/* ---------------- Ikon (SVG garis, gaya Lucide) ---------------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
  shelf: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="m16.5 5.2 3.6-1 4 15.4-3.6 1z" transform="translate(-2 0)"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
  sparkles: '<path d="m12 3 1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  book: '<path d="M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
  open: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>',
  reader: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z"/>',
  logo: '<path d="M12 7v13"/><path d="M3 17V6.5c3-1 6-1 9 .5 3-1.5 6-1.5 9-.5V17c-3-1-6-1-9 .5-3-1.5-6-1.5-9-.5Z"/><circle cx="12" cy="3.6" r="1.6"/>',
  cap: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  userplus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  bars: '<path d="M3 21h18"/><rect x="5" y="10" width="3" height="8" rx="1"/><rect x="10.5" y="5" width="3" height="13" rx="1"/><rect x="16" y="13" width="3" height="5" rx="1"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2"/><path d="M6.6 6.6C3.9 8.3 2 12 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="m2 2 20 20"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>', check: '<path d="M20 6 9 17l-5-5"/>',
  checkc: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', down: '<path d="m6 9 6 6 6-6"/>', up: '<path d="m18 15-6-6-6 6"/>',
  arrowr: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>', arrowl: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  filter: '<path d="M22 3H2l8 9.5V19l4 2v-8.5Z"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3Z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  palette: '<circle cx="13.5" cy="6.5" r="1.2"/><circle cx="17.5" cy="10.5" r="1.2"/><circle cx="8.5" cy="7.5" r="1.2"/><circle cx="6.5" cy="12.5" r="1.2"/><path d="M12 2a10 10 0 0 0 0 20 2 2 0 0 0 2-2c0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3a2 2 0 0 1 2-2h2.3A5.6 5.6 0 0 0 22 10c0-4.4-4.5-8-10-8Z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', more: '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  max: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  zin: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M11 8v6M8 11h6"/>', zout: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3M8 11h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', sepia: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>',
  page1: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h3"/>', page2: '<rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  idcard: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16a3 3 0 0 1 6 0M14 10h5M14 14h3"/>',
  keypad: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M7 14h.01M11 14h.01M15 14h2"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3Z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
  headset: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><rect x="9.5" y="11" width="5" height="4" rx="1"/><path d="M10.5 11V9.5a1.5 1.5 0 0 1 3 0V11"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.8V4h6v6.8l3 3.2H6Z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  // ikon mapel & kategori
  atom: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
  dna: '<path d="M4 2c0 6 16 8 16 14M20 2c0 6-16 8-16 14M4 22c0-2 1-3.4 2.6-4.5M20 22c0-2-1-3.4-2.6-4.5M7 6h10M6 18h12"/>',
  matematika: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15v3M8 18h4"/>',
  sejarah: '<path d="M3 22h18M6 18V11M10 18V11M14 18V11M18 18V11M12 2 20 7H4Z"/>',
  olahraga: '<path d="M6.5 6.5 17.5 17.5M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7"/>',
  seni: '<path d="m14.6 3.4 6 6L10 20H4v-6Z"/><path d="m12 6 6 6"/>',
  komputer: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
  grafik: '<path d="M22 7 13.5 15.5l-5-5L2 17"/><path d="M16 7h6v6"/>',
  peta: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15M15 6v15"/>',
  orang: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/><path d="M19 8v6M22 11h-6"/>',
  palu: '<path d="m15 12-8.4 8.4a2.1 2.1 0 0 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.9-1.9A2 2 0 0 1 19 8.2v-.9l-2.3-2.2a6 6 0 0 0-4.2-1.7H9l.9.8A6.2 6.2 0 0 1 12 8.9V10l2 2h1.2a2 2 0 0 1 1.4.6l1.9 1.9"/>',
  bahasa: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>',
  agama: '<path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="4"/>',
  pancasila: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>',
  pena: '<path d="M12 19l7-7 3 3-7 7-3-3Z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5Z"/><path d="m2 2 7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  bintang: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/>',
  referensi: '<path d="M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/><path d="M8 7h8M8 11h6"/>',
  buku: '<path d="M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>'
};
P.koleksi = '<path d="M4 7h16v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z"/><path d="M8 7V4h8v3"/><path d="M9 12h6"/>';
P.globe2 = P.globe;
function ic(name, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[name] || P.book) + '</svg>'; }

/* ---------------- Utilitas ---------------- */
const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const nf = new Intl.NumberFormat('id-ID');
const fmtN = n => nf.format(Math.round(Number(n) || 0));
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function fmtDate(t, withTime) {
  if (!t) return '-';
  const d = new Date(t); if (isNaN(d)) return '-';
  let s = d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear();
  if (withTime) s += ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  return s;
}
function fmtRel(t) {
  if (!t) return '-';
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'baru saja';
  if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
  const d = new Date(t), now = new Date(), y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  if (d.toDateString() === now.toDateString()) return 'hari ini ' + hm;
  if (d.toDateString() === y.toDateString()) return 'kemarin ' + hm;
  if (s < 7 * 86400) return Math.floor(s / 86400) + ' hari lalu';
  return fmtDate(t);
}
function fmtSize(b) { b = Number(b) || 0; return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
function debounce(fn, ms) { let t; return function () { const a = arguments, self = this; clearTimeout(t); t = setTimeout(() => fn.apply(self, a), ms); }; }
function initials(n) { return String(n || '?').trim().split(/\s+/).filter(w => /[A-Za-z]/.test(w[0])).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?'; }
function hashStr(s) { let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
const AV_COLORS = ['#6B3FA0', '#2F6B10', '#2F7D9A', '#B26A1B', '#C24D6B', '#4A5BC4', '#0E7C66', '#8E4EC6'];
const avColor = s => AV_COLORS[hashStr(s) % AV_COLORS.length];
function qsParse(s) { const o = {}; new URLSearchParams(s || '').forEach((v, k) => { o[k] = v; }); return o; }
function qsBuild(o) { const p = new URLSearchParams(); Object.keys(o || {}).forEach(k => { if (o[k] !== '' && o[k] !== undefined && o[k] !== null && o[k] !== false) p.set(k, o[k]); }); const s = p.toString(); return s ? '?' + s : ''; }

/* ---------------- Warna tema dari pengaturan ---------------- */
function hexRgb(h) { h = String(h || '').replace('#', ''); if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, '$&$&'); if (!/^[0-9a-f]{6}$/i.test(h)) return null; return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); }
function rgbHex(r) { return '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); }
function lum(h) { return hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0); }
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
/** Gelapkan warna sampai teks putih di atasnya terbaca (≥ 4.5:1) */
function strongFor(h) { let c = h; for (let i = 0; i < 20 && contrast(c, '#ffffff') < 4.6; i++) c = mix(c, '#000000', .08); return c; }
function inkFor(h) { let c = h; for (let i = 0; i < 20 && contrast(c, '#ffffff') < 6; i++) c = mix(c, '#000000', .08); return c; }
function applyTheme(s) {
  if (!s) return;
  const p = hexRgb(s.WARNA_UTAMA) ? s.WARNA_UTAMA : '#6B3FA0', a = hexRgb(s.WARNA_AKSEN) ? s.WARNA_AKSEN : '#5E9E34', bg = hexRgb(s.WARNA_LATAR) ? s.WARNA_LATAR : '#F4F1FA';
  const st = document.documentElement.style, pS = strongFor(p), aS = strongFor(a);
  const v = { '--c-primary': pS, '--c-primary-h': mix(pS, '#000', .14), '--c-primary-soft': mix(p, '#fff', .88), '--c-primary-ink': inkFor(p),
    '--c-primary-line': mix(p, '#fff', .74), '--c-accent': a, '--c-accent-h': mix(a, '#000', .12), '--c-accent-strong': aS,
    '--c-accent-strong-h': mix(aS, '#000', .15), '--c-accent-soft': mix(a, '#fff', .86), '--c-accent-ink': inkFor(a), '--c-bg': bg,
    '--c-hover': mix(bg, p, .04), '--c-surface': mix(bg, '#fff', .62), '--s1': p };
  Object.keys(v).forEach(k => st.setProperty(k, v[k]));
  const meta = $('meta[name=theme-color]'); if (meta) meta.content = pS;
}

/* ---------------- Penyimpanan lokal (aman bila diblokir) ---------------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem('sp_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('sp_' + k, JSON.stringify(v)); } catch (e) { /* penuh / diblokir */ } },
  del(k) { try { localStorage.removeItem('sp_' + k); } catch (e) { /* */ } },
  clearCache() { try { Object.keys(localStorage).filter(k => k.indexOf('sp_c_') === 0).forEach(k => localStorage.removeItem(k)); } catch (e) { /* */ } }
};

/* ---------------- Pengukur kinerja (Perf.table() di console) ---------------- */
const Perf = { log: [],
  add(a, total, server, cached) { this.log.push({ aksi: a, total: Math.round(total), server: server || 0, net: Math.round(total - (server || 0)), cache: cached ? '✓' : '' }); if (this.log.length > 200) this.log.shift(); },
  table() { console.table(this.log.slice(-40)); },
  summary() { const g = {}; this.log.forEach(x => { const s = g[x.aksi] || (g[x.aksi] = { n: 0, total: 0, server: 0 }); s.n++; s.total += x.total; s.server += x.server; });
    console.table(Object.keys(g).map(k => ({ aksi: k, n: g[k].n, rata_total: Math.round(g[k].total / g[k].n), rata_server: Math.round(g[k].server / g[k].n) }))); }
};

/* ---------------- Klien API ---------------- */
const READ = /^(boot|katalog|buku\.detail|pelajaran|rak|riwayat|rekomendasi|adm\.(dashboard|buku\.daftar|buku\.get|ref|pengguna\.daftar|peran|laporan|pengumuman|pengaturan|log|sistem))$/;
const Session = {
  token: LS.get('token', ''), me: LS.get('me', null),
  set(token, me) { this.token = token || ''; this.me = me || null; LS.set('token', this.token); LS.set('me', this.me); },
  clear() { this.token = ''; this.me = null; LS.del('token'); LS.del('me'); LS.clearCache(); },
  can(k) { const m = this.me; if (!m) return false; if (m.superadmin) return true; return (Array.isArray(k) ? k : [k]).some(x => m.izin.indexOf(x) > -1); }
};
const inflight = {}; let writeEpoch = 0, drainTimer = null, drainRuns = 0;
function gasUrl() { return (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || ''; }
function configured() { const u = gasUrl(); return !!u && !/GANTI|XXXX/.test(u); }
async function rawCall(action, data, opts) {
  opts = opts || {};
  if (!configured()) return { success: false, message: 'Konfigurasi belum lengkap: isi GAS_URL di js/config.js.', code: 'CONFIG' };
  const t0 = performance.now(), body = JSON.stringify({ action, token: Session.token, data: data || {} });
  let res, tries = READ.test(action) ? 2 : 1;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(gasUrl(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' });
      res = await r.json();
      break;
    } catch (e) {
      res = { success: false, message: navigator.onLine === false ? 'Anda sedang luring. Periksa koneksi internet.' : 'Tidak dapat terhubung ke server. Coba lagi.', code: 'NET' };
      if (i < tries - 1) await new Promise(r => setTimeout(r, 700));
    }
  }
  Perf.add(action, performance.now() - t0, res.ms, res.cached);
  if (res.sesi === 'invalid' || res.code === 'AUTH') {
    if (Session.token && !opts.noAuthRedirect) { Session.clear(); window.dispatchEvent(new CustomEvent('sp:auth-expired', { detail: res.message })); }
  }
  if (res.nq) scheduleDrain();
  return res;
}
function api(action, data, opts) {
  if (!READ.test(action) || (data && data._fresh)) { writeEpoch++; return rawCall(action, data, opts); }
  const k = writeEpoch + '|' + action + '|' + Session.token.slice(-12) + '|' + JSON.stringify(data || {});
  if (inflight[k]) return inflight[k];
  const p = rawCall(action, data, opts); inflight[k] = p;
  p.finally(() => { delete inflight[k]; });
  return p;
}
/** Gabungkan beberapa aksi baca menjadi 1 eksekusi server */
async function apiMany(calls) {
  if (calls.length === 1) return [await api(calls[0][0], calls[0][1])];
  const r = await rawCall('batch', { calls: calls.map(c => ({ action: c[0], data: c[1] || {} })) });
  if (!r.success) return calls.map(() => r);
  r.data.forEach(x => { if (x && (x.code === 'AUTH')) { Session.clear(); window.dispatchEvent(new CustomEvent('sp:auth-expired')); } });
  return r.data;
}
function scheduleDrain() {
  clearTimeout(drainTimer); drainRuns = 0;
  drainTimer = setTimeout(async function run() {
    const r = await rawCall('drain', {});
    if (r.success && r.data && r.data.left > 0 && ++drainRuns < 3) drainTimer = setTimeout(run, 1500);
  }, 400);
}
/** Kirim saat halaman ditutup (progres terakhir) */
function beacon(action, data) {
  if (!configured() || !navigator.sendBeacon) return false;
  try { return navigator.sendBeacon(gasUrl(), new Blob([JSON.stringify({ action, token: Session.token, data })], { type: 'text/plain;charset=utf-8' })); } catch (e) { return false; }
}
/** Panaskan server (cache & runtime) tanpa menunggu jawaban, maks. 1× per 4 menit per lingkup */
function warmUp(scope) {
  if (!configured()) return;
  try {
    const k = 'sp_warm_' + scope, last = Number(sessionStorage.getItem(k) || 0);
    if (Date.now() - last < 240000) return;
    sessionStorage.setItem(k, String(Date.now()));
  } catch (e) { /* */ }
  fetch(gasUrl() + '?w=' + encodeURIComponent(scope), { mode: 'no-cors' }).catch(() => {});
}

/* ---------------- Cache SWR (tampil instan dari lokal, segarkan di latar) ---------------- */
const mem = {};
function cacheGet(key) { if (mem[key]) return mem[key]; const v = LS.get('c_' + key, null); if (v) mem[key] = v; return v; }
function cachePut(key, data) {
  const v = { t: Date.now(), d: data, h: hashStr(JSON.stringify(data)) };
  mem[key] = v;
  if (JSON.stringify(v).length < 400000) LS.set('c_' + key, v);
  return v;
}
/**
 * swr(key, action, data, maxAgeMs, onData)
 *  - onData(data, fromCache) dipanggil segera dari cache (bila ada) lalu lagi bila data server berbeda
 */
async function swr(key, action, data, maxAge, onData, onError) {
  const c = cacheGet(key);
  if (c) onData(c.d, true);
  if (c && Date.now() - c.t < maxAge) return c.d;
  const r = await api(action, data);
  if (!r.success) { if (onError) onError(r, !!c); return c ? c.d : null; }
  const old = c ? c.h : null, v = cachePut(key, r.data);
  if (v.h !== old) onData(r.data, false);
  return r.data;
}
function cacheDrop(prefix) { Object.keys(mem).forEach(k => { if (k.indexOf(prefix) === 0) delete mem[k]; }); try { Object.keys(localStorage).forEach(k => { if (k.indexOf('sp_c_' + prefix) === 0) localStorage.removeItem(k); }); } catch (e) { /* */ } }

/* ---------------- Router (hash) ---------------- */
const Router = {
  routes: [], navId: 0, current: null,
  add(pattern, handler, opts) {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (m, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
    this.routes.push({ pattern, re, keys, handler, opts: opts || {} });
  },
  parse() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [path, qs] = h.split('?');
    return { path: path || '/', query: qsParse(qs) };
  },
  go(href, replace) { if (replace) location.replace('#' + href.replace(/^#/, '')); else location.hash = href.replace(/^#/, ''); },
  resolve() {
    const { path, query } = this.parse();
    for (const r of this.routes) {
      const m = path.match(r.re);
      if (m) { const params = {}; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); }); return { route: r, params, query, path }; }
    }
    return null;
  }
};

window.SP = { VERSION, ic, esc, $, $$, fmtN, fmtDate, fmtRel, fmtSize, debounce, initials, hashStr, avColor, qsParse, qsBuild,
  hexRgb, mix, contrast, strongFor, applyTheme, LS, Perf, Session, api, apiMany, rawCall, beacon, warmUp, configured, swr, cacheGet, cachePut, cacheDrop, Router, BLN };
window.Perf = Perf;
})();
