document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.navbar-burger');
  const menu = document.getElementById('project-menu');
  const root = document.documentElement;
  const scrollHero = document.querySelector('[data-scroll-hero]');
  const heroContent = scrollHero ? scrollHero.querySelector('[data-hero-content]') : null;
  const heroVideo = scrollHero ? scrollHero.querySelector('video') : null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (scrollHero) {
    let animationFrame = 0;
    const clamp = function (value, min, max) {
      return Math.min(max, Math.max(min, value));
    };

    const setStaticHero = function () {
      root.style.setProperty('--hero-title-opacity', '1');
      root.style.setProperty('--hero-title-y', '0px');
      root.style.setProperty('--hero-title-scale', '1');
      root.style.setProperty('--hero-shade-opacity', '0.9');
      root.style.setProperty('--hero-cue-opacity', '0');
      root.style.setProperty('--hero-video-label-opacity', '0.58');
      if (heroContent) {
        heroContent.classList.remove('is-interaction-hidden');
        heroContent.inert = false;
      }
    };

    const updateHero = function () {
      animationFrame = 0;

      if (reducedMotion.matches) {
        setStaticHero();
        if (heroVideo) heroVideo.pause();
        return;
      }

      const nav = document.querySelector('.project-nav');
      const navHeight = nav ? nav.getBoundingClientRect().height : 0;
      const rect = scrollHero.getBoundingClientRect();
      const sceneHeight = Math.max(1, window.innerHeight - navHeight);
      const travel = Math.max(1, scrollHero.offsetHeight - sceneHeight);
      const progress = clamp((navHeight - rect.top) / travel, 0, 1);
      const fadeProgress = clamp(progress / 0.68, 0, 1);
      const fade = fadeProgress * fadeProgress * (3 - 2 * fadeProgress);

      root.style.setProperty('--hero-title-opacity', String(1 - fade));
      root.style.setProperty('--hero-title-y', `${-fade * 180}px`);
      root.style.setProperty('--hero-title-scale', String(1 - fade * 0.025));
      root.style.setProperty('--hero-shade-opacity', String(0.9 - progress * 0.72));
      root.style.setProperty('--hero-cue-opacity', String(clamp(1 - progress * 3.2, 0, 1) * 0.72));
      root.style.setProperty('--hero-video-label-opacity', String(0.28 + progress * 0.58));
      if (heroContent) {
        const interactionHidden = fade > 0.98;
        heroContent.classList.toggle('is-interaction-hidden', interactionHidden);
        heroContent.inert = interactionHidden;
      }
    };

    const requestHeroUpdate = function () {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateHero);
    };

    window.addEventListener('scroll', requestHeroUpdate, { passive: true });
    window.addEventListener('resize', requestHeroUpdate);

    const handleMotionChange = function () {
      if (reducedMotion.matches) {
        setStaticHero();
        if (heroVideo) heroVideo.pause();
      } else {
        if (heroVideo) heroVideo.play().catch(function () {});
        requestHeroUpdate();
      }
    };

    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', handleMotionChange);
    }

    handleMotionChange();
  }

  if (burger && menu) {
    const closeMenu = function () {
      burger.classList.remove('is-active');
      menu.classList.remove('is-active');
      burger.setAttribute('aria-expanded', 'false');
    };

    burger.addEventListener('click', function () {
      const isActive = burger.classList.toggle('is-active');
      menu.classList.toggle('is-active', isActive);
      burger.setAttribute('aria-expanded', String(isActive));
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && burger.classList.contains('is-active')) {
        closeMenu();
        burger.focus();
      }
    });
  }

  const copyButton = document.querySelector('[data-copy-target]');
  const copyStatus = document.querySelector('.copy-status');

  if (copyButton) {
    copyButton.addEventListener('click', async function () {
      const target = document.getElementById(copyButton.dataset.copyTarget);
      if (!target) return;

      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        copyButton.textContent = 'Copied';
        if (copyStatus) copyStatus.textContent = 'BibTeX copied to clipboard.';
      } catch (error) {
        if (copyStatus) copyStatus.textContent = 'Copy unavailable. Select the citation text manually.';
      }

      window.setTimeout(function () {
        copyButton.textContent = 'Copy BibTeX';
        if (copyStatus) copyStatus.textContent = '';
      }, 2200);
    });
  }

  const year = document.getElementById('current-year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
});
