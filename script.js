// ── SCROLL: progress bar + nav state + hero parallax ──
const prog      = document.getElementById('prog');
const nav       = document.getElementById('nav');
const heroMedia = document.querySelector('.hero-media');
let ticking = false;

// Video moves at 30% of scroll speed — background "lags" the page, creating depth.
function parallaxHero(y) {
  if (!heroMedia) return;
  heroMedia.style.transform = `translateY(${y * 0.3}px)`;
}

window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y   = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.width = ((y / max) * 100).toFixed(2) + '%';
    nav.classList.toggle('solid', y > 40);
    parallaxHero(y);
    ticking = false;
  });
}, { passive: true });

parallaxHero(window.scrollY);
window.addEventListener('resize', () => parallaxHero(window.scrollY), { passive: true });

// ── VIDEO CONTROLS (exclusive sound + exclusive playback) ──
const frameVideos = document.querySelectorAll('.frame-video');

function resetVideo(video) {
  video.muted = true;
  video.pause();
  video.currentTime = 0;
  const frame = video.closest('.portrait-frame, .landscape-frame');
  if (!frame) return;
  // Reset sound icon
  const sb = frame.querySelector('.sound-btn');
  if (sb) {
    sb.querySelector('.icon-muted').style.display = '';
    sb.querySelector('.icon-sound').style.display = 'none';
  }
  // Show play overlay if portrait
  const overlay = frame.querySelector('.play-overlay');
  if (overlay) overlay.classList.remove('hidden');
}

// Sound toggles — only one video can have sound at a time
document.querySelectorAll('.sound-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const frame = btn.closest('.portrait-frame, .landscape-frame');
    const video = frame.querySelector('.frame-video');
    const willUnmute = video.muted;

    if (willUnmute) {
      // Reset all other videos when turning sound on
      frameVideos.forEach(v => { if (v !== video) resetVideo(v); });
      video.muted = false;
    } else {
      video.muted = true;
    }

    btn.querySelector('.icon-muted').style.display = video.muted ? '' : 'none';
    btn.querySelector('.icon-sound').style.display  = video.muted ? 'none' : '';
  });
});

// Play overlays — clicking play pauses + resets all other videos, auto-unmutes
document.querySelectorAll('.play-overlay').forEach(overlay => {
  overlay.addEventListener('click', () => {
    const frame = overlay.closest('.portrait-frame, .landscape-frame');
    const video = frame.querySelector('.frame-video');
    frameVideos.forEach(v => { if (v !== video) resetVideo(v); });
    // Auto-unmute when play is pressed
    video.muted = false;
    const sb = frame.querySelector('.sound-btn');
    if (sb) {
      sb.querySelector('.icon-muted').style.display = 'none';
      sb.querySelector('.icon-sound').style.display = '';
    }
    video.play();
    overlay.classList.add('hidden');
  });
});

// ── VIDEO CONTROLS (progress, seek, play/pause, fullscreen) ──
document.querySelectorAll('.portrait-frame, .landscape-frame').forEach(frame => {
  const video = frame.querySelector('.frame-video');
  const fill  = frame.querySelector('.vc-fill');
  const bar   = frame.querySelector('.vc-bar');
  const fsBtn = frame.querySelector('.vc-fullscreen');
  const ppBtn = frame.querySelector('.vc-playpause');
  if (!video || !fill || !bar) return;

  // Progress fill
  video.addEventListener('timeupdate', () => {
    if (video.duration) fill.style.width = (video.currentTime / video.duration * 100) + '%';
  });

  // Seek on click
  bar.addEventListener('click', e => {
    e.stopPropagation();
    const rect = bar.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (video.duration) video.currentTime = pct * video.duration;
  });

  // Fullscreen — use frame div so portrait stays portrait (pillarbox, not stretched)
  const exitBtn = frame.querySelector('.vc-exit-fs');
  if (fsBtn) {
    fsBtn.addEventListener('click', e => {
      e.stopPropagation();
      if      (frame.requestFullscreen)       frame.requestFullscreen();
      else if (frame.webkitRequestFullscreen)  frame.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen)    video.webkitEnterFullscreen();
    });
  }
  if (exitBtn) {
    exitBtn.addEventListener('click', e => {
      e.stopPropagation();
      if      (document.exitFullscreen)       document.exitFullscreen();
      else if (document.webkitExitFullscreen)  document.webkitExitFullscreen();
    });
  }

  // Play/Pause button
  function syncPlayIcon(paused) {
    if (!ppBtn) return;
    ppBtn.querySelector('.icon-play').style.display  = paused ? '' : 'none';
    ppBtn.querySelector('.icon-pause').style.display = paused ? 'none' : '';
  }

  if (ppBtn) {
    ppBtn.addEventListener('click', e => {
      e.stopPropagation();
      if (video.paused) {
        frameVideos.forEach(v => { if (v !== video) resetVideo(v); });
        video.muted = false;
        const sb = frame.querySelector('.sound-btn');
        if (sb) {
          sb.querySelector('.icon-muted').style.display = 'none';
          sb.querySelector('.icon-sound').style.display = '';
        }
        video.play();
      } else {
        video.pause();
      }
    });

    video.addEventListener('play', () => {
      syncPlayIcon(false);
      const overlay = frame.querySelector('.play-overlay');
      if (overlay) overlay.classList.add('hidden');
    });
    video.addEventListener('pause', () => {
      syncPlayIcon(true);
      const overlay = frame.querySelector('.play-overlay');
      if (overlay) overlay.classList.remove('hidden');
    });
    syncPlayIcon(video.paused);
  }
});

// ── AUTO-MUTE + PAUSE WHEN VIDEO SCROLLS OUT OF VIEW ──
const outOfViewObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) {
      const video = e.target.querySelector('.frame-video');
      if (video && !video.paused) resetVideo(video);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.portrait-frame, .landscape-frame').forEach(frame => {
  outOfViewObserver.observe(frame);
});

// ── MOBILE MENU ──
const navBurger  = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');

function closeMenu() {
  mobileMenu.classList.remove('open');
  navBurger.classList.remove('open');
  document.body.style.overflow = '';
}

if (navBurger && mobileMenu) {
  navBurger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    navBurger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  const mmClose = document.getElementById('mmClose');
  if (mmClose) mmClose.addEventListener('click', closeMenu);
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

// ── SECTION ENTRANCE ANIMATIONS ──
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('in');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.fu, .fl, .reveal').forEach(el => io.observe(el));

// ── CONTACT FORM ──
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('form-btn');
    const success = document.getElementById('form-success');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        contactForm.reset();
        btn.textContent = 'Send Message';
        btn.disabled = false;
        success.style.display = 'block';
        setTimeout(() => { success.style.display = 'none'; }, 5000);
      } else {
        btn.textContent = 'Try Again';
        btn.disabled = false;
      }
    } catch {
      btn.textContent = 'Try Again';
      btn.disabled = false;
    }
  });
}

// ── WEB FORM PRESET BUTTONS ──
document.querySelectorAll('.wb-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.wb-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const msg = document.getElementById('wb-message');
    if (msg) msg.value = btn.dataset.msg;
  });
});

// ── WEB PAGE CONTACT FORM ──
const wbForm = document.getElementById('wb-form');
if (wbForm) {
  wbForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('wb-submit');
    const success = document.getElementById('wb-success');
    btn.textContent = 'Sending…';
    btn.disabled = true;
    try {
      const res = await fetch(wbForm.action, {
        method: 'POST',
        body: new FormData(wbForm),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        wbForm.reset();
        btn.textContent = 'Start My Project →';
        btn.disabled = false;
        success.style.display = 'block';
        setTimeout(() => { success.style.display = 'none'; }, 5000);
      } else {
        btn.textContent = 'Try Again';
        btn.disabled = false;
      }
    } catch {
      btn.textContent = 'Try Again';
      btn.disabled = false;
    }
  });
}

// ── SHOWREEL CROSSFADE (main page only) ──
const slides = document.querySelectorAll('.slide');
const dots   = document.querySelectorAll('.dot');

if (slides.length && dots.length) {
  let cur = 0;

  function goTo(i) {
    slides[cur].classList.remove('active');
    dots[cur].classList.remove('on');
    cur = i;
    slides[cur].classList.add('active');
    dots[cur].classList.add('on');
  }

  let timer = setInterval(() => goTo((cur + 1) % slides.length), 3500);
  dots.forEach((d, i) => d.addEventListener('click', () => {
    goTo(i);
    clearInterval(timer);
    timer = setInterval(() => goTo((cur + 1) % slides.length), 3500);
  }));
}
