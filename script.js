/* ==========================================================================
   MJL Reclutamiento Especializado — script.js
   JavaScript sin librerías (vanilla). Cada módulo va aislado en try/catch:
   si uno falla, el resto de la página sigue funcionando y el contenido
   queda visible (el estado "oculto" solo existe bajo la clase .js).
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Configuración ---------- */
  // Única fuente del número de WhatsApp de MJL (52 + 10 dígitos, sin signos).
  // Si queda vacío ('') el botón flotante y el envío del formulario se ocultan.
  const WHATSAPP_NUMBER = '525624784764';

  const root = document.documentElement;
  root.classList.add('js');

  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CAN_HOVER = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const safe = (fn) => { try { fn(); } catch (e) { if (window.console) console.warn('[MJL]', e); } };

  /* ---------- WhatsApp ---------- */
  const waURL = (texto) => 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(texto);

  safe(() => {
    if (!WHATSAPP_NUMBER) {
      root.classList.add('sin-wa');
      $$('[data-wa]').forEach((a) => { a.style.display = 'none'; });
      return;
    }
    $$('[data-wa]').forEach((a) => { a.href = waURL(a.dataset.wa || 'Hola MJL, quiero información.'); });
  });

  /* ---------- Imágenes de stock rotas: se ocultan y queda la composición CSS ---------- */
  safe(() => {
    $$('img[data-stock]').forEach((img) => {
      const bad = () => img.classList.add('is-broken');
      img.addEventListener('error', bad);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) bad();
    });
  });

  /* ---------- Cargador ---------- */
  let loaderDone = false;
  const loader = $('#loader');
  const endLoader = () => {
    if (loaderDone) return;
    loaderDone = true;
    root.classList.add('ready');
    if (loader) {
      loader.classList.add('is-out');
      setTimeout(() => { loader.style.display = 'none'; }, 700);
    }
  };
  safe(() => {
    if (!loader || RM) { endLoader(); return; }
    const pct = $('#loaderPct');
    const txt = $('#loaderText');
    const msgs = ['Abriendo ruta…', 'Verificando perfiles…', 'Validando a nivel LATAM…', 'Todo listo'];
    const t0 = performance.now();
    const DUR = 1450;
    const tick = (now) => {
      const p = clamp((now - t0) / DUR);
      if (pct) pct.textContent = Math.round(ease(p) * 100);
      if (txt) txt.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p * msgs.length))];
      if (p < 1) requestAnimationFrame(tick);
      else if (document.readyState === 'complete') endLoader();
      else window.addEventListener('load', endLoader, { once: true });
    };
    requestAnimationFrame(tick);
    setTimeout(endLoader, 2000); // tope duro: el cargador nunca pasa de ~2.5 s
  });

  /* ---------- Encabezado, progreso y menú móvil ---------- */
  const header = $('#siteHeader');
  const bar = $('#scrollBar');
  function updHeader() {
    const y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-stuck', y > 30);
    const max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? clamp(y / max) : 0).toFixed(4) + ')';
  }

  safe(() => {
    const burger = $('#burger');
    const menu = $('#menuMovil');
    if (!burger || !menu) return;
    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('no-scroll', open);
    };
    burger.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', () => { if (window.innerWidth >= 960) setOpen(false); });
  });

  /* ---------- Revelado al hacer scroll (con respaldo por geometría) ---------- */
  const rv = $$('.rv');
  const showRv = (el) => el.classList.add('in');
  safe(() => {
    if (RM || !('IntersectionObserver' in window)) { rv.forEach(showRv); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { showRv(e.target); io.unobserve(e.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });
    rv.forEach((el) => io.observe(el));
  });
  function geo() {
    const vh = window.innerHeight;
    rv.forEach((el) => {
      if (el.classList.contains('in')) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 && r.bottom > 0) showRv(el);
    });
  }

  /* ---------- Palabras que se encienden con el scroll (manifiesto) ---------- */
  const wordsEl = $('[data-words]');
  let wordSpans = [];
  safe(() => {
    if (!wordsEl) return;
    const build = (node, parent) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { parent.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.textContent = t;
            parent.appendChild(s);
            wordSpans.push(s);
          });
        } else if (n.nodeType === 1) {
          const c = n.cloneNode(false);
          parent.appendChild(c);
          build(n, c);
        }
      });
    };
    const holder = document.createElement('span');
    holder.style.display = 'contents';
    build(wordsEl, holder);
    wordsEl.textContent = '';
    wordsEl.appendChild(holder);
    if (RM) wordSpans.forEach((s) => s.classList.add('on'));
  });
  function updWords() {
    if (!wordsEl || !wordSpans.length || RM) return;
    const r = wordsEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = clamp((vh * 0.88 - r.top) / (r.height + vh * 0.28));
    const n = Math.round(p * wordSpans.length * 1.08);
    wordSpans.forEach((s, i) => s.classList.toggle('on', i < n));
  }

  /* ---------- Contadores ---------- */
  safe(() => {
    const els = $$('[data-count]');
    if (!els.length || RM || !('IntersectionObserver' in window)) return;
    const run = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const prefix = el.dataset.prefix || '';
      const t0 = performance.now();
      const D = 1700;
      const step = (now) => {
        const p = clamp((now - t0) / D);
        el.textContent = prefix + Math.round(ease(p) * target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  });

  /* ---------- Inclinación 3D en tarjetas con imagen ---------- */
  safe(() => {
    if (RM || !CAN_HOVER) return;
    $$('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 8;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(900px) rotateY(' + (x * max).toFixed(2) + 'deg) rotateX(' + (-y * max).toFixed(2) + 'deg)';
        el.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    // Destello que sigue al cursor en los botones
    $$('.btn').forEach((b) => b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--bx', (e.clientX - r.left) + 'px');
      b.style.setProperty('--by', (e.clientY - r.top) + 'px');
    }));
  });

  /* ---------- Hero: red de rutas (canvas) + parallax del puntero ---------- */
  safe(() => {
    const hero = $('#inicio');
    const cv = $('#heroCanvas');
    if (!hero) return;

    // Parallax suave del escenario 3D con el puntero
    if (!RM && CAN_HOVER) {
      hero.addEventListener('pointermove', (e) => {
        hero.style.setProperty('--mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        hero.style.setProperty('--my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
      hero.addEventListener('pointerleave', () => { hero.style.setProperty('--mx', 0); hero.style.setProperty('--my', 0); });
    }

    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, nodes = [], pulses = [], visible = true;
    const mouse = { x: -999, y: -999, on: false };

    const link = () => (W < 720 ? 110 : 150);
    const seed = () => {
      const n = W < 720 ? 30 : Math.min(72, Math.round((W * H) / 26000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.5 + 0.7, cu: Math.random() < 0.3
      }));
      pulses = [];
    };
    const resize = (force) => {
      const r = hero.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      if (!force && Math.abs(w - W) < 2 && Math.abs(h - H) < 120) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = w; H = h;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (RM) draw();
    };

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const L = link();
      if (!RM) {
        nodes.forEach((n) => {
          n.x += n.vx; n.y += n.vy;
          if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
          if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
        });
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < L * L) {
            const al = (1 - Math.sqrt(d2) / L) * 0.38;
            ctx.strokeStyle = (a.cu || b.cu) ? 'rgba(240,169,140,' + al + ')' : 'rgba(130,170,255,' + (al * 0.7) + ')';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      // Pulsos de "talento" viajando por las rutas
      if (!RM && pulses.length < 12 && nodes.length && Math.random() < 0.05) {
        const i = (Math.random() * nodes.length) | 0;
        const a = nodes[i];
        let best = -1;
        for (let j = 0; j < nodes.length; j++) {
          if (j === i) continue;
          const dx = a.x - nodes[j].x, dy = a.y - nodes[j].y;
          if (dx * dx + dy * dy < L * L) { best = j; if (Math.random() < 0.3) break; }
        }
        if (best >= 0) pulses.push({ a: i, b: best, t: 0, s: 0.008 + Math.random() * 0.012 });
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.t += p.s;
        if (p.t >= 1) { pulses.splice(k, 1); continue; }
        const a = nodes[p.a], b = nodes[p.b];
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, 'rgba(255,225,205,.95)'); g.addColorStop(1, 'rgba(240,169,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.2832); ctx.fill();
      }
      nodes.forEach((n) => {
        ctx.fillStyle = n.cu ? 'rgba(240,169,140,.9)' : 'rgba(190,210,255,.7)';
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.2832); ctx.fill();
      });
      if (mouse.on) {
        nodes.forEach((n) => {
          const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (d < 170) {
            ctx.strokeStyle = 'rgba(255,214,190,' + ((1 - d / 170) * 0.5) + ')';
            ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        });
      }
    }

    resize(true);
    window.addEventListener('resize', () => resize(false), { passive: true });
    if (RM) return;
    if (CAN_HOVER) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.on = true;
      });
      hero.addEventListener('pointerleave', () => { mouse.on = false; });
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }
    const loop = () => { if (visible && !document.hidden) draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });

  /* ---------- Hero: texto que cambia ("Hoy buscamos…") ---------- */
  safe(() => {
    const el = $('#rot');
    if (!el || RM) return;
    const words = [
      'Operadores de quinta rueda',
      'Operadores de Torton y Rabón',
      'Operadores de camionetas 1.5 y 3.5',
      'Montacarguistas',
      'Ayudantes generales',
      'Personal administrativo',
      'Personal operativo'
    ];
    const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
    let i = 0, busy = false;
    const swap = (next) => {
      if (busy) return;
      busy = true;
      const total = 22;
      let f = 0;
      const id = setInterval(() => {
        f++;
        let out = '';
        for (let k = 0; k < next.length; k++) {
          out += (k < next.length * (f / total) || next[k] === ' ') ? next[k] : glyphs[(Math.random() * glyphs.length) | 0];
        }
        el.textContent = out;
        if (f >= total) { clearInterval(id); el.textContent = next; busy = false; }
      }, 32);
    };
    setTimeout(() => {
      setInterval(() => { i = (i + 1) % words.length; swap(words[i]); }, 3000);
    }, 4200);
  });

  /* ---------- Cine: la imagen se abre con el scroll ---------- */
  const cinema = $('#cinema');
  function updCinema() {
    if (!cinema || RM) return;
    const r = cinema.getBoundingClientRect();
    const total = r.height - window.innerHeight;
    if (total <= 0) return;
    const p = clamp(-r.top / total);
    const e = ease(clamp(p / 0.55));
    const t = clamp((p - 0.5) / 0.3);
    cinema.style.setProperty('--e', e.toFixed(4));
    cinema.style.setProperty('--t', t.toFixed(4));
  }

  /* ---------- Perfiles: tarjetas apiladas que se atenúan ---------- */
  const stackCards = $$('.pcard');
  function updStack() {
    if (!stackCards.length || RM) return;
    stackCards.forEach((c, i) => {
      const nx = stackCards[i + 1];
      if (!nx) return;
      const inner = c.firstElementChild;
      const stick = 84 + (i + 1) * 12;
      const p = clamp(1 - (nx.getBoundingClientRect().top - stick) / (window.innerHeight * 0.55));
      inner.style.transform = p > 0 ? 'scale(' + (1 - 0.045 * p).toFixed(4) + ')' : '';
      inner.style.setProperty('--dim', (p * 0.5).toFixed(3));
    });
  }

  /* ---------- Operación: lista que se recorre sola ---------- */
  safe(() => {
    const list = $('#opList');
    if (!list) return;
    const items = $$('.op-item', list);
    const num = $('#opNum');
    let cur = 0;
    const set = (i) => {
      cur = i;
      items.forEach((it, k) => {
        const on = k === i;
        it.classList.toggle('is-on', on);
        const b = $('.op-btn', it);
        if (b) b.setAttribute('aria-expanded', String(on));
      });
      if (num) num.textContent = String(i + 1).padStart(2, '0');
    };
    items.forEach((it, i) => {
      const b = $('.op-btn', it);
      if (b) b.addEventListener('click', () => { if (cur !== i) set(i); });
      const fill = $('.op-bar i', it);
      if (fill) fill.addEventListener('animationend', () => { if (it.classList.contains('is-on')) set((i + 1) % items.length); });
    });
  });

  /* ---------- Proceso: el camión recorre la ruta con el scroll ---------- */
  const ruta = $('#ruta');
  let rutaLen = 0, rutaPts = [];
  const rEls = ruta ? {
    svg: $('#rutaSvg'), base: $('#roadBase'), dash: $('#roadDash'), prog: $('#roadProg'),
    truck: $('#truck'), steps: $$('.step', ruta)
  } : null;

  function buildRuta() {
    if (!rEls || !rEls.svg || !rEls.prog) return;
    const W = ruta.clientWidth, H = ruta.clientHeight;
    if (!W || !H) return;
    rEls.svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const wide = W >= 820 && window.innerWidth >= 960;
    const wr = ruta.getBoundingClientRect();
    rutaPts = rEls.steps.map((s, i) => {
      const r = s.getBoundingClientRect();
      const y = r.top - wr.top + 41;
      const x = wide ? W * (i % 2 ? 0.545 : 0.455) : (i % 2 ? 31 : 21);
      return [x, y];
    });
    const pts = [[wide ? W * 0.5 : 26, 0]].concat(rutaPts, [[wide ? W * 0.5 : 26, H]]);
    let d = 'M ' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[k], b = pts[k + 1], ym = (a[1] + b[1]) / 2;
      d += ' C ' + a[0].toFixed(1) + ' ' + ym.toFixed(1) + ', ' + b[0].toFixed(1) + ' ' + ym.toFixed(1) + ', ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    }
    [rEls.base, rEls.dash, rEls.prog].forEach((p) => p.setAttribute('d', d));
    rutaLen = rEls.prog.getTotalLength();
    rEls.prog.style.strokeDasharray = rutaLen;
    ruta.classList.add('is-ready');
    updRuta();
  }
  function updRuta() {
    if (!rEls || !rutaLen) return;
    const r = ruta.getBoundingClientRect();
    const p = clamp((window.innerHeight * 0.6 - r.top) / r.height);
    const L = p * rutaLen;
    rEls.prog.style.strokeDashoffset = rutaLen - L;
    const a = rEls.prog.getPointAtLength(L);
    const b = rEls.prog.getPointAtLength(Math.min(rutaLen, L + 2));
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    rEls.truck.setAttribute('transform', 'translate(' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    rEls.steps.forEach((s, i) => { if (rutaPts[i]) s.classList.toggle('on', rutaPts[i][1] <= a.y + 24); });
  }

  /* ---------- Parallax suave de decoraciones ---------- */
  const parEls = $$('[data-par]');
  function updPar() {
    if (RM || !parEls.length) return;
    const vh = window.innerHeight;
    parEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const f = parseFloat(el.dataset.par) || 0;
      el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * f * 10).toFixed(1) + 'px,0)';
    });
  }

  /* ---------- Formulario → WhatsApp ---------- */
  safe(() => {
    const form = $('#formContacto');
    if (!form) return;

    // Los botones de "Quiero este perfil" / "Soy empresa" precargan el formulario
    $$('a[data-perfil], a[data-tipo]').forEach((a) => a.addEventListener('click', () => {
      if (a.dataset.tipo) {
        const r = form.querySelector('input[name="tipo"][value="' + a.dataset.tipo + '"]');
        if (r) r.checked = true;
      }
      if (a.dataset.perfil) {
        const s = form.querySelector('select[name="perfil"]');
        if (s) s.value = a.dataset.perfil;
      }
    }));

    const err = $('#formErr');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const val = (k) => String(f.get(k) || '').trim();
      const nombre = val('nombre');
      if (!nombre) {
        if (err) { err.hidden = false; }
        const campo = form.querySelector('input[name="nombre"]');
        if (campo) campo.focus();
        return;
      }
      if (err) err.hidden = true;
      if (!WHATSAPP_NUMBER) return;

      const tipo = val('tipo') === 'candidato' ? 'busco empleo como operador / candidato' : 'represento a una empresa';
      const lineas = [
        'Hola MJL Reclutamiento Especializado 👋',
        'Soy ' + nombre + ' y ' + tipo + '.',
        val('empresa') ? 'Empresa: ' + val('empresa') : '',
        val('perfil') ? 'Perfil de interés: ' + val('perfil') : '',
        val('telefono') ? 'Mi teléfono: ' + val('telefono') : '',
        val('mensaje') ? 'Detalles: ' + val('mensaje') : ''
      ].filter(Boolean);
      lineas.push('', 'Los contacto desde su página web.');
      const url = waURL(lineas.join('\n'));
      const w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
    });
    const campoNombre = form.querySelector('input[name="nombre"]');
    if (campoNombre) campoNombre.addEventListener('input', () => { if (err) err.hidden = true; });
  });

  /* ---------- Año del pie ---------- */
  safe(() => { const y = $('#year'); if (y) y.textContent = new Date().getFullYear(); });

  /* ---------- Orquestador de scroll ---------- */
  let ticking = false;
  function frame() {
    ticking = false;
    safe(updHeader);
    safe(updWords);
    safe(updCinema);
    safe(updStack);
    safe(updRuta);
    safe(updPar);
    safe(geo);
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(frame);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { safe(buildRuta); onScroll(); }, { passive: true });
  window.addEventListener('load', () => { safe(buildRuta); onScroll(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { safe(buildRuta); onScroll(); });

  safe(buildRuta);
  frame();
  // Respaldo: unos 2 s después, revela todo lo que ya esté dentro de la ventana
  setTimeout(() => { safe(buildRuta); safe(geo); onScroll(); }, 2000);
  setTimeout(() => { safe(buildRuta); safe(geo); }, 4500);
})();
