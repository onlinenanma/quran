/* Shared Qur'an reader engine - loaded by every chapter page.
   Each page only defines its own data (SURAH, VERSES; optional: INTRO, LESSONS, SUGGESTED, QUIZ, AI_ENDPOINT).
   Optional: set window.QURAN_AUDIO_BASE (before this file loads) if your audio/ folder is not next to the pages. */
'use strict';
  const $ = id => document.getElementById(id);
const P_LESSONS = typeof LESSONS !== "undefined" ? LESSONS : "";
const P_SUGGESTED = typeof SUGGESTED !== "undefined" ? SUGGESTED : [];
const P_QUIZ = typeof QUIZ !== "undefined" ? QUIZ : [];
const P_AI_ENDPOINT = typeof AI_ENDPOINT !== "undefined" ? AI_ENDPOINT : "";
const verseOf = n => VERSES.find(v => v.n === n) || {};       // pages may cover a range, e.g. verses 21-40
const isOn = id => { const e = $(id); return !!(e && e.checked); };   // missing box = unticked
const CONT_IDS = ["opt-cont", "cont", "opt-cont-b", "opt-cont-p"];   // banner copy + panel copy (older pages: "cont")
const contBoxes = () => CONT_IDS.map($).filter(Boolean);
const isCont = () => { const b = contBoxes(); return !b.length || b[0].checked; };
  const hasIntro = () => typeof INTRO !== "undefined";
const introSpeech = () => hasIntro() ? [INTRO.title, INTRO.sub, INTRO.body, INTRO.istiMl].join(". ") : "";
  /* =====================================================
     SAVED OPTIONS (same key on every chapter page)
     ===================================================== */
  const SKEY = "quran-reader-settings";
  const CHECKS = ["show-in", "show-ar", "show-ml", "show-tf", "opt-wake"];
  const checkIds = () => CHECKS.filter(id => $(id));

  function loadSettings() { try { return JSON.parse(localStorage.getItem(SKEY)) || {}; } catch (e) { return {}; } }
  function saveSettings() {
    const s = Object.assign(loadSettings(), { fontSize, reciterId, repeat: $("repeat").value });
    checkIds().forEach(id => s[id] = $(id).checked);
    s.contPlay = isCont();
    try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {}
  }
  function applySettings() {
    const s = loadSettings();
    if (s.fontSize) {
      fontSize = s.fontSize;
      document.documentElement.style.setProperty("--fs", fontSize + "px");
      $("fs-label").textContent = fontSize;
    }
    checkIds().forEach(id => { if (id in s) $(id).checked = s[id]; });
    if ("contPlay" in s) contBoxes().forEach(b => { b.checked = !!s.contPlay; });
    if (s.repeat) $("repeat").value = s.repeat;
  }

  /* =====================================================
     RECITERS (Arabic recitation audio, files named 001001.mp3 ...)
     ===================================================== */
  const RECITERS = [
    { id: "ghamdy",   name: "സഅദ് അൽ ഗാമിദി",
      base: "https://everyayah.com/data/Ghamadi_40kbps" },
    { id: "ayyoub",   name: "മുഹമ്മദ് അയ്യൂബ്",
      base: "https://everyayah.com/data/Muhammad_Ayyoub_64kbps" },
    { id: "bafsar",   name: "അബ്ദുല്ല ബസ്ഫർ",
      base: "https://everyayah.com/data/Abdullah_Basfar_64kbps" },
    { id: "hudhaify", name: "അലി ഹുദൈഫി",
      base: "https://everyayah.com/data/Hudhaify_64kbps" },
    { id: "muaiqly",  name: "മാഹിർ അൽ മുഅയ്ഖ്\u200cലി",
      base: "https://everyayah.com/data/Maher_AlMuaiqly_64kbps" },
    { id: "alili",    name: "അസീസ് അലീലി",
      base: "https://everyayah.com/data/aziz_alili_128kbps" }
  ];

  let reciterId = "ghamdy";
  const currentReciter = () => RECITERS.find(r => r.id === reciterId) || RECITERS[0];
  const reciterReady = r => !!r.base;
  const pad3 = n => String(n).padStart(3, "0");
  const ayahRef = n => SURAH + ": " + pad3(n);          // e.g. "1: 001"

  function audioUrl(n) {
    return currentReciter().base.replace(/\/*$/, "/") + pad3(SURAH) + pad3(n) + ".mp3";
  }

  function changeReciter(id) { reciterId = id; saveSettings(); }

  function initReciters() {
    const sel = $("reciter");
    sel.innerHTML = RECITERS.map(r => {
      const ok = reciterReady(r);
      return `<option value="${r.id}" ${ok ? "" : "disabled"}>${r.name}${ok ? "" : " (ഓഡിയോ ചേർത്തിട്ടില്ല)"}</option>`;
    }).join("");
    const saved = loadSettings().reciterId;
    const start = RECITERS.find(r => r.id === saved && reciterReady(r)) || RECITERS.find(reciterReady) || RECITERS[0];
    reciterId = start.id;
    sel.value = start.id;
  }

  const KIND_NAME = { in: "മുഖവുര", ar: "ആയത്ത്", ml: "സാരം", tf: "വിവരണം" };

  /* =====================================================
     BUILD THE PAGE
     ===================================================== */
  function introHtml() {
    return `
      <div class="verse" id="intro-wrap">
        <div class="vhead"><span>മുഖവുര</span><button class="small-btn open" id="tgl-in" onclick="toggleIntro()">മുഖവുര മറയ്ക്കുക</button></div>
        <div class="item" id="item-in-0">
          <div class="row">
            <button class="play-btn" id="btn-in-0" title="Play / Stop" onclick="toggleItem('in', 0)">▶</button>
            <div class="text">
              <div class="intro-title">${INTRO.title}</div>
              <div class="intro-sub">${INTRO.sub}</div>
              <p class="intro-body">${INTRO.body}</p>
              <div class="isti">
<div class="isti-ar" translate="no" lang="ar" dir="rtl">${INTRO.istiAr}</div>    
                <div>${INTRO.istiMl}</div>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  function buildPage() {
    const wrap = $("verses");
    wrap.innerHTML = (hasIntro() ? introHtml() : "") + VERSES.map(v => `
      <div class="verse" id="verse-${v.n}">
        <div class="vhead"><span>ആയത്ത് ${ayahRef(v.n)}</span></div>

        <div class="item it-ar" id="item-ar-${v.n}">
          <div class="row rtl">
            <button class="play-btn" id="btn-ar-${v.n}" title="Play / Stop" onclick="toggleItem('ar', ${v.n})">▶</button>
            <p class="text ar" translate="no" lang="ar" dir="rtl">${v.ar}</p>
          </div>
        </div>

        ${v.ml ? `<div class="item it-ml" id="item-ml-${v.n}">
          <div class="row">
            <button class="play-btn" id="btn-ml-${v.n}" title="Play / Stop" onclick="toggleItem('ml', ${v.n})">▶</button>
            <p class="text"><span class="tag">സാരം:</span>${v.ml}</p>
          </div>
        </div>` : ""}

        ${v.tf ? `
        <button class="small-btn tf-btn" id="tgl-${v.n}" onclick="toggleTafseer(${v.n})">വിവരണം</button>
        <div class="item it-tf hidden" id="item-tf-${v.n}">
          <div class="row">
            <button class="play-btn" id="btn-tf-${v.n}" title="Play / Stop" onclick="toggleItem('tf', ${v.n})">▶</button>
            <p class="text"><span class="pl">${v.tf}</span></p>
          </div>
        </div>` : ""}
      </div>
    `).join("");
  }

  /* =====================================================
     FONT SIZE
     ===================================================== */
  let fontSize = 18;
  function changeFont(delta) {
    fontSize = Math.min(40, Math.max(12, fontSize + delta));
    document.documentElement.style.setProperty("--fs", fontSize + "px");
    $("fs-label").textContent = fontSize;
    saveSettings();
  }

  /* =====================================================
     SHOW / HIDE  (the "കാണിക്കുക" boxes decide what is shown AND what is played)
     ===================================================== */
  function setIntroVisible(show) {
    if (!$("item-in-0")) return;
    $("item-in-0").classList.toggle("hidden", !show);
    const btn = $("tgl-in");
    btn.classList.toggle("open", show);
    btn.textContent = show ? "മുഖവുര മറയ്ക്കുക" : "മുഖവുര കാണിക്കുക";
  }

  function toggleIntro() {
    const willShow = $("item-in-0").classList.contains("hidden");
    if (!willShow && activeKey === "in-0") stopAll();
    setIntroVisible(willShow);
  }

  function setTafseerVisible(n, show) {
    const block = $("item-tf-" + n);
    const btn = $("tgl-" + n);
    if (!block) return;
    block.classList.toggle("hidden", !show);
    btn.classList.toggle("open", show);
  }

  function toggleTafseer(n) {
    const block = $("item-tf-" + n);
    const willShow = block.classList.contains("hidden");
    if (!willShow && activeKey === "tf-" + n) stopAll();
    setTafseerVisible(n, willShow);
  }

  function applyDisplay() {
    const on = isOn;
    document.body.classList.toggle("hide-in", !on("show-in"));
    document.body.classList.toggle("hide-ar", !on("show-ar"));
    document.body.classList.toggle("hide-ml", !on("show-ml"));
    document.body.classList.toggle("hide-tf", !on("show-tf"));
    if (activeKey && !on("show-" + activeKey.split("-")[0])) stopAll();   // what is playing was just hidden
    VERSES.forEach(v => { if (v.tf) setTafseerVisible(v.n, on("show-tf")); });
  }

  /* =====================================================
     PLAYBACK STATE
     ===================================================== */
  const statusEl = $("status");
  const masterBtn = $("master");
  const MASTER_TEXT = "▶ കേൾക്കാം";
  const OPT_TEXT = "⚙ ഓപ്ഷനുകൾ";
  let token = 0;
  let activeKey = null;
  let currentAudio = null;
  let continuous = false;
  let curLabel = "";
  let curKind = "ml";
  const utterances = [];

  /* ---------- Keep the screen on (option in the panel, default ON, only while playing) ----------
     Wake Lock API (needs HTTPS) + a tiny muted video as backup for browsers without it. */
  let wakeLock = null, waking = false;
  let nsVideo = null, nsTimer = null, nsCanvas = null;

  const wakeOn = () => { const c = $("opt-wake"); return !c || c.checked; };
  const wantWake = () => wakeOn() && (continuous || !!activeKey);

  function ensureBanner() {           // same single-line banner on every page: [options] [play]
    try {
      const m = $("master"), o = $("opt-toggle");
      if (!m || !o || !m.parentNode) return;
      const row = m.parentNode, old = o.parentNode;
      if (old !== row) {
        row.insertBefore(o, m);
        if (old && old.classList && old.classList.contains("banner-row") && !old.children.length && old.remove) old.remove();
      }
      const st = document.createElement("style");
      st.textContent =
        ".banner-row{flex-wrap:nowrap!important;gap:6px!important;justify-content:center}" +
        ".banner-row .opt{font-size:12px!important;white-space:nowrap;gap:3px}" +
        ".banner-row .opt input{width:15px;height:15px}" +
        ".banner-row .opt-btn,.banner-row .main-btn{padding:4px 9px!important;font-size:12.5px!important;flex:0 1 auto;min-width:0}" +
        "@media(max-width:380px){.banner-row .opt{font-size:11px!important}.banner-row .opt-btn,.banner-row .main-btn{padding:4px 7px!important;font-size:11.5px!important}}";
      (document.head || document.documentElement).appendChild(st);
    } catch (e) { /* cosmetic only */ }
  }

  function ensureContOption() {       // continuous-play box lives ONLY in the options panel; the banner keeps just 2 buttons
    const inside = (el, sel) => !!(el && el.closest && el.closest(sel));
    contBoxes().filter(b => inside(b, ".banner")).forEach(b => {      // older pages: drop the copy left in the banner
      const l = (b.closest && b.closest("label")) || b;
      if (l.remove) l.remove();
    });
    const panel = $("panel");
    if (panel && !contBoxes().some(b => inside(b, "#panel"))) {
      const l = document.createElement("label"); l.className = "opt";
      l.innerHTML = '<input type="checkbox" id="opt-cont-p" checked> ' + "\u0D24\u0D41\u0D1F\u0D7C\u0D1A\u0D4D\u0D1A\u0D2F\u0D3E\u0D2F\u0D3F \u0D15\u0D47\u0D7E\u0D15\u0D4D\u0D15\u0D3E\u0D02";
      const show = $("show-ar"), row = show && show.closest ? show.closest(".ctl-row") : null;
      (row || panel).appendChild(l);
    }
    contBoxes().forEach(b => b.addEventListener("change", () => { contBoxes().forEach(x => { x.checked = b.checked; }); saveSettings(); }));
  }

  function ensureWakeOption() {      // adds the checkbox to the options panel of every page automatically
    if ($("opt-wake")) return;
    const panel = $("panel"); if (!panel) return;
    const row = document.createElement("div");
    row.className = "ctl-row";
    row.innerHTML = '<span class="ctl-title">\u0D38\u0D4D\u0D15\u0D4D\u0D30\u0D40\u0D7B:</span>' +
      '<label class="opt"><input type="checkbox" id="opt-wake" checked> ' +
      '\u0D2A\u0D4D\u0D32\u0D47 \u0D1A\u0D46\u0D2F\u0D4D\u0D2F\u0D41\u0D2E\u0D4D\u0D2A\u0D4B\u0D7E \u0D38\u0D4D\u0D15\u0D4D\u0D30\u0D40\u0D7B \u0D13\u0D2B\u0D4D \u0D06\u0D15\u0D30\u0D41\u0D24\u0D4D</label>';
    panel.appendChild(row);
  }


  function startNoSleep() {
    try {
      if (nsVideo) { const q = nsVideo.play(); if (q && q.catch) q.catch(() => {}); return; }
      if (!HTMLCanvasElement.prototype.captureStream) return;
      nsCanvas = document.createElement("canvas");
      nsCanvas.width = 16; nsCanvas.height = 16;
      const ctx = nsCanvas.getContext("2d");
      let t = 0;
      const draw = () => { ctx.fillStyle = (t++ % 2) ? "#000000" : "#010101"; ctx.fillRect(0, 0, 16, 16); };
      draw();
      nsTimer = setInterval(draw, 500);
      const v = document.createElement("video");
      v.setAttribute("playsinline", "");
      v.setAttribute("muted", "");
      v.muted = true;
      v.loop = true;
      v.style.cssText = "position:fixed;bottom:0;right:0;width:8px;height:8px;opacity:0.05;pointer-events:none;";
      v.srcObject = nsCanvas.captureStream(5);
      v.addEventListener("pause", () => { if (nsVideo === v && document.visibilityState === "visible") v.play().catch(() => {}); });
      document.body.appendChild(v);
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
      nsVideo = v;
    } catch (e) {}
  }

  function stopNoSleep() {
    try {
      if (nsTimer) { clearInterval(nsTimer); nsTimer = null; }
      if (nsVideo) { const v = nsVideo; nsVideo = null; v.pause(); v.srcObject = null; v.remove(); }
    } catch (e) {}
  }

  function releaseWake() {
    stopNoSleep();
    if (wakeLock) { const w = wakeLock; wakeLock = null; try { w.release().catch(() => {}); } catch (e) {} }
  }
  function updateWake() { if (wantWake()) requestWake(); else releaseWake(); }

  async function requestWake() {
    if (!wantWake() || waking || wakeLock) return;
    waking = true;
    try {
      if ("wakeLock" in navigator) {
        try {
          const w = await navigator.wakeLock.request("screen");
          wakeLock = w;
          w.addEventListener("release", () => {
            if (wakeLock === w) wakeLock = null;
            if (document.visibilityState === "visible") setTimeout(requestWake, 300);
          });
          stopNoSleep();
        } catch (e) {}
      }
      if (!wakeLock) startNoSleep();
    } finally {
      waking = false;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") requestWake();
  });
  ["pointerdown", "touchstart", "click", "keydown"].forEach(ev =>
    document.addEventListener(ev, () => requestWake(), { passive: true }));

  setInterval(() => {
    if (!wantWake()) return;
    if (!wakeLock) requestWake();
    if (nsVideo && nsVideo.paused) { const p = nsVideo.play(); if (p && p.catch) p.catch(() => {}); }
  }, 5000);

  /* ---------- Lock-screen info / controls ---------- */
  function setMediaSession(label) {
    if (!("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: label, artist: currentReciter().name, album: "സൂറത്തുൽ ഫാതിഹ"
      });
      navigator.mediaSession.setActionHandler("pause", () => stopAll());
      navigator.mediaSession.setActionHandler("stop", () => stopAll());
    } catch (e) {}
  }

  function mark(key) {
    clearMark();
    activeKey = key;
    const btn = $("btn-" + key);
    const item = $("item-" + key);
    if (btn) { btn.textContent = "■"; btn.classList.add("playing"); }
    if (item) {
      item.classList.add("reading");
      if (continuous) item.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function clearMark() {
    if (!activeKey) return;
    const btn = $("btn-" + activeKey);
    const item = $("item-" + activeKey);
    if (btn) { btn.textContent = "▶"; btn.classList.remove("playing"); }
    if (item) item.classList.remove("reading");
    activeKey = null;
  }


  function fail(my, msg) {
    if (my !== token) return;
    stopAll();
    statusEl.textContent = msg;
  }


  /* =====================================================
     MALAYALAM: text to speech
     Best available Malayalam voices are chosen automatically:
     one for the meaning (സാരം), a different one for the explanation (വിവരണം).
     ===================================================== */
  const MALE_HINT   = /midhun|\bmale\b|ravi|prabhat|hemant|madhur/i;
  const FEMALE_HINT = /female|sobhana|swara|lekha|heera|soumya/i;

  function cleanForSpeech(text) {
    return text
      .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, " ")
      .replace(/[()\u2018\u2019\u201C\u201D"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitText(text, max = 120) {
    const sentences = text.match(/[^.,:;!?।]+[.,:;!?।]*/g) || [text];
    const chunks = [];
    let cur = "";
    for (let s of sentences) {
      s = s.trim();
      while (s.length > max) {
        let cut = s.lastIndexOf(" ", max);
        if (cut <= 0) cut = max;
        if (cur) { chunks.push(cur); cur = ""; }
        chunks.push(s.slice(0, cut).trim());
        s = s.slice(cut).trim();
      }
      if (!s) continue;
      if (cur && (cur + " " + s).length > max) { chunks.push(cur); cur = s; }
      else { cur = cur ? cur + " " + s : s; }
    }
    if (cur) chunks.push(cur);
    return chunks.filter(c => /[^\s.,:;!?।]/.test(c));
  }


  /* Chunks are spoken ONE AT A TIME (the next is queued only when the previous ends).
     Queuing a whole long explanation at once made the browser hang; a per-chunk
     watchdog also skips a chunk if the engine stalls. */
  function speakMalayalam(text, my, done) {
    const langCode = curLang;
    const chunks = splitText(cleanForSpeech(text));
    if (!chunks.length) { done(); return; }
    waitForNatural(2500, () => { if (my === token) speakChunks(chunks, langCode, my, done); });
  }

  function speakChunks(chunks, langCode, my, done) {
    const found = voiceProfile(curKind);
    if (!found) {
      statusEl.textContent = curLabel + " · no Malayalam voice found, using online voice...";
      playChunks(chunks, langCode, my, done);
      return;
    }

    setTimeout(() => {
      if (my !== token) return;
      statusEl.textContent = curLabel + " · " + found.voice.name;
      let i = 0, failed = false;

      const next = () => {
        if (my !== token || failed) return;
        if (i >= chunks.length) { done(); return; }
        const idx = i++;
        const u = new SpeechSynthesisUtterance(chunks[idx]);
        u.voice = found.voice;
        u.lang = found.voice.lang;
        u.pitch = found.pitch;
        u.rate = found.rate;
        let settled = false;
        const advance = () => { if (settled) return; settled = true; clearTimeout(guard); next(); };
        const guard = setTimeout(() => {
          if (my !== token || settled) return;
          window.speechSynthesis.cancel();
          advance();
        }, 5000 + chunks[idx].length * 250);

        u.onend = advance;
        u.onerror = (e) => {
          if (my !== token || settled || failed) return;
          if (e.error === "canceled" || e.error === "interrupted") return;
          settled = true; failed = true; clearTimeout(guard);
          window.speechSynthesis.cancel();
          statusEl.textContent = "Browser voice failed (" + e.error + "), trying online voice...";
          playChunks(chunks, langCode, my, done, idx);
        };
        utterances[0] = u;                      // keep a reference so it is not garbage-collected
        window.speechSynthesis.speak(u);
      };
      next();
    }, 100);
  }

  /* =====================================================
     PLAYLIST
     Order: introduction, then for each verse: ayah, meaning, explanation.
     Only parts ticked in "കാണിക്കുക" are included.
     ===================================================== */
  // `force` = the item the user tapped: it is always in the queue, even when its
  // "show" box is unticked (intro / explanation are unticked by default), so playback continues from it.
  function buildQueue(force) {
    const on = isOn;
    const is = (k, n) => force && force.kind === k && force.n === n;
    const q = [];
    if (hasIntro() && (on("show-in") || is("in", 0))) q.push({ kind: "in", n: 0 });
    VERSES.forEach(v => {
      if (on("show-ar") || is("ar", v.n)) q.push({ kind: "ar", n: v.n });
      if (v.ml && (on("show-ml") || is("ml", v.n))) q.push({ kind: "ml", n: v.n });
      if ((on("show-tf") || is("tf", v.n)) && v.tf) q.push({ kind: "tf", n: v.n });
    });
    return q;
  }

  // Opening recitation: a'udhu once before the first verse when playing from the start (master button);
  // bismillah right before verse 1 (not in surah 1, where verse 1 is the bismillah, nor surah 9).
  function addOpening(q, master) {
    const out = []; let aud = false;
    q.forEach(it => {
      if (it.kind === "ar") {
        if (master && !aud) { out.push({ kind: "aud", n: 0 }); aud = true; }
        if (it.n === 1 && SURAH !== 1 && SURAH !== 9) out.push({ kind: "bm", n: 0 });
      }
      out.push(it);
    });
    return out;
  }

  // Play queue[start...]; cont = true keeps going to the next items, false stops after the first
  function runQueue(queue, start, cont) {
    stopAll();
    primeAudio();
    setPanel(false);
    continuous = cont;
    const my = token;
    if (cont) {
      masterBtn.textContent = "■ നിർത്തുക";
      masterBtn.classList.add("playing");
    }
    const step = i => {
      if (my !== token) return;
      if (i >= queue.length) {
        stopAll();
        if (cont) statusEl.textContent = "പൂർത്തിയായി.";
        return;
      }
      const { kind, n } = queue[i];
      if (kind === "tf") setTafseerVisible(n, true);
      if (kind === "in") setIntroVisible(true);
      let key = kind + "-" + n;
      if (kind === "aud" || kind === "bm") {            // highlight the verse the opening belongs to
        const nx = queue.slice(i + 1).find(x => x.kind === "ar"); if (nx) key = "ar-" + nx.n;
      }
      mark(key);
      playItem(kind, n, my, () => { if (my === token) step(i + 1); });
    };
    step(start);
  }

  // Round button next to each item: play it (and carry on to the following items if "തുടർച്ചയായി" is ticked)
  function toggleItem(kind, n) {
    if (activeKey === kind + "-" + n) { stopAll(); return; }
    if (isCont()) {
      const q = addOpening(buildQueue({ kind, n }), false);
      let idx = q.findIndex(x => x.kind === kind && x.n === n);
      if (idx > 0 && q[idx - 1].kind === "bm") idx--;      // starting at verse 1: bismillah first
      if (idx >= 0) { runQueue(q, idx, true); return; }
    }
    runQueue(addOpening([{ kind, n }], false), 0, false);
  }

  // Main button: start from the beginning / stop
  function toggleContinuous() {
    if (continuous || activeKey) { stopAll(); return; }
    const q0 = buildQueue();
    if (!q0.length) {
      statusEl.textContent = "‘കാണിക്കുക’ എന്നതിൽ ഒന്നെങ്കിലും തിരഞ്ഞെടുക്കുക. (⚙ ഓപ്ഷനുകൾ)";
      return;
    }
    runQueue(addOpening(q0, true), 0, true);
  }

  /* =====================================================
     OPTIONS PANEL
     ===================================================== */
  const controlsEl = $("controls");
  const optBtn = $("opt-toggle");

  function setPanel(open) {
    controlsEl.classList.toggle("open", open);
    optBtn.classList.toggle("open", open);
    optBtn.textContent = OPT_TEXT + (open ? " ▴" : " ▾");
  }
  function togglePanel(e) {
    e.stopPropagation();
    setPanel(!controlsEl.classList.contains("open"));
  }
  document.addEventListener("pointerdown", e => {
    if (!controlsEl.contains(e.target)) setPanel(false);
  });

  /* =====================================================
     P_LESSONS SUMMARY, QUESTIONS (AI) AND P_QUIZ
     ===================================================== */
  const AI_RULE = "Answer in Malayalam, only from the text below. Be short and clear.\n\n";
  const pageText = () => VERSES.map(v => `ആയത്ത് ${v.n}: ${v.ml}\n${v.tf || ""}`).join("\n\n");
  const cleanJson = t => t.replace(/```json|```/g, "").trim();

  async function askAI(prompt) {
    const res = await fetch(P_AI_ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error(res.status);
    return (await res.json()).text;
  }

  function renderQuestions(list) {
    if (!$("q-list")) return;
    $("q-list").innerHTML = "";
    list.forEach(q => {
      const b = document.createElement("button");
      b.className = "q-btn"; b.textContent = q;
      b.onclick = () => answerQuestion(q);
      $("q-list").appendChild(b);
    });
  }

  async function showSummary() {
    const out = $("ai-summary");
    if (!P_AI_ENDPOINT) { out.textContent = P_LESSONS; return; }
    out.textContent = "⏳ ...";
    try {
      out.textContent = await askAI(AI_RULE + "Summarise the key lessons of this page in 5-7 short numbered points.\n\n" + pageText());
      const qs = JSON.parse(cleanJson(await askAI(AI_RULE +
        "Return ONLY a JSON array of 5 short Malayalam questions a learner may ask about this page.\n\n" + pageText())));
      if (Array.isArray(qs) && qs.length) renderQuestions(qs);
    } catch (e) { out.textContent = P_LESSONS; }
  }





async function answerQuestion(q) {
  const out = $("ai-answer"), hit = P_SUGGESTED.find(x => x.q === q);
  
  // ചോദ്യത്തിന് തൊട്ടടുത്തുള്ള ഉത്തരമറിയാൻ ഡിവിഷൻ കണ്ടെത്തുകയോ ഉണ്ടാക്കുകയോ ചെയ്യുക
  let ansContainer = $("inline-answer-" + CSS.escape(q));
  if (!ansContainer) {
    // നിലവിലുള്ള ചോദ്യത്തിന്റെ ബട്ടൺ കണ്ടെത്തി അതിന് താഴെ ഉത്തരം കാണിക്കാനായി പുതിയ എലമെന്റ് ഉണ്ടാക്കുന്നു
    const buttons = document.querySelectorAll(".q-btn");
    let targetBtn = Array.from(buttons).find(b => b.textContent === q);
    if (targetBtn) {
      ansContainer = document.createElement("div");
      ansContainer.id = "inline-answer-" + CSS.escape(q);
      ansContainer.style.cssText = "margin: 6px 0 12px 0; padding: 10px 12px; background: var(--paper); border-left: 3px solid var(--gold); border-radius: 4px; font-size: var(--fs); line-height: 1.7;";
      targetBtn.parentNode.insertBefore(ansContainer, targetBtn.nextSibling);
    } else {
      ansContainer = out; // ലഭ്യമല്ലെങ്കിൽ സാധാരണ ഔട്ട്പുട്ട് ബോക്സ് ഉപയോഗിക്കുക
    }
  }

  ansContainer.innerHTML = "<strong>ഉത്തരം:</strong> ⏳ ചിന്തിക്കുന്നു...";
  
  if (!P_AI_ENDPOINT) {
    ansContainer.innerHTML = `<strong>ഉത്തരം:</strong> ${hit ? hit.a : "സ്വന്തം ചോദ്യങ്ങൾക്ക് ഉത്തരം ലഭിക്കാൻ AI സെർവർ (AI_ENDPOINT) ബന്ധിപ്പിക്കണം."}`;
    return;
  }
  
  try { 
    const resText = await askAI(AI_RULE + "Question: " + q + "\n\n" + pageText());
    ansContainer.innerHTML = `<strong>ഉത്തരം:</strong> ${resText}`;
  }
  catch (e) { 
    ansContainer.innerHTML = `<strong>ഉത്തരം:</strong> ${hit ? hit.a : "ക്ഷമിക്കണം, ഉത്തരം ലഭ്യമായില്ല."}`; 
  }
}
function askCustom() { const q = $("ai-q").value.trim(); if (q) answerQuestion(q); }

  async function startQuiz() {
    let qs = P_QUIZ;
    if (AI_ENDPOINT) {
      $("quiz").textContent = "⏳ ...";
      try {
        const r = JSON.parse(cleanJson(await askAI(AI_RULE +
          'Return ONLY a JSON array of 5 multiple-choice questions in Malayalam: [{"q":"","o":["","","",""],"c":0,"e":""}] where c is the index of the correct option.\n\n' + pageText())));
        if (Array.isArray(r) && r.length) qs = r;
      } catch (e) {}
    }
    renderQuiz(qs);
  }

  function renderQuiz(qs) {
    let score = 0, answered = 0;
    const box = $("quiz"); box.innerHTML = "";
    qs.forEach((q, qi) => {
      const d = document.createElement("div"); d.className = "quiz-q";
      d.innerHTML = `<p>${qi + 1}. ${q.q}</p>`;
      q.o.forEach((t, oi) => {
        const b = document.createElement("button"); b.className = "quiz-opt"; b.textContent = t;
        b.onclick = () => {
          if (d.dataset.done) return;
          d.dataset.done = 1; answered++;
          d.querySelectorAll(".quiz-opt")[q.c].classList.add("right");
          if (oi === q.c) score++; else b.classList.add("wrong");
          if (q.e) { const e = document.createElement("div"); e.className = "quiz-exp"; e.textContent = q.e; d.appendChild(e); }
          if (answered === qs.length) res.textContent = `🎉 സ്കോർ: ${score} / ${qs.length}`;
        };
        d.appendChild(b);
      });
      box.appendChild(d);
    });
    const res = document.createElement("div"); res.className = "ai-out"; box.appendChild(res);
  }

  /* ===== PATCH: shared audio + follow page translation ===== */
const sharedAudio = new Audio();
let curLang = "ml";

function silentWavUrl() {
  const n = 800, b = new DataView(new ArrayBuffer(44 + n)), w = (o, s) => [...s].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); b.setUint32(4, 36 + n, true); w(8, "WAVEfmt "); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
  b.setUint32(24, 8000, true); b.setUint32(28, 8000, true); b.setUint16(32, 1, true); b.setUint16(34, 8, true); w(36, "data"); b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
}
const SILENT = silentWavUrl();
// Unlocks the shared <audio> element during the user's tap so later verses can start on their own.
function primeAudio() { try { sharedAudio.src = SILENT; sharedAudio.play().catch(() => {}); } catch (e) {} }
function mlVoices() {   // voices for the language being spoken (name kept so the picker still works)
  const vs = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  return vs.filter(v => v.lang.toLowerCase().replace("_", "-").startsWith(curLang));
}
function stopAll() {
  token++; continuous = false;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  sharedAudio.onended = sharedAudio.onerror = null; sharedAudio.pause(); currentAudio = null;
  clearMark();
  masterBtn.textContent = MASTER_TEXT; masterBtn.classList.remove("playing"); statusEl.textContent = "";
  releaseWake();
}
function playArabic(n, my, done) {
  if (my !== token) return;
  const a = sharedAudio, r = currentReciter();
  a.onended = () => { if (my === token) done(); };
  a.onerror = () => fail(my, r.name + " – ആയത്ത് " + ayahRef(n) + ": ഓഡിയോ ലോഡ് ചെയ്യാനായില്ല.");
  a.preservesPitch = true; a.playbackRate = 1; a.src = audioUrl(n); currentAudio = a;
  a.play().catch(e => {
    if (my !== token || (e && (e.name === "NotSupportedError" || e.name === "AbortError"))) return;
    fail(my, "Could not play audio. Tap the button again.");
  });
}
/* a'udhu / bismillah in the selected reciter's voice (EveryAyah): audhubillah.mp3, bismillah.mp3 (or verse 1 of surah 1).
   If a file is missing the next source is tried, and if none plays the opening is simply skipped. */
function playSpecial(kind, my, done) {
  const base = currentReciter().base.replace(/\/*$/, "/");
  const urls = kind === "aud"
    ? [base + "audhubillah.mp3", "https://everyayah.com/data/Alafasy_128kbps/audhubillah.mp3"]
    : [base + "bismillah.mp3", base + "001001.mp3"];
  statusEl.textContent = (kind === "aud" ? "\u0623\u0639\u0648\u0630 \u0628\u0627\u0644\u0644\u0647 \u0645\u0646 \u0627\u0644\u0634\u064A\u0637\u0627\u0646 \u0627\u0644\u0631\u062C\u064A\u0645"
    : "\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645") + " \u00B7 " + currentReciter().name;
  const a = sharedAudio; currentAudio = a;
  const tryAt = i => {
    if (my !== token) return;
    if (i >= urls.length) { done(); return; }
    let used = false;
    const next = () => { if (used || my !== token) return; used = true; tryAt(i + 1); };
    a.onended = () => { if (my === token && !used) { used = true; done(); } };
    a.onerror = next;
    a.preservesPitch = true; a.playbackRate = 1; a.src = urls[i];
    a.play().catch(e => { if (my !== token || (e && e.name === "AbortError")) return; next(); });
  };
  tryAt(0);
}
function playChunks(chunks, langCode, my, done, i = 0) {   // online fallback voice
  if (my !== token) return;
  if (i >= chunks.length) { done(); return; }
  statusEl.textContent = curLabel + " · online voice " + (i + 1) + " / " + chunks.length;
  const a = sharedAudio;
  a.onended = () => playChunks(chunks, langCode, my, done, i + 1);
  a.onerror = () => fail(my, "Online voice is blocked or offline. Try Edge, or Chrome on Android with the language's voice installed.");
  a.preservesPitch = false; a.src = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=" + langCode + "&q=" + encodeURIComponent(chunks[i]);
  a.playbackRate = curKind === "tf" ? 0.78 : 0.92; currentAudio = a;
  a.play().catch(() => fail(my, "Could not play audio. Tap the button again."));
}
  /* ===== PATCH 2: detect translation per item ===== */
/* ===== RECORDED MEANING AUDIO =====
   Files: <AUDIO_BASE>/001/001001-ml.mp3 and <AUDIO_BASE>/001/manifest.json ({ "001001-ml": { "h": "hash" } }).
   The hash is added as ?v=hash so a re-recorded file is fetched again. No file -> browser voice as before. */
const AUDIO_BASE = (window.QURAN_AUDIO_BASE || "audio/").replace(/\/*$/, "/");
const manifestCache = {};
function meaningManifest() {
  const key = pad3(SURAH);
  if (!manifestCache[key]) {
    manifestCache[key] = fetch(new URL(AUDIO_BASE + key + "/manifest.json", location.href))
      .then(r => (r.ok ? r.json() : {}))      // no manifest -> no recorded audio for this surah
      .catch(() => null);                     // network error -> unknown, still try the file
  }
  return manifestCache[key];
}
async function meaningFileUrl(n, kind) {
  const m = await meaningManifest();
  const id = pad3(SURAH) + pad3(n) + "-" + (kind || "ml");
  if (m && !m[id]) return null;
  const u = new URL(AUDIO_BASE + pad3(SURAH) + "/" + id + ".mp3", location.href);
  if (m && m[id] && m[id].h) u.searchParams.set("v", m[id].h);
  return u.href;
}
function playMeaningFile(n, my, done, fallback, kind) {
  meaningFileUrl(n, kind).then(url => {
    if (my !== token) return;
    if (!url) { fallback(); return; }
    const a = sharedAudio;
    let used = false;
    const fb = () => { if (used || my !== token) return; used = true; a.onended = a.onerror = null; fallback(); };
    a.onended = () => { if (my === token && !used) { used = true; done(); } };
    a.onerror = fb;
    a.preservesPitch = true; a.playbackRate = 1; a.src = url; currentAudio = a;
    statusEl.textContent = curLabel + " \u00B7 recorded audio";
    a.play().catch(e => { if (my !== token || (e && e.name === "AbortError")) return; fb(); });
  }).catch(() => { if (my === token) fallback(); });
}

function shownText(kind, n) {
  const sel = kind === "in" ? "#item-in-0 .text" : "#item-" + kind + "-" + n + (kind === "tf" ? " .pl" : " .text");
  const el = document.querySelector(sel); if (!el) return "";
  const c = el.cloneNode(true); c.querySelectorAll(".tag,.isti-ar").forEach(x => x.remove());
  return c.textContent.replace(/\s+/g, " ").trim();
}
function targetLang(text) {
  const h = (document.documentElement.lang || "").toLowerCase().split("-")[0];
  if (h && h !== "ml") return h;
  const g = document.cookie.match(/googtrans=\/[^/]*\/([a-z-]+)/i); if (g) return g[1].toLowerCase().split("-")[0];
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
  const nl = (navigator.language || "en").toLowerCase().split("-")[0];
  return nl === "ml" ? "en" : nl;
}
function playItem(kind, n, my, done) {
  if (kind === "aud" || kind === "bm") { requestWake(); playSpecial(kind, my, done); return; }
  requestWake();
  curKind = kind === "tf" ? "tf" : "ml";
  curLabel = kind === "in" ? KIND_NAME.in : "ആയത്ത് " + ayahRef(n) + " – " + KIND_NAME[kind];
  statusEl.textContent = curLabel; setMediaSession(curLabel);
  if (kind === "ar") {
    const total = +$("repeat").value || 1;
    const loop = k => {
      if (my !== token) return;
      statusEl.textContent = curLabel + " · " + currentReciter().name + (total > 1 ? " · ആവർത്തനം " + k + "/" + total : "");
      playArabic(n, my, () => (k < total ? loop(k + 1) : done()));
    };
    loop(1); return;
  }
  const shown = shownText(kind, n);
  const mlChars = (shown.match(/[\u0D00-\u0D7F]/g) || []).length;
  const translated = shown.length > 0 && mlChars / shown.length < 0.2;   // mostly not Malayalam any more
  curLang = translated ? targetLang(shown) : "ml";
  const original = kind === "in" ? introSpeech() : (kind === "ml" ? (verseOf(n).ml || "") : (verseOf(n).tf || ""));
  if ((kind === "ml" || kind === "tf") && !translated) {
    playMeaningFile(n, my, done, () => speakMalayalam(original, my, done), kind);
    return;
  }
  speakMalayalam(translated ? shown : original, my, done);
}
  /* ===== VOICE FIX: prefer natural voices, no pitch change on them ===== */
const NATURAL = /natural|neural|enhanced|premium|online/i;
const isFemale = v => FEMALE_HINT.test(v.name);
const isMale = v => MALE_HINT.test(v.name) && !FEMALE_HINT.test(v.name);
function rankedVoices() {
  return mlVoices().sort((a, b) =>
    (NATURAL.test(b.name) - NATURAL.test(a.name)) || ((!b.localService) - (!a.localService)) || a.name.localeCompare(b.name));
}
function resolveVoice(kind) {
  const vs = rankedVoices(); if (!vs.length) return null;
  const s = loadSettings(), saved = vs.find(v => v.name === (kind === "tf" ? s.voiceTf : s.voiceMl));
  if (saved) return saved;                          // a voice you picked earlier still wins
  const ml = vs.find(isMale) || vs[0];              // meaning: Midhun if present
  if (kind !== "tf") return ml;
  return vs.find(v => v !== ml && isFemale(v)) || vs.find(v => v !== ml) || ml;   // explanation: a different voice (Sobhana)
}
function voiceProfile(kind) {
  const v = resolveVoice(kind); if (!v) return null;
  const same = resolveVoice("ml") === resolveVoice("tf");
  return { voice: v, pitch: kind === "tf" && same ? 0.75 : 1, rate: kind === "tf" ? 0.85 : 0.95 };
}
/* ===== EDGE NATURAL VOICES =====
   Edge lists its online "Natural" voices late - often only after Read Aloud has been used once. We ask for the
   list as early as we can (silent utterance on the first tap) and, in Edge, wait up to 2.5 s once for a Natural
   voice before falling back to the system voice. */
const IS_EDGE = /\bEdg(e|A|iOS)?\//.test(navigator.userAgent || "");
let voiceGaveUp = false, voiceWarmed = false;
const hasNatural = () => mlVoices().some(v => NATURAL.test(v.name));
function warmVoices() {
  try { window.speechSynthesis.getVoices(); } catch (e) {}
  if (voiceWarmed) return;
  voiceWarmed = true;
  try {
    const u = new SpeechSynthesisUtterance(" "); u.volume = 0; u.lang = curLang === "ml" ? "ml-IN" : curLang;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
function waitForNatural(ms, cb) {
  if (!window.speechSynthesis || !IS_EDGE || voiceGaveUp || hasNatural()) { cb(); return; }
  warmVoices();
  const t0 = Date.now();
  const tick = () => {
    if (hasNatural()) { cb(); return; }
    if (Date.now() - t0 > ms) { voiceGaveUp = true; cb(); return; }
    setTimeout(tick, 150);
  };
  tick();
}
  /* =====================================================
     START
     ===================================================== */
  buildPage();
  initReciters();
  ensureBanner();
  ensureContOption();
  ensureWakeOption();
  applySettings();
  applyDisplay();
  checkIds().forEach(id => $(id).addEventListener("change", saveSettings));
  $("opt-wake").addEventListener("change", updateWake);
  const askBox = document.querySelector(".ai-ask");
  if (askBox) askBox.style.display = P_AI_ENDPOINT ? "" : "none";
  if ($("ai-box")) $("ai-box").hidden = !P_LESSONS && !P_SUGGESTED.length && !P_QUIZ.length && !P_AI_ENDPOINT;
  renderQuestions(P_SUGGESTED.map(x => x.q));
  updateWake();

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();   // Chrome loads voices asynchronously
    if (IS_EDGE) document.addEventListener("pointerdown", warmVoices, { passive: true });
  }
  // range pages (e.g. verses 21-40): the static bismillah heading only belongs on pages that start at verse 1
  const bismiDiv = $("bismi-container");
  if (bismiDiv && !(VERSES.length && VERSES[0].n === 1) && SURAH !== 1 && SURAH !== 9 && bismiDiv.remove) bismiDiv.remove();
