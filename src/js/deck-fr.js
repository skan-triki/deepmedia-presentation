(() => {
      const slides  = Array.from(document.querySelectorAll('.slide'));
      const counter = document.getElementById('counter');
      let current   = 0;

      function show(i) {
        if (i < 0) i = slides.length - 1;
        if (i >= slides.length) i = 0;
        const prev = slides[current];
        slides.forEach((s, idx) => {
          s.classList.toggle('is-active', idx === i);
          s.setAttribute('aria-hidden', idx === i ? 'false' : 'true');
        });
        current = i;
        counter.textContent = String(i + 1).padStart(2, '0') + ' / ' + slides.length;

        // Reset animations on the active slide for re-trigger on navigation
        const active = slides[i];

        // Update dynamic badge number on active slide
        const numEl = active.querySelector('.slide__number');
        if (numEl) {
          numEl.innerHTML = '<span class="slide__number-current">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="slide__number-sep">/</span>' +
            '<span>' + String(slides.length).padStart(2, '0') + '</span>';
        }

        active.querySelectorAll('*').forEach(el => {
          el.style.animation = 'none';
          el.offsetHeight; // force reflow
          el.style.animation = '';
        });
      }

      document.querySelectorAll('[data-action="next"]').forEach(b => b.addEventListener('click', () => show(current + 1)));
      document.querySelectorAll('[data-action="prev"]').forEach(b => b.addEventListener('click', () => show(current - 1)));

      document.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight' || e.key === ' ') show(current + 1);
        if (e.key === 'ArrowLeft')                   show(current - 1);
      });

      document.querySelector('[data-action="fullscreen"]')?.addEventListener('click', () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
      });

      const themeBtn  = document.querySelector('[data-action="theme"]');
      const themeIcon = document.getElementById('theme-icon');
      let dark = true;
      themeBtn?.addEventListener('click', () => {
        dark = !dark;
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        themeIcon.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
      });

      show(0);

      // ── Scale fixed-size deck to fit viewport ──
      const fit = document.querySelector('.deck__fit');
      function scaleDeck() {
        const portrait = window.innerHeight > window.innerWidth;
        const mobile   = portrait && window.innerWidth <= 768;

        if (mobile) {
          // Smartphone portrait: page mode — fill viewport, no scaling
          fit.style.transform    = 'none';
          fit.style.width        = '100vw';
          fit.style.height       = '100vh';
          fit.style.borderRadius = '0';
          fit.style.boxShadow    = 'none';
          document.body.classList.add('mode-mobile');
        } else {
          // Desktop / tablet: scale fixed-ratio deck
          fit.style.width        = '';
          fit.style.height       = '';
          fit.style.borderRadius = '';
          fit.style.boxShadow    = '';
          document.body.classList.remove('mode-mobile');
          const baseW = portrait ? 1080 : 1920;
          const baseH = portrait ? 1920 : 1080;
          const sx = window.innerWidth  / baseW;
          const sy = window.innerHeight / baseH;
          fit.style.transform = 'scale(' + Math.min(sx, sy) + ')';
        }
      }
      scaleDeck();
      window.addEventListener('resize', scaleDeck);
    })();
