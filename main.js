// Duermevela — portada. Sin dependencias.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 900px)');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ── Raíl: se acopla arriba cuando pasan las fotografías ── */
  const rail = $('#rail');
  const heroPics = $('.hero-pics');
  const clock = $('[data-clock]');
  const menuBtn = $('.rail__menu');
  const menu = $('#menu');

  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!open));
    menuBtn.textContent = open ? 'Menú' : 'Cerrar';
    menu.hidden = open;
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.textContent = 'Menú'; }
  });

  /* ── Vídeo del héroe: montaje de planos nocturnos, 5 s cada uno, fundidos entre sí ──
     Se reproduce también con «reducir movimiento» (sin zoom ni apertura) y siempre con botón de pausa. */
  const PX = 'https://videos.pexels.com/video-files/';
  const big = innerWidth * devicePixelRatio > 1500;
  const tall = matchMedia('(orientation: portrait) and (max-width: 899px)').matches;
  const CLIPS = tall ? [
    { src: `${PX}34105869/14464884_720_1280_30fps.mp4`, t: 1 },
    { src: `${PX}31946877/13609890_720_1280_30fps.mp4`, t: 1 },
    { src: `${PX}14536989/14536989-hd_720_1282_30fps.mp4`, t: 2 },
  ] : [
    { src: `${PX}11397355/11397355-hd_${big ? '1920_1080' : '1280_720'}_30fps.mp4`, t: 0 },
    { src: `${PX}36244106/${big ? '15370429_1920_1080' : '15370427_1280_720'}_30fps.mp4`, t: 0.5 },
    { src: `${PX}3882891/3882891-hd_${big ? '1920_1080_30fps' : '1280_720_60fps'}.mp4`, t: 1 },
    { src: `${PX}16231301/16231301-hd_${big ? '1920_1080' : '1280_720'}_30fps.mp4`, t: 1 },
  ];
  const SHOT = 5;
  const vids = $$('.hero-video');
  const reelUI = $('#reel');
  const bars = $('.reel__bars');
  const toggle = $('.reel__toggle');
  const saveData = navigator.connection && navigator.connection.saveData;
  if (tall) vids[0].poster = vids[0].dataset.tallPoster;
  bars.innerHTML = CLIPS.map(() => '<span><i></i></span>').join('');
  const fills = $$('i', bars);
  let cur = 0, front = 0, inView = true, switching = false;
  let paused = false;
  try { paused = localStorage.getItem('dv-reel-paused') === '1'; } catch {}

  const load = (v, clip) => {
    if (v.dataset.clip !== clip.src) { v.dataset.clip = clip.src; v.src = clip.src; }
    v.preload = 'auto';
    const seek = () => { try { v.currentTime = clip.t; } catch {} };
    v.readyState >= 1 ? seek() : v.addEventListener('loadedmetadata', seek, { once: true });
  };
  const drift = (v) => {
    if (reduce.matches || !v.animate) return;
    v.animate([{ transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: (SHOT + 1.2) * 1000, easing: 'linear' });
  };
  const advance = () => {
    if (switching) return;
    switching = true;
    const next = (cur + 1) % CLIPS.length;
    const a = vids[front], b = vids[1 - front];
    load(b, CLIPS[next]);
    b.play().then(() => {
      $('.hero-pic--a').classList.add('played');
      b.classList.add('is-on'); a.classList.remove('is-on'); drift(b);
      cur = next; front = 1 - front;
      fills.forEach((f, k) => { f.style.transform = `scaleX(${k < cur ? 1 : 0})`; });
      setTimeout(() => { a.pause(); load(a, CLIPS[(cur + 1) % CLIPS.length]); switching = false; }, 1300);
    }).catch(() => { switching = false; });
  };
  const tick = () => {
    const v = vids[front];
    if (!v.paused && v.dataset.clip) {
      const k = Math.min(1, Math.max(0, (v.currentTime - CLIPS[cur].t) / SHOT));
      fills[cur].style.transform = `scaleX(${k.toFixed(3)})`;
      if (k >= 1 || v.ended) advance();
    }
    requestAnimationFrame(tick);
  };
  const playReel = () => {
    if (paused || !inView || document.hidden) return;
    const v = vids[front];
    if (!v.dataset.clip) { load(v, CLIPS[cur]); load(vids[1 - front], CLIPS[1]); drift(v); }
    v.play().catch(() => {});
  };
  const pauseReel = () => vids.forEach((v) => v.pause());
  const setPaused = (p) => {
    paused = p;
    toggle.setAttribute('aria-pressed', String(p));
    toggle.textContent = p ? 'Reproducir vídeo' : 'Pausar vídeo';
    try { localStorage.setItem('dv-reel-paused', p ? '1' : '0'); } catch {}
    p ? pauseReel() : playReel();
  };
  if (!saveData) {
    reelUI.hidden = false;
    setPaused(paused);
    toggle.addEventListener('click', () => setPaused(!paused));
    new IntersectionObserver(([en]) => { inView = en.isIntersecting; inView ? playReel() : pauseReel(); }).observe($('.hero-pic--a'));
    document.addEventListener('visibilitychange', () => (document.hidden ? pauseReel() : playReel()));
    requestAnimationFrame(tick);
  }

  /* ── Titulares y nombre del pie: palabras o letras dentro de una máscara ── */
  $$('.h-head[data-reveal], [data-split="chars"]').forEach((el) => {
    const chars = el.dataset.split === 'chars';
    const parts = chars ? [...el.textContent.trim()] : el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = parts.map((t, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${t}</span></span>`).join(chars ? '' : ' ');
    el.classList.add('split');
  });

  /* ── Cifras de las preguntas: cuentan una vez al aparecer ── */
  const countUp = (root) => {
    if (reduce.matches) return;
    $$('[data-count]', root).forEach((el) => {
      const to = +el.dataset.count;
      if (!to) return;
      const t0 = performance.now();
      const step = (t) => {
        const k = Math.min(1, (t - t0) / 900);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  /* ── Entradas por sección ── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); countUp(en.target); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach((el) => io.observe(el));

  /* ── A bordo: la pista cruza la fotografía fija ── */
  const aboard = $('.aboard');
  const track = $('#aboard-track');
  let travel = 0;
  const pinned = () => desktop.matches && !reduce.matches;
  const layoutAboard = () => {
    if (!pinned()) { aboard.style.height = ''; track.style.transform = ''; travel = 0; return; }
    travel = Math.max(0, track.scrollWidth - innerWidth);
    aboard.style.height = `${innerHeight + travel}px`;
  };

  /* ── Bucle de scroll: un solo rAF ── */
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const docked = heroPics.getBoundingClientRect().bottom <= rail.offsetHeight + 1;
    rail.classList.toggle('is-docked', docked);
    rail.classList.toggle('is-stuck', rail.getBoundingClientRect().top <= 0);
    // Reloj de la noche: de las 21:40 a las 07:40 a lo largo de la página
    const max = document.documentElement.scrollHeight - innerHeight;
    const mins = Math.round((21 * 60 + 40 + (max > 0 ? scrollY / max : 0) * 600) / 5) * 5 % 1440;
    const label = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    if (clock.textContent !== label) clock.textContent = label;
    if (travel) {
      const p = Math.min(1, Math.max(0, -aboard.getBoundingClientRect().top / travel));
      track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
    }
  };
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', () => { layoutAboard(); request(); });
  desktop.addEventListener('change', () => { layoutAboard(); request(); });
  reduce.addEventListener('change', () => { layoutAboard(); request(); });
  addEventListener('load', () => { layoutAboard(); request(); });
  layoutAboard(); onScroll();

  /* ── Horarios en directo ── */
  const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const nowIn = (tz) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    return { min: +parts.hour * 60 + +parts.minute, day: WD[parts.weekday] };
  };
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const span = (mins) => {
    const h = Math.floor(mins / 60), m = mins % 60;
    if (mins < 1) return 'nada';
    return h ? `${h} h ${String(m).padStart(2, '0')} min` : `${m} min`;
  };
  const rows = $$('.row');
  const nextOf = (row) => {
    const { dep, arr, tz } = row.dataset;
    const now = nowIn(tz);
    let diff = toMin(dep) - now.min;
    const tomorrow = diff < 0;
    if (tomorrow) diff += 1440;
    return { diff, tomorrow, dep, arr, arrDay: DAYS[(now.day + (tomorrow ? 2 : 1)) % 7] };
  };
  const renderLive = () => {
    rows.forEach((row) => {
      const n = nextOf(row);
      row.classList.toggle('is-soon', !n.tomorrow && n.diff < 60);
      $('[data-live]', row).textContent = n.tomorrow
        ? `El de hoy ya salió. El próximo sale mañana a las ${n.dep}; despiertas en ${row.dataset.to} el ${n.arrDay} a las ${n.arr}.`
        : `Sale hoy a las ${n.dep}, dentro de ${span(n.diff)}. Despiertas en ${row.dataset.to} el ${n.arrDay} a las ${n.arr}.`;
    });
    const soon = rows.map((row) => ({ row, ...nextOf(row) })).sort((a, b) => a.diff - b.diff)[0];
    const left = rows.filter((r) => !nextOf(r).tomorrow).length;
    const intro = left === rows.length ? 'Esta noche salen seis trenes.'
      : left ? `Esta noche ${left === 1 ? 'queda un tren' : `quedan ${left} trenes`} por salir.`
      : 'Los trenes de esta noche ya van de camino.';
    $('[data-live-next]').textContent = `${intro} El próximo sale de ${soon.row.dataset.from} hacia ${soon.row.dataset.to} ${soon.tomorrow ? `mañana a las ${soon.dep}` : `hoy a las ${soon.dep}, dentro de ${span(soon.diff)}`}.`;
    rows.forEach((row) => {
      const cell = $(`[data-status="${row.dataset.city}"]`);
      const n = nextOf(row);
      cell.textContent = n.tomorrow ? 'En camino' : n.diff < 60 ? `Embarcando · ${span(n.diff)}` : `En ${span(n.diff)}`;
      cell.classList.toggle('is-gone', n.tomorrow);
      cell.classList.toggle('is-soon', !n.tomorrow && n.diff < 60);
    });
  };
  renderLive();
  setInterval(renderLive, 30000);

  /* ── Lista de rutas: fila activa, foto que cambia, reserva que la sigue ── */
  const pics = $$('#routes-pic img');
  const book = $('#route-book');
  const routeSelect = $('#b-route');
  const activate = (row) => {
    if (row.classList.contains('is-active')) return;
    rows.forEach((r) => {
      const on = r === row;
      r.classList.toggle('is-active', on);
      $('.row__head', r).setAttribute('aria-expanded', String(on));
    });
    pics.forEach((img) => {
      const on = img.dataset.city === row.dataset.city;
      if (on) img.loading = 'eager';
      img.classList.toggle('is-on', on);
    });
    drawRoute(row);
    const from = row.dataset.from.split(' ')[0];
    const label = `${from} → ${row.dataset.to}`;
    const href = `mailto:reservas@duermevela.example?subject=${encodeURIComponent(`Reserva: ${label}`)}`;
    book.textContent = `Reservar ${label}`;
    book.href = href;
    routeSelect.value = label;
  };
  // Mapa de la red: la vía de la ruta activa se dibuja en naranja
  const map = $('.map svg');
  const ROUTE = { lisboa: 'mad-lis', madrid: 'mad-lis', paris: 'bcn-par', barcelona: 'bcn-par', milan: 'bcn-mil', zurich: 'bcn-zur' };
  const CITY = { 'Madrid': 'madrid', 'Lisboa': 'lisboa', 'Barcelona': 'barcelona', 'París': 'paris', 'Milán': 'milan', 'Zúrich': 'zurich' };
  function drawRoute(row) {
    const id = ROUTE[row.dataset.city];
    const fromCity = CITY[row.dataset.from.split(' ')[0]];
    map.dataset.active = id;
    $$('circle', map).forEach((c) => {
      c.classList.toggle('is-from', c.dataset.c === fromCity);
      c.classList.toggle('is-to', c.dataset.c === row.dataset.city);
      c.nextElementSibling.classList.toggle('is-on', c.dataset.c === fromCity || c.dataset.c === row.dataset.city);
    });
    const path = $(`path[data-r="${id}"]`, map);
    if (!reduce.matches && path.animate) {
      path.animate([{ strokeDasharray: '1 1', strokeDashoffset: 1 }, { strokeDasharray: '1 1', strokeDashoffset: 0 }],
        { duration: 900, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
    }
  }
  drawRoute(rows[0]);

  rows.forEach((row) => {
    const head = $('.row__head', row);
    head.addEventListener('click', () => activate(row));
    head.addEventListener('focus', () => activate(row));
  });

  /* ── Reserva: abre un correo con la ruta, la noche y la plaza elegidas ── */
  const form = $('#book');
  const date = $('#b-date');
  const today = new Date();
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  date.min = iso(today);
  date.value = iso(today);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const night = date.value ? new Date(`${date.value}T12:00`).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : 'por decidir';
    const subject = `Reserva: ${form.ruta.value}, ${night}`;
    const body = `Hola,\n\nQuiero reservar:\n· Ruta: ${form.ruta.value}\n· Noche de salida: ${night}\n· Plaza: ${form.plaza.value}\n\nGracias.`;
    location.href = `mailto:reservas@duermevela.example?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
