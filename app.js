/* ============================================================
   app.js — HBS GenAI Strategy Presentation
   ============================================================ */
'use strict';

let slides = [];
let current = 0;
let isAnimating = false;

const deck        = document.getElementById('deck');
const prevBtn     = document.getElementById('prevBtn');
const nextBtn     = document.getElementById('nextBtn');
const counter     = document.getElementById('slide-counter');
const progressBar = document.getElementById('progress-bar');
const dotNav      = document.getElementById('dot-nav');
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
    buildDotNav();
    setupNavbar();
    setupKeyboard();
    setupPdfExport();
    goTo(0, false);
    setTimeout(() => { keyHint.style.opacity = '0'; }, 4000);
  } catch (e) {
    deck.innerHTML = `<div style="color:#c84a4a;padding:40px;font-family:monospace">
      Error loading content.json: ${e.message}</div>`;
  }
}

// ── Navbar offset ──────────────────────────────────────────
function setupNavbar() {
  function setOffset() {
    const h = navbar.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--topOffset', h + 'px');
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }
  setOffset();
  window.addEventListener('resize', setOffset);
}

// ── Dot nav ────────────────────────────────────────────────
function buildDotNav() {
  dotNav.innerHTML = '';
  slides.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'dot-nav-item';
    btn.setAttribute('aria-label', `Go to slide ${i + 1}`);
    btn.setAttribute('title', s.headline || `Slide ${i + 1}`);
    btn.addEventListener('click', () => goTo(i));
    dotNav.appendChild(btn);
  });
}

function updateDotNav() {
  dotNav.querySelectorAll('.dot-nav-item').forEach((btn, i) => {
    btn.classList.toggle('active', i === current);
  });
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
  el.setAttribute('aria-label', `Slide ${index + 1}: ${slide.headline || ''}`);

  el.appendChild(buildBg(slide.type));

  const body = document.createElement('div');
  body.className = 'slide-content';
  body.innerHTML = buildSlideHTML(slide, index);
  el.appendChild(body);

  const badge = document.createElement('div');
  badge.className = 'slide-badge';
  badge.textContent = `${String(index + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
  el.appendChild(badge);

  return el;
}

function buildBg(type) {
  const bg = document.createElement('div');
  bg.className = 'slide-bg';
  const counts = { title: 2, section: 1, content: 1, beforeAfter: 2, closing: 1 };
  for (let i = 1; i <= (counts[type] || 1); i++) {
    const d = document.createElement('div');
    d.className = `orb orb-${i}`;
    bg.appendChild(d);
  }
  return bg;
}

function buildSlideHTML(slide, index) {
  switch (slide.type) {
    case 'title':       return buildTitle(slide);
    case 'section':     return buildSection(slide, index);
    case 'content':     return buildContent(slide, index);
    case 'beforeAfter': return buildBeforeAfter(slide);
    case 'closing':     return buildClosing(slide);
    default:            return `<p>${esc(slide.headline)}</p>`;
  }
}

// ── Helpers ────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function splitLabel(b) {
  const c = b.indexOf(':');
  if (c > 0 && c < 42) return [b.slice(0, c).trim(), b.slice(c + 1).trim()];
  const d = b.indexOf(' — ');
  if (d > 0 && d < 42) return [b.slice(0, d).trim(), b.slice(d + 3).trim()];
  return ['', b];
}

// ── Title slide ────────────────────────────────────────────
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

// ── Section slide ──────────────────────────────────────────
function buildSection(s, i) {
  return `
    <div class="section-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</div>
    <div data-animate="1" class="section-divider"></div>
    <h2 data-animate="2" class="section-headline">${esc(s.headline)}</h2>
    ${s.subheadline ? `<p data-animate="3" class="section-sub">${esc(s.subheadline)}</p>` : ''}`;
}

// ── Content slide — dispatch to rich element per slide ─────
function buildContent(s, slideIndex) {
  // Slide 9 (index 9) = Implementation Modes → full-width 3-col layout
  if (slideIndex === 9) {
    return `
      <div style="display:flex;flex-direction:column;gap:22px;height:100%;justify-content:center;">
        <div>
          <h2 data-animate="1" class="content-headline">${esc(s.headline)}</h2>
          ${s.subheadline ? `<p data-animate="2" class="content-sub" style="margin-top:10px;">${esc(s.subheadline)}</p>` : ''}
        </div>
        ${buildImplCards()}
      </div>`;
  }

  let rightHtml = '';
  if      (slideIndex === 2)  rightHtml = buildTimeline();
  else if (slideIndex === 4)  rightHtml = buildFlowSteps(s.bullets || [], ['⊂','⊃','⊆','⊇']);
  else if (slideIndex === 5)  rightHtml = buildFeatureCards(s.bullets || []);
  else if (slideIndex === 7)  rightHtml = buildMatrix();
  else if (slideIndex === 8)  rightHtml = buildThreatCards(s.bullets || []);
  else if (slideIndex === 10) rightHtml = buildFlowSteps(s.bullets || [], ['1','2','3','4']);
  else if (slideIndex === 11) rightHtml = buildTakeaways();
  else                         rightHtml = buildBulletCards(s.bullets || []);

  return `
    <div class="content-layout">
      <div class="content-left">
        <h2 data-animate="1" class="content-headline">${esc(s.headline)}</h2>
        ${s.subheadline ? `<p data-animate="2" class="content-sub">${esc(s.subheadline)}</p>` : ''}
        ${s.note ? `<div data-animate="9" class="content-note">${esc(s.note)}</div>` : ''}
      </div>
      <div class="content-right">${rightHtml}</div>
    </div>`;
}

// ── Rich elements ──────────────────────────────────────────

function buildBulletCards(bullets) {
  return `<ul class="bullets-list" role="list">${
    bullets.map((b, i) => {
      const [lbl, rest] = splitLabel(b);
      return `<li class="bullet-item" data-animate="${i + 3}">
        <span class="bullet-icon" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="bullet-body">
          ${lbl ? `<span class="bullet-label">${esc(lbl)}</span>` : ''}
          <span class="bullet-text">${esc(rest || b)}</span>
        </div>
      </li>`;
    }).join('')
  }</ul>`;
}

function buildTimeline() {
  const eras = [
    { year: '1970s', title: 'Mini-Mainframe',   text: 'IBM dominates enterprise computing' },
    { year: '1980s', title: 'Personal Computer', text: 'Microsoft & Apple emerge as platform giants' },
    { year: '1990s', title: 'Internet',          text: 'Google, Amazon, Yahoo reshape commerce' },
    { year: '2000s', title: 'Mobile + Social',   text: 'Apple, Facebook, Twitter reshape society' },
    { year: '2020s', title: 'AI?',               text: 'Profit redistribution already underway' },
  ];
  return `<div class="timeline">${
    eras.map((e, i) => `
      <div class="timeline-item" data-animate="${i + 3}">
        <span class="timeline-year">${e.year}</span>
        <div>
          <div class="timeline-content-title">${esc(e.title)}</div>
          <div class="timeline-content-text">${esc(e.text)}</div>
        </div>
      </div>`).join('')
  }</div>`;
}

function buildFlowSteps(bullets, icons) {
  return `<div class="flow-steps">${
    bullets.map((b, i) => {
      const [lbl, rest] = splitLabel(b);
      return `<div class="flow-step" data-animate="${i + 3}">
        <div class="flow-step-dot">${icons ? (icons[i] || String(i + 1)) : String(i + 1)}</div>
        <div class="flow-step-text">
          ${lbl ? `<strong>${esc(lbl)}</strong>` : ''}
          ${esc(rest || b)}
        </div>
      </div>`;
    }).join('')
  }</div>`;
}

function buildFeatureCards(bullets) {
  const colors = ['var(--accent2)', 'var(--accent)'];
  const icons  = ['⇡', '⇣'];
  return `<div style="display:flex;flex-direction:column;gap:14px;">${
    bullets.map((b, i) => {
      const [lbl, rest] = splitLabel(b);
      const col = colors[i % colors.length];
      return `<div class="bullet-item" data-animate="${i + 3}"
        style="border-color:${col}33;border-left:3px solid ${col};">
        <span class="bullet-icon" style="background:${col}18;color:${col};font-size:20px;border-right-color:${col}22;" aria-hidden="true">${icons[i] || ''}</span>
        <div class="bullet-body">
          ${lbl ? `<span class="bullet-label" style="color:${col}">${esc(lbl)}</span>` : ''}
          <span class="bullet-text">${esc(rest || b)}</span>
        </div>
      </div>`;
    }).join('')
  }</div>`;
}

function buildMatrix() {
  const cells = [
    { cls: 'quadrant-a', badge: 'No Regrets',        title: 'AI Agent',        sub: 'Explicit data · Low error cost. AI does it all — no human in the loop.' },
    { cls: 'quadrant-b', badge: 'Quality Control',   title: 'Specialist + AI', sub: 'Explicit data · High error cost. AI produces, specialist verifies.' },
    { cls: 'quadrant-c', badge: 'Creative Catalyst', title: 'Generalist + AI', sub: 'Tacit knowledge · Low error cost. AI creates options, human selects.' },
    { cls: 'quadrant-d', badge: 'Human First',       title: 'Expert Leads',    sub: 'Tacit knowledge · High error cost. Human does the heavy lifting.' },
  ];
  return `<div class="matrix-grid">${
    cells.map((c, i) => `
      <div class="matrix-cell ${c.cls}" data-animate="${i + 3}">
        <span class="matrix-cell-badge">${c.badge}</span>
        <div class="matrix-cell-title">${c.title}</div>
        <div class="matrix-cell-sub">${c.sub}</div>
      </div>`).join('')
  }</div>`;
}

function buildThreatCards(bullets) {
  const cols = ['var(--red)', 'var(--accent)', 'var(--accent2)', 'var(--red)', 'var(--accent)'];
  return `<ul class="bullets-list" role="list">${
    bullets.map((b, i) => {
      const [lbl, rest] = splitLabel(b);
      const col = cols[i % cols.length];
      return `<li class="bullet-item" data-animate="${i + 3}" style="border-left:3px solid ${col};">
        <span class="bullet-icon" style="background:${col}18;color:${col};border-right-color:${col}22;" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <div class="bullet-body">
          ${lbl ? `<span class="bullet-label" style="color:${col}">${esc(lbl)}</span>` : ''}
          <span class="bullet-text">${esc(rest || b)}</span>
        </div>
      </li>`;
    }).join('')
  }</ul>`;
}

function buildTakeaways() {
  const items = [
    ['Anticipate the Curve',     'Gen AI will keep improving — tracking the trajectory is a core leadership responsibility.'],
    ['Access Is Being Rewritten','Natural language changes who can operate specialized software, not just power users.'],
    ['Adopt Even When Imperfect','Cost savings can justify AI adoption even when outputs fall short of human quality.'],
    ['Prepare to Self-Disrupt',  'Generic AI lowers barriers to entry — leaders must take calculated risks before rivals do.'],
    ['Two Essential Questions',  'Where is the data in your org? What structure does your organisation need to become?'],
  ];
  return `<div class="takeaway-list">${
    items.map((p, i) => `
      <div class="takeaway-item" data-animate="${i + 3}">
        <div class="takeaway-num">${i + 1}</div>
        <div class="takeaway-body">
          <div class="takeaway-title">${esc(p[0])}</div>
          <div class="takeaway-desc">${esc(p[1])}</div>
        </div>
      </div>`).join('')
  }</div>`;
}

function buildImplCards() {
  const cards = [
    {
      icon: '🔬', title: 'Customize Model',
      body: 'Fine-tune a foundation model on your proprietary data. Maximum control and company-specific intelligence.',
      tags: ['BloombergGPT example', 'Company-Specific', 'Highest Control'],
    },
    {
      icon: '🔌', title: 'Integrate APIs',
      body: 'Pipe foundation models into your product via API. Balanced customization with managed infrastructure.',
      tags: ['OpenAI API example', 'Team-Wide', 'Flexible'],
    },
    {
      icon: '📦', title: 'Purchase Applications',
      body: 'Buy vertical AI tools purpose-built for a business function. Fastest time-to-value for individual users.',
      tags: ['Harvey Legal example', 'Individual Users', 'Fastest Deploy'],
    },
  ];
  return `<div class="impl-grid">${
    cards.map((c, i) => `
      <div class="impl-card" data-animate="${i + 3}">
        <div class="impl-card-header">
          <div class="impl-card-icon">${c.icon}</div>
          <div class="impl-card-title">${c.title}</div>
        </div>
        <div class="impl-card-body">${c.body}</div>
        <div class="impl-card-meta">${c.tags.map(t => `<span class="impl-tag">${esc(t)}</span>`).join('')}</div>
      </div>`).join('')
  }</div>`;
}

// ── Before/After slide ─────────────────────────────────────
function buildBeforeAfter(s) {
  const left  = s.left  || {};
  const right = s.right || {};
  const lbullets = (left.bullets  || []).map((b, i) => `<div class="ba-bullet" data-animate="${i + 3}">${esc(b)}</div>`).join('');
  const rbullets = (right.bullets || []).map((b, i) => `<div class="ba-bullet" data-animate="${i + 3}">${esc(b)}</div>`).join('');
  return `
    <h2 data-animate="1" class="ba-headline">${esc(s.headline)}</h2>
    <div class="ba-columns">
      <div class="ba-col myth"    data-animate="2">
        <div class="ba-col-title">${esc(left.title  || 'Before')}</div>
        ${lbullets}
      </div>
      <div class="ba-col reality" data-animate="2">
        <div class="ba-col-title">${esc(right.title || 'After')}</div>
        ${rbullets}
      </div>
    </div>`;
}

// ── Closing slide ──────────────────────────────────────────
function buildClosing(s) {
  return `
    <div class="closing-layout">
      <div data-animate="1" class="closing-label">Key Takeaway</div>
      <h2 data-animate="2" class="closing-headline grad">${esc(s.headline)}</h2>
      ${s.subheadline ? `<blockquote data-animate="3" class="closing-quote">${esc(s.subheadline)}</blockquote>` : ''}
      ${s.note        ? `<p data-animate="4" class="closing-contact">${esc(s.note)}</p>` : ''}
    </div>`;
}

// ── Navigation ─────────────────────────────────────────────
function goTo(idx, animate = true) {
  if (isAnimating && animate) return;
  const prev = current;
  current = Math.max(0, Math.min(idx, slides.length - 1));

  const allSlides = deck.querySelectorAll('.slide');

  if (!animate) {
    allSlides.forEach(s => s.classList.remove('active', 'is-active'));
    const cur = allSlides[current];
    if (cur) {
      cur.classList.add('active');
      requestAnimationFrame(() => requestAnimationFrame(() => cur.classList.add('is-active')));
    }
  } else {
    const dir = idx >= prev ? 1 : -1;
    const prevEl = allSlides[prev];
    const nextEl = allSlides[current];
    if (!nextEl) return;
    isAnimating = true;

    if (prevEl) {
      prevEl.classList.remove('is-active');
      prevEl.classList.add(dir > 0 ? 'slide-out-left' : 'slide-out-right');
    }
    nextEl.classList.add('active', dir > 0 ? 'slide-in-right' : 'slide-in-left');

    setTimeout(() => {
      if (prevEl) prevEl.classList.remove('active', 'slide-out-left', 'slide-out-right');
      nextEl.classList.remove('slide-in-right', 'slide-in-left');
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
  updateDotNav();
}

prevBtn.addEventListener('click', () => goTo(current - 1));
nextBtn.addEventListener('click', () => goTo(current + 1));

function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if      (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); goTo(current + 1); }
    else if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')                    { e.preventDefault(); goTo(current - 1); }
    else if (e.key === 'Home')                                                  { e.preventDefault(); goTo(0); }
    else if (e.key === 'End')                                                   { e.preventDefault(); goTo(slides.length - 1); }
  });
}

let touchStartX = 0;
deck.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
deck.addEventListener('touchend',   e => {
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
      alert('PDF export requires cdnjs.cloudflare.com. Please allow it or self-host html2canvas + jsPDF.');
      exportBtn.disabled = false;
      exportBtn.textContent = 'Export PDF';
      return;
    }

    exportBtn.textContent = 'Exporting…';
    document.body.classList.add('exportingPdf');

    const allSlides = deck.querySelectorAll('.slide');
    allSlides.forEach(s => s.classList.add('is-active'));

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1920, 1080] });

    for (let i = 0; i < slides.length; i++) {
      exportBtn.textContent = `Exporting ${i + 1}/${slides.length}…`;
      const stage = document.createElement('div');
      stage.id = 'pdfStage';
      document.body.appendChild(stage);

      const bg = document.createElement('div');
      bg.style.cssText = 'position:absolute;inset:0;background:#06080f;';
      stage.appendChild(bg);

      const clone = allSlides[i].cloneNode(true);
      clone.style.cssText = 'position:absolute;top:0;left:0;width:1920px;height:1080px;padding:90px 96px;opacity:1;pointer-events:none;';
      clone.classList.add('active', 'is-active');
      clone.querySelectorAll('[data-animate]').forEach(el => {
        el.style.opacity = '1'; el.style.transform = 'none';
        el.style.filter = 'none'; el.style.transition = 'none';
      });
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
          backgroundColor: '#06080f', scale: 2, useCORS: true,
          logging: false, width: 1920, height: 1080,
        });
        if (i > 0) pdf.addPage([1920, 1080], 'landscape');
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 1920, 1080);
      } catch (err) {
        console.error(`Slide ${i + 1} capture failed:`, err);
      }
      document.body.removeChild(stage);
    }

    pdf.save('HBS_GenAI_Strategy.pdf');
    document.body.classList.remove('exportingPdf');
    allSlides.forEach(s => s.classList.remove('is-active'));
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
    s.src = src; s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

document.addEventListener('DOMContentLoaded', init);
