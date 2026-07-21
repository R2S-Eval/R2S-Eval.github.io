document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.navbar-burger');
  const menu = document.getElementById('project-menu');

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
