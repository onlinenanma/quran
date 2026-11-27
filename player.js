/* player.js - Handles audio playback, reciter selection, queue management,
   options panel state, screen wake lock, and translated UI labels. */
(function() {
  'use strict';

  var wakeLockSentinel = null;
  var userWakeToggled = false;
  var lastAppliedLang = null;

  function normalizeLang(lang) {
    if (!lang) return 'ml';
    var s = String(lang).trim();
    if (!s || s.toLowerCase() === 'ml' || s.toLowerCase().indexOf('ml-') === 0) {
      return 'ml';
    }
    return s;
  }

  /* Helper to get chosen language from cookie/localStorage */
  function getLang() {
    var cookieLang = null;
    try {
      var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
      if (m && m[1]) {
        var v = decodeURIComponent(m[1]);
        var x = v.match(/^\/[^\/]*\/([A-Za-z0-9_-]+)/);
        if (x && x[1]) {
          cookieLang = normalizeLang(x[1]);
        }
      }
    } catch (e) {}

    var storedLang = null;
    try {
      storedLang = localStorage.getItem('quran-lang');
    } catch (e) {}

    if (cookieLang) {
      try {
        if (storedLang !== cookieLang) {
          localStorage.setItem('quran-lang', cookieLang);
        }
      } catch (e) {}
      return cookieLang;
    }

    if (storedLang) {
      return normalizeLang(storedLang);
    }

    return 'ml';
  }

  /* Language dictionary for player options panel controls */
  var PLAYER_DICT = {
    "ml": {
      fontSize: "അക്ഷര വലിപ്പം:",
      show: "കാണിക്കുക:",
      verse: "ആയത്ത്",
      meaning: "സാരം",
      tafsir: "വിവരണം",
      reciter: "ഖിറാഅത്ത് (പാരായണം):",
      repeat: "ആയത്ത് ആവർത്തനം:",
      continuous: "തുടർച്ചയായി കേൾക്കുക",
      wake: "സ്‌ക്രീൻ ഓൺ ആക്കി വെക്കുക"
    },
    "en": {
      fontSize: "Font Size:",
      show: "Show:",
      verse: "Verse",
      meaning: "Meaning",
      tafsir: "Tafsir",
      reciter: "Reciter:",
      repeat: "Verse Repeat:",
      continuous: "Play Continuously",
      wake: "Keep Screen On"
    },
    "hi": {
      fontSize: "फ़ॉन्ट आकार:",
      show: "दिखाएं:",
      verse: "आयात",
      meaning: "अर्थ",
      tafsir: "व्याख्या",
      reciter: "क़ारी:",
      repeat: "आयात दोहराव:",
      continuous: "लगातार चलाएं",
      wake: "स्क्रीन ऑन रखें"
    },
    "ta": {
      fontSize: "எழுத்து அளவு:",
      show: "காட்டு:",
      verse: "வசனம்",
      meaning: "பொருள்",
      tafsir: "விளக்கம்",
      reciter: "ஓதுபவர்:",
      repeat: "வசனம் மீண்டும்:",
      continuous: "தொடர்ந்து இயக்கவும்",
      wake: "திரையை ஆன் செய்க"
    },
    "te": {
      fontSize: "అక్షర పరిమాణం:",
      show: "చూపించు:",
      verse: "ఆయత్",
      meaning: "అర్థం",
      tafsir: "వివరణ",
      reciter: "ఖారీ:",
      repeat: "ఆయత్ పునరావృతం:",
      continuous: "నిరంతరం ప్లే చేయండి",
      wake: "స్క్రీన్ ఆన్ ఉంచండి"
    },
    "kn": {
      fontSize: "ಅಕ್ಷರ ಗಾತ್ರ:",
      show: "ತೋರಿಸಿ:",
      verse: "ಆಯತ್",
      meaning: "ಅರ್ಥ",
      tafsir: "ವಿವರಣೆ",
      reciter: "ಓದುಗರು:",
      repeat: "ಆಯತ್ ಪುನರಾವರ್ತನೆ:",
      continuous: "ನಿರಂತರವಾಗಿ ಪ್ಲೇ ಮಾಡಿ",
      wake: "ಸ್ಕ್ರೀನ್ ಆನ್ ಇರಿಸಿ"
    },
    "ar": {
      fontSize: "حجم الخط:",
      show: "إظهار:",
      verse: "الآية",
      meaning: "الترجمة",
      tafsir: "التفسير",
      reciter: "القارئ:",
      repeat: "تكرار الآية:",
      continuous: "تشغيل متواصل",
      wake: "إبقاء الشاشة مضاءة"
    }
  };

  function getDictForLang(lang) {
    var norm = normalizeLang(lang);
    if (PLAYER_DICT[norm]) return PLAYER_DICT[norm];
    var base = norm.split('-')[0].toLowerCase();
    if (PLAYER_DICT[base]) return PLAYER_DICT[base];
    return PLAYER_DICT['en'];
  }

  /* Apply UI translations inside options panel safely */
  function applyPlayerTranslations(force) {
    var curLang = getLang();
    if (!force && lastAppliedLang === curLang) {
      return;
    }

    var panel = document.getElementById('panel');
    if (!panel) return;

    var dict = getDictForLang(curLang);

    try {
      panel.classList.add('notranslate');
      panel.setAttribute('translate', 'no');
    } catch (e) {}

    var titles = panel.querySelectorAll('.ctl-title');
    for (var i = 0; i < titles.length; i++) {
      var el = titles[i];
      var role = el.getAttribute('data-role') || '';
      var text = (el.textContent || '').trim();

      if (!role) {
        if (/font|size|അക്ഷര|വലിപ്പം|फ़ॉन्ट|எழுத்து|అక్షర|ಅಕ್ಷರ|حجم/i.test(text)) {
          role = 'fontSize';
        } else if (/show|കാണിക്കുക|दिखाएं|காட்டு|చూపించు|ತೋರಿಸಿ|إظهار/i.test(text)) {
          role = 'show';
        } else if (/reciter|ഖിറാഅത്ത്|പാരായണം|क़ारी|ஓதுபவர்|ఖారీ|ಓದುಗರು|القارئ/i.test(text)) {
          role = 'reciter';
        } else if (/repeat|ആവർത്തനം|दोहराव|மீண்டும்|పునరావృతం|ಪುನರಾವರ್ತನೆ|تكرار/i.test(text)) {
          role = 'repeat';
        }
        if (role) el.setAttribute('data-role', role);
      }

      if (role && dict[role] && el.textContent !== dict[role]) {
        el.textContent = dict[role];
      }
    }

    var labels = panel.querySelectorAll('label.opt');
    for (var j = 0; j < labels.length; j++) {
      var lbl = labels[j];
      var input = lbl.querySelector('input');
      if (!input) continue;

      var key = '';
      if (input.id === 'show-ar') key = dict.verse;
      else if (input.id === 'show-ml') key = dict.meaning;
      else if (input.id === 'show-tf') key = dict.tafsir;
      else if (input.id === 'cont') key = dict.continuous;
      else if (input.id === 'opt-wake') key = dict.wake;

      if (key) {
        for (var k = 0; k < lbl.childNodes.length; k++) {
          var node = lbl.childNodes[k];
          if (node.nodeType === 3) {
            var desired = ' ' + key;
            if (node.nodeValue !== desired) {
              node.nodeValue = desired;
            }
          }
        }
      }
    }

    lastAppliedLang = curLang;
  }

  /* Wake lock management */
  function getWakeCheckbox() {
    var direct = document.getElementById('opt-wake');
    if (direct) return direct;
    var inputs = document.querySelectorAll('input[type="checkbox"]');
    for (var i = 0; i < inputs.length; i++) {
      var cb = inputs[i];
      var idName = ((cb.id || '') + ' ' + (cb.name || '')).toLowerCase();
      var lblText = ((cb.closest && cb.closest('label') ? cb.closest('label').textContent : '') || '').toLowerCase();
      if (/wake|screen|സ്ക്രീൻ|സ്‌ക്രീൻ/.test(idName + ' ' + lblText)) return cb;
    }
    return null;
  }

  function releaseWake() {
    if (wakeLockSentinel) {
      try { wakeLockSentinel.release(); } catch (e) {}
      wakeLockSentinel = null;
    }
  }
  window.releaseWake = releaseWake;

  async function requestWake() {
    var cb = getWakeCheckbox();
    if (!cb || !cb.checked) return;
    if (!('wakeLock' in navigator) || !navigator.wakeLock) return;
    if (wakeLockSentinel) return;

    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', function() { wakeLockSentinel = null; });
    } catch (e) {
      wakeLockSentinel = null;
    }
  }
  window.requestWake = requestWake;

  function initPlayerWakeState() {
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && /wake/i.test(k)) localStorage.removeItem(k);
      }
    } catch (e) {}

    function resetWakeCheckbox() {
      if (userWakeToggled) return;
      var cb = getWakeCheckbox();
      if (cb) {
        if (cb.checked) cb.checked = false;
        cb.removeAttribute('checked');
        if (!cb.getAttribute('data-wake-init')) {
          cb.setAttribute('data-wake-init', '1');
          cb.addEventListener('change', function() {
            userWakeToggled = true;
            if (cb.checked) requestWake(); else releaseWake();
          });
        }
      }
      releaseWake();
    }

    resetWakeCheckbox();
    applyPlayerTranslations(true);

    window.addEventListener('load', function() {
      resetWakeCheckbox();
      applyPlayerTranslations(true);
    });

    window.addEventListener('pageshow', function() {
      resetWakeCheckbox();
      applyPlayerTranslations(true);
    });

    if (typeof MutationObserver !== 'undefined') {
      var panelEl = document.getElementById('panel');
      if (panelEl) {
        var obs = new MutationObserver(function() {
          if (!userWakeToggled) resetWakeCheckbox();
          lastAppliedLang = null;
          applyPlayerTranslations(false);
        });
        obs.observe(panelEl, { childList: true, subtree: true });
      }
    }

    window.addEventListener('pagehide', releaseWake);
    window.addEventListener('beforeunload', releaseWake);
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) releaseWake();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayerWakeState);
  } else {
    initPlayerWakeState();
  }

  var origStopAll = window.stopAll;
  window.stopAll = function() {
    releaseWake();
    if (typeof origStopAll === 'function') origStopAll.apply(this, arguments);
  };

  var origStopSpeech = window.stopSpeech;
  window.stopSpeech = function() {
    releaseWake();
    if (typeof origStopSpeech === 'function') origStopSpeech.apply(this, arguments);
  };
})();
