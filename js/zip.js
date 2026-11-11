/* ==========================================================================
   ZIP mini (baca & tulis) + Excel (.xlsx) + CSV — tanpa pustaka luar.
   Dipakai untuk: pembaca EPUB, impor Excel/CSV, ekspor laporan Excel.
   ========================================================================== */
(function () {
'use strict';
const td = new TextDecoder('utf-8'), te = new TextEncoder();

/* ---------- Baca ZIP (DecompressionStream 'deflate-raw') ---------- */
async function zipRead(buf) {
  const u = new Uint8Array(buf), dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
  let eocd = -1;
  for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Berkas ZIP tidak valid.');
  const n = dv.getUint16(eocd + 10, true); let p = dv.getUint32(eocd + 16, true);
  const entries = {};
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nlen = dv.getUint16(p + 28, true),
      xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = td.decode(u.subarray(p + 46, p + 46 + nlen));
    entries[name] = { method, csize, off };
    p += 46 + nlen + xlen + clen;
  }
  async function data(name) {
    const e = entries[name]; if (!e) return null;
    const ln = dv.getUint16(e.off + 26, true), lx = dv.getUint16(e.off + 28, true), start = e.off + 30 + ln + lx;
    const raw = u.subarray(start, start + e.csize);
    if (e.method === 0) return raw.slice();
    if (e.method !== 8) throw new Error('Kompresi ZIP tidak didukung.');
    const ds = new DecompressionStream('deflate-raw');
    const out = await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer();
    return new Uint8Array(out);
  }
  return { names: Object.keys(entries), has: k => !!entries[k], data, text: async k => { const d = await data(k); return d ? td.decode(d) : null; } };
}

/* ---------- Tulis ZIP (tanpa kompresi) ---------- */
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u) { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipWrite(files) {
  const parts = [], central = []; let off = 0;
  files.forEach(f => {
    const name = te.encode(f.name), data = typeof f.data === 'string' ? te.encode(f.data) : f.data, crc = crc32(data);
    const h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
    h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
    central.push(new Uint8Array(c.buffer), name);
    off += 30 + name.length + data.length;
  });
  const csize = central.reduce((s, x) => s + x.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csize, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
}

/* ---------- Excel ---------- */
const x = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
function colName(i) { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
/** rows: array of array (baris pertama = judul kolom) */
function xlsxBlob(rows, sheetName) {
  const sd = rows.map((r, ri) => '<row r="' + (ri + 1) + '">' + r.map((v, ci) => {
    const ref = colName(ci) + (ri + 1), st = ri === 0 ? ' s="1"' : '';
    if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
    return '<c r="' + ref + '" t="inlineStr"' + st + '><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
  }).join('') + '</row>').join('');
  const widths = (rows[0] || []).map((_, ci) => Math.min(60, Math.max(8, ...rows.slice(0, 200).map(r => String(r[ci] === undefined ? '' : r[ci]).length + 2))));
  const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
    '<cols>' + widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols><sheetData>' + sd + '</sheetData></worksheet>';
  return zipWrite([
    { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
    { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
    { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + x(String(sheetName || 'Laporan').slice(0, 31).replace(/[\\\/?*\[\]:]/g, ' ')) + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
    { name: 'xl/styles.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF6B3FA0"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>' },
    { name: 'xl/worksheets/sheet1.xml', data: sheet }
  ]);
}
async function xlsxRead(buf) {
  const z = await zipRead(buf), P = new DOMParser();
  const ss = [], sst = await z.text('xl/sharedStrings.xml');
  if (sst) P.parseFromString(sst, 'application/xml').querySelectorAll('si').forEach(si => ss.push(Array.from(si.querySelectorAll('t')).map(t => t.textContent).join('')));
  let path = 'xl/worksheets/sheet1.xml';
  const wb = await z.text('xl/workbook.xml'), rels = await z.text('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const first = P.parseFromString(wb, 'application/xml').querySelector('sheet');
    const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
    const rel = Array.from(P.parseFromString(rels, 'application/xml').querySelectorAll('Relationship')).find(r => r.getAttribute('Id') === rid);
    if (rel) path = 'xl/' + rel.getAttribute('Target').replace(/^\/?xl\//, '').replace(/^\//, '');
  }
  const doc = P.parseFromString(await z.text(path), 'application/xml'), rows = [];
  doc.querySelectorAll('sheetData > row').forEach(r => {
    const arr = [];
    r.querySelectorAll('c').forEach(c => {
      const ref = c.getAttribute('r') || '', col = ref.replace(/\d+/g, '').split('').reduce((s, ch) => s * 26 + ch.charCodeAt(0) - 64, 0) - 1;
      const t = c.getAttribute('t'), v = c.querySelector('v'), is = c.querySelector('is');
      let val = '';
      if (t === 's') val = ss[Number(v && v.textContent)] || '';
      else if (t === 'inlineStr') val = is ? is.textContent : '';
      else val = v ? v.textContent : '';
      arr[col >= 0 ? col : arr.length] = val;
    });
    rows.push(Array.from(arr, v => v === undefined ? '' : v));
  });
  return rows;
}
/* ---------- CSV ---------- */
function csvParse(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : (firstLine.indexOf('\t') > -1 ? '\t' : ',');
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}
function csvBuild(rows) { return '﻿' + rows.map(r => r.map(v => { const s = String(v === null || v === undefined ? '' : v); return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n'); }
/** Ubah tabel (baris pertama = header) menjadi array objek */
function rowsToObjects(rows) {
  let hi = 0; for (let i = 0; i < Math.min(10, rows.length); i++) if (rows[i].filter(c => String(c).trim()).length >= 2) { hi = i; break; }
  const h = rows[hi].map(c => String(c).trim());
  return rows.slice(hi + 1).map(r => { const o = {}; h.forEach((k, i) => { if (k) o[k] = r[i] === undefined ? '' : r[i]; }); return o; });
}
window.Zip = { read: zipRead, write: zipWrite, xlsxBlob, xlsxRead, csvParse, csvBuild, rowsToObjects };
})();
