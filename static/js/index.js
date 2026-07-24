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

  document.querySelectorAll('[data-playback-rate]').forEach(function (video) {
    const playbackRate = Number.parseFloat(video.dataset.playbackRate);
    if (!Number.isFinite(playbackRate) || playbackRate <= 0) return;

    const applyPlaybackRate = function () {
      video.defaultPlaybackRate = playbackRate;
      video.playbackRate = playbackRate;
    };

    video.addEventListener('loadedmetadata', applyPlaybackRate);
    applyPlaybackRate();
  });

  const r2sShowcaseVideos = Array.from(document.querySelectorAll('[data-r2s-autoplay]'));
  if (r2sShowcaseVideos.length) {
    let r2sObserver = null;
    const visibilityRatios = new Map(r2sShowcaseVideos.map(function (video) {
      return [video, 0];
    }));

    const pauseShowcaseVideos = function () {
      r2sShowcaseVideos.forEach(function (video) {
        video.pause();
      });
    };

    const updateShowcasePlayback = function () {
      let mostVisibleVideo = null;
      let highestRatio = 0;

      visibilityRatios.forEach(function (ratio, video) {
        if (ratio > highestRatio) {
          highestRatio = ratio;
          mostVisibleVideo = video;
        }
      });

      r2sShowcaseVideos.forEach(function (video) {
        if (!reducedMotion.matches && video === mostVisibleVideo && highestRatio >= 0.35) {
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
    };

    const configureShowcasePlayback = function () {
      if (r2sObserver) r2sObserver.disconnect();
      pauseShowcaseVideos();

      if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

      r2sObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          visibilityRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        updateShowcasePlayback();
      }, {
        threshold: [0, 0.2, 0.35, 0.5, 0.75, 1]
      });

      r2sShowcaseVideos.forEach(function (video) {
        r2sObserver.observe(video);
      });
    };

    if (typeof reducedMotion.addEventListener === 'function') {
      reducedMotion.addEventListener('change', configureShowcasePlayback);
    }

    configureShowcasePlayback();
  }

  document.querySelectorAll('[data-task-browser]').forEach(function (browser) {
    const options = Array.from(browser.querySelectorAll('[data-task-option]'));
    const mediaItems = Array.from(browser.querySelectorAll('.task-video-frame')).map(function (frame) {
      const video = frame.querySelector('[data-task-video]');
      const source = frame.querySelector('[data-task-source]');
      if (!video || !source) return null;

      return {
        video: video,
        source: source,
        placeholder: frame.querySelector('[data-task-placeholder]'),
        role: video.dataset.taskVideo || 'default'
      };
    }).filter(Boolean);
    const taskLabel = browser.querySelector('[data-task-label]:not([data-task-option])');
    const taskPosition = browser.querySelector('[data-task-position]');
    const previousButton = browser.querySelector('[data-browser-previous]');
    const nextButton = browser.querySelector('[data-browser-next]');
    const browserKind = browser.dataset.browserKind || 'Task';
    const browserMode = browser.dataset.browserMode || 'thumbnail';
    const transitionTarget = browser.querySelector('[data-task-transition]');
    const swipeSurface = browser.querySelector('[data-task-swipe]');

    if (!options.length || !mediaItems.length) return;

    let activeIndex = Math.max(0, options.findIndex(function (option) {
      return option.getAttribute('aria-pressed') === 'true';
    }));

    const wrapIndex = function (index) {
      return (index + options.length) % options.length;
    };

    const activateTask = function (index, settings) {
      const nextIndex = wrapIndex(index);
      const activeOption = options[nextIndex];
      const taskImage = activeOption.querySelector('img');
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

      mediaItems.forEach(function (mediaItem) {
        const rolePrefix = mediaItem.role === 'default' ? '' : mediaItem.role;
        const sourceKey = rolePrefix ? `${rolePrefix}VideoSrc` : 'videoSrc';
        const posterKey = rolePrefix ? `${rolePrefix}Poster` : 'poster';
        const posterAttribute = rolePrefix ? `data-${rolePrefix}-poster` : 'data-poster';
        const hasExplicitPoster = activeOption.hasAttribute(posterAttribute);
        const nextSource = activeOption.dataset[sourceKey] || activeOption.dataset.videoSrc;
        const nextPoster = hasExplicitPoster
          ? activeOption.dataset[posterKey]
          : activeOption.dataset.poster || (taskImage ? taskImage.getAttribute('src') : '');
        const mediaName = rolePrefix ? rolePrefix.charAt(0).toUpperCase() + rolePrefix.slice(1) : browserKind;

        mediaItem.video.pause();
        if (nextSource && mediaItem.source.getAttribute('src') !== nextSource) {
          mediaItem.source.setAttribute('src', nextSource);
        }

        if (nextPoster) mediaItem.video.setAttribute('poster', nextPoster);
        else mediaItem.video.removeAttribute('poster');
        if (nextSource) mediaItem.video.load();

        const playbackRate = Number.parseFloat(mediaItem.video.dataset.playbackRate);
        const playbackRateLabel = Number.isFinite(playbackRate) ? ` at ${playbackRate}× speed` : '';
        mediaItem.video.setAttribute('aria-label', `${mediaName} video for ${nextLabel}${playbackRateLabel}`);
        if (mediaItem.placeholder) {
          mediaItem.placeholder.hidden = !/hero-black\.mp4(?:[?#]|$)/.test(nextSource || '');
          mediaItem.placeholder.textContent = `${mediaName} video forthcoming`;
        }
      });

      if (taskLabel) taskLabel.textContent = nextLabel;
      if (taskPosition) taskPosition.textContent = `Task ${nextTaskIndex} / ${String(options.length).padStart(2, '0')}`;

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
