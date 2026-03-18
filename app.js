/* ============================================================
   app.js — HBS GenAI Strategy Presentation
   Loads content.json, renders slides, handles nav & PDF export
   ============================================================ */

'use strict';

// ── State ──────────────────────────────────────────────────
let slides = [];
let current = 0;
let isAnimating = false;

// ── DOM refs ───────────────────────────────────────────────
const deck        = document.getElementById('deck');
const prevBtn     = document.getElementById('prevBtn');
const nextBtn     = document.getElementById('nextBtn');
const counter     = document.getElementById('slide-counter');
const progressBar = document.getElementById('progress-bar');
const keyHint     = document.getElementById('key-hint');
const navbar      = document.getElementById('navbar');
const exportBtn   = document.getElementById('exportPdfBtn');

// ── Bootstrap ──────────────────────────────────────────────
async function init() {
  try {
    const resp = await fetch('content.json');
    const data = await resp.json();
    slides = data.slides;
    renderAllSlides();
    setupNavbar();
    setupKeyboard();
    setupPdfExport();
    goTo(0, false);
    // Hide hint after 4 s
    setTimeout(() => { keyHint.style.opacity = '0'; }, 4000);
  } catch (e) {
    deck.innerHTML = `<div style="color:#c84a4a;padding:40px;font-family:monospace">
      Error loading content.json: ${e.message}</div>`;
  }
}

// ── Navbar height → CSS var ────────────────────────────────
function setupNavbar() {
  function setOffset() {
    const h = navbar.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--topOffset', h + 'px');
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }
  setOffset();
  window.addEventListener('resize', setOffset);
}

// ── Render ─────────────────────────────────────────────────
function renderAllSlides() {
  deck.innerHTML = '';
  slides.forEach((slide, i) => {
    const el = buildSlide(slide, i);
    deck.appendChild(el);
  });
}

function buildSlide(slide, index) {
  const el = document.createElement('div');
  el.className = `slide slide-type-${slide.type}`;
  el.dataset.index = index;
  el.setAttribute('role', 'region');
  el.setAttribute('aria-label', `Slide ${index + 1}`);

  const bg   = buildBg(slide.type);
  const body = document.createElement('div');
  body.className = 'slide-content';
  body.innerHTML = buildSlideHTML(slide, index);

  const badge = document.createElement('div');
  badge.className = 'slide-badge';
  badge.textContent = `${String(index + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;

  el.appendChild(bg);
  el.appendChild(body);
  el.appendChild(badge);
  return el;
}

function buildBg(type) {
  const bg = document.createElement('div');
  bg.className = 'slide-bg';
  const configs = {
    title:        [['orb orb-1'], ['orb orb-2']],
    section:      [['orb orb-1']],
    content:      [['orb orb-1']],
    beforeAfter:  [['orb orb-1'], ['orb orb-2']],
    closing:      [['orb orb-1']],
  };
  (configs[type] || []).forEach(([cls]) => {
    const d = document.createElement('div');
    d.className = cls;
    bg.appendChild(d);
  });
  return bg;
}

function buildSlideHTML(slide, index) {
  switch (slide.type) {
    case 'title':       return buildTitle(slide);
    case 'section':     return buildSection(slide, index);
    case 'content':     return buildContent(slide);
    case 'beforeAfter': return buildBeforeAfter(slide);
    case 'closing':     return buildClosing(slide);
    default:            return `<p>${slide.headline || ''}</p>`;
  }
}

// ── Title ──
function buildTitle(s) {
  return `
    <div data-animate="1" class="title-eyebrow">Harvard Business School · Strategy &amp; Technology II</div>
    <h1 data-animate="2" class="title-headline grad">${esc(s.headline)}</h1>
    ${s.subheadline ? `<p data-animate="3" class="title-sub">${esc(s.subheadline)}</p>` : ''}
    ${s.note        ? `<p data-animate="4" class="title-note">${esc(s.note)}</p>` : ''}
    <div class="title-decoration" aria-hidden="true">
      <div class="deco-line" style="width:200px"></div>
      <div class="deco-line" style="width:120px"></div>
      <div class="deco-line" style="width:160px"></div>
    </div>`;
}

// ── Section ──
function buildSection(s, i) {
  return `
    <div class="section-number" aria-hidden="true">${String(i + 1).padStart(2,'0')}</div>
    <div data-animate="1" class="section-divider"></div>
    <h2 data-animate="2" class="section-headline">${esc(s.headline)}</h2>
    ${s.subheadline ? `<p data-animate="3" class="section-sub">${esc(s.subheadline)}</p>` : ''}`;
}

// ── Content ──
function buildContent(s) {
  const bullets = (s.bullets || []).map((b, i) => {
    const [label, rest] = splitBullet(b);
    return `<li class="bullet-item" data-animate="${i + 3}">
      <span class="bullet-icon" aria-hidden="true">${String(i + 1).padStart(2,'0')}</span>
      <span class="bullet-text">${label ? `<strong>${esc(label)}</strong> ${esc(rest)}` : esc(b)}</span>
    </li>`;
  }).join('');

  return `
    <div class="content-layout">
      <div class="content-left">
        <h2 data-animate="1" class="content-headline">${esc(s.headline)}</h2>
        ${s.subheadline ? `<p data-animate="2" class="content-sub">${esc(s.subheadline)}</p>` : ''}
        ${s.note ? `<div data-animate="${(s.bullets||[]).length + 4}" class="content-note">${esc(s.note)}</div>` : ''}
      </div>
      <ul class="bullets-list" role="list">${bullets}</ul>
    </div>`;
}

// ── Before/After ──
function buildBeforeAfter(s) {
  const left = s.left || {};
  const right = s.right || {};

  const leftBullets  = (left.bullets  || []).map((b,i) => `<div class="ba-bullet" data-animate="${i+3}">${esc(b)}</div>`).join('');
  const rightBullets = (right.bullets || []).map((b,i) => `<div class="ba-bullet" data-animate="${i+3}">${esc(b)}</div>`).join('');

  return `
    <h2 data-animate="1" class="ba-headline">${esc(s.headline)}</h2>
    <div class="ba-columns">
      <div class="ba-col myth" data-animate="2">
        <div class="ba-col-title">${esc(left.title || 'Before')}</div>
        ${leftBullets}
      </div>
      <div class="ba-col reality" data-animate="2">
        <div class="ba-col-title">${esc(right.title || 'After')}</div>
        ${rightBullets}
      </div>
    </div>`;
}

// ── Closing ──
function buildClosing(s) {
  return `
    <div class="closing-layout">
      <div data-animate="1" class="closing-label">Key Takeaway</div>
      <h2 data-animate="2" class="closing-headline grad">${esc(s.headline)}</h2>
      ${s.subheadline ? `<blockquote data-animate="3" class="closing-quote">${esc(s.subheadline)}</blockquote>` : ''}
      ${s.note        ? `<p data-animate="4" class="closing-contact">${esc(s.note)}</p>` : ''}
    </div>`;
}

// ── Helpers ──
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function splitBullet(b) {
  const colonIdx = b.indexOf(':');
  if (colonIdx > 0 && colonIdx < 40) {
    return [b.slice(0, colonIdx), b.slice(colonIdx + 1).trim()];
  }
  const dashIdx = b.indexOf(' — ');
  if (dashIdx > 0 && dashIdx < 40) {
    return [b.slice(0, dashIdx), b.slice(dashIdx + 3)];
  }
  return ['', b];
}

// ── Navigation ─────────────────────────────────────────────
function goTo(idx, animate = true) {
  if (isAnimating) return;
  const prev = current;
  current = Math.max(0, Math.min(idx, slides.length - 1));

  const allSlides = deck.querySelectorAll('.slide');

  if (!animate) {
    allSlides.forEach((s, i) => {
      s.classList.toggle('active', i === current);
      s.classList.toggle('is-active', false);
    });
    const cur = allSlides[current];
    if (cur) {
      cur.classList.add('active');
      // Small delay so CSS transition triggers
      requestAnimationFrame(() => {
        requestAnimationFrame(() => cur.classList.add('is-active'));
      });
    }
  } else {
    const dir = idx > prev ? 1 : -1;
    const prevEl = allSlides[prev];
    const nextEl = allSlides[current];

    if (!nextEl) return;
    isAnimating = true;

    // Remove is-active on prev
    if (prevEl) {
      prevEl.classList.remove('is-active');
      prevEl.classList.add(dir > 0 ? 'slide-out-left' : 'slide-out-right');
    }

    nextEl.style.opacity = '1';
    nextEl.classList.add('active');
    nextEl.classList.add(dir > 0 ? 'slide-in-right' : 'slide-in-left');

    setTimeout(() => {
      if (prevEl) {
        prevEl.classList.remove('active','slide-out-left','slide-out-right');
        prevEl.style.opacity = '';
      }
      nextEl.classList.remove('slide-in-right','slide-in-left');
      nextEl.classList.add('is-active');
      isAnimating = false;
    }, 420);
  }

  updateUI();
}

function updateUI() {
  const total = slides.length;
  counter.textContent = `${current + 1} / ${total}`;
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === total - 1;
  const pct = total > 1 ? (current / (total - 1)) * 100 : 100;
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', Math.round(pct));
}

prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));

function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(slides.length - 1);
    }
  });
}

// Touch swipe
let touchStartX = 0;
deck.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
deck.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) goTo(dx < 0 ? current + 1 : current - 1);
}, { passive: true });

// ── PDF Export ─────────────────────────────────────────────
function setupPdfExport() {
  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    exportBtn.textContent = 'Loading libs…';

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    } catch {
      alert('PDF export requires access to cdnjs.cloudflare.com. Please allow it or self-host html2canvas and jsPDF.');
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export PDF';
      return;
    }

    exportBtn.textContent = 'Exporting…';
    document.body.classList.add('exportingPdf');

    // Force all slides visible for capture
    const allSlides = deck.querySelectorAll('.slide');
    allSlides.forEach(s => s.classList.add('is-active'));

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

    for (let i = 0; i < slides.length; i++) {
      exportBtn.textContent = `Exporting ${i + 1}/${slides.length}…`;

      // Build a stage
      const stage = document.createElement('div');
      stage.id = 'pdfStage';
      document.body.appendChild(stage);

      // Background
      const bgEl = document.createElement('div');
      bgEl.style.cssText = 'position:absolute;inset:0;background:#06080f;';
      stage.appendChild(bgEl);

      // Clone slide
      const slideEl = allSlides[i];
      const clone = slideEl.cloneNode(true);
      clone.style.cssText = `
        position:absolute; top:0; left:0;
        width:1920px; height:1080px;
        padding:90px 96px;
        opacity:1;
        pointer-events:none;
      `;
      clone.classList.add('active','is-active');
      // Force all animated children
      clone.querySelectorAll('[data-animate]').forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = 'none';
        el.style.transition = 'none';
      });
      // Fix gradient-clipped text
      clone.querySelectorAll('.grad').forEach(el => {
        el.style.background = 'none';
        el.style.webkitBackgroundClip = 'initial';
        el.style.backgroundClip = 'initial';
        el.style.color = 'rgba(255,255,255,0.92)';
        el.style.webkitTextFillColor = 'rgba(255,255,255,0.92)';
      });

      stage.appendChild(clone);

      try {
        const canvas = await html2canvas(stage, {
          backgroundColor: '#06080f',
          scale: 2,
          useCORS: true,
          logging: false,
          width: 1920,
          height: 1080,
        });
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(imgData, 'PNG', 0, 0, 1920, 1080);
      } catch (err) {
        console.error(`Slide ${i+1} capture failed:`, err);
      }

      document.body.removeChild(stage);
    }

    pdf.save('HBS_GenAI_Strategy.pdf');

    // Cleanup
    document.body.classList.remove('exportingPdf');
    allSlides.forEach(s => s.classList.remove('is-active'));
    // Re-activate current
    const cur = allSlides[current];
    if (cur) cur.classList.add('is-active');

    exportBtn.disabled = false;
    exportBtn.textContent = 'Export PDF';
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ── Start ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
