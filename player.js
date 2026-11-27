/* player.js - Complete verse renderer, audio/TTS playback, options panel,
   screen wake lock, and translated UI labels. */
(function() {
  'use strict';

  var wakeLockSentinel = null;
  var userWakeToggled = false;
  var lastAppliedLang = null;

  var isPlaying = false;
  var isContinuous = false;
  var currentAudio = null;
  var currentItemEl = null;
  var fontSizePx = 18;
  var currentReciter = 'ar.alafasy';

  var RECITERS = [
    { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy' },
    { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)' },
    { id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary' },
    { id: 'ar.minshawi', name: 'Mohamed Siddiq El-Minshawi' },
    { id: 'ar.sudais', name: 'Abdur-Rahman As-Sudais' }
  ];

  function normalizeLang(lang) {
    if (!lang) return 'ml';
    var s = String(lang).trim();
    if (!s || s.toLowerCase() === 'ml' || s.toLowerCase().indexOf('ml-') === 0) {
      return 'ml';
    }
    return s;
  }

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
      wake: "സ്‌ക്രീൻ ഓൺ ആക്കി വെക്കുക",
      versePrefix: "ആയത്ത്",
      noSummary: "ഈ അധ്യായത്തിന്റെ സംഗ്രഹം ലഭ്യമല്ല.",
      noQuiz: "ഈ അധ്യായത്തിന്റെ ക്വിസ് ലഭ്യമല്ല.",
      listenBtn: "കേൾക്കാം",
      stopBtn: "നിർത്തുക",
      optionsBtn: "ഓപ്ഷനുകൾ ▾"
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
      wake: "Keep Screen On",
      versePrefix: "Verse",
      noSummary: "Summary is not available for this chapter.",
      noQuiz: "Quiz is not available for this chapter.",
      listenBtn: "Play",
      stopBtn: "Stop",
      optionsBtn: "Options ▾"
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
      wake: "स्क्रीन ऑन रखें",
      versePrefix: "आयात",
      noSummary: "इस अध्याय का सारांश उपलब्ध नहीं है।",
      noQuiz: "इस अध्याय की प्रश्नोत्तरी उपलब्ध नहीं है।",
      listenBtn: "चलाएं",
      stopBtn: "रोकें",
      optionsBtn: "विकल्प ▾"
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
      wake: "திரையை ஆன் செய்க",
      versePrefix: "வசனம்",
      noSummary: "இந்த அத்தியாயத்தின் சுருக்கம் கிடைக்கவில்லை.",
      noQuiz: "இந்த அத்தியாயத்திற்கான வினாடி வினா கிடைக்கவில்லை.",
      listenBtn: "இயக்கு",
      stopBtn: "நிறுத்து",
      optionsBtn: "விருப்பங்கள் ▾"
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
      wake: "స్క్రీన్ ఆన్ ఉంచండి",
      versePrefix: "ఆయత్",
      noSummary: "ఈ అధ్యాయానికి సారాంశం అందుబాటులో లేదు.",
      noQuiz: "ఈ అధ్యాయానికి క్విజ్ అందుబాటులో లేదు.",
      listenBtn: "ప్లే",
      stopBtn: "ఆపు",
      optionsBtn: "అప్షన్లు ▾"
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
      wake: "ಸ್ಕ್ರೀನ್ ಆನ್ ಇರಿಸಿ",
      versePrefix: "ಆಯತ್",
      noSummary: "ಈ ಅಧ್ಯಾಯದ ಸಾರಾಂಶ ಲಭ್ಯವಿಲ್ಲ.",
      noQuiz: "ಈ ಅಧ್ಯಾಯದ ರಸಪ್ರಶ್ನೆ ಲಭ್ಯವಿಲ್ಲ.",
      listenBtn: "ಪ್ಲೇ",
      stopBtn: "ನಿಲ್ಲಿಸಿ",
      optionsBtn: "ಆಯ್ಕೆಗಳು ▾"
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
      wake: "إبقاء الشاشة مضاءة",
      versePrefix: "الآية",
      noSummary: "الملخص غير متوفر لهذه السورة.",
      noQuiz: "الاختبار غير متوفر لهذه السورة.",
      listenBtn: "تشغيل",
      stopBtn: "إيقاف",
      optionsBtn: "خيارات ▾"
    }
  };

  function getDictForLang(lang) {
    var norm = normalizeLang(lang);
    if (PLAYER_DICT[norm]) return PLAYER_DICT[norm];
    var base = norm.split('-')[0].toLowerCase();
    if (PLAYER_DICT[base]) return PLAYER_DICT[base];
    return PLAYER_DICT['en'];
  }

  function setStatus(msg) {
    var st = document.getElementById('status');
    if (st) st.textContent = msg || '';
  }

  function populateReciters() {
    var sel = document.getElementById('reciter');
    if (!sel) return;
    if (sel.options.length === 0) {
      for (var i = 0; i < RECITERS.length; i++) {
        var opt = document.createElement('option');
        opt.value = RECITERS[i].id;
        opt.textContent = RECITERS[i].name;
        sel.appendChild(opt);
      }
    }
    sel.value = currentReciter;
  }

  function loadSettings() {
    try {
      var savedFs = parseInt(localStorage.getItem('quran-fs') || '18', 10);
      if (savedFs >= 12 && savedFs <= 36) fontSizePx = savedFs;

      var savedRec = localStorage.getItem('quran-reciter');
      if (savedRec) currentReciter = savedRec;

      var savedRep = localStorage.getItem('quran-repeat');
      var repSel = document.getElementById('repeat');
      if (repSel && savedRep) repSel.value = savedRep;

      var showAr = localStorage.getItem('quran-show-ar');
      var showMl = localStorage.getItem('quran-show-ml');
      var showTf = localStorage.getItem('quran-show-tf');

      var cbAr = document.getElementById('show-ar');
      var cbMl = document.getElementById('show-ml');
      var cbTf = document.getElementById('show-tf');

      if (cbAr && showAr !== null) cbAr.checked = showAr === '1';
      if (cbMl && showMl !== null) cbMl.checked = showMl === '1';
      if (cbTf && showTf !== null) cbTf.checked = showTf === '1';
    } catch (e) {}

    document.documentElement.style.setProperty('--fs', fontSizePx + 'px');
    var fsLabel = document.getElementById('fs-label');
    if (fsLabel) fsLabel.textContent = String(fontSizePx);
    populateReciters();
    applyDisplay(false);
  }

  function saveSettings() {
    try {
      localStorage.setItem('quran-fs', String(fontSizePx));
      localStorage.setItem('quran-reciter', currentReciter);
      var repSel = document.getElementById('repeat');
      if (repSel) localStorage.setItem('quran-repeat', repSel.value);

      var cbAr = document.getElementById('show-ar');
      var cbMl = document.getElementById('show-ml');
      var cbTf = document.getElementById('show-tf');
      if (cbAr) localStorage.setItem('quran-show-ar', cbAr.checked ? '1' : '0');
      if (cbMl) localStorage.setItem('quran-show-ml', cbMl.checked ? '1' : '0');
      if (cbTf) localStorage.setItem('quran-show-tf', cbTf.checked ? '1' : '0');
    } catch (e) {}
  }
  window.saveSettings = saveSettings;

  function changeFont(delta) {
    fontSizePx = Math.max(12, Math.min(36, fontSizePx + delta));
    document.documentElement.style.setProperty('--fs', fontSizePx + 'px');
    var fsLabel = document.getElementById('fs-label');
    if (fsLabel) fsLabel.textContent = String(fontSizePx);
    saveSettings();
  }
  window.changeFont = changeFont;

  function applyDisplay(shouldSave) {
    if (shouldSave === undefined) shouldSave = true;
    var cbAr = document.getElementById('show-ar');
    var cbMl = document.getElementById('show-ml');
    var cbTf = document.getElementById('show-tf');

    document.body.classList.toggle('hide-ar', cbAr ? !cbAr.checked : false);
    document.body.classList.toggle('hide-ml', cbMl ? !cbMl.checked : false);
    document.body.classList.toggle('hide-tf', cbTf ? !cbTf.checked : true);

    if (shouldSave) saveSettings();
  }
  window.applyDisplay = applyDisplay;

  function changeReciter(val) {
    if (val) currentReciter = val;
    saveSettings();
  }
  window.changeReciter = changeReciter;

  function togglePanel(ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    var ctl = document.getElementById('controls');
    if (ctl) ctl.classList.toggle('open');
  }
  window.togglePanel = togglePanel;

  document.addEventListener('click', function(ev) {
    var ctl = document.getElementById('controls');
    if (!ctl || !ctl.classList.contains('open')) return;
    if (!ctl.contains(ev.target)) {
      ctl.classList.remove('open');
    }
  });

  function clearHighlight() {
    if (currentItemEl) {
      currentItemEl.classList.remove('reading');
