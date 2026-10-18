(function () {
  'use strict';

  const WS = window.WORKSHEETS;
  const STORE = 'iso42001:ws:';
  const PREFS = 'iso42001:prefs';
  const ORG_PLACEHOLDER = '[Organization Name]';

  /* ---------- storage (every access guarded: private mode can throw) ---------- */
  const store = {
    get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } },
    del(key) { try { localStorage.removeItem(key); } catch (e) {} }
  };

  const prefs = Object.assign({ examples: false }, store.get(PREFS) || {});
  const savePrefs = () => store.set(PREFS, prefs);

  const cache = {};
  function load(id) {
    if (!cache[id]) cache[id] = Object.assign({ v: {}, t: {}, saved: null }, store.get(STORE + id) || {});
    return cache[id];
  }
  const saveTimers = {};
  function writeNow(id) {
    clearTimeout(saveTimers[id]); delete saveTimers[id];
    const d = load(id);
    d.saved = new Date().toISOString();
    const ok = store.set(STORE + id, d);
    if (current && current.id === id) setSaved(ok ? d.saved : null, !ok);
    renderNav();
  }
  function persist(id) {
    clearTimeout(saveTimers[id]);
    saveTimers[id] = setTimeout(() => writeNow(id), 350);
  }
  const flushSaves = () => Object.keys(saveTimers).forEach(writeNow);
  window.addEventListener('pagehide', flushSaves);

  /* ---------- helpers ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null) n.append(kid.nodeType ? kid : document.createTextNode(kid));
    return n;
  }
  const icon = name => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'i'); s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#i-' + name); s.append(u); return s;
  };
  const uid = (() => { let n = 0; return p => (p || 'f') + '-' + (++n); })();
  const today = () => new Date().toISOString().slice(0, 10);

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ---------- status marks: a fixed-cell glyph per status value ---------- */
  const MARKS = {
    done: ['C', 'Y', 'Implemented', 'Achieved'],
    part: ['PC', 'Partial', 'Partially implemented', 'On track', 'OFI'],
    warn: ['At risk', 'TBD'],
    open: ['Not implemented'],
    fail: ['NC', 'N', 'Missed'],
    na: ['N/A', 'Not applicable']
  };
  const markOf = v => { for (const k in MARKS) if (MARKS[k].includes(v)) return k; return v ? 'open' : 'empty'; };
  const markGlyph = () => el('span', { class: 'mark', 'aria-hidden': 'true' });

  /* ---------- risk scoring ---------- */
  function riskLevel(score) {
    if (!score) return '';
    if (score >= 17) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  }
  const levelClass = lvl => lvl ? 'lvl lvl-' + lvl.toLowerCase() : 'lvl';

  /* ---------- textarea autosize ---------- */
  // size to the content, or to the placeholder template while the field is empty
  function grow(ta) {
    ta.style.height = 'auto';
    let h = ta.scrollHeight;
    if (!ta.value && ta.placeholder) { ta.value = ta.placeholder; h = ta.scrollHeight; ta.value = ''; }
    ta.style.height = h + 2 + 'px';
  }

  /* ======================================================================
     Rendering
     ====================================================================== */
  let current = null; // current worksheet definition

  function renderNav() {
    const nav = $('#nav');
    const route = currentRoute();
    nav.innerHTML = '';
    const list = el('ol', { class: 'nav-list' });
    list.append(el('li', null, el('a', { href: '#/how-to-use', class: 'nav-item' + (route === 'how-to-use' ? ' is-current' : ''), 'aria-current': route === 'how-to-use' ? 'page' : null },
      el('span', { class: 'nav-label' }, 'How to use'))));
    list.append(el('li', { class: 'nav-rule', 'aria-hidden': 'true' }));
    WS.forEach(ws => {
      const p = progress(ws);
      const cur = route === ws.id;
      list.append(el('li', null, el('a', {
        href: '#/' + ws.id, class: 'nav-item' + (cur ? ' is-current' : ''), 'aria-current': cur ? 'page' : null
      },
        el('span', { class: 'nav-label' }, ws.nav),
        el('span', { class: 'nav-pct' + (p === 100 ? ' is-full' : ''), title: p + '% complete', 'aria-label': p + '% complete' }, p ? p + '%' : '·'),
        el('span', { class: 'nav-meter', 'aria-hidden': 'true' }, el('span', { style: 'width:' + p + '%' }))
      )));
    });
    nav.append(list);
  }

  function currentRoute() {
    const h = location.hash.replace(/^#\/?/, '');
    return WS.some(w => w.id === h) ? h : 'how-to-use';
  }

  function route() {
    const r = currentRoute();
    flushSaves();
    closeMenu();
    const view = $('#view');
    view.innerHTML = '';
    if (r === 'how-to-use') { current = null; renderHowTo(view); document.title = 'How to use · ISO 42001 Initiation Workbook'; }
    else { current = WS.find(w => w.id === r); renderSheet(view, current); document.title = current.nav + ' · ISO 42001 Initiation Workbook'; }
    renderNav();
    window.scrollTo(0, 0);
    $('#main').focus({ preventScroll: true });
  }

  /* ---------- How to use ---------- */
  function renderHowTo(view) {
    view.append($('#tpl-howto').content.cloneNode(true));
    const idx = $('#sheet-index', view);
    const what = {
      context: 'The issues and stakeholders that shape your scope, risks and objectives.',
      legal: 'Every AI, privacy, consumer and sector obligation, and how you meet it.',
      policy: 'Top management’s documented commitment to responsible AI.',
      impact: 'The consequences of each AI system for individuals, groups and society.',
      risk: 'Scored AI risks with owners, Annex A controls and treatment status.',
      soa: 'All 38 Annex A controls, applicable or not, with justification.',
      objectives: 'Measurable AI objectives with KPIs, owners and progress.',
      gap: 'Where you stand today against every clause and Annex A control.',
      audit: 'The internal audit evidence, findings and conclusion.',
      readiness: 'A final Stage 1 check before the certification body arrives.'
    };
    const list = el('ol', { class: 'index-list' });
    WS.forEach(ws => list.append(el('li', null, el('a', { href: '#/' + ws.id },
      el('span', { class: 'idx-ref' }, ws.ref),
      el('span', { class: 'idx-title' }, ws.title),
      el('span', { class: 'idx-what' }, what[ws.id]),
      icon('arrow')
    ))));
    idx.append(list);
    $('#clear-all', view).addEventListener('click', () => {
      if (!confirm('Erase every worksheet stored in this browser? Export anything you want to keep first. This cannot be undone.')) return;
      WS.forEach(w => { store.del(STORE + w.id); delete cache[w.id]; });
      renderNav();
      toast('All worksheets erased from this browser.');
    });
  }

  /* ---------- Worksheet ---------- */
  function renderSheet(view, ws) {
    const data = load(ws.id);
    const sheet = el('article', { class: 'sheet', 'data-ws': ws.id });

    sheet.append(el('header', { class: 'sheet-head' },
      el('div', { class: 'margin' }, el('span', { class: 'ref' }, ws.ref)),
      el('div', { class: 'sheet-title' },
        el('p', { class: 'std' }, 'ISO/IEC 42001:2023'),
        el('h1', null, ws.title),
        el('p', { class: 'lede' }, ws.intro)
      )
    ));

    sheet.append(toolbar(ws, data));

    ws.sections.forEach(sec => sheet.append(renderSection(ws, sec, data)));

    sheet.append(el('footer', { class: 'print-foot' }, ws.title + ' · ISO/IEC 42001:2023 · printed ' + today()));
    view.append(sheet);

    $$('textarea', sheet).forEach(grow);
    recompute(ws);
    setSaved(data.saved);
  }

  function toolbar(ws, data) {
    const exBtn = el('button', { type: 'button', class: 'btn btn-quiet', 'aria-pressed': String(prefs.examples), onclick: e => {
      prefs.examples = !prefs.examples; savePrefs();
      e.currentTarget.setAttribute('aria-pressed', String(prefs.examples));
      e.currentTarget.lastChild.textContent = prefs.examples ? 'Hide all examples' : 'Show all examples';
      $$('details.example').forEach(d => { d.open = prefs.examples; });
    } }, icon('book'), prefs.examples ? 'Hide all examples' : 'Show all examples');

    return el('div', { class: 'toolbar', role: 'toolbar', 'aria-label': 'Worksheet actions' },
      el('div', { class: 'tb-group' },
        exBtn,
        el('span', { class: 'saved', id: 'saved' })
      ),
      el('div', { class: 'tb-group' },
        el('button', { type: 'button', class: 'btn', onclick: () => exportXML(ws) }, icon('download'), 'Export XML'),
        el('button', { type: 'button', class: 'btn', onclick: () => { $('#import-file').dataset.target = ws.id; $('#import-file').click(); } }, icon('upload'), 'Import XML'),
        el('button', { type: 'button', class: 'btn', onclick: e => savePDF(ws, e.currentTarget) }, icon('pdf'), 'Save as PDF'),
        el('button', { type: 'button', class: 'btn btn-quiet danger', onclick: () => clearSheet(ws) }, icon('erase'), 'Clear')
      )
    );
  }

  function setSaved(iso, failed) {
    const s = $('#saved');
    if (!s) return;
    if (failed) { s.textContent = 'Not saved. Browser storage is unavailable, so export to keep your work.'; s.classList.add('is-warn'); return; }
    s.classList.remove('is-warn');
    if (!iso) { s.textContent = 'Nothing saved yet'; return; }
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    s.textContent = 'Saved in this browser · ' + (sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString());
  }

  function renderSection(ws, sec, data) {
    const body = el('div', { class: 'sec-body' }, el('h2', null, sec.title));
    if (sec.intro) body.append(el('p', { class: 'sec-intro' }, sec.intro));
    if (sec.example) {
      body.append(el('details', { class: 'example', open: prefs.examples },
        el('summary', null, el('span', null, 'Example')),
        el('p', { html: sec.example })
      ));
    }
    sec.blocks.forEach(b => body.append(renderBlock(ws, sec, b, data)));
    return el('section', { class: 'sec', id: 'sec-' + sec.id },
      el('div', { class: 'margin' }, sec.ref ? el('span', { class: 'ref' }, sec.ref) : null),
      body);
  }

  const key = (sec, b, ...rest) => [sec.id, b.id, ...rest].join('/');

  // template text is shown as a greyed placeholder, never stored as a value
  function bindInput(ws, input, k, template) {
    const data = load(ws.id);
    const val = data.v[k] || '';
    if (input.type === 'checkbox') input.checked = val === 'true';
    else input.value = val;
    if (template && input.tagName !== 'SELECT') { input.placeholder = template; input.classList.add('has-template'); }
    input.addEventListener(input.tagName === 'SELECT' || input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input', () => {
      data.v[k] = input.type === 'checkbox' ? String(input.checked) : input.value;
      if (input.tagName === 'TEXTAREA') grow(input);
      recompute(ws);
      persist(ws.id);
    });
    return input;
  }

  function control(ws, col, k, labelText, fallback) {
    let input;
    const id = uid('c');
    if (col.type === 'textarea') input = el('textarea', { id, rows: col.rows || 1, 'aria-label': labelText, placeholder: col.placeholder || null });
    else if (col.type === 'select') {
      input = el('select', { id, 'aria-label': labelText }, el('option', { value: '' }, '—'),
        col.options.map(o => el('option', { value: o.value }, o.label)));
    } else input = el('input', { id, type: col.type === 'date' ? 'date' : 'text', 'aria-label': labelText, placeholder: col.placeholder || null });
    bindInput(ws, input, k, fallback);
    if (col.mark) {
      const wrap = el('span', { class: 'mark-cell', 'data-mark': markOf(input.value) }, markGlyph(), input);
      input.addEventListener('change', () => { wrap.dataset.mark = markOf(input.value); });
      return wrap;
    }
    return input;
  }

  function renderBlock(ws, sec, b, data) {
    switch (b.type) {
      case 'fields': {
        const grid = el('div', { class: 'fields' + (b.stacked ? ' is-stacked' : '') });
        b.fields.forEach(f => {
          const c = control(ws, f, key(sec, b, f.id), f.label, f.default);
          const ctl = c.matches('input,select,textarea') ? c : c.querySelector('input,select,textarea');
          ctl.removeAttribute('aria-label');
          grid.append(el('div', { class: 'field' + (f.wide || f.type === 'textarea' ? ' is-wide' : '') },
            el('label', { for: ctl.id }, f.label),
            f.hint ? el('span', { class: 'hint', id: ctl.id + '-h' }, f.hint) : null,
            c));
          if (f.hint) ctl.setAttribute('aria-describedby', ctl.id + '-h');
          if (f.type === 'textarea') ctl.rows = 3;
        });
        return grid;
      }
      case 'text': {
        const ta = el('textarea', { class: 'prose-input', rows: b.rows || 4, 'aria-label': sec.title });
        bindInput(ws, ta, key(sec, b), b.default);
        const warn = el('p', { class: 'placeholder-warn', hidden: true }, 'Replace the bracketed placeholders, such as ' + ORG_PLACEHOLDER + ', with your own details.');
        const useTpl = b.default ? el('button', { type: 'button', class: 'btn btn-quiet use-template', onclick: () => {
          if (ta.value.trim() && !confirm('Replace what you have written with the template text?')) return;
          ta.value = b.default;
          ta.dispatchEvent(new Event('input'));
          ta.focus();
        } }, icon('book'), 'Use template text') : null;
        const check = () => { warn.hidden = !ta.value.includes('['); if (useTpl) useTpl.hidden = ta.value.trim() === b.default.trim(); };
        ta.addEventListener('input', check); check();
        return el('div', { class: 'text-block' }, ta, el('div', { class: 'text-tools' }, warn, useTpl));
      }
      case 'checks': {
        const fs = el('fieldset', { class: 'checks' + (b.inline ? ' is-inline' : '') }, el('legend', null, b.label));
        b.options.forEach(o => {
          const cb = el('input', { type: 'checkbox' });
          bindInput(ws, cb, key(sec, b, o.id));
          fs.append(el('label', { class: 'check' }, cb, el('span', { class: 'box', 'aria-hidden': 'true' }),
            el('span', null, el('b', null, o.label), o.desc ? el('span', { class: 'desc' }, ' — ' + o.desc) : null)));
        });
        return fs;
      }
      case 'radios': {
        const fs = el('fieldset', { class: 'checks' }, el('legend', null, b.label));
        const k = key(sec, b);
        const name = uid('r');
        const stored = data.v[k] || '';
        b.options.forEach(o => {
          const rb = el('input', { type: 'radio', name, value: o.id });
          rb.checked = stored === o.id;
          rb.addEventListener('change', () => { data.v[k] = o.id; recompute(ws); persist(ws.id); });
          fs.append(el('label', { class: 'check is-radio' }, rb, el('span', { class: 'box', 'aria-hidden': 'true' }), el('span', null, o.label)));
        });
        return fs;
      }
      case 'table': return renderTable(ws, sec, b, data);
      case 'register': return renderRegister(ws, sec, b, data);
      case 'legend': {
        const t = el('table', { class: 'grid legend' },
          el('thead', null, el('tr', null, b.head.map(h => el('th', { scope: 'col' }, h)))),
          el('tbody', null, b.rows.map(r => el('tr', null, r.map((c, i) => {
            if (i === 0 && b.marks) return el('td', null, el('span', { class: 'mark-cell is-static', 'data-mark': markOf(c) }, markGlyph(), el('b', null, c)));
            if (b.levels === i) return el('td', null, el('span', { class: levelClass(c) }, c));
            return el('td', null, c);
          })))));
        return el('div', { class: 'table-wrap is-legend' }, t);
      }
      case 'matrix': return renderMatrix();
      case 'tally': return el('div', { class: 'tally', 'data-tally': b.of, 'data-col': b.col, 'aria-live': 'polite' }, '');
      case 'note': return el('p', { class: 'sec-intro', html: b.html });
    }
    return document.createComment('unknown block');
  }

  /* ---------- dynamic tables ---------- */
  function tableRows(ws, sec, b) {
    const data = load(ws.id);
    const k = key(sec, b);
    if (!Array.isArray(data.t[k])) data.t[k] = Array.from({ length: b.defaults ? b.defaults.length : (b.rows || 3) }, () => ({}));
    return data.t[k];
  }

  function renderTable(ws, sec, b) {
    const wrap = el('div', { class: 'table-block', 'data-table': b.id });
    const draw = () => {
      wrap.innerHTML = '';
      const rows = tableRows(ws, sec, b);
      const tbody = el('tbody');
      rows.forEach((row, ri) => {
        const tr = el('tr', { 'data-row': ri });
        b.columns.forEach(col => {
          const label = col.label + ', row ' + (ri + 1);
          if (col.type === 'computed') { tr.append(el('td', { class: 'computed w-' + (col.w || 's'), 'data-computed': col.id }, '')); return; }
          const ci = b.columns.indexOf(col);
          const template = b.defaults && b.defaults[ri] ? b.defaults[ri][ci] : '';
          const c = controlForRow(ws, col, row, label, template);
          tr.append(el('td', { class: 'w-' + (col.w || 'm') }, c));
        });
        tr.append(el('td', { class: 'row-tools' },
          el('button', { type: 'button', class: 'icon-btn sm', 'aria-label': 'Remove row ' + (ri + 1), title: 'Remove row', onclick: () => {
            const hasData = Object.values(row).some(v => v);
            if (hasData && !confirm('Remove row ' + (ri + 1) + '? Its contents will be deleted.')) return;
            rows.splice(ri, 1); persist(ws.id); draw(); recompute(ws);
          } }, icon('erase'))));
        tbody.append(tr);
      });
      const table = el('table', { class: 'grid' + (b.scoring ? ' is-scoring' : '') },
        el('thead', null, el('tr', null, b.columns.map(c => el('th', { scope: 'col', class: 'w-' + (c.w || 'm') }, c.label)), el('th', { scope: 'col', class: 'row-tools' }, 'Remove Row'))),
        tbody);
      wrap.append(el('div', { class: 'table-wrap' }, table));
      wrap.append(el('button', { type: 'button', class: 'btn btn-quiet add-row', onclick: () => {
        rows.push({}); persist(ws.id); draw(); recompute(ws);
        const last = $$('tbody tr', wrap).pop(); const f = last && last.querySelector('input,select,textarea'); if (f) f.focus();
      } }, icon('plus'), 'Add row'));
      $$('textarea', wrap).forEach(grow);
    };
    // table cell inputs write into the row object, not the flat value map
    function controlForRow(ws, col, row, label, template) {
      let input;
      if (col.type === 'textarea') input = el('textarea', { rows: 1, 'aria-label': label });
      else if (col.type === 'select') input = el('select', { 'aria-label': label }, el('option', { value: '' }, '—'), col.options.map(o => el('option', { value: o.value }, o.label)));
      else input = el('input', { type: col.type === 'date' ? 'date' : 'text', 'aria-label': label });
      input.value = row[col.id] || '';
      if (template && input.tagName !== 'SELECT') { input.placeholder = template; input.classList.add('has-template'); }
      input.dataset.col = col.id;
      input.addEventListener(input.tagName === 'SELECT' ? 'change' : 'input', () => {
        row[col.id] = input.value;
        if (input.tagName === 'TEXTAREA') grow(input);
        recompute(ws); persist(ws.id);
      });
      if (col.mark) {
        const w = el('span', { class: 'mark-cell', 'data-mark': markOf(input.value) }, markGlyph(), input);
        input.addEventListener('change', () => { w.dataset.mark = markOf(input.value); });
        return w;
      }
      return input;
    }
    draw();
    return wrap;
  }

  /* ---------- fixed registers (clauses, controls, items) ---------- */
  function renderRegister(ws, sec, b, data) {
    const cols = b.columns;
    const thead = el('thead', null, el('tr', null,
      el('th', { scope: 'col', class: 'ref-col' + (b.refWide ? ' is-wide' : '') }, b.refLabel || ''),
      cols.map(c => el('th', { scope: 'col', class: 'w-' + (c.w || (c.readonly ? 'ro' : 'm')) }, c.label))));
    const tbody = el('tbody');
    b.groups.forEach(g => {
      if (g.title) tbody.append(el('tr', { class: 'group' }, el('th', { colspan: cols.length + 1, scope: 'colgroup' }, g.title)));
      g.rows.forEach(r => {
        const tr = el('tr', { 'data-ref': r.ref });
        tr.append(el('th', { scope: 'row', class: 'ref-col' + (b.refWide ? ' is-wide' : '') }, r.ref));
        cols.forEach(c => {
          if (c.readonly) { tr.append(el('td', { class: 'ro' }, (r.cells && r.cells[c.id]) || '')); return; }
          if (c.type === 'computed') {
            const td = el('td', { class: 'computed w-xs', 'data-count': r.count ? JSON.stringify(r.count) : null }, '0');
            tr.append(td); return;
          }
          const colDef = r.type ? Object.assign({}, c, { type: r.type }) : c;
          const fallback = r.defaults ? r.defaults[c.id] : '';
          tr.append(el('td', { class: 'w-' + (c.w || 'm') }, control(ws, colDef, key(sec, b, r.ref, c.id), c.label + ', ' + r.ref, fallback)));
        });
        tbody.append(tr);
      });
    });
    return el('div', { class: 'table-wrap' }, el('table', { class: 'grid register' }, thead, tbody));
  }

  /* ---------- risk matrix ---------- */
  function renderMatrix() {
    const C = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
    const L = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
    const t = el('table', { class: 'matrix' },
      el('caption', { class: 'sr' }, 'Risk score by likelihood (rows) and consequence (columns)'),
      el('thead', null, el('tr', null, el('td', { class: 'corner' }, el('span', null, 'Likelihood ↓ · Consequence →')),
        C.map((c, i) => el('th', { scope: 'col' }, el('b', null, String(i + 1)), el('span', null, c))))),
      el('tbody', null, [5, 4, 3, 2, 1].map(l => el('tr', null,
        el('th', { scope: 'row' }, el('b', null, String(l)), el('span', null, L[l - 1])),
        [1, 2, 3, 4, 5].map(c => { const s = l * c; const lv = riskLevel(s); return el('td', { class: 'cell-' + lv.toLowerCase(), 'data-cell': l + 'x' + c }, el('b', null, String(s)), el('span', null, lv)); })
      ))));
    return el('div', { class: 'table-wrap is-matrix' }, t);
  }

  /* ======================================================================
     Calculations, tallies, progress
     ====================================================================== */
  function registerValues(ws, regId, col) {
    const data = load(ws.id);
    for (const sec of ws.sections) for (const b of sec.blocks) {
      if (b.id !== regId) continue;
      if (b.type === 'register') {
        const out = [];
        b.groups.forEach(g => g.rows.forEach(r => out.push(data.v[key(sec, b, r.ref, col)] || '')));
        return out;
      }
      if (b.type === 'table') {
        const rows = tableRows(ws, sec, b);
        if (col === 'level') return rows.map(r => riskLevel((+r.l || 0) * (+r.c || 0)));
        return rows.map(r => r[col] || '');
      }
    }
    return [];
  }

  function recompute(ws) {
    const root = $('.sheet[data-ws="' + ws.id + '"]');
    if (!root) return;
    // risk score and level per row
    $$('.is-scoring tbody tr', root).forEach(tr => {
      const l = +($('[data-col="l"]', tr) || {}).value || 0;
      const c = +($('[data-col="c"]', tr) || {}).value || 0;
      const score = l * c;
      const lvl = riskLevel(score);
      const sc = $('[data-computed="score"]', tr); const lv = $('[data-computed="level"]', tr);
      if (sc) sc.textContent = score ? String(score) : '';
      if (lv) { lv.innerHTML = ''; if (lvl) lv.append(el('span', { class: levelClass(lvl) }, lvl)); }
    });
    // counts derived from another register
    $$('[data-count]', root).forEach(td => {
      const spec = JSON.parse(td.dataset.count);
      td.textContent = String(registerValues(ws, spec.of, spec.col).filter(v => v === spec.value).length);
    });
    // tallies
    $$('.tally', root).forEach(t => {
      const block = findBlock(ws, b => b.type === 'tally' && b.of === t.dataset.tally);
      const vals = registerValues(ws, t.dataset.tally, t.dataset.col);
      const total = vals.length;
      const isRows = findBlock(ws, b => b.id === t.dataset.tally && b.type === 'table');
      const filled = vals.filter(Boolean).length;
      t.innerHTML = '';
      t.append(el('span', { class: 'tally-total' }, isRows ? filled + ' rated' : filled + ' of ' + total + ' assessed'));
      Object.keys(block.labels).forEach(v => {
        const n = vals.filter(x => x === v).length;
        const isLevel = t.dataset.col === 'level';
        t.append(el('span', { class: 'tally-item' + (n ? '' : ' is-zero') },
          isLevel ? el('span', { class: levelClass(v) }, block.labels[v]) : el('span', { class: 'mark-cell is-static', 'data-mark': markOf(v) }, markGlyph(), block.labels[v]),
          el('b', null, String(n))));
      });
    });
  }
  function findBlock(ws, pred) {
    for (const s of ws.sections) for (const b of s.blocks) if (pred(b)) return b;
    return null;
  }

  // completion: each field, text, choice, register row, and used table counts as one unit
  function progress(ws) {
    const data = load(ws.id);
    let total = 0, done = 0;
    const has = v => v != null && String(v).trim() !== '';
    ws.sections.forEach(sec => sec.blocks.forEach(b => {
      if (b.type === 'fields') b.fields.forEach(f => { total++; if (has(data.v[key(sec, b, f.id)])) done++; });
      else if (b.type === 'text') { total++; const v = data.v[key(sec, b)]; if (has(v) && !v.includes('[')) done++; }
      else if (b.type === 'checks') { total++; if (b.options.some(o => data.v[key(sec, b, o.id)] === 'true')) done++; }
      else if (b.type === 'radios') { total++; if (data.v[key(sec, b)]) done++; }
      else if (b.type === 'table') {
        total++;
        const rows = data.saved && Array.isArray(data.t[key(sec, b)]) ? data.t[key(sec, b)] : [];
        if (rows.some(r => Object.values(r).some(has))) done++;
      } else if (b.type === 'register') {
        const editable = b.columns.filter(c => !c.readonly && c.type !== 'computed');
        if (!editable.length) return;
        b.groups.forEach(g => g.rows.forEach(r => {
          total++;
          if (editable.some(c => has(data.v[key(sec, b, r.ref, c.id)]))) done++;
        }));
      }
    }));
    return total ? Math.round(done / total * 100) : 0;
  }

  /* ======================================================================
     Save as PDF: a real text PDF built from the worksheet data
     ====================================================================== */
  const PDF_LIBS = [
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js'
  ];
  let pdfLibs = null;
  function loadPdfLibs() {
    if (!pdfLibs) {
      pdfLibs = PDF_LIBS.reduce((p, src) => p.then(() => new Promise((res, rej) => {
        const s = el('script', { src, crossorigin: 'anonymous' });
        s.onload = res; s.onerror = () => rej(new Error('load failed: ' + src));
        document.head.append(s);
      })), Promise.resolve());
      pdfLibs.catch(() => { pdfLibs = null; });
    }
    return pdfLibs;
  }

  // the built-in PDF fonts are WinAnsi: swap the few glyphs they lack
  const pdfText = s => String(s == null ? '' : s)
    .replace(/↓/g, 'v').replace(/→/g, '->').replace(/≤/g, '<=').replace(/≥/g, '>=')
    .replace(/[^\n\x20-\x7E\xA0-\xFF‘’“”–—•…€™]/g, '');

  async function savePDF(ws, btn) {
    flushSaves();
    if (btn) { btn.disabled = true; btn.lastChild.textContent = 'Preparing PDF…'; }
    try {
      await loadPdfLibs();
      buildPDF(ws).save('iso42001-' + ws.id + '-' + today() + '.pdf');
      toast('Saved ' + ws.title + ' as PDF.');
    } catch (e) {
      console.error(e);
      toast('The PDF tools couldn’t load, so the print dialog is opening instead. Choose “Save as PDF” there.');
      $$('textarea').forEach(grow);
      setTimeout(() => window.print(), 300);
    } finally {
      if (btn) { btn.disabled = false; btn.lastChild.textContent = 'Save as PDF'; }
    }
  }

  function buildPDF(ws) {
    const data = load(ws.id);
    const INK = [49, 54, 56], INK2 = [86, 91, 94], INK3 = [107, 112, 115], RULE = [189, 186, 174];
    const PAPER = [255, 255, 249], SUNK = [244, 243, 234], LAV = [87, 68, 159];
    const LEVEL_FILL = { Low: [226, 239, 230], Medium: [246, 235, 211], High: [247, 227, 212], Critical: [246, 222, 220] };
    const LEVEL_INK = { Low: [47, 115, 80], Medium: [147, 96, 15], High: [164, 81, 28], Critical: [170, 52, 52] };

    const wide = ws.sections.some(s => s.blocks.some(b =>
      (b.type === 'table' && b.columns.length >= 5) || (b.type === 'register' && b.columns.length >= 4)));
    const doc = new window.jspdf.jsPDF({ orientation: wide ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 40, BOTTOM = H - M - 14;
    const painted = new Set();
    const paint = () => {
      const p = doc.internal.getCurrentPageInfo().pageNumber;
      if (painted.has(p)) return;
      painted.add(p);
      doc.setFillColor(...PAPER); doc.rect(0, 0, W, H, 'F');
    };
    paint();
    let y = M;
    const ensure = h => { if (y + h > BOTTOM) { doc.addPage(); paint(); y = M; } };
    const write = (s, o = {}) => {
      const size = o.size || 10;
      doc.setFont('helvetica', o.style || 'normal'); doc.setFontSize(size); doc.setTextColor(...(o.color || INK));
      const lines = doc.splitTextToSize(pdfText(s), o.width || (W - 2 * M));
      const lh = size * 1.38;
      lines.forEach(line => { ensure(lh); doc.text(line, o.x || M, y + size * 0.95); y += lh; });
      y += o.after == null ? 4 : o.after;
    };
    const table = opts => {
      doc.autoTable(Object.assign({
        startY: y,
        margin: { left: M, right: M, top: M, bottom: M + 14 },
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 8.5, textColor: INK, lineColor: RULE, lineWidth: 0.5, cellPadding: 4.5, fillColor: PAPER, overflow: 'linebreak', valign: 'top' },
        headStyles: { fillColor: SUNK, textColor: INK, fontStyle: 'bold' },
        willDrawPage: paint
      }, opts));
      y = doc.lastAutoTable.finalY + 16;
    };
    const blank = s => (s == null || String(s).trim() === '');
    const optLabel = (col, v) => {
      if (!v || !col.options) return v || '';
      const o = col.options.find(x => x.value === v);
      return o ? o.label : v;
    };
    const levelCells = hook => d => {
      if (d.section !== 'body') return;
      const lvl = hook(d);
      if (LEVEL_FILL[lvl]) { d.cell.styles.fillColor = LEVEL_FILL[lvl]; d.cell.styles.textColor = LEVEL_INK[lvl]; d.cell.styles.fontStyle = 'bold'; }
    };

    // header
    write('ISO/IEC 42001:2023  ·  ' + ws.ref, { size: 9, style: 'bold', color: LAV, after: 2 });
    write(ws.title, { size: 20, style: 'bold', after: 6 });
    write(ws.intro, { size: 9.5, color: INK2, after: 6 });
    write('Exported ' + new Date().toLocaleString() + ' from the ISO/IEC 42001 Project Initiation Workbook', { size: 8, color: INK3, after: 8 });
    doc.setDrawColor(...INK); doc.setLineWidth(1); doc.line(M, y, W - M, y); y += 18;

    ws.sections.forEach(sec => {
      ensure(60);
      doc.setDrawColor(...RULE); doc.setLineWidth(0.5); doc.line(M, y, W - M, y); y += 12;
      write((sec.ref ? sec.ref + '   ' : '') + sec.title, { size: 12.5, style: 'bold', after: 6 });
      if (sec.intro) write(sec.intro, { size: 9, color: INK2, after: 6 });

      sec.blocks.forEach(b => {
        if (b.type === 'fields') {
          table({
            showHead: false, pageBreak: 'avoid',
            body: b.fields.map(f => [f.label, optLabel(f, data.v[key(sec, b, f.id)])]),
            columnStyles: { 0: { cellWidth: 170, fontStyle: 'bold', fillColor: SUNK } }
          });
        } else if (b.type === 'text') {
          const v = data.v[key(sec, b)];
          if (blank(v)) write('Not completed.', { size: 9.5, style: 'italic', color: INK3, after: 12 });
          else write(v, { size: 10, after: 12 });
        } else if (b.type === 'checks' || b.type === 'radios') {
          write(b.label, { size: 9.5, style: 'bold', after: 4 });
          const chosen = o => b.type === 'checks' ? data.v[key(sec, b, o.id)] === 'true' : data.v[key(sec, b)] === o.id;
          table({
            showHead: false, pageBreak: 'avoid',
            body: b.options.map(o => [chosen(o) ? 'X' : '', o.label + (o.desc ? ' — ' + o.desc : '')]),
            columnStyles: { 0: { cellWidth: 24, halign: 'center', fontStyle: 'bold', textColor: LAV } }
          });
        } else if (b.type === 'table') {
          let rows = tableRows(ws, sec, b).filter(r => Object.values(r).some(v => !blank(v)));
          const body = rows.map(r => b.columns.map(c => {
            if (c.type === 'computed') { const sc = (+r.l || 0) * (+r.c || 0); return c.id === 'score' ? (sc ? String(sc) : '') : riskLevel(sc); }
            return optLabel(c, r[c.id]);
          }));
          if (!body.length) body.push(b.columns.map(() => ''));
          const lvlIdx = b.columns.findIndex(c => c.id === 'level');
          table({
            head: [b.columns.map(c => c.label)],
            body: body.map(r => r.map(pdfText)),
            didParseCell: lvlIdx >= 0 ? levelCells(d => d.column.index === lvlIdx ? d.cell.raw : '') : undefined
          });
        } else if (b.type === 'register') {
          const body = [];
          b.groups.forEach(g => {
            if (g.title) body.push([{ content: pdfText(g.title), colSpan: b.columns.length + 1, styles: { fontStyle: 'bold', textColor: LAV, fillColor: PAPER } }]);
            g.rows.forEach(r => body.push([r.ref].concat(b.columns.map(c => {
              if (c.readonly) return (r.cells && r.cells[c.id]) || '';
              if (c.type === 'computed') return r.count ? String(registerValues(ws, r.count.of, r.count.col).filter(x => x === r.count.value).length) : '';
              return optLabel(c, data.v[key(sec, b, r.ref, c.id)]);
            })).map(v => typeof v === 'string' ? pdfText(v) : v)));
          });
          const colStyles = { 0: { fontStyle: 'bold', fillColor: SUNK, cellWidth: b.refWide ? 120 : 52 } };
          // editable columns get fixed room to write in; long read-only text takes the rest
          const EDIT_W = { xs: 52, s: 84, m: 118, l: 150 };
          b.columns.forEach((c, i) => {
            if (c.readonly) colStyles[i + 1] = { textColor: INK2, cellWidth: c.w === 's' ? 110 : 'auto' };
            else colStyles[i + 1] = { cellWidth: b.columns.some(x => x.readonly) ? (EDIT_W[c.w] || (c.type === 'textarea' ? 160 : 118)) : 'auto' };
          });
          table({ head: [[b.refLabel || ''].concat(b.columns.map(c => c.label))], body, columnStyles: colStyles });
        } else if (b.type === 'legend') {
          table({
            head: [b.head], body: b.rows.map(r => r.map(pdfText)), pageBreak: 'avoid',
            columnStyles: { 0: { fontStyle: 'bold' } },
            didParseCell: b.levels != null ? levelCells(d => d.column.index === b.levels ? d.cell.raw : '') : undefined
          });
        } else if (b.type === 'matrix') {
          const C = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];
          const L = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
          table({
            head: [['Likelihood v / Consequence ->'].concat(C.map((c, i) => (i + 1) + ' ' + c))],
            body: [5, 4, 3, 2, 1].map(l => [l + ' ' + L[l - 1]].concat([1, 2, 3, 4, 5].map(c => (l * c) + '  ' + riskLevel(l * c)))),
            styles: { halign: 'center', fontSize: 8.5, cellPadding: 6, lineColor: PAPER, lineWidth: 1.5 },
            columnStyles: { 0: { halign: 'right', fontStyle: 'bold', fillColor: PAPER } },
            tableWidth: Math.min(W - 2 * M, 560), pageBreak: 'avoid',
            didParseCell: levelCells(d => d.column.index > 0 ? String(d.cell.raw).replace(/^\d+\s+/, '') : '')
          });
        } else if (b.type === 'tally') {
          const vals = registerValues(ws, b.of, b.col);
          const parts = Object.keys(b.labels).map(v => b.labels[v] + ': ' + vals.filter(x => x === v).length);
          y -= 8;
          write('Summary — ' + parts.join('   ·   '), { size: 9, style: 'bold', color: INK2, after: 12 });
        }
      });
    });

    // running footer
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...INK3);
      doc.text(pdfText(ws.title + '  ·  ISO/IEC 42001:2023'), M, H - M + 12);
      doc.text('Page ' + i + ' of ' + n, W - M, H - M + 12, { align: 'right' });
    }
    return doc;
  }

  /* ======================================================================
     Clear, export, import
     ====================================================================== */
  function clearSheet(ws) {
    if (!confirm('Clear everything in “' + ws.title + '”? Export it first if you want to keep a copy. This cannot be undone.')) return;
    clearTimeout(saveTimers[ws.id]); delete saveTimers[ws.id];
    store.del(STORE + ws.id); delete cache[ws.id];
    route();
    toast(ws.title + ' cleared.');
  }

  function exportXML(ws) {
    const data = load(ws.id);
    const doc = document.implementation.createDocument(null, 'worksheet', null);
    const root = doc.documentElement;
    root.setAttribute('id', ws.id);
    root.setAttribute('title', ws.title);
    root.setAttribute('standard', 'ISO/IEC 42001:2023');
    root.setAttribute('reference', ws.ref);
    root.setAttribute('exported', new Date().toISOString());
    root.setAttribute('format', 'iso42001-workbook/1');
    const node = (name, attrs, text) => {
      const n = doc.createElement(name);
      for (const a in attrs || {}) if (attrs[a] != null && attrs[a] !== '') n.setAttribute(a, attrs[a]);
      if (text != null) n.textContent = text;
      return n;
    };
    ws.sections.forEach(sec => {
      const s = node('section', { id: sec.id, title: sec.title, ref: sec.ref });
      sec.blocks.forEach(b => {
        if (b.type === 'fields') {
          const f = node('fields', { block: b.id });
          b.fields.forEach(fd => { const k = key(sec, b, fd.id); f.append(node('field', { id: fd.id, label: fd.label }, data.v[k] || '')); });
          s.append(f);
        } else if (b.type === 'text') {
          const k = key(sec, b); s.append(node('text', { block: b.id }, data.v[k] || ''));
        } else if (b.type === 'checks') {
          const c = node('checks', { block: b.id, label: b.label });
          b.options.forEach(o => c.append(node('option', { id: o.id, label: o.label, checked: data.v[key(sec, b, o.id)] === 'true' ? 'true' : 'false' })));
          s.append(c);
        } else if (b.type === 'radios') {
          const c = node('choice', { block: b.id, label: b.label, value: data.v[key(sec, b)] || '' });
          const o = b.options.find(x => x.id === data.v[key(sec, b)]); if (o) c.textContent = o.label;
          s.append(c);
        } else if (b.type === 'table') {
          const t = node('table', { block: b.id });
          tableRows(ws, sec, b).forEach((r, i) => {
            const row = node('row', { n: i + 1 });
            b.columns.forEach(c => {
              let v = r[c.id] || '';
              if (c.type === 'computed') { const sc = (+r.l || 0) * (+r.c || 0); v = c.id === 'score' ? (sc ? String(sc) : '') : riskLevel(sc); }
              row.append(node('cell', { col: c.id, label: c.label }, v));
            });
            t.append(row);
          });
          s.append(t);
        } else if (b.type === 'register') {
          const reg = node('register', { block: b.id });
          b.groups.forEach(g => g.rows.forEach(r => {
            const item = node('item', { ref: r.ref, group: g.title || null });
            b.columns.forEach(c => {
              let v;
              if (c.readonly) v = (r.cells && r.cells[c.id]) || '';
              else if (c.type === 'computed') v = r.count ? String(registerValues(ws, r.count.of, r.count.col).filter(x => x === r.count.value).length) : '';
              else { const k = key(sec, b, r.ref, c.id); v = data.v[k] || ''; }
              item.append(node('cell', { col: c.id, label: c.label, readonly: c.readonly || c.type === 'computed' ? 'true' : null }, v));
            });
            reg.append(item);
          }));
          s.append(reg);
        }
      });
      if (s.childNodes.length) root.append(s);
    });
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + serialize(root, 0) + '\n';
    const blob = new Blob([xml], { type: 'application/xml' });
    const a = el('a', { href: URL.createObjectURL(blob), download: 'iso42001-' + ws.id + '-' + today() + '.xml' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Exported ' + ws.title + ' as XML.');
  }

  // indented serializer: leaf elements stay on one line so exports read and diff cleanly
  function serialize(n, depth) {
    const esc = v => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const pad = '  '.repeat(depth);
    const attrs = Array.from(n.attributes).map(a => ' ' + a.name + '="' + esc(a.value) + '"').join('');
    const kids = Array.from(n.children);
    if (!kids.length) return n.textContent
      ? pad + '<' + n.nodeName + attrs + '>' + esc(n.textContent) + '</' + n.nodeName + '>'
      : pad + '<' + n.nodeName + attrs + '/>';
    return pad + '<' + n.nodeName + attrs + '>\n' + kids.map(k => serialize(k, depth + 1)).join('\n') + '\n' + pad + '</' + n.nodeName + '>';
  }

  function importXML(file, targetId) {
    const reader = new FileReader();
    reader.onload = () => {
      let doc;
      try { doc = new DOMParser().parseFromString(String(reader.result), 'application/xml'); } catch (e) { doc = null; }
      if (!doc || doc.getElementsByTagName('parsererror').length) { toast('That file isn’t valid XML, so nothing was imported.'); return; }
      const root = doc.documentElement;
      const ws = WS.find(w => w.id === root.getAttribute('id'));
      if (root.nodeName !== 'worksheet' || !ws) { toast('That XML wasn’t exported from this workbook, so nothing was imported.'); return; }
      const msg = ws.id === targetId
        ? 'Replace the contents of “' + ws.title + '” with the imported file?'
        : 'This file is a “' + ws.title + '” worksheet. Load it into that worksheet and replace what’s there?';
      if (!confirm(msg)) return;
      const data = { v: {}, t: {}, saved: null };
      const kids = (n, name) => Array.from(n.children).filter(c => c.nodeName === name);
      kids(root, 'section').forEach(sn => {
        const sec = ws.sections.find(s => s.id === sn.getAttribute('id'));
        if (!sec) return;
        Array.from(sn.children).forEach(bn => {
          const b = sec.blocks.find(x => x.id === bn.getAttribute('block'));
          if (!b) return;
          if (bn.nodeName === 'fields') kids(bn, 'field').forEach(f => { data.v[key(sec, b, f.getAttribute('id'))] = f.textContent; });
          else if (bn.nodeName === 'text') data.v[key(sec, b)] = bn.textContent;
          else if (bn.nodeName === 'checks') kids(bn, 'option').forEach(o => { data.v[key(sec, b, o.getAttribute('id'))] = o.getAttribute('checked') === 'true' ? 'true' : 'false'; });
          else if (bn.nodeName === 'choice') data.v[key(sec, b)] = bn.getAttribute('value') || '';
          else if (bn.nodeName === 'table') data.t[key(sec, b)] = kids(bn, 'row').map(r => {
            const o = {}; kids(r, 'cell').forEach(c => { const col = b.columns.find(x => x.id === c.getAttribute('col')); if (col && col.type !== 'computed') o[col.id] = c.textContent; }); return o;
          });
          else if (bn.nodeName === 'register') kids(bn, 'item').forEach(it => kids(it, 'cell').forEach(c => {
            const col = b.columns.find(x => x.id === c.getAttribute('col'));
            if (col && !col.readonly && col.type !== 'computed') data.v[key(sec, b, it.getAttribute('ref'), col.id)] = c.textContent;
          }));
        });
      });
      data.saved = new Date().toISOString();
      cache[ws.id] = data;
      store.set(STORE + ws.id, data);
      if (location.hash === '#/' + ws.id) route(); else location.hash = '#/' + ws.id;
      toast('Imported ' + ws.title + '.');
    };
    reader.onerror = () => toast('The file couldn’t be read, so nothing was imported.');
    reader.readAsText(file);
  }

  /* ======================================================================
     Theme, menu, boot
     ====================================================================== */
  function effectiveTheme() {
    const set = document.documentElement.getAttribute('data-theme');
    if (set) return set;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function syncTheme() {
    const t = effectiveTheme();
    $$('#theme-switch button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeSet === t)));
  }
  $$('#theme-switch button').forEach(b => b.addEventListener('click', () => {
    document.documentElement.setAttribute('data-theme', b.dataset.themeSet);
    try { localStorage.setItem('iso42001:theme', b.dataset.themeSet); } catch (e) {}
    syncTheme();
  }));
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);

  function openMenu() { document.body.classList.add('menu-open'); $('#scrim').hidden = false; $('#menu-open').setAttribute('aria-expanded', 'true'); const c = $('.nav-item.is-current'); if (c) c.focus(); }
  function closeMenu() { if (!document.body.classList.contains('menu-open')) return; document.body.classList.remove('menu-open'); $('#scrim').hidden = true; $('#menu-open').setAttribute('aria-expanded', 'false'); }
  $('#menu-open').addEventListener('click', openMenu);
  $('#menu-close').addEventListener('click', () => { closeMenu(); $('#menu-open').focus(); });
  $('#scrim').addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  $('#import-file').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (f) importXML(f, e.target.dataset.target);
    e.target.value = '';
  });

  window.addEventListener('beforeprint', () => $$('textarea').forEach(grow));
  window.addEventListener('hashchange', route);
  syncTheme();
  route();
})();
