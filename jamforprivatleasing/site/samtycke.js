// Jämföra Privatleasing – kakor, samtycke och mätning.
//
// SÅ HÄR SLÅR DU PÅ MÄTNING OCH ANNONSER: fyll i dina ID:n nedan. Tomt = avstängt.
// Så länge alla är tomma laddas ingenting och ingen kakruta visas (då finns inget att samtycka till).
// Inget laddas förrän besökaren har sagt ja i kakrutan – det kräver lagen (LEK och GDPR).
const SPARNING = {
  GA4: "G-LX38W0PK9Q",            // Google Analytics 4, t.ex. "G-AB12CD34EF"        (analytics.google.com)
  GOOGLE_ADS: "",     // Google Ads, t.ex. "AW-123456789"                (ads.google.com) – för annonser mot tidigare besökare
  META_PIXEL: "",     // Meta-pixel (Facebook/Instagram), t.ex. "123456789012345"
  TIKTOK_PIXEL: "",   // TikTok-pixel, t.ex. "C4ABCDEF12345"
  ADSENSE: "",        // Google AdSense, t.ex. "ca-pub-1234567890123456" – annonser PÅ sidan
  GOOGLE_CMP: false   // Sätt true när du har slagit på Googles egen samtyckesruta i AdSense ("Sekretess och meddelanden").
                      // Google kräver sin certifierade ruta för personliga annonser i EU. Då visas inte vår ruta.
};

(function () {
  const NYCKEL = "jp_samtycke", GILTIG_DAGAR = 365;
  const harStat = !!SPARNING.GA4, harAnnons = !!(SPARNING.GOOGLE_ADS || SPARNING.META_PIXEL || SPARNING.TIKTOK_PIXEL || SPARNING.ADSENSE);
  const demo = /[?&]kakdemo=1/.test(location.search);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  // Google Consent Mode v2: allt nekat tills besökaren säger ja
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500 });

  function las() {
    try { const s = JSON.parse(localStorage.getItem(NYCKEL) || "null"); return s && Date.now() - s.t < GILTIG_DAGAR * 864e5 ? s : null; } catch (e) { return null; }
  }
  function spara(stat, annons) {
    const s = { stat: !!stat, annons: !!annons, t: Date.now(), v: 1 };
    try { localStorage.setItem(NYCKEL, JSON.stringify(s)); } catch (e) {}
    return s;
  }
  function skript(src, attr) { const s = document.createElement("script"); s.async = true; s.src = src; Object.assign(s, attr || {}); document.head.appendChild(s); }
  let laddat = {};
  function tillampa(s) {
    gtag("consent", "update", { analytics_storage: s.stat ? "granted" : "denied", ad_storage: s.annons ? "granted" : "denied", ad_user_data: s.annons ? "granted" : "denied", ad_personalization: s.annons ? "granted" : "denied" });
    const gid = (s.stat && SPARNING.GA4) || (s.annons && SPARNING.GOOGLE_ADS);
    if (gid && !laddat.g) { laddat.g = 1; skript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gid)); gtag("js", new Date()); }
    if (s.stat && SPARNING.GA4 && !laddat.ga) { laddat.ga = 1; gtag("config", SPARNING.GA4); }
    if (s.annons && SPARNING.GOOGLE_ADS && !laddat.aw) { laddat.aw = 1; gtag("config", SPARNING.GOOGLE_ADS); }
    if (s.annons && SPARNING.META_PIXEL && !laddat.fb) {
      laddat.fb = 1;
      const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); }; f.push = f; f.loaded = true; f.version = "2.0"; f.queue = [];
      skript("https://connect.facebook.net/en_US/fbevents.js"); fbq("init", SPARNING.META_PIXEL); fbq("track", "PageView");
    }
    if (s.annons && SPARNING.TIKTOK_PIXEL && !laddat.tt) {
      laddat.tt = 1;
      const t = window.ttq = window.ttq || []; t.methods = ["page", "track"]; t.methods.forEach(m => t[m] = function () { t.push([m].concat([].slice.call(arguments))); });
      skript("https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" + encodeURIComponent(SPARNING.TIKTOK_PIXEL) + "&lib=ttq"); t.page();
    }
    if (s.annons && SPARNING.ADSENSE && !laddat.as) { laddat.as = 1; skript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(SPARNING.ADSENSE), { crossOrigin: "anonymous" }); }
  }
  // Händelser som sidan kan skicka (t.ex. klick till en säljare). Går bara iväg om besökaren har samtyckt.
  window.jpHandelse = function (namn, data) {
    const s = las(); if (!s) return;
    if (s.stat && SPARNING.GA4 || s.annons && SPARNING.GOOGLE_ADS) gtag("event", namn, data || {});
    if (s.annons && window.fbq) fbq("trackCustom", namn, data || {});
    if (s.annons && window.ttq && ttq.track) ttq.track(namn === "utlank" ? "ClickButton" : namn, data || {});
  };

  function ruta(installningar) {
    if (document.getElementById("kakruta")) return;
    if (!document.getElementById("kakstil")) { const st = document.createElement("style"); st.id = "kakstil"; st.textContent = '.kakval[hidden] { display: none !important; } .kakruta { position: fixed; left: 0; right: 0; bottom: 0; z-index: 90; padding: 12px; background: rgba(4,10,18,.55); } .kakinne { max-width: 620px; margin: 0 auto; background: #fff; color: #1A2433; border-radius: 16px; padding: 18px; box-shadow: 0 -10px 40px rgba(0,0,0,.45); max-height: 82vh; overflow: auto; } .kakinne > b { font-size: 18px; color: #0E2A47; } .kakinne p { margin: 6px 0 12px; font-size: 14px; line-height: 1.5; color: #44505F !important; } .kakinne a { color: #0E2A47 !important; font-weight: 700; } .kakval { display: grid; gap: 10px; margin: 0 0 14px; } .kakval label { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; line-height: 1.45; color: #1A2433; } .kakval input { width: 20px; height: 20px; flex: none; margin-top: 1px; } .kakknappar { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .kakknappar button { font: inherit; font-weight: 800; font-size: 15px; padding: 13px 10px; border-radius: 12px; border: 2px solid #0E2A47; background: #0E2A47; color: #fff; cursor: pointer; } .kakknappar button[data-k="val"] { grid-column: 1 / -1; order: 3; background: #fff; color: #0E2A47; border-color: #CBD3DE; font-weight: 700; padding: 10px; } .kakruta, .kakruta * { box-sizing: border-box; font-family: Inter, system-ui, sans-serif; }'; document.head.appendChild(st); }
    const s = las() || { stat: false, annons: false };
    const d = document.createElement("div"); d.id = "kakruta"; d.className = "kakruta"; d.setAttribute("role", "dialog"); d.setAttribute("aria-label", "Kakor och samtycke");
    d.innerHTML = `<div class="kakinne">
      <b>Får vi använda kakor?</b>
      <p>${harAnnons ? "Vi vill mäta hur sidan används och kunna visa relevant reklam, hos oss och på andra sajter. Då sparas kakor på din enhet och uppgifter delas med våra partner." : "Vi vill mäta hur sidan används med Google Analytics, så att vi kan göra den bättre. Då sparas kakor på din enhet och Google får uppgifter om ditt besök."} Du väljer själv, och sidan fungerar lika bra om du säger nej. <a href="integritetspolicy.html#kakor">Läs mer</a></p>
      <div class="kakval" ${installningar ? "" : "hidden"}>
        <label><input type="checkbox" checked disabled> <span><b>Nödvändiga</b> – ditt val i den här rutan och sådant du själv sparar (plats, jämförelse). Kan inte stängas av.</span></label>
        <label><input type="checkbox" id="kakStat" ${s.stat ? "checked" : ""}> <span><b>Statistik</b> – hur många som besöker sidan och vad de tittar på (Google Analytics).</span></label>
        ${harAnnons ? `<label><input type="checkbox" id="kakAnnons" ${s.annons ? "checked" : ""}> <span><b>Marknadsföring</b> – personlig reklam och mätning av annonser (Google, Meta, TikTok).</span></label>` : ""}
      </div>
      <div class="kakknappar">
        <button type="button" data-k="nej">Bara nödvändiga</button>
        <button type="button" data-k="val">${installningar ? "Spara mina val" : "Anpassa"}</button>
        <button type="button" data-k="ja">Godkänn alla</button>
      </div></div>`;
    document.body.appendChild(d);
    d.addEventListener("click", e => {
      const k = e.target.closest("button[data-k]"); if (!k) return;
      const val = d.querySelector(".kakval");
      if (k.dataset.k === "val" && val.hidden) { val.hidden = false; k.textContent = "Spara mina val"; return; }
      const ny = k.dataset.k === "ja" ? spara(true, harAnnons) : k.dataset.k === "nej" ? spara(false, false) : spara(d.querySelector("#kakStat").checked, !!(d.querySelector("#kakAnnons") || {}).checked);
      d.remove(); if (!demo) tillampa(ny);
      if (!ny.stat && !ny.annons && (laddat.g || laddat.fb || laddat.tt || laddat.as)) location.reload();   // samtycket togs tillbaka: ladda om utan mätning
    });
  }
  window.jpKakval = () => ruta(true);
  document.addEventListener("click", e => { if (e.target.closest("[data-kakor]")) { e.preventDefault(); ruta(true); } });

  const start = () => {
    if (SPARNING.GOOGLE_CMP) {   // Googles egen samtyckesruta sköter frågan och uppdaterar Consent Mode själv
      if (SPARNING.ADSENSE) skript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(SPARNING.ADSENSE), { crossOrigin: "anonymous" });
      const gid = SPARNING.GA4 || SPARNING.GOOGLE_ADS; if (gid) { skript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(gid)); gtag("js", new Date()); if (SPARNING.GA4) gtag("config", SPARNING.GA4); if (SPARNING.GOOGLE_ADS) gtag("config", SPARNING.GOOGLE_ADS); }
      return;
    }
    const s = las();
    if (s) tillampa(s); else if (harStat || harAnnons || demo) ruta(false);
  };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
