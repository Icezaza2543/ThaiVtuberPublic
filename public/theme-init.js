// Sets the colour theme before first paint (external file: the CSP forbids inline scripts).
// Saved choice wins; otherwise follow the system preference.
(function () {
  var theme;
  try { theme = localStorage.getItem('vthaidex-theme'); } catch (e) { theme = null; }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
