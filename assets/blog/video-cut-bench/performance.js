/*
 * Video-Cut-Bench: model capability.
 * Original implementation inspired by the SVG-to-Plotly frontier story at
 * HarnessTax. Numeric parameter counts and undisclosed models deliberately
 * occupy different panels; an undisclosed model never enters the frontier.
 */

const FAMILY_ORDER = ['Qwen', 'DeepSeek', 'Moonshot AI', 'Z.ai', 'Thinking Machines',
  'NVIDIA', 'Meta', 'Anthropic', 'OpenAI', 'Google', 'xAI / Cursor'];
const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const NS = 'http://www.w3.org/2000/svg';
const INTRO_MS = 4500;
const TOUR_DELAY = 3200;
const TOUR_MS = 5200;
const PCT = value => `${(value * 100).toFixed(1)}%`;
const SIZE = value => value >= 1000 ? `${+(value / 1000).toFixed(2)}T` : `${value}B`;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));

function el(tag, className, parent, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (parent) parent.append(node);
  return node;
}

function svgEl(tag, attrs, parent, text) {
  const node = document.createElementNS(NS, tag);
  Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, value));
  if (text !== undefined) node.textContent = text;
  if (parent) parent.append(node);
  return node;
}

function button(parent, text, className = '') {
  const node = el('button', `vcbp-button ${className}`.trim(), parent, text);
  node.type = 'button';
  return node;
}

function colors(state) {
  const styles = getComputedStyle(state.root);
  const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
  const result = {
    ink: read('--vcb-ink', '#171715'), muted: read('--vcb-muted', '#73736b'),
    grid: read('--vcb-grid', '#e3e3dc'), surface: read('--vcb-surface', '#fcfcfa'),
    accent: read('--vcb-accent', '#49788a'),
  };
  // Near-black family colors from the source report need a light equivalent
  // on dark paper. Other colors retain their source identity.
  const computedInk = styles.color || result.ink;
  const ink = computedInk.match(/[\d.]+/g);
  const hex = computedInk.match(/^#([a-f\d]{6})$/i);
  result.dark = hex ? parseInt(hex[1].slice(0, 2), 16) > 150 :
    Boolean(ink && Number(ink[0]) > 150);
  return result;
}

function familyColor(state, family) {
  const value = state.data.model_parameters.family_colors?.[family] || '#637b8b';
  if (state.colors.dark && family === 'xAI / Cursor') return '#dadad4';
  if (state.colors.dark && family === 'Thinking Machines') return '#b9c1c9';
  if (state.colors.dark && family === 'Qwen') return '#ab88f3';
  return value;
}

function rowsFor(data) {
  const models = data.model_parameters.models;
  return data.views.all.model_leaderboard
    .filter(row => row.agent === 'mini-swe-agent' && row.scaffold === 'solo' && row.arm === 'base')
    .map(row => ({ ...row, meta: models[row.model], size: Number(models[row.model]?.total_b) }))
    .filter(row => row.meta)
    .sort((a, b) => a.model.localeCompare(b.model));
}

function frontierOf(rows) {
  const sorted = rows.filter(row => Number.isFinite(row.size) && row.size > 0)
    .sort((a, b) => a.size - b.size || b.ship_rate - a.ship_rate || a.model.localeCompare(b.model));
  let best = -Infinity;
  return sorted.filter(row => {
    if (row.ship_rate <= best) return false;
    best = row.ship_rate;
    return true;
  });
}

function isSelected(state, row) {
  return (!state.family || state.family === row.meta.family) && (!state.model || state.model === row.model);
}

function geometry(panel) {
  const width = Math.max(220, panel.host.clientWidth);
  // Equal pixel heights are essential when the two panels sit side by side.
  const height = 380;
  const margin = { l: 43, r: 15, t: 24, b: 49 };
  const iw = width - margin.l - margin.r;
  const ih = height - margin.t - margin.b;
  // Both panels retain exactly the same vertical geometry.
  const xr = panel.kind === 'known' ? [-0.25, 3.6] : [-0.55, panel.families.length - 0.45];
  const yr = [-0.035, 1.025];
  return {
    width, height, margin, iw, ih, xr, yr,
    x: value => margin.l + ((panel.kind === 'known' ? Math.log10(value) : value) - xr[0]) / (xr[1] - xr[0]) * iw,
    y: value => margin.t + (yr[1] - value) / (yr[1] - yr[0]) * ih,
  };
}

function panelPoints(state, panel) {
  const front = new Set(frontierOf(state.rows).map(row => row.model));
  return state.rows.filter(row => (Number.isFinite(row.size) && row.size > 0) === (panel.kind === 'known'))
    .map(row => {
      const family = row.meta.family;
      const members = state.data.model_parameters.undisclosed_family_orders?.[family] || [row.model];
      const index = Math.max(0, members.indexOf(row.model));
      // This is categorical spacing within a family, not an inferred model size.
      const x = panel.kind === 'known' ? row.size : panel.families.indexOf(family) +
        (members.length === 1 ? 0 : (index / (members.length - 1) - 0.5) * 0.38);
      return { ...row, x, y: row.ship_rate, frontier: front.has(row.model),
        color: familyColor(state, family), selected: isSelected(state, row) };
    });
}

function intersects(a, b, pad = 3) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

const markerRadius = point => point.frontier || !Number.isFinite(point.size) ? 7.25 : 5.4;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const routeSegments = route => route.slice(1).map((b, index) => ({ a: route[index], b }));

function pointSegmentDistance(point, segment) {
  const { a, b } = segment;
  const length2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  const t = length2 ? clamp(((point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)) / length2, 0, 1) : 0;
  return Math.hypot(point.x - a.x - t * (b.x - a.x), point.y - a.y - t * (b.y - a.y));
}

function segmentsCross(first, second) {
  const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return cross(first.a, first.b, second.a) * cross(first.a, first.b, second.b) < 0 &&
    cross(second.a, second.b, first.a) * cross(second.a, second.b, first.b) < 0;
}

function segmentDistance(first, second) {
  return segmentsCross(first, second) ? 0 : Math.min(pointSegmentDistance(first.a, second), pointSegmentDistance(first.b, second),
    pointSegmentDistance(second.a, first), pointSegmentDistance(second.b, first));
}

function segmentHitsBox(segment, box, pad = 0) {
  // Liang–Barsky clipping also catches tangent and collinear contact.
  const x0 = box.x - pad, x1 = box.x + box.w + pad;
  const y0 = box.y - pad, y1 = box.y + box.h + pad;
  const dx = segment.b.x - segment.a.x, dy = segment.b.y - segment.a.y;
  let low = 0, high = 1;
  for (const [p, q] of [[-dx, segment.a.x - x0], [dx, x1 - segment.a.x], [-dy, segment.a.y - y0], [dy, y1 - segment.a.y]]) {
    if (Math.abs(p) < 1e-10) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) low = Math.max(low, t); else high = Math.min(high, t);
    if (low > high) return false;
  }
  return true;
}

function clipLeaderAtBox(vertices, box) {
  // Stop at the first contact with the closed paper rectangle. In particular,
  // a segment approaching along an edge must end at the corner rather than
  // continue along the label border toward its originally chosen port.
  for (let index = 1; index < vertices.length; index += 1) {
    const a = vertices[index - 1], b = vertices[index];
    const dx = b.x - a.x, dy = b.y - a.y;
    let enter = 0, leave = 1, intersectsBox = true;
    for (const [p, q] of [[-dx, a.x - box.x], [dx, box.x + box.w - a.x],
      [-dy, a.y - box.y], [dy, box.y + box.h - a.y]]) {
      if (Math.abs(p) < 1e-10) {
        if (q < 0) { intersectsBox = false; break; }
        continue;
      }
      const t = q / p;
      if (p < 0) enter = Math.max(enter, t); else leave = Math.min(leave, t);
      if (enter > leave) { intersectsBox = false; break; }
    }
    if (intersectsBox) {
      const contact = { x: a.x + enter * dx, y: a.y + enter * dy };
      const prefix = vertices.slice(0, index);
      if (distance(prefix[prefix.length - 1], contact) > 0.01) prefix.push(contact);
      return prefix;
    }
  }
  return vertices;
}

function frontierSegments(points, geo) {
  const frontier = points.filter(point => point.frontier).sort((a, b) => a.size - b.size);
  return frontier.slice(1).flatMap((point, index) => {
    const previous = frontier[index];
    const a = { x: geo.x(previous.x), y: geo.y(previous.y) };
    const corner = { x: geo.x(point.x), y: a.y };
    const b = { x: corner.x, y: geo.y(point.y) };
    return [{ a, b: corner }, { a: corner, b }];
  });
}

function clearLabelBox(box, disks, frontier, placed, tickBoxes = []) {
  if (placed.some(label => intersects(box, label.box, 5))) return false;
  // Test the final, clamped box against every disk, including its owner. The
  // clearance also covers the short, three-pixel intro pulse.
  if (disks.some(disk => Math.hypot(disk.x - clamp(disk.x, box.x, box.x + box.w),
    disk.y - clamp(disk.y, box.y, box.y + box.h)) < disk.r + 5)) return false;
  if (frontier.some(segment => segmentHitsBox(segment, box, 5))) return false;
  if (placed.some(label => label.leaderSegments.some(segment => segmentHitsBox(segment, box, 4)))) return false;
  if (tickBoxes.some(tick => intersects(box, tick, 2))) return false;
  return true;
}

function routeLeader(point, box, disks, frontier, placed, geo, allowBends = false) {
  const origin = disks.find(disk => disk.model === point.model);
  const nearest = { x: clamp(origin.x, box.x, box.x + box.w), y: clamp(origin.y, box.y, box.y + box.h) };
  // Close labels read clearly without an extra line; distant labels must have
  // a completely clear route. No diagonal may run through its own paper box.
  if (distance(origin, nearest) <= origin.r + 11) return [];
  const ports = [nearest,
    { x: box.x, y: clamp(origin.y, box.y + 7, box.y + box.h - 7) },
    { x: box.x + box.w, y: clamp(origin.y, box.y + 7, box.y + box.h - 7) },
    { x: clamp(origin.x, box.x + 7, box.x + box.w - 7), y: box.y },
    { x: clamp(origin.x, box.x + 7, box.x + box.w - 7), y: box.y + box.h },
  ];
  const clearRoute = vertices => {
    const route = clipLeaderAtBox(vertices.filter((vertex, index) => !index || distance(vertex, vertices[index - 1]) > 0.1), box);
    if (route.length < 2) return null;
    const firstLength = distance(route[0], route[1]);
    if (firstLength <= origin.r + 1.5) return null;
    route[0] = { x: origin.x + (route[1].x - origin.x) / firstLength * (origin.r + 1.5),
      y: origin.y + (route[1].y - origin.y) / firstLength * (origin.r + 1.5) };
    const segments = routeSegments(route);
    for (const segment of segments) {
      if (disks.some(disk => pointSegmentDistance(disk, segment) < disk.r + (disk === origin ? 1 : 3))) return null;
      if (frontier.some(edge => segmentDistance(segment, edge) < 2.5)) return null;
      if (placed.some(label => segmentHitsBox(segment, label.box, 4) ||
        label.leaderSegments.some(edge => segmentDistance(segment, edge) < 3))) return null;
      if (geo.tickBoxes?.some(tick => segmentHitsBox(segment, tick, 2))) return null;
      if (segmentHitsBox(segment, box, -0.3)) return null;
    }
    return route;
  };
  for (const port of ports) {
    const direct = clearRoute([origin, port]);
    if (direct) return direct;
  }
  if (!allowBends) return null;
  // Try economical elbows before searching a wider corridor. Each full path
  // is checked against the real staircase, disks, labels and existing leaders.
  const bends = [];
  for (const port of ports) bends.push({ x: origin.x, y: port.y }, { x: port.x, y: origin.y });
  for (const reach of [24, 52]) for (const [dx, dy] of [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]) {
    const bend = { x: origin.x + dx * reach, y: origin.y + dy * reach };
    if (bend.x >= geo.margin.l + 1 && bend.x <= geo.width - geo.margin.r - 1 && bend.y >= 2 && bend.y <= geo.height - geo.margin.b - 1) bends.push(bend);
  }
  bends.sort((a, b) => distance(origin, a) + distance(a, nearest) - distance(origin, b) - distance(b, nearest));
  for (const bend of bends) for (const port of ports) {
    const routed = clearRoute([origin, bend, port]);
    if (routed) return routed;
  }
  // A point below the staircase can be boxed in on a very narrow plot. The
  // quiet right gutter supplies a bounded two-elbow corridor around the final
  // frontier point, leading to the reserved empty band above the observations.
  // The route remains inside the SVG and is subjected to exactly the same
  // collision checks; no numeric position is moved to manufacture space.
  for (const x of [geo.width - 3, geo.width - 8]) for (const port of ports) {
    const routed = clearRoute([origin, { x, y: origin.y }, { x, y: port.y }, port]);
    if (routed) return routed;
  }
  return null;
}

function labelPlan(state, panel, points, geo) {
  const active = Boolean(state.family || state.model);
  let targets;
  if (active) targets = points.filter(point => point.selected);
  else if (panel.kind === 'known') {
    targets = points.filter(point => point.frontier).sort((a, b) => b.y - a.y);
    // Small plots retain the endpoints plus the strongest intermediate result.
    if (geo.width < 500 && targets.length > 3) targets = [targets[0], targets.find(point => point.model === 'Qwen3.8-27B') || targets[2], targets[targets.length - 1]];
  } else {
    targets = panel.families.map(family => points.filter(point => point.meta.family === family).sort((a, b) => b.y - a.y)[0]).filter(Boolean);
  }
  // The smallest reported models have the least room beside the left/bottom
  // axes. Give those constrained seats priority instead of displacing the
  // zero-percent endpoint upward after all the interior labels are placed.
  // In the narrow categorical panel, seat the central GPT label first. The
  // upper Claude label has spare headroom; this avoids a long right-hand
  // dogleg for Grok without changing any data-point coordinates.
  targets.sort((a, b) => panel.kind === 'unknown' && geo.width < 280 && !active
    ? Number(b.model === 'gpt-5.6-sol') - Number(a.model === 'gpt-5.6-sol') || b.y - a.y
    : Number(b.model === 'Qwen3.5-0.8B') - Number(a.model === 'Qwen3.5-0.8B') || b.y - a.y);
  const singleTarget = targets.length === 1;
  const ctx = state.measure;
  const placed = [];
  const disks = points.map(point => ({ model: point.model, x: geo.x(point.x), y: geo.y(point.y), r: markerRadius(point) }));
  const frontier = frontierSegments(points, geo);
  // The zero-percent endpoint may use the empty space left of the plot,
  // between tick labels. Tick text itself remains an explicit hard obstacle.
  geo.tickBoxes = [0, 0.25, 0.5, 0.75, 1].map(value => ({ x: 0, y: geo.y(value) - 9, w: geo.margin.l - 4, h: 18 }));
  for (const point of targets) {
    const title = point.meta.short_label || point.model;
    const detail = panel.kind === 'known' ? `${SIZE(point.size)} · ${PCT(point.y)}` : PCT(point.y);
    const showDetail = Boolean(state.model);
    const measuredWidth = (text, weight, size) => Math.max(...[FONT, '"Segoe UI", sans-serif', 'Arial, sans-serif'].map(font => {
      ctx.font = `${weight} ${size}px ${font}`;
      return ctx.measureText(text).width;
    }));
    const titleWidth = measuredWidth(title, 700, 11);
    const detailWidth = measuredWidth(detail, 400, 10);
    // The conservative allowance covers browser font rounding. Plotly and SVG
    // use these exact paper dimensions; text never determines a larger box.
    const w = Math.ceil(Math.max(titleWidth, showDetail ? detailWidth : 0) * 1.04) + 12;
    const h = showDetail ? 36 : 22;
    const px = geo.x(point.x), py = geo.y(point.y);
    const boundaryEndpoint = point.model === 'Qwen3.5-0.8B' && !showDetail;
    const minX = boundaryEndpoint ? 0 : geo.margin.l + 2;
    const reserveBelow = !showDetail && points.some(other => other.model !== point.model &&
      geo.x(other.x) < px && px - geo.x(other.x) < 100 && geo.y(other.y) - py > 10 && geo.y(other.y) - py < 32);
    const candidates = [];
    const seen = new Set();
    const addCandidate = (x, y, penalty = 0) => {
      if (w > geo.iw - 4) return;
      const box = { x: Math.round(clamp(x, minX, geo.width - geo.margin.r - w - 2)),
        y: Math.round(clamp(y, 3, geo.height - geo.margin.b - h - 3)), w, h };
      const key = `${box.x},${box.y}`;
      if (seen.has(key)) return;
      seen.add(key);
      if (!clearLabelBox(box, disks, frontier, placed, geo.tickBoxes)) return;
      const center = { x: box.x + w / 2, y: box.y + h / 2 };
      candidates.push({ box, cost: distance({ x: px, y: py }, center) + penalty + (boundaryEndpoint ? box.x * 1.5 : 0) });
    };
    for (const gap of [13, 18, 20, 26, 38, 54, 76, 104]) {
      // Fine local slides find the gaps between nearby frontier labels before
      // a model is pushed into an unrelated part of the chart.
      for (const shift of [0, -6, 6, -12, 12, -20, 20, -32, 32, -48, 48]) {
        addCandidate(px - w / 2 + shift, py - h - gap, Math.abs(shift) * 0.015 + (reserveBelow ? Math.max(0, 20 - gap) * 1.5 : 0));
        addCandidate(px - w / 2 + shift, py + gap, 1 + Math.abs(shift) * 0.015);
      }
      for (const shift of [0, -6, 6, -12, 12, -20, 20]) {
        addCandidate(px - w - gap, py - h / 2 + shift, 1.5 + Math.abs(shift) * 0.015);
        addCandidate(px + gap, py - h / 2 + shift, 2 + Math.abs(shift) * 0.015);
      }
    }
    const choose = () => {
      candidates.sort((a, b) => a.cost - b.cost);
      // First exhaust inexpensive straight routes. Searching elbows for every
      // infeasible dense-family seat can otherwise monopolize the main thread.
      for (const candidate of candidates.slice(0, 100)) {
        const leader = routeLeader(point, candidate.box, disks, frontier, placed, geo);
        if (leader !== null && !(state.family && geo.width < 500 && routeSegments(leader).reduce((length, edge) => length + distance(edge.a, edge.b), 0) > 60)) {
          return { box: candidate.box, leader, leaderSegments: routeSegments(leader) };
        }
      }
      if (state.model || singleTarget) {
        // One selected marker is unambiguous against the muted cohort. If its
        // local neighborhood is boxed in, use a checked callout in the empty
        // top band without a long connector snaking around the observations.
        const topLimit = Math.min(...disks.map(disk => disk.y - disk.r - 6)) - h;
        if (topLimit >= 3 && w <= geo.iw - 4) {
          const box = { x: Math.round(clamp(px - w / 2, geo.margin.l + 2, geo.width - geo.margin.r - w - 2)),
            y: Math.floor(Math.min(geo.margin.t + 4, topLimit)), w, h };
          if (clearLabelBox(box, disks, frontier, placed, geo.tickBoxes)) return { box, leader: [], leaderSegments: [], reserved: true };
        }
      }
      for (const candidate of candidates.slice(0, state.model ? 8 : 2)) {
        const leader = routeLeader(point, candidate.box, disks, frontier, placed, geo, true);
        if (leader !== null && !(state.family && geo.width < 500 && routeSegments(leader).reduce((length, edge) => length + distance(edge.a, edge.b), 0) > 60)) {
          return { box: candidate.box, leader, leaderSegments: routeSegments(leader) };
        }
      }
      return null;
    };
    let chosen = choose();
    if (!chosen && (state.model || singleTarget || (!state.family && geo.width >= 420))) {
      candidates.length = 0;
      // Reserved open space above the data and a broad pixel grid make a
      // single selected model label possible without a forced unsafe fallback.
      const stride = state.model ? 9 : 18;
      for (let y = 3; y <= geo.height - geo.margin.b - h - 3; y += stride) {
        for (let x = minX; x <= geo.width - geo.margin.r - w - 2; x += stride) addCandidate(x, y, 7);
        addCandidate(geo.width - geo.margin.r - w - 2, y, 7);
      }
      chosen = choose();
    }
    if (chosen) placed.push({ point, title, detail, showDetail, ...chosen, px, py });
  }
  return placed;
}

function frontierPath(points, geo) {
  const frontier = points.filter(point => point.frontier).sort((a, b) => a.size - b.size);
  let length = 0;
  let path = '';
  const arrivals = new Map();
  frontier.forEach((point, index) => {
    const x = geo.x(point.x), y = geo.y(point.y);
    if (!index) path = `M${x},${y}`;
    else {
      const last = frontier[index - 1];
      length += Math.abs(x - geo.x(last.x)) + Math.abs(y - geo.y(last.y));
      path += `H${x}V${y}`;
    }
    arrivals.set(point.model, length);
  });
  return { frontier, path, length, arrivals };
}

function sharedLayout(state, panel) {
  const geo = geometry(panel);
  const key = [geo.width, state.family, state.model, state.colors.dark, state.colors.surface, state.colors.ink].join('|');
  if (panel.labelLayout?.key === key) return panel.labelLayout;
  const points = panelPoints(state, panel);
  const labels = labelPlan(state, panel, points, geo);
  panel.labelLayout = { key, geo, points, labels };
  return panel.labelLayout;
}

function buildStory(state, panel) {
  const { geo, points, labels } = sharedLayout(state, panel);
  panel.geo = geo;
  panel.host.style.height = `${geo.height}px`;
  panel.story.replaceChildren();
  const svg = svgEl('svg', { viewBox: `0 0 ${geo.width} ${geo.height}`, 'aria-hidden': 'true' }, panel.story);
  const grid = svgEl('g', { class: 'vcbp-grid' }, svg);
  for (const value of [0, 0.25, 0.5, 0.75, 1]) {
    const y = geo.y(value);
    svgEl('line', { x1: geo.margin.l, x2: geo.width - geo.margin.r, y1: y, y2: y }, grid);
    svgEl('text', { x: geo.margin.l - 8, y: y + 4, 'text-anchor': 'end' }, grid, `${value * 100}%`);
  }
  const ticks = panel.kind === 'known' ? [1, 10, 100, 1000] : panel.families.map((_, index) => index);
  for (const value of ticks) {
    const x = geo.x(value);
    if (panel.kind === 'known') svgEl('line', { x1: x, x2: x, y1: geo.margin.t, y2: geo.height - geo.margin.b }, grid);
    const text = panel.kind === 'known' ? SIZE(value) : shortFamily(panel.families[value]);
    svgEl('text', { x, y: geo.height - geo.margin.b + 18, 'text-anchor': 'middle' }, grid, text);
  }
  svgEl('text', { x: geo.margin.l + geo.iw / 2, y: geo.height - 7, 'text-anchor': 'middle', class: 'vcbp-axis-title' }, svg,
    panel.kind === 'known' ? 'Reported total parameters · log scale' : 'Model families · size undisclosed');
  const route = frontierPath(points, geo);
  const path = panel.kind === 'known' && route.frontier.length > 1 ?
    svgEl('path', { d: route.path, class: 'vcbp-frontier', fill: 'none', 'stroke-dasharray': route.length,
      'stroke-dashoffset': route.length }, svg) : null;
  // Both renderers put every leader below every marker. Leader vertices come
  // directly from the checked shared plan, rather than reconnecting box centers.
  const leaderLayer = svgEl('g', { class: 'vcbp-leaders' }, svg);
  const leaders = new Map();
  for (const label of labels) {
    const group = svgEl('g', { opacity: 0 }, leaderLayer);
    if (label.leader.length) svgEl('path', { d: label.leader.map((vertex, index) => `${index ? 'L' : 'M'}${vertex.x},${vertex.y}`).join(' '),
      fill: 'none', class: 'vcbp-leader' }, group);
    leaders.set(label.point.model, group);
  }
  const nodes = [];
  points.forEach((point, index) => {
    const arrival = point.frontier ? 180 + (route.length ? route.arrivals.get(point.model) / route.length * 2700 : 0) :
      panel.kind === 'unknown' ? 2700 + index * 65 : 340 + index * 55;
    const group = svgEl('g', { transform: `translate(${geo.x(point.x)},${geo.y(point.y)})`, opacity: 0 }, svg);
    const major = point.frontier || panel.kind === 'unknown';
    const pulse = svgEl('circle', { r: major ? 7 : 5, fill: 'none', stroke: point.color, 'stroke-width': 1, opacity: 0 }, group);
    svgEl('circle', { r: major ? 6.5 : 4.5, fill: major ? point.color : state.colors.surface,
      stroke: point.color, 'stroke-width': major ? 1.5 : 1.8 }, group);
    if (major) svgEl('circle', { r: 1.7, fill: state.colors.surface, 'pointer-events': 'none' }, group);
    nodes.push({ group, pulse, arrival, point });
  });
  const labelNodes = [];
  for (const label of labels) {
    const { box, point } = label;
    const node = svgEl('g', { opacity: 0 }, svg);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    svgEl('rect', { x: box.x, y: box.y, width: box.w, height: box.h, rx: 3, class: 'vcbp-label-paper' }, node);
    svgEl('text', { x: cx, y: box.y + (label.showDetail ? 14 : 15), 'text-anchor': 'middle', class: 'vcbp-model-label' }, node, label.title);
    if (label.showDetail) svgEl('text', { x: cx, y: box.y + 28, 'text-anchor': 'middle', class: 'vcbp-detail-label' }, node, label.detail);
    const arrival = nodes.find(item => item.point.model === point.model)?.arrival || 0;
    labelNodes.push({ node, leaderNode: leaders.get(point.model), arrival: arrival + 90 });
  }
  panel.animation = { path, length: route.length, nodes, labels: labelNodes };
}

function shortFamily(family) {
  return family === 'Anthropic' ? 'Claude' : family === 'OpenAI' ? 'GPT' : family === 'Google' ? 'Gemini' : family === 'xAI / Cursor' ? 'Grok' : family;
}

function storyFrame(state, elapsed) {
  const done = state.reduce.matches || elapsed >= INTRO_MS;
  for (const panel of state.panels) {
    const animation = panel.animation;
    if (!animation) continue;
    if (animation.path) animation.path.setAttribute('stroke-dashoffset', done ? 0 : animation.length * (1 - clamp((elapsed - 180) / 2700, 0, 1)));
    for (const { group, pulse, arrival, point } of animation.nodes) {
      const progress = done ? 1 : clamp((elapsed - arrival) / 300, 0, 1);
      group.setAttribute('opacity', progress);
      const wave = (elapsed - arrival) / 680;
      pulse.setAttribute('r', (point.frontier || panel.kind === 'unknown' ? 7 : 5) + clamp(wave, 0, 1) * 3);
      pulse.setAttribute('opacity', !done && wave > 0 && wave < 1 ? (1 - wave) * 0.45 : 0);
    }
    for (const { node, leaderNode, arrival } of animation.labels) {
      const opacity = done ? 1 : clamp((elapsed - arrival) / 400, 0, 1);
      node.setAttribute('opacity', opacity);
      leaderNode.setAttribute('opacity', opacity);
    }
    const dissolve = state.plotReady && (done || elapsed > 3820) ? (done ? 1 : clamp((elapsed - 3820) / 680, 0, 1)) : 0;
    panel.story.style.opacity = String(1 - dissolve);
    panel.plot.style.opacity = String(dissolve);
    panel.plot.style.pointerEvents = dissolve > 0.8 ? 'auto' : 'none';
  }
}

function annotation(label, geo, palette) {
  const { box } = label;
  return {
    xref: 'paper', yref: 'paper', x: (box.x + box.w / 2 - geo.margin.l) / geo.iw,
    y: 1 - (box.y + box.h / 2 - geo.margin.t) / geo.ih, xanchor: 'center', yanchor: 'middle',
    text: `<b>${escapeHTML(label.title)}</b>${label.showDetail ? `<br><span style="font-size:10px;color:${palette.muted}">${escapeHTML(label.detail)}</span>` : ''}`,
    showarrow: false, font: { family: FONT, size: 11, color: palette.ink },
    width: box.w - 8, height: box.h - 8, borderwidth: 0, borderpad: 4,
    bgcolor: palette.surface, opacity: 1, align: 'center', valign: 'middle',
  };
}

function mutedColor(color, surface) {
  const rgb = value => {
    let hex = value.trim().replace(/^#/, '');
    if (/^[a-f\d]{3}$/i.test(hex)) hex = hex.split('').map(c => c + c).join('');
    if (/^[a-f\d]{6}$/i.test(hex)) return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16));
    const parts = value.match(/[\d.]+/g);
    return parts?.length >= 3 ? parts.slice(0, 3).map(Number) : [255, 255, 255];
  };
  const foreground = rgb(color), background = rgb(surface);
  return `rgb(${foreground.map((value, index) => Math.round(value * 0.18 + background[index] * 0.82)).join(',')})`;
}

function plotSpec(state, panel) {
  const { geo, points, labels } = sharedLayout(state, panel);
  const palette = state.colors;
  const active = Boolean(state.family || state.model);
  const frontier = points.filter(point => point.frontier).sort((a, b) => a.size - b.size);
  const traces = [];
  if (panel.kind === 'known') traces.push({
    uid: 'reported-frontier', type: 'scatter', mode: 'lines', x: frontier.map(point => point.x), y: frontier.map(point => point.y),
    line: { color: palette.accent, width: 1.6, shape: 'hv', dash: 'dot' },
    opacity: active ? 0.25 : 0.72, hoverinfo: 'skip', showlegend: false,
  });
  for (const point of points) {
    const major = point.frontier || panel.kind === 'unknown';
    const markerColor = active && !point.selected ? mutedColor(point.color, palette.surface) : point.color;
    const parameterText = Number.isFinite(point.size) ? `${SIZE(point.size)} total${point.meta.active_b ? ` · ${SIZE(point.meta.active_b)} active` : ''}` : 'Parameters undisclosed';
    traces.push({
      uid: point.model, name: point.meta.short_label, type: 'scatter', mode: 'markers',
      x: [point.x], y: [point.y], customdata: [[point.model, point.ship_count, point.expected, point.tasks]],
      marker: { size: major ? 13 : 9, symbol: 'circle', color: major ? markerColor : palette.surface,
        line: { color: markerColor, width: major ? 1.5 : 1.8 } },
      opacity: 1, showlegend: false,
      hovertemplate: `<b>${escapeHTML(point.meta.short_label)}</b><br>` +
        'Pass rate: <b>%{y:.1%}</b><br>%{customdata[1]} / %{customdata[2]} successful trials<br>' +
        '%{customdata[3]} tasks × 3 trials<br>' + escapeHTML(parameterText) +
        '<br>mini-swe-agent · solo · base<extra></extra>',
    });
  }
  const shapes = [];
  for (const label of labels) {
    for (const { a, b } of label.leaderSegments) shapes.push({ type: 'line', xref: 'paper', yref: 'paper',
      x0: (a.x - geo.margin.l) / geo.iw, y0: 1 - (a.y - geo.margin.t) / geo.ih,
      x1: (b.x - geo.margin.l) / geo.iw, y1: 1 - (b.y - geo.margin.t) / geo.ih,
      line: { color: palette.muted, width: 0.7 }, opacity: 0.5, layer: 'below' });
  }
  return {
    data: traces,
    layout: {
      autosize: true, width: geo.width, height: geo.height, margin: geo.margin,
      paper_bgcolor: palette.surface, plot_bgcolor: palette.surface,
      font: { family: FONT, size: 11, color: palette.muted }, showlegend: false,
      hovermode: 'closest', hoverdistance: 24, dragmode: false,
      hoverlabel: { bgcolor: palette.surface, bordercolor: palette.grid, font: { color: palette.ink, family: FONT, size: 12 }, align: 'left' },
      xaxis: {
        type: panel.kind === 'known' ? 'log' : 'linear', range: geo.xr, fixedrange: true,
        tickmode: 'array', tickvals: panel.kind === 'known' ? [1, 10, 100, 1000] : panel.families.map((_, i) => i),
        ticktext: panel.kind === 'known' ? ['1B', '10B', '100B', '1T'] : panel.families.map(shortFamily),
        title: { text: panel.kind === 'known' ? 'Reported total parameters · log scale' : 'Model families · size undisclosed', standoff: 12,
          font: { size: 10, color: palette.muted } },
        showgrid: panel.kind === 'known', gridcolor: palette.grid, zeroline: false, showline: false,
      },
      yaxis: { range: geo.yr, tickmode: 'array', tickvals: [0, 0.25, 0.5, 0.75, 1],
        ticktext: ['0%', '25%', '50%', '75%', '100%'], fixedrange: true,
        gridcolor: palette.grid, zeroline: false, showline: false },
      annotations: labels.map(label => annotation(label, geo, palette)), shapes,
      uirevision: 'video-cut-bench-capability',
    },
  };
}

async function renderPlots(state) {
  if (!state.Plotly || state.destroyed) return;
  // Queue Plotly mutations so rapid selection or theme changes stay coherent.
  state.renderQueue = state.renderQueue.catch(() => {}).then(async () => {
    if (state.destroyed) return;
    await Promise.all(state.panels.map(async panel => {
      const spec = plotSpec(state, panel);
      await state.Plotly.react(panel.plot, spec.data, spec.layout, {
        responsive: false, displayModeBar: false, scrollZoom: false, doubleClick: false,
      });
      if (!panel.initialized) {
        panel.initialized = true;
        panel.plot.on('plotly_click', event => {
          const model = event.points?.[0]?.customdata?.[0];
          if (!model) return;
          takeOver(state);
          state.model = state.model === model ? '' : model;
          state.family = '';
          syncControls(state);
          renderPlots(state);
        });
      }
    }));
    state.plotReady = true;
    storyFrame(state, state.introDone ? INTRO_MS : state.elapsed);
  });
  return state.renderQueue;
}

function updateTable(state) {
  state.tableBody.replaceChildren();
  [...state.rows].sort((a, b) => b.ship_rate - a.ship_rate || a.model.localeCompare(b.model)).forEach(row => {
    const tr = el('tr', '', state.tableBody);
    const name = el('th', '', tr, row.meta.short_label);
    name.scope = 'row';
    el('td', '', tr, row.meta.family);
    const sizes = el('td', '', tr, Number.isFinite(row.size) ? SIZE(row.size) : 'Undisclosed');
    if (row.meta.sources?.[0]?.url) {
      const link = el('a', 'vcbp-source', sizes, 'source');
      link.href = row.meta.sources[0].url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Parameter-count source for ${row.meta.short_label}`);
    }
    el('td', '', tr, row.meta.active_b ? SIZE(row.meta.active_b) : '—');
    el('td', '', tr, PCT(row.ship_rate));
    el('td', '', tr, `${row.ship_count} / ${row.expected}`);
  });
  const tasks = state.rows[0]?.tasks || 0;
  state.sample.textContent = `All ${tasks} tasks · ${state.rows.length} models · 3 independent trials per task`;
  state.tableCaption.textContent = 'All tasks · mini-swe-agent, solo, base. Pass rate is the fraction of all expected trials judged acceptable; missing and invalid deliveries remain in the denominator.';
  state.knownCount.textContent = `${state.rows.filter(row => Number.isFinite(row.size) && row.size > 0).length} models`;
  state.unknownCount.textContent = `${state.rows.filter(row => !Number.isFinite(row.size) || row.size <= 0).length} models`;
}

function syncControls(state) {
  state.familyButtons.forEach((node, key) => {
    node.setAttribute('aria-pressed', String(key === state.family));
    node.classList.toggle('vcbp-touring', state.touring && key === state.family);
    if (!(state.touring && key === state.family)) node.style.removeProperty('--vcbp-tour-progress');
  });
  state.modelSelect.value = state.model;
  state.stop.hidden = !state.touring && !state.introRunning;
  state.stop.textContent = state.introRunning ? 'Skip animation' : 'Stop tour';
  state.root.classList.toggle('vcbp-is-touring', state.touring);
  if (state.introRunning) state.status.textContent = 'Tracing the frontier among models with reported sizes…';
  else if (state.touring) state.status.textContent = `${state.family || 'All families'} · automatic tour · interact to stop`;
  else if (state.model) state.status.textContent = `${state.data.model_parameters.models[state.model].short_label} highlighted · choose All models to clear`;
  else if (state.family) state.status.textContent = `${state.family} highlighted · select again to clear`;
  else state.status.textContent = 'Hover or tap a point for details. Choose a family or model to highlight it.';
}

function takeOver(state, finishIntro = true) {
  state.userControlled = true;
  state.touring = false;
  state.tourElapsed = 0;
  if (finishIntro && state.introRunning) {
    state.introRunning = false;
    state.introDone = true;
    state.elapsed = INTRO_MS;
    storyFrame(state, INTRO_MS);
  }
  syncControls(state);
}

function rebuildStories(state) {
  state.colors = colors(state);
  state.panels.forEach(panel => buildStory(state, panel));
  storyFrame(state, state.introDone ? INTRO_MS : state.elapsed);
}

function advanceTour(state) {
  state.tourIndex = (state.tourIndex + 1) % (state.families.length + 1);
  state.family = state.tourIndex === state.families.length ? '' : state.families[state.tourIndex];
  state.model = '';
  syncControls(state);
  renderPlots(state);
}

function schedule(state) {
  if (state.raf || state.destroyed || !state.visible || document.hidden || state.reduce.matches) return;
  if (!state.introRunning && (state.userControlled || !state.plotReady)) return;
  state.lastFrame = 0;
  const step = now => {
    state.raf = 0;
    if (state.destroyed || !state.visible || document.hidden || state.reduce.matches) return;
    const dt = state.lastFrame ? Math.min(80, now - state.lastFrame) : 0;
    state.lastFrame = now;
    if (state.introRunning) {
      state.elapsed += dt;
      storyFrame(state, state.elapsed);
      if (state.elapsed >= INTRO_MS) {
        state.introRunning = false;
        state.introDone = true;
        state.tourElapsed = 0;
        syncControls(state);
      }
    } else if (!state.userControlled && state.plotReady) {
      state.tourElapsed += dt;
      if (!state.touring && state.tourElapsed >= TOUR_DELAY) {
        state.touring = true;
        state.tourElapsed = 0;
        state.tourIndex = -1;
        advanceTour(state);
      } else if (state.touring && state.tourElapsed >= TOUR_MS) {
        state.tourElapsed = 0;
        advanceTour(state);
      }
      if (state.touring) state.familyButtons.get(state.family)?.style.setProperty('--vcbp-tour-progress', `${state.tourElapsed / TOUR_MS * 100}%`);
    }
    if (state.introRunning || (!state.userControlled && state.plotReady)) state.raf = requestAnimationFrame(step);
  };
  state.raf = requestAnimationFrame(step);
}

async function start(state) {
  if (state.started || state.destroyed) return;
  state.started = true;
  rebuildStories(state);
  state.introRunning = !state.reduce.matches;
  state.introDone = state.reduce.matches;
  syncControls(state);
  schedule(state);
  try {
    state.Plotly = await window.__vcbLoadPlotly();
    await renderPlots(state);
    schedule(state);
  } catch (error) {
    state.introRunning = false;
    state.introDone = true;
    state.userControlled = true;
    storyFrame(state, INTRO_MS);
    state.status.textContent = 'Interactive chart unavailable. The figure and complete results table remain available below.';
    state.stop.hidden = true;
    state.table.open = true;
    console.error('Video-Cut-Bench performance chart:', error);
  }
}

/**
 * Mounts the component immediately; Plotly loads when it enters the viewport.
 * @param {HTMLElement} container Empty element owned by the article.
 * @param {object} data Unmodified reportData from the authored source report.
 * @returns {Promise<{destroy: Function, replay: Function}>} Optional lifecycle API.
 */
export async function mountPerformance(container, data) {
  if (!container || !data?.views?.all?.model_leaderboard || !data?.model_parameters?.models) {
    throw new Error('mountPerformance requires a container and the complete reportData.');
  }
  container.classList.add('vcb-performance');
  container.replaceChildren();
  const root = container;
  const state = {
    root, data, family: '', model: '', rows: rowsFor(data),
    families: [], panels: [], familyButtons: new Map(),
    reduce: matchMedia('(prefers-reduced-motion: reduce)'), visible: false, started: false,
    introRunning: false, introDone: false, elapsed: 0, tourElapsed: 0, tourIndex: -1,
    userControlled: false, touring: false, plotReady: false, raf: 0, destroyed: false,
    renderQueue: Promise.resolve(), measure: document.createElement('canvas').getContext('2d'),
  };
  state.families = FAMILY_ORDER.filter(family => state.rows.some(row => row.meta.family === family));
  state.colors = colors(state);
  const header = el('div', 'vcbp-header', root);
  const titles = el('div', '', header);
  el('p', 'vcbp-kicker', titles, 'Model capability');
  el('h3', 'vcbp-title', titles, 'One harness. Twenty-two models.');
  state.sample = el('p', 'vcbp-sample', titles);
  const actions = el('div', 'vcbp-actions', header);
  state.stop = button(actions, 'Skip animation', 'vcbp-stop');
  state.stop.hidden = true;
  const replay = button(actions, '↻ Replay', 'vcbp-replay');
  replay.setAttribute('aria-label', 'Replay the model performance animation');

  const axesLabel = el('div', 'vcbp-axis-label', root, 'PASS RATE (avg@3)');
  axesLabel.setAttribute('aria-hidden', 'true');
  const charts = el('div', 'vcbp-charts', root);
  for (const kind of ['known', 'unknown']) {
    const section = el('section', `vcbp-panel vcbp-panel-${kind}`, charts);
    const label = el('div', 'vcbp-panel-label', section);
    el('span', '', label, kind === 'known' ? 'Reported model sizes' : 'Undisclosed model sizes');
    const count = el('span', 'vcbp-panel-count', label);
    state[kind === 'known' ? 'knownCount' : 'unknownCount'] = count;
    const host = el('div', 'vcbp-host', section);
    const plot = el('div', 'vcbp-plot', host);
    plot.setAttribute('role', 'img');
    plot.setAttribute('aria-label', kind === 'known' ? 'Model pass rate by reported total parameters. See the accessible results table below for every value.' :
      'Model pass rates for models whose parameter counts are undisclosed. Horizontal positions indicate family, not size. See the accessible results table below.');
    const story = el('div', 'vcbp-story', host);
    state.panels.push({ kind, host, plot, story, initialized: false,
      families: ['Anthropic', 'OpenAI', 'Google', 'xAI / Cursor'].filter(family => state.rows.some(row => row.meta.family === family && !Number.isFinite(row.size))) });
  }

  const controls = el('div', 'vcbp-controls', root);
  const familyRow = el('div', 'vcbp-family-row', controls);
  familyRow.setAttribute('role', 'group');
  familyRow.setAttribute('aria-label', 'Highlight model family');
  const allFamilies = button(familyRow, 'All families', 'vcbp-family');
  state.familyButtons.set('', allFamilies);
  for (const family of state.families) {
    const node = button(familyRow, '', 'vcbp-family');
    const dot = el('span', 'vcbp-swatch', node);
    dot.style.background = familyColor(state, family);
    dot.setAttribute('aria-hidden', 'true');
    el('span', '', node, family);
    state.familyButtons.set(family, node);
  }
  state.familyButtons.forEach((node, family) => node.addEventListener('click', () => {
    takeOver(state);
    state.family = state.family === family ? '' : family;
    state.model = '';
    syncControls(state);
    rebuildStories(state);
    renderPlots(state);
  }));
  const bottom = el('div', 'vcbp-controls-bottom', controls);
  const selectLabel = el('label', 'vcbp-model-select-label', bottom, 'Model');
  state.modelSelect = el('select', 'vcbp-model-select', selectLabel);
  state.modelSelect.setAttribute('aria-label', 'Highlight an individual model');
  el('option', '', state.modelSelect, 'All models').value = '';
  for (const family of state.families) {
    const group = el('optgroup', '', state.modelSelect);
    group.label = family;
    state.rows.filter(row => row.meta.family === family).forEach(row => {
      el('option', '', group, row.meta.short_label).value = row.model;
    });
  }
  state.modelSelect.addEventListener('change', () => {
    const model = state.modelSelect.value;
    takeOver(state);
    state.model = model;
    state.family = '';
    syncControls(state);
    rebuildStories(state);
    renderPlots(state);
  });
  state.status = el('p', 'vcbp-status', bottom);
  // Tour updates intentionally do not cause repeated live announcements.
  el('p', 'vcbp-note', root,
    'Each point uses mini-swe-agent, one agent and no Video-Cutting Skills. The line follows the empirical frontier for reported total parameter counts. Undisclosed models share the same vertical scale; their horizontal positions identify families and imply no parameter count.');
  state.table = el('details', 'vcbp-data', root);
  el('summary', '', state.table, 'Explore all 22 results and parameter sources');
  const tableWrap = el('div', 'vcbp-table-wrap', state.table);
  tableWrap.tabIndex = 0;
  tableWrap.setAttribute('role', 'region');
  tableWrap.setAttribute('aria-label', 'Scrollable model performance results table');
  const table = el('table', '', tableWrap);
  state.tableCaption = el('caption', '', table);
  const head = el('tr', '', el('thead', '', table));
  ['Model', 'Family', 'Total parameters', 'Active parameters', 'Pass rate', 'Successful trials'].forEach(text => {
    const cell = el('th', '', head, text); cell.scope = 'col';
  });
  state.tableBody = el('tbody', '', table);
  updateTable(state);
  syncControls(state);
  rebuildStories(state);

  const replayStory = () => {
    state.userControlled = false;
    state.touring = false;
    state.tourElapsed = 0;
    state.family = '';
    state.model = '';
    state.elapsed = 0;
    state.introRunning = !state.reduce.matches;
    state.introDone = state.reduce.matches;
    rebuildStories(state);
    syncControls(state);
    renderPlots(state);
    schedule(state);
  };
  replay.addEventListener('click', replayStory);
  state.stop.addEventListener('click', () => takeOver(state));
  const onPointer = event => { if (event.target !== replay) takeOver(state); };
  const onKey = event => { if (['Tab', 'Enter', ' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(event.key)) takeOver(state); };
  root.addEventListener('pointerdown', onPointer, { passive: true });
  root.addEventListener('keydown', onKey);
  const onVisibility = () => {
    if (document.hidden && state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
    if (!document.hidden) schedule(state);
  };
  document.addEventListener('visibilitychange', onVisibility);
  const onTheme = () => {
    rebuildStories(state);
    state.familyButtons.forEach((node, family) => {
      const swatch = node.querySelector('.vcbp-swatch');
      if (swatch) swatch.style.background = familyColor(state, family);
    });
    renderPlots(state);
  };
  document.addEventListener('vcb:themechange', onTheme);
  const onMotion = () => {
    if (state.reduce.matches) {
      takeOver(state);
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      storyFrame(state, INTRO_MS);
    }
  };
  state.reduce.addEventListener('change', onMotion);
  const observer = new IntersectionObserver(entries => {
    state.visible = entries[0].isIntersecting;
    if (state.visible) { start(state); schedule(state); }
    else if (state.raf) { cancelAnimationFrame(state.raf); state.raf = 0; }
  }, { threshold: 0.12 });
  observer.observe(charts);
  let resizeTimer;
  let previousWidth = Math.round(root.clientWidth);
  const resizeObserver = new ResizeObserver(() => {
    const width = Math.round(root.clientWidth);
    if (width === previousWidth) return;
    previousWidth = width;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { rebuildStories(state); renderPlots(state); }, 120);
  });
  resizeObserver.observe(root);
  return {
    replay: replayStory,
    destroy() {
      state.destroyed = true;
      if (state.raf) cancelAnimationFrame(state.raf);
      clearTimeout(resizeTimer);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('vcb:themechange', onTheme);
      state.reduce.removeEventListener('change', onMotion);
      root.removeEventListener('pointerdown', onPointer);
      root.removeEventListener('keydown', onKey);
      state.panels.forEach(panel => { if (panel.initialized) state.Plotly.purge(panel.plot); });
      root.replaceChildren();
    },
  };
}
