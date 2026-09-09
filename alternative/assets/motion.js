/* ============================================================
   SolarHai — Motion Layer (alternative)
   Laeuft nach script.js. Baut die Bewegungsschicht auf:
   Wortmasken, gestaffelte Eintritte, Zeigerlicht, magnetische
   Knoepfe und der Kreisuebergang zwischen den Seiten.
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  document.body.classList.add('motion');

  /* ---------- Fortschrittsbalken ---------- */
  if (!reduced) {
    const bar = document.createElement('div');
    bar.className = 'progress';
    document.body.prepend(bar);

    // Browser ohne scrollgetriebene Animationen bekommen den Balken aus JS.
    if (!CSS.supports('animation-timeline', 'scroll()')) {
      let queued = false;
      const paint = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
        queued = false;
      };
      window.addEventListener('scroll', () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(paint);
      }, { passive: true });
      paint();
    }
  }

  /* ---------- Navigation verdichten ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    let queued = false;
    const check = () => {
      nav.classList.toggle('is-condensed', window.scrollY > 24);
      queued = false;
    };
    window.addEventListener('scroll', () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(check);
    }, { passive: true });
    check();
  }

  /* ---------- Titel in Woerter zerlegen ----------
     Nur Textknoten werden zerlegt; Elementkinder (<span class="v">, <br>)
     bleiben als ganze Einheit erhalten, damit Auszeichnung und Umbrueche
     der Vorlage stehen bleiben. */
  function wrapWord(text) {
    const outer = document.createElement('span');
    outer.className = 'split';
    const inner = document.createElement('span');
    inner.className = 'split__i';
    inner.textContent = text;
    outer.appendChild(inner);
    return outer;
  }

  function wrapNode(node) {
    const outer = document.createElement('span');
    outer.className = 'split';
    const inner = document.createElement('span');
    inner.className = 'split__i';
    inner.appendChild(node);
    outer.appendChild(inner);
    return outer;
  }

  function splitHeading(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    const pieces = [];
    Array.from(el.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { pieces.push(document.createTextNode(' ')); return; }
          pieces.push(wrapWord(part));
        });
      } else if (node.nodeName === 'BR') {
        pieces.push(node);
      } else {
        pieces.push(wrapNode(node));
      }
    });
    el.replaceChildren(...pieces);

    let i = 0;
    el.querySelectorAll('.split').forEach(part => {
      part.style.setProperty('--d', (i * 55) + 'ms');
      i++;
    });
  }

  const headings = document.querySelectorAll(
    '.hero__inner h1, .pagehead__inner h1, .section__head h2, .cta__inner h2'
  );
  headings.forEach(splitHeading);

  /* ---------- Eintritte vorbereiten ---------- */
  // Gruppen bekommen eine Staffel, damit Karten nacheinander erscheinen.
  function stagger(container, selector, step) {
    const items = container.querySelectorAll(selector);
    items.forEach((el, i) => {
      el.classList.add('m-rise');
      el.style.setProperty('--d', Math.min(i, 6) * step + 'ms');
    });
  }

  document.querySelectorAll('.cards, .steps, .tally, .faq, .socials, .contact-cards, .projects')
    .forEach(group => stagger(group, ':scope > *', 70));

  document.querySelectorAll(
    '.section__head > .lead, .section__head > .actions, .card, .step, .project, .contact-card, .obj, .job, .faq__item, .teamshot, .plan, .content-video'
  ).forEach(el => {
    if (!el.classList.contains('m-rise')) el.classList.add('m-rise');
  });

  document.querySelectorAll('.media__img, .project__img, .photo img, .content-video video')
    .forEach(el => el.classList.add('m-clip'));

  document.querySelectorAll('.hero .badges li').forEach((li, i) => {
    li.style.setProperty('--i', i);
  });

  /* ---------- Sichtbarkeit beobachten ---------- */
  const watched = document.querySelectorAll('.m-rise, .m-clip, .split, .step');

  if (reduced || !('IntersectionObserver' in window)) {
    watched.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    watched.forEach(el => io.observe(el));

    // Was beim Laden schon im Bild steht, soll nicht auf den Beobachter warten.
    requestAnimationFrame(() => {
      watched.forEach(el => {
        const box = el.getBoundingClientRect();
        if (box.top < window.innerHeight * 0.9 && box.bottom > 0) el.classList.add('is-in');
      });
    });

    // Notausgang: nichts darf dauerhaft unsichtbar bleiben.
    setTimeout(() => watched.forEach(el => {
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('is-in');
    }), 2500);
  }

  /* ---------- Zeigerlicht auf Karten ---------- */
  if (fine && !reduced) {
    document.querySelectorAll('.card, .project, .contact-card').forEach(card => {
      const glow = document.createElement('i');
      glow.className = 'glow';
      glow.setAttribute('aria-hidden', 'true');
      card.prepend(glow);

      // Der Versatz landet direkt auf dem Element statt in einer CSS-Variablen:
      // eine Variable auf der Karte wuerde alle Kinder neu berechnen lassen.
      card.addEventListener('pointermove', (e) => {
        const box = card.getBoundingClientRect();
        glow.style.transform =
          'translate3d(' + (e.clientX - box.left) + 'px,' + (e.clientY - box.top) + 'px,0)';
      }, { passive: true });
    });
  }

  /* ---------- Magnetische Hauptknoepfe ---------- */
  if (fine && !reduced) {
    document.querySelectorAll('.btn--lg').forEach(btn => {
      let raf = 0;
      let cx = 0, cy = 0, tx = 0, ty = 0;

      const loop = () => {
        // Nachlaufende Interpolation: der Knopf zieht mit Traegheit nach,
        // statt der Maus hart zu folgen.
        cx += (tx - cx) * 0.18;
        cy += (ty - cy) * 0.18;
        btn.style.setProperty('--mx', cx.toFixed(2) + 'px');
        btn.style.setProperty('--my', cy.toFixed(2) + 'px');
        if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = 0;
        }
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

      btn.addEventListener('pointermove', (e) => {
        const box = btn.getBoundingClientRect();
        tx = (e.clientX - (box.left + box.width / 2)) * 0.22;
        ty = (e.clientY - (box.top + box.height / 2)) * 0.32;
        kick();
      }, { passive: true });

      btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
    });
  }

  /* ---------- Seitenuebergang: Kreis vom Klickpunkt ---------- */
  const KEY = 'solarhai:vt-origin';

  function rememberOrigin(x, y) {
    const px = Math.round((x / window.innerWidth) * 100);
    const py = Math.round((y / window.innerHeight) * 100);
    root.style.setProperty('--vt-x', px + '%');
    root.style.setProperty('--vt-y', py + '%');
    try { sessionStorage.setItem(KEY, px + ',' + py); } catch (err) { /* privater Modus */ }
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || link.target === '_blank') return;
    if (link.origin !== window.location.origin) return;
    rememberOrigin(e.clientX, e.clientY);
  }, true);

  // Beim Verlassen liegt der Ursprung schon fest; beim Ankommen wird er
  // gesetzt, bevor der neue Schnappschuss animiert wird.
  window.addEventListener('pagereveal', () => {
    root.dataset.vt = '1';
    let saved = null;
    try {
      saved = sessionStorage.getItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch (err) { /* privater Modus */ }
    if (!saved) return;
    const [x, y] = saved.split(',');
    root.style.setProperty('--vt-x', x + '%');
    root.style.setProperty('--vt-y', y + '%');
  });
})();

/* ============================================================
   Titelbild: in das Solarmodul des Fotos zoomen
   Der Weg ist genau eine Hero-Hoehe lang. Das feste Titelbild
   faehrt dabei auf das Modul zu und gibt danach den Abschnitt
   mit dem Video darunter frei.
   ============================================================ */
(() => {
  'use strict';

  const dive = document.getElementById('dive');
  if (!dive) return;

  const hero = dive.closest('.hero');
  const photo = document.getElementById('divePhoto');
  const scrim = document.getElementById('diveScrim');
  const inner = hero && hero.querySelector('.hero__inner');
  if (!hero || !photo || !inner) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Lage des Solarmoduls im Foto, als Anteil der Bildbreite und -hoehe.
  const MODULE_X = 0.858;   // Mitte
  const MODULE_Y = 0.68;
  const MODULE_W = 0.225;   // Breite

  // Das Bild ist mit object-fit:cover zugeschnitten. Der Ursprung des Zooms
  // zaehlt aber vom Elementrahmen, nicht vom Bildinhalt — also den
  // Zuschnitt nachrechnen, sonst zoomt man am Modul vorbei.
  // Wo das Modul im Rahmen liegt, wie weit es zur Bildmitte muss und
  // wie stark vergroessert werden muss, damit es den Rahmen fuellt.
  let shiftX = 0;
  let shiftY = 0;
  let maxZoom = 7;

  function setOrigin() {
    const iw = photo.naturalWidth;
    const ih = photo.naturalHeight;
    if (!iw || !ih) return;
    const bw = dive.clientWidth;
    const bh = dive.clientHeight;

    // Der Zuschnitt wird selbst gerechnet statt mit object-fit:cover.
    // object-fit schneidet das Bild schon vor der Vergroesserung weg — auf
    // schmalen Bildschirmen faellt das Modul dabei ganz aus dem Element,
    // und kein Zoom der Welt holt es zurueck.
    const cover = Math.max(bw / iw, bh / ih);
    const rw = iw * cover;
    const rh = ih * cover;

    let offX = (bw - rw) / 2;
    const moduleAt = MODULE_X * rw;
    // Faellt das Modul aus dem mittigen Zuschnitt, wird der Ausschnitt so
    // weit nach rechts geschoben, dass es gerade am Rand steht — der Mann
    // und die Halle bleiben dabei im Bild. Nie so weit, dass an einer
    // Kante Leere entsteht.
    if (moduleAt + offX > bw) {
      offX = Math.max(Math.min(bw - rw, 0), Math.min(0, bw - moduleAt));
    }
    const offY = (bh - rh) / 2;

    photo.style.width = rw.toFixed(1) + 'px';
    photo.style.height = rh.toFixed(1) + 'px';
    photo.style.left = offX.toFixed(1) + 'px';
    photo.style.top = offY.toFixed(1) + 'px';
    photo.style.right = 'auto';
    photo.style.bottom = 'auto';
    photo.style.objectFit = 'fill';
    photo.style.transformOrigin = (MODULE_X * 100).toFixed(2) + '% ' + (MODULE_Y * 100).toFixed(2) + '%';

    // Der Ursprung bleibt beim Vergroessern an seinem Platz — das Modul
    // steht aber am Rand. Ohne diese Verschiebung zoomt man zwar auf das
    // Modul, es bleibt jedoch aus der Mitte geschoben.
    shiftX = bw / 2 - (moduleAt + offX);
    shiftY = bh / 2 - (MODULE_Y * rh + offY);

    // Ein fester Faktor waere falsch: auf einem schmalen Bildschirm fuellt
    // das Modul den Rahmen schon bei knapp dem Doppelten, auf einem breiten
    // erst beim Vierfachen.
    maxZoom = Math.max(1.5, bw / (MODULE_W * rw) * 1.55);
  }

  const smoothStep = v => v * v * (3 - 2 * v);

  let queued = false;

  function paint() {
    queued = false;
    const span = hero.offsetHeight || window.innerHeight;
    let p = window.scrollY / span;
    p = p < 0 ? 0 : p > 1 ? 1 : p;

    // Der Weg zum Fuellfaktor darf nicht zu spaet einsetzen, sonst steht
    // der Mann noch halb im Bild, wenn man laengst drin sein sollte.
    const zoom = 1 + Math.pow(p, 1.25) * (maxZoom - 1);
    // Das Modul rueckt waehrend der Anfahrt in die Bildmitte.
    const t = p < 0.55 ? smoothStep(p / 0.55) : 1;
    // Gegen Ende leicht verwischen — das Foto hat nur 1535 Pixel Breite,
    // ohne die Unschaerfe wirkt der Zoom am Schluss einfach nur matschig.
    const blur = p > 0.62 ? (p - 0.62) * 12 : 0;
    photo.style.transform =
      'translate3d(' + (shiftX * t).toFixed(1) + 'px,' + (shiftY * t).toFixed(1) + 'px,0) ' +
      'scale(' + zoom.toFixed(3) + ')';
    photo.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';

    // Der Schleier weicht, sobald die Schrift verschwindet: dann liegt
    // nichts mehr darauf, was gelesen werden muss.
    if (scrim) {
      const veil = p < 0.18 ? 1 : Math.max(0, 1 - (p - 0.18) / 0.42);
      scrim.style.opacity = veil.toFixed(3);
    }

    // Erst ganz zum Schluss den Blick auf den naechsten Abschnitt freigeben.
    const fade = p < 0.72 ? 1 : 1 - (p - 0.72) / 0.28;
    dive.style.opacity = fade.toFixed(3);
    dive.classList.toggle('is-done', p >= 0.999);

    // Die Schrift zieht sich vorher zurueck, sonst klebt sie im Modul.
    inner.style.transform =
      'translate3d(0,' + (-p * 90).toFixed(1) + 'px,0) scale(' + (1 - p * 0.06).toFixed(3) + ')';
    inner.style.opacity = Math.max(0, 1 - p * 1.7).toFixed(3);
    inner.style.filter = p > 0.04 ? 'blur(' + (p * 7).toFixed(2) + 'px)' : 'none';
  }

  function refresh() { setOrigin(); paint(); }

  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  }, { passive: true });

  window.addEventListener('resize', refresh);
  if (photo.complete) refresh();
  else photo.addEventListener('load', refresh, { once: true });
  paint();
})();
