// Bildkälla för bilarna.
//
// I dag: egna foton från Wikimedia Commons (mappen bilder/). De visar modellen, men inte alltid
// exakt årsmodell, utrustning eller färg.
//
// När du har en kundnyckel från IMAGIN.studio (licensierade, renderade bilder av exakt rätt bil):
//   1. Skriv in nyckeln i KUND nedan.
//   2. Claude kontrollerar varje bils märke/modell mot IMAGIN:s lista (getCarListing) och fyller i MODELL.
// Då visar sidan en renderad bild av exakt rätt bil, och i beställningen byter bilen färg när kunden väljer färg.
const BILDKALLA = {
  KUND: "",          // t.ex. "jamforprivatleasing" – får du av IMAGIN.studio (service@imagin.studio)
  CDN: "https://cdn.imagin.studio/getImage",
  // Per bil (nyckel = bildnamnet i bilder/, t.ex. "ex30"): IMAGIN:s exakta värden.
  // Fylls i och kontrolleras när nyckeln finns. Exempel:
  //   ex30: { make: "volvo", modelFamily: "ex30", modelYear: 2026 },
  MODELL: {},
  // Färger: kundens val (t.ex. "Glaciärvit Metallic") -> IMAGIN paintId. Fylls i per modell via getPaints.
  FARG: {}
};

function bildUrl(bil, farg, bredd) {
  const m = BILDKALLA.KUND && bil.foto && BILDKALLA.MODELL[bil.foto];
  if (!m) return bil.foto ? "bilder/" + bil.foto + (bredd && bredd <= 600 ? "-480" : "-960") + ".webp" : "";   // WebP i två storlekar skapas av kalla/build.py
  const p = new URLSearchParams({ customer: BILDKALLA.KUND, zoomtype: "fullscreen", angle: "23", width: String(bredd || 800) });
  Object.entries(m).forEach(([k, v]) => p.set(k, String(v)));
  if (farg) {
    const id = (BILDKALLA.FARG[bil.foto] || {})[farg];
    if (id) p.set("paintId", id);
    p.set("paintDescription", farg.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }
  return BILDKALLA.CDN + "?" + p;
}
function arRenderad(bil) { return !!(BILDKALLA.KUND && bil.foto && BILDKALLA.MODELL[bil.foto]); }
