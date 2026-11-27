/* site.js – include on EVERY page:
   <script src="/site.js" defer></script>
   1) remembers the chosen language for the whole site
   2) translates top/bottom navigation buttons natively for 61 languages
   3) loads Google Translate only for page contents (verses, summaries, quizzes)
   4) natural voices + text to speech in the translated language
   5) recitation audio + service worker registration */
(function () {
  var KEY = 'quran-lang', YEAR = 'max-age=31536000';
  var BASE_URL = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^\/]*$/, '') : (location.origin + '/');

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn();
  }
  function cookieLang() {
    var m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
    if (!m) return '';
    var v = m[1]; try { v = decodeURIComponent(v); } catch (e) {}
    var x = v.match(/^\/[^\/]*\/([A-Za-z-]+)/);
    return x ? x[1] : '';
  }
  function getPref() {
    return cookieLang() || 'ml';
  }
  function setCookie(l) {
    var gone = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = gone; document.cookie = gone + '; domain=' + location.hostname;
    if (l !== 'ml') document.cookie = 'googtrans=/ml/' + l + '; path=/; ' + YEAR;
  }
  function savePref(l) { try { localStorage.setItem(KEY, l); } catch (e) {} setCookie(l); }

  var lang = getPref();
  setCookie(lang);

  /* ---------- Full Dictionary for 61 Languages ---------- */
  var UI_DICT = {
    "ml": { home: "പ്രധാനതാൾ", surahs: "സൂറത്തുകൾ", pages: "ഭാഗങ്ങൾ", summary: "സംഗ്രഹം", back: "തിരികെ", listen: "കേൾക്കാം", stop: "നിർത്തുക", options: "ഓപ്ഷനുകൾ", prevS: "മുൻ സൂറത്ത്", nextS: "അടുത്ത സൂറത്ത്", prev: "മുൻ ഭാഗം", top: "മുകളിൽ", next: "അടുത്ത ഭാഗം" },
    "en": { home: "Home", surahs: "Surahs", pages: "Pages", summary: "Summary", back: "Back", listen: "Listen", stop: "Stop", options: "Options", prevS: "Prev Surah", nextS: "Next Surah", prev: "Prev Page", top: "Top", next: "Next Page" },
    "hi": { home: "मुख्य पृष्ठ", surahs: "सूरह", pages: "पृष्ठ", summary: "सारांश", back: "वापस", listen: "सुनें", stop: "रोकें", options: "विकल्प", prevS: "पिछली सूरह", nextS: "अगली सूरह", prev: "पिछला पृष्ठ", top: "ऊपर", next: "अगला पृष्ठ" },
    "ta": { home: "முகப்பு", surahs: "சூராக்கள்", pages: "பக்கங்கள்", summary: "சுருக்கம்", back: "திரும்பி", listen: "கேளுங்கள்", stop: "நிறுத்து", options: "விருப்பங்கள்", prevS: "முந்தைய சூரா", nextS: "அடுத்த சூரா", prev: "முந்தைய பக்கம்", top: "மேலே", next: "அடுத்த பக்கம்" },
    "te": { home: "హోమ్", surahs: "సూరాలు", pages: "పేజీలు", summary: "సారాంశం", back: "వెనుకకు", listen: "వినండి", stop: "ఆపు", options: "ఎంపికలు", prevS: "మునుపటి సూరా", nextS: "తరువాత సూరా", prev: "మునుపటి పేజీ", top: "పైకి", next: "తరువాత పేజీ" },
    "kn": { home: "ಮುಖ್ಯ ಪುಟ", surahs: "ಸೂರಾ", pages: "ಪುಟಗಳು", summary: "ಸಾರಾಂಶ", back: "ಹಿಂದೆ", listen: "ಕೇಳಿ", stop: "ನಿಲ್ಲಿಸಿ", options: "ಆಯ್ಕೆಗಳು", prevS: "ಹಿಂದಿನ ಸೂರಾ", nextS: "ಮುಂದಿನ ಸೂರಾ", prev: "ಹಿಂದಿನ ಪುಟ", top: "ಮೇಲಕ್ಕೆ", next: "ಮುಂದಿನ ಪುಟ" },
    "mr": { home: "मुख्य पृष्ठ", surahs: "सूरह", pages: "पृष्ठे", summary: "सारांश", back: "मागे", listen: "ऐका", stop: "थांबा", options: "पर्याय", prevS: "मागील सूरह", nextS: "पुढील सूरह", prev: "मागील पृष्ठ", top: "वर", next: "पुढील पृष्ठ" },
    "gu": { home: "મુખ્ય પૃષ્ઠ", surahs: "સૂરા", pages: "પૃષ્ઠો", summary: "સારાંશ", back: "પાછા", listen: "સાંભળો", stop: "બંધ કરો", options: "વિકલ્પો", prevS: "અગાઉની સૂરા", nextS: "પછીની સૂરા", prev: "અગાઉનું પૃષ્ઠ", top: "ઉપર", next: "પછીનું પૃષ્ઠ" },
    "pa": { home: "ਮੁੱਖ ਪੰਨਾ", surahs: "ਸੂਰਤਾਂ", pages: "ਪੰਨੇ", summary: "ਸਾਰ", back: "ਵਾਪਸ", listen: "ਸੁਣੋ", stop: "ਰੋਕੋ", options: "ਵਿਕਲਪ", prevS: "ਪਿਛਲੀ ਸੂਰਤ", nextS: "ਅਗਲੀ ਸੂਰਤ", prev: "ਪਿਛਲਾ ਪੰਨਾ", top: "ਉੱਪਰ", next: "ਅਗਲਾ ਪੰਨਾ" },
    "bn": { home: "হোম", surahs: "সূরা", pages: "পৃষ্ঠা", summary: "সারসংক্ষেপ", back: "ফিরে যান", listen: "শুনুন", stop: "থামুন", options: "অপশন", prevS: "পূর্ববর্তী সূরা", nextS: "পরবর্তী সূরা", prev: "পূর্ববর্তী পৃষ্ঠা", top: "উপরে", next: "পরবর্তী পৃষ্ঠা" },
    "ur": { home: "صفحہ اول", surahs: "سورتیں", pages: "صفحات", summary: "خلاصہ", back: "واپس", listen: "سنیں", stop: "روکیں", options: "آپشنز", prevS: "پچھلی سورت", nextS: "اگلی سورت", prev: "پچھلا صفحہ", top: "اوپر", next: "اگلا صفحہ" },
    "ne": { home: "गृह पृष्ठ", surahs: "सूराहहरू", pages: "पृष्ठहरू", summary: "सारांश", back: "फर्किनुहोस्", listen: "सुन्नुहोस्", stop: "रोक्नुहोस्", options: "विकल्पहरू", prevS: "अघिल्लो सूराह", nextS: "अर्को सूराह", prev: "अघिल्लो पृष्ठ", top: "माथि", next: "अर्को पृष्ठ" },
    "si": { home: "මුල් පිටුව", surahs: "සුරාවන්", pages: "පිටු", summary: "සාරාංශය", back: "ආපසු", listen: "සවන් දෙන්න", stop: "නවතන්න", options: "විකල්ප", prevS: "පෙර සුරාව", nextS: "ඊළඟ සුරාව", prev: "පෙර පිටුව", top: "ඉහළට", next: "ඊළඟ පිටුව" },
    "ar": { home: "الرئيسية", surahs: "السور", pages: "الصفحات", summary: "الملخص", back: "رجوع", listen: "استماع", stop: "إيقاف", options: "خيارات", prevS: "السورة السابقة", nextS: "السورة التالية", prev: "الصفحة السابقة", top: "أعلى", next: "الصفحة التالية" },
    "fa": { home: "صفحه اصلی", surahs: "سوره‌ها", pages: "صفحات", summary: "خلاصه", back: "بازگشت", listen: "شنیدن", stop: "توقف", options: "گزینه‌ها", prevS: "سوره قبلی", nextS: "سوره بعدی", prev: "صفحه قبلی", top: "بالا", next: "صفحه بعدی" },
    "tr": { home: "Ana Sayfa", surahs: "Sureler", pages: "Sayfalar", summary: "Özet", back: "Geri", listen: "Dinle", stop: "Durdur", options: "Seçenekler", prevS: "Önceki Sure", nextS: "Sonraki Sure", prev: "Önceki Sayfa", top: "Yukarı", next: "Sonraki Sayfa" },
    "id": { home: "Beranda", surahs: "Surah", pages: "Halaman", summary: "Ringkasan", back: "Kembali", listen: "Dengar", stop: "Hentikan", options: "Opsi", prevS: "Surah Sblm", nextS: "Surah Slanjut", prev: "Hal Sblm", top: "Atas", next: "Hal Slanjut" },
    "ms": { home: "Utama", surahs: "Surah", pages: "Halaman", summary: "Ringkasan", back: "Kembali", listen: "Dengar", stop: "Henti", options: "Pilihan", prevS: "Surah Sblm", nextS: "Surah Sthn", prev: "Hal Sblm", top: "Atas", next: "Hal Sthn" },
    "th": { home: "หน้าแรก", surahs: "ซูเราะฮ์", pages: "หน้า", summary: "สรุป", back: "ย้อนกลับ", listen: "ฟัง", stop: "หยุด", options: "ตัวเลือก", prevS: "ซูเราะฮ์ก่อนหน้า", nextS: "ซูเราะฮ์ถัดไป", prev: "หน้าก่อนหน้า", top: "ด้านบน", next: "หน้าถัดไป" },
    "vi": { home: "Trang chủ", surahs: "Chương", pages: "Trang", summary: "Tóm tắt", back: "Quay lại", listen: "Nghe", stop: "Dừng", options: "Tùy chọn", prevS: "Chương trước", nextS: "Chương sau", prev: "Trang trước", top: "Lên đầu", next: "Trang sau" },
    "zh-CN": { home: "首页", surahs: "章", pages: "页", summary: "概要", back: "返回", listen: "倾听", stop: "停止", options: "选项", prevS: "上一章", nextS: "下一章", prev: "上一页", top: "顶部", next: "下一页" },
    "zh-TW": { home: "首頁", surahs: "章", pages: "頁", summary: "概要", back: "返回", listen: "傾聽", stop: "停止", options: "選項", prevS: "上一章", nextS: "下一章", prev: "上一頁", top: "頂部", next: "下一頁" },
    "ja": { home: "ホーム", surahs: "章", pages: "ページ", summary: "要約", back: "戻る", listen: "聴く", stop: "停止", options: "オプション", prevS: "前の章", nextS: "次の章", prev: "前のページ", top: "トップへ", next: "次のページ" },
    "ko": { home: "홈", surahs: "수라", pages: "페이지", summary: "요약", back: "뒤로", listen: "듣기", stop: "정지", options: "옵션", prevS: "이전 수라", nextS: "다음 수라", prev: "이전 페이지", top: "맨 위로", next: "다음 페이지" },
    "fr": { home: "Accueil", surahs: "Sourates", pages: "Pages", summary: "Résumé", back: "Retour", listen: "Écouter", stop: "Arrêter", options: "Options", prevS: "Sourate Préc.", nextS: "Sourate Suiv.", prev: "Page Préc.", top: "Haut", next: "Page Suiv." },
    "de": { home: "Startseite", surahs: "Suren", pages: "Seiten", summary: "Zusammenfassung", back: "Zurück", listen: "Anhören", stop: "Stopp", options: "Optionen", prevS: "Vorherige Sure", nextS: "Nächste Sure", prev: "Vorherige Seite", top: "Nach oben", next: "Nächste Seite" },
    "es": { home: "Inicio", surahs: "Suras", pages: "Páginas", summary: "Resumen", back: "Volver", listen: "Escuchar", stop: "Detener", options: "Opciones", prevS: "Sura Anterior", nextS: "Sura Siguiente", prev: "Pág. Anterior", top: "Arriba", next: "Pág. Siguiente" },
    "pt": { home: "Início", surahs: "Suratas", pages: "Páginas", summary: "Resumo", back: "Voltar", listen: "Ouvir", stop: "Parar", options: "Opções", prevS: "Surata Anterior", nextS: "Surata Seguinte", prev: "Pág. Anterior", top: "Topo", next: "Pág. Seguinte" },
    "it": { home: "Home", surahs: "Sura", pages: "Pagine", summary: "Riepilogo", back: "Indietro", listen: "Ascolta", stop: "Stop", options: "Opzioni", prevS: "Sura Prec.", nextS: "Sura Succ.", prev: "Pag. Prec.", top: "In alto", next: "Pag. Succ." },
    "ru": { home: "Главная", surahs: "Суры", pages: "Страницы", summary: "Кратко", back: "Назад", listen: "Слушать", stop: "Стоп", options: "Опции", prevS: "Пред. Сура", nextS: "След. Сура", prev: "Пред. Стр.", top: "Наверх", next: "След. Стр." },
    "nl": { home: "Home", surahs: "Surahs", pages: "Pagina's", summary: "Samenvatting", back: "Terug", listen: "Luisteren", stop: "Stop", options: "Opties", prevS: "Vorige Surah", nextS: "Volgende Surah", prev: "Vorige Pagina", top: "Omhoog", next: "Volgende Pagina" },
    "pl": { home: "Strona główna", surahs: "Sury", pages: "Strony", summary: "Streszczenie", back: "Wstecz", listen: "Słuchaj", stop: "Zatrzymaj", options: "Opcje", prevS: "Poprzednia Sura", nextS: "Następna Sura", prev: "Poprzednia Strona", top: "Do góry", next: "Następna Strona" },
    "uk": { home: "Головна", surahs: "Сури", pages: "Сторінки", summary: "Короткий зміст", back: "Назад", listen: "Слухати", stop: "Стоп", options: "Опції", prevS: "Попередня Сура", nextS: "Наступна Сура", prev: "Попередній Стор.", top: "Вгору", next: "Наступний Стор." },
    "sv": { home: "Hem", surahs: "Suror", pages: "Sidor", summary: "Sammanfattning", back: "Tillbaka", listen: "Lyssna", stop: "Stopp", options: "Alternativ", prevS: "Föregående Sura", nextS: "Nästa Sura", prev: "Föregående Sida", top: "Till toppen", next: "Nästa Sida" },
    "el": { home: "Αρχική", surahs: "Σούρες", pages: "Σελίδες", summary: "Σύνοψη", back: "Πίσω", listen: "Ακούστε", stop: "Διακοπή", options: "Επιλογές", prevS: "Προηγούμενη Σούρα", nextS: "Επόμενη Σούρα", prev: "Προηγούμενη Σελίδα", top: "Коρυφή", next: "Επόμενη Σελίδα" },
    "ro": { home: "Acasă", surahs: "Surah", pages: "Pagini", summary: "Rezumat", back: "Înapoi", listen: "Ascultă", stop: "Oprește", options: "Opțiuni", prevS: "Surah Anterioară", nextS: "Surah Următoare", prev: "Pagina Anterioară", top: "Sus", next: "Pagina Următoare" },
    "sw": { home: "Nyumbani", surahs: "Sura", pages: "Kurasa", summary: "Muhtasari", back: "Rudi", listen: "Sikiliza", stop: "Acha", options: "Chaguo", prevS: "Sura Iliyopita", nextS: "Sura Inayofuata", prev: "Ukurasa Iliyopita", top: "Juu", next: "Ukurasa Ujao" },
    "am": { home: "প্রধান ገጽ", surahs: "ሱራዎች", pages: "ገጾች", summary: "ማጠቃለያ", back: "ተመለስ", listen: "አዳምጥ", stop: "አቁም", options: "ምርጫዎች", prevS: "ያለፈው ሱራ", nextS: "ቀጣይ ሱራ", prev: "ያለፈው ገጽ", top: "ወደ ላይ", next: "ቀጣይ ገጽ" },
    "ha": { home: "Gida", surahs: "Surori", pages: "Shafuka", summary: "Takaitawa", back: "Baya", listen: "Saurari", stop: "Tsaya", options: "Zabuka", prevS: "Surah Baya", nextS: "Surah Na Gaba", prev: "Shafi Na Baya", top: "Sama", next: "Shafi Na Gaba" },
    "so": { home: "Hoyga", surahs: "Suuradaha", pages: "Bogagga", summary: "Soo koobid", back: "Kulaabto", listen: "Dhageeyso", stop: "Jooji", options: "Khadadka", prevS: "Suuraddii Hore", nextS: "Suuradda Xigta", prev: "Bogga Hore", top: "Sarreeya", next: "Bogga Xiga" },
    "sq": { home: "Ballina", surahs: "Suret", pages: "Faqet", summary: "Përmbledhje", back: "Kthehu", listen: "Dëgjo", stop: "Ndalo", options: "Opsionet", prevS: "Sura e Mëparshme", nextS: "Sura e Mëpasshme", prev: "Faqja e Mëparshme", top: "Lart", next: "Faqja e Mëpasshme" },
    "az": { home: "Ana Səhifə", surahs: "Surələr", pages: "Səhifələr", summary: "Xülasə", back: "Geri", listen: "Dinlə", stop: "Dayandır", options: "Seçimlər", prevS: "Əvvəlki Surə", nextS: "Növbəti Surə", prev: "Əvvəlki Səhifə", top: "Yuxarı", next: "Növbəti Səhifə" },
    "bs": { home: "Početna", surahs: "Sure", pages: "Stranice", summary: "Sažetak", back: "Nazad", listen: "Slušaj", stop: "Zaustavi", options: "Opcije", prevS: "Prethodna Sura", nextS: "Sljedeća Sura", prev: "Prethodna Stranica", top: "Vrh", next: "Sljedeća Stranica" },
    "bg": { home: "Начало", surahs: "Сури", pages: "Страници", summary: "Резюме", back: "Назад", listen: "Слушайте", stop: "Стоп", options: "Опции", prevS: "Предишна Сура", nextS: "Следваща Сура", prev: "Предишна Стр.", top: "Нагоре", next: "Следваща Стр." },
    "cs": { home: "Domů", surahs: "Súry", pages: "Stránky", summary: "Shrnutí", back: "Zpět", listen: "Poslouchat", stop: "Zastavit", options: "Možnosti", prevS: "Předchozí Súra", nextS: "Další Súra", prev: "Předchozí Strana", top: "Nahoru", next: "Další Strana" },
    "ckb": { home: "سەرەتا", surahs: "سوورەتەکان", pages: "لاپەڕەکان", summary: "پوختە", back: "گەڕانەوە", listen: "گوێبگرە", stop: "بوەستە", options: "هەڵبژاردنەکان", prevS: "سوورەتی پێشوو", nextS: "سوورەتی داهاتوو", prev: "لاپەڕەی پێشوو", top: "سەرەوە", next: "لاپەڕەی داهاتوو" },
    "no": { home: "Hjem", surahs: "Surer", pages: "Sider", summary: "Sammendrag", back: "Tilbake", listen: "Lytt", stop: "Stopp", options: "Alternativer", prevS: "Forrige Sura", nextS: "Neste Sura", prev: "Forrige Side", top: "Til toppen", next: "Neste Side" },
    "sd": { home: "مکھ صفحو", surahs: "سورتون", pages: "صفحا", summary: "خلاصو", back: "واپس", listen: "ٻڌو", stop: "روڪيو", options: "اختيار", prevS: "پويون سورت", nextS: "اگلي سورت", prev: "پويون صفحو", top: "مٿي", next: "اگلو صفحو" },
    "tg": { home: "Асосӣ", surahs: "Сураҳо", pages: "Саҳифаҳо", summary: "Хулоса", back: "Бозгашт", listen: "Гуш кунед", stop: "Ист", options: "Имконот", prevS: "Сураи қаблӣ", nextS: "Сураи баъдӣ", prev: "Саҳифаи қаблӣ", top: "Боло", next: "Саҳифаи баъдӣ" },
    "tt": { home: "Төп бит", surahs: "Сүрәләр", pages: "Битләр", summary: "Кыскача", back: "Артка", listen: "Тыңлау", stop: "Туктау", options: "Парчалар", prevS: "Алдагы Сүрә", nextS: "Киләсе Сүрә", prev: "Алдагы Бит", top: "Югарыга", next: "Киләсе Бит" },
    "ug": { home: "باش بەت", surahs: "سۈرىلەر", pages: "بەتكۈچ", summary: "قىسقىچە", back: "قايتىش", listen: "اڭلاش", stop: "توختاش", options: "تاللانمىلار", prevS: "ئالدىنقى سۈرە", nextS: "كېيىنكى سۈرە", prev: "ئالدىنقى بەت", top: "ئۈستىگە", next: "كېيىنكى بەت" },
    "uz": { home: "Bosh sahifa", surahs: "Suralar", pages: "Sahifalar", summary: "Xulosa", back: "Orqaga", listen: "Eshitish", stop: "To'xtatish", options: "Options", prevS: "Oldingi Sura", nextS: "Keyingi Sura", prev: "Oldingi Sahifa", top: "Yuqoriga", next: "Keyingi Sahifa" },
    "tl": { home: "Tahanan", surahs: "Mga Surah", pages: "Mga Pahina", summary: "Buod", back: "Bumalik", listen: "Makinig", stop: "Hinto", options: "Mga Pagpipilian", prevS: "Naka-nakaraang Surah", nextS: "Susunod na Surah", prev: "Naka-nakaraang Pahina", top: "Itaas", next: "Susunod na Pahina" },
    "ps": { home: "اصلي پاڼه", surahs: "سورتونه", pages: "پاڼې", summary: "خلاصه", back: "شاته", listen: "اوریدل", stop: "درول", options: "غوراوي", prevS: "پخوانی سورت", nextS: "راځونکی سورت", prev: "پخوانۍ پاڼه", top: "بره", next: "راځونکې پاڼه" },
    "km": { home: "ទំព័រដើម", surahs: "ស៊ូរ៉ា", pages: "ទំព័រ", summary: "សង្ខេប", back: "ត្រឡប់ក្រោយ", listen: "ស្ដាប់", stop: "ឈប់", options: "ជម្រើស", prevS: "ស៊ូរ៉ាមុន", nextS: "ស៊ូរ៉ាបន្ទាប់", prev: "ទំព័រមុន", top: "ខាងលើ", next: "ទំព័របន្ទាប់" },
    "yo": { home: "Agbaye", surahs: "Sura", pages: "Oju-iwe", summary: "Akpopọ", back: "Pada", listen: "Gbọ", stop: "Duro", options: "Àwọn aṣayan", prevS: "Sura Ti tẹlẹ", nextS: "Sura Ti n bọ", prev: "Oju-iwe Ti tẹlẹ", top: "Oke", next: "Oju-iwe Ti n bọ" },
    "om": { home: "Fuula Dura", surahs: "Suuraawwan", pages: "Fuulota", summary: "Gabaabduu", back: "Deebi'i", listen: "Dhaggeeffadhu", stop: "Dhaabi", options: "Filannoowwan", prevS: "Suuraa Darbe", nextS: "Suuraa Itti Aanu", prev: "Fuula Darbe", top: "Gubbaa", next: "Fuula Itti Aanu" },
    "as": { home: "মূল পৃষ্ঠা", surahs: "সূৰাসমূহ", pages: "পৃষ্ঠাসমূহ", summary: "সাৰাংশ", back: "ঘূৰি যাওক", listen: "শুনক", stop: "বন্ধ কৰক", options: "বিকল্পসমূহ", prevS: "পূৰ্বৱৰ্তী সূৰা", nextS: "পরৱৰ্তী সূৰা", prev: "পূৰ্বৱৰ্তী পৃষ্ঠা", top: "ওপৰলৈ", next: "পরৱৰ্তী পৃষ্ঠা" },
    "kk": { home: "Басты бет", surahs: "Сүрелер", pages: "Беттер", summary: "Түйін", back: "Артқа", listen: "Тыңдау", stop: "Тоқтату", options: "Параметрлер", prevS: "Алдыңғы Сүре", nextS: "Келесі Сүре", prev: "Алдыңғы Бет", top: "Жоғары", next: "Келесі Бет" },
    "ky": { home: "Башкы бет", surahs: "Сүрөлөр", pages: "Барактар", summary: "Жыйынтык", back: "Артка", listen: "Угуу", stop: "Токтотуу", options: "Параметрлер", prevS: "Мурдагы Сүрө", nextS: "Кийинки Сүрө", prev: "Мурдагы Барак", top: "Жогору", next: "Кийинки Барак" },
    "rw": { home: "Ahabanza", surahs: "Surati", pages: "Amapaji", summary: "Inshamake", back: "Gusubira inyuma", listen: "Umva", stop: "Hagarara", options: "Amahitamo", prevS: "Surati Ibanjira", nextS: "Surati Ikyurikira", prev: "Ipaji Ibanjira", top: "Hejuru", next: "Ipaji Ikyurikira" }
  };

  var L = UI_DICT[lang] || UI_DICT['ml'];

  /* ---------- first visit: ask language popup ---------- */
  var ASKED = 'quran-lang-asked';
  var LANGS = [
    ["ml", "മലയാളം"], ["en", "English"], ["hi", "हिन्दी"], ["ta", "தமிழ்"], ["te", "తెలుగు"],
    ["kn", "കನ್ನಡ"], ["mr", "मराठी"], ["gu", "ગુજરાતી"], ["pa", "ਪੰਜਾਬੀ"], ["bn", "বাংলা"],
    ["ur", "اردو"], ["ne", "नेपाली"], ["si", "සිංහල"], ["ar", "العربية"], ["fa", "فارسی"],
    ["tr", "Türkçe"], ["id", "Indonesia"], ["ms", "Melayu"], ["th", "ไทย"], ["vi", "Tiếng Việt"],
    ["zh-CN", "中文简体"], ["zh-TW", "中文繁體"], ["ja", "日本語"], ["ko", "한국어"], ["fr", "Français"],
    ["de", "Deutsch"], ["es", "Español"], ["pt", "Português"], ["it", "Italiano"], ["ru", "Русский"],
    ["nl", "Nederlands"], ["pl", "Polski"], ["uk", "Українська"], ["sv", "Svenska"], ["el", "Ελληνικά"],
    ["ro", "Română"], ["sw", "Kiswahili"], ["am", "አማርኛ"], ["ha", "Hausa"], ["so", "Soomaali"],
    ["sq", "Shqip"], ["az", "Azərbaycan"], ["bs", "Bosanski"], ["bg", "Български"], ["cs", "Čeština"],
    ["ckb", "کوردی"], ["no", "Norsk"], ["sd", "سنڌي"], ["tg", "Тоҷикӣ"], ["tt", "Татарча"],
    ["ug", "ئۇيغۇرچە"], ["uz", "Oʻzbekcha"], ["tl", "Tagalog"], ["ps", "پښتو"], ["km", "ភាសាខ្មែរ"],
    ["yo", "Yorùbá"], ["om", "Oromoo"], ["as", "অসমীয়া"], ["kk", "Қазақша"], ["ky", "Кыргызча"], ["rw", "Kinyarwanda"]
  ];

  function askLanguage() {
    try {
      if (window.top !== window.self) return;
      if (window.QURAN_NO_LANG_POPUP || document.documentElement.hasAttribute('data-no-lang-popup')) return;
      if (/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent || '')) return;
      if (cookieLang()) { localStorage.setItem(ASKED, '1'); return; }
      if (localStorage.getItem(ASKED)) return;
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
      if (code !== 'ml') { savePref(code); close(); location.reload(); }
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

  /* ---------- Top Panel & Native Button Translations ---------- */
  var ICONS = {
    home:    '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    surahs:  '<path d="M2 5.5C4.5 4 8 4 12 6c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 6v13.5"/>',
    pages:   '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
    summary: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    back:    '<circle cx="12" cy="12" r="9"/><path d="M13.5 8.5 10 12l3.5 3.5"/>',
    link:    '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M13 9l3 3-3 3"/>'
  };
  function iconFor(href) {
    var u; try { u = new URL(href || '', location.href); } catch (e) { return 'link'; }
    var p = u.pathname.replace(/\/+$/, '').replace(/\.html?$/i, '');
    var inSummary = /-summary$/.test(location.pathname.replace(/\/+$/, '').replace(/\.html?$/i, ''));
    if (p === '' || /\/quran$/.test(p)) return 'home';
    if (/surah-index$/.test(p)) return 'surahs';
    if (/\d{3}-summary$/.test(p)) return 'summary';
    if (/\/\d{3}(-\d+)?$/.test(p)) return inSummary ? 'back' : 'pages';
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
      '.topnav.tn3 .back{flex-direction:column;gap:3px;padding:7px 4px 6px;border-radius:16px;font-size:clamp(.72rem,3vw,.85rem)!important}' +
      '.tn-ico{display:inline-flex;flex:none;width:20px;height:20px}' +
      '.tn-ico svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
      '.tn-lbl{min-width:0;overflow:hidden;text-overflow:ellipsis}';
    document.head.appendChild(css);

    var bar = links[0].parentNode;
    if (links.length > 2 && bar && bar.classList) bar.classList.add('tn3');
    Array.prototype.forEach.call(links, function (a) {
      if (a.getAttribute('data-tn')) return;
      var type = iconFor(a.getAttribute('href'));
      var label = L[type] || L.home;
      a.classList.add('notranslate'); a.setAttribute('translate', 'no');
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

  /* ---------- Google Translate Loader ---------- */
  var st = document.createElement('style');
  st.textContent = '.goog-te-banner-frame,.skiptranslate iframe{display:none!important}body{top:0!important}' +
    '.goog-text-highlight{background:none!important;box-shadow:none!important}#goog-gt-tt,.goog-tooltip{display:none!important}' +
    '.controls{margin:0 auto!important;padding:6px 12px 8px 12px!important;border:none!important;border-radius:0 0 10px 10px!important;position:sticky;top:0;z-index:100;background:var(--bg, #fff);box-shadow:0 1px 4px rgba(0,0,0,0.05);display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:4px!important;min-height:auto!important}' +
    '.banner{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;width:100%!important;gap:4px!important;margin:0!important;padding:0!important}' +
    '.banner-row{display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:8px!important;width:100%!important}' +
    '#panel:not(.open):not([style*="display: block"]) { display: none !important; }' +
    '#status,#audio-status,.status-text{width:100%!important;text-align:center!important;display:block!important;margin:4px auto 0 auto!important;float:none!important;clear:both!important;font-size:0.85rem!important;color:var(--acc, #1d5240)!important}';
  document.head.appendChild(st);

  function markArabic(root) {
    var AR = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    root.querySelectorAll('h1,h2,h3,p,span,div,a,li').forEach(function (e) {
      if (e.children.length) return;
      var t = e.textContent, n = (t.match(AR) || []).length, len = t.replace(/\s/g, '').length;
      if (n && len && n / len > 0.5) e.setAttribute('translate', 'no');
    });
  }

  onReady(function () {
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
      var rm = document.querySelector('meta[name="referrer"]');
      if (rm) rm.setAttribute('content', 'strict-origin-when-cross-origin');
      if (!document.querySelector('script[src*="translate_a/element.js"]')) {
        window.googleTranslateElementInit = function () {
          new google.translate.TranslateElement({ pageLanguage: 'ml', autoDisplay: false }, 'gt_el');
        };
        var d = document.createElement('div'); d.id = 'gt_el'; d.style.display = 'none'; document.body.appendChild(d);
        var s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; s.async = true;
        document.head.appendChild(s);
      }
    }

    var optBtn = document.getElementById('opt-toggle');
    var panel = document.getElementById('panel');
    var masterBtn = document.getElementById('master');
    if (optBtn) { optBtn.classList.add('notranslate'); optBtn.setAttribute('translate', 'no'); }
    if (masterBtn) { masterBtn.classList.add('notranslate'); masterBtn.setAttribute('translate', 'no'); }

    if (optBtn && panel) {
      panel.classList.remove('open');
      panel.style.display = 'none';
      optBtn.textContent = L.options + ' ▾';

      optBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var isOpen = panel.classList.contains('open') || panel.style.display === 'block';
        if (isOpen) {
          panel.classList.remove('open'); panel.style.display = 'none';
          optBtn.textContent = L.options + ' ▾';
        } else {
          panel.classList.add('open'); panel.style.display = 'block';
          optBtn.textContent = L.options + ' ▴';
        }
      });
    }

    if (masterBtn) {
      masterBtn.textContent = L.listen;
      masterBtn.addEventListener('click', function(e) {
        if (masterBtn.classList.contains('playing')) {
          e.stopImmediatePropagation();
          if (typeof stopAll === 'function') stopAll();
          else {
            try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (er) {}
            if (typeof currentAudio !== 'undefined' && currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
            masterBtn.classList.remove('playing');
            masterBtn.textContent = L.listen;
          }
        }
      }, true);
    }
  });

  /* ---------- Speech Synthesis ---------- */
  var MALE = /midhun|\bmale\b|ravi|prabhat|hemant|madhur|rishi/i, FEMALE = /female|sobhana|swara|lekha|heera|soumya|veena|neerja/i;
  function isM(v) { return MALE.test(v.name) && !FEMALE.test(v.name); }
  function vscore(v) {
    var n = v.name || '', s = 0;
    if (/natural|neural/i.test(n)) s += 10;
    if (/enhanced|premium|siri/i.test(n)) s += 8;
    if (/online/i.test(n)) s += 6;
    if (/google/i.test(n)) s += 5;
    return s;
  }
  function byLang(l) {
    return window.speechSynthesis ? speechSynthesis.getVoices().filter(function (v) {
      return v.lang.toLowerCase().replace('_', '-').indexOf(l) === 0; }) : [];
  }
  function pick(kind, lang) {
    var vs = lang ? byLang(lang) : byLang('ml');
    if (!vs.length) return null;
    vs = vs.slice().sort(function (a, b) { return vscore(b) - vscore(a) || a.name.localeCompare(b.name); });
    return vs[0];
  }
  window.quranVoice = function (lang) { return pick('ml', lang); };

  /* ---------- Bottom Navigation ---------- */
  (function () {
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

  /* offline service worker */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () {
      var sw = new URL('sw.js', BASE_URL);
      if (sw.origin === location.origin) navigator.serviceWorker.register(sw.pathname, { scope: sw.pathname.replace(/[^\/]*$/, '') }).catch(function () {});
    });
  }
})();
