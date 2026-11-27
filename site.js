/* site.js – include on EVERY page:
   <script src="/site.js" defer></script>
   1) remembers the chosen language for the whole site
   2) translates the top / bottom navigation and the Listen / Options buttons natively (61 languages; others show English)
   3) loads Google Translate only when a language other than Malayalam is chosen (spinner and top bar hidden)
   4) natural voices + text to speech in the translated language
   5) recitation audio: saves only Al-Ghamdi for offline use; recorded Malayalam voice with browser fallback
   6) registers the offline service worker (sw.js, next to this file) */
(function () {
  var KEY = 'quran-lang', YEAR = 'max-age=31536000';
  // folder this file is served from (https://quranmeaning.app/ today) - audio and sw.js are found relative to it, so no address is written in the code
  var BASE_URL = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, '') : (location.origin + '/');

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }
  function cookieLang() {                         // index page writes the cookie URL-encoded (%2Fml%2Fen), older pages as /ml/en
    var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    if (!m) return '';
    var v = m[1]; try { v = decodeURIComponent(v); } catch (e) {}
    var x = v.match(/^\/[^\/]*\/([A-Za-z-]+)/);
    return x ? x[1] : '';
  }
  function getPref() {                            // the cookie is the one source of truth, shared with the index page
    var c = cookieLang(); if (c) return c;
    try { var saved = localStorage.getItem(KEY); if (saved) return saved; } catch (e) {}   // mobile browsers drop session cookies when closed; the saved choice survives
    return 'ml';
  }
  function setCookie(l) {                         // Google reads this cookie to translate
    var gone = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = gone; document.cookie = gone + '; domain=' + location.hostname;
    if (l !== 'ml') document.cookie = 'googtrans=/ml/' + l + '; path=/; ' + YEAR;
  }
  function savePref(l) { try { localStorage.setItem(KEY, l); } catch (e) {} setCookie(l); }

  var lang = getPref();
  setCookie(lang);                                // keep cookie in step with the saved choice

  /* ---------- Full Dictionary for 61 Languages ---------- */
  var UI_DICT = {
    "ml": { home: "പ്രധാനതാൾ", surahs: "സൂറത്തുകൾ", pages: "ഭാഗങ്ങൾ", summary: "സംഗ്രഹം", back: "തിരികെ", listen: "കേൾക്കാം", stop: "നിർത്തുക", options: "ഓപ്ഷനുകൾ", prevS: "മുൻ സൂറത്ത്", nextS: "അടുത്ത സൂറത്ത്", prev: "മുൻ ഭാഗം", top: "മുകളിൽ", next: "അടുത്ത ഭാഗം", part: "ഭാഗം", preface: "മുഖവുര", verses: "ആയത്തുകൾ" },
    "en": { home: "Home", surahs: "Surahs", pages: "Pages", summary: "Summary", back: "Back", listen: "Listen", stop: "Stop", options: "Options", prevS: "Prev Surah", nextS: "Next Surah", prev: "Prev Page", top: "Top", next: "Next Page", part: "Part", preface: "Preface", verses: "Verses" },
    "hi": { home: "मुख्य पृष्ठ", surahs: "सूरह", pages: "पृष्ठ", summary: "सारांश", back: "वापस", listen: "सुनें", stop: "रोकें", options: "विकल्प", prevS: "पिछली सूरह", nextS: "अगली सूरह", prev: "पिछला पृष्ठ", top: "ऊपर", next: "अगला पृष्ठ", part: "भाग", preface: "प्रस्तावना", verses: "आयतें" },
    "ta": { home: "முகப்பு", surahs: "சூராக்கள்", pages: "பக்கங்கள்", summary: "சுருக்கம்", back: "திரும்பி", listen: "கேளுங்கள்", stop: "நிறுத்து", options: "விருப்பங்கள்", prevS: "முந்தைய சூரா", nextS: "அடுத்த சூரா", prev: "முந்தைய பக்கம்", top: "மேலே", next: "அடுத்த பக்கம்", part: "பகுதி", preface: "முன்னுரை", verses: "வசனங்கள்" },
    "te": { home: "హోమ్", surahs: "సూరాలు", pages: "పేజీలు", summary: "సారాంశం", back: "వెనుకకు", listen: "వినండి", stop: "ఆపు", options: "ఎంపికలు", prevS: "మునుపటి సూరా", nextS: "తరువాత సూరా", prev: "మునుపటి పేజీ", top: "పైకి", next: "తరువాత పేజీ", part: "భాగం", preface: "ముందుమాట", verses: "ఆయతులు" },
    "kn": { home: "ಮುಖ್ಯ ಪುಟ", surahs: "ಸೂರಾ", pages: "ಪುಟಗಳು", summary: "ಸಾರಾಂಶ", back: "ಹಿಂದೆ", listen: "ಕೇಳಿ", stop: "ನಿಲ್ಲಿಸಿ", options: "ಆಯ್ಕೆಗಳು", prevS: "ಹಿಂದಿನ ಸೂರಾ", nextS: "ಮುಂದಿನ ಸೂರಾ", prev: "ಹಿಂದಿನ ಪುಟ", top: "ಮೇಲಕ್ಕೆ", next: "ಮುಂದಿನ ಪುಟ", part: "ಭಾಗ", preface: "ಮುನ್ನುಡಿ", verses: "ಆಯತ್‌ಗಳು" },
    "mr": { home: "मुख्य पृष्ठ", surahs: "सूरह", pages: "पृष्ठे", summary: "सारांश", back: "मागे", listen: "ऐका", stop: "थांबा", options: "पर्याय", prevS: "मागील सूरह", nextS: "पुढील सूरह", prev: "मागील पृष्ठ", top: "वर", next: "पुढील पृष्ठ", part: "भाग", preface: "प्रस्तावना", verses: "आयते" },
    "gu": { home: "મુખ્ય પૃષ્ઠ", surahs: "સૂરા", pages: "પૃષ્ઠો", summary: "સારાંશ", back: "પાછા", listen: "સાંભળો", stop: "બંધ કરો", options: "વિકલ્પો", prevS: "અગાઉની સૂરા", nextS: "પછીની સૂરા", prev: "અગાઉનું પૃષ્ઠ", top: "ઉપર", next: "પછીનું પૃષ્ઠ", part: "ભાગ", preface: "પ્રસ્તાવના", verses: "આયતો" },
    "pa": { home: "ਮੁੱਖ ਪੰਨਾ", surahs: "ਸੂਰਤਾਂ", pages: "ਪੰਨੇ", summary: "ਸਾਰ", back: "ਵਾਪਸ", listen: "ਸੁਣੋ", stop: "ਰੋਕੋ", options: "ਵਿਕਲਪ", prevS: "ਪਿਛਲੀ ਸੂਰਤ", nextS: "ਅਗਲੀ ਸੂਰਤ", prev: "ਪਿਛਲਾ ਪੰਨਾ", top: "ਉੱਪਰ", next: "ਅਗਲਾ ਪੰਨਾ", part: "ਭਾਗ", preface: "ਮੁਖਬੰਦ", verses: "ਆਇਤਾਂ" },
    "bn": { home: "হোম", surahs: "সূরা", pages: "পৃষ্ঠা", summary: "সারসংক্ষেপ", back: "ফিরে যান", listen: "শুনুন", stop: "থামুন", options: "অপশন", prevS: "পূর্ববর্তী সূরা", nextS: "পরবর্তী সূরা", prev: "পূর্ববর্তী পৃষ্ঠা", top: "উপরে", next: "পরবর্তী পৃষ্ঠা", part: "অংশ", preface: "ভূমিকা", verses: "আয়াত" },
    "ur": { home: "صفحہ اول", surahs: "سورتیں", pages: "صفحات", summary: "خلاصہ", back: "واپس", listen: "سنیں", stop: "روکیں", options: "آپشنز", prevS: "پچھلی سورت", nextS: "اگلی سورت", prev: "پچھلا صفحہ", top: "اوپر", next: "اگلا صفحہ", part: "حصہ", preface: "مقدمہ", verses: "آیات" },
    "ne": { home: "गृह पृष्ठ", surahs: "सूराहहरू", pages: "पृष्ठहरू", summary: "सारांश", back: "फर्किनुहोस्", listen: "सुन्नुहोस्", stop: "रोक्नुहोस्", options: "विकल्पहरू", prevS: "अघिल्लो सूराह", nextS: "अर्को सूराह", prev: "अघिल्लो पृष्ठ", top: "माथि", next: "अर्को पृष्ठ", part: "भाग", preface: "भूमिका", verses: "आयतहरू" },
    "si": { home: "මුල් පිටුව", surahs: "සුරාවන්", pages: "පිටු", summary: "සාරාංශය", back: "ආපසු", listen: "සවන් දෙන්න", stop: "නවතන්න", options: "විකල්ප", prevS: "පෙර සුරාව", nextS: "ඊළඟ සුරාව", prev: "පෙර පිටුව", top: "ඉහළට", next: "ඊළඟ පිටුව", part: "කොටස", preface: "පෙරවදන", verses: "ආයත" },
    "ar": { home: "الرئيسية", surahs: "السور", pages: "الصفحات", summary: "الملخص", back: "رجوع", listen: "استماع", stop: "إيقاف", options: "خيارات", prevS: "السورة السابقة", nextS: "السورة التالية", prev: "الصفحة السابقة", top: "أعلى", next: "الصفحة التالية", part: "الجزء", preface: "مقدمة", verses: "الآيات" },
    "fa": { home: "صفحه اصلی", surahs: "سوره‌ها", pages: "صفحات", summary: "خلاصه", back: "بازگشت", listen: "شنیدن", stop: "توقف", options: "گزینه‌ها", prevS: "سوره قبلی", nextS: "سوره بعدی", prev: "صفحه قبلی", top: "بالا", next: "صفحه بعدی", part: "بخش", preface: "مقدمه", verses: "آیات" },
    "tr": { home: "Ana Sayfa", surahs: "Sureler", pages: "Sayfalar", summary: "Özet", back: "Geri", listen: "Dinle", stop: "Durdur", options: "Seçenekler", prevS: "Önceki Sure", nextS: "Sonraki Sure", prev: "Önceki Sayfa", top: "Yukarı", next: "Sonraki Sayfa", part: "Bölüm", preface: "Önsöz", verses: "Ayetler" },
    "id": { home: "Beranda", surahs: "Surah", pages: "Halaman", summary: "Ringkasan", back: "Kembali", listen: "Dengar", stop: "Hentikan", options: "Opsi", prevS: "Surah Sblm", nextS: "Surah Slanjut", prev: "Hal Sblm", top: "Atas", next: "Hal Slanjut", part: "Bagian", preface: "Pengantar", verses: "Ayat" },
    "ms": { home: "Utama", surahs: "Surah", pages: "Halaman", summary: "Ringkasan", back: "Kembali", listen: "Dengar", stop: "Henti", options: "Pilihan", prevS: "Surah Sblm", nextS: "Surah Sthn", prev: "Hal Sblm", top: "Atas", next: "Hal Sthn", part: "Bahagian", preface: "Pendahuluan", verses: "Ayat" },
    "th": { home: "หน้าแรก", surahs: "ซูเราะฮ์", pages: "หน้า", summary: "สรุป", back: "ย้อนกลับ", listen: "ฟัง", stop: "หยุด", options: "ตัวเลือก", prevS: "ซูเราะฮ์ก่อนหน้า", nextS: "ซูเราะฮ์ถัดไป", prev: "หน้าก่อนหน้า", top: "ด้านบน", next: "หน้าถัดไป", part: "ส่วนที่", preface: "คำนำ", verses: "อายะฮ์" },
    "vi": { home: "Trang chủ", surahs: "Chương", pages: "Trang", summary: "Tóm tắt", back: "Quay lại", listen: "Nghe", stop: "Dừng", options: "Tùy chọn", prevS: "Chương trước", nextS: "Chương sau", prev: "Trang trước", top: "Lên đầu", next: "Trang sau", part: "Phần", preface: "Lời mở đầu", verses: "Câu" },
    "zh-CN": { home: "首页", surahs: "章", pages: "页", summary: "概要", back: "返回", listen: "倾听", stop: "停止", options: "选项", prevS: "上一章", nextS: "下一章", prev: "上一页", top: "顶部", next: "下一页", part: "部分", preface: "前言", verses: "节" },
    "zh-TW": { home: "首頁", surahs: "章", pages: "頁", summary: "概要", back: "返回", listen: "傾聽", stop: "停止", options: "選項", prevS: "上一章", nextS: "下一章", prev: "上一頁", top: "頂部", next: "下一頁", part: "部分", preface: "前言", verses: "節" },
    "ja": { home: "ホーム", surahs: "章", pages: "ページ", summary: "要約", back: "戻る", listen: "聴く", stop: "停止", options: "オプション", prevS: "前の章", nextS: "次の章", prev: "前のページ", top: "トップへ", next: "次のページ", part: "パート", preface: "序文", verses: "節" },
    "ko": { home: "홈", surahs: "수라", pages: "페이지", summary: "요약", back: "뒤로", listen: "듣기", stop: "정지", options: "옵션", prevS: "이전 수라", nextS: "다음 수라", prev: "이전 페이지", top: "맨 위로", next: "다음 페이지", part: "부분", preface: "서문", verses: "절" },
    "fr": { home: "Accueil", surahs: "Sourates", pages: "Pages", summary: "Résumé", back: "Retour", listen: "Écouter", stop: "Arrêter", options: "Options", prevS: "Sourate Préc.", nextS: "Sourate Suiv.", prev: "Page Préc.", top: "Haut", next: "Page Suiv.", part: "Partie", preface: "Préface", verses: "Versets" },
    "de": { home: "Startseite", surahs: "Suren", pages: "Seiten", summary: "Zusammenfassung", back: "Zurück", listen: "Anhören", stop: "Stopp", options: "Optionen", prevS: "Vorherige Sure", nextS: "Nächste Sure", prev: "Vorherige Seite", top: "Nach oben", next: "Nächste Seite", part: "Teil", preface: "Vorwort", verses: "Verse" },
    "es": { home: "Inicio", surahs: "Suras", pages: "Páginas", summary: "Resumen", back: "Volver", listen: "Escuchar", stop: "Detener", options: "Opciones", prevS: "Sura Anterior", nextS: "Sura Siguiente", prev: "Pág. Anterior", top: "Arriba", next: "Pág. Siguiente", part: "Parte", preface: "Prefacio", verses: "Versículos" },
    "pt": { home: "Início", surahs: "Suratas", pages: "Páginas", summary: "Resumo", back: "Voltar", listen: "Ouvir", stop: "Parar", options: "Opções", prevS: "Surata Anterior", nextS: "Surata Seguinte", prev: "Pág. Anterior", top: "Topo", next: "Pág. Seguinte", part: "Parte", preface: "Prefácio", verses: "Versículos" },
    "it": { home: "Home", surahs: "Sura", pages: "Pagine", summary: "Riepilogo", back: "Indietro", listen: "Ascolta", stop: "Stop", options: "Opzioni", prevS: "Sura Prec.", nextS: "Sura Succ.", prev: "Pag. Prec.", top: "In alto", next: "Pag. Succ.", part: "Parte", preface: "Prefazione", verses: "Versetti" },
    "ru": { home: "Главная", surahs: "Суры", pages: "Страницы", summary: "Кратко", back: "Назад", listen: "Слушать", stop: "Стоп", options: "Опции", prevS: "Пред. Сура", nextS: "След. Сура", prev: "Пред. Стр.", top: "Наверх", next: "След. Стр.", part: "Часть", preface: "Предисловие", verses: "Аяты" },
    "nl": { home: "Home", surahs: "Surahs", pages: "Pagina's", summary: "Samenvatting", back: "Terug", listen: "Luisteren", stop: "Stop", options: "Opties", prevS: "Vorige Surah", nextS: "Volgende Surah", prev: "Vorige Pagina", top: "Omhoog", next: "Volgende Pagina", part: "Deel", preface: "Voorwoord", verses: "Verzen" },
    "pl": { home: "Strona główna", surahs: "Sury", pages: "Strony", summary: "Streszczenie", back: "Wstecz", listen: "Słuchaj", stop: "Zatrzymaj", options: "Opcje", prevS: "Poprzednia Sura", nextS: "Następna Sura", prev: "Poprzednia Strona", top: "Do góry", next: "Następna Strona", part: "Część", preface: "Przedmowa", verses: "Wersety" },
    "uk": { home: "Головна", surahs: "Сури", pages: "Сторінки", summary: "Короткий зміст", back: "Назад", listen: "Слухати", stop: "Стоп", options: "Опції", prevS: "Попередня Сура", nextS: "Наступна Сура", prev: "Попередня стор.", top: "Вгору", next: "Наступна стор.", part: "Частина", preface: "Передмова", verses: "Аяти" },
    "sv": { home: "Hem", surahs: "Suror", pages: "Sidor", summary: "Sammanfattning", back: "Tillbaka", listen: "Lyssna", stop: "Stopp", options: "Alternativ", prevS: "Föregående Sura", nextS: "Nästa Sura", prev: "Föregående Sida", top: "Till toppen", next: "Nästa Sida", part: "Del", preface: "Förord", verses: "Verser" },
    "el": { home: "Αρχική", surahs: "Σούρες", pages: "Σελίδες", summary: "Σύνοψη", back: "Πίσω", listen: "Ακούστε", stop: "Διακοπή", options: "Επιλογές", prevS: "Προηγούμενη Σούρα", nextS: "Επόμενη Σούρα", prev: "Προηγούμενη Σελίδα", top: "Κορυφή", next: "Επόμενη Σελίδα", part: "Μέρος", preface: "Πρόλογος", verses: "Εδάφια" },
    "ro": { home: "Acasă", surahs: "Surah", pages: "Pagini", summary: "Rezumat", back: "Înapoi", listen: "Ascultă", stop: "Oprește", options: "Opțiuni", prevS: "Surah Anterioară", nextS: "Surah Următoare", prev: "Pagina Anterioară", top: "Sus", next: "Pagina Următoare", part: "Partea", preface: "Prefață", verses: "Versete" },
    "sw": { home: "Nyumbani", surahs: "Sura", pages: "Kurasa", summary: "Muhtasari", back: "Rudi", listen: "Sikiliza", stop: "Acha", options: "Chaguo", prevS: "Sura Iliyopita", nextS: "Sura Inayofuata", prev: "Ukurasa Iliyopita", top: "Juu", next: "Ukurasa Ujao", part: "Sehemu", preface: "Dibaji", verses: "Aya" },
    "am": { home: "ዋና ገጽ", surahs: "ሱራዎች", pages: "ገጾች", summary: "ማጠቃለያ", back: "ተመለስ", listen: "አዳምጥ", stop: "አቁም", options: "ምርጫዎች", prevS: "ያለፈው ሱራ", nextS: "ቀጣይ ሱራ", prev: "ያለፈው ገጽ", top: "ወደ ላይ", next: "ቀጣይ ገጽ", part: "ክፍል", preface: "መቅድም", verses: "አያዎች" },
    "ha": { home: "Gida", surahs: "Surori", pages: "Shafuka", summary: "Takaitawa", back: "Baya", listen: "Saurari", stop: "Tsaya", options: "Zabuka", prevS: "Surah Baya", nextS: "Surah Na Gaba", prev: "Shafi Na Baya", top: "Sama", next: "Shafi Na Gaba", part: "Sashe", preface: "Gabatarwa", verses: "Ayoyi" },
    "so": { home: "Hoyga", surahs: "Suuradaha", pages: "Bogagga", summary: "Soo koobid", back: "Kulaabto", listen: "Dhageeyso", stop: "Jooji", options: "Khadadka", prevS: "Suuraddii Hore", nextS: "Suuradda Xigta", prev: "Bogga Hore", top: "Sarreeya", next: "Bogga Xiga", part: "Qaybta", preface: "Hordhac", verses: "Aayadaha" },
    "sq": { home: "Ballina", surahs: "Suret", pages: "Faqet", summary: "Përmbledhje", back: "Kthehu", listen: "Dëgjo", stop: "Ndalo", options: "Opsionet", prevS: "Sura e Mëparshme", nextS: "Sura e Mëpasshme", prev: "Faqja e Mëparshme", top: "Lart", next: "Faqja e Mëpasshme", part: "Pjesa", preface: "Parathënie", verses: "Ajetet" },
    "az": { home: "Ana Səhifə", surahs: "Surələr", pages: "Səhifələr", summary: "Xülasə", back: "Geri", listen: "Dinlə", stop: "Dayandır", options: "Seçimlər", prevS: "Əvvəlki Surə", nextS: "Növbəti Surə", prev: "Əvvəlki Səhifə", top: "Yuxarı", next: "Növbəti Səhifə", part: "Hissə", preface: "Ön söz", verses: "Ayələr" },
    "bs": { home: "Početna", surahs: "Sure", pages: "Stranice", summary: "Sažetak", back: "Nazad", listen: "Slušaj", stop: "Zaustavi", options: "Opcije", prevS: "Prethodna Sura", nextS: "Sljedeća Sura", prev: "Prethodna Stranica", top: "Vrh", next: "Sljedeća Stranica", part: "Dio", preface: "Predgovor", verses: "Ajeti" },
    "bg": { home: "Начало", surahs: "Сури", pages: "Страници", summary: "Резюме", back: "Назад", listen: "Слушайте", stop: "Стоп", options: "Опции", prevS: "Предишна Сура", nextS: "Следваща Сура", prev: "Предишна Стр.", top: "Нагоре", next: "Следваща Стр.", part: "Част", preface: "Предговор", verses: "Айети" },
    "cs": { home: "Domů", surahs: "Súry", pages: "Stránky", summary: "Shrnutí", back: "Zpět", listen: "Poslouchat", stop: "Zastavit", options: "Možnosti", prevS: "Předchozí Súra", nextS: "Další Súra", prev: "Předchozí Strana", top: "Nahoru", next: "Další Strana", part: "Část", preface: "Předmluva", verses: "Verše" },
    "ckb": { home: "سەرەتا", surahs: "سوورەتەکان", pages: "لاپەڕەکان", summary: "پوختە", back: "گەڕانەوە", listen: "گوێبگرە", stop: "بوەستە", options: "هەڵبژاردنەکان", prevS: "سوورەتی پێشوو", nextS: "سوورەتی داهاتوو", prev: "لاپەڕەی پێشوو", top: "سەرەوە", next: "لاپەڕەی داهاتوو", part: "بەش", preface: "پێشەکی", verses: "ئایەتەکان" },
    "no": { home: "Hjem", surahs: "Surer", pages: "Sider", summary: "Sammendrag", back: "Tilbake", listen: "Lytt", stop: "Stopp", options: "Alternativer", prevS: "Forrige Sura", nextS: "Neste Sura", prev: "Forrige Side", top: "Til toppen", next: "Neste Side", part: "Del", preface: "Forord", verses: "Vers" },
    "sd": { home: "مکھ صفحو", surahs: "سورتون", pages: "صفحا", summary: "خلاصو", back: "واپس", listen: "ٻڌو", stop: "روڪيو", options: "اختيار", prevS: "پويون سورت", nextS: "اگلي سورت", prev: "پويون صفحو", top: "مٿي", next: "اگلو صفحو", part: "حصو", preface: "مقدمو", verses: "آيتون" },
    "tg": { home: "Асосӣ", surahs: "Сураҳо", pages: "Саҳифаҳо", summary: "Хулоса", back: "Бозгашт", listen: "Гуш кунед", stop: "Ист", options: "Имконот", prevS: "Сураи қаблӣ", nextS: "Сураи баъдӣ", prev: "Саҳифаи қаблӣ", top: "Боло", next: "Саҳифаи баъдӣ", part: "Қисм", preface: "Муқаддима", verses: "Оятҳо" },
    "tt": { home: "Төп бит", surahs: "Сүрәләр", pages: "Битләр", summary: "Кыскача", back: "Артка", listen: "Тыңлау", stop: "Туктау", options: "Көйләүләр", prevS: "Алдагы Сүрә", nextS: "Киләсе Сүрә", prev: "Алдагы Бит", top: "Югарыга", next: "Киләсе Бит", part: "Өлеш", preface: "Кереш сүз", verses: "Аятләр" },
    "ug": { home: "باش بەت", surahs: "سۈرىلەر", pages: "بەتكۈچ", summary: "قىسقىچە", back: "قايتىش", listen: "اڭلاش", stop: "توختاش", options: "تاللانمىلار", prevS: "ئالدىنقى سۈرە", nextS: "كېيىنكى سۈرە", prev: "ئالدىنقى بەت", top: "ئۈستىگە", next: "كېيىنكى بەت", part: "قىسىم", preface: "كىرىش سۆز", verses: "ئايەتلەر" },
    "uz": { home: "Bosh sahifa", surahs: "Suralar", pages: "Sahifalar", summary: "Xulosa", back: "Orqaga", listen: "Eshitish", stop: "To'xtatish", options: "Sozlamalar", prevS: "Oldingi Sura", nextS: "Keyingi Sura", prev: "Oldingi Sahifa", top: "Yuqoriga", next: "Keyingi Sahifa", part: "Qism", preface: "Kirish", verses: "Oyatlar" },
    "tl": { home: "Tahanan", surahs: "Mga Surah", pages: "Mga Pahina", summary: "Buod", back: "Bumalik", listen: "Makinig", stop: "Hinto", options: "Mga Pagpipilian", prevS: "Naka-nakaraang Surah", nextS: "Susunod na Surah", prev: "Naka-nakaraang Pahina", top: "Itaas", next: "Susunod na Pahina", part: "Bahagi", preface: "Paunang Salita", verses: "Mga Talata" },
    "ps": { home: "اصلي پاڼه", surahs: "سورتونه", pages: "پاڼې", summary: "خلاصه", back: "شاته", listen: "اوریدل", stop: "درول", options: "غوراوي", prevS: "پخوانی سورت", nextS: "راځونکی سورت", prev: "پخوانۍ پاڼه", top: "بره", next: "راځونکې پاڼه", part: "برخه", preface: "سريزه", verses: "آیتونه" },
    "km": { home: "ទំព័រដើម", surahs: "ស៊ូរ៉ា", pages: "ទំព័រ", summary: "សង្ខេប", back: "ត្រឡប់ក្រោយ", listen: "ស្ដាប់", stop: "ឈប់", options: "ជម្រើស", prevS: "ស៊ូរ៉ាមុន", nextS: "ស៊ូរ៉ាបន្ទាប់", prev: "ទំព័រមុន", top: "ខាងលើ", next: "ទំព័របន្ទាប់", part: "ផ្នែក", preface: "សេចក្ដីផ្ដើម", verses: "អាយ៉ាត់" },
    "yo": { home: "Ilé", surahs: "Sura", pages: "Oju-iwe", summary: "Akpopọ", back: "Pada", listen: "Gbọ", stop: "Duro", options: "Àwọn aṣayan", prevS: "Sura Ti tẹlẹ", nextS: "Sura Ti n bọ", prev: "Oju-iwe Ti tẹlẹ", top: "Oke", next: "Oju-iwe Ti n bọ", part: "Apá", preface: "Ìṣáájú", verses: "Àwọn Ẹsẹ" },
    "om": { home: "Fuula Dura", surahs: "Suuraawwan", pages: "Fuulota", summary: "Gabaabduu", back: "Deebi'i", listen: "Dhaggeeffadhu", stop: "Dhaabi", options: "Filannoowwan", prevS: "Suuraa Darbe", nextS: "Suuraa Itti Aanu", prev: "Fuula Darbe", top: "Gubbaa", next: "Fuula Itti Aanu", part: "Kutaa", preface: "Seensa", verses: "Aayaatota" },
    "as": { home: "মূল পৃষ্ঠা", surahs: "সূৰাসমূহ", pages: "পৃষ্ঠাসমূহ", summary: "সাৰাংশ", back: "ঘূৰি যাওক", listen: "শুনক", stop: "বন্ধ কৰক", options: "বিকল্পসমূহ", prevS: "পূৰ্বৱৰ্তী সূৰা", nextS: "পরৱৰ্তী সূৰা", prev: "পূৰ্বৱৰ্তী পৃষ্ঠা", top: "ওপৰলৈ", next: "পরৱৰ্তী পৃষ্ঠা", part: "অংশ", preface: "ভূমিকা", verses: "আয়াত" },
    "kk": { home: "Басты бет", surahs: "Сүрелер", pages: "Беттер", summary: "Түйін", back: "Артқа", listen: "Тыңдау", stop: "Тоқтату", options: "Параметрлер", prevS: "Алдыңғы Сүре", nextS: "Келесі Сүре", prev: "Алдыңғы Бет", top: "Жоғары", next: "Келесі Бет", part: "Бөлім", preface: "Алғы сөз", verses: "Аяттар" },
    "ky": { home: "Башкы бет", surahs: "Сүрөлөр", pages: "Барактар", summary: "Жыйынтык", back: "Артка", listen: "Угуу", stop: "Токтотуу", options: "Параметрлер", prevS: "Мурдагы Сүрө", nextS: "Кийинки Сүрө", prev: "Мурдагы Барак", top: "Жогору", next: "Кийинки Барак", part: "Бөлүм", preface: "Алгы сөз", verses: "Аяттар" },
    "rw": { home: "Ahabanza", surahs: "Surati", pages: "Amapaji", summary: "Inshamake", back: "Gusubira inyuma", listen: "Umva", stop: "Hagarara", options: "Amahitamo", prevS: "Surati Ibanjira", nextS: "Surati Ikyurikira", prev: "Ipaji Ibanjira", top: "Hejuru", next: "Ipaji Ikyurikira", part: "Igice", preface: "Ijambo ry'ibanze", verses: "Imirongo" }
  };

  var L = UI_DICT[lang] || UI_DICT[String(lang).split('-')[0]] || UI_DICT['en'];   // a language without its own entry shows the English labels
  window.QURAN_UI = L;

  /* ---------- first visit: ask which language to use ---------- */
  var ASKED = 'quran-lang-asked';
  var LANGS = [
    ["ml", "മലയാളം"],
    ["en", "English"],
    ["hi", "हिन्दी"],
    ["ta", "தமிழ்"],
    ["te", "తెలుగు"],
    ["kn", "ಕನ್ನಡ"],
    ["mr", "मराठी"],
    ["gu", "ગુજરાતી"],
    ["pa", "ਪੰਜਾਬੀ"],
    ["bn", "বাংলা"],
    ["ur", "اردو"],
    ["ne", "नेपाली"],
    ["si", "සිංහල"],
    ["ar", "العربية"],
    ["fa", "فارسی"],
    ["tr", "Türkçe"],
    ["id", "Indonesia"],
    ["ms", "Melayu"],
    ["th", "ไทย"],
    ["vi", "Tiếng Việt"],
    ["zh-CN", "中文简体"],
    ["zh-TW", "中文繁體"],
    ["ja", "日本語"],
    ["ko", "한국어"],
    ["fr", "Français"],
    ["de", "Deutsch"],
    ["es", "Español"],
    ["pt", "Português"],
    ["it", "Italiano"],
    ["ru", "Русский"],
    ["nl", "Nederlands"],
    ["pl", "Polski"],
    ["uk", "Українська"],
    ["sv", "Svenska"],
    ["el", "Ελληνικά"],
    ["ro", "Română"],
    ["sw", "Kiswahili"],
    ["am", "አማርኛ"],
    ["ha", "Hausa"],
    ["so", "Soomaali"],
    ["sq", "Shqip"],
    ["az", "Azərbaycan"],
    ["bs", "Bosanski"],
    ["bg", "Български"],
    ["cs", "Čeština"],
    ["ckb", "کوردی"],
    ["no", "Norsk"],
    ["sd", "سنڌي"],
    ["tg", "Тоҷикӣ"],
    ["tt", "Татарча"],
    ["ug", "ئۇيغۇرچە"],
    ["uz", "Oʻzbekcha"],
    ["tl", "Tagalog"],
    ["ps", "پښتو"],
    ["km", "ភាសាខ្មែរ"],
    ["yo", "Yorùbá"],
    ["om", "Oromoo"],
    ["as", "অসমীয়া"],
    ["kk", "Қазақша"],
    ["ky", "Кыргызча"],
    ["rw", "Kinyarwanda"]
  ];
  function askLanguage() {
    try {
      if (window.top !== window.self) return;                                        // not inside embedded frames
      if (window.QURAN_NO_LANG_POPUP || document.documentElement.hasAttribute('data-no-lang-popup')) return;
      if (/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent || '')) return;
      if (cookieLang()) { localStorage.setItem(ASKED, '1'); return; }                // already chose a language (e.g. on the index)
      if (localStorage.getItem(ASKED)) return;                                       // already asked once
    } catch (e) { return; }

    var css = document.createElement('style');
    css.textContent =
      '.qlp{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6);font-family:"Noto Sans Malayalam",system-ui,sans-serif}' +
      '.qlp-card{width:100%;max-width:440px;max-height:88vh;overflow:auto;background:#fff;color:#22302a;border:2px solid #d4af37;border-radius:14px;padding:18px 16px 14px;box-shadow:0 10px 40px rgba(0,0,0,.45);text-align:center;position:relative}' +
      '.qlp-t{font-size:1.15rem;font-weight:700;color:#1d5240;margin:0 0 2px}.qlp-s{font-size:.9rem;color:#55605a;margin:0 0 12px}' +
      '.qlp-g{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}' +
      '.qlp-b{font:inherit;font-size:1rem;padding:10px 6px;border-radius:10px;border:1px solid #e2e8f0;border-top:3px solid #d4af37;background:#f6f3ea;color:inherit;cursor:pointer}' +
      '.qlp-b:hover,.qlp-b:focus-visible{background:#1d5240;color:#fff;outline:none}' +
      '.qlp-b.main{grid-column:1/-1;font-weight:700;background:#1d5240;color:#fff}' +
      '.qlp-x{position:absolute;top:6px;right:8px;border:none;background:none;font-size:1.3rem;line-height:1;color:inherit;cursor:pointer;padding:6px}' +
      '.qlp-n{font-size:.8rem;color:#55605a;margin:12px 0 0}' +
      '@media(prefers-color-scheme:dark){.qlp-card{background:#17261f;color:#e9efe9}.qlp-t{color:#d4af37}.qlp-s,.qlp-n{color:#a9b6ae}.qlp-b{background:#0f1a15;border-color:#2c3f36}}';
    document.head.appendChild(css);

    var ov = document.createElement('div');
    ov.className = 'qlp notranslate'; ov.setAttribute('translate', 'no');
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'qlp-title');
    var card = document.createElement('div'); card.className = 'qlp-card';
    var x = document.createElement('button'); x.type = 'button'; x.className = 'qlp-x'; x.setAttribute('aria-label', 'Close'); x.textContent = '\u00D7';
    var t = document.createElement('p'); t.className = 'qlp-t'; t.id = 'qlp-title'; t.textContent = '\u0D2D\u0D3E\u0D37 \u0D24\u0D3F\u0D30\u0D1E\u0D4D\u0D1E\u0D46\u0D1F\u0D41\u0D15\u0D4D\u0D15\u0D41\u0D15 \u00B7 Choose your language';
    var s = document.createElement('p'); s.className = 'qlp-s'; s.textContent = '\uD83C\uDF10';
    var g = document.createElement('div'); g.className = 'qlp-g';
    var n = document.createElement('p'); n.className = 'qlp-n';
    n.textContent = 'You can change it any time from the home page \u00B7 \u0D2D\u0D3E\u0D37 \u0D2A\u0D3F\u0D28\u0D4D\u0D28\u0D40\u0D1F\u0D4D \u0D2E\u0D3E\u0D31\u0D4D\u0D31\u0D3E\u0D02';

    var prevOverflow = document.documentElement.style.overflow;
    function close() {
      document.documentElement.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }
    function choose(code) {
      try { localStorage.setItem(ASKED, '1'); } catch (e) {}
      if (code !== 'ml') { savePref(code); close(); location.reload(); }          // reload: Google applies the cookie on load
      else { savePref('ml'); close(); }
    }
    function onKey(e) {
      if (e.key === 'Escape') { try { localStorage.setItem(ASKED, '1'); } catch (er) {} close(); }
    }
    LANGS.forEach(function (l, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'qlp-b' + (i === 0 ? ' main' : ''); b.textContent = l[1]; b.lang = l[0];
      b.addEventListener('click', function () { choose(l[0]); });
      g.appendChild(b);
    });
    x.addEventListener('click', function () { try { localStorage.setItem(ASKED, '1'); } catch (e) {} close(); });
    card.appendChild(x); card.appendChild(t); card.appendChild(s); card.appendChild(g); card.appendChild(n);
    ov.appendChild(card);
    document.body.appendChild(ov);
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    var first = g.firstChild; if (first && first.focus) first.focus();
  }
  onReady(askLanguage);

  /* ---------- Short & Translated Button Labels ---------- */
  var LABELS = window.QURAN_LABELS = window.QURAN_LABELS || {
    listen:  L.listen,
    stop:    '\u25a0 ' + L.stop,
    options: L.options
  };
  function keepShortLabels() {
    var m = document.getElementById('master'), o = document.getElementById('opt-toggle'), panel = document.getElementById('panel');
    if (!m && !o) return;
    function isOpen() { return !!(panel && (panel.classList.contains('open') || panel.style.display === 'block')); }
    function fix() {
      if (m && !m.classList.contains('playing') && m.textContent !== LABELS.listen) m.textContent = LABELS.listen;
      if (o) { var want = LABELS.options + (isOpen() ? ' \u25b4' : ' \u25be'); if (o.textContent !== want) o.textContent = want; }
    }
    [m, o].forEach(function (b) { if (b) new MutationObserver(fix).observe(b, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] }); });
    if (panel) new MutationObserver(fix).observe(panel, { attributes: true, attributeFilter: ['class', 'style'] });
    fix();
  }
  onReady(keepShortLabels);

  /* ---------- Part-picker pages (002, 003, 004 ...): translate their labels from the dictionary ---------- */
  function translatePartPicker() {
    var grid = document.getElementById('grid'), toggle = document.getElementById('prefToggle'), tts = document.getElementById('ttsBtn');
    if (!grid || !toggle || !tts || !document.getElementById('summary')) return;      // not a part-picker page
    if (lang === 'ml') return;                                                       // page is already written in Malayalam
    var P = L.part || 'Part', PREF = L.preface || 'Preface', VS = L.verses || 'Verses';
    var kept = function (e) { if (!e) return; if (!e.classList.contains('notranslate')) e.classList.add('notranslate'); if (e.getAttribute('translate') !== 'no') e.setAttribute('translate', 'no'); };   // only touch when needed: classList.add on an existing class still fires the observer
    var ttsText = function () { return (tts.classList.contains('playing') ? '\u25a0 ' + L.stop : '\u25b6 ' + L.listen + ' (' + PREF + ')'); };
    function fix() {
      var h2 = document.querySelector('main h2'); if (h2 && h2.textContent !== L.pages) { h2.textContent = L.pages; kept(h2); }
      var tNode = toggle.firstChild;                                                   // text node before the arrow
      if (tNode && tNode.nodeType === 3 && tNode.nodeValue.trim() !== PREF) tNode.nodeValue = PREF + ' ';
      kept(toggle);
      grid.querySelectorAll('.pg b').forEach(function (b, i) { var w = P + ' ' + (i + 1); if (b.textContent !== w) b.textContent = w; kept(b); });
      var meta = document.querySelector('.meta');
      if (meta) {
        var n = (meta.textContent.match(/\d+/) || [''])[0]; var w2 = VS + ' ' + n;
        if (n && meta.textContent !== w2) meta.textContent = w2; kept(meta);
      }
      var sum = document.getElementById('summary'); var sw = '\uD83D\uDCDD ' + L.summary;
      if (sum.textContent !== sw) sum.textContent = sw; kept(sum);
      var tw = ttsText(); if (tts.textContent !== tw) tts.textContent = tw; kept(tts);
    }
    var mo = new MutationObserver(function () { mo.disconnect(); try { fix(); } finally { watch(); } });
    function watch() { mo.observe(tts, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] }); }   // page script resets the button text
    fix(); watch();
  }
  onReady(translatePartPicker);

  /* ---------- Screen Wake Off Default ---------- */
  function findWakeCheckbox() {
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
  function initScreenWakeDefaultOff() {
    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var k = localStorage.key(i);
        if (k && /wake/i.test(k)) localStorage.removeItem(k);
      }
    } catch (e) {}

    var userInteracted = false;
    var wakeCb = findWakeCheckbox();
    if (wakeCb) {
      wakeCb.checked = false;
      wakeCb.removeAttribute('checked');
      wakeCb.addEventListener('change', function () {
        userInteracted = true;
        if (!wakeCb.checked && typeof window.releaseWake === 'function') {
          try { window.releaseWake(); } catch (e) {}
        }
      });
    }

    if (typeof window.requestWake === 'function') {
      var origRequestWake = window.requestWake;
      window.requestWake = function () {
        var cb = wakeCb || findWakeCheckbox();
        if (!userInteracted && (!cb || !cb.checked)) return Promise.resolve();
        return origRequestWake.apply(this, arguments);
      };
    }

    if (typeof window.releaseWake === 'function' && (!wakeCb || !wakeCb.checked)) {
      try { window.releaseWake(); } catch (e) {}
    }
  }
  onReady(initScreenWakeDefaultOff);


  /* ---------- top panel: the same pill buttons (icon + label) on every page ---------- */
  var ICONS = {
    home:    '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    surahs:  '<path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/>',
    pages:   '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    summary: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    back:    '<circle cx="12" cy="12" r="9"/><path d="M13.5 8.5 10 12l3.5 3.5"/>',
    tafsir:  '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 1 6.5 19H20v3H6.5"/><path d="M9 7h6"/>',
    hadith:  '<path d="M8 21h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8"/><path d="M8 21a2 2 0 0 1-2-2V5a1 1 0 0 0-2 0v2a1 1 0 0 0 1 1h3"/><path d="M11 9h5M11 13h5"/>',
    hifz:    '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>',
    link:    '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M13 9l3 3-3 3"/>'
  };
  function iconFor(href) {
    var u; try { u = new URL(href || '', location.href); } catch (e) { return 'link'; }
    var p = u.pathname.replace(/\/+$/, '').replace(/\.html?$/i, '');                 // '' = the home page
    var inSummary = /-summary$/.test(location.pathname.replace(/\/+$/, '').replace(/\.html?$/i, ''));
    if (p === '' || /\/quran$/.test(p)) return 'home';
    if (/surah-index$/.test(p)) return 'surahs';
    if (/\d{3}-summary$/.test(p)) return 'summary';
    if (/\/\d{3}(-\d+)?$/.test(p)) return inSummary ? 'back' : 'pages';
    if (/tafsir$/.test(p)) return 'tafsir';
    if (/hadith$/.test(p)) return 'hadith';
    if (/hifd$/.test(p)) return 'hifz';
    return 'link';
  }
  function styleTopNav() {
    var links = document.querySelectorAll('.topnav a.back');
    if (!links.length) return;
    var css = document.createElement('style');
    css.textContent =
      '.topnav{display:flex!important;gap:8px!important;justify-content:center!important;align-items:stretch!important;flex-wrap:nowrap!important;width:100%;max-width:560px;margin:0 auto 10px!important;padding:12px 12px 0!important}' +
      '.topnav .back{flex:1 1 0;min-width:0;display:inline-flex!important;align-items:center;justify-content:center;gap:7px;padding:8px 10px;border-radius:999px;' +
        'border:1px solid rgba(212,175,55,.7);background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.05));color:#fff!important;' +
        'font-family:inherit;font-size:clamp(.78rem,3.3vw,.95rem)!important;font-weight:600!important;line-height:1.2;text-decoration:none!important;white-space:nowrap;' +
        'box-shadow:0 2px 6px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.2);transition:transform .15s,background .15s,color .15s}' +
      '.topnav .back:hover,.topnav .back:focus-visible{background:#d4af37;color:#123528!important;transform:translateY(-1px);outline:none}' +
      '.topnav .back:active{transform:scale(.97)}' +
      '.topnav.tn3 .back{flex-direction:column;gap:3px;padding:7px 4px 6px;border-radius:16px;font-size:clamp(.72rem,3vw,.85rem)!important}' +
      '.topnav.tn3 .tn-lbl{max-width:100%}' +
      '.tn-ico{display:inline-flex;flex:none;width:20px;height:20px}' +
      '.tn-ico svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '.tn-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis}' +
      '@media(max-width:380px){.topnav{gap:6px!important;padding:10px 8px 0!important}.topnav .back{gap:5px;padding:7px 8px}.tn-ico,.tn-ico svg{width:18px;height:18px}}';
    document.head.appendChild(css);
    var bar = links[0].parentNode;
    if (links.length > 2 && bar && bar.classList) bar.classList.add('tn3');
    Array.prototype.forEach.call(links, function (a) {
      if (a.getAttribute('data-tn')) return;
      var type = iconFor(a.getAttribute('href'));
      var native = /^(home|surahs|pages|summary|back)$/.test(type) && L[type];                // translated here; other links keep their own words (the page translator handles them)
      var label = '';
      Array.prototype.forEach.call(a.childNodes, function (n) { if (n.nodeType === 3) label += n.textContent; });   // the words, without the old emoji
      label = native || label.replace(/\s+/g, ' ').trim() || (a.getAttribute('aria-label') || '');
      if (native) { a.classList.add('notranslate'); a.setAttribute('translate', 'no'); }
      var ico = document.createElement('span'); ico.className = 'tn-ico'; ico.setAttribute('aria-hidden', 'true');
      ico.innerHTML = '<svg viewBox="0 0 24 24" focusable="false">' + ICONS[type] + '</svg>';
      var lbl = document.createElement('span'); lbl.className = 'tn-lbl'; lbl.textContent = label;
      a.textContent = '';
      a.appendChild(ico); a.appendChild(lbl);
      a.setAttribute('data-tn', '1');
      if (label) a.setAttribute('title', label);
    });
  }
  onReady(styleTopNav);

  /* index page: its menu / language buttons get the same look as the top panel of the other pages */
  function styleIndexBar() {
    var pills = document.querySelectorAll('.banner-top-bar .pill');
    if (!pills.length) return;
    var css = document.createElement('style');
    css.textContent =
      '.banner-top-bar{justify-content:center!important;gap:8px!important}' +
      '.banner-top-bar .pill{height:42px!important;min-width:0!important;padding:0 14px!important;gap:8px!important;border-radius:999px!important;' +
        'border:1px solid rgba(212,175,55,.7)!important;background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.05))!important;color:#fff!important;' +
        'font-weight:600;box-shadow:0 2px 6px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.2)}' +
      '.banner-top-bar .pill:hover,.banner-top-bar .pill:focus-within{background:#d4af37!important;color:#123528!important}' +
      '.banner-top-bar .pill .lbl{display:inline!important;font-size:clamp(.8rem,3.2vw,.95rem);max-width:9.5em;overflow:hidden;text-overflow:ellipsis}' +
      '.banner-top-bar .pill .caret{display:inline!important}' +
      '.banner-top-bar .pill .tn-ico{display:inline-flex;flex:none;width:20px;height:20px}' +
      '.banner-top-bar .pill .tn-ico svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}';
    document.head.appendChild(css);
    var SV = {
      menu:  '<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
      globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3.2 3.2 3.2 14.8 0 18"/><path d="M12 3c-3.2 3.2-3.2 14.8 0 18"/>'
    };
    Array.prototype.forEach.call(pills, function (p) {
      var old = p.querySelector('.ico'); if (!old) return;
      var sel = p.querySelector('select');
      var ico = document.createElement('span'); ico.className = 'tn-ico'; ico.setAttribute('aria-hidden', 'true');
      ico.innerHTML = '<svg viewBox="0 0 24 24" focusable="false">' + ((sel && sel.id === 'langSelect') ? SV.globe : SV.menu) + '</svg>';
      old.parentNode.replaceChild(ico, old);
    });
  }
  onReady(styleIndexBar);

  /* hide Google's own bar / highlights & ensure minimal centered layout */
  var st = document.createElement('style');
  st.textContent = '.goog-te-banner-frame,.skiptranslate iframe{display:none!important}body{top:0!important;position:static!important;min-height:0!important}' +
    '.goog-te-spinner-pos,.goog-te-spinner,.goog-te-spinner-animation,.goog-te-gadget-icon,.goog-te-balloon-frame,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf-ti6hGc,.VIpgJd-ZVi9od-aZ2wEe,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-xl07Ob-OEVmcd{display:none!important;visibility:hidden!important}' +
    '#google_translate_element,#gt_el,.skiptranslate>iframe{display:none!important}' +
    '.goog-text-highlight{background:none!important;box-shadow:none!important}#goog-gt-tt,.goog-tooltip{display:none!important}' +
    '.controls{margin:0 auto!important;padding:6px 12px 8px 12px!important;border:none!important;border-radius:0 0 10px 10px!important;position:sticky;top:0;z-index:100;background:var(--bg, #fff);box-shadow:0 1px 4px rgba(0,0,0,0.05);display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;min-height:auto!important}' +
    '.banner{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:100%!important;gap:4px!important;margin:0!important;padding:0!important}' +
    '.banner-row{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:8px!important;width:100%!important}' +
    '#panel:not(.open):not([style*="display: block"]) { display: none !important; }' +
    '#status,#audio-status,.status-text{width:100%!important;text-align:center!important;display:block!important;margin:4px auto 0 auto!important;float:none!important;clear:both!important;font-size:0.85rem!important;color:var(--acc, #1d5240)!important}' +
    'body>.hero{margin-bottom:0!important;border-bottom:2px solid var(--gold)!important;padding-bottom:8px!important}' +
    'body>.hero + div{text-align:center;margin:2px auto}' +
    'body>.hero + div h1{color:var(--acc, #1d5240);font-size:clamp(1rem,2.5vw,1.3rem);margin:1px 0}' +
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
      try { markArabic(document.body); } catch (e) {}
      try { wrapArabic(document.body); } catch (e) {}
      var rm = document.querySelector('meta[name="referrer"]');
      if (rm) rm.setAttribute('content', 'strict-origin-when-cross-origin');
      if (!document.querySelector('script[src*="translate_a/element.js"]')) {     // the index page loads the widget itself
        window.googleTranslateElementInit = function () {
          new google.translate.TranslateElement({ pageLanguage: 'ml', autoDisplay: false }, 'gt_el');
        };
        var d = document.createElement('div'); d.id = 'gt_el'; d.style.display = 'none'; document.body.appendChild(d);
        var s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; s.async = true;
        document.head.appendChild(s);
      }
      try {                                                    // verse cards are built by player.js a moment later
        var AR_SEL = '[lang="ar"],.ar,.isti-ar';
        var mark = function (e) { if (e.getAttribute('translate') !== 'no') { e.setAttribute('translate', 'no'); e.classList.add('notranslate'); } };
        new MutationObserver(function (list) {
          list.forEach(function (mu) {
            mu.addedNodes.forEach(function (n) {
              if (n.nodeType !== 1) return;
              if (n.matches && n.matches(AR_SEL)) mark(n);
              n.querySelectorAll(AR_SEL).forEach(mark);
            });
          });
        }).observe(document.body, { childList: true, subtree: true });
      } catch (e) {}
    }

    /* Robust Option panel toggle & label state handler */
    var optBtn = document.getElementById('opt-toggle');
    var panel = document.getElementById('panel');
    var controls = document.querySelector('.controls');
    if (optBtn) { optBtn.classList.add('notranslate'); optBtn.setAttribute('translate', 'no'); }
    var masterBtn0 = document.getElementById('master');
    if (masterBtn0) { masterBtn0.classList.add('notranslate'); masterBtn0.setAttribute('translate', 'no'); }
    
    if (optBtn && panel) {
      panel.classList.remove('open');
      panel.style.display = 'none';
      optBtn.textContent = LABELS.options + ' \u25be';
      optBtn.removeAttribute('onclick'); // prevent double handling conflict

      optBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var isOpen = panel.classList.contains('open') || panel.style.display === 'block';
        if (isOpen) {
          panel.classList.remove('open');
          panel.style.display = 'none';
          if (controls) controls.classList.remove('open');
          optBtn.textContent = LABELS.options + ' \u25be';
        } else {
          panel.classList.add('open');
          panel.style.display = 'block';
          if (controls) controls.classList.add('open');
          optBtn.textContent = LABELS.options + ' \u25b4';
        }
      });

      document.addEventListener('click', function (e) {
        if (controls && !controls.contains(e.target)) {
          panel.classList.remove('open');
          panel.style.display = 'none';
          if (controls) controls.classList.remove('open');
          optBtn.textContent = LABELS.options + ' \u25be';
        }
      });
    }

    /* Status text centering below buttons */
    var banner = document.querySelector('.banner');
    var statusEl = document.getElementById('status');
    if (statusEl && banner) {
      banner.appendChild(statusEl);
    }

    /* 'കേൾക്കാം' master toggle button with stop capability */
    var masterBtn = document.getElementById('master');
    if (masterBtn) {
      masterBtn.textContent = LABELS.listen;
      masterBtn.addEventListener('click', function(e) {
        if (masterBtn.classList.contains('playing')) {
          e.stopImmediatePropagation();
          /* Stop through the player's own stopAll(): it ends the queue (token), the browser voice AND the audio.
             (The old code only paused the audio, so the spoken explanation / meaning kept going.) */
          if (typeof stopAll === 'function') stopAll();
          else {
            try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (er) {}
            if (typeof currentAudio !== 'undefined' && currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
            masterBtn.classList.remove('playing');
            masterBtn.textContent = LABELS.listen;
          }
        }
      }, true);
    }

    /* Move 'തുടർച്ചയായി കേൾക്കുക' checkbox inside panel next to 'വിവരണം' */
    var contInput = document.getElementById('cont');
    if (contInput && panel) {
      var wrapper = contInput.closest('label');
      if (wrapper) wrapper.remove();
      var newLabel = document.createElement('label');
      newLabel.className = 'opt';
      newLabel.appendChild(contInput);
      newLabel.appendChild(document.createTextNode(' തുടർച്ചയായി കേൾക്കുക'));

      var vivaranamLabel = null;
      var labels = panel.querySelectorAll('label');
      labels.forEach(function(l) {
        if (l.textContent.indexOf('വിവരണം') > -1) vivaranamLabel = l;
      });
      if (vivaranamLabel && vivaranamLabel.parentNode) {
        vivaranamLabel.parentNode.insertBefore(newLabel, vivaranamLabel.nextSibling);
      } else {
        panel.appendChild(newLabel);
      }
    }

    /* Bismillah handling: only on pages starting with verse 1, matching verse color */
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

  /* ===== text-to-speech engine with robust translated speech support ===== */
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
    c.querySelectorAll('.tag,.isti-ar,[translate="no"]:not(.mtrans)').forEach(function (x) { x.remove(); });
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

  /* Reliable SpeechSynthesis for translated pages */
  function speakIn(code, text, my, done, kind, label) {
    var chunks = splitText(cleanForSpeech(text));
    if (!chunks.length) { done(); return; }
    
    if (typeof window.speechSynthesis === 'undefined') {
      done();
      return;
    }

    var vc = code.toLowerCase();
    var voices = speechSynthesis.getVoices();
    var v = voices.find(function(item) { return item.lang.toLowerCase().replace('_', '-').indexOf(vc) === 0; }) ||
            voices.find(function(item) { return item.lang.toLowerCase().substring(0, 2) === vc.substring(0, 2); }) ||
            voices[0];

    var nextChunk = function (i) {
      if (my !== token) return;
      if (i >= chunks.length) { done(); return; }
      if (typeof statusEl !== 'undefined' && statusEl) {
        statusEl.textContent = (label ? label + ' · ' : '') + code + (v ? ' · ' + v.name : '') + ' (' + (i + 1) + '/' + chunks.length + ')';
      }

      var u = new SpeechSynthesisUtterance(chunks[i]);
      if (v) u.voice = v;
      u.lang = code;
      u.rate = 0.95;

      var finished = false, timer;
      var advance = function () {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        nextChunk(i + 1);
      };

      timer = setTimeout(advance, 8000);
      u.onend = advance;
      u.onerror = advance;

      try {
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
      } catch (e) {
        advance();
      }
    };

    try { speechSynthesis.cancel(); } catch(e) {}
    setTimeout(function () { nextChunk(0); }, 50);
  }

  var REC_BASE = BASE_URL + 'audio/', REC_CACHE = 'quran-voice-v1', REC_MAX = 400;
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
      if (!e) return fallback();
      return recSrc(REC_BASE + p3(SURAH) + '/' + key + '.mp3' + (e.h ? '?v=' + e.h : '')).then(function (src) {
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

  function ensureVoices(code, cb) {
    var ss = window.speechSynthesis;
    if (!ss || (ss.getVoices() || []).length) { cb(); return; }
    var fin = false;
    function finish() { if (fin) return; fin = true; try { ss.removeEventListener('voiceschanged', finish); } catch (e) {} cb(); }
    try { ss.addEventListener('voiceschanged', finish); } catch (e) {}
    setTimeout(finish, 1500);                                   // no voices at all: carry on, the fallback below takes over
  }

  onReady(function () {
    var pageSpeak = typeof window.speakMalayalam === 'function' ? window.speakMalayalam : null;   // the page's own version (browser voice, then online voice)
    window.speakMalayalam = function (text, my, done) {
      var el = null;
      if (typeof activeKey !== 'undefined' && activeKey) {
        el = document.getElementById('item-' + activeKey);
        if (!el) {
          var parts = activeKey.split('-');
          if (parts.length >= 2) {
            el = document.getElementById('item-' + parts[0] + '-' + parts[parts.length - 1]);
          }
        }
      }
      var shown = el ? shownText(el) : text, translated = !!shown && mlFrac(shown) < 0.5;
      var code = translated ? spokenCode(shown) : 'ml';
      var mt = el && el.querySelector('.mtrans');                  // API meaning: read it in its own language (e.g. English when that is the fallback)
      if (mt && mt.lang) { code = mt.lang; translated = true; }
      
      ensureVoices(code, function () {
        if (my !== token) return;
        if (translated) {
          speakIn(code, (shown || text).replace(NUM, ' '), my, done,
                  typeof curKind !== 'undefined' ? curKind : 'ml', typeof curLabel !== 'undefined' ? curLabel : '');
        } else {
          var kn = (typeof activeKey !== 'undefined' && activeKey) ? activeKey.split('-') : [];
          var verseNum = kn.length ? +kn[kn.length - 1] : 0;
          var fallbackSpeech = function() {
            var chunks = splitText(cleanForSpeech(text), 120);
            if (!chunks.length) { done(); return; }
            var kind = typeof curKind !== 'undefined' ? curKind : 'ml';
            var found = pick(kind);
            if (!found) {                                   // no Malayalam voice in this browser: use the page's own method, never stay silent
              if (pageSpeak) pageSpeak(text, my, done); else done();
              return;
            }
            var nextChunk = function(idx) {
              if (my !== token) return;
              if (idx >= chunks.length) { done(); return; }
              if (typeof statusEl !== 'undefined' && statusEl) statusEl.textContent = (typeof curLabel !== 'undefined' ? curLabel + ' · ' : '') + (found.name || 'Malayalam Voice') + ' (' + (idx+1) + '/' + chunks.length + ')';
              
              if (typeof window.speechSynthesis === 'undefined') {
                done();
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
      var q = (typeof fullQueue === 'function' ? fullQueue() : []), ar = document.getElementById('show-ar');
      if (!q.length || !VERSES.length || VERSES[0].n !== 1 || q[0].n !== 1 || (ar && !ar.checked)) return origToggle();
      q.unshift({ kind: 'bm', n: 0 });
      runQueue(q, true);
    };
  });

  /* offline support */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      var sw = new URL('sw.js', BASE_URL);
      if (sw.origin === location.origin) navigator.serviceWorker.register(sw.pathname, { scope: sw.pathname.replace(/[^\/]*$/, '') }).catch(function () {});
    });
  }
})();

/* ---------- surah pages: bottom navigation (previous page / top / next page), labels translated from the dictionary ---------- */
(function () {
  var L = window.QURAN_UI || {};

    if (window.QURAN_NO_PAGE_NAV) return;
    var AYAH = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
    var SPLIT_OVER = 30, PER_PAGE = 20;
    var CROSS_SURAH = true;
    var ICON = {
      prev: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
      top:  '<path d="M12 19V5"/><path d="M5.5 11.5 12 5l6.5 6.5"/>',
      next: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>'
    };

    function init() {
      var path = location.pathname.replace(/\/+$/, '').replace(/\.html?$/i, '');
      var m = /\/(\d{3})(?:-(\d+))?$/.exec(path);
      if (!m || !document.getElementById('verses')) return;
      var s = parseInt(m[1], 10), part = m[2] ? parseInt(m[2], 10) : 1;
      var count = AYAH[s - 1]; if (!count) return;
      var parts = count > SPLIT_OVER ? Math.ceil(count / PER_PAGE) : 1;
      var pad = m[1];
      function pad3(n) { return ('00' + n).slice(-3); }
      function partsOf(x) { return AYAH[x - 1] > SPLIT_OVER ? Math.ceil(AYAH[x - 1] / PER_PAGE) : 1; }
      function pageOf(x, which) {
        var p = partsOf(x);
        return p > 1 ? pad3(x) + '-' + (which === 'last' ? p : 1) : pad3(x);
      }

      var css = document.createElement('style');
      css.textContent =
        '.qpn{position:static;display:flex;justify-content:center;align-items:stretch;gap:6px;' +
          'width:100%;max-width:560px;margin:18px auto calc(16px + env(safe-area-inset-bottom,0px));padding:8px;' +
          'border-radius:16px;background:rgba(18,53,40,.96);border:1px solid rgba(212,175,55,.75);box-shadow:0 4px 16px rgba(0,0,0,.22);' +
          'opacity:0;pointer-events:none;transition:opacity .2s}' +
        '.qpn.show{opacity:1;pointer-events:auto}' +
        '.qpn a,.qpn button{flex:1 1 0;min-width:0;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 10px;border-radius:12px;border:0;' +
          'background:transparent;color:#fff!important;font:inherit;font-size:.74rem;font-weight:600;line-height:1.15;text-decoration:none!important;cursor:pointer;white-space:nowrap}' +
        '.qpn a:hover,.qpn button:hover,.qpn a:focus-visible,.qpn button:focus-visible{background:#d4af37!important;color:#123528!important;outline:none}' +
        '.qpn a svg,.qpn button svg,.qpn svg{width:20px!important;height:20px!important;display:inline-block!important;fill:none!important;stroke:currentColor!important;stroke-width:2!important;stroke-linecap:round!important;stroke-linejoin:round!important}' +
        '@media(max-width:380px){.qpn{gap:4px;padding:6px}.qpn a,.qpn button{padding:6px 6px;font-size:.68rem}}';
      document.head.appendChild(css);

      function item(tag, key, href, shownKey) {
        var e = document.createElement(tag);
        if (href) e.href = href; else e.type = 'button';
        var labelText = L[shownKey || key];
        e.className = 'qpn-' + key + ' notranslate';
        e.setAttribute('translate', 'no');
        e.setAttribute('aria-label', labelText); e.title = labelText;
        e.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[key] + '</svg><span>' + labelText + '</span>';
        return e;
      }
      var bar = document.createElement('nav'); bar.className = 'qpn notranslate'; bar.setAttribute('translate', 'no'); bar.setAttribute('aria-label', 'Page navigation');
      if (parts > 1 && part > 1) bar.appendChild(item('a', 'prev', pad + '-' + (part - 1)));
      else if (CROSS_SURAH && s > 1) bar.appendChild(item('a', 'prev', pageOf(s - 1, 'last'), 'prevS'));
      var top = item('button', 'top');
      top.addEventListener('click', function () {
        var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
      });
      bar.appendChild(top);
      if (parts > 1 && part < parts) bar.appendChild(item('a', 'next', pad + '-' + (part + 1)));
      else if (CROSS_SURAH && s < 114) bar.appendChild(item('a', 'next', pageOf(s + 1, 'first'), 'nextS'));
      document.body.appendChild(bar);

      var tick = false;
      function update() {
        tick = false;
        var y = window.pageYOffset || document.documentElement.scrollTop || 0;
        var nearEnd = y + window.innerHeight >= (document.documentElement.scrollHeight || 0) - 120;
        bar.classList.toggle('show', nearEnd);
      }
      window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  })();
