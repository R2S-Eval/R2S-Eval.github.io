document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.navbar-burger');
  const menu = document.getElementById('project-menu');
  const root = document.documentElement;
  const projectNav = document.querySelector('.project-nav');
  const scrollHero = document.querySelector('[data-scroll-hero]');
  const heroContent = scrollHero ? scrollHero.querySelector('[data-hero-content]') : null;
  const heroVideo = scrollHero ? scrollHero.querySelector('video') : null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (scrollHero) {
    let animationFrame = 0;
    const clamp = function (value, min, max) {
      return Math.min(max, Math.max(min, value));
    };

    const updateNavTheme = function (heroRect) {
      if (!projectNav) return;
      const rect = heroRect || scrollHero.getBoundingClientRect();
      const navHeight = projectNav.getBoundingClientRect().height;
      projectNav.classList.toggle('is-on-light', rect.bottom <= navHeight);
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
      const rect = scrollHero.getBoundingClientRect();
      updateNavTheme(rect);

      if (reducedMotion.matches) {
        setStaticHero();
        if (heroVideo) heroVideo.pause();
        return;
      }

      const sceneHeight = Math.max(1, window.innerHeight);
      const travel = Math.max(1, scrollHero.offsetHeight - sceneHeight);
      const progress = clamp(-rect.top / travel, 0, 1);
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
        updateNavTheme();
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
      burger.setAttribute('aria-label', 'Open navigation');
      burger.setAttribute('aria-expanded', 'false');
    };

    burger.addEventListener('click', function () {
      const isActive = burger.classList.toggle('is-active');
      menu.classList.toggle('is-active', isActive);
      burger.setAttribute('aria-label', isActive ? 'Close navigation' : 'Open navigation');
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

  document.querySelectorAll('[data-task-browser]').forEach(function (browser) {
    const options = Array.from(browser.querySelectorAll('[data-task-option]'));
    const video = browser.querySelector('[data-task-video]');
    const source = browser.querySelector('[data-task-source]');
    const taskLabel = browser.querySelector('[data-task-label]:not([data-task-option])');
    const taskPosition = browser.querySelector('[data-task-position]');
    const placeholder = browser.querySelector('[data-task-placeholder]');
    const previousButton = browser.querySelector('[data-browser-previous]');
    const nextButton = browser.querySelector('[data-browser-next]');
    const browserKind = browser.dataset.browserKind || 'Task';
    const browserMode = browser.dataset.browserMode || 'thumbnail';
    const transitionTarget = browser.querySelector('[data-task-transition]');
    const swipeSurface = browser.querySelector('[data-task-swipe]');

    if (!options.length || !video || !source) return;

    let activeIndex = Math.max(0, options.findIndex(function (option) {
      return option.getAttribute('aria-pressed') === 'true';
    }));

    const wrapIndex = function (index) {
      return (index + options.length) % options.length;
    };

    const activateTask = function (index, settings) {
      const nextIndex = wrapIndex(index);
      const activeOption = options[nextIndex];
      const nextSource = activeOption.dataset.videoSrc;
      const taskImage = activeOption.querySelector('img');
      const nextPoster = activeOption.dataset.poster || (taskImage ? taskImage.getAttribute('src') : '');
      const nextLabel = activeOption.dataset.taskLabel;
      const nextTaskIndex = activeOption.dataset.taskIndex;
      const shouldFocus = settings && settings.focus;
      const shouldScroll = browserMode !== 'stacked' && (!settings || settings.scroll !== false);
      const shouldAnimate = browserMode === 'stacked' && (!settings || settings.animate !== false) && !reducedMotion.matches;

      activeIndex = nextIndex;
      options.forEach(function (option, optionIndex) {
        const isActive = optionIndex === activeIndex;
        option.setAttribute('aria-pressed', String(isActive));
        option.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      video.pause();
      if (nextSource && source.getAttribute('src') !== nextSource) {
        source.setAttribute('src', nextSource);
      }

      if (nextPoster) video.setAttribute('poster', nextPoster);
      else video.removeAttribute('poster');
      if (nextSource) video.load();

      video.setAttribute('aria-label', `${browserKind} video for ${nextLabel}`);
      if (taskLabel) taskLabel.textContent = nextLabel;
      if (taskPosition) taskPosition.textContent = `Task ${nextTaskIndex} / ${String(options.length).padStart(2, '0')}`;
      if (placeholder) placeholder.textContent = `${browserKind} video forthcoming`;

      if (shouldAnimate && transitionTarget) {
        transitionTarget.classList.remove('is-task-changing');
        void transitionTarget.offsetWidth;
        transitionTarget.classList.add('is-task-changing');
      }

      if (shouldScroll) {
        activeOption.scrollIntoView({
          behavior: reducedMotion.matches ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
      if (shouldFocus) activeOption.focus();
    };

    options.forEach(function (option, index) {
      option.addEventListener('click', function () {
        activateTask(index);
      });

      option.addEventListener('keydown', function (event) {
        let nextIndex = index;

        if (event.key === 'ArrowRight') nextIndex = index + 1;
        else if (event.key === 'ArrowLeft') nextIndex = index - 1;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = options.length - 1;
        else return;

        event.preventDefault();
        activateTask(nextIndex, { focus: true });
      });
    });

    if (previousButton) {
      previousButton.addEventListener('click', function () {
        activateTask(activeIndex - 1);
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', function () {
        activateTask(activeIndex + 1);
      });
    }

    if (swipeSurface && browserMode === 'stacked') {
      let touchStart = null;

      swipeSurface.addEventListener('touchstart', function (event) {
        if (event.touches.length !== 1) return;
        touchStart = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      }, { passive: true });

      swipeSurface.addEventListener('touchend', function (event) {
        if (!touchStart || !event.changedTouches.length) return;
        const deltaX = event.changedTouches[0].clientX - touchStart.x;
        const deltaY = event.changedTouches[0].clientY - touchStart.y;
        touchStart = null;

        if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
        activateTask(activeIndex + (deltaX < 0 ? 1 : -1));
      }, { passive: true });

      swipeSurface.addEventListener('touchcancel', function () {
        touchStart = null;
      }, { passive: true });
    }

    activateTask(activeIndex, { scroll: false, animate: false });
  });

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

});
