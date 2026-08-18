const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Nav toggle (mobile)
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
if (nav && navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  nav.querySelectorAll('.nav__links a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Hero fills the screen below the announcement bar and the sticky nav.
const announce = document.querySelector('.announce');
function setChromeHeight() {
  const bars = (announce ? announce.offsetHeight : 0) + (nav ? nav.offsetHeight : 0);
  document.documentElement.style.setProperty('--chrome-h', bars + 'px');
}
if (document.querySelector('.hero')) {
  setChromeHeight();
  // ResizeObserver instead of a resize listener: fires only when the bars really change
  if ('ResizeObserver' in window) {
    const chromeObserver = new ResizeObserver(setChromeHeight);
    if (announce) chromeObserver.observe(announce);
    if (nav) chromeObserver.observe(nav);
  } else {
    window.addEventListener('resize', setChromeHeight);
  }
}

// Hide the scroll hint once the visitor has left the hero
const heroScroll = document.getElementById('heroScroll');
if (heroScroll) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      heroScroll.classList.toggle('is-hidden', window.scrollY > 80);
      ticking = false;
    });
  }, { passive: true });
}

// Scroll reveal
const revealTargets = document.querySelectorAll('.section__head, .card, .stat, .ref, .step, .faq__item, .chip, .contact__item, .contact-card, .teamshot, .project, .obj, .tally > div, .job');
revealTargets.forEach(el => el.classList.add('reveal'));

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('is-visible'));
}

// Animated counters
const counters = document.querySelectorAll('.counter');
function runCounter(el) {
  const target = Number(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  if (prefersReducedMotion) {
    el.textContent = target + suffix;
    return;
  }
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));
} else {
  counters.forEach(runCounter);
}

// Background videos.
// Missing files are expected until the videos are uploaded — drop the element then,
// so the CSS gradient fallback shows instead of a stalled <video>.
const videos = document.querySelectorAll('.media__video');
videos.forEach(video => {
  video.addEventListener('error', () => video.remove(), true);
});

// Pause offscreen videos to save bandwidth and CPU
if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (!video.isConnected) return;
      if (entry.isIntersecting) {
        video.play().catch(() => {}); // autoplay can be blocked; fallback stays visible
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.1 });
  videos.forEach(v => videoObserver.observe(v));
}

// Anfrage form (no backend yet — shows confirmation only). Only present on ueber-uns.html.
const form = document.getElementById('anfrageForm');
if (form) {
  const success = document.getElementById('formSuccess');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    success.hidden = false;
    form.reset();
    form.querySelectorAll('input, textarea, select, button').forEach(el => { el.disabled = true; });
  });
}

// Safety net: if IntersectionObserver never fires (background tab, blocked API),
// content must not stay invisible and counters must not stay at 0.
setTimeout(() => {
  revealTargets.forEach(el => {
    // only rescue what should already be on screen, so elements further down keep their entrance
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) el.classList.add('is-visible');
  });
  counters.forEach(el => {
    if (el.textContent === '0') el.textContent = el.dataset.target + (el.dataset.suffix || '');
  });
}, 2500);

// Footer year (present on every page)
document.querySelectorAll('.year').forEach(el => {
  el.textContent = new Date().getFullYear();
});

/* ================================================================
   In das Objekt hineinfliegen — Seitenwechsel
   ================================================================ */
(() => {
  const objects = document.querySelectorAll('.obj[href]');
  if (!objects.length) return;
  let leaving = false;

  function flyInto(link, href) {
    leaving = true;
    const art = link.querySelector('.obj__svg') || link;
    const rect = art.getBoundingClientRect();

    const sheet = document.createElement('div');
    sheet.className = 'flyover';

    const clone = art.cloneNode(true);
    clone.removeAttribute('id');
    clone.classList.add('flyover__clone');
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';

    document.body.append(sheet, clone);

    const vw = window.innerWidth, vh = window.innerHeight;
    // so weit vergrössern, dass das Objekt den Bildschirm sicher überfüllt
    const scale = Math.max(vw / rect.width, vh / rect.height) * 2.1;
    const dx = vw / 2 - (rect.left + rect.width / 2);
    const dy = vh / 2 - (rect.top + rect.height / 2);
    const DUR = 520;

    clone.animate(
      [
        { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + scale + ')', opacity: 0 }
      ],
      { duration: DUR, easing: 'cubic-bezier(.55,0,.85,.2)', fill: 'forwards' }
    );
    const cover = sheet.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: DUR, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' }
    );

    let done = false;
    const go = () => { if (!done) { done = true; window.location.href = href; } };
    cover.finished.then(go).catch(go);
    setTimeout(go, DUR + 220);   // Notausgang, falls die Animation nie endet
  }

  objects.forEach(link => {
    link.addEventListener('click', (e) => {
      if (leaving) { e.preventDefault(); return; }
      // Modifikatoren und Mittelklick dem Browser überlassen
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (prefersReducedMotion) return;
      const href = link.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      e.preventDefault();
      try { sessionStorage.setItem('solarhai:fly', '1'); } catch (err) { /* privater Modus */ }
      flyInto(link, href);
    });
  });

  // Zurück-Navigation aus dem Verlaufscache: Reste entfernen
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    document.querySelectorAll('.flyover, .flyover__clone').forEach(el => el.remove());
  });
})();

/* Ankunft: aus dem Weiss heraus, nur nach einem Flug */
(() => {
  let flew = null;
  try {
    flew = sessionStorage.getItem('solarhai:fly');
    if (flew) sessionStorage.removeItem('solarhai:fly');
  } catch (err) { /* privater Modus */ }
  if (flew === '1' && !prefersReducedMotion) document.body.classList.add('is-arriving');
})();
