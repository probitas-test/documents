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
const HLJS_CDN = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build';
const HLJS_THEMES = {
  dark: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github-dark.min.css',
  light: 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css'
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensureHljs() {
  if (window.hljs) return;
  await loadScript(\`\${HLJS_CDN}/highlight.min.js\`);
  await loadScript(\`\${HLJS_CDN}/languages/typescript.min.js\`);
}

function updateHljsTheme(theme) {
  const themeLink = document.getElementById('hljs-theme');
  if (!themeLink) return;
  themeLink.href = HLJS_THEMES[theme];
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateHljsTheme(next);
}

function toggleMobileMenu() {
  const header = document.querySelector('.global-header');
  header.classList.toggle('menu-open');
  document.body.classList.toggle('menu-open');
}

function closeMobileMenu() {
  const header = document.querySelector('.global-header');
  header.classList.remove('menu-open');
  document.body.classList.remove('menu-open');
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
    if (window.hljs) {
      slides[index].querySelectorAll('pre code:not([data-highlighted])').forEach(block => {
        hljs.highlightElement(block);
      });
    }
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

function initScrollableNavFade() {
  document.querySelectorAll('.scrollable-nav').forEach(el => {
    function updateFade() {
      const atTop = el.scrollTop <= 10;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 10;

      el.classList.toggle('scroll-top', atTop);
      el.classList.toggle('scroll-bottom', atBottom);
    }

    updateFade();
    el.addEventListener('scroll', updateFade, { passive: true });
  });
}

function initCodeCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.title = 'Copy code';
    btn.innerHTML = '<i class="ti ti-copy"></i>';
    wrapper.appendChild(btn);

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        btn.innerHTML = '<i class="ti ti-check"></i>';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '<i class="ti ti-copy"></i>';
          btn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    });
  });
}

function initSignatureScrollFade() {
  document.querySelectorAll('.api-signature pre code').forEach(code => {
    function updateFade() {
      const canScrollLeft = code.scrollLeft > 5;
      const canScrollRight = code.scrollLeft + code.clientWidth < code.scrollWidth - 5;

      code.classList.toggle('scroll-left', canScrollLeft);
      code.classList.toggle('scroll-right', canScrollRight);
    }

    // Initial check
    updateFade();

    // Update on scroll
    code.addEventListener('scroll', updateFade, { passive: true });

    // Also check on window resize (content width may change)
    window.addEventListener('resize', updateFade, { passive: true });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  updateHljsTheme(document.documentElement.getAttribute('data-theme') || 'dark');
  initCarousel();
  initScrollableNavFade();
  initCodeCopyButtons();
  initSignatureScrollFade();
  try {
    await ensureHljs();
    if (window.hljs) {
      // Highlight all code blocks, including those in hidden carousel slides
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }
  } catch (err) {
    console.warn('Failed to load highlight.js', err);
  }
});
`;
