/* translate.js - shows every page in the language chosen on the index page.
   The index stores the choice in the "googtrans" cookie (e.g. /ml/en); this code loads the Google Translate
   widget when that cookie is set and does nothing for Malayalam. Arabic text is kept as it is.

   Use ONE of these (both together is harmless):
     A) paste this whole file at the very end of site.js - every page already loads site.js, so nothing else to change;
     B) upload it as /quran/translate.js and add  <script src="/quran/translate.js" defer></script>  before site.js. */
(function () {
  'use strict';
  if (window.__qTranslate) return;
  window.__qTranslate = true;

  var m = document.cookie.match(/googtrans=\/[^\/]*\/([a-z-]+)/i);
  var lang = m && m[1].toLowerCase();
  if (!lang || lang === 'ml') return;                       // Malayalam (or nothing chosen): nothing to do

  var ARABIC = '[lang="ar"],.ar,.isti-ar';
  function mark(e) {
    if (e.getAttribute('translate') !== 'no') { e.setAttribute('translate', 'no'); e.classList.add('notranslate'); }
  }
  function protect(root) {                                   // Arabic text must stay Arabic in every language
    try {
      if (root.matches && root.matches(ARABIC)) mark(root);
      root.querySelectorAll(ARABIC).forEach(mark);
    } catch (e) { /* ignore */ }
  }

  function start() {
    // hide Google's top bar and highlight boxes, as on 001.html
    var st = document.createElement('style');
    st.textContent = '.goog-te-banner-frame,.skiptranslate iframe{display:none!important}' +
                     'body{top:0!important}.goog-text-highlight{background:none!important;box-shadow:none!important}';
    (document.head || document.documentElement).appendChild(st);

    protect(document);
    try {                                                    // verse cards are built by scripts: protect them as they appear
      new MutationObserver(function (list) {
        list.forEach(function (mu) { mu.addedNodes.forEach(function (n) { if (n.nodeType === 1) protect(n); }); });
      }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { /* ignore */ }

    function make() {
      if (window.__qGtMade) return; window.__qGtMade = true;
      new google.translate.TranslateElement({ pageLanguage: 'ml', autoDisplay: false }, 'gt_el');
    }
    if (!document.getElementById('gt_el')) {
      var d = document.createElement('div');
      d.id = 'gt_el'; d.className = 'notranslate'; d.style.display = 'none';
      document.body.appendChild(d);
    }
    if (window.google && window.google.translate && window.google.translate.TranslateElement) { make(); return; }
    if (document.querySelector('script[src*="translate_a/element.js"]')) return;   // the page already loads the widget itself

    window.qGoogleTranslateInit = make;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://translate.google.com/translate_a/element.js?cb=qGoogleTranslateInit';
    (document.head || document.documentElement).appendChild(s);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else setTimeout(start, 0);
})();
