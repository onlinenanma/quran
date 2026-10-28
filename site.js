/* site.js – include on EVERY page:
   <script src="https://onlinenanma.github.io/quran/site.js" defer></script>
   1) remembers the chosen language for the whole site
   2) loads Google Translate only when a language other than Malayalam is chosen
   3) natural voices + text to speech in the translated language
   4) recitation audio: saves only Al-Ghamdi for offline use; recorded Malayalam voice with browser fallback
   5) registers the offline service worker (/quran/sw.js) */
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

  /* keep Arabic text untranslated: mark elements that are mostly Arabic */
  function markArabic(root) {
    var AR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    root.querySelectorAll('h1,h2,h3,p,span,div,a,li').forEach(function (e) {
      if (e.children.length) return;                       // only elements with no child elements
      var t = e.textContent, n = (t.match(AR) || []).length, len = t.replace(/\s/g, '').length;
      if (n && len && n / len > 0.5) e.setAttribute('translate', 'no');
    });
  }
  /* wrap every Arabic phrase inside normal text so Google leaves it alone */
  function wrapArabic(root) {
    var A = '[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF]',
        RE = new RegExp(A + '+(?:[ \\u00a0\\u200c\\u200d]+' + A + '+)*', 'g'),
        skip = /^(SCRIPT|STYLE|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE)$/;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || skip.test(p.nodeName) || (p.closest && p.closest('[translate="no"],.notranslate'))) return NodeFilter.FILTER_REJECT;
        RE.lastIndex = 0;
        return RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);                 // collect first, then edit
    nodes.forEach(function (node) {
      var text = node.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
      RE.lastIndex = 0;
      while ((m = RE.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var s = document.createElement('span');
        s.setAttribute('translate', 'no'); s.className = 'notranslate';
        s.style.fontFamily = '"Noto Naskh Arabic",serif';
        s.textContent = m[0]; frag.appendChild(s);
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }
  window.quranWrapArabic = wrapArabic;                             // pages that load text later can call this

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
      markArabic(document.body);
      wrapArabic(document.body);
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

  /* ===== text to speech follows the page language (Malayalam stays the default) ===== */
  var NUM = /(^|\s)\d+\s*[-\u2013:.)]\s*/g;            // list numbers like "1-" or "2:" are not read aloud
  function mlFrac(t) {                                  // share of Malayalam letters (Arabic, digits, punctuation ignored)
    var rest = t.replace(/[\s\d\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF.,:;!?()'"\u2018\u2019\u201C\u201D\-\u2013]/g, '');
    var ml = (rest.match(/[\u0D00-\u0D7F]/g) || []).length;
    return rest.length ? ml / rest.length : 1;
  }
  function spokenCode(text) {                           // which language to speak
    if (lang && lang !== 'ml') return lang;             // the language chosen on this site
    var h = (document.documentElement.lang || '').toLowerCase().split('-')[0];
    if (h && h !== 'ml') return h;                      // the browser's own translate changed <html lang>
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    var nl = (navigator.language || 'en').toLowerCase().split('-')[0];
    return nl === 'ml' ? 'en' : nl;
  }
  function shownText(el) {                              // the text currently on screen (translated) for one item
    var src = el.querySelector('.pl') || el.querySelector('.text') || el, c = src.cloneNode(true);
    c.querySelectorAll('.tag,.isti-ar,[translate="no"]').forEach(function (x) { x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function onlineChunks(chunks, code, my, done, i, kind, label) {      // fallback: online voice in that language
    if (my !== token) return;
    if (i >= chunks.length) { done(); return; }
    statusEl.textContent = (label ? label + ' · ' : '') + 'online voice (' + code + ') ' + (i + 1) + ' / ' + chunks.length;
    var a = (typeof sharedAudio !== 'undefined') ? sharedAudio : new Audio();
    a.src = 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + code + '&q=' + encodeURIComponent(chunks[i]);
    currentAudio = a; a.playbackRate = kind === 'tf' ? 0.85 : 0.95;
    a.onended = function () { onlineChunks(chunks, code, my, done, i + 1, kind, label); };
    a.onerror = function () { fail(my, 'Online voice is blocked or offline. Try Edge, or a device with the ' + code + ' voice installed.'); };
    a.play().catch(function () { fail(my, 'Could not play audio. Tap the button again.'); });
  }
  function speakIn(code, text, my, done, kind, label) {
    var chunks = splitText(cleanForSpeech(text));
    if (!chunks.length) { done(); return; }
    var vc = code.toLowerCase(), v = pick(kind, vc) || (vc.indexOf('-') > 0 ? pick(kind, vc.split('-')[0]) : null);
    if (!v) { onlineChunks(chunks, code, my, done, 0, kind, label); return; }
    var natural = vscore(v) >= 8, same = pick('ml', vc) === pick('tf', vc), hold = [];
    var pitch = (kind === 'tf' && same && !natural) ? 0.8 : 1, rate = kind === 'tf' ? 0.85 : 0.95;
    var next = function (i) {                           // one chunk at a time, with a stall watchdog
      if (my !== token) return;
      if (i >= chunks.length) { done(); return; }
      statusEl.textContent = (label ? label + ' · ' : '') + code + ' · ' + v.name + ' ' + (i + 1) + '/' + chunks.length;
      var u = new SpeechSynthesisUtterance(chunks[i]); hold[0] = u;
      u.voice = v; u.lang = v.lang; u.pitch = pitch; u.rate = rate;
      var started = false, over = false, wd;
      var fb = function () { if (over) return; over = true; clearTimeout(wd); speechSynthesis.cancel(); onlineChunks(chunks, code, my, done, i, kind, label); };
      wd = setTimeout(function () { if (my === token && !started) fb(); }, 5000);
      u.onstart = function () { started = true; };
      u.onend = function () { if (over) return; over = true; clearTimeout(wd); next(i + 1); };
      u.onerror = function (e) { if (my === token && e.error !== 'canceled' && e.error !== 'interrupted') fb(); };
      speechSynthesis.speak(u);
    };
    setTimeout(function () { next(0); }, 100);
  }
  /* ===== recorded Malayalam voice (Azure Midhun / Sobhana MP3 files); browser speech is the fallback =====
     The page plays /audio/<surah>/<surah><verse>-ml.mp3 (-tf.mp3 for the explanation) only when the file's
     manifest entry matches the text on this page; otherwise, or on any error, it uses the browser's voice.
     Played files are saved on the phone (at most REC_MAX) so they work offline. */
  var REC_BASE = 'https://onlinenanma.github.io/quran/audio/', REC_CACHE = 'quran-voice-v1', REC_MAX = 400;
  function p3(n) { return String(n).padStart(3, '0'); }
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }
  var recMan = null;
  function recManifest() {
    if (typeof SURAH === 'undefined') return Promise.resolve({});
    if (!recMan) recMan = fetch(REC_BASE + p3(SURAH) + '/manifest.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    return recMan;
  }
  function recSrc(url) {                                   // saved copy first; otherwise download it, save it, play it
    if (!window.caches) return Promise.resolve(url);
    var blobUrl = function (r) { return r.blob().then(function (b) { return URL.createObjectURL(b); }); };
    return caches.open(REC_CACHE).then(function (c) {
      return c.match(url).then(function (hit) {
        if (hit) return blobUrl(hit);
        if (!navigator.onLine) return null;
        return fetch(url).then(function (r) {
          if (!r.ok) return null;
          return c.put(url, r.clone()).then(function () {
            c.keys().then(function (ks) { for (var i = 0; i < ks.length - REC_MAX; i++) c.delete(ks[i]); });
            return blobUrl(r);
          });
        });
      });
    }).catch(function () { return null; });
  }
  function playRecorded(kind, n, text, my, done, fallback) {
    recManifest().then(function (man) {
      var key = p3(SURAH) + p3(n) + '-' + kind, e = man[key];
      if (!e || e.h !== fnv(text)) return fallback();      // no recording, or the text was edited after recording
      return recSrc(REC_BASE + p3(SURAH) + '/' + key + '.mp3').then(function (src) {
        if (my !== token) return;
        if (!src) return fallback();
        var a = (typeof sharedAudio !== 'undefined') ? sharedAudio : new Audio();
        var failed = false, bad = function () { if (failed || my !== token) return; failed = true; fallback(); };
        a.onended = function () { if (my === token) done(); };
        a.onerror = bad;
        a.src = src; a.playbackRate = 1; currentAudio = a;
        statusEl.textContent = (typeof curLabel !== 'undefined' ? curLabel + ' · ' : '') + (kind === 'tf' ? 'Sobhana' : 'Midhun') + ' (recorded)';
        a.play().catch(bad);
      });
    }).catch(function () { if (my === token) fallback(); });
  }
  onReady(function () { if (typeof SURAH !== 'undefined') recManifest(); });   // fetch the manifest early

  /* (Waking Edge Android's speech engine with a silent utterance did not make its voices appear, so there is no waiting.) */
  function ensureVoices(code, cb) { cb(); }
  onReady(function () {
    if (typeof window.speakMalayalam === 'function') {                 // chapter pages
      var origSpeak = window.speakMalayalam;
      window.speakMalayalam = function (text, my, done) {
        var el = (typeof activeKey !== 'undefined' && activeKey) ? document.getElementById('item-' + activeKey) : null;
        var shown = el ? shownText(el) : '', translated = !!shown && mlFrac(shown) < 0.5;
        var code = translated ? spokenCode(shown) : 'ml';
        ensureVoices(code, function () {
          if (my !== token) return;                                    // stopped while waiting
          if (translated)                                              // page is translated: read what is on screen
            speakIn(code, shown.replace(NUM, ' '), my, done,
                    typeof curKind !== 'undefined' ? curKind : 'ml', typeof curLabel !== 'undefined' ? curLabel : '');
          else {                                                       // Malayalam: recorded voice if there is one, else the page's own speech
            var kn = (typeof activeKey !== 'undefined' && activeKey) ? activeKey.split('-') : [];
            if (kn[0] === 'ml' || kn[0] === 'tf') playRecorded(kn[0], +kn[1], text, my, done, function () { origSpeak(text, my, done); });
            else origSpeak(text, my, done);
          }
        });
      };
    }
    if (typeof window.speakPreface === 'function') {                   // preface pages that still use the original speech code
      var origPref = window.speakPreface;
      window.speakPreface = function (text, my) {
        var translated = mlFrac(text) < 0.5, code = translated ? spokenCode(text) : 'ml';
        ensureVoices(code, function () {
          if (my !== token) return;
          if (translated) speakIn(code, text.replace(NUM, ' '), my, function () { stopSpeech(); }, 'ml', '');
          else origPref(text, my);
        });
      };
    }
  });

  /* ===== more reciters for every chapter page (folder names from everyayah.com) ===== */
  var EXTRA_RECITERS = [
    { id: 'alafasy',    name: 'മിഷാരി അൽ അഫാസി',         base: 'https://everyayah.com/data/Alafasy_64kbps' },
    { id: 'sudais',     name: 'അബ്ദുറഹ്മാൻ അസ്സുദൈസ്',    base: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_64kbps' },
    { id: 'shuraym',    name: 'സഊദ് അശ്ശുറൈം',           base: 'https://everyayah.com/data/Saood_ash-Shuraym_64kbps' },
    { id: 'husary',     name: 'മഹ്മൂദ് ഖലീൽ അൽ ഹുസ്വരി',   base: 'https://everyayah.com/data/Husary_64kbps' },
    { id: 'abdulbasit', name: 'അബ്ദുൽ ബാസിത്വ്',          base: 'https://everyayah.com/data/Abdul_Basit_Murattal_64kbps' },
    { id: 'jibreel',    name: 'മുഹമ്മദ് ജിബ്രീൽ',         base: 'https://everyayah.com/data/Muhammad_Jibreel_64kbps' },
    { id: 'budair',     name: 'സ്വലാഹ് അൽ ബുദൈർ',        base: 'https://everyayah.com/data/Salah_Al_Budair_128kbps' }
  ];
  onReady(function () {
    if (typeof RECITERS === 'undefined' || typeof initReciters !== 'function') return;
    EXTRA_RECITERS.forEach(function (r) {
      if (!RECITERS.some(function (x) { return x.id === r.id; })) RECITERS.push(r);
    });
    initReciters();                                     // rebuild the dropdown with the longer list
  });

  /* ===== recitation audio and the phone's storage =====
     - default reciter (Al-Ghamdi): each verse is saved on the device the first time it plays
     - every other reciter: streamed only, nothing is saved
     - offline: plays from the saved files (for another reciter, the saved Al-Ghamdi file of the same verse)
     - at most MAX_FILES verses are kept; the oldest are removed first */
  var DEFAULT_REC = '/Ghamadi_40kbps/', AUDIO_CACHE = 'quran-audio-v1', MAX_FILES = 1000;
  function isDefaultRec(url) { return url.indexOf(DEFAULT_REC) > -1; }
  function trimAudio(c) {
    return c.keys().then(function (ks) { for (var i = 0; i < ks.length - MAX_FILES; i++) c.delete(ks[i]); });
  }
  window.cachedSrc = function (url) {                    // replaces the page's own cachedSrc()
    if (!window.caches) return Promise.resolve(url);
    var blobUrl = function (r) { return r.blob().then(function (b) { return URL.createObjectURL(b); }); };
    var alt = url.replace(/\/data\/[^/]+\//, '/data/Ghamadi_40kbps/');
    return caches.open(AUDIO_CACHE).then(function (c) {
      var saved = function () {                          // saved copy of this verse: its own file, else Al-Ghamdi's
        return c.match(url).then(function (h) { return h || c.match(alt); })
                .then(function (h) { return h ? blobUrl(h) : url; });
      };
      if (!navigator.onLine) return saved();
      if (!isDefaultRec(url)) return url;                // other reciters: stream only
      return c.match(url).then(function (hit) {
        if (hit) return blobUrl(hit);
        return fetch(url, { mode: 'cors' }).then(function (r) {
          if (!r.ok) return url;
          return c.put(url, r.clone()).then(function () { trimAudio(c); return blobUrl(r); });
        }).catch(saved);                                 // connection failed → use what is saved
      });
    }).catch(function () { return url; });
  };
  if (window.caches) {                                   // one-time clean-up: remove other reciters saved by earlier versions
    caches.open(AUDIO_CACHE).then(function (c) {
      return c.keys().then(function (ks) { ks.forEach(function (r) { if (!isDefaultRec(r.url)) c.delete(r); }); });
    }).catch(function () {});
  }

  /* ===== error messages =====
     - verse recitation (Arabic audio) fails  -> VERSE_ERROR
     - text to speech (സാരം / വിവരണം / മുഖവുര) fails -> its own message, with TRY_AGAIN added in front */
  var VERSE_ERROR = 'വീണ്ടും ക്ലിക്ക് ചെയ്യുക, അല്ലെങ്കിൽ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക';
  var TRY_AGAIN = 'വീണ്ടും ക്ലിക്ക് ചെയ്യുക, ';
  onReady(function () {
    if (typeof window.fail !== 'function') return;
    var origFail = window.fail;
    window.fail = function (my, msg) {
      msg = msg || '';
      var recitation = typeof activeKey !== 'undefined' && /^ar-/.test(activeKey || '');   // read before fail() clears it
      if (recitation) msg = VERSE_ERROR;
      else if (msg.indexOf(TRY_AGAIN) !== 0) msg = TRY_AGAIN + msg;
      origFail(my, msg);
    };
  });

  /* ===== voice check: add #voices to the end of any page address to see which voices the browser lists ===== */
  if (location.hash === '#voices') onReady(function () {
    var box = document.createElement('pre');
    box.className = 'notranslate'; box.setAttribute('translate', 'no');
    box.style.cssText = 'position:fixed;left:6px;right:6px;bottom:6px;max-height:40vh;overflow:auto;z-index:99;background:rgba(0,0,0,.85);color:#fff;font:12px/1.4 monospace;padding:8px;border-radius:8px;white-space:pre-wrap';
    document.body.appendChild(box);
    function show() {
      var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
      var ml = vs.filter(function (v) { return /^ml/i.test(v.lang); });
      box.textContent = 'all voices: ' + vs.length + '  |  Malayalam: ' + ml.length + '  |  ' + new Date().toLocaleTimeString() + '\n' +
        ml.map(function (v) { return (v.localService ? 'local  ' : 'online ') + v.name + ' [' + v.lang + '] score ' + vscore(v); }).join('\n');
    }
    show();
    if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', show);
    setInterval(show, 2000);
  });

  /* ===== options banner: hides while you scroll down, comes back when you scroll up or reach the top ===== */
  onReady(function () {
    var bar = document.querySelector('.controls'); if (!bar) return;
    var css = document.createElement('style');
    css.textContent = '.controls{transition:transform .25s ease}.controls.bar-hide{transform:translateY(-130%)}' +
      '@media(prefers-reduced-motion:reduce){.controls{transition:none}}';
    document.head.appendChild(css);
    var last = Math.max(0, window.pageYOffset || 0), ticking = false;
    function update() {
      ticking = false;
      var y = Math.max(0, window.pageYOffset || 0), d = y - last;
      // stays visible while the options panel is open or something is playing (stop button / status line)
      var busy = bar.classList.contains('open') || document.querySelector('.main-btn.playing, .play-btn.playing');
      if (busy || y < 80) { bar.classList.remove('bar-hide'); last = y; return; }
      if (Math.abs(d) < 6) return;                          // ignore tiny movements
      last = y;
      if (d > 0 && y > 160) bar.classList.add('bar-hide'); else if (d < 0) bar.classList.remove('bar-hide');
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  });

  /* offline support */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/quran/sw.js', { scope: '/quran/' }).catch(function () {});
    });
  }
})();
