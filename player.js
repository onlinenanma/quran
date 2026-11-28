/* Shared Qur'an reader engine - loaded by every chapter page.
   Each page only defines its own data (SURAH, VERSES; optional: INTRO, LESSONS, SUGGESTED, QUIZ, AI_ENDPOINT).
   Optional: set window.QURAN_AUDIO_BASE (before this file loads) if your audio/ folder is not next to the pages. */
'use strict';
  const $ = id => document.getElementById(id);
let P_LESSONS = typeof LESSONS !== "undefined" ? LESSONS : "";
let P_SUGGESTED = typeof SUGGESTED !== "undefined" ? SUGGESTED : [];
let P_INTRO = typeof INTRO !== "undefined" ? INTRO : null;   // preface (page may define INTRO, or data/extras/<page>.json "preface")
const escHtml = s => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let P_QUIZ = typeof QUIZ !== "undefined" ? QUIZ : [];
const P_AI_ENDPOINT = typeof AI_ENDPOINT !== "undefined" ? AI_ENDPOINT : "";
const verseOf = n => VERSES.find(v => v.n === n) || {};       // pages may cover a range, e.g. verses 21-40
const isOn = id => { const e = $(id); return !!(e && e.checked); };   // missing box = unticked
const CONT_IDS = ["opt-cont", "cont", "opt-cont-b", "opt-cont-p"];   // banner copy + panel copy (older pages: "cont")
const contBoxes = () => CONT_IDS.map($).filter(Boolean);
const isCont = () => { const b = contBoxes(); return !b.length || b[0].checked; };
  const hasIntro = () => !!P_INTRO;
const introSpeech = () => hasIntro() ? [P_INTRO.title, P_INTRO.sub, P_INTRO.body, P_INTRO.istiMl].filter(Boolean).join(". ") : "";
  /* =====================================================
     SAVED OPTIONS (same key on every chapter page)
     ===================================================== */
  const SKEY = "quran-reader-settings";
  const CHECKS = ["show-in", "show-ar", "show-ml", "show-tf"];       // "opt-wake" is deliberately not saved: the screen-on option starts OFF on every visit
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
              ${P_INTRO.title ? `<div class="intro-title">${P_INTRO.title}</div>` : ""}
              ${P_INTRO.sub ? `<div class="intro-sub">${P_INTRO.sub}</div>` : ""}
              <p class="intro-body">${String(P_INTRO.body || "").replace(/\n/g, "<br>")}</p>
              ${P_INTRO.istiAr ? `<div class="isti">
<div class="isti-ar" translate="no" lang="ar" dir="rtl">${P_INTRO.istiAr}</div>
                <div>${P_INTRO.istiMl || ""}</div>
              </div>` : ""}
            </div>
          </div>
        </div>
      </div>`;
  }

  function buildPage() {
    const wrap = $("verses");
    wrap.innerHTML = (hasIntro() ? introHtml() : "") + VERSES.map(v => `
      <div class="verse" id="verse-${v.n}">
        <div class="vhead"><span>ആയത്ത് ${ayahRef(v.n)}</span><button class="share-btn" type="button" title="\u0d2a\u0d19\u0d4d\u0d15\u0d3f\u0d1f\u0d41\u0d15" aria-label="Share" onclick="shareVerse(${v.n})">${SHARE_ICON}</button></div>

        <div class="item it-ar" id="item-ar-${v.n}">
          <div class="row rtl">
            <button class="play-btn" id="btn-ar-${v.n}" title="Play / Stop" onclick="toggleItem('ar', ${v.n})">▶</button>
            <p class="text ar" translate="no" lang="ar" dir="rtl">${v.ar}</p>
          </div>
        </div>

        ${(v.ml || v.mlT || TR_PENDING) ? `<div class="item it-ml" id="item-ml-${v.n}">
          <div class="row">
            <button class="play-btn" id="btn-ml-${v.n}" title="Play / Stop" onclick="toggleItem('ml', ${v.n})">▶</button>
            <p class="text"><span class="tag">സാരം:</span>${meaningInner(v)}</p>
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
     SHARE a verse (phone share sheet: WhatsApp, Telegram, Facebook, Instagram ...)
     Shares only what is displayed in the card (verse / meaning / explanation) + reference + link to the verse.
     ===================================================== */
  const SHARE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>';

  function ensureShareStyle() {
    try {
      const st = document.createElement("style");
      st.textContent = ".vhead{display:flex;align-items:center;gap:8px}" +
        ".share-btn{margin-left:auto;display:inline-flex;align-items:center;justify-content:center;width:34px;height:30px;padding:0;border-radius:15px;border:1px solid var(--gold);background:transparent;color:var(--green2);cursor:pointer}" +
        ".share-btn svg{width:18px;height:18px}" +
        "@media(prefers-color-scheme:dark){.share-btn{color:var(--gold)}}" +
        ".verse{scroll-margin-top:120px}";
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
  }

  function verseShareText(n) {
    const shown = el => !!el && !el.classList.contains("hidden") && (!el.getClientRects || el.getClientRects().length > 0);
    const textOf = el => {
      const p = el.querySelector(".text"); if (!p) return "";
      const c = p.cloneNode(true);
      c.querySelectorAll(".tag").forEach(x => x.remove());              // drop the small label in front of the meaning
      return (c.textContent || "").replace(/\s+/g, " ").trim();
    };
    const parts = [];
    ["ar", "ml", "tf"].forEach(k => {
      const el = $("item-" + k + "-" + n);
      if (!shown(el)) return;
      let t = textOf(el);
      if (t && k === "ar") t = "\uFD3F " + t + " \uFD3E";
      if (t) parts.push(t);
    });
    if (!parts.length) { const v = verseOf(n); if (v.ar) parts.push("\uFD3F " + v.ar + " \uFD3E"); }   // nothing displayed: share the verse itself
    let name = typeof SURAH_NAME !== "undefined" ? SURAH_NAME : document.title;
    try { const t = window.quranSurahName && window.quranSurahName(SURAH); if (t) name = t; } catch (e) {}   // chosen language (site.js); Malayalam keeps the page's own name
    const ref = name + " " + SURAH + ":" + n;
    const url = location.origin + location.pathname + "#verse-" + n;
    return { ref, text: parts.join("\n\n") + "\n\n\u2014 " + ref + "\n" + url };
  }

  async function shareVerse(n) {
    let s;
    try { s = verseShareText(n); } catch (e) { return; }
    try {
      if (navigator.share) { await navigator.share({ title: s.ref, text: s.text }); return; }
    } catch (e) {
      if (e && e.name === "AbortError") return;           // the person closed the share sheet
    }
    try {                                                  // no share sheet (computer): copy instead
      await navigator.clipboard.writeText(s.text);
      statusEl.textContent = "\u2713";
      setTimeout(() => { if (!activeKey) statusEl.textContent = ""; }, 2000);
    } catch (e) { window.prompt("Copy:", s.text); }
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
    // Button labels: one place for the whole site. site.js sets window.QURAN_LABELS (change them there); these are the defaults.
const QL = () => Object.assign({ listen: "\u0d15\u0d47\u0d7e\u0d15\u0d4d\u0d15\u0d3e\u0d02", stop: "\u25a0 \u0d28\u0d3f\u0d7c\u0d24\u0d4d\u0d24\u0d41\u0d15",
  options: "\u0d13\u0d2a\u0d4d\u0d37\u0d28\u0d41\u0d15\u0d7e" }, window.QURAN_LABELS || {});
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

  const wakeOn = () => { const c = $("opt-wake"); return !!(c && c.checked); };
  const wantWake = () => wakeOn() && (continuous || !!activeKey);

  /* Preface (short surahs): shows the "preface" section with the same look and "show preface" option as 001.html.
     Style rules and the option box are added here, so pages made earlier need no change. */
  const PREFACE_DEFAULT_ON = false;    // true = preface shown (and read first by the Listen button) until a visitor unticks it
  function ensureIntroOption() {
    if (!hasIntro()) return;
    try {
      const st = document.createElement("style");
      st.textContent = `.vhead .small-btn{margin-left:auto;padding:2px 10px;font-size:12px;font-weight:normal}
body.hide-in #intro-wrap{display:none}
.intro-title{font-weight:700;font-size:calc(var(--fs) * 1.2);color:var(--acc)}
.intro-sub{color:var(--muted);font-size:calc(var(--fs) * .85);margin-bottom:6px;font-weight:600}
.intro-body{margin:6px 0 10px;text-align:justify}
.isti{background:var(--soft);border:1px solid var(--gold);border-radius:10px;padding:10px 14px}
.isti-ar{font-size:calc(var(--fs) * 1.4);text-align:right;line-height:2;margin-bottom:4px;color:var(--acc);font-family:"Noto Naskh Arabic","Amiri","Scheherazade New","Geeza Pro","Traditional Arabic",serif}
@media(prefers-color-scheme:dark){.isti-ar{color:var(--ink)}}`;
      (document.head || document.documentElement).appendChild(st);
    } catch (e) {}
    if ($("show-in")) return;
    const show = $("show-ar"); if (!show) return;
    const lab = document.createElement("label"); lab.className = "opt";
    lab.innerHTML = '<input type="checkbox" id="show-in" onchange="applyDisplay()"' + (PREFACE_DEFAULT_ON ? " checked" : "") + '> \u0d2e\u0d41\u0d16\u0d35\u0d41\u0d30';
    const ref = show.closest ? show.closest("label") : null;
    if (ref && ref.parentNode) ref.parentNode.insertBefore(lab, ref); else if ($("panel")) $("panel").appendChild(lab);
  }

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
      '<label class="opt"><input type="checkbox" id="opt-wake"> ' +
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
        if (my !== token) return;
        clearTimeout(killTimer);
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
      if ((v.ml || v.mlT) && (on("show-ml") || is("ml", v.n))) q.push({ kind: "ml", n: v.n });
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
      masterBtn.textContent = QL().stop;
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
    const pn = $("panel"); if (pn) { pn.classList.toggle("open", open); pn.style.display = open ? "block" : "none"; }
    optBtn.textContent = QL().options + (open ? " ▴" : " ▾");
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
/* Browsers (Chrome/Edge, especially with online "Natural" voices) sometimes ignore a single cancel() while a long
   explanation is being spoken. So: detach the utterance handlers, cancel, and keep cancelling briefly until the engine is really silent. */
let killTimer = null;
function killSpeech() {
  const ss = window.speechSynthesis; if (!ss) return;
  try { const u = utterances[0]; if (u) { u.onend = u.onerror = u.onboundary = null; } } catch (e) {}
  try { if (ss.paused) ss.resume(); } catch (e) {}
  try { ss.cancel(); } catch (e) {}
  clearTimeout(killTimer);
  let tries = 0;
  const again = () => {
    if (tries++ >= 12) return;
    let busy = false;
    try { busy = ss.speaking || ss.pending; } catch (e) {}
    if (!busy) return;
    try { ss.pause(); ss.cancel(); } catch (e) {}
    killTimer = setTimeout(again, 120);
  };
  killTimer = setTimeout(again, 60);
}
function stopAll() {
  token++; continuous = false;
  killSpeech();
  sharedAudio.onended = sharedAudio.onerror = null; sharedAudio.pause(); currentAudio = null;
  clearMark();
  masterBtn.textContent = QL().listen; masterBtn.classList.remove("playing"); statusEl.textContent = "";
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
/* ===== LESSONS / QUESTIONS / QUIZ FROM FILE =====
   data/extras/<page>.json  e.g. data/extras/002-1.json (this page only) or data/extras/002.json (whole chapter, used if no page file)
   { "lessons": "text", "questions": [{ "q": "...", "a": "..." }], "quiz": [{ "q": "...", "o": ["..","..",".."], "c": 1, "e": "..." }] }
   Made from your Word files by build_extras.py. When a page has any of these, its "lessons / questions / quiz" box appears.
   Optional: window.QURAN_EXTRAS_BASE = "/other/folder/" before this script. */
const EXTRAS_BASE = (window.QURAN_EXTRAS_BASE || "data/extras/").replace(/\/*$/, "/");
async function fetchJson(url) {
  try {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 3000);
    const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
    clearTimeout(timer);
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}
async function loadExtras() {
  const m = location.pathname.match(/([^\/]+?)(?:\.html?)?$/);
  const keys = [];
  if (m && /^\d{3}(-\d+)?$/.test(m[1])) keys.push(m[1]);
  if (!keys.includes(pad3(SURAH))) keys.push(pad3(SURAH));
  for (const k of keys) {
    const d = await fetchJson(new URL(EXTRAS_BASE + k + ".json", location.href));
    if (!d) continue;
    if (typeof d.lessons === "string" && d.lessons.trim()) P_LESSONS = d.lessons.trim();
    const pf = d.preface;       // preface of a short surah: { title, sub, body }
    if (pf && typeof pf === "object" && typeof pf.body === "string" && pf.body.trim())
      P_INTRO = { title: escHtml(pf.title), sub: escHtml(pf.sub), body: escHtml(pf.body.trim()), istiAr: escHtml(pf.istiAr), istiMl: escHtml(pf.istiMl) };
    if (Array.isArray(d.questions) && d.questions.length) P_SUGGESTED = d.questions.filter(x => x && x.q);
    if (Array.isArray(d.quiz) && d.quiz.length) P_QUIZ = d.quiz.filter(x => x && x.q && Array.isArray(x.o) && x.o.length > 1);
    return;
  }
}

/* ===== TAFSIR FROM FILE =====
   data/tafsir/<surah>.json  ->  { "21": "explanation of verse 21", "22": "..." }   (made from your Word files by build_tafsir.py)
   Text found there fills each verse's explanation; verses without text keep whatever the page has.
   Optional: window.QURAN_TAFSIR_BASE = "/other/folder/" before this script. */
const TAFSIR_BASE = (window.QURAN_TAFSIR_BASE || "data/tafsir/").replace(/\/*$/, "/");
async function loadTafsir() {
  try {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 3000);
    const r = await fetch(new URL(TAFSIR_BASE + pad3(SURAH) + ".json", location.href), ctl ? { signal: ctl.signal } : undefined);
    clearTimeout(timer);
    if (!r.ok) return;
    const m = await r.json();
    const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    VERSES.forEach(v => { const x = m[String(v.n)]; if (typeof x === "string" && x.trim()) v.tf = esc(x.trim()); });
  } catch (e) { /* no file for this chapter yet - fine */ }
}

  
/* =====================================================
   VERSE MEANING IN THE SITE LANGUAGE (from the Qur'an APIs - not Google)
   Malayalam stays as written on the page. For every other language the meaning comes from alquran.cloud
   (one request per chapter) or QuranEnc, the same editions as the quranlearning.app index page.
   Matched by verse number, so 002-1, 002-2 ... all use the same chapter request. Cached in the browser.
   If a language has no edition / the API fails: English (Sahih International); if that fails too, the page's Malayalam meaning stays.
   Arabic site language: no Arabic translation is fetched (the page text is left to the page translator).
   ===================================================== */
const TR_EDITIONS = {
  en: 'en.sahih', ur: 'ur.jalandhry', bn: 'bn.bengali', fr: 'fr.hamidullah', es: 'es.cortes', de: 'de.aburida',
  id: 'id.indonesian', tr: 'tr.ates', ru: 'ru.kuliev', fa: 'fa.ayati', hi: 'hi.hindi', zh: 'zh.jian', ms: 'ms.basmeih',
  ta: 'ta.tamil', ha: 'ha.gumi', sw: 'sw.barwani', so: 'so.abduh', sq: 'sq.ahmeti', az: 'az.mammadaliyev',
  bs: 'bs.korkut', bg: 'bg.theophanov', cs: 'cs.hrabek', nl: 'nl.keyzer', it: 'it.piccardo', ja: 'ja.japanese',
  ko: 'ko.korean', ku: 'ku.asan', no: 'no.berg', pl: 'pl.bielawskiego', pt: 'pt.elhayek', ro: 'ro.grigore',
  sd: 'sd.amrohi', sv: 'sv.bernstrom', tg: 'tg.ayati', th: 'th.thai', tt: 'tt.nugman', ug: 'ug.saleh',
  uz: 'uz.sodik', am: 'am.sadiq'
};
const TR_QURANENC = {
  tl: ['tagalog_rwwad'], vi: ['vietnamese_rwwad'], si: ['sinhalese_mahir'], ps: ['pashto_zakaria'], km: ['khmer_rwwad'],
  yo: ['yoruba_mikail'], om: ['oromo_rwwad', 'oromo_ababor'], te: ['telugu_abdurrahim', 'telugu_muhammad'],
  mr: ['marathi_ansari'], gu: ['gujarati_omari'], kn: ['kannada_bashir', 'kannada_hamza'], as: ['assamese_rafeeq'],
  pa: ['punjabi_arif', 'punjabi_haleem'], ne: ['nepali_central', 'nepali_ahlulhadith'], el: ['greek_rwwad'],
  uk: ['ukrainian_yakubovych'], kk: ['kazakh_altai'], ky: ['kyrgyz_hakimov'], rw: ['kinyarwanda_assoc', 'kinyarwanda_rma']
};
const TR_RTL = new Set(["ur", "fa", "ps", "sd", "ku", "ug", "ar"]);
let TR_INFO = { lang: "", label: "", fallback: false };

function trSiteLang() {                     // same source as site.js: the googtrans cookie (/ml/hi -> hi)
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  let v = m ? m[1] : ""; try { v = decodeURIComponent(v); } catch (e) {}
  const x = v.match(/^\/[^\/]*\/([A-Za-z-]+)/);
  let l = x ? x[1] : "ml";
  if (/^zh/i.test(l)) return "zh";
  l = l.toLowerCase().split("-")[0];
  return l === "ckb" ? "ku" : l === "nb" || l === "nn" ? "no" : l;   // Sorani Kurdish / Norwegian codes used by the page translator
}
let trLastSlot = 0;                         // same pacing as apiFetch on quranlearning.app: ~110 ms between alquran.cloud calls
async function trThrottle(url) {
  if (url.indexOf("api.alquran.cloud") < 0) return;
  const now = Date.now(), slot = Math.max(now, trLastSlot + 110);
  trLastSlot = slot;
  if (slot > now) await new Promise(r => setTimeout(r, slot - now));
}
async function trFetch(url, ms) {           // timeout, plus one retry (after Retry-After on HTTP 429, max 5 s)
  for (let i = 0; i < 2; i++) {
    const ctl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), ms || 6000);
    try {
      await trThrottle(url);
      const r = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
      clearTimeout(timer);
      if (r.ok) return await r.json();
      if (r.status === 404) return null;
      if (r.status === 429) {
        const wait = Math.min(parseInt(r.headers && r.headers.get && r.headers.get("Retry-After"), 10) || 1, 5);
        await new Promise(res => setTimeout(res, wait * 1000));
      }
    } catch (e) { clearTimeout(timer); }
  }
  return null;
}
function trCacheGet(k) { try { const t = localStorage.getItem("qtr1:" + k); return t ? JSON.parse(t) : null; } catch (e) { return null; } }
function trCacheSet(k, o) { try { localStorage.setItem("qtr1:" + k, JSON.stringify(o)); } catch (e) { /* storage full: just skip caching */ } }

async function trFromAlq(edition, expectedLang) {
  const ck = edition + ":" + SURAH, hit = trCacheGet(ck);
  if (hit && Array.isArray(hit.rows) && hit.rows.length) {
    return { map: new Map(hit.rows), label: hit.label };
  }
  const j = await trFetch("https://api.alquran.cloud/v1/surah/" + SURAH + "/" + edition);
  if (!j || j.code !== 200 || !j.data || !Array.isArray(j.data.ayahs)) return null;
  if (expectedLang && j.data.edition && j.data.edition.language && j.data.edition.language !== expectedLang) {
    return null;
  }
  const rows = j.data.ayahs
    .map(a => [a.numberInSurah, String(a.text || "").trim()])
    .filter(r => r[0] && r[1]);
  if (!rows.length) return null;
  const label = (j.data.edition && (j.data.edition.englishName || j.data.edition.name)) || edition;
  trCacheSet(ck, { rows, label });
  return { map: new Map(rows), label };
}
async function trFromQE(key) {
  const ck = key + ":" + SURAH, hit = trCacheGet(ck);
  if (hit) return { map: new Map(hit.rows), label: hit.label };
  const j = await trFetch("https://quranenc.com/api/v1/translation/sura/" + key + "/" + SURAH);
  const list = j ? (Array.isArray(j) ? j : (j.result || [])) : [];
  const rows = list.map(r => [parseInt(r.aya, 10), String(r.translation || "").trim()]).filter(r => r[0] && r[1]);
  if (!rows.length) return null;
  trCacheSet(ck, { rows, label: key });
  return { map: new Map(rows), label: key.replace(/_/g, " ") };
}
async function trGet(lang) {
  if (TR_QURANENC[lang]) {
    for (const key of TR_QURANENC[lang]) { const r = await trFromQE(key); if (r) return r; }
    return null;
  }
  return TR_EDITIONS[lang] ? trFromAlq(TR_EDITIONS[lang], lang) : null;
}
const trNeeded = () => { const l = trSiteLang(); return l !== "ml" && l !== "ar"; };
let TR_PENDING = false;                       // true while the meaning of the site language is being fetched
function meaningInner(v) {                    // what goes after the "സാരം:" label
  if (v.mlT) return `<span class="mtrans notranslate" translate="no" lang="${TR_INFO.lang}"${TR_RTL.has(TR_INFO.lang) ? ' dir="rtl"' : ""}>${v.mlT}</span>`;
  if (TR_PENDING) return '<span class="mtrans notranslate" translate="no">\u2026</span>';    // placeholder: Google must not translate the Malayalam meanwhile
  return v.ml || "";
}
async function loadVerseTranslations() {
  if (!trNeeded()) return;
  const lang = trSiteLang();
  const work = (async () => {
    let r = await trGet(lang), used = lang, fb = false;
    if (!r && lang !== "en") { r = await trGet("en"); used = "en"; fb = true; }
    if (!r) return;
    VERSES.forEach(v => { const t = r.map.get(v.n); if (t) v.mlT = escHtml(t); });
    TR_INFO = { lang: used, label: r.label, fallback: fb };
  })();
  try { await Promise.race([work, new Promise(res => setTimeout(res, 15000))]); } catch (e) { /* the page's own Malayalam meaning stays */ }
}
function applyMeaningTranslations() {          // swap the placeholders for the fetched meanings (or back to Malayalam if nothing came)
  TR_PENDING = false;
  VERSES.forEach(v => {
    const row = $("item-ml-" + v.n); if (!row) return;
    if (!v.ml && !v.mlT) { row.remove(); return; }
    const p = row.querySelector(".text");
    if (p) p.innerHTML = '<span class="tag">\u0d38\u0d3e\u0d30\u0d02:</span>' + meaningInner(v);
  });
  showTranslationCredit();
  applyDisplay();
}
function showTranslationCredit() {
  if ($("tr-credit")) $("tr-credit").remove();
  if (!TR_INFO.lang || !VERSES.some(v => v.mlT)) return;
  if (!$("tr-style")) {
    const st = document.createElement("style"); st.id = "tr-style";
    st.textContent = '.mtrans[dir="rtl"]{display:block;text-align:right}.tr-credit{max-width:1000px;margin:-6px auto 14px;font-size:12px;color:var(--muted);text-align:center}';
    document.head.appendChild(st);
  }
  const d = document.createElement("div");
  d.id = "tr-credit"; d.className = "tr-credit notranslate"; d.setAttribute("translate", "no");
  d.textContent = "Meaning: " + TR_INFO.label + " \u00B7 " + (TR_QURANENC[TR_INFO.lang] ? "QuranEnc" : "alquran.cloud") +
    (TR_INFO.fallback ? " \u00B7 (no translation for your language yet \u2013 English shown)" : "");
  $("verses").insertAdjacentElement("afterend", d);
}


/* =====================================================
   OPTIONS PANEL LABELS in the chosen language (all 61 languages of the language picker).
   A language without an entry: the panel is left to the page translator. Rows are recognised by their controls, not by their words.
   ===================================================== */
const PLAYER_DICT = {
    "ml": {
      intro: "മുഖവുര",
      screen: "സ്ക്രീൻ:",
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
      intro: "Preface",
      screen: "Screen:",
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
      intro: "प्रस्तावना",
      screen: "स्क्रीन:",
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
      intro: "முன்னுரை",
      screen: "திரை:",
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
      intro: "ముందుమాట",
      screen: "స్క్రీన్:",
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
      intro: "ಮುನ್ನುಡಿ",
      screen: "ಸ್ಕ್ರೀನ್:",
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
      intro: "مقدمة",
      screen: "الشاشة:",
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
    },
    "mr": { intro: "प्रस्तावना", screen: "स्क्रीन:", fontSize: "अक्षर आकार:", show: "दाखवा:", verse: "आयत", meaning: "अर्थ", tafsir: "विवरण", reciter: "क़ारी:", repeat: "आयत पुनरावृत्ती:", continuous: "सतत चालवा", wake: "स्क्रीन चालू ठेवा" },
    "gu": { intro: "પ્રસ્તાવના", screen: "સ્ક્રીન:", fontSize: "અક્ષર કદ:", show: "બતાવો:", verse: "આયત", meaning: "અર્થ", tafsir: "વિવરણ", reciter: "કારી:", repeat: "આયત પુનરાવર્તન:", continuous: "સતત ચલાવો", wake: "સ્ક્રીન ચાલુ રાખો" },
    "pa": { intro: "ਭੂਮਿਕਾ", screen: "ਸਕ੍ਰੀਨ:", fontSize: "ਅੱਖਰ ਆਕਾਰ:", show: "ਦਿਖਾਓ:", verse: "ਆਇਤ", meaning: "ਅਰਥ", tafsir: "ਵਿਆਖਿਆ", reciter: "ਕਾਰੀ:", repeat: "ਆਇਤ ਦੁਹਰਾਓ:", continuous: "ਲਗਾਤਾਰ ਚਲਾਓ", wake: "ਸਕ੍ਰੀਨ ਚਾਲੂ ਰੱਖੋ" },
    "bn": { intro: "ভূমিকা", screen: "স্ক্রিন:", fontSize: "ফন্টের আকার:", show: "দেখান:", verse: "আয়াত", meaning: "অর্থ", tafsir: "তাফসীর", reciter: "ক্বারী:", repeat: "আয়াত পুনরাবৃত্তি:", continuous: "একটানা চালান", wake: "স্ক্রিন চালু রাখুন" },
    "ur": { intro: "تمہید", screen: "اسکرین:", fontSize: "فونٹ کا سائز:", show: "دکھائیں:", verse: "آیت", meaning: "ترجمہ", tafsir: "تفسیر", reciter: "قاری:", repeat: "آیت کی تکرار:", continuous: "مسلسل چلائیں", wake: "اسکرین آن رکھیں" },
    "ne": { intro: "भूमिका", screen: "स्क्रिन:", fontSize: "फन्ट साइज:", show: "देखाउनुहोस्:", verse: "आयत", meaning: "अर्थ", tafsir: "व्याख्या", reciter: "क़ारी:", repeat: "आयत दोहोर्‍याउने:", continuous: "निरन्तर बजाउनुहोस्", wake: "स्क्रिन अन राख्नुहोस्" },
    "si": { intro: "ප්‍රස්තාවනාව", screen: "තිරය:", fontSize: "අකුරු ප්‍රමාණය:", show: "පෙන්වන්න:", verse: "ආයත්", meaning: "අර්ථය", tafsir: "විග්‍රහය", reciter: "කාරී:", repeat: "ආයත් නැවත:", continuous: "අඛණ්ඩව වාදනය කරන්න", wake: "තිරය ක්‍රියාත්මකව තබන්න" },
    "fa": { intro: "مقدمه", screen: "صفحه‌نمایش:", fontSize: "اندازه قلم:", show: "نمایش:", verse: "آیه", meaning: "ترجمه", tafsir: "تفسیر", reciter: "قاری:", repeat: "تکرار آیه:", continuous: "پخش پیوسته", wake: "روشن نگه داشتن صفحه" },
    "tr": { intro: "Önsöz", screen: "Ekran:", fontSize: "Yazı Boyutu:", show: "Göster:", verse: "Ayet", meaning: "Meal", tafsir: "Tefsir", reciter: "Okuyan:", repeat: "Ayet Tekrarı:", continuous: "Sürekli Oynat", wake: "Ekranı Açık Tut" },
    "id": { intro: "Pendahuluan", screen: "Layar:", fontSize: "Ukuran Huruf:", show: "Tampilkan:", verse: "Ayat", meaning: "Arti", tafsir: "Tafsir", reciter: "Qari:", repeat: "Ulangi Ayat:", continuous: "Putar Terus-menerus", wake: "Biarkan Layar Menyala" },
    "ms": { intro: "Pendahuluan", screen: "Skrin:", fontSize: "Saiz Fon:", show: "Papar:", verse: "Ayat", meaning: "Maksud", tafsir: "Tafsir", reciter: "Qari:", repeat: "Ulang Ayat:", continuous: "Main Berterusan", wake: "Kekalkan Skrin Hidup" },
    "th": { intro: "คำนำ", screen: "หน้าจอ:", fontSize: "ขนาดตัวอักษร:", show: "แสดง:", verse: "อายะฮ์", meaning: "ความหมาย", tafsir: "คำอธิบาย", reciter: "ผู้อ่าน:", repeat: "อ่านอายะฮ์ซ้ำ:", continuous: "เล่นต่อเนื่อง", wake: "เปิดหน้าจอไว้" },
    "vi": { intro: "Lời nói đầu", screen: "Màn hình:", fontSize: "Cỡ chữ:", show: "Hiển thị:", verse: "Câu", meaning: "Nghĩa", tafsir: "Giải thích", reciter: "Người đọc:", repeat: "Lặp lại câu:", continuous: "Phát liên tục", wake: "Giữ màn hình sáng" },
    "zh": { intro: "前言", screen: "屏幕：", fontSize: "字体大小：", show: "显示：", verse: "经文", meaning: "释义", tafsir: "注释", reciter: "诵读者：", repeat: "经文重复：", continuous: "连续播放", wake: "保持屏幕常亮" },
    "zh-TW": { intro: "前言", screen: "螢幕：", fontSize: "字體大小：", show: "顯示：", verse: "經文", meaning: "釋義", tafsir: "註釋", reciter: "誦讀者：", repeat: "經文重複：", continuous: "連續播放", wake: "保持螢幕常亮" },
    "ja": { intro: "はじめに", screen: "画面：", fontSize: "文字サイズ：", show: "表示：", verse: "節", meaning: "意味", tafsir: "解説", reciter: "朗誦者：", repeat: "節の繰り返し：", continuous: "連続再生", wake: "画面をオンにしておく" },
    "ko": { intro: "머리말", screen: "화면:", fontSize: "글자 크기:", show: "표시:", verse: "구절", meaning: "뜻", tafsir: "해설", reciter: "낭송자:", repeat: "구절 반복:", continuous: "연속 재생", wake: "화면 켜 두기" },
    "fr": { intro: "Préface", screen: "Écran :", fontSize: "Taille de police :", show: "Afficher :", verse: "Verset", meaning: "Sens", tafsir: "Tafsir", reciter: "Récitateur :", repeat: "Répéter le verset :", continuous: "Lecture continue", wake: "Garder l'écran allumé" },
    "de": { intro: "Vorwort", screen: "Bildschirm:", fontSize: "Schriftgröße:", show: "Anzeigen:", verse: "Vers", meaning: "Bedeutung", tafsir: "Tafsir", reciter: "Rezitator:", repeat: "Vers wiederholen:", continuous: "Fortlaufend abspielen", wake: "Bildschirm anlassen" },
    "es": { intro: "Prefacio", screen: "Pantalla:", fontSize: "Tamaño de letra:", show: "Mostrar:", verse: "Versículo", meaning: "Significado", tafsir: "Tafsir", reciter: "Recitador:", repeat: "Repetir versículo:", continuous: "Reproducción continua", wake: "Mantener pantalla encendida" },
    "pt": { intro: "Prefácio", screen: "Tela:", fontSize: "Tamanho da fonte:", show: "Mostrar:", verse: "Versículo", meaning: "Significado", tafsir: "Tafsir", reciter: "Recitador:", repeat: "Repetir versículo:", continuous: "Reprodução contínua", wake: "Manter a tela ligada" },
    "it": { intro: "Prefazione", screen: "Schermo:", fontSize: "Dimensione carattere:", show: "Mostra:", verse: "Versetto", meaning: "Significato", tafsir: "Tafsir", reciter: "Recitatore:", repeat: "Ripeti versetto:", continuous: "Riproduzione continua", wake: "Mantieni schermo acceso" },
    "ru": { intro: "Предисловие", screen: "Экран:", fontSize: "Размер шрифта:", show: "Показать:", verse: "Аят", meaning: "Смысл", tafsir: "Тафсир", reciter: "Чтец:", repeat: "Повтор аята:", continuous: "Непрерывное воспроизведение", wake: "Не выключать экран" },
    "nl": { intro: "Voorwoord", screen: "Scherm:", fontSize: "Lettergrootte:", show: "Tonen:", verse: "Vers", meaning: "Betekenis", tafsir: "Tafsir", reciter: "Reciteur:", repeat: "Vers herhalen:", continuous: "Doorlopend afspelen", wake: "Scherm aanhouden" },
    "pl": { intro: "Przedmowa", screen: "Ekran:", fontSize: "Rozmiar czcionki:", show: "Pokaż:", verse: "Werset", meaning: "Znaczenie", tafsir: "Tafsir", reciter: "Recytator:", repeat: "Powtarzaj werset:", continuous: "Odtwarzaj ciągle", wake: "Nie wygaszaj ekranu" },
    "uk": { intro: "Передмова", screen: "Екран:", fontSize: "Розмір шрифту:", show: "Показати:", verse: "Аят", meaning: "Значення", tafsir: "Тафсір", reciter: "Чтець:", repeat: "Повтор аяту:", continuous: "Безперервне відтворення", wake: "Не вимикати екран" },
    "sv": { intro: "Förord", screen: "Skärm:", fontSize: "Teckenstorlek:", show: "Visa:", verse: "Vers", meaning: "Betydelse", tafsir: "Tafsir", reciter: "Reciterare:", repeat: "Upprepa vers:", continuous: "Spela kontinuerligt", wake: "Behåll skärmen på" },
    "el": { intro: "Πρόλογος", screen: "Οθόνη:", fontSize: "Μέγεθος γραμματοσειράς:", show: "Εμφάνιση:", verse: "Στίχος", meaning: "Σημασία", tafsir: "Ερμηνεία", reciter: "Αναγνώστης:", repeat: "Επανάληψη στίχου:", continuous: "Συνεχής αναπαραγωγή", wake: "Διατήρηση οθόνης αναμμένης" },
    "ro": { intro: "Prefață", screen: "Ecran:", fontSize: "Mărime font:", show: "Afișează:", verse: "Verset", meaning: "Înțeles", tafsir: "Tafsir", reciter: "Recitator:", repeat: "Repetă versetul:", continuous: "Redare continuă", wake: "Păstrează ecranul aprins" },
    "sw": { intro: "Dibaji", screen: "Skrini:", fontSize: "Ukubwa wa Herufi:", show: "Onyesha:", verse: "Aya", meaning: "Maana", tafsir: "Tafsiri", reciter: "Msomaji:", repeat: "Rudia Aya:", continuous: "Cheza Mfululizo", wake: "Washa Skrini Daima" },
    "am": { intro: "መቅድም", screen: "ማያ ገጽ:", fontSize: "የፊደል መጠን:", show: "አሳይ:", verse: "አያ", meaning: "ትርጉም", tafsir: "ተፍሲር", reciter: "አንባቢ:", repeat: "አያ መድገም:", continuous: "ያለማቋረጥ አጫውት", wake: "ማያ ገጹን ክፍት አድርግ" },
    "ha": { intro: "Gabatarwa", screen: "Allo:", fontSize: "Girman Rubutu:", show: "Nuna:", verse: "Aya", meaning: "Ma'ana", tafsir: "Tafsiri", reciter: "Mai karatu:", repeat: "Maimaita Aya:", continuous: "Kunna a Jere", wake: "Bar Allo a Kunne" },
    "so": { intro: "Hordhac", screen: "Shaashadda:", fontSize: "Cabbirka Far:", show: "Muuji:", verse: "Aayad", meaning: "Macnaha", tafsir: "Tafsiir", reciter: "Akhriyaha:", repeat: "Ku celi Aayadda:", continuous: "Sii wad ciyaarista", wake: "Shaashadda ha shidnaato" },
    "sq": { intro: "Parathënie", screen: "Ekrani:", fontSize: "Madhësia e shkronjave:", show: "Shfaq:", verse: "Ajeti", meaning: "Kuptimi", tafsir: "Tefsiri", reciter: "Recituesi:", repeat: "Përsërit ajetin:", continuous: "Luaj pa ndërprerje", wake: "Mbaje ekranin ndezur" },
    "az": { intro: "Ön söz", screen: "Ekran:", fontSize: "Şrift ölçüsü:", show: "Göstər:", verse: "Ayə", meaning: "Mənası", tafsir: "Təfsir", reciter: "Qari:", repeat: "Ayəni təkrarla:", continuous: "Fasiləsiz oxut", wake: "Ekranı açıq saxla" },
    "bs": { intro: "Predgovor", screen: "Ekran:", fontSize: "Veličina fonta:", show: "Prikaži:", verse: "Ajet", meaning: "Značenje", tafsir: "Tefsir", reciter: "Učač:", repeat: "Ponovi ajet:", continuous: "Neprekidno reproduciraj", wake: "Ostavi ekran uključen" },
    "bg": { intro: "Предговор", screen: "Екран:", fontSize: "Размер на шрифта:", show: "Показване:", verse: "Аят", meaning: "Значение", tafsir: "Тафсир", reciter: "Четец:", repeat: "Повтаряне на аята:", continuous: "Непрекъснато възпроизвеждане", wake: "Запази екрана включен" },
    "cs": { intro: "Předmluva", screen: "Obrazovka:", fontSize: "Velikost písma:", show: "Zobrazit:", verse: "Verš", meaning: "Význam", tafsir: "Tafsír", reciter: "Recitátor:", repeat: "Opakovat verš:", continuous: "Přehrávat nepřetržitě", wake: "Ponechat obrazovku zapnutou" },
    "ku": { intro: "پێشەکی", screen: "شاشە:", fontSize: "قەبارەی فۆنت:", show: "پیشاندان:", verse: "ئایەت", meaning: "واتا", tafsir: "تەفسیر", reciter: "قورئانخوێن:", repeat: "دووبارەکردنەوەی ئایەت:", continuous: "بەردەوام لێبدە", wake: "شاشە هەڵکراو بهێڵەرەوە" },
    "no": { intro: "Forord", screen: "Skjerm:", fontSize: "Skriftstørrelse:", show: "Vis:", verse: "Vers", meaning: "Betydning", tafsir: "Tafsir", reciter: "Resitator:", repeat: "Gjenta vers:", continuous: "Spill av kontinuerlig", wake: "Hold skjermen på" },
    "sd": { intro: "تمهيد", screen: "اسڪرين:", fontSize: "فونٽ جي سائيز:", show: "ڏيکاريو:", verse: "آيت", meaning: "ترجمو", tafsir: "تفسير", reciter: "قاري:", repeat: "آيت ورجاءِ:", continuous: "لڳاتار هلايو", wake: "اسڪرين آن رکو" },
    "tg": { intro: "Пешгуфтор", screen: "Экран:", fontSize: "Андозаи ҳарф:", show: "Нишон диҳед:", verse: "Оят", meaning: "Маъно", tafsir: "Тафсир", reciter: "Қорӣ:", repeat: "Такрори оят:", continuous: "Пайваста пахш кунед", wake: "Экранро фурӯзон нигоҳ доред" },
    "tt": { intro: "Кереш сүз", screen: "Экран:", fontSize: "Хәреф зурлыгы:", show: "Күрсәтү:", verse: "Аять", meaning: "Мәгънә", tafsir: "Тәфсир", reciter: "Кыйраәтче:", repeat: "Аятьне кабатлау:", continuous: "Өзлексез уйнату", wake: "Экранны кабыза тоту" },
    "ug": { intro: "مۇقەددىمە", screen: "ئېكران:", fontSize: "خەت چوڭلۇقى:", show: "كۆرسەت:", verse: "ئايەت", meaning: "مەنىسى", tafsir: "تەپسىر", reciter: "قارى:", repeat: "ئايەت تەكرارلاش:", continuous: "ئۈزلۈكسىز قويۇش", wake: "ئېكراننى ئوچۇق تۇتۇش" },
    "uz": { intro: "Muqaddima", screen: "Ekran:", fontSize: "Shrift o'lchami:", show: "Ko'rsatish:", verse: "Oyat", meaning: "Ma'nosi", tafsir: "Tafsir", reciter: "Qori:", repeat: "Oyatni takrorlash:", continuous: "Uzluksiz ijro", wake: "Ekranni yoniq tutish" },
    "tl": { intro: "Paunang Salita", screen: "Screen:", fontSize: "Laki ng Font:", show: "Ipakita:", verse: "Ayah", meaning: "Kahulugan", tafsir: "Tafsir", reciter: "Mambabasa:", repeat: "Ulitin ang Ayah:", continuous: "Patuloy na I-play", wake: "Panatilihing Bukas ang Screen" },
    "ps": { intro: "سریزه", screen: "پرده:", fontSize: "د فونټ اندازه:", show: "ښودل:", verse: "آیت", meaning: "ژباړه", tafsir: "تفسیر", reciter: "قاري:", repeat: "د آیت تکرار:", continuous: "ورپسې غږول", wake: "پرده روښانه وساتئ" },
    "km": { intro: "បុព្វកថា", screen: "អេក្រង់:", fontSize: "ទំហំអក្សរ:", show: "បង្ហាញ:", verse: "អាយ៉ាត់", meaning: "អត្ថន័យ", tafsir: "អត្ថាធិប្បាយ", reciter: "អ្នកសូត្រ:", repeat: "ធ្វើម្ដងទៀតអាយ៉ាត់:", continuous: "លេងបន្តបន្ទាប់", wake: "ទុកអេក្រង់បើក" },
    "yo": { intro: "Ọ̀rọ̀ Ìṣáájú", screen: "Ojú Ìfihàn:", fontSize: "Ìwọ̀n Lẹ́tà:", show: "Ṣàfihàn:", verse: "Ayah", meaning: "Ìtumọ̀", tafsir: "Àlàyé", reciter: "Olùkàwé:", repeat: "Tún Ayah Ṣe:", continuous: "Ṣeré Láìdúró", wake: "Jẹ́ kí Ojú Ìfihàn Wà Ní Títàn" },
    "om": { intro: "Seensa", screen: "Iskiriinii:", fontSize: "Hamma Barreeffamaa:", show: "Agarsiisi:", verse: "Aayata", meaning: "Hiika", tafsir: "Tafsiira", reciter: "Qaari'aa:", repeat: "Aayata irra deebi'i:", continuous: "Itti fufiinsaan taphachiisi", wake: "Iskiriinii banaa eegi" },
    "as": { intro: "মুখবন্ধ", screen: "স্ক্ৰীণ:", fontSize: "আখৰৰ আকাৰ:", show: "দেখুৱাওক:", verse: "আয়াত", meaning: "অৰ্থ", tafsir: "তাফসীৰ", reciter: "ক্বাৰী:", repeat: "আয়াত পুনৰাবৃত্তি:", continuous: "অবিৰতভাৱে বজাওক", wake: "স্ক্ৰীণ অন ৰাখক" },
    "kk": { intro: "Алғы сөз", screen: "Экран:", fontSize: "Қаріп өлшемі:", show: "Көрсету:", verse: "Аят", meaning: "Мағынасы", tafsir: "Тәпсір", reciter: "Қари:", repeat: "Аятты қайталау:", continuous: "Үздіксіз ойнату", wake: "Экранды қосулы ұстау" },
    "ky": { intro: "Баш сөз", screen: "Экран:", fontSize: "Арип өлчөмү:", show: "Көрсөтүү:", verse: "Аят", meaning: "Мааниси", tafsir: "Тапсир", reciter: "Кары:", repeat: "Аятты қайталоо:", continuous: "Үзгүлтүксүз ойнотуу", wake: "Экранды күйүк кармоо" },
    "rw": { intro: "Ijambo ry'ibanze", screen: "Ecran:", fontSize: "Ingano y'inyuguti:", show: "Erekana:", verse: "Aya", meaning: "Ibisobanuro", tafsir: "Isobanuro", reciter: "Usoma:", repeat: "Subiramo Aya:", continuous: "Kina bikomeza", wake: "Komeza ecran irabagirana" }
  };


function applyPanelLabels() {
  const panel = $("panel"); if (!panel) return;
  let dk = trSiteLang();
  if (dk === "zh" && /zh-TW/i.test(document.cookie)) dk = "zh-TW";       // Traditional Chinese has its own entry
  const d = PLAYER_DICT[dk];
  if (!d) { panel.classList.remove("notranslate"); panel.removeAttribute("translate"); return; }
  panel.classList.add("notranslate"); panel.setAttribute("translate", "no");
  panel.querySelectorAll(".ctl-title").forEach(el => {
    const row = el.closest(".ctl-row") || el.parentNode;
    const role = row.querySelector("#reciter") ? "reciter" : row.querySelector("#repeat") ? "repeat"
      : row.querySelector("#fs-label") ? "fontSize" : row.querySelector("#show-ar,#show-ml,#show-tf,#show-in") ? "show"
      : row.querySelector("#opt-wake") ? "screen" : "";
    if (role && d[role] && el.textContent !== d[role]) el.textContent = d[role];
  });
  const map = { "show-in": "intro", "show-ar": "verse", "show-ml": "meaning", "show-tf": "tafsir", "opt-wake": "wake",
                "cont": "continuous", "opt-cont": "continuous", "opt-cont-b": "continuous", "opt-cont-p": "continuous" };
  Object.keys(map).forEach(id => {
    const inp = $(id), key = d[map[id]]; if (!inp || !key) return;
    const lab = inp.closest("label"); if (!lab) return;
    let done = false;
    Array.prototype.slice.call(lab.childNodes).forEach(n => {
      if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
      if (!done) { n.nodeValue = " " + key; done = true; } else n.nodeValue = "";
    });
    if (!done) lab.appendChild(document.createTextNode(" " + key));
  });
}

/* =====================================================
     START
     ===================================================== */
function startPage() {
  TR_PENDING = trNeeded();
  buildPage();
  initReciters();
  ensureShareStyle();
  ensureIntroOption();
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
  const wk = $("opt-wake"); if (wk) wk.checked = false;       // screen-on option starts OFF
  updateWake();
  applyPanelLabels();

  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();   // Chrome loads voices asynchronously
    if (IS_EDGE) document.addEventListener("pointerdown", warmVoices, { passive: true });
  }
  // range pages (e.g. verses 21-40): the static bismillah heading only belongs on pages that start at verse 1
  const bismiDiv = $("bismi-container");
  if (bismiDiv && !(VERSES.length && VERSES[0].n === 1) && SURAH !== 1 && SURAH !== 9 && bismiDiv.remove) bismiDiv.remove();
  if (/^#verse-\d+$/.test(location.hash)) {                 // a shared link opens at that verse
    const el = $(location.hash.slice(1));
    if (el && el.scrollIntoView) setTimeout(() => el.scrollIntoView({ block: "start" }), 150);
  }
}
Promise.all([loadTafsir(), loadExtras()]).then(() => {
  startPage();                                                  // the verses appear immediately ...
  if (TR_PENDING) loadVerseTranslations().then(applyMeaningTranslations).catch(applyMeaningTranslations);   // ... the meaning in the site language follows
});
window.addEventListener("load", () => { try { applyPanelLabels(); } catch (e) {} });
