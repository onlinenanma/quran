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
      var btn = currentItemEl.querySelector('.play-btn');
      if (btn) btn.classList.remove('playing');
      currentItemEl = null;
    }
  }

  function stopSpeech() {
    try {
      if (typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    releaseWake();
  }
  window.stopSpeech = stopSpeech;

  function stopAll() {
    isPlaying = false;
    isContinuous = false;
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } catch (e) {}
      currentAudio = null;
    }
    stopSpeech();
    clearHighlight();
    var masterBtn = document.getElementById('master');
    var dict = getDictForLang(getLang());
    if (masterBtn) {
      masterBtn.classList.remove('playing');
      masterBtn.textContent = dict.listenBtn;
    }
    setStatus('');
  }
  window.stopAll = stopAll;

  function getRepeatCount() {
    var repSel = document.getElementById('repeat');
    var n = repSel ? parseInt(repSel.value, 10) : 1;
    return isNaN(n) || n < 1 ? 1 : n;
  }

  function playVerseAudio(verseNum, itemEl, repeatLeft, onDone) {
    stopSpeech();
    if (currentAudio) {
      try { currentAudio.pause(); } catch (e) {}
      currentAudio = null;
    }

    clearHighlight();
    currentItemEl = itemEl;
    if (itemEl) {
      itemEl.classList.add('reading');
      var pBtn = itemEl.querySelector('.play-btn');
      if (pBtn) pBtn.classList.add('playing');
      try { itemEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    }

    var surahNum = (typeof window.SURAH !== 'undefined' && window.SURAH) ? window.SURAH : 1;
    var url = 'https://cdn.islamic.network/quran/audio/128/' + currentReciter + '/' + getGlobalAyahNumber(surahNum, verseNum) + '.mp3';

    var audio = new Audio(url);
    currentAudio = audio;
    isPlaying = true;
    requestWake();

    var finished = false;
    function finishOnce() {
      if (finished) return;
      finished = true;
      if (repeatLeft > 1) {
        playVerseAudio(verseNum, itemEl, repeatLeft - 1, onDone);
      } else {
        clearHighlight();
        if (typeof onDone === 'function') onDone();
      }
    }

    audio.addEventListener('ended', finishOnce);
    audio.addEventListener('error', function() {
      try {
        var arText = itemEl ? (itemEl.getAttribute('data-ar') || '') : '';
        if (arText && typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined') {
          var utter = new SpeechSynthesisUtterance(arText);
          utter.lang = 'ar-SA';
          utter.onend = finishOnce;
          utter.onerror = finishOnce;
          window.speechSynthesis.speak(utter);
          return;
        }
      } catch (e) {}
      finishOnce();
    });

    audio.play().catch(function() {
      finishOnce();
    });
  }

  var SURAH_VERSE_COUNTS = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];

  function getGlobalAyahNumber(surah, ayah) {
    var sIdx = Math.max(1, Math.min(114, parseInt(surah, 10) || 1)) - 1;
    var aNum = Math.max(1, parseInt(ayah, 10) || 1);
    var offset = 0;
    for (var i = 0; i < sIdx; i++) {
      offset += SURAH_VERSE_COUNTS[i] || 0;
    }
    return offset + aNum;
  }

  function playSequence(items, index) {
    if (!isContinuous || index >= items.length) {
      stopAll();
      return;
    }
    var item = items[index];
    var vNum = parseInt(item.getAttribute('data-verse') || String(index + 1), 10);
    playVerseAudio(vNum, item, getRepeatCount(), function() {
      if (isContinuous) {
        playSequence(items, index + 1);
      } else {
        stopAll();
      }
    });
  }

  function toggleContinuous() {
    var masterBtn = document.getElementById('master');
    var dict = getDictForLang(getLang());
    if (isPlaying || isContinuous) {
      stopAll();
      return;
    }
    var items = Array.prototype.slice.call(document.querySelectorAll('#verses .item[data-verse]'));
    if (!items.length) return;

    isContinuous = true;
    isPlaying = true;
    if (masterBtn) {
      masterBtn.classList.add('playing');
      masterBtn.textContent = dict.stopBtn;
    }
    playSequence(items, 0);
  }
  window.toggleContinuous = toggleContinuous;

  function renderVerses() {
    var container = document.getElementById('verses');
    if (!container) return;

    var rawVerses = [];
    try {
      if (typeof VERSES !== 'undefined' && Array.isArray(VERSES)) rawVerses = VERSES;
      else if (typeof window.VERSES !== 'undefined' && Array.isArray(window.VERSES)) rawVerses = window.VERSES;
    } catch (e) {}
    var list = rawVerses;
    var dict = getDictForLang(getLang());

    if (!list.length) {
      container.innerHTML = '<div class="verse"><p class="text">No verses found.</p></div>';
      return;
    }

    var frag = document.createDocumentFragment();

    for (var i = 0; i < list.length; i++) {
      var v = list[i];
      var vNum = v.n || (i + 1);
      var arText = (v.ar || '').replace(/^\uFEFF/, '');
      var mlText = v.ml || '';
      var tfText = v.tf || '';

      var card = document.createElement('div');
      card.className = 'verse';

      var head = document.createElement('div');
      head.className = 'vhead';
      head.textContent = dict.versePrefix + ' ' + vNum;
      card.appendChild(head);

      var item = document.createElement('div');
      item.className = 'item';
      item.setAttribute('data-verse', String(vNum));
      item.setAttribute('data-ar', arText);

      var arRow = document.createElement('div');
      arRow.className = 'row rtl it-ar';

      var playBtn = document.createElement('button');
      playBtn.type = 'button';
      playBtn.className = 'play-btn';
      playBtn.setAttribute('aria-label', dict.versePrefix + ' ' + vNum);
      playBtn.textContent = '▶';
      (function(num, targetItem) {
        playBtn.addEventListener('click', function() {
          if (currentItemEl === targetItem && isPlaying) {
            stopAll();
          } else {
            isContinuous = false;
            playVerseAudio(num, targetItem, getRepeatCount(), function() {
              stopAll();
            });
          }
        });
      })(vNum, item);

      var arP = document.createElement('p');
      arP.className = 'text ar';
      arP.textContent = arText;

      arRow.appendChild(playBtn);
      arRow.appendChild(arP);
      item.appendChild(arRow);

      if (mlText) {
        var mlRow = document.createElement('div');
        mlRow.className = 'row it-ml';
        var mlP = document.createElement('p');
        mlP.className = 'text';
        mlP.textContent = mlText;
        mlRow.appendChild(mlP);
        item.appendChild(mlRow);
      }

      if (tfText) {
        var tfRow = document.createElement('div');
        tfRow.className = 'row it-tf';
        var tfP = document.createElement('p');
        tfP.className = 'text';
        tfP.textContent = tfText;
        tfRow.appendChild(tfP);
        item.appendChild(tfRow);
      }

      card.appendChild(item);
      frag.appendChild(card);
    }

    container.innerHTML = '';
    container.appendChild(frag);
  }

  function showSummary() {
    var out = document.getElementById('ai-summary');
    var dict = getDictForLang(getLang());
    if (!out) return;
    var lessons = (typeof window.LESSONS !== 'undefined' && window.LESSONS) ? window.LESSONS : dict.noSummary;
    out.textContent = lessons;
  }
  window.showSummary = showSummary;

  function askCustom() {
    var inp = document.getElementById('ai-q');
    var out = document.getElementById('ai-answer');
    if (!inp || !out) return;
    var q = (inp.value || '').trim();
    if (!q) return;
    out.textContent = q;
  }
  window.askCustom = askCustom;

  function startQuiz() {
    var quizEl = document.getElementById('quiz');
    var dict = getDictForLang(getLang());
    if (!quizEl) return;
    var questions = (typeof window.QUIZ !== 'undefined' && Array.isArray(window.QUIZ)) ? window.QUIZ : [];
    if (!questions.length) {
      quizEl.innerHTML = '<p class="quiz-exp">' + dict.noQuiz + '</p>';
      return;
    }
    quizEl.innerHTML = '';
    for (var i = 0; i < questions.length; i++) {
      var qObj = questions[i];
      var box = document.createElement('div');
      box.className = 'quiz-q';
      var p = document.createElement('p');
      p.textContent = (i + 1) + '. ' + (qObj.q || '');
      box.appendChild(p);
      quizEl.appendChild(box);
    }
  }
  window.startQuiz = startQuiz;
  window.renderVerses = renderVerses;

  function applyPlayerTranslations(force) {
    var curLang = getLang();
    if (!force && lastAppliedLang === curLang) {
      return;
    }

    var dict = getDictForLang(curLang);

    var optBtn = document.getElementById('opt-toggle');
    if (optBtn && !isPlaying) {
      optBtn.textContent = dict.optionsBtn;
    }

    var masterBtn = document.getElementById('master');
    if (masterBtn) {
      masterBtn.textContent = isPlaying ? dict.stopBtn : dict.listenBtn;
    }

    var panel = document.getElementById('panel');
    if (panel) {
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
    }

    lastAppliedLang = curLang;
  }

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

  function initPlayer() {
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && /wake/i.test(k)) localStorage.removeItem(k);
      }
    } catch (e) {}

    loadSettings();
    renderVerses();
    applyPlayerTranslations(true);

    var cb = getWakeCheckbox();
    if (cb) {
      cb.checked = false;
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

    window.addEventListener('load', function() {
      renderVerses();
      applyPlayerTranslations(true);
      setTimeout(function() {
        var c = document.getElementById('verses');
        if (c && (!c.children || c.children.length === 0)) {
          renderVerses();
        }
      }, 150);
    });

    window.addEventListener('pageshow', function() {
      renderVerses();
      applyPlayerTranslations(true);
    });

    window.addEventListener('pagehide', releaseWake);
    window.addEventListener('beforeunload', releaseWake);
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) releaseWake();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayer);
  } else {
    initPlayer();
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
```[cite: 10]

---

### `site.js`

```javascript
/* site.js - Shared navigation, language helper, and non-destructive page utilities */
(function() {
  'use strict';

  function getSelectedLang() {
    try {
      var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
      if (m && m[1]) {
        var v = decodeURIComponent(m[1]);
        var x = v.match(/^\/[^\/]*\/([A-Za-z0-9_-]+)/);
        if (x && x[1]) return x[1];
      }
    } catch (e) {}
    try {
      return localStorage.getItem('quran-lang') || 'ml';
    } catch (e) {
      return 'ml';
    }
  }

  window.getSiteLang = getSelectedLang;

  // Keep #verses safe if already populated
  document.addEventListener('DOMContentLoaded', function() {
    try {
      if (typeof window.renderVerses === 'function') {
        var versesEl = document.getElementById('verses');
        if (versesEl && versesEl.children.length === 0) {
          window.renderVerses();
        }
      }
    } catch (e) {}
  });
})();
```[cite: 9]
