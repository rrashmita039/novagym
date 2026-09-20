// ===== INPUT SANITIZER =====
function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ===== DARK / LIGHT MODE =====
(function () {
  const btn  = document.getElementById('themeToggle');
  const body = document.body;
  if (!btn) return;
  if (localStorage.getItem('novaTheme') === 'light') body.classList.add('light');
  btn.addEventListener('click', () => {
    const isLight = body.classList.toggle('light');
    localStorage.setItem('novaTheme', isLight ? 'light' : 'dark');
  });
})();

// ===== LOADING SCREEN =====
(function () {
  const loader = document.getElementById('loader');
  const fill   = document.getElementById('loaderFill');
  const text   = document.getElementById('loaderText');
  if (!loader) return;

  const msgs = ['Loading...', 'Preparing...', 'Almost ready...'];
  let pct = 0;
  const interval = setInterval(() => {
    pct += Math.random() * 18 + 8;
    if (pct >= 100) { pct = 100; clearInterval(interval); }
    fill.style.width = pct + '%';
    text.textContent = pct < 40 ? msgs[0] : pct < 80 ? msgs[1] : msgs[2];
    if (pct === 100) setTimeout(() => loader.classList.add('hide'), 300);
  }, 120);
})();

// ===== SCROLL PROGRESS BAR =====
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (scrolled / total * 100) + '%';
  }, { passive: true });
})();

// ===== BUTTON RIPPLE =====
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const r    = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    r.className = 'ripple';
    r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
    this.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });
});

// ===== GALLERY & LIGHTBOX =====
(function () {
  const grid     = document.getElementById('masonryGrid');
  const items    = Array.from(grid.querySelectorAll('.masonry-item'));
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lightboxImg');
  const lbCap    = document.getElementById('lightboxCaption');
  const lbCount  = document.getElementById('lightboxCounter');
  const lbClose  = document.getElementById('lightboxClose');
  const lbPrev   = document.getElementById('lightboxPrev');
  const lbNext   = document.getElementById('lightboxNext');
  const backdrop = document.getElementById('lightboxBackdrop');

  let visibleItems = [...items];
  let currentLb = 0;

  // ---- Filter ----
  document.querySelectorAll('.gf-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gf-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      visibleItems = [];
      items.forEach((item, i) => {
        const match = filter === 'all' || item.dataset.filter === filter;
        item.classList.toggle('hidden', !match);
        if (match) {
          item.classList.remove('visible');
          void item.offsetWidth;
          item.style.animationDelay = (visibleItems.length * 0.07) + 's';
          item.classList.add('visible');
          visibleItems.push(item);
        }
      });
    });
  });

  // Init visible list
  items.forEach(item => { item.classList.add('visible'); visibleItems.push(item); });

  // ---- Lightbox open ----
  function openLightbox(index) {
    currentLb = index;
    renderLightbox();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function renderLightbox() {
    const item    = visibleItems[currentLb];
    const imgDiv  = item.querySelector('.masonry-img');
    const title   = item.querySelector('.masonry-overlay-content h4').textContent;
    const cat     = item.querySelector('.masonry-overlay-content p').textContent;
    const bg      = getComputedStyle(imgDiv).background;
    const ph      = imgDiv.querySelector('.masonry-placeholder');
    const icon    = ph ? ph.querySelector('span').textContent : '';

    lbImg.style.background = bg;
    lbImg.innerHTML = `<div class="masonry-placeholder"><span>${icon}</span><p>${title}</p></div>`;
    lbCap.innerHTML = `<strong>${title}</strong>${cat}`;
    lbCount.textContent = `${currentLb + 1} / ${visibleItems.length}`;
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function navigate(dir) {
    currentLb = (currentLb + dir + visibleItems.length) % visibleItems.length;
    // Animate swap
    lbImg.style.opacity = '0';
    lbImg.style.transform = `translateX(${dir > 0 ? '-30px' : '30px'})`;
    setTimeout(() => {
      renderLightbox();
      lbImg.style.transition = 'none';
      lbImg.style.opacity = '0';
      lbImg.style.transform = `translateX(${dir > 0 ? '30px' : '-30px'})`;
      void lbImg.offsetWidth;
      lbImg.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      lbImg.style.opacity = '1';
      lbImg.style.transform = 'translateX(0)';
    }, 200);
  }

  // Attach click to each item
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const idx = visibleItems.indexOf(item);
      if (idx !== -1) openLightbox(idx);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  backdrop.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => navigate(-1));
  lbNext.addEventListener('click', () => navigate(1));

  // Keyboard nav
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   navigate(-1);
    if (e.key === 'ArrowRight')  navigate(1);
  });

  // Touch swipe in lightbox
  let lbTouchX = 0;
  lightbox.addEventListener('touchstart', e => { lbTouchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const diff = lbTouchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) navigate(diff > 0 ? 1 : -1);
  });
})();

// ===== TESTIMONIALS SLIDER =====
(function () {
  const track      = document.getElementById('testiTrack');
  const dotsWrap   = document.getElementById('testiDots');
  const prevBtn    = document.getElementById('testiPrev');
  const nextBtn    = document.getElementById('testiNext');
  const progressBar = document.getElementById('testiProgressBar');
  const cards      = track.querySelectorAll('.testi-card');
  const total      = cards.length;
  const AUTO_MS    = 5000;   // auto-advance interval
  let current      = 0;
  let autoTimer, progressTimer, progressStart;

  // Build dots
  cards.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'testi-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Slide ${i + 1}`);
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
  });

  function updateDots() {
    dotsWrap.querySelectorAll('.testi-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current)
    );
  }

  function updateCards() {
    cards.forEach((c, i) => c.classList.toggle('active', i === current));
  }

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    updateDots();
    updateCards();
    resetProgress();
  }

  // Progress bar
  function resetProgress() {
    clearInterval(progressTimer);
    clearTimeout(autoTimer);
    progressBar.style.transition = 'none';
    progressBar.style.width = '0%';

    // Force reflow then animate
    void progressBar.offsetWidth;
    progressBar.style.transition = `width ${AUTO_MS}ms linear`;
    progressBar.style.width = '100%';

    autoTimer = setTimeout(() => goTo(current + 1), AUTO_MS);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Pause on hover
  track.addEventListener('mouseenter', () => {
    clearTimeout(autoTimer);
    progressBar.style.animationPlayState = 'paused';
    const computed = getComputedStyle(progressBar).width;
    const trackWidth = getComputedStyle(progressBar.parentElement).width;
    progressBar.style.transition = 'none';
    progressBar.style.width = computed;
  });
  track.addEventListener('mouseleave', () => resetProgress());

  // Touch / swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
  });

  // Init
  updateCards();
  resetProgress();
})();

// ===== PRICING BILLING TOGGLE =====
(function () {
  const billingToggle = document.getElementById('billingToggle');
  const toggleMonthly = document.getElementById('toggleMonthly');
  const toggleAnnual  = document.getElementById('toggleAnnual');
  if (!billingToggle) return;
  let isAnnual = false;

  const annualNotes = {
    basicNote:   { monthly: 29,  annual: 23  },
    premiumNote: { monthly: 59,  annual: 47  },
    eliteNote:   { monthly: 99,  annual: 79  }
  };

  function updatePricing() {
    document.querySelectorAll('.price-num').forEach(el => {
      el.textContent = isAnnual ? el.dataset.annual : el.dataset.monthly;
    });
    Object.entries(annualNotes).forEach(([id, prices]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = isAnnual
        ? `Billed $${prices.annual * 12}/yr — save $${(prices.monthly - prices.annual) * 12}`
        : '';
    });
    toggleMonthly.classList.toggle('active', !isAnnual);
    toggleAnnual.classList.toggle('active', isAnnual);
    billingToggle.classList.toggle('annual', isAnnual);
  }

  billingToggle.addEventListener('click', () => {
    isAnnual = !isAnnual;
    updatePricing();
  });
  updatePricing();
})();

// ===== BMI CALCULATOR =====
const bmiData = {
  underweight: {
    color: '#4fc3f7', dot: '#4fc3f7', cat: 'Underweight', icon: '⚠️',
    advice: 'Your BMI suggests you may be underweight. Focus on nutrient-dense foods, strength training, and consult a nutritionist to build healthy mass safely.'
  },
  normal: {
    color: '#66bb6a', dot: '#66bb6a', cat: 'Normal Weight', icon: '✅',
    advice: 'Great work! You\'re in a healthy weight range. Maintain it with balanced nutrition, regular cardio, and strength training 3–4 times per week.'
  },
  overweight: {
    color: '#ffa726', dot: '#ffa726', cat: 'Overweight', icon: '🏃',
    advice: 'You\'re slightly above the healthy range. Try 150+ mins of cardio weekly, reduce processed foods, and consider a personal trainer to hit your goals.'
  },
  obese: {
    color: '#ef5350', dot: '#ef5350', cat: 'Obese', icon: '🩺',
    advice: 'Your BMI indicates obesity. We strongly recommend speaking with a healthcare professional and starting a structured fitness + nutrition program with our trainers.'
  }
};

let currentUnit = 'metric';

document.querySelectorAll('.unit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentUnit = btn.dataset.unit;
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const isImperial = currentUnit === 'imperial';
    document.getElementById('heightWrap').classList.toggle('hidden', isImperial);
    document.getElementById('heightImperial').classList.toggle('hidden', !isImperial);
    document.getElementById('weightUnit').textContent = isImperial ? 'lbs' : 'kg';
  });
});

document.getElementById('calcBmi').addEventListener('click', () => {
  const errorEl = document.getElementById('bmiError');
  errorEl.textContent = '';
  let heightM, weightKg;

  if (currentUnit === 'metric') {
    const cm = parseFloat(document.getElementById('heightCm').value);
    const kg = parseFloat(document.getElementById('weightVal').value);
    if (!cm || !kg || cm < 50 || cm > 250 || kg < 10 || kg > 300) {
      errorEl.textContent = 'Please enter valid height (50–250 cm) and weight (10–300 kg).';
      return;
    }
    heightM = cm / 100;
    weightKg = kg;
  } else {
    const ft = parseFloat(document.getElementById('heightFt').value) || 0;
    const inch = parseFloat(document.getElementById('heightIn').value) || 0;
    const lbs = parseFloat(document.getElementById('weightVal').value);
    if ((!ft && !inch) || !lbs || lbs < 22 || lbs > 660) {
      errorEl.textContent = 'Please enter valid height and weight.';
      return;
    }
    heightM = ((ft * 12) + inch) * 0.0254;
    weightKg = lbs * 0.453592;
  }

  const bmi = weightKg / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;
  const key = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'normal' : bmi < 30 ? 'overweight' : 'obese';
  const info = bmiData[key];

  // Gauge: clamp BMI 10–40 → 0–100%
  const pct = Math.min(Math.max((bmi - 10) / 30 * 100, 2), 98);

  document.getElementById('bmiScore').textContent = bmiRounded;
  document.getElementById('bmiScore').style.color = info.color;
  document.getElementById('bmiCategory').textContent = info.cat;
  document.getElementById('bmiCategoryDot').style.background = info.dot;
  document.getElementById('bmiCategoryBadge').style.borderColor = info.dot;
  document.getElementById('bmiAdviceIcon').textContent = info.icon;
  document.getElementById('bmiAdviceText').textContent = info.advice;
  document.getElementById('bmiGaugeMarker').style.left = pct + '%';
  document.getElementById('bmiGaugeFill').style.width = (100 - pct) + '%';
  document.getElementById('bmiGaugeFill').style.left = pct + '%';

  document.querySelectorAll('.bmi-range-card').forEach(c => {
    c.classList.toggle('active-range', c.dataset.cat === key);
  });

  document.getElementById('bmiIdle').style.display = 'none';
  const resultEl = document.getElementById('bmiResult');
  resultEl.classList.remove('show');
  void resultEl.offsetWidth; // reflow to re-trigger animation
  resultEl.classList.add('show');
});

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const mobileClose = document.getElementById('mobileClose');

function openMenu() {
  mobileMenu.classList.add('open');
  hamburger.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});
mobileClose.addEventListener('click', closeMenu);
document.querySelectorAll('.mobile-link, .mobile-join').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// ===== HERO TYPEWRITER =====
const heroWords = ['BODY', 'MIND', 'LIFE', 'FUTURE', 'LIMITS'];
const heroWordEl = document.getElementById('heroWord');
let wordIndex = 0, charIndex = 0, deleting = false;

function typeWriter() {
  const word = heroWords[wordIndex];
  if (!deleting) {
    heroWordEl.textContent = word.slice(0, ++charIndex);
    if (charIndex === word.length) {
      deleting = true;
      setTimeout(typeWriter, 1800);
      return;
    }
  } else {
    heroWordEl.textContent = word.slice(0, --charIndex);
    if (charIndex === 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % heroWords.length;
    }
  }
  setTimeout(typeWriter, deleting ? 70 : 110);
}
setTimeout(typeWriter, 2200);

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.animate-up, .animate-left, .animate-right, .animate-zoom').forEach(el => observer.observe(el));

// ===== PARALLAX =====
(function () {
  const layer = document.getElementById('heroParallax');
  if (!layer) return;
  window.addEventListener('scroll', () => {
    layer.style.transform = `translateY(${window.scrollY * 0.35}px)`;
  }, { passive: true });
})();

// ===== ACTIVE NAV HIGHLIGHT =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const mobileLinks = document.querySelectorAll('.mobile-link');

function setActiveLink(id) {
  [...navLinks, ...mobileLinks].forEach(link => {
    const isActive = link.getAttribute('href') === `#${id}`;
    link.classList.toggle('active', isActive);
  });
}

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) setActiveLink(entry.target.id);
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sectionObserver.observe(s));

// ===== CONTACT FORM =====
(function () {
  const form    = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    cfName:    { el: document.getElementById('cfName'),    err: document.getElementById('errName'),    validate: v => v.trim().length >= 2 ? '' : 'Please enter your full name.' },
    cfEmail:   { el: document.getElementById('cfEmail'),   err: document.getElementById('errEmail'),   validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.' },
    cfService: { el: document.getElementById('cfService'), err: document.getElementById('errService'), validate: v => v ? '' : 'Please select a service.' },
    cfMsg:     { el: document.getElementById('cfMsg'),     err: document.getElementById('errMsg'),     validate: v => v.trim().length >= 10 ? '' : 'Message must be at least 10 characters.' }
  };

  Object.values(fields).forEach(({ el, err, validate }) => {
    if (!el || !err) return;
    el.addEventListener('blur', () => {
      const msg = validate(el.value);
      err.textContent = msg;
      el.classList.toggle('error', !!msg);
      el.classList.toggle('valid', !msg && el.value.trim() !== '');
    });
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) {
        const msg = validate(el.value);
        err.textContent = msg;
        el.classList.toggle('error', !!msg);
        el.classList.toggle('valid', !msg && el.value.trim() !== '');
      }
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    Object.values(fields).forEach(({ el, err, validate }) => {
      if (!el || !err) return;
      const msg = validate(el.value);
      err.textContent = msg;
      el.classList.toggle('error', !!msg);
      el.classList.toggle('valid', !msg && el.value.trim() !== '');
      if (msg) valid = false;
    });
    if (!valid) return;

    const btn = document.getElementById('cfSubmit');
    btn.disabled = true;
    btn.querySelector('.cform-btn-text').textContent = 'Sending...';

    try {
      const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          name:    document.getElementById('cfName').value.trim(),
          email:   document.getElementById('cfEmail').value.trim(),
          phone:   document.getElementById('cfPhone').value.trim(),
          service: document.getElementById('cfService').value,
          message: document.getElementById('cfMsg').value.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send.');
      form.reset();
      Object.values(fields).forEach(({ el }) => el && el.classList.remove('valid', 'error'));
      const success = document.getElementById('cfSuccess');
      success.classList.add('show');
      setTimeout(() => success.classList.remove('show'), 5000);
    } catch (err) {
      document.getElementById('errMsg').textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.querySelector('.cform-btn-text').textContent = 'Send Message';
    }
  });
})();

// ===== COUNTER ANIMATION =====
function animateCounter(el, target, suffix = '') {
  let count = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    count = Math.min(count + step, target);
    el.textContent = count + suffix;
    if (count >= target) clearInterval(timer);
  }, 25);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num');
      const data = [{ val: 12, suffix: '+' }, { val: 5, suffix: 'K+' }, { val: 30, suffix: '+' }];
      nums.forEach((el, i) => animateCounter(el, data[i].val, data[i].suffix));
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

// ===== NEWSLETTER FORM =====
(function () {
  const form    = document.getElementById('newsletterForm');
  const input   = document.getElementById('fnlEmail');
  const err     = document.getElementById('fnlErr');
  const success = document.getElementById('fnlSuccess');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const val = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      err.textContent = 'Please enter a valid email address.';
      return;
    }
    err.textContent = '';
    try {
      const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ email: val })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed.');
      input.value = '';
      success.classList.add('show');
      setTimeout(() => success.classList.remove('show'), 5000);
    } catch (e) {
      err.textContent = e.message;
    }
  });

  input.addEventListener('input', () => { err.textContent = ''; });
})();

// ===== EXERCISE LIBRARY =====
(function () {
  const grid    = document.getElementById('exGrid');
  const modal   = document.getElementById('exModal');
  const backdrop= document.getElementById('exModalBackdrop');
  const closeBtn= document.getElementById('exModalClose');
  if (!grid) return;

  const COLORS = {
    chest:     'linear-gradient(135deg,#3d0a0a,#1a0000)',
    back:      'linear-gradient(135deg,#0a1a2d,#001a3d)',
    legs:      'linear-gradient(135deg,#1a0a2d,#0d0020)',
    arms:      'linear-gradient(135deg,#1a1a00,#2d2000)',
    shoulders: 'linear-gradient(135deg,#001a1a,#002d2d)',
    cardio:    'linear-gradient(135deg,#2d0a00,#1a0500)',
  };

  const EXERCISES = [
    // CHEST
    { id:1, cat:'chest', name:'Bench Press', emoji:'🏋️', diff:'intermediate', muscle:'Pectoralis Major', equip:'Barbell + Bench',
      desc:'The king of chest exercises. Lie flat on a bench and press a barbell from chest to full arm extension, building mass and strength across the entire chest.',
      steps:['Lie flat on bench, feet planted on floor','Grip bar slightly wider than shoulder-width','Unrack bar and lower slowly to mid-chest','Press explosively back to full extension','Keep shoulder blades retracted throughout'] },
    { id:2, cat:'chest', name:'Push-Up', emoji:'💪', diff:'beginner', muscle:'Chest, Triceps, Shoulders', equip:'Bodyweight',
      desc:'A foundational bodyweight movement that builds chest, shoulder, and tricep strength simultaneously. Perfect for all fitness levels with many progressions available.',
      steps:['Start in high plank, hands shoulder-width apart','Keep body in a straight line head to heels','Lower chest to just above the floor','Push back up to full arm extension','Squeeze chest at the top of each rep'] },
    { id:3, cat:'chest', name:'Cable Fly', emoji:'🔀', diff:'intermediate', muscle:'Pectoralis Major (inner)', equip:'Cable Machine',
      desc:'An isolation movement that stretches and contracts the chest through a wide arc, creating a deep muscle pump and targeting the inner chest fibres.',
      steps:['Set cables at shoulder height on both sides','Stand in the centre, slight forward lean','Bring handles together in a hugging arc','Squeeze chest hard at the centre','Slowly return to the stretched position'] },
    // BACK
    { id:4, cat:'back', name:'Deadlift', emoji:'⚡', diff:'advanced', muscle:'Erector Spinae, Glutes, Hamstrings', equip:'Barbell',
      desc:'The ultimate full-body strength exercise. The deadlift builds a thick, powerful back while engaging nearly every muscle in the body from the floor to lockout.',
      steps:['Stand with bar over mid-foot, hip-width stance','Hinge at hips, grip bar just outside legs','Brace core, chest up, neutral spine','Drive through floor, extend hips and knees together','Lock out at top, lower bar under control'] },
    { id:5, cat:'back', name:'Pull-Up', emoji:'🧗', diff:'intermediate', muscle:'Latissimus Dorsi, Biceps', equip:'Pull-Up Bar',
      desc:'The gold standard for back width. Pull-ups develop the lats, biceps, and rear delts while building impressive upper body pulling strength.',
      steps:['Hang from bar with overhand grip, shoulder-width','Depress and retract shoulder blades','Pull elbows down and back toward hips','Chin clears the bar at the top','Lower slowly to full hang — no kipping'] },
    { id:6, cat:'back', name:'Barbell Row', emoji:'🏋️', diff:'intermediate', muscle:'Lats, Rhomboids, Traps', equip:'Barbell',
      desc:'A compound pulling movement that builds back thickness and density. The barbell row targets the entire posterior chain and is essential for a balanced physique.',
      steps:['Hinge forward to ~45°, bar hanging at shins','Grip bar shoulder-width, overhand or underhand','Pull bar to lower chest / upper abdomen','Squeeze shoulder blades together at top','Lower bar under control, maintain hinge'] },
    // LEGS
    { id:7, cat:'legs', name:'Barbell Squat', emoji:'🦵', diff:'intermediate', muscle:'Quads, Glutes, Hamstrings', equip:'Barbell + Rack',
      desc:'The king of lower body exercises. The back squat builds massive quad and glute strength while developing core stability and overall athletic power.',
      steps:['Bar rests on upper traps, feet shoulder-width','Brace core, chest up, slight forward lean','Break at hips and knees simultaneously','Descend until thighs are parallel to floor','Drive through heels to return to standing'] },
    { id:8, cat:'legs', name:'Romanian Deadlift', emoji:'🔥', diff:'intermediate', muscle:'Hamstrings, Glutes', equip:'Barbell or Dumbbells',
      desc:'The best exercise for hamstring development. The RDL creates a deep stretch in the hamstrings and builds the posterior chain from glutes to calves.',
      steps:['Stand tall, bar at hip height, slight knee bend','Hinge at hips, pushing them back behind you','Lower bar along legs, feeling hamstring stretch','Stop when hips can no longer hinge further','Drive hips forward to return to standing'] },
    { id:9, cat:'legs', name:'Leg Press', emoji:'🏔️', diff:'beginner', muscle:'Quads, Glutes', equip:'Leg Press Machine',
      desc:'A machine-based compound movement that allows heavy quad and glute loading with reduced spinal stress. Great for building leg mass safely.',
      steps:['Sit in machine, feet shoulder-width on platform','Lower platform until knees reach 90°','Press through heels to full extension','Do not lock knees at the top','Control the descent on every rep'] },
    // ARMS
    { id:10, cat:'arms', name:'Barbell Curl', emoji:'💪', diff:'beginner', muscle:'Biceps Brachii', equip:'Barbell or EZ Bar',
      desc:'The classic bicep builder. The barbell curl allows maximum loading of the biceps through a full range of motion, building peak and overall arm size.',
      steps:['Stand tall, bar in underhand grip at hip width','Keep elbows pinned to sides throughout','Curl bar up toward shoulders in an arc','Squeeze biceps hard at the top','Lower slowly — the negative builds size too'] },
    { id:11, cat:'arms', name:'Tricep Dip', emoji:'🔽', diff:'intermediate', muscle:'Triceps Brachii', equip:'Parallel Bars or Bench',
      desc:'A compound tricep movement that builds the long, lateral, and medial heads of the triceps. Dips are one of the best mass builders for the back of the arm.',
      steps:['Grip parallel bars, arms fully extended','Lean slightly forward to target triceps more','Lower body until upper arms are parallel','Press back up to full arm extension','Add weight via belt for progressive overload'] },
    { id:12, cat:'arms', name:'Hammer Curl', emoji:'🔨', diff:'beginner', muscle:'Brachialis, Biceps', equip:'Dumbbells',
      desc:'A neutral-grip curl variation that targets the brachialis and brachioradialis, adding thickness to the arm and improving overall elbow flexor strength.',
      steps:['Hold dumbbells at sides, palms facing inward','Keep elbows pinned to torso','Curl both dumbbells up simultaneously','Thumbs point toward ceiling at the top','Lower under control to full extension'] },
    // SHOULDERS
    { id:13, cat:'shoulders', name:'Overhead Press', emoji:'🏋️', diff:'intermediate', muscle:'Deltoids, Triceps, Traps', equip:'Barbell or Dumbbells',
      desc:'The primary shoulder mass builder. The overhead press develops all three deltoid heads while building pressing strength and upper body stability.',
      steps:['Bar at upper chest, grip just outside shoulders','Brace core, glutes tight, slight forward lean','Press bar straight up, clearing the chin','Lock out overhead, bar over mid-foot','Lower bar back to clavicle under control'] },
    { id:14, cat:'shoulders', name:'Lateral Raise', emoji:'↔️', diff:'beginner', muscle:'Lateral Deltoid', equip:'Dumbbells or Cables',
      desc:'The best isolation exercise for building shoulder width. Lateral raises target the medial deltoid head, creating the capped, wide-shoulder look.',
      steps:['Stand tall, dumbbells at sides, slight elbow bend','Raise arms out to sides to shoulder height','Lead with elbows, not wrists','Pause briefly at the top','Lower slowly — 3 seconds on the way down'] },
    { id:15, cat:'shoulders', name:'Face Pull', emoji:'🎯', diff:'beginner', muscle:'Rear Deltoids, Rotator Cuff', equip:'Cable Machine',
      desc:'An essential rear delt and rotator cuff exercise that improves shoulder health, posture, and balances the pushing muscles developed by pressing movements.',
      steps:['Set cable at face height with rope attachment','Grip rope with thumbs pointing back','Pull rope toward face, elbows flaring out','Externally rotate at the end of the movement','Squeeze rear delts and hold for 1 second'] },
    // CARDIO
    { id:16, cat:'cardio', name:'Burpee', emoji:'🔥', diff:'advanced', muscle:'Full Body', equip:'Bodyweight',
      desc:'The ultimate full-body conditioning exercise. Burpees combine a squat, push-up, and jump into one explosive movement that torches calories and builds endurance.',
      steps:['Stand tall, feet shoulder-width apart','Drop hands to floor, jump feet back to plank','Perform a push-up (optional for intensity)','Jump feet back to hands','Explode upward into a jump, arms overhead'] },
    { id:17, cat:'cardio', name:'Jump Rope', emoji:'🪢', diff:'beginner', muscle:'Calves, Shoulders, Core', equip:'Jump Rope',
      desc:'One of the most efficient cardio tools available. Jump rope improves coordination, burns up to 10 calories per minute, and builds calf and shoulder endurance.',
      steps:['Hold handles at hip height, rope behind you','Swing rope overhead and jump as it passes feet','Land softly on the balls of your feet','Keep jumps small — just enough to clear rope','Build to 30-second intervals, then increase'] },
    { id:18, cat:'cardio', name:'Box Jump', emoji:'📦', diff:'intermediate', muscle:'Quads, Glutes, Calves', equip:'Plyo Box',
      desc:'An explosive plyometric exercise that develops lower body power, fast-twitch muscle fibres, and athletic performance. A staple of HIIT and CrossFit training.',
      steps:['Stand facing box, feet shoulder-width apart','Swing arms back and bend knees to load','Explode upward, swinging arms forward','Land softly on top of box, knees slightly bent','Stand tall, then step down — never jump down'] },
  ];

  let activeFilter = 'all';

  function diffClass(d) { return d === 'beginner' ? 'beginner' : d === 'intermediate' ? 'intermediate' : 'advanced'; }

  function renderCards(filter) {
    const list = filter === 'all' ? EXERCISES : EXERCISES.filter(e => e.cat === filter);
    grid.innerHTML = '';
    list.forEach((ex, i) => {
      const card = document.createElement('div');
      card.className = 'ex-card';
      card.style.animationDelay = (i * 0.06) + 's';
      card.innerHTML = `
        <div class="ex-card-visual">
          <div class="ex-card-visual-glow" style="background:${COLORS[ex.cat]}"></div>
          <div class="ex-card-visual-inner">
            <span class="ex-card-emoji">${ex.emoji}</span>
            <span class="ex-card-visual-label">${ex.cat}</span>
          </div>
        </div>
        <div class="ex-card-body">
          <div class="ex-card-top">
            <p class="ex-card-name">${ex.name}</p>
            <span class="ex-diff ${diffClass(ex.diff)}">${ex.diff}</span>
          </div>
          <p class="ex-card-desc">${ex.desc}</p>
          <div class="ex-card-meta">
            <span class="ex-tag muscle">${ex.muscle}</span>
            <span class="ex-tag">${ex.equip}</span>
          </div>
          <button class="ex-demo-btn" data-id="${ex.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Demo
          </button>
        </div>`;
      grid.appendChild(card);
    });
  }

  function openModal(id) {
    const ex = EXERCISES.find(e => e.id === id);
    if (!ex) return;
    document.getElementById('exModalTitle').textContent  = ex.name;
    document.getElementById('exModalDesc').textContent   = ex.desc;
    document.getElementById('exModalMuscle').textContent = ex.muscle;
    document.getElementById('exModalCat').textContent    = ex.cat.charAt(0).toUpperCase() + ex.cat.slice(1);
    document.getElementById('exModalEquip').textContent  = ex.equip;
    const diffEl = document.getElementById('exModalDiff');
    diffEl.textContent  = ex.diff;
    diffEl.className    = 'ex-modal-diff ' + diffClass(ex.diff);
    const visual = document.getElementById('exModalVisual');
    visual.style.background = COLORS[ex.cat];
    visual.innerHTML = `<span style="font-size:5rem;filter:drop-shadow(0 0 24px rgba(230,48,48,0.4))">${ex.emoji}</span>`;
    const ol = document.getElementById('exModalSteps');
    ol.innerHTML = ex.steps.map(s => `<li>${s}</li>`).join('');
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Filter buttons
  document.querySelectorAll('.ex-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.ex-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.cat;
      renderCards(activeFilter);
    });
  });

  // Demo button delegation
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.ex-demo-btn');
    if (btn) openModal(+btn.dataset.id);
  });

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

  renderCards('all');
})();

// ===== DIET PLANNER =====
(function () {
  const generateBtn = document.getElementById('dpGenerate');
  const outputEl    = document.getElementById('dpOutput');
  const errorEl     = document.getElementById('dpError');
  if (!generateBtn) return;

  let gender = 'male', goal = 'loss';

  document.getElementById('dpGender').addEventListener('click', e => {
    const btn = e.target.closest('.dp-toggle-btn');
    if (!btn) return;
    document.querySelectorAll('#dpGender .dp-toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gender = btn.dataset.value;
  });

  document.getElementById('dpGoal').addEventListener('click', e => {
    const btn = e.target.closest('.dp-toggle-btn');
    if (!btn) return;
    document.querySelectorAll('#dpGoal .dp-toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    goal = btn.dataset.value;
  });

  // Calorie calculation: Mifflin-St Jeor simplified (weight-only, assume avg height/age)
  function calcCalories(weightKg, gender, goal) {
    const bmr = gender === 'male'
      ? 10 * weightKg + 625 + 5    // ~175cm, 30yr male
      : 10 * weightKg + 572 - 161; // ~163cm, 30yr female
    const tdee = Math.round(bmr * 1.55); // moderate activity
    if (goal === 'loss')     return Math.round(tdee - 500);
    if (goal === 'gain')     return Math.round(tdee + 400);
    return tdee;
  }

  const MEALS = {
    loss: {
      breakfast: [
        { name: 'Greek Yogurt Bowl', detail: '200g low-fat Greek yogurt + berries', p: 20, c: 22, f: 3, kcal: 195 },
        { name: 'Oats + Egg Whites', detail: '60g oats, 3 egg whites, cinnamon', p: 22, c: 40, f: 4, kcal: 280 },
      ],
      lunch: [
        { name: 'Grilled Chicken Salad', detail: '150g chicken breast, mixed greens, olive oil', p: 38, c: 12, f: 10, kcal: 290 },
        { name: 'Tuna Wrap', detail: '120g tuna, whole-wheat wrap, lettuce, tomato', p: 32, c: 30, f: 5, kcal: 295 },
      ],
      dinner: [
        { name: 'Baked Salmon + Veg', detail: '180g salmon, broccoli, asparagus', p: 40, c: 10, f: 14, kcal: 330 },
        { name: 'Turkey Stir-Fry', detail: '160g turkey mince, peppers, zucchini, soy sauce', p: 36, c: 14, f: 6, kcal: 258 },
      ],
      snacks: [
        { name: 'Apple + Almonds', detail: '1 medium apple, 20g almonds', p: 4, c: 22, f: 10, kcal: 190 },
        { name: 'Cottage Cheese', detail: '150g low-fat cottage cheese + cucumber', p: 18, c: 6, f: 2, kcal: 114 },
      ],
    },
    maintain: {
      breakfast: [
        { name: 'Avocado Toast + Eggs', detail: '2 eggs, 1 slice sourdough, half avocado', p: 18, c: 28, f: 18, kcal: 340 },
        { name: 'Protein Smoothie', detail: '1 scoop whey, banana, oat milk, peanut butter', p: 28, c: 42, f: 10, kcal: 370 },
      ],
      lunch: [
        { name: 'Quinoa Chicken Bowl', detail: '130g chicken, 80g quinoa, roasted veg', p: 40, c: 48, f: 8, kcal: 420 },
        { name: 'Salmon Rice Bowl', detail: '150g salmon, 100g brown rice, edamame', p: 38, c: 50, f: 12, kcal: 460 },
      ],
      dinner: [
        { name: 'Lean Beef + Sweet Potato', detail: '160g lean beef, 200g sweet potato, greens', p: 38, c: 44, f: 10, kcal: 420 },
        { name: 'Chicken Pasta', detail: '130g chicken, 80g whole-wheat pasta, tomato sauce', p: 40, c: 55, f: 7, kcal: 447 },
      ],
      snacks: [
        { name: 'Rice Cakes + PB', detail: '2 rice cakes, 20g peanut butter', p: 6, c: 24, f: 12, kcal: 228 },
        { name: 'Mixed Nuts + Fruit', detail: '30g mixed nuts, 1 orange', p: 6, c: 22, f: 16, kcal: 252 },
      ],
    },
    gain: {
      breakfast: [
        { name: 'Mass Oatmeal', detail: '100g oats, 2 eggs, banana, honey, whole milk', p: 28, c: 80, f: 14, kcal: 556 },
        { name: 'Egg & Cheese Bagel', detail: '3 eggs, 2 slices cheese, whole-grain bagel', p: 32, c: 52, f: 20, kcal: 512 },
      ],
      lunch: [
        { name: 'Beef Rice Bowl', detail: '200g lean beef, 150g white rice, broccoli', p: 50, c: 65, f: 12, kcal: 572 },
        { name: 'Chicken & Pasta', detail: '200g chicken, 120g pasta, olive oil, parmesan', p: 52, c: 72, f: 16, kcal: 640 },
      ],
      dinner: [
        { name: 'Salmon + Potato', detail: '200g salmon, 250g potato, spinach, butter', p: 46, c: 52, f: 20, kcal: 580 },
        { name: 'Steak + Rice', detail: '200g sirloin, 150g rice, mixed veg', p: 52, c: 60, f: 14, kcal: 578 },
      ],
      snacks: [
        { name: 'Mass Shake', detail: '2 scoops whey, oat milk, banana, oats', p: 40, c: 60, f: 8, kcal: 472 },
        { name: 'PB & Banana Toast', detail: '2 slices whole-grain, 30g PB, 1 banana', p: 12, c: 58, f: 18, kcal: 438 },
      ],
    },
  };

  const MEAL_META = [
    { key: 'breakfast', label: 'Breakfast', icon: '&#9728;&#65039;', cls: 'breakfast', split: 0.28 },
    { key: 'lunch',     label: 'Lunch',     icon: '&#127822;',       cls: 'lunch',     split: 0.35 },
    { key: 'dinner',    label: 'Dinner',    icon: '&#127859;',       cls: 'dinner',    split: 0.27 },
    { key: 'snacks',    label: 'Snacks',    icon: '&#127815;',       cls: 'snacks',    split: 0.10 },
  ];

  const TIPS = {
    loss:     '<strong>Fat Loss Tip:</strong> Aim for a 400–500 kcal daily deficit. Prioritise protein (1.8–2g/kg) to preserve muscle. Drink 2.5–3L water daily and avoid liquid calories.',
    maintain: '<strong>Maintenance Tip:</strong> Keep protein at 1.6g/kg bodyweight. Eat whole foods, time carbs around workouts, and track portions loosely to stay on target.',
    gain:     '<strong>Muscle Gain Tip:</strong> Eat in a 300–500 kcal surplus. Hit 2g+ protein per kg. Prioritise carbs post-workout for glycogen replenishment and recovery.',
  };

  generateBtn.addEventListener('click', () => {
    errorEl.textContent = '';
    const weight = parseFloat(document.getElementById('dpWeight').value);
    if (!weight || weight < 30 || weight > 300) {
      errorEl.textContent = 'Please enter a valid weight between 30 and 300 kg.';
      return;
    }

    const totalKcal = calcCalories(weight, gender, goal);
    const protein   = Math.round(weight * (goal === 'gain' ? 2.2 : goal === 'loss' ? 1.9 : 1.7));
    const fat       = Math.round(totalKcal * 0.27 / 9);
    const carbs     = Math.round((totalKcal - protein * 4 - fat * 9) / 4);
    const mealData  = MEALS[goal];

    // Summary bar
    const summaryHTML = `
      <div class="dp-summary">
        <div class="dp-summary-stat"><span class="dp-summary-val">${totalKcal}</span><span class="dp-summary-lbl">Calories / Day</span></div>
        <div class="dp-summary-stat"><span class="dp-summary-val">${protein}g</span><span class="dp-summary-lbl">Protein</span></div>
        <div class="dp-summary-stat"><span class="dp-summary-val">${carbs}g</span><span class="dp-summary-lbl">Carbs</span></div>
        <div class="dp-summary-stat"><span class="dp-summary-val">${fat}g</span><span class="dp-summary-lbl">Fats</span></div>
        <div class="dp-summary-stat"><span class="dp-summary-val">${weight}kg</span><span class="dp-summary-lbl">${gender === 'male' ? 'Male' : 'Female'} &bull; ${goal === 'loss' ? 'Fat Loss' : goal === 'gain' ? 'Muscle Gain' : 'Maintain'}</span></div>
      </div>`;

    // Meal cards
    const cardsHTML = '<div class="dp-meals">' + MEAL_META.map(m => {
      const items = mealData[m.key];
      const mealKcal = Math.round(totalKcal * m.split);
      const itemsHTML = items.map(item => `
        <div class="dp-meal-item">
          <span class="dp-item-name">${sanitizeHTML(item.name)}</span>
          <span class="dp-item-detail">${sanitizeHTML(item.detail)}</span>
          <div class="dp-item-macros">
            <span class="dp-macro p">P ${item.p}g</span>
            <span class="dp-macro c">C ${item.c}g</span>
            <span class="dp-macro f">F ${item.f}g</span>
            <span class="dp-macro p" style="background:rgba(230,48,48,0.1);color:var(--red);border-color:rgba(230,48,48,0.2)">${item.kcal} kcal</span>
          </div>
        </div>`).join('');
      return `
        <div class="dp-meal-card">
          <div class="dp-meal-header">
            <div class="dp-meal-icon ${m.cls}">${m.icon}</div>
            <div>
              <p class="dp-meal-title">${m.label}</p>
              <p class="dp-meal-kcal">~${mealKcal} kcal target</p>
            </div>
          </div>
          <div class="dp-meal-body">
            <div class="dp-meal-items">${itemsHTML}</div>
          </div>
        </div>`;
    }).join('') + '</div>';

    const tipHTML = `<div class="dp-tip"><span class="dp-tip-icon">&#128161;</span><p>${TIPS[goal]}</p></div>`;

    outputEl.innerHTML = summaryHTML + cardsHTML + tipHTML;
  });
})();

// ===== WORKOUT PLANNER =====
(function () {
  const scheduleEl = document.getElementById('plannerSchedule');
  if (!scheduleEl) return;

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const PLANS = {
    weightloss: {
      beginner: [
        { icon: '🚶', title: 'Brisk Walk + Core', tag: 'Cardio', exercises: ['30 min brisk walk', 'Plank 3×30s', 'Crunches 3×15', 'Leg raises 3×12'] },
        { icon: '💪', title: 'Full Body Circuit', tag: 'Strength', exercises: ['Bodyweight squats 3×15', 'Push-ups 3×10', 'Dumbbell rows 3×12', 'Glute bridges 3×15'] },
        { icon: '🧘', title: 'Active Recovery', tag: 'Recovery', exercises: ['20 min yoga', 'Full body stretch', 'Foam rolling', 'Deep breathing'] },
        { icon: '🚴', title: 'Cycling / Bike', tag: 'Cardio', exercises: ['35 min steady cycling', 'Resistance level 4–6', 'Cool-down 5 min', 'Stretch quads & calves'] },
        { icon: '🏋️', title: 'Lower Body', tag: 'Strength', exercises: ['Lunges 3×12 each', 'Step-ups 3×12', 'Wall sit 3×30s', 'Calf raises 3×20'] },
        { icon: '🔥', title: 'HIIT Lite', tag: 'HIIT', exercises: ['20 min HIIT', 'Jumping jacks 4×30s', 'High knees 4×30s', 'Rest 30s between sets'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Light stretching', 'Stay hydrated', 'Meal prep for week'] },
      ],
      intermediate: [
        { icon: '🔥', title: 'HIIT Cardio', tag: 'HIIT', exercises: ['30 min HIIT', 'Burpees 4×12', 'Mountain climbers 4×30s', 'Jump squats 4×15'] },
        { icon: '💪', title: 'Upper Body', tag: 'Strength', exercises: ['Bench press 4×10', 'Pull-ups 3×8', 'Shoulder press 3×12', 'Tricep dips 3×12'] },
        { icon: '🚴', title: 'Steady Cardio', tag: 'Cardio', exercises: ['45 min cycling', 'Moderate intensity', 'Heart rate 130–150 bpm', 'Cool-down 5 min'] },
        { icon: '🏋️', title: 'Lower Body', tag: 'Strength', exercises: ['Barbell squats 4×10', 'Romanian deadlift 3×10', 'Leg press 3×12', 'Walking lunges 3×12'] },
        { icon: '🔥', title: 'Circuit Training', tag: 'HIIT', exercises: ['5 exercises × 4 rounds', 'Kettlebell swings 15', 'Box jumps 12', 'Battle ropes 30s'] },
        { icon: '🧘', title: 'Active Recovery', tag: 'Recovery', exercises: ['30 min yoga flow', 'Foam rolling 15 min', 'Mobility drills', 'Light walk 20 min'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Meal prep', 'Hydration focus', 'Sleep 8 hours'] },
      ],
      advanced: [
        { icon: '🔥', title: 'HIIT + Abs', tag: 'HIIT', exercises: ['45 min HIIT', 'Tabata intervals', 'Dragon flags 3×8', 'Hanging leg raises 4×12'] },
        { icon: '💪', title: 'Push Day', tag: 'Strength', exercises: ['Incline bench 5×5', 'Weighted dips 4×10', 'Cable flyes 4×12', 'Lateral raises 4×15'] },
        { icon: '🏃', title: 'Tempo Run', tag: 'Cardio', exercises: ['5 min warm-up', '25 min tempo run', '5 min cool-down', 'Stretch 10 min'] },
        { icon: '🏋️', title: 'Pull Day', tag: 'Strength', exercises: ['Weighted pull-ups 5×5', 'Barbell rows 4×8', 'Face pulls 4×15', 'Bicep curls 3×12'] },
        { icon: '🔥', title: 'Metabolic Conditioning', tag: 'HIIT', exercises: ['AMRAP 30 min', 'Thrusters 15', 'Box jumps 12', 'Toes-to-bar 10'] },
        { icon: '🏋️', title: 'Leg Day', tag: 'Strength', exercises: ['Back squat 5×5', 'Bulgarian split squat 4×10', 'Leg curl 4×12', 'Calf raises 5×20'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Sauna session', 'Foam rolling', 'Nutrition review'] },
      ],
    },
    muscle: {
      beginner: [
        { icon: '💪', title: 'Chest & Triceps', tag: 'Push', exercises: ['Push-ups 3×12', 'Dumbbell press 3×10', 'Tricep pushdowns 3×12', 'Chest flyes 3×12'] },
        { icon: '🏋️', title: 'Back & Biceps', tag: 'Pull', exercises: ['Dumbbell rows 3×12', 'Lat pulldown 3×10', 'Bicep curls 3×12', 'Face pulls 3×15'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Light walk', 'Stretch', 'Protein-rich meals'] },
        { icon: '🦵', title: 'Legs & Glutes', tag: 'Legs', exercises: ['Goblet squats 3×12', 'Leg press 3×12', 'Romanian deadlift 3×10', 'Glute bridges 3×15'] },
        { icon: '🔝', title: 'Shoulders & Core', tag: 'Shoulders', exercises: ['Dumbbell press 3×12', 'Lateral raises 3×15', 'Front raises 3×12', 'Plank 3×40s'] },
        { icon: '🔄', title: 'Full Body', tag: 'Compound', exercises: ['Deadlift 3×8', 'Bench press 3×10', 'Squat 3×10', 'Pull-ups 3×6'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Foam rolling', 'Meal prep', 'Sleep 8+ hours'] },
      ],
      intermediate: [
        { icon: '💪', title: 'Chest & Triceps', tag: 'Push', exercises: ['Bench press 4×8', 'Incline dumbbell 4×10', 'Cable crossover 3×12', 'Skull crushers 3×10'] },
        { icon: '🏋️', title: 'Back & Biceps', tag: 'Pull', exercises: ['Barbell rows 4×8', 'Pull-ups 4×8', 'Seated cable row 3×12', 'Hammer curls 3×12'] },
        { icon: '🦵', title: 'Legs', tag: 'Legs', exercises: ['Barbell squat 4×8', 'Leg press 4×10', 'Leg curl 3×12', 'Walking lunges 3×12'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Light cardio 20 min', 'Stretch', 'Hydration focus'] },
        { icon: '🔝', title: 'Shoulders & Traps', tag: 'Shoulders', exercises: ['OHP 4×8', 'Arnold press 3×10', 'Shrugs 4×12', 'Rear delt flyes 3×15'] },
        { icon: '🔄', title: 'Arms & Core', tag: 'Arms', exercises: ['EZ bar curls 4×10', 'Tricep dips 4×10', 'Cable crunches 4×15', 'Russian twists 3×20'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Sauna', 'Foam rolling', 'Meal prep'] },
      ],
      advanced: [
        { icon: '💪', title: 'Heavy Push', tag: 'Push', exercises: ['Bench press 5×5', 'Weighted dips 4×8', 'Incline press 4×10', 'Lateral raises 5×15'] },
        { icon: '🏋️', title: 'Heavy Pull', tag: 'Pull', exercises: ['Deadlift 5×5', 'Weighted pull-ups 4×8', 'Pendlay rows 4×6', 'Preacher curls 4×10'] },
        { icon: '🦵', title: 'Heavy Legs', tag: 'Legs', exercises: ['Back squat 5×5', 'Front squat 3×6', 'Hack squat 4×10', 'Nordic curls 3×8'] },
        { icon: '🔝', title: 'Shoulders & Arms', tag: 'Hypertrophy', exercises: ['OHP 5×5', 'Cable lateral 4×15', 'Close-grip bench 4×8', 'Incline curls 4×10'] },
        { icon: '🔄', title: 'Full Body Power', tag: 'Power', exercises: ['Power cleans 5×3', 'Push press 4×5', 'Romanian DL 4×8', 'Weighted chin-ups 4×6'] },
        { icon: '🧘', title: 'Active Recovery', tag: 'Recovery', exercises: ['Mobility work 30 min', 'Foam rolling', 'Light swimming', 'Contrast showers'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Sauna & spa', 'Nutrition audit', 'Sleep 9 hours'] },
      ],
    },
    strength: {
      beginner: [
        { icon: '🏋️', title: 'Squat Focus', tag: 'Lower', exercises: ['Goblet squat 3×8', 'Box squat 3×8', 'Leg press 3×10', 'Core work 10 min'] },
        { icon: '💪', title: 'Press Focus', tag: 'Upper', exercises: ['Dumbbell bench 3×8', 'OHP 3×8', 'Push-ups 3×10', 'Tricep work 3×12'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Light walk', 'Stretch hips & back', 'Eat protein'] },
        { icon: '🏋️', title: 'Deadlift Focus', tag: 'Hinge', exercises: ['Romanian DL 3×8', 'Trap bar DL 3×6', 'Good mornings 3×10', 'Back extensions 3×12'] },
        { icon: '💪', title: 'Row Focus', tag: 'Pull', exercises: ['Dumbbell rows 3×10', 'Lat pulldown 3×10', 'Face pulls 3×15', 'Bicep curls 3×12'] },
        { icon: '🔄', title: 'Full Body', tag: 'Compound', exercises: ['Squat 3×5', 'Bench 3×5', 'Deadlift 1×5', 'Barbell row 3×5'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Foam rolling', 'Mobility work', 'Meal prep'] },
      ],
      intermediate: [
        { icon: '🏋️', title: 'Squat Day', tag: 'Lower', exercises: ['Back squat 4×5', 'Pause squat 3×3', 'Front squat 3×5', 'Leg press 3×10'] },
        { icon: '💪', title: 'Bench Day', tag: 'Upper', exercises: ['Bench press 4×5', 'Close-grip bench 3×6', 'OHP 3×8', 'Dips 3×10'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Light cardio', 'Mobility drills', 'Hydration'] },
        { icon: '🏋️', title: 'Deadlift Day', tag: 'Hinge', exercises: ['Conventional DL 4×4', 'Sumo DL 3×5', 'Rack pulls 3×5', 'Glute ham raise 3×8'] },
        { icon: '💪', title: 'Overhead Day', tag: 'Upper', exercises: ['OHP 4×5', 'Push press 3×5', 'Lateral raises 4×12', 'Tricep work 3×10'] },
        { icon: '🔄', title: 'Accessory Day', tag: 'Accessory', exercises: ['Pull-ups 4×6', 'Barbell rows 4×6', 'Core circuit 15 min', 'Mobility 10 min'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Sauna', 'Foam rolling', 'Sleep 8+ hours'] },
      ],
      advanced: [
        { icon: '🏋️', title: 'Max Squat', tag: 'Lower', exercises: ['Back squat 6×3 @85%', 'Pause squat 4×3', 'Box squat 3×5', 'Belt squat 3×8'] },
        { icon: '💪', title: 'Max Bench', tag: 'Upper', exercises: ['Bench press 6×3 @85%', 'Board press 4×3', 'Slingshot bench 3×5', 'Tricep lockouts 4×6'] },
        { icon: '🔄', title: 'Dynamic Effort', tag: 'Speed', exercises: ['Speed squats 8×2 @60%', 'Speed bench 8×3 @50%', 'Plyometrics 20 min', 'Core 15 min'] },
        { icon: '🏋️', title: 'Max Deadlift', tag: 'Hinge', exercises: ['Deadlift 6×2 @87%', 'Deficit DL 4×3', 'Rack pulls 3×3', 'Hamstring work 3×8'] },
        { icon: '💪', title: 'Overhead & Back', tag: 'Upper', exercises: ['OHP 5×5', 'Weighted pull-ups 5×5', 'Pendlay rows 4×5', 'Face pulls 4×15'] },
        { icon: '🧘', title: 'Active Recovery', tag: 'Recovery', exercises: ['Mobility 40 min', 'Contrast therapy', 'Light swimming', 'Foam rolling'] },
        { icon: '😴', title: 'Rest Day', tag: 'Rest', exercises: ['Full rest', 'Sauna & spa', 'Nutrition review', 'Sleep 9 hours'] },
      ],
    },
  };

  let goal = 'weightloss', level = 'beginner';

  function render() {
    const days = PLANS[goal][level];
    scheduleEl.innerHTML = '';
    scheduleEl.style.animation = 'none';
    void scheduleEl.offsetWidth;
    scheduleEl.style.animation = '';
    days.forEach((day, i) => {
      const isRest = day.tag === 'Rest';
      const card = document.createElement('div');
      card.className = 'planner-card' + (isRest ? ' rest' : '');
      card.innerHTML = `
        <p class="planner-card-day">${DAYS[i]}</p>
        <div class="planner-card-icon">${day.icon}</div>
        <p class="planner-card-title">${day.title}</p>
        <ul class="planner-card-exercises">${day.exercises.map(e => `<li>${e}</li>`).join('')}</ul>
        <span class="planner-card-tag">${day.tag}</span>
      `;
      scheduleEl.appendChild(card);
    });
  }

  document.getElementById('goalPills').addEventListener('click', e => {
    const pill = e.target.closest('.planner-pill');
    if (!pill) return;
    document.querySelectorAll('#goalPills .planner-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    goal = pill.dataset.value;
    render();
  });

  document.getElementById('levelPills').addEventListener('click', e => {
    const pill = e.target.closest('.planner-pill');
    if (!pill) return;
    document.querySelectorAll('#levelPills .planner-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    level = pill.dataset.value;
    render();
  });

  render();
})();

// ===== CLASS BOOKING =====
(function () {
  const form        = document.getElementById('bkForm');
  const confirmEl   = document.getElementById('bkConfirm');
  const formWrap    = document.getElementById('bkFormWrap');
  const summaryEl   = document.getElementById('bkSummary');
  if (!form) return;

  // ── State ──
  let selClass    = { name: 'HIIT Blast', trainer: 'Coach Marcus', duration: '45 min', level: 'Advanced', emoji: '🔥' };
  let selDate     = null;
  let selTime     = null;
  let calYear, calMonth;

  const TIMES = ['06:00 AM','07:00 AM','08:00 AM','09:00 AM','10:00 AM',
                 '12:00 PM','01:00 PM','04:00 PM','05:30 PM','06:30 PM','07:30 PM'];
  const FULL_SLOTS = new Set([2, 5, 9]); // indices of "full" slots for demo

  // ── Class selection ──
  document.getElementById('bkClasses').addEventListener('click', e => {
    const card = e.target.closest('.bk-class-card');
    if (!card) return;
    document.querySelectorAll('.bk-class-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selClass = {
      name: card.dataset.class, trainer: card.dataset.trainer,
      duration: card.dataset.duration, level: card.dataset.level, emoji: card.dataset.emoji
    };
    updateSummary();
  });

  // ── Calendar ──
  const today = new Date();
  calYear  = today.getFullYear();
  calMonth = today.getMonth();

  function buildCalendar() {
    const monthNames = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
    document.getElementById('bkCalMonth').textContent = `${monthNames[calMonth]} ${calYear}`;
    const grid = document.getElementById('bkCalGrid');
    grid.innerHTML = '';
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'bk-cal-day empty';
      grid.appendChild(empty);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const btn = document.createElement('button');
      btn.className = 'bk-cal-day';
      btn.textContent = d;
      const thisDate = new Date(calYear, calMonth, d);
      const isToday  = thisDate.toDateString() === today.toDateString();
      const isPast   = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (isToday) btn.classList.add('today');
      if (isPast)  btn.classList.add('past');
      if (selDate && thisDate.toDateString() === selDate.toDateString()) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        selDate = thisDate;
        document.querySelectorAll('.bk-cal-day').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        updateSummary();
      });
      grid.appendChild(btn);
    }
  }

  document.getElementById('bkCalPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    buildCalendar();
  });
  document.getElementById('bkCalNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    buildCalendar();
  });

  // ── Time slots ──
  function buildTimes() {
    const wrap = document.getElementById('bkTimes');
    wrap.innerHTML = '';
    TIMES.forEach((t, i) => {
      const btn = document.createElement('button');
      btn.className = 'bk-time-slot' + (FULL_SLOTS.has(i) ? ' full' : '');
      btn.textContent = FULL_SLOTS.has(i) ? `${t} · Full` : t;
      btn.addEventListener('click', () => {
        if (FULL_SLOTS.has(i)) return;
        selTime = t;
        document.querySelectorAll('.bk-time-slot').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        updateSummary();
      });
      wrap.appendChild(btn);
    });
  }

  // ── Summary update ──
  function fmt(d) {
    return d ? d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) : '—';
  }
  function updateSummary() {
    document.getElementById('bkSumClass').textContent    = selClass.name;
    document.getElementById('bkSumTrainer').textContent  = selClass.trainer;
    document.getElementById('bkSumDuration').textContent = selClass.duration;
    document.getElementById('bkSumDate').textContent     = fmt(selDate);
    document.getElementById('bkSumTime').textContent     = selTime || '—';
  }

  // ── Form submit ──
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name  = document.getElementById('bkName').value.trim();
    const email = document.getElementById('bkEmail').value.trim();
    const errName  = document.getElementById('bkErrName');
    const errEmail = document.getElementById('bkErrEmail');
    const errGlobal= document.getElementById('bkErrGlobal');
    let valid = true;

    errName.textContent = errEmail.textContent = errGlobal.textContent = '';
    document.getElementById('bkName').classList.remove('error');
    document.getElementById('bkEmail').classList.remove('error');

    if (name.length < 2) {
      errName.textContent = 'Please enter your full name.';
      document.getElementById('bkName').classList.add('error');
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEmail.textContent = 'Please enter a valid email.';
      document.getElementById('bkEmail').classList.add('error');
      valid = false;
    }
    if (!selDate) { errGlobal.textContent = 'Please select a date.'; valid = false; }
    else if (!selTime) { errGlobal.textContent = 'Please select a time slot.'; valid = false; }
    if (!valid) return;

    const btn = document.getElementById('bkSubmit');
    btn.disabled = true;
    document.getElementById('bkSubmitText').textContent = 'Booking...';

    try {
      const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          name, email,
          phone:     document.getElementById('bkPhone').value.trim(),
          className: selClass.name,
          trainer:   selClass.trainer,
          duration:  selClass.duration,
          date:      fmt(selDate),
          time:      selTime
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed.');
      formWrap.style.display = 'none';
      summaryEl.style.display = 'none';
      const details = document.getElementById('bkConfirmDetails');
      details.innerHTML = [
        ['Name', sanitizeHTML(name)],
        ['Class', `${sanitizeHTML(selClass.emoji)} ${sanitizeHTML(selClass.name)}`],
        ['Trainer', sanitizeHTML(selClass.trainer)],
        ['Date', sanitizeHTML(fmt(selDate))],
        ['Time', sanitizeHTML(selTime)],
        ['Duration', sanitizeHTML(selClass.duration)]
      ].map(([k,v]) => `<div class="bk-confirm-detail-row"><span>${k}</span><strong>${v}</strong></div>`).join('');
      confirmEl.classList.add('show');
    } catch (err) {
      errGlobal.textContent = err.message;
    } finally {
      btn.disabled = false;
      document.getElementById('bkSubmitText').textContent = 'Confirm Booking';
    }
  });

  // ── Book another ──
  document.getElementById('bkBookAnother').addEventListener('click', () => {
    confirmEl.classList.remove('show');
    formWrap.style.display = '';
    summaryEl.style.display = '';
    form.reset();
    selDate = selTime = null;
    document.getElementById('bkSubmit').disabled = false;
    document.getElementById('bkSubmitText').textContent = 'Confirm Booking';
    document.querySelectorAll('.bk-time-slot').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.bk-cal-day').forEach(b => b.classList.remove('selected'));
    updateSummary();
  });

  // ── Init ──
  buildCalendar();
  buildTimes();
  updateSummary();
})();

// ===== EXPLORE DRAWER =====
(function () {
  const drawer   = document.getElementById('exploreDrawer');
  const backdrop = document.getElementById('exploreBackdrop');
  const closeBtn = document.getElementById('exploreClose');
  const openBtn  = document.getElementById('navExploreBtn');
  if (!drawer) return;
  function open()  { drawer.classList.add('open');    document.body.style.overflow = 'hidden'; }
  function close() { drawer.classList.remove('open'); document.body.style.overflow = ''; }
  if (openBtn) openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

// ===== FITNESS CHATBOT =====
(function () {
  const wrap    = document.getElementById('chatbotWrap');
  const fab     = document.getElementById('chatbotFab');
  const closeBtn= document.getElementById('chatbotClose');
  const messages= document.getElementById('chatbotMessages');
  const input   = document.getElementById('chatbotInput');
  const sendBtn = document.getElementById('chatbotSend');
  const sugWrap = document.getElementById('chatbotSuggestions');
  const badge   = document.getElementById('chatbotBadge');
  if (!wrap) return;

  const KB = [
    { keys: ['hello','hi','hey','sup','hiya'], reply: '👋 Hey there! I\'m Nova, your personal fitness assistant. Ask me about workouts, diet, membership, or gym tips!' },
    { keys: ['membership','plan','price','cost','pricing','join','fee'], reply: '💳 We have 3 plans:\n• Basic – $29/mo\n• Premium – $59/mo\n• Elite – $99/mo\nAll include a 30-day money-back guarantee. Want to join? <a href="#contact">Contact us here!</a>' },
    { keys: ['hour','open','time','schedule','when'], reply: '🕐 NovaGym is open:\n• Mon–Fri: 5am – 11pm\n• Sat–Sun: 6am – 10pm\nElite & Premium members get 24/7 access!' },
    { keys: ['location','address','where','find','map'], reply: '📍 We\'re located at:\n123 Nova Street, Fitness City\nFC 10001, United States' },
    { keys: ['trainer','personal','coach','pt','one on one'], reply: '🏋️ Our certified personal trainers build custom plans just for you. PT sessions are included in Premium (4/mo) and Elite (unlimited) plans. <a href="#contact">Book a session!</a>' },
    { keys: ['weight loss','lose weight','fat','burn','slim','cut'], reply: '🔥 For weight loss we recommend:\n• 150+ mins cardio per week\n• HIIT training 3x/week\n• Calorie deficit of 300–500 kcal/day\n• High protein diet (1.6–2g per kg bodyweight)\nOur trainers can build a custom fat-loss plan for you!' },
    { keys: ['muscle','bulk','gain','strength','build','mass'], reply: '💪 To build muscle:\n• Progressive overload — increase weight/reps weekly\n• Train each muscle group 2x/week\n• Eat 1.8–2.2g protein per kg bodyweight\n• Sleep 7–9 hours for recovery\nOur strength programs are designed for maximum gains!' },
    { keys: ['cardio','endurance','run','running','cycling','treadmill'], reply: '🚴 Cardio tips:\n• Aim for 150 mins moderate or 75 mins intense cardio/week\n• Mix steady-state and HIIT for best results\n• Try our cycling classes or treadmill zone\n• Always warm up for 5–10 mins before cardio' },
    { keys: ['diet','nutrition','eat','food','meal','protein','calorie'], reply: '🥗 Nutrition tips:\n• Eat whole foods — lean protein, complex carbs, healthy fats\n• Stay hydrated — 2–3L water daily\n• Don\'t skip breakfast — fuel your morning workout\n• Limit processed sugar and alcohol\nOur Elite plan includes a custom nutrition plan!' },
    { keys: ['beginner','start','new','first time','never'], reply: '🌟 Welcome! Here\'s how to start:\n1. Get a fitness assessment (free with any plan)\n2. Start with 3 sessions/week\n3. Focus on form before weight\n4. Mix strength + cardio\n5. Rest at least 1–2 days/week\nOur trainers love helping beginners — don\'t be shy!' },
    { keys: ['crossfit','hiit','functional','wod'], reply: '⚡ CrossFit & HIIT at NovaGym:\n• High-intensity functional movements\n• Burns up to 800 calories/session\n• Builds strength, agility & endurance\n• Classes run daily — check our schedule!' },
    { keys: ['yoga','stretch','flexibility','recovery','rest'], reply: '🧘 Recovery is just as important as training!\n• Stretch for 10 mins after every workout\n• Try our yoga studio for flexibility & mindfulness\n• Use our sauna & spa for muscle recovery\n• Aim for 7–9 hours of sleep per night' },
    { keys: ['supplement','protein powder','creatine','pre workout','whey'], reply: '💊 Supplement basics:\n• Whey protein — great post-workout\n• Creatine — proven for strength & power\n• Caffeine — natural pre-workout boost\n• Omega-3 — reduces inflammation\nAlways prioritise real food first. Our nutritionists can advise on supplements!' },
    { keys: ['sauna','spa','pool','swim','wellness'], reply: '♨️ Our wellness facilities include:\n• Sauna & steam room\n• Swimming pool\n• Yoga studio\n• Nutrition bar\nSauna & spa access is included in Elite membership!' },
    { keys: ['contact','email','phone','call','reach'], reply: '📞 Get in touch:\n• Email: hello@novagym.com\n• Phone: +1 (555) 123-4567\nOr <a href="#contact">fill out our contact form</a> and we\'ll reply within 24 hours!' },
    { keys: ['thank','thanks','great','awesome','perfect','nice'], reply: '😊 You\'re welcome! Keep pushing — your best self is just one workout away. 💪 Anything else I can help with?' },
    { keys: ['bye','goodbye','see you','cya','later'], reply: '👋 See you at the gym! Stay consistent and keep crushing it. 🔥' },
  ];

  const suggestions = ['💪 Workout Tips', '🥗 Diet Advice', '💳 Membership', '🕐 Opening Hours', '🏋️ Personal Trainer'];
  const suggestionMap = {
    '💪 Workout Tips': 'muscle building tips',
    '🥗 Diet Advice': 'diet and nutrition tips',
    '💳 Membership': 'membership plans and pricing',
    '🕐 Opening Hours': 'opening hours',
    '🏋️ Personal Trainer': 'personal trainer'
  };

  function getReply(text) {
    const t = text.toLowerCase();
    for (const item of KB) {
      if (item.keys.some(k => t.includes(k))) return item.reply;
    }
    return "🤔 I'm not sure about that one! Try asking about workouts, diet, membership, opening hours, or our trainers. Or <a href='#contact'>contact us directly</a>!";
  }

  function addMsg(text, type) {
    const div = document.createElement('div');
    div.className = `chatbot-msg ${type}`;
    // Bot messages contain trusted HTML links; user messages are sanitized
    if (type === 'user') {
      div.textContent = text;
    } else {
      div.innerHTML = text.replace(/\n/g, '<br>');
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'chatbot-typing';
    t.id = 'chatTyping';
    t.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(t);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('chatTyping');
    if (t) t.remove();
  }

  function sendMessage(text) {
    const msg = text.trim();
    if (!msg) return;
    addMsg(msg, 'user');
    input.value = '';
    showTyping();
    setTimeout(() => {
      removeTyping();
      addMsg(getReply(msg), 'bot');
    }, 700 + Math.random() * 400);
  }

  // Build suggestion chips
  suggestions.forEach(s => {
    const chip = document.createElement('button');
    chip.className = 'chatbot-chip';
    chip.textContent = s;
    chip.addEventListener('click', () => sendMessage(suggestionMap[s]));
    sugWrap.appendChild(chip);
  });

  // Open / close
  function openChat() {
    wrap.classList.add('open');
    badge.classList.add('hide');
    if (!messages.children.length) {
      setTimeout(() => addMsg('👋 Hi! I\'m <strong>Nova</strong>, your NovaGym fitness assistant!<br>Ask me about workouts, diet, membership, or anything gym-related. 💪', 'bot'), 300);
    }
    setTimeout(() => input.focus(), 400);
  }
  function closeChat() { wrap.classList.remove('open'); }

  fab.addEventListener('click', () => wrap.classList.contains('open') ? closeChat() : openChat());
  closeBtn.addEventListener('click', closeChat);

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(input.value); });
})();

// ===== MEMBERSHIP MODAL =====
(function () {
  const modal      = document.getElementById('memModal');
  const backdrop   = document.getElementById('memBackdrop');
  const closeBtn   = document.getElementById('memClose');
  const formView   = document.getElementById('memFormView');
  const successView= document.getElementById('memSuccess');
  const form       = document.getElementById('memForm');
  const emailInput = document.getElementById('memEmail');
  const phoneInput = document.getElementById('memPhone');
  const emailHint  = document.getElementById('memEmailHint');
  if (!modal) return;

  const PLANS = {
    Basic:   { icon: '🏃', monthly: '$29/mo', annual: '$23/mo' },
    Premium: { icon: '🏋️', monthly: '$59/mo', annual: '$47/mo' },
    Elite:   { icon: '👑', monthly: '$99/mo', annual: '$79/mo' },
  };

  // Open modal from pricing buttons
  document.querySelectorAll('.mem-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      const info = PLANS[plan];
      document.getElementById('memPlanIcon').textContent  = info.icon;
      document.getElementById('memPlanName').textContent  = plan + ' Plan';
      document.getElementById('memPlanPrice').textContent = info.monthly;
      formView.style.display = '';
      successView.classList.remove('show');
      form.reset();
      clearErrors();
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function close() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.getElementById('memSuccessClose').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // ── Live email hint ──
  emailInput.addEventListener('input', () => {
    const val = emailInput.value;
    if (!val) { emailHint.textContent = ''; emailHint.className = 'mem-email-hint'; return; }
    if (!val.includes('@')) {
      emailHint.textContent = 'Missing @ symbol';
      emailHint.className = 'mem-email-hint warn';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      emailHint.textContent = 'Enter a valid email (e.g. name@example.com)';
      emailHint.className = 'mem-email-hint warn';
    } else {
      emailHint.textContent = '✓ Looks good!';
      emailHint.className = 'mem-email-hint ok';
    }
  });

  // ── Phone: numbers only ──
  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
  });

  function clearErrors() {
    ['memErrName','memErrEmail','memErrPhone','memErrBilling'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    ['memName','memEmail','memPhone','memBilling'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('error', 'valid');
    });
    emailHint.textContent = '';
    emailHint.className = 'mem-email-hint';
  }

  // ── Form submit ──
  form.addEventListener('submit', async e => {
    e.preventDefault();
    clearErrors();
    const name    = document.getElementById('memName').value.trim();
    const email   = document.getElementById('memEmail').value.trim();
    const phone   = phoneInput.value.trim();
    const billing = document.getElementById('memBilling').value;
    const plan    = document.getElementById('memPlanName').textContent;
    const price   = document.getElementById('memPlanPrice').textContent;
    let valid = true;

    if (name.length < 2) {
      setErr('memErrName', 'memName', 'Please enter your full name.');
      valid = false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr('memErrEmail', 'memEmail', 'Please enter a valid email address.');
      valid = false;
    }
    if (phone.length < 7) {
      setErr('memErrPhone', 'memPhone', 'Please enter a valid phone number (min 7 digits).');
      valid = false;
    }
    if (!billing) {
      setErr('memErrBilling', 'memBilling', 'Please select a billing cycle.');
      valid = false;
    }
    if (!valid) return;

    const submitBtn  = document.getElementById('memSubmit');
    const submitText = document.getElementById('memSubmitText');
    submitBtn.disabled = true;
    submitText.textContent = 'Confirming...';

    const code = document.getElementById('memPhoneCode').value;

    try {
      const { csrfToken } = await fetch('/api/csrf-token').then(r => r.json());
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ name, email, phone: code + ' ' + phone, plan, price, billing })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed.');
      formView.style.display = 'none';
      document.getElementById('memSuccessEmail').textContent = email;
      document.getElementById('memSuccessDetail').innerHTML = [
        ['Plan',    sanitizeHTML(plan)],
        ['Price',   sanitizeHTML(price)],
        ['Billing', billing === 'annual' ? 'Annual (Save 20%)' : 'Monthly'],
        ['Phone',   sanitizeHTML(code + ' ' + phone)],
      ].map(([k,v]) => `<div class="mem-success-row"><span>${k}</span><strong>${v}</strong></div>`).join('');
      successView.classList.add('show');
    } catch (err) {
      setErr('memErrName', 'memName', err.message);
    } finally {
      submitBtn.disabled = false;
      submitText.textContent = 'Confirm Membership';
    }
  });

  function setErr(errId, inputId, msg) {
    document.getElementById(errId).textContent = msg;
    document.getElementById(inputId).classList.add('error');
  }
})();

// ===== BACK TO TOP =====
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
