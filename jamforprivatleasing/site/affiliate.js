// Affiliatelänkar – här lägger du in spårningslänkarna från affiliatenätverken (t.ex. Adtraction, Awin, Adservice).
//
// SÅ FUNKAR DET
// Varje rad kopplar en webbplats (domän) till nätverkets "deeplink"-länk för den annonsören.
// Skriv {url} där målsidan ska in – sidan fyller i länken till exakt rätt erbjudande automatiskt.
// Alla länkar till den domänen blir då affiliatelänkar och märks med "Annonslänk" på sidan.
// Domäner som inte står här får vanliga länkar.
//
// EXEMPEL (ta bort // framför och byt till din riktiga länk från nätverket):
//   "lecab.se": "https://track.adtraction.com/t/t?a=1234567&as=7654321&t=2&tk=1&url={url}",
//
const AFFILIATE = {
  // "lecab.se":   "",
  // "dinbil.se":  "",
};

// ---- Behöver inte ändras nedanför ----
function affMall(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    for (const doman in AFFILIATE) {
      const mall = AFFILIATE[doman];
      if (mall && (host === doman || host.endsWith("." + doman))) return mall;
    }
  } catch (e) {}
  return "";
}
function arAff(url) { return !!affMall(url); }
function ut(url) {
  const mall = affMall(url);
  return mall ? mall.replace("{url}", encodeURIComponent(url)) : url;
}
function rel(url) { return arAff(url) ? "sponsored noopener" : "noopener"; }
