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
  /* ===== natural voices on every device ===== */
  var MALE = /midhun|\bmale\b|ravi|prabhat|hemant|madhur|rishi/i, FEMALE = /female|sobhana|swara|lekha|heera|soumya|veena|neerja/i;
  function isM(v) { return MALE.test(v.name) && !FEMALE.test(v.name); }
  function vscore(v) {
    var n = v.name || '', s = 0;
    if (/natural|neural/i.test(n)) s += 10;            // Edge / Windows online natural voices
    if (/enhanced|premium|siri/i.test(n)) s += 8;      // iPhone / Mac
    if (/online/i.test(n)) s += 6;
    if (/google/i.test(n)) s += 5;                     // Chrome / Android
    if (v.localService === false) s += 2;
    if (/compact|espeak|festival/i.test(n)) s -= 6;    // robotic ones last
    return s;
  }
  function byLang(l) {
    return window.speechSynthesis ? speechSynthesis.getVoices().filter(function (v) {
      return v.lang.toLowerCase().replace('_', '-').indexOf(l) === 0; }) : [];
  }
  function pick(kind, lang) {          // kind: 'ml' meaning voice, 'tf' explanation voice
    var vs = lang ? byLang(lang) : (typeof window.mlVoices === 'function' ? window.mlVoices() : byLang('ml'));
    if (!vs.length) return null;
    vs = vs.slice().sort(function (a, b) { return vscore(b) - vscore(a) || a.name.localeCompare(b.name); });
    var best = vscore(vs[0]), pool = vs.filter(function (v) { return vscore(v) >= best - 2; });
    var a = pool.filter(isM)[0] || pool[0];
    if (kind !== 'tf') return a;
    return pool.filter(function (v) { return v !== a && isM(v) !== isM(a); })[0] ||
           vs.filter(function (v) { return v !== a; })[0] || a;
  }
  window.quranVoice = function (lang) { return pick('ml', lang); };
  onReady(function () {
    if (typeof window.resolveVoice === 'function') window.resolveVoice = function (kind) { return pick(kind); };
    if (typeof window.voiceProfile === 'function') window.voiceProfile = function (kind) {
      var v = pick(kind); if (!v) return null;
      var natural = vscore(v) >= 8, same = pick('ml') === pick('tf');
      return { voice: v, pitch: (kind === 'tf' && same && !natural) ? 0.8 : 1, rate: kind === 'tf' ? 0.85 : 0.95 };
    };
  });
  /* offline support */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/quran/sw.js', { scope: '/quran/' }).catch(function () {});
    });
  }
})();
