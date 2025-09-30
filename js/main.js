/* ===== Colors per depth ===== */
const colors = [
  { top: '#11B6D4', mid: '#066A86', deep: '#033A52', bottom: '#012131' }, // intro
  { top: '#0B8FB2', mid: '#045B78', deep: '#023247', bottom: '#011A27' }, // works
  { top: '#086A89', mid: '#03445A', deep: '#02293B', bottom: '#011521' }, // about
  { top: '#05465B', mid: '#022C3A', deep: '#011A26', bottom: '#010D16' }  // contact
];

/* ===== Bubbles ===== */
(function makeBubbles() {
  const wrap = document.getElementById('bubbles');
  if (!wrap) return;
  const COUNT = 28;
  for (let i = 0; i < COUNT; i++) {
    const outer = document.createElement('div'); outer.className = 'bubble';
    const inner = document.createElement('div'); inner.className = 'b';
    const size = 4 + Math.random() * 9, x = Math.random() * 100, drift = 8 + Math.random() * 18;
    const duration = 9 + Math.random() * 10, delay = Math.random() * 10;
    outer.style.setProperty('--x', x + '%');
    outer.style.setProperty('--duration', duration + 's');
    outer.style.animationDelay = delay + 's';
    inner.style.setProperty('--size', size + 'px');
    inner.style.setProperty('--drift', drift + 'px');
    inner.style.animationDelay = delay + 's';
    outer.appendChild(inner); wrap.appendChild(outer);
  }
})();

/* ===== Lightbox ===== */
const viewer = document.getElementById('viewer');
const viewerMount = viewer ? document.getElementById('viewerMount') : null;
const viewerClose = viewer ? document.getElementById('viewerClose') : null;
function openViewer({ type, src }) {
  if (!viewer || !viewerMount) return;
  viewerMount.innerHTML = '';
  if (type === 'image') {
    const img = document.createElement('img'); img.src = src; img.alt = '작업 미리보기'; img.className = 'viewer-media'; viewerMount.appendChild(img);
  } else if (type === 'video') {
    const video = document.createElement('video'); video.src = src; video.className = 'viewer-media'; video.controls = true; video.autoplay = true; video.playsInline = true; viewerMount.appendChild(video);
  }
  if (typeof viewer.showModal === 'function') viewer.showModal(); else viewer.setAttribute('open', '');
}
function closeViewer() {
  if (!viewer || !viewerMount) return;
  const v = viewerMount.querySelector('video'); if (v) { try { v.pause(); } catch (_) { } v.currentTime = 0; }
  try { if (typeof viewer.close === 'function') viewer.close(); else viewer.removeAttribute('open'); } catch (_) { viewer.removeAttribute('open'); }
}
if (viewerClose) viewerClose.addEventListener('click', closeViewer);
if (viewer) { viewer.addEventListener('click', (e) => { if (e.target === viewer) closeViewer(); }); window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && viewer.open) closeViewer(); }); }
document.querySelectorAll('.work').forEach(card => {
  card.addEventListener('click', () => openViewer({ type: card.dataset.type, src: card.dataset.src }));
});

function setFloatPhotosVisible(show) {
  const wrap = document.getElementById('intro-photos');
  if (!wrap) return;
  if (show) {
    wrap.classList.add('is-visible');
  } else {
    wrap.classList.remove('is-visible');
  }
}

/* ===== fullPage.js (v3) ===== */
(function initFullPageV3() {
  if (typeof jQuery === 'undefined' || typeof jQuery.fn.fullpage !== 'function') {
    console.warn('fullPage v3(jQuery) not found. Check js/fullpage.js path/version.');
    return;
  }

  // 공통 유틸
  function updateDepth(depth) {
    document.body.setAttribute('data-depth', String(depth));
    const c = colors[depth], root = document.documentElement.style;
    root.setProperty('--sea-top', c.top);
    root.setProperty('--sea-mid', c.mid);
    root.setProperty('--sea-deep', c.deep);
    root.setProperty('--sea-bottom', c.bottom);
  }
  function activateSection(depth) {
    const secs = document.querySelectorAll('#main > .section');
    secs.forEach(s => s.classList.remove('section-active'));
    const active = secs[depth]; if (active) active.classList.add('section-active');
  }
  function revealInSection(depth, show) {
    const sec = document.querySelectorAll('#main > .section')[depth];
    if (!sec) return;
    sec.querySelectorAll('.reveal').forEach((el, i) => {
      if (show) { el.classList.add('is-visible'); el.style.transitionDelay = `${Math.min(i * 80, 400)}ms`; }
      else { el.classList.remove('is-visible'); el.style.transitionDelay = '0ms'; }
    });
  }

  jQuery('#main').fullpage({
    anchors: ['intro', 'works', 'about', 'contact'],
    navigation: true,
    navigationPosition: 'right',
    scrollingSpeed: 600,
    css3: true,
    easingcss3: 'cubic-bezier(.22,.61,.36,1)',
    autoScrolling: true,
    fitToSection: true,
    fitToSectionDelay: 0,
    keyboardScrolling: true,
    animateAnchor: true,
    recordHistory: true,
    responsiveWidth: 720,
    responsiveHeight: 560,

    // 핵심: v3 충돌 방지
    sectionSelector: '.section',
    verticalCentered: false,
    fixedElements: '.bg, #viewer',

    afterRender: function () {
      updateDepth(0); activateSection(0); revealInSection(0, true);
      setFloatPhotosVisible(true);
    },
    afterLoad: function (anchorLink, index) {
      const idx = (typeof index === 'number') ? index - 1 : 0;
      updateDepth(idx); activateSection(idx); revealInSection(idx, true);
      setFloatPhotosVisible(idx === 0);
    },
    onLeave: function (index) {
      const leaveIdx = (typeof index === 'number') ? index - 1 : 0;
      revealInSection(leaveIdx, false);
      if (leaveIdx === 0) setFloatPhotosVisible(false);
    }
  });
})();
// ===== Floating Photos (Random Free Float) =====
// 원하는 이미지 경로로 유지/수정
const photos = [
  '../image/taepoong_profile.png',
  '../image/profile.png',
  '../image/profile3.png',
  '../image/leeryuk.jpg',
  '../image/leeryuk3.png',
];

// 상태값
let __floatPool = [];
let __floatRunning = false;
let __lastT = 0;

// 경계(%) — 화면 밖으로 나가지 않도록 약간 여유
const __MIN_X = 5, __MAX_X = 80;
const __MIN_Y = 10, __MAX_Y = 90;

// 속도 범위(퍼센트/초) — 취향에 맞게 조절 가능
const __MIN_SPEED = 1, __MAX_SPEED = 2;
// 회전 속도(도/초)
const __MAX_ROT = 2;

// 루프
function __tickFloat(t) {
  if (!__floatRunning || __floatPool.length === 0) return;
  const dt = Math.min(0.05, (t - __lastT) / 1000 || 0);
  __lastT = t;

  for (const p of __floatPool) {
    // 위치 업데이트
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // 경계 반사
    if (p.x < __MIN_X) { p.x = __MIN_X; p.vx *= -1; }
    if (p.x > __MAX_X) { p.x = __MAX_X; p.vx *= -1; }
    if (p.y < __MIN_Y) { p.y = __MIN_Y; p.vy *= -1; }
    if (p.y > __MAX_Y) { p.y = __MAX_Y; p.vy *= -1; }

    // 약간의 랜덤 가속으로 경로 자연스럽게
    p.vx += (Math.random() - 0.5) * 0.02 * dt;
    p.vy += (Math.random() - 0.5) * 0.02 * dt;

    // 속도 클램프
    const sp = Math.hypot(p.vx, p.vy) || 1;
    if (sp < __MIN_SPEED) { const k = __MIN_SPEED / sp; p.vx *= k; p.vy *= k; }
    if (sp > __MAX_SPEED) { const k = __MAX_SPEED / sp; p.vx *= k; p.vy *= k; }

    // 회전
    p.rot += p.vrot * dt;

    // 스타일 반영
    p.el.style.setProperty('--x', p.x + '%');
    p.el.style.setProperty('--y', p.y + '%');
    p.el.style.rotate = `${p.rot.toFixed(2)}deg`;
  }

  requestAnimationFrame(__tickFloat);
}

function __startFloat() {
  if (__floatRunning) return;
  __floatRunning = true;
  __lastT = performance.now();
  requestAnimationFrame(__tickFloat);
}

function __stopFloat() {
  __floatRunning = false;
}

// 생성기
(function makeFloatingPhotos() {
  const wrap = document.getElementById('intro-photos');
  if (!wrap) return;

  // 리렌더 대비 초기화
  wrap.innerHTML = '';
  __floatPool = [];

  const MAX = Math.min(photos.length, 5);
  const used = new Set();

  for (let i = 0; i < MAX; i++) {
    let idx;
    do { idx = Math.floor(Math.random() * photos.length); } while (used.has(idx));
    used.add(idx);

    const el = document.createElement('div');
    el.className = 'float-photo';

    // 기존 CSS의 미세 흔들림 애니메이션을 끄고 JS 제어만 쓰기
    el.style.animation = 'none';

    // 초기 좌표/사이즈
    const x = __MIN_X + Math.random() * (__MAX_X - __MIN_X); // 5% ~ 95%
    const y = __MIN_Y + Math.random() * (__MAX_Y - __MIN_Y); // 10% ~ 90%
    const size = Math.round(90 + Math.random() * 120);       // 90~210px

    el.style.setProperty('--x', x + '%');
    el.style.setProperty('--y', y + '%');
    el.style.setProperty('--size', size + 'px');

    const img = document.createElement('img');
    img.src = photos[idx];
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';

    el.appendChild(img);
    wrap.appendChild(el);

    // 무작위 방향/속도/회전속도
    const angle = Math.random() * Math.PI * 2;
    const speed = __MIN_SPEED + Math.random() * (__MAX_SPEED - __MIN_SPEED);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    const vrot = (Math.random() - 0.5) * (__MAX_ROT * 2); // -MAX~+MAX

    __floatPool.push({ el, x, y, vx, vy, rot: Math.random() * 360, vrot });
  }

  // 초반에 보이는 상태면 즉시 시작 (afterRender에서 setFloatPhotosVisible(true) 호출됨)
  if (document.body.getAttribute('data-depth') === '0') {
    __startFloat();
  }
})();
