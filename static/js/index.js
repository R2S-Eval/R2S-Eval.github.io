document.addEventListener('DOMContentLoaded', function () {
  const burger = document.querySelector('.navbar-burger');
  const menu = document.getElementById('project-menu');

  if (burger && menu) {
    burger.addEventListener('click', function () {
      const isActive = burger.classList.toggle('is-active');
      menu.classList.toggle('is-active', isActive);
      burger.setAttribute('aria-expanded', String(isActive));
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        burger.classList.remove('is-active');
        menu.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const year = document.getElementById('current-year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
});

