(function () {
  'use strict';

  /* ---------- Theme toggle ---------- */
  var root = document.body;
  var themeToggle = document.getElementById('theme-toggle');
  var storedTheme = localStorage.getItem('theme');
  var prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  }

  applyTheme(storedTheme || (prefersLight ? 'light' : 'dark'));

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('theme', next);
    });
  }

  /* ---------- Nav: scrolled state + active link ---------- */
  var siteNav = document.getElementById('site-nav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.dataset.section); })
    .filter(Boolean);

  function onScroll() {
    if (siteNav) siteNav.classList.toggle('scrolled', window.scrollY > 12);

    var backToTop = document.getElementById('back-to-top');
    if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 480);

    var fromTop = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function (section) {
      if (section.offsetTop <= fromTop) current = section;
    });
    if (current) {
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.dataset.section === current.id);
      });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile hamburger menu ---------- */
  var hamburger = document.getElementById('hamburger');
  var navLinksEl = document.getElementById('nav-links');
  if (hamburger && navLinksEl) {
    hamburger.addEventListener('click', function () {
      var open = navLinksEl.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinksEl.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinksEl.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Back to top ---------- */
  var backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Animated counters ---------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function animateCounter(el) {
    var target = parseFloat(el.dataset.count);
    var isDecimal = String(el.dataset.count).indexOf('.') !== -1;
    var duration = 1400;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = isDecimal ? value.toFixed(2) : Math.round(value).toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = isDecimal ? target.toFixed(2) : target.toLocaleString();
      }
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && counters.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.dataset.count; });
  }

  /* ---------- Project card expand (touch/keyboard) ---------- */
  document.querySelectorAll('.project-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (window.matchMedia('(hover: none)').matches) {
        card.classList.toggle('is-open');
      }
    });
  });

  /* ---------- Contact form (Web3Forms) ---------- */
  var contactForm = document.getElementById('contact-form');
  var formNote = document.getElementById('form-note');
  var emailInput = document.getElementById('cf-email');
  var emailError = document.getElementById('cf-email-error');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isEmailWellFormed(value) {
    return EMAIL_RE.test(value.trim());
  }

  function validateEmailField() {
    if (!emailInput) return true;
    var value = emailInput.value.trim();
    if (value === '') {
      emailInput.classList.remove('is-valid', 'is-invalid');
      if (emailError) emailError.textContent = '';
      return false;
    }
    var ok = isEmailWellFormed(value);
    emailInput.classList.toggle('is-invalid', !ok);
    emailInput.classList.toggle('is-valid', ok);
    if (emailError) emailError.textContent = ok ? '' : 'That doesn’t look like a valid email address.';
    return ok;
  }

  if (emailInput) {
    emailInput.addEventListener('input', validateEmailField);
    emailInput.addEventListener('blur', validateEmailField);
  }

  if (contactForm && formNote) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (contactForm.botcheck && contactForm.botcheck.checked) return; // honeypot tripped

      if (!validateEmailField()) {
        emailInput.focus();
        return;
      }

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      formNote.classList.remove('is-error');
      formNote.textContent = '';

      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.success) {
            formNote.textContent = "Thank you for reaching out! I'll get back to you soon!";
            contactForm.reset();
          } else {
            throw new Error(data.message || 'Something went wrong.');
          }
        })
        .catch(function () {
          formNote.classList.add('is-error');
          formNote.textContent = "Couldn't send that — please try again or email me directly.";
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Background canvas: subtle drifting node network ---------- */
  var canvas = document.getElementById('bg-canvas');
  if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var w, h;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.max(24, Math.min(60, Math.round((w * h) / 34000)));
      nodes = Array.from({ length: count }, function () {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 1 + Math.random() * 1.6
        };
      });
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      var isLight = document.body.getAttribute('data-theme') === 'light';
      var nodeColor = isLight ? 'rgba(47, 111, 237, 0.45)' : 'rgba(127, 178, 255, 0.55)';
      var lineColor = isLight ? 'rgba(47, 111, 237, 0.12)' : 'rgba(127, 178, 255, 0.14)';

      nodes.forEach(function (n) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });

      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach(function (n) {
        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
  }
})();
