const ASSET = new URL('./', import.meta.url);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

// Use the same stored preference as the personal homepage.
const themeButton = document.getElementById('vcb-theme');
function syncTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  themeButton?.setAttribute('aria-label', `Switch to ${dark ? 'light' : 'dark'} theme`);
  themeButton?.setAttribute('aria-pressed', String(dark));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#101110' : '#ffffff');
}
themeButton?.addEventListener('click', () => {
  const mode = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = mode;
  try { localStorage.setItem('theme', mode); } catch (_) { /* Storage can be disabled. */ }
  syncTheme();
  document.dispatchEvent(new CustomEvent('vcb:themechange', { detail: { theme: mode } }));
});
addEventListener('storage', (event) => {
  if (event.key !== 'theme') return;
  document.documentElement.dataset.theme = event.newValue === 'dark' ? 'dark' : 'light';
  syncTheme();
  document.dispatchEvent(new CustomEvent('vcb:themechange'));
});
syncTheme();

let plotlyPromise;
window.__vcbLoadPlotly = () => {
  if (window.Plotly) return Promise.resolve(window.Plotly);
  if (!plotlyPromise) plotlyPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../../vendor/plotly-3.7.0.min.js', import.meta.url).href;
    script.async = true;
    script.onload = () => window.Plotly ? resolve(window.Plotly) : reject(new Error('Chart library unavailable'));
    script.onerror = () => reject(new Error('Chart library unavailable'));
    document.head.append(script);
  });
  return plotlyPromise;
};

function makeButton(label, action) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'vcb-control'; button.textContent = label;
  button.addEventListener('click', action);
  return button;
}

function mountTask(container) {
  container.innerHTML = `<div class="vcb-card-head"><span class="vcb-card-title">From an editing request to a finished clip</span><div class="vcb-controls"></div></div>
    <div class="vcb-task">
      <p class="vcb-task-request">“Keep only these lines. Make the transitions feel natural.”</p>
      <div class="vcb-task-grid">
        <section class="vcb-task-panel"><h3>Source clip</h3><small>Five dialogue lines · three kept</small><ul><li>Have you seen the lion?</li><li>It escaped from the zoo.</li><li class="is-dropped">Oh no!</li><li class="is-dropped">Where is it?</li><li>I haven't seen it.</li></ul></section>
        <span class="vcb-task-arrow" aria-hidden="true">→</span>
        <section class="vcb-task-panel"><h3>Coding agent</h3><small>Source files, transcript and a terminal</small><p>Locate the requested lines.<br>Choose frame-accurate boundaries.<br>Render with tools such as <code>ffmpeg</code>.<br>Inspect the finished edit.</p></section>
        <span class="vcb-task-arrow" aria-hidden="true">→</span>
        <section class="vcb-task-panel"><h3>Edited clip</h3><small>Two segments · one new join</small><ul><li>Have you seen the lion?</li><li>It escaped from the zoo.</li></ul><div class="vcb-task-join">New join</div><ul><li>I haven't seen it.</li></ul></section>
      </div>
      <div class="vcb-task-status" aria-live="polite"></div>
    </div>`;
  const panels = [...container.querySelectorAll('.vcb-task-panel')];
  const controls = container.querySelector('.vcb-controls');
  const status = container.querySelector('.vcb-task-status');
  const notes = ['The instruction specifies which dialogue to retain.', 'The agent chooses the cut boundaries and executes the edit.', 'Adjacent kept lines stay together. One new join needs review.'];
  let elapsed = 0, previous = null, frameId = null, visible = false, started = false, running = false, renderedStep = -1;
  function stopFrame() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null; previous = null;
  }
  function schedule() {
    if (running && visible && !document.hidden && frameId === null) frameId = requestAnimationFrame(frame);
    else if (!running || !visible || document.hidden) stopFrame();
  }
  const pause = makeButton('Pause', () => {
    running = !running;
    pause.textContent = running ? 'Pause' : 'Play';
    if (running) started = true;
    schedule();
  });
  const replay = makeButton('Replay', () => {
    stopFrame(); elapsed = 0; started = true; renderedStep = -1;
    running = !reduceMotion.matches; pause.textContent = 'Pause'; pause.disabled = false;
    render(reduceMotion.matches ? 2 : 0);
    schedule();
  });
  controls.append(pause, replay);
  function render(step) {
    if (step === renderedStep) return;
    renderedStep = step;
    panels.forEach((panel, index) => { panel.classList.toggle('is-shown', index <= step); panel.classList.toggle('is-current', index === step && step < 2); });
    status.textContent = notes[step];
  }
  function frame(now) {
    frameId = null;
    if (!running) return;
    if (previous !== null && visible && !document.hidden) elapsed += Math.min(80, now - previous);
    previous = now;
    render(Math.min(2, Math.floor(elapsed / 1300)));
    if (elapsed >= 3900) { running = false; pause.disabled = true; pause.textContent = 'Complete'; return; }
    schedule();
  }
  render(reduceMotion.matches ? 2 : 0);
  pause.hidden = reduceMotion.matches;
  replay.hidden = reduceMotion.matches;
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (visible && !started && !reduceMotion.matches) { started = true; running = true; }
    schedule();
  }, { threshold: .25 });
  observer.observe(container);
  document.addEventListener('visibilitychange', schedule);
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) { running = false; stopFrame(); render(2); }
    pause.hidden = replay.hidden = reduceMotion.matches;
  });
}

function mountSeam(container) {
  const head = document.createElement('div'); head.className = 'vcb-card-head';
  const title = document.createElement('span'); title.className = 'vcb-card-title'; title.textContent = 'The same content, with a different join';
  const controls = document.createElement('div'); controls.className = 'vcb-controls';
  const video = document.createElement('video');
  video.className = 'vcb-seam-video'; video.controls = true; video.muted = true; video.playsInline = true; video.preload = 'metadata';
  video.poster = new URL('media/seam-static.webp', ASSET).href;
  video.src = new URL('media/seam-comparison.mp4', ASSET).href;
  video.setAttribute('aria-label', 'Silent, slowed comparison. Render A briefly shows three frames of the previous shot, while Render B starts directly on the next shot.');
  video.textContent = 'Render A includes three frames of the previous shot. Render B starts on the shot change.';
  const replay = makeButton('Replay', () => { video.currentTime = 0; video.play().catch(() => {}); });
  controls.append(replay); head.append(title, controls);
  const player = document.createElement('div'); player.className = 'vcb-seam-player'; player.append(video);
  const note = document.createElement('div'); note.className = 'vcb-seam-note';
  note.innerHTML = '<span>3 frames · 0.12 seconds in the source</span><span>Slowed for inspection · no audio</span>';
  container.append(head, player, note);
  let hasPlayed = false;
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) video.pause();
    else if (!hasPlayed && !reduceMotion.matches) { hasPlayed = true; video.play().catch(() => {}); }
  }, { threshold: .5 });
  observer.observe(container);
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) video.pause(); });
}

function fallback(container, kind) {
  container.replaceChildren();
  const img = new Image(); img.src = new URL(`media/${kind}-static.webp`, ASSET).href;
  img.alt = container.closest('figure')?.querySelector('figcaption')?.textContent || `${kind} research figure`;
  img.className = 'vcb-fallback'; container.append(img); container.dataset.vcbState = 'fallback';
}

async function main() {
  const figures = [...document.querySelectorAll('[data-vcb-figure]')];
  const task = figures.find(el => el.dataset.vcbFigure === 'task');
  const seam = figures.find(el => el.dataset.vcbFigure === 'seam');
  if (task) { mountTask(task); task.dataset.vcbState = 'ready'; }
  if (seam) { mountSeam(seam); seam.dataset.vcbState = 'ready'; }
  try {
    const response = await fetch(new URL('data/results.json', ASSET));
    if (!response.ok) throw new Error('Research data unavailable');
    const data = await response.json();
    const [{ mountPerformance }, { mountEvidence }] = await Promise.all([import('./performance.js'), import('./evidence.js')]);
    await Promise.all(figures.filter(el => !['task', 'seam'].includes(el.dataset.vcbFigure)).map(async (container) => {
      const kind = container.dataset.vcbFigure;
      try {
        if (kind === 'performance') await mountPerformance(container, data);
        else mountEvidence(container, kind, data);
        container.dataset.vcbState = 'ready';
      } catch (error) { console.error(`Could not enhance ${kind} figure`, error); fallback(container, kind); }
    }));
  } catch (error) {
    console.error('Could not load interactive figures', error);
    figures.filter(el => !el.dataset.vcbState).forEach(el => fallback(el, el.dataset.vcbFigure));
  }
  document.documentElement.dataset.vcbReady = 'true';
}
main();
