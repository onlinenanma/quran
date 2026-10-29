/* site.js – include on EVERY page:
   <script src="[https://onlinenanma.github.io/quran/site.js](https://onlinenanma.github.io/quran/site.js)" defer></script>
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

  /* hide Google's own bar / highlights & adjust CSS */
  var st = document.createElement('style');
  st.textContent = '.goog-te-banner-frame,.skiptranslate iframe{display:none!important}body{top:0!important}' +
    '.goog-text-highlight{background:none!important;box-shadow:none!important}#goog-gt-tt,.goog-tooltip{display:none!important}' +
    /* Banner in single tight line attached directly to the top bar */
    '.controls{margin-top:0!important;border-top:none!important;border-radius:0 0 12px 12px!important;position:sticky;top:0;z-index:100;background:var(--bg, #fff);box-shadow:0 2px 8px rgba(0,0,0,0.06);display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:space-between!important;padding:6px 12px!important;gap:8px!important}' +
    '.controls .bar-row,.controls > div:first-child{display:flex!important;flex-direction:row!important;align-items:center!important;gap:8px!important;margin:0!important;width:auto!important}' +
    'body>.hero{margin-bottom:0!important;border-bottom:4px solid var(--gold)!important}' +
    'body>.hero + div{text-align:center;margin:8px auto}' +
    'body>.hero + div h1{color:var(--acc, #1d5240);font-size:clamp(1.2rem,3.5vw,1.6rem);margin:4px 0}' +
    '@media(prefers-color-scheme:dark){body>.hero + div h1{color:var(--ink, #e9efe9)}}';
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
    /* language picker */
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
      var rm = document.querySelector('meta[name="referrer"]');
      if (rm) rm.setAttribute('content', 'strict-origin-when-cross-origin');
      window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({ pageLanguage: 'ml', autoDisplay: false }, 'gt_el');
      };
      var d = document.createElement('div'); d.id = 'gt_el'; d.style.display = 'none'; document.body.appendChild(d);
      var s = document.createElement('script');
      s.src = '[https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit](https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit)'; s.async = true;
      document.head.appendChild(s);
    }

    /* Fix 1: Ensure 'ഓപ്ഷനുകൾ ▾' and 'ഓപ്ഷനുകൾ ▴' label toggles correctly without showing 'തെരഞ്ഞെടുക്കാം' */
    var optBtn = document.getElementById('opt-toggle');
    if (optBtn) {
      optBtn.textContent = 'ഓപ്ഷനുകൾ ▾';
      var updateOptText = function() {
        setTimeout(function () {
          var panelEl = document.getElementById('panel');
          var isOpen = optBtn.classList.contains('open') || (panelEl && (panelEl.classList.contains('open') || panelEl.style.display === 'block'));
          if (isOpen) {
            optBtn.textContent = 'ഓപ്ഷനുകൾ ▴';
          } else {
            optBtn.textContent = 'ഓപ്ഷനുകൾ ▾';
          }
        }, 10);
      };
      optBtn.addEventListener('click', updateOptText, true);
    }

    /* Fix 2: 'കേൾക്കാം' master toggle button with Stop feature */
    var masterBtn = document.getElementById('master');
    if (masterBtn) {
      masterBtn.textContent = 'കേൾക്കാം';
      masterBtn.addEventListener('click', function(e) {
        if (masterBtn.classList.contains('playing')) {
          e.stopImmediatePropagation();
          if (typeof stopSpeech === 'function') stopSpeech();
          if (typeof currentAudio !== 'undefined' && currentAudio) { 
            currentAudio.pause(); 
            currentAudio.currentTime = 0; 
          }
          masterBtn.classList.remove('playing');
          masterBtn.textContent = 'കേൾക്കാം';
        }
      }, true);
    }

    /* Fix 3: Move 'തുടർച്ചയായി കേൾക്കുക' check box next to 'വിവരണം' inside the panel */
    var contInput = document.getElementById('cont');
    var panel = document.getElementById('panel');
    if (contInput) {
      var wrapper = contInput.closest('label');
      if (wrapper) wrapper.remove();
      var newLabel = document.createElement('label');
      newLabel.className = 'opt';
      newLabel.appendChild(contInput);
      newLabel.appendChild(document.createTextNode(' തുടർച്ചയായി കേൾക്കുക'));

      var vivaranamLabel = null;
      if (panel) {
        var labels = panel.querySelectorAll('label');
        labels.forEach(function(l) {
          if (l.textContent.indexOf('വിവരണം') > -1) vivaranamLabel = l;
        });
      }
      if (vivaranamLabel && vivaranamLabel.parentNode) {
        vivaranamLabel.parentNode.insertBefore(newLabel, vivaranamLabel.nextSibling);
      } else if (panel) {
        panel.appendChild(newLabel);
      }
    }

    /* Fix 4: Bismillah display only on pages starting with Verse 1 */
    var hasVerse1 = (typeof VERSES !== 'undefined' && VERSES.length && VERSES[0].n === 1);
    var bismiDiv = document.querySelector('body > div:has(h1)') || document.querySelector('body > div');
    if (bismiDiv && bismiDiv.textContent.indexOf('بِسْمِ') > -1) {
      if (!hasVerse1 && SURAH !== 1 && SURAH !== 9) {
        bismiDiv.remove();
      } else {
        var bEl = bismiDiv.querySelector('h1') || bismiDiv;
        if (bEl) bEl.style.color = 'var(--acc, #1d5240)';
      }
    }
  });

  /* ===== natural voices on every device ===== */
  var MALE = /midhun|\bmale\b|ravi|prabhat|hemant|madhur|rishi/i, FEMALE = /female|sobhana|swara|lekha|heera|soumya|veena|neerja/i;
  function isM(v) { return MALE.test(v.name) && !FEMALE.test(v.name); }
  function vscore(v) {
    var n = v.name || '', s = 0;
    if (/natural|neural/i.test(n)) s += 10;            
    if (/enhanced|premium|siri/i.test(n)) s += 8;      
    if (/online/i.test(n)) s += 6;
    if (/google/i.test(n)) s += 5;                     
    if (v.localService === false) s += 2;
    if (/compact|espeak|festival/i.test(n)) s -= 6;    
    return s;
  }
  function byLang(l) {
    return window.speechSynthesis ? speechSynthesis.getVoices().filter(function (v) {
      return v.lang.toLowerCase().replace('_', '-').indexOf(l) === 0; }) : [];
  }
  function pick(kind, lang) {          
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

  /* ===== text-to-speech engine: Page 2+ fix & Red playing button state handling ===== */
  var NUM = /(^|\s)\d+\s*[-\u2013:.)]\s*/g;
  function mlFrac(t) {
    var rest = t.replace(/[\s\d\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF.,:;!?()'"\u2018\u2019\u201C\u201D\-\u2013]/g, '');
    var ml = (rest.match(/[\u0D00-\u0D7F]/g) || []).length;
    return rest.length ? ml / rest.length : 1;
  }
  function spokenCode(text) {
    if (lang && lang !== 'ml') return lang;
    var h = (document.documentElement.lang || '').toLowerCase().split('-')[0];
    if (h && h !== 'ml') return h;
    if (/[\u0900-\u097F]/.test(text)) return 'hi';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn';
    var nl = (navigator.language || 'en').toLowerCase().split('-')[0];
    return nl === 'ml' ? 'en' : nl;
  }
  function shownText(el) {
    if (!el) return '';
    var src = el.querySelector('.pl') || el.querySelector('.text') || el, c = src.cloneNode(true);
    c.querySelectorAll('.tag,.isti-ar,[translate="no"]').forEach(function (x) { x.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  function cleanForSpeech(t) {
    return t.replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, ' ').replace(/[()\u2018\u2019\u201C\u201D"]/g, '').replace(/\s+/g, ' ').trim();
  }
  function splitText(text, max) {
    max = max || 140;
    var sentences = text.match(/[^.,:;!?।]+[.,:;!?।]*/g) || [text], chunks = [], cur = '';
    for (var j = 0; j < sentences.length; j++) {
      var s = sentences[j].trim();
      while (s.length > max) {
        var cut = s.lastIndexOf(' ', max); if (cut <= 0) cut = max;
        if (cur) { chunks.push(cur); cur = ''; }
        chunks.push(s.slice(0, cut).trim()); s = s.slice(cut).trim();
      }
      if (!s) continue;
      if (cur && (cur + ' ' + s).length > max) { chunks.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s;
    }
    if (cur) chunks.push(cur);
    return chunks.filter(function (c) { return /[^\s.,:;!?।]/.test(c); });
  }

  function onlineChunks(chunks, code, my, done, i, kind, label) {
    if (my !== token) return;
    if (i >= chunks.length) { done(); return; }
    if (typeof statusEl !== 'undefined' && statusEl) statusEl.textContent = (label ? label + ' · ' : '') + 'online voice (' + code + ') ' + (i + 1) + ' / ' + chunks.length;
    var a = (typeof sharedAudio !== 'undefined') ? sharedAudio : new Audio();
    a.src = '[https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=](https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=)' + code + '&q=' + encodeURIComponent(chunks[i]);
    if (typeof currentAudio !== 'undefined') currentAudio = a;
    a.playbackRate = kind === 'tf' ? 0.85 : 0.95;
    a.onended = function () { onlineChunks(chunks, code, my, done, i + 1, kind, label); };
    a.onerror = function () { done(); }; 
    a.play().catch(function () { done(); });
  }

  function speakIn(code, text, my, done, kind, label) {
    var chunks = splitText(cleanForSpeech(text));
    if (!chunks.length) { done(); return; }
    var vc = code.toLowerCase(), v = pick(kind, vc) || (vc.indexOf('-') > 0 ? pick(kind, vc.split('-')[0]) : null);
    if (!v) { onlineChunks(chunks, code, my, done, 0, kind, label); return; }
    var natural = vscore(v) >= 8, same = pick('ml', vc) === pick('tf', vc);
    var pitch = (kind === 'tf' && same && !natural) ? 0.8 : 1, rate = kind === 'tf' ? 0.85 : 0.95;
    
    var next = function (i) {
      if (my !== token) return;
      if (i >= chunks.length) { done(); return; }
      if (typeof statusEl !== 'undefined' && statusEl) statusEl.textContent = (label ? label + ' · ' : '') + code + ' · ' + v.name + ' ' + (i + 1) + '/' + chunks.length;
      
      if (typeof window.speechSynthesis === 'undefined') {
        onlineChunks(chunks, code, my, done, i, kind, label);
        return;
      }

      var u = new SpeechSynthesisUtterance(chunks[i]);
      if (typeof utterances !== 'undefined') utterances[0] = u;
      u.voice = v; u.lang = v.lang; u.pitch = pitch; u.rate = rate;
      
      var started = false, over = false, wd;
      var fb = function () {
        if (over) return; over = true; clearTimeout(wd);
        try { speechSynthesis.cancel(); } catch(e) {}
        onlineChunks(chunks, code, my, done, i, kind, label);
      };
      
      wd = setTimeout(function () { if (my === token && !started) fb(); }, 6000);
      u.onstart = function () { started = true; };
      u.onend = function () { if (over) return; over = true; clearTimeout(wd); next(i + 1); };
      u.onerror = function (e) { if (my === token && e.error !== 'canceled' && e.error !== 'interrupted') fb(); };
      
      try {
        speechSynthesis.speak(u);
      } catch (ex) {
        fb();
      }
    };
    try { speechSynthesis.cancel(); } catch(e) {}
    setTimeout(function () { next(0); }, 50);
  }

  var REC_BASE = '[https://onlinenanma.github.io/quran/audio/](https://onlinenanma.github.io/quran/audio/)', REC_CACHE = 'quran-voice-v1', REC_MAX = 400;
  function p3(n) { return String(n).padStart(3, '0'); }
  function fnv(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16); }
  var recMan = null;
  function recManifest() {
    if (typeof SURAH === 'undefined') return Promise.resolve({});
    if (!recMan) recMan = fetch(REC_BASE + p3(SURAH) + '/manifest.json').then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
    return recMan;
  }
  function recSrc(url) {
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
      if (!e || e.h !== fnv(text)) return fallback();
      return recSrc(REC_BASE + p3(SURAH) + '/' + key + '.mp3').then(function (src) {
        if (my !== token) return;
        if (!src) return fallback();
        var a = (typeof sharedAudio !== 'undefined') ? sharedAudio : new Audio();
        var failed = false, bad = function () { if (failed || my !== token) return; failed = true; fallback(); };
        a.onended = function () { if (my === token) done(); };
        a.onerror = bad;
        a.src = src; a.playbackRate = 1; if (typeof currentAudio !== 'undefined') currentAudio = a;
        if (typeof statusEl !== 'undefined' && statusEl) statusEl.textContent = (typeof curLabel !== 'undefined' ? curLabel + ' · ' : '') + (kind === 'tf' ? 'Sobhana' : 'Midhun') + ' (recorded)';
        a.play().catch(bad);
      });
    }).catch(function () { if (my !== token) fallback(); });
  }
  onReady(function () { if (typeof SURAH !== 'undefined') recManifest(); });

  function ensureVoices(code, cb) { cb(); }

  onReady(function () {
    /* Fix: Speech for Page 2+ and correct active red button highlighting */
    window.speakMalayalam = function (text, my, done) {
      var el = (typeof activeKey !== 'undefined' && activeKey) ? document.getElementById('item-' + activeKey) : null;
      var shown = el ? shownText(el) : text, translated = !!shown && mlFrac(shown) < 0.5;
      var code = translated ? spokenCode(shown) : 'ml';
      
      ensureVoices(code, function () {
        if (my !== token) return;
        if (translated) {
          speakIn(code, (shown || text).replace(NUM, ' '), my, done,
                  typeof curKind !== 'undefined' ? curKind : 'ml', typeof curLabel !== 'undefined' ? curLabel : '');
        } else {
          var kn = (typeof activeKey !== 'undefined' && activeKey) ? activeKey.split('-') : [];
          var verseNum = kn[1] ? +kn[1] : 0;
          var fallbackSpeech = function() {
            var chunks = splitText(cleanForSpeech(text), 120);
            if (!chunks.length) { done(); return; }
            var kind = typeof curKind !== 'undefined' ? curKind : 'ml';
            var found = pick(kind);
            if (!found) {
              onlineChunks(chunks, 'ml', my, done, 0, kind, typeof curLabel !== 'undefined' ? curLabel : '');
              return;
            }
            var nextChunk = function(idx) {
              if (my !== token) return;
              if (idx >= chunks.length) { done(); return; }
              if (typeof statusEl !== 'undefined' && statusEl) statusEl.textContent = (typeof curLabel !== 'undefined' ? curLabel + ' · ' : '') + (found.name || 'Malayalam Voice') + ' (' + (idx+1) + '/' + chunks.length + ')';
              
              if (typeof window.speechSynthesis === 'undefined') {
                onlineChunks(chunks, 'ml', my, done, idx, kind, typeof curLabel !== 'undefined' ? curLabel : '');
                return;
              }

              var u = new SpeechSynthesisUtterance(chunks[idx]);
              if (typeof utterances !== 'undefined') utterances[0] = u;
              u.voice = found.voice || found; u.lang = u.voice.lang || 'ml-IN'; u.pitch = 1; u.rate = 0.95;
              
              var doneCalled = false, tmr;
              var advance = function() {
                if (doneCalled) return; doneCalled = true;
                clearTimeout(tmr);
                nextChunk(idx + 1);
              };
              
              tmr = setTimeout(advance, 7000); 
              u.onend = advance;
              u.onerror = advance;
              
              try {
                speechSynthesis.speak(u);
              } catch(e) {
                advance();
              }
            };
            try { speechSynthesis.cancel(); } catch(e) {}
            setTimeout(function() { nextChunk(0); }, 50);
          };

          if ((kn[0] === 'ml' || kn[0] === 'tf') && verseNum > 0) {
            playRecorded(kn[0], verseNum, text, my, done, fallbackSpeech);
          } else {
            fallbackSpeech();
          }
        }
      });
    };

    if (typeof window.speakPreface === 'function') {
      var origPref = window.speakPreface;
      window.speakPreface = function (text, my) {
        var translated = mlFrac(text) < 0.5, code = translated ? spokenCode(text) : 'ml';
        ensureVoices(code, function () {
          if (my !== token) return;
          if (translated) speakIn(code, text.replace(NUM, ' '), my, function () { if (typeof stopSpeech === 'function') stopSpeech(); }, 'ml', '');
          else origPref(text, my);
        });
      };
    }
  });

  /* ===== extra reciters ===== */
  var EXTRA_RECITERS = [
    { id: 'alafasy',    name: 'മിഷാരി അൽ അഫാസി',         base: '[https://everyayah.com/data/Alafasy_64kbps](https://everyayah.com/data/Alafasy_64kbps)' },
    { id: 'sudais',     name: 'അബ്ദുറഹ്മാൻ അസ്സുദൈസ്',    base: '[https://everyayah.com/data/Abdurrahmaan_As-Sudais_64kbps](https://everyayah.com/data/Abdurrahmaan_As-Sudais_64kbps)' },
    { id: 'shuraym',    name: 'സഊദ് അശ്ശുറൈം',           base: '[https://everyayah.com/data/Saood_ash-Shuraym_64kbps](https://everyayah.com/data/Saood_ash-Shuraym_64kbps)' },
    { id: 'husary',     name: 'മഹ്മൂദ് ഖലീൽ അൽ ഹുസ്വരി',   base: '[https://everyayah.com/data/Husary_64kbps](https://everyayah.com/data/Husary_64kbps)' },
    { id: 'abdulbasit', name: 'അബ്ദുൽ ബാസിത്വ്',          base: '[https://everyayah.com/data/Abdul_Basit_Murattal_64kbps](https://everyayah.com/data/Abdul_Basit_Murattal_64kbps)' },
    { id: 'jibreel',    name: 'മുഹമ്മദ് ജിബ്രീൽ',         base: '[https://everyayah.com/data/Muhammad_Jibreel_64kbps](https://everyayah.com/data/Muhammad_Jibreel_64kbps)' },
    { id: 'budair',     name: 'സ്വലാഹ് അൽ ബുദൈർ',        base: '[https://everyayah.com/data/Salah_Al_Budair_128kbps](https://everyayah.com/data/Salah_Al_Budair_128kbps)' }
  ];
  onReady(function () {
    if (typeof RECITERS === 'undefined' || typeof initReciters !== 'function') return;
    EXTRA_RECITERS.forEach(function (r) {
      if (!RECITERS.some(function (x) { return x.id === r.id; })) RECITERS.push(r);
    });
    initReciters();
  });

  /* ===== audio caching ===== */
  var DEFAULT_REC = '/Ghamadi_40kbps/', AUDIO_CACHE = 'quran-audio-v1', MAX_FILES = 1000;
  function isDefaultRec(url) { return url.indexOf(DEFAULT_REC) > -1; }
  function trimAudio(c) {
    return c.keys().then(function (ks) { for (var i = 0; i < ks.length - MAX_FILES; i++) c.delete(ks[i]); });
  }
  window.cachedSrc = function (url) {
    if (!window.caches) return Promise.resolve(url);
    var blobUrl = function (r) { return r.blob().then(function (b) { return URL.createObjectURL(b); }); };
    var alt = url.replace(/\/data\/[^/]+\//, '/data/Ghamadi_40kbps/');
    return caches.open(AUDIO_CACHE).then(function (c) {
      var saved = function () {
        return c.match(url).then(function (h) { return h || c.match(alt); })
                .then(function (h) { return h ? blobUrl(h) : url; });
      };
      if (!navigator.onLine) return saved();
      if (!isDefaultRec(url)) return url;
      return c.match(url).then(function (hit) {
        if (hit) return blobUrl(hit);
        return fetch(url, { mode: 'cors' }).then(function (r) {
          if (!r.ok) return url;
          return c.put(url, r.clone()).then(function () { trimAudio(c); return blobUrl(r); });
        }).catch(saved);
      });
    }).catch(function () { return url; });
  };
  if (window.caches) {
    caches.open(AUDIO_CACHE).then(function (c) {
      return c.keys().then(function (ks) { ks.forEach(function (r) { if (!isDefaultRec(r.url)) c.delete(r); }); });
    }).catch(function () {});
  }

  /* ===== error messages & non-blocking fallback handling ===== */
  var VERSE_ERROR = 'വീണ്ടും ക്ലിക്ക് ചെയ്യുക, അല്ലെങ്കിൽ ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക';
  var TRY_AGAIN = 'വീണ്ടും ക്ലിക്ക് ചെയ്യുക, ';
  onReady(function () {
    if (typeof window.fail !== 'function') return;
    var origFail = window.fail;
    window.fail = function (my, msg) {
      msg = msg || '';
      var recitation = typeof activeKey !== 'undefined' && /^ar-/.test(activeKey || '');
      if (recitation) msg = VERSE_ERROR;
      else if (msg.indexOf(TRY_AGAIN) !== 0) msg = TRY_AGAIN + msg;
      origFail(msg);
    };
  });

  /* ===== Bismillah: show only on pages with verse 1, matching verse color style ===== */
  function playBismillah(my, done) {
    var rec = currentReciter(), url = rec.base.replace(/\/*$/, '/') + '001001.mp3';
    if (typeof curKind !== 'undefined') curKind = 'ml';
    if (typeof curLabel !== 'undefined') curLabel = 'ബിസ്മി';
    if (typeof statusEl !== 'undefined' && statusEl) statusEl.textContent = 'ബിസ്മി · ' + rec.name;
    Promise.resolve(typeof window.cachedSrc === 'function' ? window.cachedSrc(url) : url).then(function (u) {
      if (my !== token) return;
      var a = (typeof sharedAudio !== 'undefined') ? sharedAudio : new Audio(), over = false;
      var next = function () { if (over || my !== token) return; over = true; done(); };
      a.onended = next; a.onerror = next;
      a.src = u; a.playbackRate = 1; if (typeof currentAudio !== 'undefined') currentAudio = a;
      a.play().catch(next);
    }).catch(function () { if (my !== token) done(); });
  }
  onReady(function () {
    if (typeof SURAH === 'undefined') return;
    var hasVerse1 = (typeof VERSES !== 'undefined' && VERSES.length && VERSES[0].n === 1);
    var bismiDiv = document.querySelector('body > div:has(h1)') || document.querySelector('body > div');
    
    if (!hasVerse1 && SURAH !== 1 && SURAH !== 9) {
      if (bismiDiv && bismiDiv.textContent.indexOf('بِسْمِ') > -1) {
        bismiDiv.remove();
      }
    } else if (bismiDiv) {
      var bEl = bismiDiv.querySelector('h1') || bismiDiv;
      if (bEl) bEl.style.color = 'var(--acc, #1d5240)';
    }

    if (SURAH === 1 || SURAH === 9) return;
    if (typeof window.playItem !== 'function' || typeof window.toggleContinuous !== 'function' ||
        typeof fullQueue !== 'function' || typeof runQueue !== 'function' || typeof VERSES === 'undefined') return;
    
    var origPlay = window.playItem, origToggle = window.toggleContinuous;
    window.playItem = function (kind, n, my, done) { return kind === 'bm' ? playBismillah(my, done) : origPlay(kind, n, my, done); };
    window.toggleContinuous = function () {
      var masterBtn = document.getElementById('master');
      if (masterBtn && masterBtn.classList.contains('playing')) return origToggle();
      var q = fullQueue(), ar = document.getElementById('show-ar');
      if (!q.length || !VERSES.length || VERSES[0].n !== 1 || q[0].n !== 1 || (ar && !ar.checked)) return origToggle();
      q.unshift({ kind: 'bm', n: 0 });
      runQueue(q, true);
    };
  });

  /* offline support */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/quran/sw.js', { scope: '/quran/' }).catch(function () {});
    });
  }
})();
