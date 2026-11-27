/* player.js - Handles audio playback, reciter selection, queue management, 
   options panel state, screen wake lock, and translated UI labels. */
(function() {
  'use strict';

  var wakeLockSentinel = null;
  var userWakeToggled = false;

  /* Helper to get chosen language from cookie/localStorage */
  function getLang() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    if (!m) {
      try { return localStorage.getItem('quran-lang') || 'ml'; } catch(e) { return 'ml'; }
    }
    var v = m[1]; try { v = decodeURIComponent(v); } catch(e) {}
    var x = v.match(/^\/[^\/]*\/([A-Za-z-]+)/);
    return x ? x[1] : 'ml';
  }

  /* Language dictionary for player options panel controls */
  var PLAYER_DICT = {
    "ml": { fontSize: "അക്ഷര വലിപ്പം:", show: "കാണിക്കുക:", verse: "ആയത്ത്", meaning: "സാരം", tafsir: "വിവരണം", reciter: "ഖിറാഅത്ത് (പാരായണം):", repeat: "ആയത്ത് ആവർത്തനം:", continuous: "തുടർച്ചയായി കേൾക്കുക", wake: "സ്‌ക്രീൻ ഓൺ ആക്കി വെക്കുക" },
    "en": { fontSize: "Font Size:", show: "Show:", verse: "Verse", meaning: "Meaning", tafsir: "Tafsir", reciter: "Reciter:", repeat: "Verse Repeat:", continuous: "Play Continuously", wake: "Keep Screen On" },
    "hi": { fontSize: "फ़ॉन्ट आकार:", show: "दिखाएं:", verse: "आयात", meaning: "अर्थ", tafsir: "व्याख्या", reciter: "क़ारी:", repeat: "आयात दोहराव:", continuous: "लगातार चलाएं", wake: "स्क्रीन ऑन रखें" },
    "ta": { fontSize: "எழுத்து அளவு:", show: "காட்டு:", verse: "வசனம்", meaning: "பொருள்", tafsir: "விளக்கம்", reciter: "ஓதுபவர்:", repeat: "வசனம் නැවත தட்டச்சு:", continuous: "தொடர்ந்து இயக்கவும்", wake: "திரையை ஆன் செய்க" },
    "te": { fontSize: "అక్షర పరిమాణం:", show: "చూపించు:", verse: "ఆయత్", meaning: "అర్థం", tafsir: "వివరణ", reciter: "ఖారీ:", repeat: "ఆయత్ పునరావృతం:", continuous: "నిరంతరం ప్లే చేయండి", wake: "స్క్రీన్ ఆన్ ఉంచండి" },
    "kn": { fontSize: "ಅಕ್ಷರ ಗಾತ್ರ:", show: "ತೋರಿಸಿ:", verse: "ಆಯತ್", meaning: "ಅರ್ಥ", tafsir: "ವಿವರಣೆ", reciter: "ಓದುಗರು:", repeat: "ಆಯತ್ ಪುನರಾವರ್ತನೆ:", continuous: "ನಿರಂತರವಾಗಿ ಪ್ಲೇ ಮಾಡಿ", wake: "ಸ್ಕ್ರೀನ್ ಆನ್ ಇರಿಸಿ" },
    "mr": { fontSize: "फॉन्ट आकार:", show: "दाखवा:", verse: "आयात", meaning: "अर्थ", tafsir: "स्पष्टीकरण", reciter: "क़ारी:", repeat: "आयात पुनरावृत्ती:", continuous: "सतत चालवा", wake: "स्क्रीन ऑन ठेवा" },
    "gu": { fontSize: "અક્ષર કદ:", show: "બતાવો:", verse: "આયાત", meaning: "અર્થ", tafsir: "વિગત", reciter: "કારી:", repeat: "આયાત પુનરાવર્તન:", continuous: "સતત ચલાવો", wake: "સ્ક્રીન ચાલુ રાખો" },
    "pa": { fontSize: "ਅੱਖਰ ਦਾ ਆਕਾਰ:", show: "ਦਿਖਾਓ:", verse: "ਆਇਤ", meaning: "ਅਰਥ", tafsir: "ਵਿਆਖਿਆ", reciter: "ਕੁਆਰੀ:", repeat: "ਆਇਤ ਦੁਹਰਾਓ:", continuous: "ਲਗਾਤਾਰ ਚਲਾਓ", wake: "ਸਕ੍ਰੀਨ ਚਾਲੂ ਰੱਖੋ" },
    "bn": { fontSize: "ফন্টের আকার:", show: "দেখান:", verse: "আয়াত", meaning: "অর্থ", tafsir: "তাফসীর", reciter: "ক্বারী:", repeat: "আয়াত পুনরাবৃত্তি:", continuous: "একটানা চালান", wake: "স্ক্রিন অন রাখুন" },
    "ur": { fontSize: "فونٹ سائز:", show: "دکھائیں:", verse: "آیت", meaning: "ترجمہ", tafsir: "تفسیر", reciter: "قاری:", repeat: "آیت تکرار:", continuous: "مسلسل چلائیں", wake: "اسکرین آن رکھیں" },
    "ne": { fontSize: "फन्ट साइज:", show: "देखाउनुहोस्:", verse: "आयात", meaning: "अर्थ", tafsir: "व्याख्या", reciter: "कारी:", repeat: "आयात दोहोर्याउनुहोस्:", continuous: "लगातार बजाउनुहोस्", wake: "स्क्रिन अन राख्नुहोस्" },
    "si": { fontSize: "අකුරු ප්රමාණය:", show: "පෙන්වන්න:", verse: "ආයතය", meaning: "අර්ථය", tafsir: "විස්තරය", reciter: "පාරායනය කරන්නා:", repeat: "ආයතය නැවත කීම:", continuous: "නොකඩවා ධාවනය කරන්න", wake: "තිරය ඔන් කර තබන්න" },
    "ar": { fontSize: "حجم الخط:", show: "إظهار:", verse: "الآية", meaning: "الترجمة", tafsir: "التفسير", reciter: "القارئ:", repeat: "تكرار الآية:", continuous: "تشغيل متواصل", wake: "إبقاء الشاشة مضاءة" },
    "fa": { fontSize: "اندازه قلم:", show: "نمایش:", verse: "آیه", meaning: "معنی", tafsir: "تفسیر", reciter: "قاری:", repeat: "تکرار آیه:", continuous: "پخش مداوم", wake: "روشن نگه داشتن صفحه" },
    "tr": { fontSize: "Yazı Boyutu:", show: "Göster:", verse: "Ayet", meaning: "Meal", tafsir: "Tefsir", reciter: "Hafız:", repeat: "Ayet Tekrarı:", continuous: "Kesintisiz Çal", wake: "Ekranı Açık Tut" },
    "id": { fontSize: "Ukuran Font:", show: "Tampilkan:", verse: "Ayat", meaning: "Terjemahan", tafsir: "Tafsir", reciter: "Qari:", repeat: "Ulangi Ayat:", continuous: "Putar Berkelanjutan", wake: "Layar Tetap Menyala" },
    "ms": { fontSize: "Saiz Font:", show: "Tunjukkan:", verse: "Ayat", meaning: "Terjemahan", tafsir: "Tafsir", reciter: "Qari:", repeat: "Ulangan Ayat:", continuous: "Main Berterusan", wake: "Pastikan Skrin Menyala" },
    "th": { fontSize: "ขนาดฟอนต์:", show: "แสดง:", verse: "อายะฮ์", meaning: "คำแปล", tafsir: "คำอธิบาย", reciter: "ผู้อ่าน:", repeat: "ซ้ำอายะฮ์:", continuous: "เล่นต่อเนื่อง", wake: "เปิดหน้าจอค้างไว้" },
    "vi": { fontSize: "Kích thước chữ:", show: "Hiển thị:", verse: "Dòng", meaning: "Ý nghĩa", tafsir: "Chú giải", reciter: "Người đọc:", repeat: "Lặp lại dòng:", continuous: "Phát liên tục", wake: "Giữ màn hình sáng" },
    "zh-CN": { fontSize: "字体大小:", show: "显示:", verse: "节", meaning: "译文", tafsir: "解经", reciter: "诵读家:", repeat: "重复:", continuous: "连续播放", wake: "保持屏幕常亮" },
    "zh-TW": { fontSize: "字型大小:", show: "顯示:", verse: "節", meaning: "譯文", tafsir: "解經", reciter: "誦讀家:", repeat: "重複:", continuous: "連續播放", wake: "保持螢幕常亮" },
    "ja": { fontSize: "文字サイズ:", show: "表示:", verse: "節", meaning: "意味", tafsir: "解説", reciter: "読誦者:", repeat: "節の繰り返し:", continuous: "連続再生", wake: "画面を常時点灯" },
    "ko": { fontSize: "글자 크기:", show: "표시:", verse: "절", meaning: "번역", tafsir: "해설", reciter: "낭송가:", repeat: "절 반복:", continuous: "연속 재생", wake: "화면 켜짐 유지" },
    "fr": { fontSize: "Taille de police:", show: "Afficher:", verse: "Verset", meaning: "Sens", tafsir: "Tafsir", reciter: "Récitateur:", repeat: "Répétition verset:", continuous: "Lecture en continu", wake: "Garder l'écran allumé" },
    "de": { fontSize: "Schriftgröße:", show: "Anzeigen:", verse: "Vers", meaning: "Bedeutung", tafsir: "Tafsir", reciter: "Rezitation:", repeat: "Vers-Wiederholung:", continuous: "Fortlaufend abspielen", wake: "Bildschirm anlassen" },
    "es": { fontSize: "Tamaño de fuente:", show: "Mostrar:", verse: "Versículo", meaning: "Significado", tafsir: "Tafsir", reciter: "Recitador:", repeat: "Repetir versículo:", continuous: "Reproducción continua", wake: "Mantener pantalla encendida" },
    "pt": { fontSize: "Tamanho da fonte:", show: "Exibir:", verse: "Versículo", meaning: "Significado", tafsir: "Tafsir", reciter: "Recitador:", repeat: "Repetição do versículo:", continuous: "Reprodução contínua", wake: "Manter tela acesa" },
    "it": { fontSize: "Dimensione testo:", show: "Mostra:", verse: "Versetto", meaning: "Significato", tafsir: "Tafsir", reciter: "Recitatore:", repeat: "Ripeti versetto:", continuous: "Riproduzione continua", wake: "Mantieni schermo attivo" },
    "ru": { fontSize: "Размер шрифта:", show: "Показать:", verse: "Аят", meaning: "Перевод", tafsir: "Тафсир", reciter: "Чтец:", repeat: "Повтор аята:", continuous: "Непрерывное воспроизведение", wake: "Экран всегда включен" },
    "nl": { fontSize: "Lettergrootte:", show: "Tonen:", verse: "Vers", meaning: "Betekenis", tafsir: "Tafsir", reciter: "Reciteur:", repeat: "Vers herhalen:", continuous: "Continu afspelen", wake: "Scherm aanhouden" },
    "pl": { fontSize: "Rozmiar czcionki:", show: "Pokaż:", verse: "Werset", meaning: "Znaczenie", tafsir: "Tafsir", reciter: "Lektor:", repeat: "Powtórzenie wersetu:", continuous: "Odtwarzaj ciągle", wake: "Utrzymuj ekran włączony" },
    "uk": { fontSize: "Розмір шрифту:", show: "Показати:", verse: "Аят", meaning: "Переклад", tafsir: "Тафсир", reciter: "Читець:", repeat: "Повтор аята:", continuous: "Безперервне відтворення", wake: "Екран завжди увімкнено" },
    "sv": { fontSize: "Teckenstorlek:", show: "Visa:", verse: "Vers", meaning: "Betydelse", tafsir: "Tafsir", reciter: "Uppläsare:", repeat: "Versupprepning:", continuous: "Kontinuerlig uppspelning", wake: "Behåll skärmen på" },
    "el": { fontSize: "Μέγεθος γραμματοσειράς:", show: "Εμφάνιση:", verse: "Στίχος", meaning: "Σημασία", tafsir: "Ερμηνεία", reciter: "Αναγνώστης:", repeat: "Επανάληψη στίχου:", continuous: "Continuous Play", wake: "Διατήρηση οθόνης αναμμένης" },
    "ro": { fontSize: "Dimensiune font:", show: "Afișează:", verse: "Verset", meaning: "Sens", tafsir: "Tafsir", reciter: "Recitator:", repeat: "Repetare verset:", continuous: "Redare continuă", wake: "Păstrează ecranul aprins" },
    "sw": { fontSize: "Ukubwa wa maandishi:", show: "Onyesha:", verse: "Aya", meaning: "Maana", tafsir: "Tafsiri", reciter: "Msomaji:", repeat: "Rudia Aya:", continuous: "Cheza Bila Kukoma", wake: "Weka Skrini Wazi" },
    "am": { fontSize: "የፊደል መጠን:", show: "አሳይ:", verse: "አንቀፅ", meaning: "ትርጉም", tafsir: "ተፍሲር", reciter: "ቀሪ:", repeat: "አንቀፅ መደጋገም:", continuous: "በተከታታይ አጫውት", wake: "ስክሪን አታጥፋ" },
    "ha": { fontSize: "Girman rubutu:", show: "Nuna:", verse: "Aya", meaning: "Ma'ana", tafsir: "Tafsiri", reciter: "Mai karatu:", repeat: "Maimaita Aya:", continuous: "Cigaba da kunnawa", wake: "Rage kashe allo" },
    "so": { fontSize: "Cabbirka qoraalka:", show: "Muuji:", verse: "Aayad", meaning: "Nuxurka", tafsir: "Tafsiir", reciter: "Aqrinta:", repeat: "Ku celinta Aayadda:", continuous: "Sii wad akhrinta", wake: "Daboolka shaashada ha damin" },
    "sq": { fontSize: "Madhësia e shkrimit:", show: "Shfaq:", verse: "Ajeti", meaning: "Kuptimi", tafsir: "Tefsiri", reciter: "Lexuesi:", repeat: "Përsëritja e Ajetit:", continuous: "Lexim i vazhdueshëm", wake: "Mbaje ekranin ndezur" },
    "az": { fontSize: "Şrift ölçüsü:", show: "Göstər:", verse: "Ayə", meaning: "Tərcümə", tafsir: "Təfsir", reciter: "Qari:", repeat: "Ayə təkrarı:", continuous: "Fasiləsiz oxut", wake: "Ekranı açıq saxla" },
    "bs": { fontSize: "Veličina fonta:", show: "Prikaži:", verse: "Ajet", meaning: "Značenje", tafsir: "Tefsir", reciter: "Učač:", repeat: "Ponavljanje ajeta:", continuous: "Kontinuirano puštanje", wake: "Drži ekran uključenim" },
    "bg": { fontSize: "Размер на шрифта:", show: "Показване:", verse: "Аят", meaning: "Значение", tafsir: "Тафсир", reciter: "Чтец:", repeat: "Повторение на аят:", continuous: "Непрекъснато възпроизвеждане", wake: "Дръжте екрана включен" },
    "cs": { fontSize: "Velikost písma:", show: "Zobrazit:", verse: "Verš", meaning: "Význam", tafsir: "Tafsír", reciter: "Recitátor:", repeat: "Opakování verše:", continuous: "Souvislé přehrávání", wake: "Ponechat obrazovku zapnutou" },
    "ckb": { fontSize: "قەبارەی فۆنت:", show: "پیشاندان:", verse: "ئایەت", meaning: "واتا", tafsir: "تەفسیر", reciter: "خوێنەرەوە:", repeat: "دووبارەکردنەوەی ئایەت:", continuous: "پێکردنی بەردەوام", wake: "ڕووناکیی شاشە بهێڵەرەوە" },
    "no": { fontSize: "Skriftstørrelse:", show: "Vis:", verse: "Vers", meaning: "Betydning", tafsir: "Tafsir", reciter: "Oppleser:", repeat: "Versgjentakelse:", continuous: "Kontinuerlig avspilling", wake: "Hold skjermen på" },
    "sd": { fontSize: "فراخ سائز:", show: "ڏيکاريو:", verse: "آيت", meaning: "ترجمو", tafsir: "تفسير", reciter: "قاري:", repeat: "آيت تكرار:", continuous: "مسلسل هلايو", wake: "اسڪرين آن رکو" },
    "tg": { fontSize: "Андозаи шрифт:", show: "Нишон диҳед:", verse: "Оят", meaning: "Маъно", tafsir: "Тафсир", reciter: "Қорӣ:", repeat: "Такрори оят:", continuous: "Иҷрои пайваста", wake: "Экранро фаъол нигоҳ доред" },
    "tt": { fontSize: "Шрифт зурлыгы:", show: "Күрсәтү:", verse: "Аять", meaning: "Мәгънәсе", tafsir: "Тәфсир", reciter: "Кари:", repeat: "Аять кабатлау:", continuous: "Өзлексез уйнау", wake: "Экранны кабызып калдыру" },
    "ug": { fontSize: "خەت چوڭلۇقى:", show: "كۆرسىتىش:", verse: "ئايەت", meaning: "مەنىسى", tafsir: "تەپسىر", reciter: "قارىي:", repeat: "ئايەت تەكرارلاش:", continuous: "ئۈزلۈكسىز قويۇش", wake: "ئېكراننى يورۇق تۇتۇش" },
    "uz": { fontSize: "Shrift hajmi:", show: "Ko'rsatish:", verse: "Oyat", meaning: "Ma'nosi", tafsir: "Tafsiri", reciter: "Qori:", repeat: "Oyat takrori:", continuous: "Uzluksiz ijro", wake: "Ekranni yoniq tutish" },
    "tl": { fontSize: "Laki ng Font:", show: "Ipakita:", verse: "Tudling", meaning: "Kahulugan", tafsir: "Tafsir", reciter: "Tagabasa:", repeat: "Pag-uulit ng Tudling:", continuous: "Patuloy na Pag-play", wake: "Panatilihing Buka ang Screen" },
    "ps": { fontSize: "د فونټ اندازه:", show: "ښودل:", verse: "آیت", meaning: "معنی", tafsir: "تفسیر", reciter: "قاری:", repeat: "د آیت تکرار:", continuous: "پرله پسې خپرول", wake: "سکرین آن وساتئ" },
    "km": { fontSize: "ទំហំពុម្ពអក្សរ:", show: "បង្ហាញ:", verse: "អាយ៉ាត់", meaning: "អត្ថន័យ", tafsir: "តាហ្វសៀរ", reciter: "អ្នកសូត្រ:", repeat: "ការរំលឹកអាយ៉ាត់:", continuous: "ចាក់បន្តបន្ទាប់", wake: "រក្សាអេក្រង់ឱ្យភ្លឺ" },
    "yo": { fontSize: "Iwọn Fọnti:", show: "Han:", verse: "Ayat", meaning: "Itumọ", tafsir: "Tafsir", reciter: "Onirun:", repeat: "Atunse Ayat:", continuous: "Tesiwaju lati mu ṣiṣẹ", wake: "Jẹ ki iboju wa ni titan" },
    "om": { fontSize: "Hamma Foonții:", show: "Agarsiisi:", verse: "Aayaa", meaning: "Hiika", tafsir: "Tafsiira", reciter: "Qara'aa:", repeat: "Aayaa Irra Deebi'i:", continuous: "Waliin Wal-qabsiisi Taphadhu", wake: "Agarsiisa Banahi" },
    "as": { fontSize: "ফণ্টৰ আকাৰ:", show: "দেখুৱাওক:", verse: "আয়াত", meaning: "অৰ্থ", tafsir: "তাফসীৰ", reciter: "কাৰী:", repeat: "আয়াত পুনৰাবৃত্তি:", continuous: "ক্ৰমাগতভাৱে চলাওক", wake: "স্ক্ৰীন অন ৰাখক" },
    "kk": { fontSize: "Қаріп өлшемі:", show: "Көрсету:", verse: "Аят", meaning: "Мағынасы", tafsir: "Тәпсір", reciter: "Қари:", repeat: "Аят қайталау:", continuous: "Үздіксіз ойнату", wake: "Экранды қосулы ұстау" },
    "ky": { fontSize: "Шрифт өлчөмү:", show: "Көрсөтүү:", verse: "Аят", meaning: "Мааниси", tafsir: "Тафсир", reciter: "Кары:", repeat: "Аят кайталоо:", continuous: "Үзгүлтүксүз ойнотуу", wake: "Экранды күйгүзүп коюу" },
    "rw": { fontSize: "Ingano y'inyuguti:", show: "Garagaza:", verse: "Ayat", meaning: "Isobanuro", tafsir: "Tafusiri", reciter: "Umusomi:", repeat: "Gusubiramo Ayat:", continuous: "Gucuranga continuously", wake: "Guma ufashe ecran yaka" }
  };

  /* Apply UI translations inside options panel */
  function applyPlayerTranslations() {
    var curLang = getLang();
    var dict = PLAYER_DICT[curLang] || PLAYER_DICT['ml'];

    var panel = document.getElementById('panel');
    if (!panel) return;

    panel.classList.add('notranslate');
    panel.setAttribute('translate', 'no');

    var titles = panel.querySelectorAll('.ctl-title');
    titles.forEach(function(el) {
      var text = el.textContent.trim();
      if (/ಅಕ್ಷರ|Font|അക്ഷര/i.test(text) || text.indexOf('വലിപ്പം') > -1) el.textContent = dict.fontSize;
      else if (/കാണിക്കുക|Show/i.test(text)) el.textContent = dict.show;
      else if (/ഖിറാഅത്ത്|Reciter|പാരായണം/i.test(text)) el.textContent = dict.reciter;
      else if (/ആവർത്തനം|Repeat/i.test(text)) el.textContent = dict.repeat;
    });

    var labels = panel.querySelectorAll('label.opt');
    labels.forEach(function(lbl) {
      var input = lbl.querySelector('input');
      if (!input) return;

      var text = lbl.textContent.trim();
      var key = '';
      if (input.id === 'show-ar' || /ஆயത്ത്|आयात|Ayat|Verse/i.test(text)) key = dict.verse;
      else if (input.id === 'show-ml' || /സാരം|Meaning/i.test(text)) key = dict.meaning;
      else if (input.id === 'show-tf' || /വിവരണം|Tafsir/i.test(text)) key = dict.tafsir;
      else if (input.id === 'cont' || /തുടർച്ചയായി|Continuously/i.test(text)) key = dict.continuous;
      else if (input.id === 'opt-wake' || /സ്ക്രീൻ|Screen|Wake/i.test(text)) key = dict.wake;

      if (key) {
        lbl.childNodes.forEach(function(node) {
          if (node.nodeType === 3) node.textContent = ' ' + key;
        });
      }
    });
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
      try { wakeLockSentinel.release(); } catch(e) {}
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
    } catch(e) {
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
    } catch(e) {}

    function resetWakeCheckbox() {
      if (userWakeToggled) return;
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
    }

    resetWakeCheckbox();
    applyPlayerTranslations();

    window.addEventListener('load', function() { resetWakeCheckbox(); applyPlayerTranslations(); });
    window.addEventListener('pageshow', function() { resetWakeCheckbox(); applyPlayerTranslations(); });

    if (typeof MutationObserver !== 'undefined') {
      var root = document.getElementById('panel') || document.body;
      if (root) {
        var obs = new MutationObserver(function() {
          if (!userWakeToggled) resetWakeCheckbox();
          applyPlayerTranslations();
        });
        obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['checked'] });
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
