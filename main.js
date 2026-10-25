/* SCIVYT redesign concept, Dive X Marketing */
gsap.registerPlugin(ScrollTrigger);
const isTouch = matchMedia('(hover:none)').matches;
const mobile = () => innerWidth <= 860;
document.body.classList.add('loading');

/* ---------------- smooth scroll ---------------- */
let lenis = null;
if (window.Lenis) {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop(); window.lenis = lenis;
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    e.preventDefault(); lenis.scrollTo(id, { offset: 0, duration: 1.6 });
  }));
}

/* ---------------- cursor ---------------- */
const cur = document.querySelector('.cursor');
const mouse = { x: innerWidth / 2, y: innerHeight / 2, has: false };
if (!isTouch) {
  const dot = cur.querySelector('.cursor-dot'), ring = cur.querySelector('.cursor-ring');
  let rx = mouse.x, ry = mouse.y;
  addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.has = true; dot.style.transform = `translate(${mouse.x}px,${mouse.y}px)`; });
  gsap.ticker.add(() => { rx += (mouse.x - rx) * 0.16; ry += (mouse.y - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px)`; });
  document.querySelectorAll('a,[data-cursor]').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('is-link'));
    el.addEventListener('mouseleave', () => cur.classList.remove('is-link'));
  });
}

/* ---------------- particle field ---------------- */
const cv = document.getElementById('field');
const ctx = cv.getContext('2d');
let W, H, DPR, N, P = [], shapes = {};
const logoImg = new Image(); logoImg.src = 'assets/web/logo.png';

function sample(drawFn, count) {
  const oc = document.createElement('canvas'); oc.width = W; oc.height = H;
  const o = oc.getContext('2d'); drawFn(o);
  const d = o.getImageData(0, 0, W, H).data, pts = [];
  const step = Math.max(3, Math.round(Math.sqrt((W * H) / 26000)));
  for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (d[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
  const out = [];
  for (let i = 0; i < count; i++) { const p = pts[(Math.random() * pts.length) | 0] || [W / 2, H / 2]; out.push([p[0] + (Math.random() - .5) * step, p[1] + (Math.random() - .5) * step]); }
  return out;
}
function buildShapes() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  N = mobile() ? 1100 : 2800;
  const cx = mobile() ? W * 0.62 : W * 0.75, cy = mobile() ? H * 0.42 : H * 0.42;
  shapes.q = sample(o => {
    const s = mobile() ? H * 0.46 : H * 0.84;
    o.font = `italic 400 ${s}px "Instrument Serif"`; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#fff';
    o.fillText('?', cx, cy + s * 0.04);
  }, N);
  shapes.logo = sample(o => {
    const s = Math.min(W, H) * (mobile() ? 0.62 : 0.58), r = logoImg.naturalHeight / logoImg.naturalWidth || 0.9;
    if (logoImg.complete && logoImg.naturalWidth) o.drawImage(logoImg, W / 2 - s / 2, H / 2 - (s * r) / 2, s, s * r);
    else { o.fillStyle = '#fff'; o.fillRect(W / 2 - 100, H / 2 - 100, 200, 200); }
  }, N);
  // constellation: clustered nodes across the screen
  const hubs = Array.from({ length: 14 }, () => [Math.random() * W, Math.random() * H]);
  shapes.net = Array.from({ length: N }, () => { const h = hubs[(Math.random() * hubs.length) | 0], a = Math.random() * 6.283, r = Math.pow(Math.random(), 1.8) * Math.min(W, H) * 0.22; return [h[0] + Math.cos(a) * r, h[1] + Math.sin(a) * r]; });
  shapes.start = Array.from({ length: N }, () => [Math.random() * W, Math.random() * H]);
  P = Array.from({ length: N }, (_, i) => ({ ox: 0, oy: 0, vx: 0, vy: 0, s: Math.random() < 0.08 ? 2.6 : 1.7, hot: Math.random() < 0.08, ph: Math.random() * 6.283, sp: 0.4 + Math.random() * 0.8 }));
}
const field = { intro: 0, p: 0 };
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = v => Math.max(0, Math.min(1, v));
function lerp(a, b, t) { return a + (b - a) * t; }
function frame(time) {
  const t = time * 0.001;
  ctx.clearRect(0, 0, W, H);
  const p = field.p;
  const mA = ease(clamp01((p - 0.18) / 0.32));       // ? -> logo
  const mB = ease(clamp01((p - 0.62) / 0.3));        // logo -> network
  const alpha = 1 - clamp01((p - 0.9) / 0.1);
  if (alpha <= 0) return;
  const intro = ease(field.intro);
  const S = shapes, mx = mouse.x, my = mouse.y, R = 130;
  for (let i = 0; i < N; i++) {
    const q = S.q[i], l = S.logo[i], n = S.net[i], st = S.start[i], pt = P[i];
    let x = lerp(lerp(q[0], l[0], mA), n[0], mB), y = lerp(lerp(q[1], l[1], mA), n[1], mB);
    x = lerp(st[0], x, intro); y = lerp(st[1], y, intro);
    const wob = 1.4 + mB * 6;
    x += Math.sin(t * pt.sp + pt.ph) * wob; y += Math.cos(t * pt.sp * 0.8 + pt.ph) * wob;
    if (mouse.has) {
      const dx = x + pt.ox - mx, dy = y + pt.oy - my, d2 = dx * dx + dy * dy;
      if (d2 < R * R) { const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 2.2; pt.vx += (dx / d) * f; pt.vy += (dy / d) * f; }
    }
    pt.vx += -pt.ox * 0.04; pt.vy += -pt.oy * 0.04; pt.vx *= 0.86; pt.vy *= 0.86; pt.ox += pt.vx; pt.oy += pt.vy;
    ctx.fillStyle = pt.hot ? `rgba(255,90,31,${0.95 * alpha})` : `rgba(242,240,234,${(0.72 + 0.28 * Math.sin(t + pt.ph)) * alpha})`;
    ctx.fillRect(x + pt.ox, y + pt.oy, pt.s, pt.s);
  }
}
gsap.ticker.add(() => frame(performance.now()));
let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { buildShapes(); ScrollTrigger.refresh(); }, 250); });

/* ---------------- loader -> intro ---------------- */
function intro() {
  const words = document.querySelectorAll('.loader-word span');
  const count = document.getElementById('count');
  const tl = gsap.timeline();
  const c = { v: 0 };
  tl.to(c, { v: 100, duration: 1.9, ease: 'power2.inOut', onUpdate: () => count.textContent = String(Math.round(c.v)).padStart(3, '0') }, 0)
    .to('.loader-bar i', { width: '100%', duration: 1.9, ease: 'power2.inOut' }, 0)
    .to('.loader-word', { y: () => 0, duration: 0 }, 0);
  words.forEach((w, i) => { if (i) tl.to('.loader-word span', { yPercent: -100 * i, duration: 0.32, ease: 'expo.inOut' }, i * 0.3); });
  tl.to('.loader', { clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', duration: 1, ease: 'expo.inOut' }, '+=0.15')
    .add(() => { document.body.classList.remove('loading'); lenis && lenis.start(); }, '-=0.4')
    .to(field, { intro: 1, duration: 2.2, ease: 'none' }, '-=0.6')
    .from('.hero-title .line > span', { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.1 }, '<0.1')
    .from('.hero-side > *, .hero-meta span, .hero-foot > *, .hdr > *', { y: 24, autoAlpha: 0, duration: 1, ease: 'expo.out', stagger: 0.05 }, '<0.3');
  gsap.set('.loader', { clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)' });
}

/* ---------------- scroll scenes ---------------- */
function scenes() {
  // particle morph across hero + manifesto
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', endTrigger: '.manifesto', end: 'bottom 60%', scrub: true, onUpdate: s => field.p = s.progress });
  gsap.to('.hero-title, .hero-side', { yPercent: -30, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true } });

  // manifesto words
  const m = document.getElementById('mani');
  const walk = node => { [...node.childNodes].forEach(ch => {
    if (ch.nodeType === 3) { const frag = document.createDocumentFragment(); ch.textContent.split(/(\s+)/).forEach(w => { if (!w.trim()) { frag.appendChild(document.createTextNode(w)); return; } const s = document.createElement('span'); s.className = 'w'; s.textContent = w; frag.appendChild(s); }); ch.replaceWith(frag); }
    else walk(ch); }); };
  walk(m);
  gsap.to(m.querySelectorAll('.w'), { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: m, start: 'top 75%', end: 'bottom 45%', scrub: true } });
  gsap.from('.mani-arrow', { x: -120, y: 120, autoAlpha: 0, ease: 'expo.out', duration: 1.4, scrollTrigger: { trigger: '.mani-arrow', start: 'top 90%' } });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = document.getElementById('track');
    const nodes = document.querySelectorAll('.rail-nodes span');
    const tw = gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: 'none',
      scrollTrigger: { trigger: '.journey', start: 'top top', end: () => '+=' + (track.scrollWidth - innerWidth) * 1.1, pin: true, scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: s => { document.getElementById('railFill').style.width = (s.progress * 100) + '%'; const k = Math.min(4, Math.round(s.progress * 4)); nodes.forEach((n, i) => n.classList.toggle('on', i <= k)); } } });
    document.querySelectorAll('.panel').forEach((pn, idx) => { if (!idx) return;
      gsap.from(pn.querySelector('.p-verb'), { xPercent: 40, ease: 'none', scrollTrigger: { trigger: pn, containerAnimation: tw, start: 'left right', end: 'left 30%', scrub: true } });
      gsap.from(pn.querySelector('.p-card'), { y: 120, rotate: 4, ease: 'none', scrollTrigger: { trigger: pn, containerAnimation: tw, start: 'left right', end: 'left 20%', scrub: true } });
    });
  });

  mm.add('(max-width: 860px)', () => {
    // stacking cards: each panel sinks back as the next slides over it
    const panels = gsap.utils.toArray('.panel');
    panels.forEach((pn, i) => {
      if (i < panels.length - 1) gsap.to(pn, { scale: 0.9, filter: 'brightness(.55)', ease: 'none', scrollTrigger: { trigger: panels[i + 1], start: 'top bottom', end: 'top top', scrub: true } });
      if (i) {
        gsap.from(pn.querySelector('.p-verb'), { yPercent: 60, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: pn, start: 'top 85%', end: 'top 25%', scrub: true } });
        gsap.from(pn.querySelector('.p-card'), { y: 80, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: pn, start: 'top 70%', end: 'top 10%', scrub: true } });
      }
    });
    const nodes = document.querySelectorAll('.rail-nodes span');
    ScrollTrigger.create({ trigger: '.journey', start: 'top top', end: 'bottom bottom', onUpdate: s => {
      document.getElementById('railFill').style.width = (s.progress * 100) + '%';
      const k = Math.min(4, Math.floor(s.progress * 5)); nodes.forEach((n, idx) => n.classList.toggle('on', idx <= k)); } });
    // people: the row crossing the middle of the screen lights up
    gsap.utils.toArray('.ppl li').forEach(li => ScrollTrigger.create({ trigger: li, start: 'top 55%', end: 'bottom 45%', toggleClass: 'active' }));
  });

  // counters
  document.querySelectorAll('.num b').forEach(b => {
    const to = +b.dataset.to, suf = b.dataset.suffix, o = { v: 0 };
    gsap.to(o, { v: to, duration: 2.2, ease: 'expo.out', scrollTrigger: { trigger: b, start: 'top 85%' }, onUpdate: () => b.textContent = Math.round(o.v).toLocaleString('en-IN') + suf });
  });
  gsap.utils.toArray('.big-h, .kicker').forEach(el => gsap.from(el, { y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));

  // hybrid cursor reveal
  const stage = document.getElementById('hyStage'), hb = document.getElementById('hyB');
  const hv = { r: 0, x: 50, y: 50 };
  const setClip = () => hb.style.clipPath = `circle(${hv.r}px at ${hv.x}px ${hv.y}px)`;
  stage.addEventListener('mousemove', e => { const r = stage.getBoundingClientRect(); gsap.to(hv, { x: e.clientX - r.left, y: e.clientY - r.top, duration: 0.5, ease: 'power3.out', onUpdate: setClip }); });
  stage.addEventListener('mouseenter', e => { const r = stage.getBoundingClientRect(); hv.x = e.clientX - r.left; hv.y = e.clientY - r.top; gsap.to(hv, { r: 210, duration: 0.8, ease: 'expo.out', onUpdate: setClip }); });
  stage.addEventListener('mouseleave', () => gsap.to(hv, { r: 0, duration: 0.6, ease: 'expo.inOut', onUpdate: setClip }));
  if (isTouch || mobile()) { // no cursor: the circle travels and grows with the scroll
    const grow = gsap.parseEase('power2.inOut');
    ScrollTrigger.create({ trigger: stage, start: 'top 75%', end: 'bottom 35%', scrub: 0.6, onUpdate: s => {
      const r = stage.getBoundingClientRect(), p = s.progress;
      hv.x = r.width * (0.25 + 0.5 * p); hv.y = r.height * (0.7 - 0.3 * p);
      hv.r = Math.hypot(r.width, r.height) * grow(gsap.utils.clamp(0, 1, (p - 0.15) / 0.6)); setClip(); } });
  }

  // story arrow draw
  const path = document.getElementById('storyPath'), len = path.getTotalLength();
  gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top 70%', end: 'bottom 70%', scrub: true } });
  gsap.from('.tl li', { y: 40, autoAlpha: 0, stagger: 0.12, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.tl', start: 'top 80%' } });

  // people rows
  gsap.from('.ppl li', { yPercent: 100, autoAlpha: 0, stagger: 0.06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ppl', start: 'top 80%' } });

  // initiative: diagonal reveal (the logo's arrow) + parallax
  gsap.to('#iniImg', { clipPath: 'polygon(0 100%,0 -60%,160% 100%)', ease: 'none', scrollTrigger: { trigger: '.initiative', start: 'top 85%', end: 'top 10%', scrub: true } });
  gsap.to('#iniImg div', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.initiative', start: 'top bottom', end: 'bottom top', scrub: true } });

  // CTA + wordmark
  gsap.from('.cta-h', { yPercent: 30, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.cta', start: 'top 75%' } });
  gsap.from('.wordmark', { yPercent: 60, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

/* ---------------- header theme (reads the section under the header) ---------------- */
const hdr = document.querySelector('.hdr'), rail = document.querySelector('.rail');
const hdrParts = [...document.querySelectorAll('.hdr .brand, .hdr .nav a, .hdr .btn-sm, .hdr .burger')];
const railParts = [...document.querySelectorAll('.rail-nodes span')];
function isLightAt(x, y) {
  const sec = document.elementsFromPoint(x, y).map(e => e.closest && e.closest('[data-theme]')).find(Boolean);
  return !!sec && sec.dataset.theme === 'light';
}
function theme() {
  hdrParts.forEach(el => { const r = el.getBoundingClientRect(); el.classList.toggle('lt', isLightAt(r.left + r.width / 2, r.top + r.height / 2)); });
  railParts.forEach(el => { const r = el.getBoundingClientRect(); el.classList.toggle('lt', isLightAt(r.left + r.width / 2, r.top + r.height / 2)); });
  rail.classList.toggle('light', isLightAt(innerWidth * 0.5, 90));
}
hdr.style.pointerEvents = 'auto';
let thF = 0; gsap.ticker.add(() => { if (++thF % 6 === 0) theme(); });

/* ---------------- mobile menu ---------------- */
const burger = document.getElementById('burger');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  burger.setAttribute('aria-expanded', String(open));
  document.getElementById('mmenu').setAttribute('aria-hidden', String(!open));
  if (lenis) { open ? lenis.stop() : lenis.start(); }
}
burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
document.querySelectorAll('.mmenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

/* ---------------- boot ---------------- */
Promise.all([document.fonts.load('italic 400 100px "Instrument Serif"'), document.fonts.ready, new Promise(r => logoImg.complete ? r() : (logoImg.onload = logoImg.onerror = r))]).then(() => {
  buildShapes(); scenes(); intro();
});
