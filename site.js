/* site.js – include on EVERY page:
   <script src="https://onlinenanma.github.io/quran/site.js" defer></script>
   1) remembers the chosen language for the whole site
   2) loads Google Translate only when a language other than Malayalam is chosen
   3) registers the offline service worker (/quran/sw.js) */
(function () {
  var KEY = 'quran-lang', YEAR = 'max-age=31536000';

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }
  function getPref() {
    var p = null;
    try { p = localStorage.getItem(KEY); } catch (e) {}
    if (!p) { var m = document.cookie.match(/googtrans=\/[^/]*\/([A-Za-z-]+)/); if (m) p = m[1]; }
    return p || 'ml';
  }
  function setCookie(l) {                         // Google reads this cookie to translate
    var gone = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = gone; document.cookie = gone + '; domain=' + location.hostname;
    if (l !== 'ml') document.cookie = 'googtrans=/ml/' + l + '; path=/; ' + YEAR;
  }
  function savePref(l) { try { localStorage.setItem(KEY, l); } catch (e) {} setCookie(l); }

  var lang = getPref();
  setCookie(lang);                                // keep cookie in step with the saved choice

  /* hide Google's own bar / highlights */
  var st = document.createElement('style');
  st.textContent = '.goog-te-banner-frame,.skiptranslate iframe{display:none!important}body{top:0!important}' +
    '.goog-text-highlight{background:none!important;box-shadow:none!important}#goog-gt-tt,.goog-tooltip{display:none!important}';
  document.head.appendChild(st);

  onReady(function () {
    /* language picker (optional – any page that has <select id="langPick"> gets it wired) */
    var sel = document.getElementById('langPick');
    if (sel) {
      if (lang !== 'ml') sel.value = lang;
      sel.addEventListener('change', function () {
        if (!sel.value) return;
        savePref(sel.value); location.reload();
      });
    }
       if (lang !== 'ml') {
      var rm = document.querySelector('meta[name="referrer"]');          // Google's translator needs a referrer
      if (rm) rm.setAttribute('content', 'strict-origin-when-cross-origin');
      window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({ pageLanguage: 'ml', autoDisplay: false }, 'gt_el');
      };
      var d = document.createElement('div'); d.id = 'gt_el'; d.style.display = 'none'; document.body.appendChild(d);
      var s = document.createElement('script');
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; s.async = true;
      document.head.appendChild(s);
      setTimeout(function () {                                           // visible hint if it did not start
        if (!document.querySelector('.goog-te-combo, html.translated-ltr, html.translated-rtl')) {
          var t = document.createElement('div'); t.className = 'notranslate'; t.setAttribute('translate', 'no');
          t.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99;background:#d93025;color:#fff;padding:8px 12px;border-radius:8px;font:13px sans-serif;text-align:center';
          t.textContent = 'Translation could not load. Check your internet / ad-blocker.';
          document.body.appendChild(t); setTimeout(function () { t.remove(); }, 8000);
        }
      }, 8000);
    }
  });

  /* offline support */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/quran/sw.js', { scope: '/quran/' }).catch(function () {});
    });
  }
})();
