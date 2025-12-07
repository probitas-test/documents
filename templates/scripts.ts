/**
 * Client-side JavaScript for the page
 */

/** Theme initialization script (runs before render to prevent FOUC) */
export const themeInitScript = `(function() {
  const stored = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (systemPrefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();`;

/** Main page scripts */
export const mainScript = `
const HLJS_THEMES = {
  dark: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css',
  light: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css'
};

function updateHljsTheme(theme) {
  document.getElementById('hljs-theme').href = HLJS_THEMES[theme];
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateHljsTheme(next);
}

function initCarousel() {
  const tabs = document.querySelectorAll('.carousel-tab');
  const slides = document.querySelectorAll('.carousel-slide');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');

  // Skip if carousel elements not found
  if (!tabs.length || !slides.length || !prevBtn || !nextBtn) return;

  const totalSlides = slides.length;

  function goToSlide(index) {
    tabs.forEach(t => t.classList.remove('active'));
    tabs[index].classList.add('active');
    slides.forEach(s => s.classList.remove('active'));
    slides[index].classList.add('active');
    slides[index].querySelectorAll('pre code').forEach(block => {
      hljs.highlightElement(block);
    });
  }

  function getCurrentIndex() {
    return [...tabs].findIndex(t => t.classList.contains('active'));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      goToSlide(parseInt(tab.dataset.index));
    });
  });

  prevBtn.addEventListener('click', () => {
    const current = getCurrentIndex();
    goToSlide((current - 1 + totalSlides) % totalSlides);
  });

  nextBtn.addEventListener('click', () => {
    const current = getCurrentIndex();
    goToSlide((current + 1) % totalSlides);
  });
}

function initTocFade() {
  const toc = document.querySelector('.toc');
  if (!toc) return;

  function updateFade() {
    const atTop = toc.scrollTop <= 10;
    const atBottom = toc.scrollTop + toc.clientHeight >= toc.scrollHeight - 10;

    toc.classList.toggle('scroll-top', atTop);
    toc.classList.toggle('scroll-bottom', atBottom);
  }

  updateFade();
  toc.addEventListener('scroll', updateFade, { passive: true });
}

document.addEventListener('DOMContentLoaded', () => {
  hljs.highlightAll();
  updateHljsTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  initCarousel();
  initTocFade();
});
`;
