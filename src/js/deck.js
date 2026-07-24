(() => {
      const slides  = Array.from(document.querySelectorAll('.slide'));
      const counter = document.getElementById('counter');
      const slidesContainer = document.querySelector('.deck__slides, .mobile-page');
      const isLinearMobile = document.body.classList.contains('mobile-linear');
      let current   = 0;

      function isMobile() {
        return document.body.classList.contains('mode-mobile');
      }

      function show(i) {
        if (i < 0) i = 0;
        if (i >= slides.length) i = slides.length - 1;

        if (isMobile() && slidesContainer) {
          // Mobile: scroll to target section/slide smoothly
          if (i === 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            const rect = slides[i].getBoundingClientRect();
            const target = window.scrollY + rect.top;
            window.scrollTo({ top: target, behavior: 'smooth' });
          }
          updateState(i);
        } else {
          // Desktop: toggle visibility (wrap around)
          if (i < 0) i = slides.length - 1;
          if (i >= slides.length) i = 0;
          updateState(i);

          // Reset animations on the active slide for re-trigger on navigation
          const active = slides[i];
          active.querySelectorAll('*').forEach(el => {
            el.style.animation = 'none';
            el.offsetHeight; // force reflow
            el.style.animation = '';
          });
        }
      }

      function updateState(i) {
        slides.forEach((s, idx) => {
          s.classList.toggle('is-active', idx === i);
          s.setAttribute('aria-hidden', idx === i ? 'false' : 'true');
        });
        current = i;
        if (counter) counter.textContent = String(i + 1).padStart(2, '0') + ' / ' + slides.length;

        // Update dynamic badge number on active slide
        const numEl = slides[i].querySelector('.slide__number');
        if (numEl) {
          numEl.innerHTML = '<span class="slide__number-current">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="slide__number-sep">/</span>' +
            '<span>' + String(slides.length).padStart(2, '0') + '</span>';
        }

        // Highlight current language in mobile bottom bar
        const lang = document.documentElement.getAttribute('data-lang') || 'en';
        document.querySelectorAll('.deck__mobile-bar-btn--text').forEach(btn => {
          const href = btn.getAttribute('href') || '';
          btn.setAttribute('aria-pressed', href.endsWith(`index_${lang}.html`) ? 'true' : 'false');
        });
      }

      // ── IntersectionObserver: track current slide on scroll (mobile) ──
      if (slidesContainer) {
        const observer = new IntersectionObserver((entries) => {
          if (!isMobile()) return;
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
              const idx = slides.indexOf(entry.target);
              if (idx !== -1 && idx !== current) {
                updateState(idx);
              }
            }
          });
        }, { threshold: [0.55], root: isLinearMobile ? null : slidesContainer });
        slides.forEach(s => observer.observe(s));
      }

      document.querySelectorAll('[data-action="next"]').forEach(b => b.addEventListener('click', () => show(current + 1)));
      document.querySelectorAll('[data-action="prev"]').forEach(b => b.addEventListener('click', () => show(current - 1)));

      document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === ' ') show(current + 1);
        if (e.key === 'ArrowLeft')                   show(current - 1);
        if (e.key === 'ArrowDown')                   show(current + 1);
        if (e.key === 'ArrowUp')                     show(current - 1);
      });

      document.querySelector('[data-action="fullscreen"]')?.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
      });

      const themeBtn  = document.querySelector('[data-action="theme"]');
      const themeIcon = document.getElementById('theme-icon');
      let dark = document.documentElement.getAttribute('data-theme') !== 'light';
      function setTheme(isDark) {
        dark = isDark;
        const theme = dark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const use = themeIcon?.querySelector('use');
        if (use) use.setAttribute('href', dark ? '#i-sun' : '#i-moon');
      }
      themeBtn?.addEventListener('click', () => setTheme(!dark));
      window.addEventListener('message', (e) => {
        if (!e.data) return;
        if (e.data.type === 'theme') {
          setTheme(e.data.theme !== 'light');
        }
        if (e.data.type === 'nav' && typeof e.data.index === 'number') {
          show(e.data.index);
        }
      });

      show(0);

      // ── Scale fixed-size deck to fit viewport ──
      const fit = document.querySelector('.deck__fit');
      const deckChrome = document.querySelector('.deck__chrome');
      function chromeSpace() {
        if (!deckChrome) return 0;
        const rect = deckChrome.getBoundingClientRect();
        const bottom = parseFloat(getComputedStyle(deckChrome).bottom) || 0;
        // Chrome occupies from bottom offset up to its top
        return Math.ceil(rect.height + bottom + bottom);
      }
      function scaleDeck() {
        const portrait = window.innerHeight > window.innerWidth;
        const mobile   = portrait && window.innerWidth <= 768;

        if (mobile) {
          // Smartphone portrait: vertical scroll mode — fill viewport, no scaling
          fit.style.transform    = 'none';
          fit.style.width        = '100vw';
          fit.style.height       = '100vh';
          fit.style.borderRadius = '0';
          fit.style.boxShadow    = 'none';
          document.body.classList.add('mode-mobile');
        } else {
          // Desktop / tablet: scale fixed-ratio deck, leaving room for chrome
          fit.style.width        = '';
          fit.style.height       = '';
          fit.style.borderRadius = '';
          fit.style.boxShadow    = '';
          document.body.classList.remove('mode-mobile');
          const baseW = portrait ? 1080 : 1920;
          const baseH = portrait ? 1920 : 1080;
          const availH = Math.max(window.innerHeight - chromeSpace(), baseH * 0.65);
          const sx = window.innerWidth  / baseW;
          const sy = availH / baseH;
          fit.style.transform = 'scale(' + Math.min(sx, sy) + ')';
        }
      }
      scaleDeck();
      window.addEventListener('resize', scaleDeck);

      // ── Expose to parent window for cross-iframe navigation ──
      window.__deckShow = show;
      window.__deckIsMobile = isMobile;
    })();
