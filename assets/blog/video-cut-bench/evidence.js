/* Supporting figures for Video-Cut-Bench. All measurements come from reportData.
 * No charting dependency: SVG supplies the figures, HTML supplies the controls,
 * keyboard/touch readouts and the full underlying data tables. */
const NS = 'http://www.w3.org/2000/svg';
const SCOPES = [
  ['all', 'All tasks'], ['lines', 'Specified dialogue'], ['silence', 'Silence removal'],
  ['speaker', 'Character isolation'], ['targeted', 'Targeted removal']
];
const MODELS = [
  'claude-opus-5', 'claude-sonnet-5', 'gpt-5.6-sol', 'gpt-5.6-terra',
  'gpt-5.6-luna', 'gemini-3.1-pro-preview', 'gemini-3.7-flash'
];
const CLI = { 'claude-code': 'Claude Code', codex: 'Codex', 'gemini-cli': 'Gemini CLI' };
let serial = 0;
const percent = v => `${(v * 100).toFixed(2)}%`;
const delta = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)} pp`;
function node(tag, attrs = {}, parent, text) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text != null) el.textContent = text;
  if (parent) parent.append(el);
  return el;
}
function svgNode(tag, attrs = {}, parent, text) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text != null) el.textContent = text;
  if (parent) parent.append(el);
  return el;
}
function label(data, model) { return data.model_parameters?.models?.[model]?.short_label || model; }
function color(data, model) {
  const family = data.model_parameters?.models?.[model]?.family;
  return data.model_parameters?.family_colors?.[family] || '#4285f4';
}
function setupRow(data, scope, model, agent, setup) {
  const row = data.views[scope].leaderboard.find(r => r.model === model && r.agent === agent && r.setup === setup);
  if (!row) throw new Error(`Missing evidence data: ${scope}, ${model}, ${agent}, ${setup}`);
  return row;
}
function comparison(data, scope, model, kind) {
  const context = kind === 'skills' ? 'solo' : 'skill';
  const prefix = kind === 'skills' ? 'Skill ' : 'Multi-agent ';
  const row = data.views[scope].comparisons.find(r => r.model === model && r.context === context && r.comparison.startsWith(prefix));
  if (!row) throw new Error(`Missing matched comparison: ${scope}, ${model}, ${kind}`);
  return row;
}
function scaffold(container, title, subtitle, kind) {
  const card = node('div', { class: `vcb-evidence vcb-evidence--${kind}` });
  const head = node('div', { class: 'vcb-evidence__head' }, card);
  const text = node('div', {}, head);
  const titleId = `vcb-evidence-title-${++serial}`;
  node('h4', { id: titleId, class: 'vcb-evidence__title' }, text, title);
  node('p', { class: 'vcb-evidence__subtitle' }, text, subtitle);
  card.setAttribute('aria-labelledby', titleId);
  card.setAttribute('role', 'group');
  container.replaceChildren(card);
  return { card, head };
}
function buttons(parent, items, current, onChange, ariaLabel) {
  const group = node('div', { class: 'vcb-evidence__tabs', role: 'group', 'aria-label': ariaLabel }, parent);
  const entries = items.map(([key, text]) => {
    const b = node('button', { type: 'button', 'aria-pressed': String(key === current), 'data-value': key }, group, text);
    b.addEventListener('click', () => {
      entries.forEach(([k, el]) => el.setAttribute('aria-pressed', String(k === key)));
      onChange(key);
    });
    return [key, b];
  });
  return group;
}
function table(parent, headers, rows, caption) {
  const detail = node('details', { class: 'vcb-evidence__data' }, parent);
  node('summary', {}, detail, 'View data table');
  const wrap = node('div', { class: 'vcb-evidence__table-wrap', tabindex: '0', role: 'region', 'aria-label': caption }, detail);
  const t = node('table', {}, wrap);
  node('caption', {}, t, caption);
  const tr = node('tr', {}, node('thead', {}, t));
  headers.forEach(h => node('th', { scope: 'col' }, tr, h));
  const body = node('tbody', {}, t);
  rows.forEach(row => {
    const r = node('tr', {}, body);
    row.forEach((v, i) => node(i ? 'td' : 'th', i ? {} : { scope: 'row' }, r, v));
  });
  return detail;
}
function legend(parent, before, after) {
  const row = node('div', { class: 'vcb-evidence__legend' }, parent);
  [[before, 'ring'], [after, 'filled']].forEach(([text, style]) => {
    const item = node('span', {}, row);
    node('i', { class: `vcb-evidence__dot vcb-evidence__dot--${style}`, 'aria-hidden': 'true' }, item);
    item.append(document.createTextNode(text));
  });
  return row;
}
function lifecycle(card, draw) {
  let timer = 0;
  let lastWidth = card.clientWidth;
  const resize = new ResizeObserver(() => {
    const width = card.clientWidth;
    if (Math.abs(width - lastWidth) < 1) return;
    lastWidth = width;
    clearTimeout(timer);
    timer = setTimeout(() => draw(false), 80);
  });
  resize.observe(card);
  return () => { clearTimeout(timer); resize.disconnect(); };
}
/* One frame loop per figure. A queued entry animation does not spend its clock
 * below the fold or in a hidden document. Resizing can replace its paint
 * function while preserving progress and its source/target values. */
function animator(target) {
  let frame = 0, job = null, lastTime = null, visible = false, destroyed = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ease = t => 1 - (1 - t) ** 3;
  function suspend() { cancelAnimationFrame(frame); frame = 0; lastTime = null; }
  function finish() {
    if (!job) return;
    const complete = job;
    job = null;
    suspend();
    complete.paint(1);
    if (complete.done) complete.done();
  }
  function tick(now) {
    frame = 0;
    if (!job || destroyed || !visible || document.hidden) { lastTime = null; return; }
    if (motion.matches) { finish(); return; }
    if (lastTime != null) job.elapsed += Math.max(0, now - lastTime);
    lastTime = now;
    const t = Math.min(1, job.elapsed / job.duration);
    if (t === 1) { finish(); return; }
    job.paint(ease(t));
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (!frame && job && !destroyed && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) resume(); else suspend();
  }, { threshold: .08 });
  observer.observe(target);
  const visibility = () => { if (document.hidden) suspend(); else resume(); };
  const motionChange = () => { if (motion.matches) finish(); };
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener?.('change', motionChange);
  return {
    run(paint, done, duration = 650, preserve = false) {
      suspend();
      if (preserve && job) job = { ...job, paint, done };
      else job = { paint, done, duration, elapsed: 0 };
      if (motion.matches || !job.duration) { finish(); return; }
      job.paint(ease(Math.min(1, job.elapsed / job.duration)));
      resume();
    },
    stop() {
      destroyed = true;
      job = null;
      suspend();
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener?.('change', motionChange);
    },
  };
}
function readout(parent) {
  const el = node('div', { class: 'vcb-evidence__readout', 'aria-live': 'polite', 'aria-atomic': 'true' }, parent);
  return {
    el,
    show(title, text) {
      el.replaceChildren();
      node('strong', {}, el, title);
      node('span', {}, el, text);
    }
  };
}

/* Shared dumbbell geometry. A stable 0–100% axis makes all scopes comparable.
 * On small screens the row labels move above their tracks, preserving legibility
 * without forcing a large desktop canvas into a narrow column. */
function pairedPlot(host, rows, data, detail, opts) {
  let drawn = new Map();
  let origins = new Map();
  let active = null;
  let pinned = null;
  const animation = animator(host);
  const current = { rows };
  function emphasize(key) {
    active = key;
    host.querySelectorAll('[data-row]').forEach(el => {
      el.classList.toggle('is-dim', !!key && el.dataset.row !== key);
      el.classList.toggle('is-active', el.dataset.row === key);
      el.setAttribute('aria-pressed', String(el.dataset.row === pinned));
    });
  }
  function describe(row) {
    detail.show(row.name, `${opts.before}: ${percent(row.before)} (${row.beforeCount}/${row.expected}) · ${opts.after}: ${percent(row.after)} (${row.afterCount}/${row.expected}) · ${delta(row.change)}`);
  }
  function reset() { emphasize(pinned); if (pinned) describe(current.rows.find(r => r.key === pinned)); else detail.show(opts.defaultTitle, opts.defaultText); }
  function draw(animate = true, replay = false) {
    const width = Math.max(260, host.clientWidth || 760);
    const compact = width < 590;
    const left = compact ? 12 : 184;
    const right = width - (compact ? 78 : 88);
    const rowHeight = compact ? 66 : 55;
    const top = compact ? 80 : 70;
    const height = top + current.rows.length * rowHeight + 8;
    const x = value => left + value * (right - left);
    host.replaceChildren();
    const svg = svgNode('svg', { viewBox: `0 0 ${width} ${height}`, width, height, class: 'vcb-evidence__svg', role: 'group', 'aria-label': `${opts.before} and ${opts.after} pass rates` }, host);
    svgNode('text', { x: left, y: 14, class: 'vcb-evidence__axis-title' }, svg, 'Pass Rate (avg@3)');
    svgNode('text', { x: width - 6, y: 14, 'text-anchor': 'end', class: 'vcb-evidence__axis-title' }, svg, 'Change');
    [0, .25, .5, .75, 1].forEach(t => {
      svgNode('line', { x1: x(t), x2: x(t), y1: 35, y2: height - 18, class: 'vcb-evidence__grid' }, svg);
      svgNode('text', { x: x(t), y: 30, 'text-anchor': 'middle', class: 'vcb-evidence__tick' }, svg, `${t * 100}%`);
    });
    const marks = current.rows.map((r, i) => {
      const y = top + i * rowHeight;
      const c = color(data, r.model);
      const g = svgNode('g', { class: 'vcb-evidence__pair', 'data-row': r.key, tabindex: '0', role: 'button', 'aria-pressed': 'false', 'aria-label': `${r.name}. ${opts.before} ${percent(r.before)}; ${opts.after} ${percent(r.after)}; change ${delta(r.change)}. Press to focus.` }, svg);
      svgNode('rect', { x: 0, y: y - (compact ? 30 : 24), width, height: rowHeight - 3, rx: 6, class: 'vcb-evidence__row-hit' }, g);
      svgNode('text', { x: compact ? 10 : 3, y: compact ? y - 18 : y - 3, class: 'vcb-evidence__row-name' }, g, r.name);
      if (!compact && r.sub) svgNode('text', { x: 3, y: y + 13, class: 'vcb-evidence__row-sub' }, g, r.sub);
      const line = svgNode('line', { x1: x(r.before), x2: x(r.before), y1: y, y2: y, stroke: c, class: 'vcb-evidence__connector' }, g);
      const before = svgNode('circle', { cx: x(r.before), cy: y, r: 5.5, stroke: c, class: 'vcb-evidence__before' }, g);
      const after = svgNode('circle', { cx: x(r.before), cy: y, r: 5.5, fill: c, class: 'vcb-evidence__after' }, g);
      const d = svgNode('text', { x: width - 6, y: y + 4, 'text-anchor': 'end', class: `vcb-evidence__delta ${r.change < 0 ? 'is-negative' : r.change > 0 ? 'is-positive' : ''}` }, g, delta(r.change));
      const select = () => { pinned = pinned === r.key ? null : r.key; reset(); };
      g.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') { emphasize(r.key); describe(r); } });
      g.addEventListener('pointerleave', reset);
      g.addEventListener('focus', () => { emphasize(r.key); describe(r); });
      g.addEventListener('blur', reset);
      g.addEventListener('click', select);
      g.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
        if (e.key === 'Escape') { pinned = null; reset(); }
      });
      const previous = !animate && origins.has(r.key) ? origins.get(r.key)
        : replay ? { before: r.before, after: r.before }
          : (drawn.get(r.key) || { before: r.before, after: r.before });
      return { row: r, previous, before, after, line, d };
    });
    origins = new Map(marks.map(m => [m.row.key, m.previous]));
    animation.run(t => {
      marks.forEach(m => {
        const a = m.previous.before + (m.row.before - m.previous.before) * t;
        const b = m.previous.after + (m.row.after - m.previous.after) * t;
        m.before.setAttribute('cx', x(a));
        m.after.setAttribute('cx', x(b));
        m.line.setAttribute('x1', x(a));
        m.line.setAttribute('x2', x(b));
        m.d.style.opacity = String(.35 + .65 * t);
        drawn.set(m.row.key, { before: a, after: b });
      });
    }, null, animate ? 700 : 0, !animate);
    if (!current.rows.some(r => r.key === pinned)) pinned = null;
    emphasize(pinned || active);
  }
  return {
    draw,
    update(rows) { current.rows = rows; active = null; pinned = null; reset(); draw(); },
    destroy() { animation.stop(); }
  };
}

function skills(container, data) {
  SCOPES.forEach(([scope]) => MODELS.forEach(m => comparison(data, scope, m, 'skills')));
  const { card, head } = scaffold(container, 'Experience, made reusable', 'Single-agent baseline → the same model and CLI with Video-Cutting Skills', 'skills');
  let scope = 'all';
  const replay = node('button', { type: 'button', class: 'vcb-evidence__replay', 'aria-label': 'Replay the Skills comparison animation' }, head, '↻ Replay');
  const count = node('p', { class: 'vcb-evidence__scope-note' });
  buttons(card, SCOPES, scope, key => {
    scope = key;
    plot.update(rows());
    fillTable();
  }, 'Task setting for Video-Cutting Skills');
  legend(card, 'Baseline', 'With Skills');
  const host = node('div', { class: 'vcb-evidence__plot' }, card);
  const info = readout(card);
  const options = {
    before: 'Baseline', after: 'With Skills', defaultTitle: 'Same model. Same CLI. Reusable editing experience.',
    defaultText: 'Hover, tap or focus a row to inspect both pass rates. Click again or press Esc to clear.'
  };
  function rows() {
    return MODELS.map(model => {
      const r = comparison(data, scope, model, 'skills');
      return {
        key: model, model, name: label(data, model), sub: CLI[r.first.split(' / ')[0]],
        before: r.second_ship_rate, after: r.first_ship_rate,
        beforeCount: r.second_ship_count, afterCount: r.first_ship_count,
        expected: data.views[scope].expected_per_config, change: r.delta_pp
      };
    });
  }
  const plot = pairedPlot(host, rows(), data, info, options);
  const tables = node('div', {}, card);
  card.append(count);
  function fillTable() {
    tables.replaceChildren();
    table(tables, ['Model', 'CLI', 'Baseline', 'With Skills', 'Change'], rows().map(r => [r.name, r.sub, `${percent(r.before)} · ${r.beforeCount}/${r.expected}`, `${percent(r.after)} · ${r.afterCount}/${r.expected}`, delta(r.change)]), `${SCOPES.find(s => s[0] === scope)[1]} · fixed matched pairs`);
    const rs = rows(), improved = rs.filter(r => r.change > 0).length;
    count.textContent = `${data.views[scope].tasks} tasks × 3 trials per setup · ${improved} of 7 models improve in this scope. Differences are percentage points, within a model and vendor CLI.`;
  }
  info.show(options.defaultTitle, options.defaultText);
  fillTable(); plot.draw();
  replay.addEventListener('click', () => plot.draw(true, true));
  const stopResize = lifecycle(card, () => plot.draw(false));
  return { destroy() { plot.destroy(); stopResize(); } };
}

function review(container, data) {
  const models = ['gemini-3.7-flash', 'gemini-3.1-pro-preview'];
  SCOPES.forEach(([scope]) => models.forEach(m => comparison(data, scope, m, 'review')));
  const { card, head } = scaffold(container, 'Make review part of the workflow', 'Gemini CLI · Video-Cutting Skills held fixed · one model at a time', 'review');
  let model = models[0];
  const replay = node('button', { type: 'button', class: 'vcb-evidence__replay', 'aria-label': 'Replay the multi-agent comparison animation' }, head, '↻ Replay');
  buttons(card, models.map(m => [m, label(data, m)]), model, m => { model = m; plot.update(rows()); fillTable(); }, 'Gemini model for review comparison');
  legend(card, 'Single agent + Skills', 'Multi-agent + Skills');
  const host = node('div', { class: 'vcb-evidence__plot' }, card);
  const info = readout(card);
  const options = { before: 'Single agent', after: 'Multi-agent', defaultTitle: 'Review adds evidence—and computation.', defaultText: 'Inspect each setting to see where review helps and where it does not. Both setups use the same model and Skills.' };
  function rows() {
    return SCOPES.map(([scope, name]) => {
      const r = comparison(data, scope, model, 'review');
      return {
        key: scope, model, name, sub: `${data.views[scope].tasks} tasks`, before: r.second_ship_rate, after: r.first_ship_rate,
        beforeCount: r.second_ship_count, afterCount: r.first_ship_count, expected: data.views[scope].expected_per_config, change: r.delta_pp
      };
    });
  }
  const plot = pairedPlot(host, rows(), data, info, options);
  const tables = node('div', {}, card);
  function fillTable() {
    tables.replaceChildren();
    table(tables, ['Setting', 'Single agent + Skills', 'Multi-agent + Skills', 'Change'], rows().map(r => [r.name, `${percent(r.before)} · ${r.beforeCount}/${r.expected}`, `${percent(r.after)} · ${r.afterCount}/${r.expected}`, delta(r.change)]), `${label(data, model)} · Gemini CLI · same model and Skills`);
  }
  node('p', { class: 'vcb-evidence__scope-note' }, card, 'The overall rate pools all 94 tasks. Review structure and test-time computation change together; this comparison does not isolate native video perception.');
  info.show(options.defaultTitle, options.defaultText);
  fillTable(); plot.draw();
  replay.addEventListener('click', () => plot.draw(true, true));
  const stopResize = lifecycle(card, () => plot.draw(false));
  return { destroy() { plot.destroy(); stopResize(); } };
}

function craft(container, data) {
  const selections = [
    ['claude-opus-5', 'claude-code', 'solo-skill'],
    ['gpt-5.6-sol', 'codex', 'solo-skill'],
    ['gemini-3.7-flash', 'gemini-cli', 'multi-agent-skill']
  ];
  const rows = selections.map(([model, agent, setup]) => setupRow(data, 'all', model, agent, setup));
  const { card, head } = scaffold(container, 'Cleaner cuts and a finished task', 'Three family-best setups, selected by overall pass rate', 'craft');
  let metric = 'both', pinned = null;
  const replay = node('button', { type: 'button', class: 'vcb-evidence__replay', 'aria-label': 'Replay the Craft and pass-rate comparison' }, head, '↻ Replay');
  buttons(card, [['both', 'Compare both'], ['craft', 'Craft score'], ['pass', 'Pass rate']], metric, key => { metric = key; draw(); }, 'Quality metric');
  const panels = node('div', { class: 'vcb-evidence__metric-panels' }, card);
  const info = readout(card);
  const defaultTitle = 'Craft diagnoses execution; pass rate measures the whole request.';
  const defaultText = 'Craft is averaged only over countable trials. The two panels use different denominators; select a model to inspect its coverage.';
  info.show(defaultTitle, defaultText);
  const animation = animator(panels);
  function focus(model) {
    panels.querySelectorAll('[data-model]').forEach(g => {
      g.classList.toggle('is-dim', !!model && g.dataset.model !== model);
      g.classList.toggle('is-active', g.dataset.model === model);
      g.setAttribute('aria-pressed', String(g.dataset.model === pinned));
    });
    if (!model) { info.show(defaultTitle, defaultText); return; }
    const r = rows.find(r => r.model === model);
    info.show(label(data, model), `${CLI[r.agent]} · ${r.setup === 'multi-agent-skill' ? 'multi-agent' : 'single agent'} + Skills. Craft ${r.mean_craft_quality.toFixed(4)} across ${r.n_craft_countable}/${r.expected} countable trials; pass ${percent(r.ship_rate)} (${r.ship_count}/${r.expected} expected trials).`);
  }
  function draw(animate = true) {
    panels.replaceChildren();
    panels.dataset.metric = metric;
    const modes = metric === 'both' ? ['craft', 'pass'] : [metric];
    const marks = [];
    modes.forEach(mode => {
      const panel = node('div', { class: 'vcb-evidence__metric' }, panels);
      node('h5', {}, panel, mode === 'craft' ? 'Craft score' : 'Pass Rate (avg@3)');
      node('p', { class: 'vcb-evidence__metric-definition' }, panel, mode === 'craft' ? 'Mean over countable trials · 0–1' : 'Accepted / all expected trials · 0–100%');
      const width = Math.max(250, panel.clientWidth || 360), left = 10, right = width - 64;
      const h = 292;
      const svg = svgNode('svg', { viewBox: `0 0 ${width} ${h}`, width, height: h, class: 'vcb-evidence__svg', role: 'group', 'aria-label': mode === 'craft' ? 'Conditional Craft scores for the three selected setups' : 'Overall pass rates for the three selected setups' }, panel);
      const x = v => left + v * (right - left);
      [0, .25, .5, .75, 1].forEach(t => {
        svgNode('line', { x1: x(t), x2: x(t), y1: 20, y2: h - 12, class: 'vcb-evidence__grid' }, svg);
        svgNode('text', { x: x(t), y: 13, 'text-anchor': 'middle', class: 'vcb-evidence__tick' }, svg, mode === 'craft' ? `${t}` : `${t * 100}%`);
      });
      rows.forEach((r, i) => {
        const y = 66 + i * 83;
        const val = mode === 'craft' ? r.mean_craft_quality : r.ship_rate;
        const display = mode === 'craft' ? val.toFixed(4) : percent(val);
        const denominator = mode === 'craft' ? `${r.n_craft_countable}/${r.expected} countable` : `${r.ship_count}/${r.expected} accepted`;
        const g = svgNode('g', { class: 'vcb-evidence__craft-row', tabindex: '0', role: 'button', 'data-model': r.model, 'aria-label': `${label(data, r.model)}: ${display}, ${denominator}. Press to focus both panels.`, 'aria-pressed': 'false' }, svg);
        svgNode('rect', { x: 0, y: y - 29, width, height: 79, rx: 6, class: 'vcb-evidence__row-hit' }, g);
        svgNode('text', { x: 8, y: y - 12, class: 'vcb-evidence__row-name' }, g, label(data, r.model));
        const bar = svgNode('rect', { x: left, y, width: 0, height: 8, rx: 4, fill: color(data, r.model), class: 'vcb-evidence__craft-bar' }, g);
        svgNode('text', { x: width - 2, y: y + 8, 'text-anchor': 'end', class: 'vcb-evidence__metric-value' }, g, display);
        svgNode('text', { x: 8, y: y + 29, class: 'vcb-evidence__row-sub' }, g, denominator);
        marks.push({ bar, length: x(val) - left });
        const select = () => { pinned = pinned === r.model ? null : r.model; focus(pinned); };
        g.addEventListener('pointerenter', e => { if (e.pointerType !== 'touch') focus(r.model); });
        g.addEventListener('pointerleave', () => focus(pinned));
        g.addEventListener('focus', () => focus(r.model));
        g.addEventListener('blur', () => focus(pinned));
        g.addEventListener('click', select);
        g.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(); }
          if (e.key === 'Escape') { pinned = null; focus(null); }
        });
      });
    });
    animation.run(t => marks.forEach(m => m.bar.setAttribute('width', m.length * t)), null, animate ? 700 : 0, !animate);
    focus(pinned);
  }
  table(card, ['Model', 'CLI / setup', 'Craft', 'Countable / expected', 'Pass rate', 'Accepted / expected'], rows.map(r => [label(data, r.model), `${CLI[r.agent]} / ${r.setup}`, r.mean_craft_quality.toFixed(4), `${r.n_craft_countable}/${r.expected}`, percent(r.ship_rate), `${r.ship_count}/${r.expected}`]), 'Fixed family-best configurations, selected by all-task pass rate. All 94 tasks.');
  node('p', { class: 'vcb-evidence__scope-note' }, card, 'Claude Opus 5 and GPT-5.6 Sol use their vendor CLI with a single agent + Skills; Gemini 3.7 Flash uses Gemini CLI with multi-agent + Skills. These are different systems, with different Craft coverage.');
  draw();
  replay.addEventListener('click', () => draw());
  const stopResize = lifecycle(card, () => draw(false));
  return { destroy() { animation.stop(); stopResize(); } };
}

const TRAJECTORIES = [
  {
    model: 'gpt-5.6-terra', setup: 'Single agent', outcome: 'Recut · three target gaps remained', outcomeClass: 'recut',
    steps: [
      { stage: 0, title: 'Inspect the source', text: 'Examines extracted frames before rendering.', type: 'inspect' },
      { stage: 1, title: 'Render 1', text: 'Produces an edit.', type: 'render' },
      { stage: 2, title: 'Render 2', text: 'Renders again without watching the first edit.', type: 'render' },
      { stage: 3, title: 'Render 3', text: 'Renders a third time. No post-render video review appears in this trajectory.', type: 'render' },
      { stage: 5, title: 'Deliver', text: 'Stops with three target silence gaps still uncut. The result is returned for recut.', type: 'deliver' }
    ]
  },
  {
    model: 'gemini-3.7-flash', setup: 'Multi-agent', outcome: 'Acceptable · final edit reviewed', outcomeClass: 'accepted',
    steps: [
      { stage: 0, title: 'Inspect the source', text: 'Inspects the source before assembling an edit.', type: 'inspect' },
      { stage: 1, title: 'Render the first edit', text: 'Produces a first edit for review.', type: 'render' },
      { stage: 2, title: 'Review seven seams', text: 'Delegates seven seam reviews to sub-agents. Their audiovisual feedback supplies evidence about the new joins.', type: 'review' },
      { stage: 3, title: 'Revise the boundaries', text: 'Uses the reviews to revise several cut boundaries.', type: 'revise' },
      { stage: 4, title: 'Watch the final edit', text: 'A final reviewer watches the complete result before delivery.', type: 'review' },
      { stage: 5, title: 'Deliver', text: 'Delivers after reviewing the final edit. The result is acceptable.', type: 'deliver' }
    ]
  }
];
function trajectory(container, data) {
  const { card, head } = scaffold(container, 'Close the loop on the rendered video', 'One illustrative silence-removal task · actions in order, not elapsed time', 'trajectory');
  const controls = node('div', { class: 'vcb-evidence__player-controls' }, head);
  const play = node('button', { type: 'button', class: 'vcb-evidence__replay', 'aria-label': 'Play the trajectory walkthrough' }, controls, 'Play');
  const replay = node('button', { type: 'button', class: 'vcb-evidence__replay', 'aria-label': 'Replay the trajectory walkthrough' }, controls, '↻ Replay');
  const lanes = node('div', { class: 'vcb-evidence__lanes' }, card);
  const steps = [], outcomes = [];
  const detail = readout(card);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let stage = 5, playing = false, timer = 0, visible = true, started = false;
  TRAJECTORIES.forEach(lane => {
    const col = node('section', { class: 'vcb-evidence__lane', style: `--lane-color:${color(data, lane.model)}` }, lanes);
    const header = node('div', { class: 'vcb-evidence__lane-head' }, col);
    node('strong', {}, header, label(data, lane.model));
    node('span', {}, header, lane.setup);
    const list = node('ol', { class: 'vcb-evidence__steps' }, col);
    lane.steps.forEach((step, index) => {
      const li = node('li', { class: `vcb-evidence__step vcb-evidence__step--${step.type}` }, list);
      const b = node('button', { type: 'button', 'aria-label': `${label(data, lane.model)}, action ${index + 1}: ${step.title}. ${step.text}` }, li);
      node('span', { class: 'vcb-evidence__step-number', 'aria-hidden': 'true' }, b, String(index + 1).padStart(2, '0'));
      const copy = node('span', { class: 'vcb-evidence__step-copy' }, b);
      node('strong', {}, copy, step.title);
      node('span', {}, copy, step.text);
      if (step.title === 'Review seven seams') {
        const seams = node('span', { class: 'vcb-evidence__seams', 'aria-hidden': 'true' }, copy);
        for (let i = 1; i <= 7; i++) node('i', {}, seams, `${i}`);
      }
      b.addEventListener('click', () => {
        pause(); setStage(step.stage, false);
        detail.show(`${label(data, lane.model)} · ${step.title}`, step.text);
      });
      steps.push({ el: li, stage: step.stage });
    });
    outcomes.push(node('p', { class: `vcb-evidence__outcome vcb-evidence__outcome--${lane.outcomeClass}` }, col, lane.outcome));
  });
  const progress = node('div', { class: 'vcb-evidence__player-progress' }, card);
  node('span', {}, progress, 'Inspect');
  const slider = node('input', { type: 'range', min: '0', max: '5', step: '1', value: '5', 'aria-label': 'Trajectory walkthrough stage', 'aria-valuetext': 'Full trajectory' }, progress);
  node('span', {}, progress, 'Deliver');
  const stageNames = ['Source inspection', 'First render', 'Re-render or review', 'Further rendering or boundary revision', 'Final video review', 'Delivery'];
  function setStage(n, announce = true) {
    stage = n;
    slider.value = String(n);
    slider.setAttribute('aria-valuetext', stageNames[n]);
    steps.forEach(s => {
      s.el.classList.toggle('is-future', s.stage > n);
      s.el.classList.toggle('is-current', s.stage === n);
      s.el.classList.toggle('is-complete', s.stage < n);
    });
    outcomes.forEach(el => el.classList.toggle('is-future', n < 5));
    if (announce) detail.show(stageNames[n], n === 5 ? 'Only the multi-agent run reviews what it rendered. This example illustrates a feedback loop; it is not an estimate of the effect across tasks.' : 'The lanes preserve each run’s action order. Their alignment and playback speed do not represent shared timestamps or duration.');
  }
  function schedule() {
    clearTimeout(timer);
    if (!playing || !visible || document.hidden) return;
    timer = setTimeout(() => {
      if (stage >= 5) { pause(); return; }
      setStage(stage + 1);
      if (stage === 5) pause(); else schedule();
    }, 1850);
  }
  function pause() { playing = false; clearTimeout(timer); play.textContent = 'Play'; play.setAttribute('aria-label', 'Play the trajectory walkthrough'); }
  function start(restart = false) {
    started = true;
    if (restart || stage === 5) setStage(0);
    playing = true; play.textContent = 'Pause'; play.setAttribute('aria-label', 'Pause the trajectory walkthrough');
    schedule();
  }
  play.addEventListener('click', () => { if (playing) pause(); else start(); });
  replay.addEventListener('click', () => start(true));
  slider.addEventListener('input', () => { pause(); setStage(Number(slider.value)); });
  const visibility = () => { if (document.hidden) clearTimeout(timer); else schedule(); };
  const motionChange = () => {
    if (!motion.matches) return;
    pause();
    started = true;
    setStage(5);
  };
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener?.('change', motionChange);
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) clearTimeout(timer);
    else if (!started && !motion.matches) start(true);
    else schedule();
  }, { threshold: .18 });
  observer.observe(card);
  table(card, ['Model', 'Action order', 'Observation'], TRAJECTORIES.flatMap(lane => lane.steps.map((s, i) => [label(data, lane.model), `${i + 1}. ${s.title}`, s.text])), 'Illustrative silence-removal trajectories. Ordered actions only; no elapsed-time measurements.');
  node('p', { class: 'vcb-evidence__scope-note' }, card, 'The workflow text summarizes the authored trajectory figure; it is not a verbatim agent transcript. The seven seam reviews are shown as a group, without assuming an order among reviewers.');
  setStage(5);
  return { destroy() { pause(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); motion.removeEventListener?.('change', motionChange); } };
}

export function mountEvidence(container, kind, data) {
  if (!container || !data?.views?.all) throw new Error('Evidence figure requires a container and reportData.');
  const mount = { skills, review, craft, trajectory }[kind];
  if (!mount) throw new Error(`Unknown evidence figure: ${kind}`);
  return mount(container, data);
}
