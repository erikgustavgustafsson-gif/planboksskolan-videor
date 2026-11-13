// Företagsuppgifter – visas i sidfoten och på Om oss, Integritetspolicy och Villkor.
// FYLL I innan lansering (lämna tomt = raden döljs).
const FORETAG = {
  varumarke: "Jämföra Privatleasing",
  namn: "Erik Gustafsson",                 // innehavare av den enskilda firman
  orgnr: "",                               // organisationsnummer (för enskild firma = personnummer). Krävs om firman är registrerad hos Bolagsverket eller för moms
  adress: "",                              // postadress, t.ex. ett box- eller c/o-adress
  epost: "kontakt@jamforprivatleasing.se",
  webb: "https://jamforprivatleasing.se",
  fskatt: true,                            // visas som "Godkänd för F-skatt" när firman är registrerad
};

;
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

;
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

;
// Genereras av kalla/build.py – lägsta faktiska månadskostnad per modell och dag
const PRISHIST = {"audi-a3-sedan":[["2026-11-11",2895],["2026-11-12",2895],["2026-11-13",2895]],"audi-a3-sportback":[["2026-11-11",2795],["2026-11-12",2795],["2026-11-13",2795]],"audi-a5":[["2026-11-11",4395],["2026-11-12",4395],["2026-11-13",4395]],"audi-a5-avant":[["2026-11-11",4395],["2026-11-12",4395],["2026-11-13",4395]],"audi-q4-e-tron":[["2026-11-11",4995],["2026-11-12",4995],["2026-11-13",4995]],"audi-q6-e-tron":[["2026-11-11",6395],["2026-11-12",6395],["2026-11-13",6395]],"bmw-1-serie":[["2026-11-11",3762],["2026-11-12",3444],["2026-11-13",3444]],"byd-seal-6":[["2026-11-11",4511],["2026-11-12",4511],["2026-11-13",4511]],"cupra-born":[["2026-11-11",4362],["2026-11-12",4151],["2026-11-13",4151]],"cupra-formentor":[["2026-11-11",2773],["2026-11-12",2695],["2026-11-13",2695]],"cupra-leon":[["2026-11-11",4387],["2026-11-12",3295],["2026-11-13",3295]],"cupra-leon-sportstourer":[["2026-11-11",3862],["2026-11-12",3862],["2026-11-13",3862]],"cupra-raval":[["2026-11-11",3562],["2026-11-12",3273],["2026-11-13",3273]],"cupra-terramar":[["2026-11-11",3273],["2026-11-12",2973],["2026-11-13",2973]],"hyundai-kona":[["2026-11-11",3483],["2026-11-12",3483],["2026-11-13",3483]],"hyundai-tucson":[["2026-11-11",4082],["2026-11-12",3495],["2026-11-13",3483]],"hyundai-i20":[["2026-11-11",2483],["2026-11-12",2483],["2026-11-13",2483]],"kia-ev2":[["2026-11-11",3495],["2026-11-12",3452],["2026-11-13",3452]],"kia-ev3":[["2026-11-11",4456],["2026-11-12",4456],["2026-11-13",4456]],"kia-k4-sportswagon":[["2026-11-11",3552],["2026-11-12",3552],["2026-11-13",3552]],"kia-sportage":[["2026-11-11",4782],["2026-11-12",4695],["2026-11-13",4695]],"kia-stonic":[["2026-11-11",3295],["2026-11-12",3295],["2026-11-13",3295]],"nissan-juke":[["2026-11-11",2995],["2026-11-12",2986],["2026-11-13",2986]],"nissan-qashqai":[["2026-11-11",2995],["2026-11-12",2995],["2026-11-13",2995]],"peugeot-2008":[["2026-11-11",2799],["2026-11-12",2499],["2026-11-13",2499]],"peugeot-3008":[["2026-11-11",3594],["2026-11-12",3099],["2026-11-13",3099]],"polestar-4":[["2026-11-11",6995],["2026-11-12",6995],["2026-11-13",6995]],"skoda-elroq":[["2026-11-11",3995],["2026-11-12",3995],["2026-11-13",3995]],"skoda-enyaq":[["2026-11-11",4995],["2026-11-12",4995],["2026-11-13",4995]],"skoda-enyaq-coupe":[["2026-11-11",5495],["2026-11-12",5495],["2026-11-13",5495]],"skoda-epiq":[["2026-11-11",2795],["2026-11-12",2795],["2026-11-13",2795]],"skoda-kodiaq":[["2026-11-11",4409],["2026-11-12",4395],["2026-11-13",4395]],"skoda-peaq":[["2026-11-11",6945],["2026-11-12",6923],["2026-11-13",6923]],"skoda-superb-combi":[["2026-11-11",4995],["2026-11-12",4995],["2026-11-13",4995]],"toyota-aygo-x":[["2026-11-11",2995],["2026-11-12",2995],["2026-11-13",2995]],"toyota-c-hr":[["2026-11-11",3595],["2026-11-12",3595],["2026-11-13",3595]],"toyota-corolla-cross":[["2026-11-11",4595],["2026-11-12",4595],["2026-11-13",4595]],"toyota-corolla-touring-sports":[["2026-11-11",3395],["2026-11-12",3395],["2026-11-13",3395]],"toyota-rav4":[["2026-11-11",5995],["2026-11-12",5995],["2026-11-13",5995]],"toyota-yaris":[["2026-11-11",2995],["2026-11-12",2995],["2026-11-13",2995]],"toyota-yaris-cross":[["2026-11-11",3195],["2026-11-12",3195],["2026-11-13",3195]],"toyota-bz4x":[["2026-11-11",5895],["2026-11-12",5895],["2026-11-13",5895]],"volkswagen-golf":[["2026-11-11",2895],["2026-11-12",2895],["2026-11-13",2895]],"volkswagen-golf-sportscombi":[["2026-11-11",3995],["2026-11-12",3995],["2026-11-13",3995]],"volkswagen-id-3":[["2026-11-11",3895],["2026-11-12",3895],["2026-11-13",3895]],"volkswagen-id-4":[["2026-11-11",5195],["2026-11-12",5195],["2026-11-13",5195]],"volkswagen-id-7":[["2026-11-11",6495],["2026-11-12",6495],["2026-11-13",6495]],"volkswagen-id-7-tourer":[["2026-11-11",5295],["2026-11-12",5295],["2026-11-13",5295]],"volkswagen-id-cross":[["2026-11-11",2545],["2026-11-12",2545],["2026-11-13",2545]],"volkswagen-id-polo":[["2026-11-11",3495],["2026-11-12",3495],["2026-11-13",3495]],"volkswagen-id-tiguan":[["2026-11-11",5995],["2026-11-12",5995],["2026-11-13",5995]],"volkswagen-passat":[["2026-11-11",4495],["2026-11-12",4495],["2026-11-13",4495]],"volkswagen-polo":[["2026-11-11",2499],["2026-11-12",2295],["2026-11-13",2295]],"volkswagen-t-roc":[["2026-11-11",2895],["2026-11-12",2895],["2026-11-13",2895]],"volkswagen-taigo":[["2026-11-11",2649],["2026-11-12",2695],["2026-11-13",2695]],"volkswagen-tayron":[["2026-11-11",3495],["2026-11-12",3495],["2026-11-13",2895]],"volkswagen-tiguan":[["2026-11-11",2949],["2026-11-12",2949],["2026-11-13",2750]],"volvo-ex30":[["2026-11-11",3790],["2026-11-12",3790],["2026-11-13",3790]],"volvo-ex40":[["2026-11-11",4790],["2026-11-12",4790],["2026-11-13",4790]],"volvo-ex60":[["2026-11-11",8995],["2026-11-12",8995],["2026-11-13",8995]],"volvo-xc60":[["2026-11-11",8009],["2026-11-12",8009],["2026-11-13",8009]],"volvo-xc90":[["2026-11-11",10900],["2026-11-12",10200],["2026-11-13",10200]],"volvo-ex30-cross-country":[["2026-11-11",3990],["2026-11-12",3990],["2026-11-13",3990]],"audi-a2":[["2026-11-11",5009],["2026-11-12",5009],["2026-11-13",5009]],"cupra-tavascan":[["2026-11-11",4987],["2026-11-12",4771],["2026-11-13",4771]],"skoda-fabia":[["2026-11-11",3009],["2026-11-12",2995],["2026-11-13",2995]],"skoda-kamiq":[["2026-11-11",2829],["2026-11-12",2829],["2026-11-13",2829]],"skoda-karoq":[["2026-11-11",3044],["2026-11-12",3030],["2026-11-13",3030]],"skoda-octavia-combi":[["2026-11-11",2959],["2026-11-12",2959],["2026-11-13",2959]],"kia-picanto":[["2026-11-11",3220],["2026-11-12",2995],["2026-11-13",2995]],"kia-seltos":[["2026-11-11",3870],["2026-11-12",3795],["2026-11-13",3795]],"kia-ev4":[["2026-11-11",6270],["2026-11-12",4995],["2026-11-13",4995]],"kia-ev5":[["2026-11-11",6570],["2026-11-12",6570],["2026-11-13",6570]],"kia-sorento":[["2026-11-11",7920],["2026-11-12",7920],["2026-11-13",7920]],"mercedes-benz-gla":[["2026-11-11",5579],["2026-11-12",5495],["2026-11-13",5495]],"mercedes-benz-cla":[["2026-11-11",6079],["2026-11-12",5995],["2026-11-13",5995]],"mercedes-benz-cla-shooting-brake":[["2026-11-11",6379],["2026-11-12",6379],["2026-11-13",6379]],"mercedes-benz-glb":[["2026-11-11",6579],["2026-11-12",5495],["2026-11-13",5495]],"mercedes-benz-c":[["2026-11-11",7079],["2026-11-12",6995],["2026-11-13",6995]],"mercedes-benz-glc":[["2026-11-11",8079],["2026-11-12",7995],["2026-11-13",7995]],"mercedes-benz-e-klass":[["2026-11-11",6879],["2026-11-12",6879],["2026-11-13",6879]],"tesla-model-3":[["2026-11-11",5628],["2026-11-12",5628],["2026-11-13",5628]],"tesla-model-y":[["2026-11-11",5428],["2026-11-12",5428],["2026-11-13",5428]],"volvo-ec40":[["2026-11-11",5195],["2026-11-12",5195],["2026-11-13",5195]],"volvo-v60":[["2026-11-11",7595],["2026-11-12",7595],["2026-11-13",7595]],"seat-ibiza":[["2026-11-11",2973],["2026-11-12",2973],["2026-11-13",2973]],"bmw-ix2":[["2026-11-11",6967],["2026-11-12",6895],["2026-11-13",6895]],"hyundai-bayon":[["2026-11-11",2683],["2026-11-12",2683],["2026-11-13",2683]],"toyota-bz4x-touring":[["2026-11-11",6373],["2026-11-12",6295],["2026-11-13",6295]],"toyota-corolla":[["2026-11-11",4073],["2026-11-12",3395],["2026-11-13",3395]],"nissan-micra":[["2026-11-11",4082],["2026-11-12",3895],["2026-11-13",3895]],"renault-5-e-tech":[["2026-11-11",3577],["2026-11-12",3377],["2026-11-13",3377]],"dacia-sandero":[["2026-11-11",2078],["2026-11-12",2077],["2026-11-13",2077]],"peugeot-5008":[["2026-11-11",3794],["2026-11-12",3299],["2026-11-13",3299]],"peugeot-e-2008":[["2026-11-11",4294],["2026-11-12",3899],["2026-11-13",3899]],"mg-mg4":[["2026-11-11",3083],["2026-11-12",3083],["2026-11-13",3083]],"mazda-6e":[["2026-11-11",8530],["2026-11-12",8530],["2026-11-13",8530]],"bmw-ix1":[["2026-11-12",5932],["2026-11-13",5932]],"bmw-ix3":[["2026-11-12",9695],["2026-11-13",9695]],"dacia-bigster":[["2026-11-12",5477],["2026-11-13",5477]],"dacia-duster":[["2026-11-12",3377],["2026-11-13",3377]],"dacia-jogger":[["2026-11-12",2677],["2026-11-13",2677]],"ford-capri":[["2026-11-12",5083],["2026-11-13",5083]],"ford-explorer":[["2026-11-12",5083],["2026-11-13",5083]],"ford-kuga":[["2026-11-12",4383],["2026-11-13",4383]],"ford-mustang-mach-e":[["2026-11-12",6083],["2026-11-13",6083]],"ford-puma-gen-e":[["2026-11-12",3583],["2026-11-13",3583]],"honda-hr-v":[["2026-11-12",2995],["2026-11-13",2995]],"honda-zr-v":[["2026-11-12",4582],["2026-11-13",4582]],"hyundai-ioniq-3":[["2026-11-12",3582],["2026-11-13",3582]],"hyundai-ioniq-5":[["2026-11-12",4582],["2026-11-13",4582]],"hyundai-ioniq-9":[["2026-11-12",7083],["2026-11-13",7083]],"hyundai-santa-fe":[["2026-11-12",6082],["2026-11-13",6082]],"kia-ev6":[["2026-11-12",9682],["2026-11-13",9682]],"kia-k4":[["2026-11-12",3667],["2026-11-13",3667]],"kia-niro":[["2026-11-12",4795],["2026-11-13",4795]],"mg-4-ev-urban":[["2026-11-12",2995],["2026-11-13",2995]],"mg-s5":[["2026-11-12",4295],["2026-11-13",4295]],"mg-s6":[["2026-11-12",6995],["2026-11-13",6995]],"mercedes-benz-a-klass":[["2026-11-12",4995],["2026-11-13",4995]],"nissan-ariya":[["2026-11-12",6182],["2026-11-13",6182]],"nissan-leaf":[["2026-11-12",3995],["2026-11-13",3995]],"nissan-x-trail":[["2026-11-12",4582],["2026-11-13",4582]],"renault-4-e-tech":[["2026-11-12",3477],["2026-11-13",3477]],"renault-captur":[["2026-11-12",4477],["2026-11-13",4477]],"renault-clio":[["2026-11-12",4077],["2026-11-13",4077]],"renault-rafale":[["2026-11-12",7777],["2026-11-13",7777]],"subaru-e-outback":[["2026-11-12",10128],["2026-11-13",10128]],"alpine-a290":[["2026-11-12",4600],["2026-11-13",4600]],"audi-a2-e-tron":[["2026-11-12",4667],["2026-11-13",4667]],"audi-a3":[["2026-11-12",2795],["2026-11-13",2795]],"audi-a6":[["2026-11-12",7595],["2026-11-13",7595]],"audi-a6-allroad":[["2026-11-12",8995],["2026-11-13",8995]],"audi-a6-e-tron":[["2026-11-12",10295],["2026-11-13",10295]],"audi-q3":[["2026-11-12",5195],["2026-11-13",5195]],"audi-q5":[["2026-11-12",6995],["2026-11-13",6995]],"audi-q7":[["2026-11-12",11595],["2026-11-13",11595]],"audi-q8":[["2026-11-12",7995],["2026-11-13",7995]],"audi-e-tron":[["2026-11-12",5412],["2026-11-13",5412]],"bmw-5-serie":[["2026-11-12",6995],["2026-11-13",6995]],"bmw-x1":[["2026-11-12",6395],["2026-11-13",6395]],"bmw-x3":[["2026-11-12",8295],["2026-11-13",8295]],"bmw-ix":[["2026-11-12",12295],["2026-11-13",12295]],"byd-seal":[["2026-11-12",3895],["2026-11-13",3895]],"byd-seal-u":[["2026-11-12",4595],["2026-11-13",4595]],"citroen-c3-aircross":[["2026-11-12",3277],["2026-11-13",3277]],"citroen-c4":[["2026-11-12",2877],["2026-11-13",2877]],"citroen-c5-aircross":[["2026-11-12",3199],["2026-11-13",3199]],"citroen-e-c3":[["2026-11-12",3477],["2026-11-13",3477]],"dfsk-500":[["2026-11-12",3299],["2026-11-13",3299]],"dfsk-e5":[["2026-11-12",6490],["2026-11-13",6490]],"ds-7":[["2026-11-12",2799],["2026-11-13",2799]],"ford-puma":[["2026-11-12",2995],["2026-11-13",2995]],"honda-jazz":[["2026-11-12",3715],["2026-11-13",3715]],"leapmotor-b05":[["2026-11-12",4899],["2026-11-13",4899]],"leapmotor-b10":[["2026-11-12",4499],["2026-11-13",4499]],"leapmotor-c10":[["2026-11-12",4799],["2026-11-13",4799]],"leapmotor-t03":[["2026-11-12",3199],["2026-11-13",3199]],"lynk-co-01":[["2026-11-12",4895],["2026-11-13",4895]],"lynk-co-08":[["2026-11-12",5995],["2026-11-13",5995]],"mini-aceman":[["2026-11-12",3895],["2026-11-13",3895]],"mini-cooper":[["2026-11-12",3795],["2026-11-13",3795]],"mini-countryman":[["2026-11-12",3795],["2026-11-13",3795]],"mazda-2":[["2026-11-12",4390],["2026-11-13",4390]],"mazda-cx-30":[["2026-11-12",5074],["2026-11-13",5074]],"mazda-cx-60":[["2026-11-12",8344],["2026-11-13",8344]],"mercedes-benz-cle":[["2026-11-12",9195],["2026-11-13",9195]],"mercedes-benz-eqe":[["2026-11-12",7695],["2026-11-13",7695]],"mercedes-benz-gls":[["2026-11-12",15331],["2026-11-13",15331]],"mitsubishi-outlander":[["2026-11-12",3999],["2026-11-13",3999]],"opel-astra":[["2026-11-12",4999],["2026-11-13",4999]],"opel-corsa":[["2026-11-12",5999],["2026-11-13",5999]],"opel-frontera":[["2026-11-12",2899],["2026-11-13",2899]],"opel-grandland":[["2026-11-12",4299],["2026-11-13",4299]],"opel-mokka":[["2026-11-12",3299],["2026-11-13",3299]],"opel-zafira":[["2026-11-12",4299],["2026-11-13",4299]],"peugeot-208":[["2026-11-12",2699],["2026-11-13",2699]],"peugeot-408":[["2026-11-12",3299],["2026-11-13",3299]],"renault-scenic-e-tech":[["2026-11-12",4077],["2026-11-13",4077]],"seat-arona":[["2026-11-12",2295],["2026-11-13",2295]],"skoda-octavia":[["2026-11-12",3030],["2026-11-13",3030]],"subaru-forester":[["2026-11-12",4495],["2026-11-13",4495]],"subaru-outback":[["2026-11-12",4990],["2026-11-13",4990]],"subaru-uncharted":[["2026-11-12",4795],["2026-11-13",4795]],"suzuki-swift":[["2026-11-12",2999],["2026-11-13",2999]],"suzuki-vitara":[["2026-11-12",3095],["2026-11-13",3095]],"suzuki-e-vitara":[["2026-11-12",4645],["2026-11-13",4645]],"volkswagen-t-cross":[["2026-11-12",2823],["2026-11-13",2823]],"volvo-es90":[["2026-11-12",9490],["2026-11-13",9490]],"xpeng-g6":[["2026-11-12",5995],["2026-11-13",5995]],"xpeng-l03":[["2026-11-12",4995],["2026-11-13",4995]],"byd-seal-6-touring":[["2026-11-12",4510],["2026-11-13",4510]]};

;
// Konfiguratorns data (konfig.js) laddas inte längre – sidan är en ren jämförelsesajt.
if (typeof KONFIG === "undefined") var KONFIG = {};
    // Besöksstatistik utan kakor (stat.php på servern räknar bara antal)
    function stat(t, bil) {
      try {
        if (!/^https?:$/.test(location.protocol) || /claude|localhost|127\.0\.0\.1/.test(location.hostname)) return;
        const d = new URLSearchParams({ t, p: location.pathname });
        if (bil) d.set("b", bil.marke + " " + bil.modell);
        navigator.sendBeacon ? navigator.sendBeacon("stat.php", d) : fetch("stat.php", { method: "POST", body: d, keepalive: true });
      } catch (e) {}
    }
    stat("visa");
    document.addEventListener("click", e => { const a = e.target.closest('a[target="_blank"]'); if (a && !/wikimedia|creativecommons/.test(a.href)) stat("utlank"); });

    // Gör ett märkesnamn till en adress: "Mercedes-Benz" -> "mercedes-benz", "Škoda" -> "skoda"
    function slug(t) { return t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

    // Mobilmenyn (☰)
    const menyKnapp = document.getElementById("menyKnapp");
    if (menyKnapp) menyKnapp.onclick = () => {
      const oppen = document.body.classList.toggle("menyoppen");
      menyKnapp.setAttribute("aria-expanded", oppen);
    };

    /* ---------------------------------------------------------------
       BILAR – här ligger all data. En rad per bil.
       Varje erbjudande är kontrollerat mot säljarens egen sida (6 nov 2026):
       pris, avtalstid, mil/år, avgifter och om första hyran är förhöjd.

       Hjälpfunktionen B() tar värdena i en bestämd ordning:
         B(märke, modell, foto, drivmedel, kr/mån, mil/år, nypris, extra)

       nypris  = vad bilen kostar kontant enligt Skatteverket (null = saknas)
       extra   = valfria tillägg som skriver över standardvärdena:
         start   = uppläggningsavgift (kr, en gång)
         adm     = administrations-/aviavgift (kr/mån)
         forhojd = första förhöjd hyra (kr, en gång) – en dold kostnad!
         mer     = pris för fler mil, t.ex. {1500: 345, 2000: 650}
         service = false om service INTE ingår
         not     = något viktigt i villkoren som inte syns i siffrorna
         kalla   = vem som erbjuder avtalet, url = länk dit
       ---------------------------------------------------------------- */
    const KONTROLL = "13 nov 2026"; // uppdateras vid varje daglig kontroll
    const HEDIN = { start: 995, adm: 59, kalla: "Hedin Automotive" };
    const LEASABIL = { start: 495, kalla: "Leasabil" };
    const TOYOTA = { typ: "Märket", kalla: "Toyota Easy Privatleasing", start: 695, adm: 59, url: "https://easyprivatleasing.toyota.se/", not: "Fordonsskatt tillkommer. Övermil 8 kr/mil" };
    const PEUGEOT = { typ: "Märket", kalla: "Peugeot (Ayvens)", url: "https://www.peugeot.se/kop/finansiering/privatleasing.html", forsakring: 395, not: "Försäkring via Ayvens är obligatorisk: 395 kr/mån utöver hyran (ingår i totalen). Fordonsskatt faktureras utöver hyran" };
    const VWFS_NOT = "Aviavgift 59 kr/mån vid pappersfaktura, e-faktura gratis. Fordonsskatt tillkommer";
    const VW = { typ: "Märket", kalla: "Volkswagen (VW Finans)", start: 495, not: VWFS_NOT };
    const SKODA = { typ: "Märket", kalla: "Škoda (VW Finans)", start: 495, not: VWFS_NOT };
    const CUPRA = { typ: "Märket", kalla: "Cupra (VW Finans)", start: 495, forhojd: 10000, not: "Priset förutsätter 10 000 kr i första förhöjd hyra (kan väljas bort mot +300 kr/mån). " + VWFS_NOT };
    const AUDI = { typ: "Märket", kalla: "Audi (VW Finans)", start: 495, service: false, not: "Audi Serviceavtal kan läggas till. " + VWFS_NOT };
    const KIA = { typ: "Märket", kalla: "Kia", start: 592, adm: 59 };
    const KU = m => "https://www.kia.com/se/nya-bilar/" + m + "/upptack/";
    const MB = { typ: "Märket", kalla: "Mercedes-Benz", start: 695, adm: 65, url: "https://www.mercedes-benz.se/passengercars/finance/financing-leasing/offers-private.html", not: "Fordonsskatt tillkommer. Mercedes-Benz Finans kan begära förhöjd första avgift efter kreditprövning" };
    const TESLA = { typ: "Märket", kalla: "Tesla (via DNB Finans), uppgifter från Leasabil", forhojd: 30000, service: null, not: "Priset förutsätter 30 000 kr i kontantinsats. Avtalet tecknas direkt hos Tesla" };
    const HA = "https://hedinautomotive.se/bilar/kop-bil/";
    const LB = "https://leasabil.com/bilmarken/";

    function B(marke, modell, foto, drivmedel, manad, mil, nypris, extra = {}) {
      return {
        marke, modell, foto, drivmedel, manad, mil, nypris,
        start: 0, adm: 0, forhojd: 0, mer: null, service: true, not: "",
        typ: "Återförsäljare", kalla: "", url: "",
        ...extra          // "..." kopierar in extra-värdena och skriver över standardvärdena ovan
      };
    }

    // --- BWORT START (genereras av verktyg/gen_bilweb2.py) ---
    const BWORT = {"Segeltorp":[[59.28,17.94],"Stockholm"],"Kalmar":[[56.66,16.36],"Kalmar"],"Gävle":[[60.67,17.14],"Gävleborg"],"Mölndal":[[57.66,12.01],"Västra Götaland"],"Helsingborg":[[56.05,12.69],"Skåne"],"Hudiksvall":[[61.0,16.8],"Gävleborg"],"Ängelholm":[[55.8,13.4],"Skåne"],"Växjö":[[56.88,14.81],"Kronoberg"],"Motala":[[58.41,15.62],"Östergötland"],"Handen":[[59.17,18.14],"Stockholm"],"Kista":[[59.4,17.94],"Stockholm"],"Stockholm":[[59.33,18.07],"Stockholm"],"Danderyd":[[59.4,18.04],"Stockholm"],"Norrtälje":[[59.76,18.7],"Stockholm"],"Åskloster":[[56.9,12.7],"Halland"],"Södertälje":[[59.2,17.63],"Stockholm"],"Sundsvall":[[62.39,17.31],"Västernorrland"],"Karlskrona":[[56.16,15.59],"Blekinge"],"Jönköping":[[57.78,14.16],"Jönköping"],"Kungälv":[[57.87,11.98],"Västra Götaland"],"Karlstad":[[59.38,13.5],"Värmland"],"Malmö":[[55.6,13.0],"Skåne"],"Kristianstad":[[56.03,14.16],"Skåne"],"Lund":[[55.7,13.19],"Skåne"],"Trollhättan":[[58.28,12.29],"Västra Götaland"],"Åby":[[58.41,15.62],"Östergötland"],"Halmstad":[[56.67,12.86],"Halland"],"Uppsala":[[59.86,17.64],"Uppsala"],"Falkenberg":[[56.9,12.7],"Halland"],"Linköping":[[58.41,15.62],"Östergötland"],"Täby":[[59.44,18.07],"Stockholm"],"Skärholmen":[[59.28,17.91],"Stockholm"],"Vällingby":[[59.33,18.07],"Stockholm"],"Hisings Kärra":[[57.9,12.6],"Västra Götaland"],"Upplands Väsby":[[59.52,17.91],"Stockholm"],"Västra Frölunda":[[57.9,12.6],"Västra Götaland"],"Borlänge":[[60.48,15.43],"Dalarna"],"Varberg":[[57.11,12.25],"Halland"],"Falun":[[60.61,15.63],"Dalarna"],"Norrköping":[[58.59,16.19],"Östergötland"],"Österhaninge":[[59.33,18.07],"Stockholm"],"Saltsjö-Boo":[[59.33,18.07],"Stockholm"],"Borås":[[57.72,12.94],"Västra Götaland"],"Alingsås":[[57.9,12.6],"Västra Götaland"],"Västerås":[[59.61,16.55],"Västmanland"],"Värnamo":[[57.78,14.16],"Jönköping"],"Nacka Strand":[[59.33,18.07],"Stockholm"],"Eskilstuna":[[59.37,16.51],"Södermanland"],"Karlshamn":[[56.17,14.86],"Blekinge"],"Enköping":[[59.64,17.08],"Uppsala"],"Laholm":[[56.9,12.7],"Halland"],"Nässjö":[[57.78,14.16],"Jönköping"],"Kungsängen":[[59.48,17.75],"Stockholm"],"Bromma":[[59.34,17.94],"Stockholm"],"Järfälla":[[59.43,17.83],"Stockholm"],"Arvika":[[59.38,13.5],"Värmland"],"Åkersberga":[[59.48,18.3],"Stockholm"],"Örebro":[[59.27,15.21],"Örebro"],"Ludvika":[[60.6,15.4],"Dalarna"],"Lindesberg":[[59.27,15.21],"Örebro"],"Sollentuna":[[59.33,18.07],"Stockholm"],"Östergötland":[[58.41,15.62],"Östergötland"],"Västra Götaland":[[57.9,12.6],"Västra Götaland"],"Västervik":[[56.66,16.36],"Kalmar"],"Nacka":[[59.31,18.16],"Stockholm"],"Mora":[[60.6,15.4],"Dalarna"],"Hässleholm":[[55.8,13.4],"Skåne"],"Tranås":[[57.78,14.16],"Jönköping"],"Eksjö":[[57.78,14.16],"Jönköping"],"Lidköping":[[58.5,13.16],"Västra Götaland"],"Oskarshamn":[[56.66,16.36],"Kalmar"],"Hisings Backa":[[57.75,11.93],"Västra Götaland"],"Haninge":[[59.17,18.14],"Stockholm"],"Östhammar":[[59.86,17.64],"Uppsala"],"Kungsbacka":[[57.49,12.08],"Halland"],"Sundbyberg":[[59.36,17.97],"Stockholm"],"Kungens Kurva":[[59.33,18.07],"Stockholm"],"Trelleborg":[[55.8,13.4],"Skåne"],"Skee":[[57.9,12.6],"Västra Götaland"],"Askim":[[57.63,11.94],"Västra Götaland"],"Arlandastad":[[59.33,18.07],"Stockholm"],"Nyköping":[[58.75,17.01],"Södermanland"],"Ljungby":[[56.88,14.81],"Kronoberg"],"Vallentuna":[[59.53,18.08],"Stockholm"],"Köping":[[59.61,16.55],"Västmanland"],"Solna":[[59.36,18.0],"Stockholm"]};
    // --- BWORT SLUT ---
    // Samma bil under olika namn hos säljarna slås ihop till ett modellnamn (annars får bilen två sidor)
    const MODELLALIAS = { "Renault|5": "5 E-Tech", "Renault|4": "4 E-Tech", "Renault|Scénic": "Scenic E-Tech", "Renault|Scenic": "Scenic E-Tech", "Hyundai|Ioniq 3": "IONIQ 3", "Hyundai|Ioniq 5": "IONIQ 5",
      "Kia|Sportage Plug-In Hybrid": "Sportage", "Nissan|Juke Hybrid": "Juke", "BYD|SEAL U DM-i": "Seal U", "BYD|SEAL 6 DM-i Touring": "Seal 6 Touring", "Mercedes-Benz|C-Klass": "C", "Audi|A2": "A2 e-tron",
      "Toyota|Aygo": "Aygo X", "DS|7 Crossback": "7", "MG|MG4": "MG4", "Dacia|Sandero Stepway": "Sandero", "Opel|Corsa-e": "Corsa", "Suzuki|e Vitara": "e Vitara" };
    // Elvarianter med samma kaross som en modell vi redan har bild på
    const FOTOALIAS = {"Peugeot|e-3008": "p3008", "Peugeot|e-5008": "p5008", "Renault|5 E-Tech": "r5", "Opel|Frontera": "frontera", "Opel|Grandland": "grandland", "Kia|K4": "k4", "Citroën|C5 AirCross": "c5aircross", "Mitsubishi|Outlander": "outlander", "Hyundai|Santa Fe": "santafe", "Citroën|C3 Aircross": "c3aircross", "Renault|Scenic E-Tech": "scenic", "Hyundai|IONIQ 9": "ioniq9", "Ford|Explorer": "explorer", "Opel|Mokka": "mokka", "Leapmotor|B10": "b10", "Leapmotor|T03": "t03", "MG|S5": "mgs5", "Ford|Capri": "capri", "MINI|Aceman": "aceman", "Dacia|Duster": "duster", "BMW|iX1": "ix1", "Mercedes-Benz|GLA": "gla", "Peugeot|408": "p408", "Opel|Mokka-e": "mokka", "Citroën|e-C3 Aircross": "c3aircross"};
    const _alias = (marke, mnamn) => MODELLALIAS[marke + "|" + mnamn] || mnamn;
    // Säljarnas rubriker innehåller ofta reklam ("2,99%", "PRIVATLEASA…", "Beställningsbil") och VERSALER – här blir det ett rent variantnamn
    const _BEHALL = new Set(["PHEV", "HEV", "MHEV", "BEV", "AWD", "FWD", "RWD", "4WD", "2WD", "TSI", "TDI", "TFSI", "GTI", "GTX", "GTE", "GT", "GTS", "RS", "EV", "DCT", "DSG", "CVT", "TCE", "GDI", "T-GDI", "DM-I", "XC", "EX", "ID", "II", "III", "IV", "SE", "SEL", "XLE", "GS", "SUV", "SW", "ST", "N", "X", "S", "R", "E", "M", "LR", "SR", "AMG", "EQ", "JCW", "MG", "BYD", "BMW", "DS"]);
    function snyggNamn(marke, mnamn, modell) {
      let t = String(modell || "").split("*")[0].split(" / ")[0]
        .replace(/\s*[-–|,]?\s*\d{1,2}([.,]\d{1,2})?\s?%.*$/, "")                          // "2,99% ränta …", "0%"
        .replace(/\b(europas mest sålda bil|\/?priv\w{0,5}\s?l?t?eas\w*|\w*kampanj\w*|leasing fr\.?|erbjudande\w*|beställningsbil\w*|lagerbil\w*|omgående\b.*|snabb leverans.*|NYA!?)/gi, " ")
        .replace(/\s*(inkl\.?|ink\.?|&|och|med)?\s*(fria\s+)?(drag\s*(&|och)\s*)?(service\w*\s*(&|och)\s*)?vinterhjul.*$/i, "")
        .replace(/\s*\b(serviceavtal|service)\b.*$/i, "").replace(/\s\d[\d ]*\s?kr\b.*$/i, "")
        .replace(/[\s/.\-–]*\b(lager|leasing)\b\.?\s*(fr\.?)?$/i, "")
        .replace(/^(citroen|mercedes-benz|mercedes|vw)\s+/i, "")
        .replace(/\s+(fr\.?|från|i|nu|pris|fr\.?\s*\d.*)$/i, "").replace(/\s+/g, " ").replace(/^[\s\-–|,*!/.:&]+|[\s\-–|,*!/.:&]+$/g, "");
      const egna = (marke + " " + mnamn).split(/\s+/);
      t = t.split(" ").map(o => {
        const eget = egna.find(x => x.toLowerCase() === o.toLowerCase()); if (eget) return eget;
        if (/^\d+HK$/i.test(o)) return o.toLowerCase(); if (/^\d+KWH$/i.test(o)) return o.replace(/kwh/i, "kWh");
        if (_BEHALL.has(o) || !/^[A-ZÅÄÖ\d-]+$/.test(o) || o.replace(/[^A-ZÅÄÖ]/g, "").length < 4) return o;      // bara ord helt i VERSALER med minst 4 bokstäver ändras
        return o.split("-").map(d => _BEHALL.has(d) || /\d/.test(d) && d.length <= 3 ? d : d.charAt(0) + d.slice(1).toLowerCase()).join("-");
      }).join(" ");
      if (!egna.some(x => t.toLowerCase().startsWith(mnamn.toLowerCase().split(" ")[0])) && !t.toLowerCase().startsWith(mnamn.toLowerCase())) t = t;
      return t && t.length > 1 ? t : mnamn;
    }
    // En handlarannons från Bilweb. Kort form för att hålla filen liten:
    // BW(märke, modellnamn, variant, bild, drivmedel, kr/mån, mil/år (0 = står inte i annonsen), säljare, ort, sökväg hos Bilweb, annonsens datum, insats, karosstyp)
    function BW(marke, mnamn, modell, foto, drivmedel, manad, mil, saljare, ort, vag, dat, forhojd, kaross) {
      const o = BWORT[ort] || [];
      mnamn = _alias(marke, mnamn); foto = foto || FOTOALIAS[marke + "|" + mnamn] || null; modell = snyggNamn(marke, mnamn, modell);
      const noter = [`Annons hos ${saljare}, uppdaterad ${dat}`];
      if (!mil) noter.push("Körsträckan framgår inte av annonsen – fråga handlaren");
      if (forhojd) noter.push(`Priset förutsätter ${forhojd.toLocaleString("sv-SE")} kr i insats/förhöjd första hyra`);
      return B(marke, modell, foto, drivmedel, manad, mil || 1000, null, { mnamn, kaross: kaross || "", kalla: saljare + " (via Bilweb)", url: "https://bilweb.se/" + vag,
        ort, ortpos: o[0] || null, ortlan: o[1] || "", service: null, not: noter.join(". "), tillval: "inga", bilweb: true, annonsdatum: dat, forhojd: forhojd || 0, milokand: !mil });
    }

    // En lagerbil hos Hedin Automotive med Hedins egna privatleasinguppgifter (pris, avgifter, körsträcka):
    // HD(märke, modellnamn, variant, bild, drivmedel, kr/mån, mil/år, uppläggning, avi/mån, ort, [lat, lon], id/slug, service ingår (1/0), karosstyp)
    function HD(marke, mnamn, modell, foto, drivmedel, manad, mil, start, adm, ort, pos, vag, service, kaross, premie) {
      mnamn = _alias(marke, mnamn); foto = foto || FOTOALIAS[marke + "|" + mnamn] || null; modell = snyggNamn(marke, mnamn, modell);
      return B(marke, modell, foto, drivmedel, manad, mil, null, { mnamn, kaross: kaross || "", kalla: "Hedin Automotive " + ort, url: "https://hedinautomotive.se/bilar/kop-bil/" + vag,
        start, adm, ort, ortpos: pos || (BWORT[ort] || [])[0] || null, ortlan: (BWORT[ort] || [])[1] || "", service: service ? true : null, not: "Lagerbil hos Hedin Automotive " + ort + ". Skatt, vinterhjul och försäkring tillkommer" + (premie ? ". Bilen kan ge rätt till elbilspremie – fråga Hedin om den påverkar priset" : ""), tillval: "inga", hedin: true });
    }

    const BILAR = [
      // --- HEDIN START: Hedin Automotives lagerbilar med privatleasingpris (genereras av verktyg/gen_hedin.py – ändra inte för hand) ---
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3372, 1000, 595, 55, "Luleå", [65.58, 22.15], "246881/pc-nc-bmw-120-2026", 1, "", 0),
      HD("BMW", "1-serie", "1-serie i", "bmw120", "Bensin", 3584, 1000, 595, 55, "Skellefteå", [64.75, 20.95], "255749/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie 120", "bmw120", "Bensin", 3584, 1000, 595, 55, "Östersund", [63.18, 14.64], "255748/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie M-Sport Rattvärme 18\"LM-fälg", "bmw120", "Bensin", 3584, 1000, 595, 55, "Bromma", [59.34, 17.94], "255747/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3690, 1000, 595, 55, "Kista", [59.4, 17.94], "246889/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3695, 1000, 595, 55, "Solna", [59.36, 18.0], "246888/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3695, 1000, 595, 55, "Umeå", [63.83, 20.26], "246886/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie i", "bmw120", "Bensin", 3695, 1000, 595, 55, "Sundsvall", [62.39, 17.31], "246885/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3695, 1000, 595, 55, "Luleå", [65.58, 22.15], "202306/pc-nc-bmw-120-2026", 1, "", 0),
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3714, 1000, 595, 55, "Uppsala", [59.86, 17.64], "255759/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie i", "bmw120", "Bensin", 3714, 1000, 595, 55, "Skellefteå", [64.75, 20.95], "255746/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie M-sport", "bmw120", "Bensin", 3714, 1000, 595, 55, "Danderyd", [59.4, 18.04], "255750/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie i", "bmw120", "Bensin", 3714, 1000, 595, 55, "Solna", [59.36, 18.0], "255745/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3714, 1000, 595, 55, "Gävle", [60.67, 17.14], "250229/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie", "bmw120", "Bensin", 3734, 1000, 595, 55, "Luleå", [65.58, 22.15], "202323/pc-nc-bmw-120-2026", 1, "", 0),
      HD("BMW", "1-serie", "1-serie i", "bmw120", "Bensin", 4032, 1000, 595, 55, "Solna", [59.36, 18.0], "250251/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie M-Sport Rattvärme 18\"LM-fälg", "bmw120", "Bensin", 4069, 1000, 595, 55, "Bromma", [59.34, 17.94], "250248/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie i M-sport", "bmw120", "Bensin", 4069, 1000, 595, 55, "Luleå", [65.58, 22.15], "250252/pc-nc-bmw-120-2026", 1, "", 0),
      HD("BMW", "1-serie", "1-serie M-sport", "bmw120", "Bensin", 4069, 1000, 595, 55, "Danderyd", [59.4, 18.04], "250250/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie 120", "bmw120", "Bensin", 4069, 1000, 595, 55, "Kista", [59.4, 17.94], "250249/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie i", "bmw120", "Bensin", 4069, 1000, 595, 55, "Umeå", [63.83, 20.26], "250232/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "1-serie", "1-serie 120", "bmw120", "Bensin", 4069, 1500, 595, 55, "Östersund", [63.18, 14.64], "250230/pc-nc-bmw-120-2026", 0, "", 0),
      HD("BMW", "iX1", "iX1 eDrive20 M Sport Edition", null, "El", 5860, 1000, 595, 55, "Kista", [59.4, 17.94], "246025/pc-nc-bmw-ix1-2026", 0, "", 0),
      HD("BMW", "iX1", "iX1 eDrive20 M Sport Edition", null, "El", 5860, 1000, 595, 55, "Bromma", [59.34, 17.94], "246022/pc-nc-bmw-ix1-2026", 0, "", 0),
      HD("BMW", "iX1", "iX1 eDrive20 M Sport Edition", null, "El", 5927, 1000, 595, 55, "Gävle", [60.67, 17.14], "243145/pc-nc-bmw-ix1-2026", 0, "", 0),
      HD("BMW", "iX1", "iX1 eDrive20", null, "El", 6395, 1000, 595, 55, "Solna", [59.36, 18.0], "253478/pc-nc-bmw-ix1-2026", 0, "", 0),
      HD("BMW", "iX1", "iX1 xDrive30", null, "El", 7574, 1500, 595, 55, "Uppsala", [59.86, 17.64], "251037/pc-nc-bmw-ix1-2026", 0, "", 0),
      HD("BMW", "iX3", "iX3 Beställningsbil", null, "El", 10295, 1000, 595, 55, "Solna", [59.36, 18.0], "191141/pc-nc-bmw-ix3-2026", 0, "", 0),
      HD("BYD", "SEAL 6 DM-i Touring", "SEAL 6 DM-i Touring COMFORT PHEV", null, "Laddhybrid", 4510, 1000, 0, 0, "Helsingborg", [56.05, 12.69], "213000/pc-nc-byd-seal-6-dm-i-touring-2025", 1, "", 0),
      HD("BYD", "SEAL 6 DM-i Touring", "SEAL 6 DM-i Touring COMFORT PHEV", null, "Laddhybrid", 4511, 1000, 995, 60, "Borås", [57.72, 12.94], "213845/pc-nc-byd-seal-6-dm-i-touring-2025", 1, "", 0),
      HD("BYD", "SEAL 6 DM-i Touring", "SEAL 6 DM-i Touring PHEV", null, "Laddhybrid", 4511, 3000, 0, 0, "Kista", [59.4, 17.94], "214622/pc-nc-byd-seal-6-dm-i-touring-2025", 1, "", 0),
      HD("BYD", "SEAL 6 DM-i Touring", "SEAL 6 DM-i Touring SEAL 6 COMFORT PHEV", null, "Laddhybrid", 4511, 1000, 995, 60, "Borås", [57.72, 12.94], "213847/pc-nc-byd-seal-6-dm-i-touring-2025", 1, "", 0),
      HD("BYD", "SEAL 6 DM-i Touring", "SEAL 6 DM-i Touring Comfort", null, "Laddhybrid", 4869, 3000, 0, 0, "Kista", [59.4, 17.94], "214168/pc-nc-byd-seal-6-dm-i-touring-2025", 1, "", 0),
      HD("BYD", "SEAL 6 DM-i Touring", "SEAL 6 DM-i Touring Comfort", null, "Laddhybrid", 5195, 3000, 0, 0, "Kista", [59.4, 17.94], "219478/pc-nc-byd-seal-6-dm-i-touring-2026", 1, "", 0),
      HD("BYD", "SEAL U DM-i", "SEAL U DM-i COMFORT", null, "Laddhybrid", 4895, 3000, 0, 0, "Kista", [59.4, 17.94], "234292/pc-nc-byd-seal-u-dm-i-2025", 1, "", 0),
      HD("Dacia", "Bigster", "Bigster HEV 155hk", null, "Bensin", 5390, 1000, 995, 59, "Västerås", [59.61, 16.55], "219247/pc-nc-dacia-bigster-2026", 1, "", 0),
      HD("Dacia", "Duster", "Duster Extreme Hybrid 155 4x2", null, "Hybrid", 3290, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "208694/pc-nc-dacia-duster-2026", 1, "", 0),
      HD("Dacia", "Duster", "Duster EXPRESSION HYBRID 155", null, "Hybrid", 3390, 1000, 995, 59, "Halmstad", [56.67, 12.86], "259231/pc-nc-dacia-duster-2026", 1, "", 0),
      HD("Dacia", "Duster", "Duster EXPRESSION HYBRID 155", null, "Hybrid", 3390, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "256304/pc-nc-dacia-duster-2026", 1, "", 0),
      HD("Dacia", "Duster", "Duster 155 EXPRESSION", null, "Hybrid", 3390, 1000, 995, 59, "Kista", [59.4, 17.94], "245412/pc-nc-dacia-duster-2026", 1, "", 0),
      HD("Dacia", "Duster", "Duster EXPRESSION", null, "Hybrid", 3390, 1000, 995, 59, "Halmstad", [56.67, 12.86], "237675/pc-nc-dacia-duster-2026", 1, "", 0),
      HD("Dacia", "Duster", "Duster EXTREME HYBRID 150 4X4 Finansierings", null, "Hybrid", 3590, 1000, 995, 59, "Halmstad", [56.67, 12.86], "259228/pc-nc-dacia-duster-2027", 1, "", 0),
      HD("Dacia", "Duster", "Duster EXTREME HYBRID 150 4X4", null, "Hybrid", 3590, 1000, 995, 59, "Västerås", [59.61, 16.55], "249039/pc-nc-dacia-duster-2026", 1, "", 0),
      HD("Dacia", "Duster", "Duster EXTREME HYBRID 155", null, "Hybrid", 3590, 1000, 995, 59, "Ängelholm", null, "92510/pc-nc-dacia-duster-2025", 1, "", 0),
      HD("Dacia", "Duster", "Duster EXTREME HYBRID 150 4x4", null, "Hybrid", 3690, 1000, 995, 59, "Västerås", [59.61, 16.55], "229446/pc-nc-dacia-duster-2026", 1, "", 0),
      HD("Dacia", "Jogger", "Jogger EXTREME 7-SITS", null, "Bensin", 2590, 1000, 995, 59, "Alingsås", null, "72796/pc-nc-dacia-jogger-2025", 1, "", 0),
      HD("Dacia", "Jogger", "JOGGER EXTREME TCE 110 7-SITS", null, "Bensin", 2790, 1000, 995, 59, "Västerås", [59.61, 16.55], "238745/pc-nc-dacia-jogger-2026", 1, "", 0),
      HD("Dacia", "Jogger", "JOGGER EXTREME TCE 110 7-SITS", null, "Bensin", 2990, 1000, 995, 59, "Jönköping", [57.78, 14.16], "257141/pc-nc-dacia-jogger-2027", 1, "", 0),
      HD("Dacia", "Jogger", "Jogger Fri Försäkring* 7-SITS EXTREME TCE 110", null, "Bensin", 2990, 1000, 995, 59, "Halmstad", [56.67, 12.86], "253642/pc-nc-dacia-jogger-2026", 1, "", 0),
      HD("Dacia", "Jogger", "Jogger EXTREME TCe 110", null, "Bensin", 2990, 1000, 995, 59, "Halmstad", [56.67, 12.86], "252893/pc-nc-dacia-jogger-2026", 1, "", 0),
      HD("Dacia", "Sandero", "Sandero ESSENTIAL 100", "sandero", "Bensin", 1990, 1000, 995, 59, "Västerås", [59.61, 16.55], "226531/pc-nc-dacia-sandero-2026", 1, "", 0),
      HD("Dacia", "Sandero", "Sandero S PRIVATLEASA EUROPAS MEST SÅLDA BIL fr", "sandero", "Bensin", 1990, 1000, 995, 59, "Alingsås", null, "103700/pc-nc-dacia-sandero-2025", 1, "", 0),
      HD("Dacia", "Sandero", "Sandero E", "sandero", "Bensin", 1990, 1000, 995, 59, "Alingsås", null, "67890/pc-nc-dacia-sandero-2024", 1, "", 0),
      HD("Dacia", "Sandero", "Sandero Expression Hybrid 155", "sandero", "Hybrid", 2790, 1000, 995, 59, "Ängelholm", null, "256197/pc-nc-dacia-sandero-2027", 1, "", 0),
      HD("Dacia", "Sandero", "Sandero Expression Hybrid 155", "sandero", "Hybrid", 2790, 1000, 995, 59, "Halmstad", [56.67, 12.86], "255962/pc-nc-dacia-sandero-2027", 1, "", 0),
      HD("Dacia", "Sandero Stepway", "Sandero Stepway", null, "Bensin", 2190, 1000, 995, 59, "Västerås", [59.61, 16.55], "219243/pc-nc-dacia-sandero-stepway-2026", 1, "", 0),
      HD("Dacia", "Sandero Stepway", "Sandero Stepway EXTREME", null, "Bensin", 2290, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "247869/pc-nc-dacia-sandero-stepway-2026", 1, "", 0),
      HD("Dacia", "Sandero Stepway", "Sandero Stepway Extreme Hybrid 155", null, "Hybrid", 2990, 1000, 995, 59, "Halmstad", [56.67, 12.86], "256012/pc-nc-dacia-sandero-stepway-2027", 1, "", 0),
      HD("Dacia", "Sandero Stepway", "Sandero Stepway Extreme HYBRID 155", null, "Hybrid", 2990, 1000, 995, 59, "Ängelholm", null, "92511/pc-nc-dacia-sandero-stepway-2027", 1, "", 0),
      HD("Ford", "Capri", "Capri Long Range RWD 286hk Premium Edition", null, "El", 4995, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "253303/pc-nc-ford-capri-2025", 1, "", 0),
      HD("Ford", "Capri", "Capri PREMIUM RWD LONG RANGE BUSINESS EDITION", null, "El", 4995, 1000, 995, 60, "Kista", [59.4, 17.94], "232216/pc-nc-ford-capri-2025", 1, "", 0),
      HD("Ford", "Capri", "Capri RWD Long Range 286hk", null, "El", 5495, 1000, 995, 60, "Varberg", [57.11, 12.25], "219516/pc-nc-ford-capri-2026", 1, "", 0),
      HD("Ford", "Capri", "Capri LR RWD Business 286HK", null, "El", 5495, 1000, 995, 60, "Kristianstad", [56.03, 14.16], "188240/pc-nc-ford-capri-2025", 0, "", 0),
      HD("Ford", "Capri", "Capri LR RWD Business 286HK", null, "El", 5495, 1000, 995, 60, "Varberg", [57.11, 12.25], "188210/pc-nc-ford-capri-2026", 0, "", 0),
      HD("Ford", "Capri", "Capri Premium RWD Long Range", null, "El", 5995, 1000, 995, 60, "Österhaninge", null, "250716/pc-nc-ford-capri-2027", 0, "", 0),
      HD("Ford", "Capri", "Capri", null, "El", 5995, 1000, 995, 60, "Alingsås", null, "230899/pc-nc-ford-capri-2026", 1, "", 0),
      HD("Ford", "Capri", "Capri RWD Long Range Premium Edition", null, "El", 5995, 1000, 995, 60, "Ängelholm", null, "188274/pc-nc-ford-capri-2025", 0, "", 0),
      HD("Ford", "Capri", "Capri Long Range RWD Premium Edition", null, "El", 5995, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "187792/pc-nc-ford-capri-2027", 1, "", 0),
      HD("Ford", "Capri", "Capri Premium AWD Long Range", null, "El", 6195, 1000, 995, 60, "Österhaninge", null, "250718/pc-nc-ford-capri-2027", 0, "", 0),
      HD("Ford", "Capri", "Capri AWD Premium Edition", null, "El", 6195, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "127202/pc-nc-ford-capri-2027", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Long Range RWD Nordic Edt", null, "El", 4995, 1000, 995, 60, "Kista", [59.4, 17.94], "232199/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Business Edition RWD Long Range (77 kWh) 286 hk", null, "El", 4995, 1000, 995, 60, "Kristianstad", [56.03, 14.16], "188237/pc-nc-ford-explorer-2025", 0, "", 0),
      HD("Ford", "Explorer", "Explorer Long Range Nordic edt RWD", null, "El", 4995, 1000, 995, 60, "Kista", [59.4, 17.94], "172482/pc-nc-ford-explorer-2025", 1, "", 0),
      HD("Ford", "Explorer", "Explorer LR RWD Business 286HK", null, "El", 4995, 1000, 995, 60, "Varberg", [57.11, 12.25], "187907/pc-nc-ford-explorer-2025", 0, "", 0),
      HD("Ford", "Explorer", "Explorer LR RWD Nordic Edition 286HK", null, "El", 4995, 1000, 995, 60, "Kista", [59.4, 17.94], "119714/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium Edition LR RWD 286hk", null, "El", 5395, 1000, 995, 60, "Södertälje", [59.2, 17.63], "255552/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer RWD Long Range Premium Edition", null, "El", 5395, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "252908/pc-nc-ford-explorer-2027", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Long Range (79 kWh) RWD Premium Edition", null, "El", 5395, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "250452/pc-nc-ford-explorer-2027", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium Edition RWD", null, "El", 5395, 1000, 995, 60, "Alingsås", null, "231184/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Long Range RWD Premium Edt", null, "El", 5395, 1000, 995, 60, "Österhaninge", null, "233066/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium Edition RWD Long Range", null, "El", 5395, 1000, 995, 60, "Ängelholm", null, "232802/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium Edition", null, "El", 5395, 1000, 995, 60, "Bromma", [59.34, 17.94], "232240/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium RWD Long Range", null, "El", 5395, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "188541/pc-nc-ford-explorer-2027", 1, "", 0),
      HD("Ford", "Explorer", "Explorer RWD Premium Edition", null, "El", 5395, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "187776/pc-nc-ford-explorer-2027", 1, "", 0),
      HD("Ford", "Explorer", "Explorer PREMIUM LR AWD 340HK", null, "El", 5595, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "257553/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium", null, "El", 5595, 1000, 995, 60, "Södertälje", [59.2, 17.63], "255550/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer AWD Long Range 340HK Premium Edition", null, "El", 5595, 1000, 995, 60, "Halmstad", [56.67, 12.86], "254721/pc-nc-ford-explorer-2027", 1, "", 0),
      HD("Ford", "Explorer", "Explorer AWD LR 599Km Premium Edt", null, "El", 5595, 1000, 995, 60, "Österhaninge", null, "250712/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium AWD Long Range", null, "El", 5595, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "127200/pc-nc-ford-explorer-2027", 1, "", 0),
      HD("Ford", "Explorer", "Explorer Premium LR AWD 340hk Business Edition Dragkrok", null, "El", 5732, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "258224/pc-nc-ford-explorer-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-LINE X Privat leasing Fr", null, "Laddhybrid", 4295, 1000, 995, 60, "Österhaninge", null, "248130/pc-nc-ford-kuga-2026", 0, "", 0),
      HD("Ford", "Kuga", "KUGA ST-LINE X 2.5 PHEV FWD 243HK", null, "Laddhybrid", 4295, 1000, 995, 60, "Kista", [59.4, 17.94], "246626/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-LINE X Black Edition 243hk", null, "Laddhybrid", 4295, 1000, 995, 60, "Kista", [59.4, 17.94], "246621/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga Black Edition Laddhybrid", null, "Laddhybrid", 4295, 1000, 995, 60, "Enköping", [59.64, 17.08], "213336/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edition", null, "Laddhybrid", 4295, 1000, 995, 60, "Mölndal", [57.66, 12.01], "213097/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X 2.5 pHev 243hk Black Edition", null, "Laddhybrid", 4795, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "259729/pc-nc-ford-kuga-2027", 1, "", 0),
      HD("Ford", "Kuga", "KUGA ST-LINE X 2.5 PHEV FWD 243HK-Dragkrok", null, "Laddhybrid", 4795, 3000, 995, 60, "Karlshamn", [56.17, 14.86], "258986/pc-nc-ford-kuga-2027", 0, "", 0),
      HD("Ford", "Kuga", "Kuga ST-LINE X 2.5 PHEV 243HK Black Edition", null, "Laddhybrid", 4795, 1000, 995, 60, "Kristianstad", [56.03, 14.16], "258447/pc-nc-ford-kuga-2027", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X 2.5 Elhybrid AWD 183hk", null, "Hybrid", 4795, 1000, 995, 60, "Västerås", [59.61, 16.55], "254019/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edt. PHEV", null, "Laddhybrid", 4795, 1000, 995, 60, "Uppsala", [59.86, 17.64], "247789/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga pHev 243hk Black Edt", null, "Laddhybrid", 4795, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "246707/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-LINE X 2.5 PHEV", null, "Laddhybrid", 4795, 1000, 995, 60, "Nacka", [59.31, 18.16], "246633/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edition", null, "Laddhybrid", 4795, 1000, 995, 60, "Karlshamn", [56.17, 14.86], "246434/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X", null, "Laddhybrid", 4795, 1000, 995, 60, "Halmstad", [56.67, 12.86], "246417/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edition", null, "Laddhybrid", 4795, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "241949/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X", null, "Laddhybrid", 4795, 1000, 995, 60, "Alingsås", null, "237858/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edition pHev Privatlease", null, "Laddhybrid", 4795, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "202793/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edition Plug-In Hybrid 243hk", null, "Laddhybrid", 4795, 1000, 995, 60, "Västerås", [59.61, 16.55], "188532/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga Black Edition X 2.5 PHEV 243hk Aut", null, "Laddhybrid", 4995, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "253300/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edition 2.5 PHEV 243hk", null, "Laddhybrid", 4995, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "249798/pc-nc-ford-kuga-2027", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X 2.5 PHEV 243hk Automat", null, "Laddhybrid", 4995, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "250435/pc-nc-ford-kuga-2027", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X 2.5 Elhybrid AWD 183hk 0.95%", null, "Hybrid", 4995, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "246591/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga 2,5 PHEV ST-Line X Black Edition", null, "Laddhybrid", 4995, 1000, 995, 60, "Ängelholm", null, "211850/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Kuga", "Kuga ST-Line X Black Edition pHev Privatlease", null, "Laddhybrid", 4995, 1000, 995, 60, "Eskilstuna", [59.37, 16.51], "44508/pc-nc-ford-kuga-2026", 1, "", 0),
      HD("Ford", "Mustang Mach-E", "Mustang Mach-E Premium Long Range RWD 276hk", null, "El", 5995, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "253295/pc-nc-ford-mustang-mach-e-2026", 1, "", 0),
      HD("Ford", "Mustang Mach-E", "Mustang Mach-E PREMIUM LONG RANGE RWD 276HK", null, "El", 5995, 1500, 995, 60, "Bromma", [59.34, 17.94], "233879/pc-nc-ford-mustang-mach-e-2025", 1, "", 0),
      HD("Ford", "Puma Gen-E", "Puma Gen-E 168HK", null, "El", 3495, 1000, 995, 60, "Hisings Kärra", null, "230570/pc-nc-ford-puma-gen-e-2026", 0, "", 1),
      HD("Ford", "Puma Gen-E", "Puma Gen-E Gen-E", null, "El", 3995, 1000, 995, 60, "Alingsås", null, "237855/pc-nc-ford-puma-gen-e-2026", 1, "", 1),
      HD("Honda", "HR-V", "HR-V ELEGANCE 1.5 AUT", null, "Hybrid", 2995, 3000, 995, 59, "Kista", [59.4, 17.94], "258361/pc-nc-honda-hr-v-2027", 1, "", 0),
      HD("Honda", "ZR-V", "ZR-V ELEGANCE 2.0 AT HYBRID", null, "Hybrid", 4495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "237767/pc-nc-honda-zr-v-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon 1.0 T-GDI ESSENTIAL Manuell 2.99%", "bayon", "Bensin", 2595, 1000, 995, 60, "Kista", [59.4, 17.94], "246041/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon Essential - Manuell 2,99% i", "bayon", "Bensin", 2695, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "245701/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon", "bayon", "Bensin", 2895, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "257906/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon 2,99%", "bayon", "Bensin", 2895, 1000, 995, 60, "Mölndal", [57.66, 12.01], "251567/pc-nc-hyundai-bayon-2027", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon Essential", "bayon", "Bensin", 2895, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "245678/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon Automat", "bayon", "Bensin", 2995, 1000, 995, 60, "Danderyd", [59.4, 18.04], "260377/pc-nc-hyundai-bayon-2027", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon 1.0 T-GDI", "bayon", "Hybrid", 2995, 1000, 995, 59, "Södertälje", [59.2, 17.63], "258950/pc-nc-hyundai-bayon-2027", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon 2,99%", "bayon", "Hybrid", 2995, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "256546/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon 2,99%", "bayon", "Hybrid", 2995, 1000, 995, 60, "Danderyd", [59.4, 18.04], "254891/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon Essential 1.0 T-GDI DCT AUT", "bayon", "Hybrid", 2995, 1000, 995, 59, "Danderyd", [59.4, 18.04], "254706/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon 2,99%", "bayon", "Bensin", 2995, 1000, 995, 60, "Mölndal", [57.66, 12.01], "250924/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon", "bayon", "Bensin", 3095, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "256551/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "Bayon", "Bayon Advanced - Automat - 1.0 T-GDI DCT", "bayon", "Bensin", 3095, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "245699/pc-nc-hyundai-bayon-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 STANDARD RANGE 42kWh SELECT", null, "El", 3495, 1000, 995, 60, "Danderyd", [59.4, 18.04], "259582/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3495, 3000, 995, 60, "Södertälje", [59.2, 17.63], "259590/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3495, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "257914/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Select", null, "El", 3495, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "255791/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Standard range Select", null, "El", 3495, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "255789/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3495, 1000, 995, 60, "Kista", [59.4, 17.94], "255564/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Standard range Select 2,99% i", null, "El", 3495, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "254435/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3495, 1000, 995, 59, "Danderyd", [59.4, 18.04], "254409/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Range Select", null, "El", 3495, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "249149/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Standard Range Select 42 kWh", null, "El", 3495, 1000, 995, 60, "Kista", [59.4, 17.94], "248904/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3495, 1000, 995, 60, "Mölndal", [57.66, 12.01], "248752/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 STANDARD RANGE SELECT 42kWh 2.99%", null, "El", 3495, 1000, 995, 60, "Kista", [59.4, 17.94], "248419/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 STANDARD RANGE 42kWh TREND", null, "El", 3695, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "259644/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 STANDARD RANGE 42kWh TREND", null, "El", 3695, 1000, 995, 60, "Danderyd", [59.4, 18.04], "259615/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Trend Standard Range 42kWh 147hk FYSISK BIL I HALLEN", null, "El", 3695, 1000, 995, 60, "Mölndal", [57.66, 12.01], "256545/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3695, 1000, 995, 60, "Danderyd", [59.4, 18.04], "248761/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3695, 1000, 995, 60, "Mölndal", [57.66, 12.01], "248754/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3995, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "259629/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 LONG RANGE 61kWh SELECT 2.99%", null, "El", 3995, 1000, 995, 60, "Kista", [59.4, 17.94], "255565/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3995, 1000, 995, 59, "Danderyd", [59.4, 18.04], "254654/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 3995, 1000, 995, 60, "Mölndal", [57.66, 12.01], "248753/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 LONG RANGE SELECT 61kWh 2.99%", null, "El", 3995, 1000, 995, 60, "Kista", [59.4, 17.94], "248420/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 4195, 1000, 995, 59, "Danderyd", [59.4, 18.04], "254443/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 4195, 1000, 995, 60, "Mölndal", [57.66, 12.01], "248755/pc-nc-hyundai-ioniq-3-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 4795, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "259328/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 LONG RANGE 61kWh PRIME MY27", null, "El", 4795, 1000, 995, 59, "Danderyd", [59.4, 18.04], "257877/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Long Range 61kWh Prime 136hk 2,99%", null, "El", 4795, 1000, 995, 60, "Mölndal", [57.66, 12.01], "257660/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 4795, 1000, 995, 59, "Danderyd", [59.4, 18.04], "249592/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 4795, 1000, 995, 60, "Mölndal", [57.66, 12.01], "248757/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 LONG RANGE 61kWh N-LINE EVO - 2,99%", null, "El", 4995, 1000, 995, 59, "Danderyd", [59.4, 18.04], "258743/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 Long Range N-Line 2,99%", null, "El", 4995, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "256071/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 4995, 1000, 995, 60, "Danderyd", [59.4, 18.04], "248763/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 2,99%", null, "El", 4995, 1000, 995, 60, "Mölndal", [57.66, 12.01], "248759/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 3", "IONIQ 3 LONG RANGE N LINE EVO PANO KOMFORTPAKET 2.99%", null, "El", 5468, 1000, 995, 60, "Kista", [59.4, 17.94], "255164/pc-nc-hyundai-ioniq-3-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5", null, "El", 4495, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "260575/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 RWD", null, "El", 4495, 1000, 995, 60, "Danderyd", [59.4, 18.04], "260411/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 RWD", null, "El", 4495, 1000, 995, 60, "Södertälje", [59.2, 17.63], "259250/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh RWD 228hk", null, "El", 4495, 1000, 995, 60, "Mölndal", [57.66, 12.01], "259617/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh RWD 228hk", null, "El", 4495, 3000, 995, 60, "Södertälje", [59.2, 17.63], "259611/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 ESSENTIAL 84kWh 228Hk", null, "El", 4495, 1000, 995, 60, "Danderyd", [59.4, 18.04], "259091/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh RWD 228hk Essential", null, "El", 4495, 1000, 995, 60, "Mölndal", [57.66, 12.01], "256061/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh RWD - Essential", null, "El", 4495, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "254451/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 RWD 84KWH Essential", null, "El", 4495, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "254401/pc-nc-hyundai-ioniq-5-2026", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 RWD ESSENTIAL 84KWH 2.99%", null, "El", 4495, 1000, 995, 60, "Kista", [59.4, 17.94], "250555/pc-nc-hyundai-ioniq-5-2027", 1, "", 1),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 AWD Essential", null, "El", 4695, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "255878/pc-nc-hyundai-ioniq-5-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh RWD 228hk Essential 2,99%", null, "El", 4795, 1000, 995, 60, "Mölndal", [57.66, 12.01], "257426/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 ESSENTIAL 84 kWh AWD 325Hk", null, "El", 4995, 1000, 995, 60, "Danderyd", [59.4, 18.04], "254010/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5", null, "El", 5095, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "255802/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 AWD 84KWH ADVANCED 2.99%", null, "El", 5095, 1000, 995, 60, "Kista", [59.4, 17.94], "250576/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh AWD ADVANCED 2.99%", null, "El", 5095, 1000, 995, 60, "Kista", [59.4, 17.94], "247186/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 2,99%", null, "El", 5175, 1000, 995, 60, "Danderyd", [59.4, 18.04], "256090/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 Advanced - 84 kWh", null, "El", 5195, 1000, 995, 60, "Danderyd", [59.4, 18.04], "255823/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 2,99%", null, "El", 5395, 1000, 995, 60, "Mölndal", [57.66, 12.01], "247947/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 EV - AWD - ADVANCE", null, "El", 5395, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "237720/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 2,99%", null, "El", 5575, 1000, 995, 60, "Danderyd", [59.4, 18.04], "253559/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 KWH AWD 325HK 2.99%", null, "El", 5695, 1000, 995, 60, "Kista", [59.4, 17.94], "246647/pc-nc-hyundai-ioniq-5-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84kWh - AWD - ADVANCED - TECH+KOMFORT PAKET", null, "El", 5760, 1000, 995, 59, "Danderyd", [59.4, 18.04], "258122/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 2,99%", null, "El", 6095, 1000, 995, 60, "Mölndal", [57.66, 12.01], "245659/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh AWD N Line 325hk", null, "El", 6095, 1000, 995, 60, "Mölndal", [57.66, 12.01], "233351/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh AWD N Line 325hk Hedin Edition", null, "El", 6095, 1000, 995, 60, "Mölndal", [57.66, 12.01], "233344/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 N Line - 84kWh - AWD - Pano - Tech", null, "El", 6203, 1000, 995, 60, "Danderyd", [59.4, 18.04], "233529/pc-nc-hyundai-ioniq-5-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 2,99%", null, "El", 6372, 1000, 995, 60, "Danderyd", [59.4, 18.04], "233527/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 5", "IONIQ 5 84kWh - AWD - N LINE - TECH PAKET - PANORAMA - ULTIMATE RED", null, "El", 6403, 1000, 995, 59, "Danderyd", [59.4, 18.04], "258120/pc-nc-hyundai-ioniq-5-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Essential RWD 110kWh", null, "El", 6995, 1000, 995, 60, "Kista", [59.4, 17.94], "246847/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Line", null, "El", 7595, 1000, 995, 60, "Danderyd", [59.4, 18.04], "260609/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 AWD 110kwh Calligraphy", null, "El", 7595, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "252726/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Line AWD 110.3 kWh Long Range 313hk", null, "El", 7595, 1000, 995, 60, "Mölndal", [57.66, 12.01], "251516/pc-nc-hyundai-ioniq-9-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy 6 sits", null, "El", 7595, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "249408/pc-nc-hyundai-ioniq-9-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 CALLIGRAPHY LINE 110 kWh AWD 7-SITS", null, "El", 7595, 1000, 995, 60, "Danderyd", [59.4, 18.04], "249343/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 AWD CALLIGRAPHY LINE 6S HEDIN EDITION", null, "El", 7595, 1000, 995, 60, "Kista", [59.4, 17.94], "246749/pc-nc-hyundai-ioniq-9-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Line - 110 kWh - Fyrhjulsdrift - 7 sätes", null, "El", 7691, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "237709/pc-nc-hyundai-ioniq-9-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Line - 110 kWh - Fyrhjulsdrift - 7 sätes", null, "El", 7691, 1000, 995, 59, "Danderyd", [59.4, 18.04], "255020/pc-nc-hyundai-ioniq-9-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Line - 110 kWh - 7 sätes", null, "El", 7691, 1000, 995, 60, "Danderyd", [59.4, 18.04], "250504/pc-nc-hyundai-ioniq-9-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 CALLIGRAPHY LINE AWD 110kWh 7-SITS - IONOSPHERE GREEN PEARL", null, "El", 7759, 1000, 995, 60, "Danderyd", [59.4, 18.04], "252939/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 7-Sits", null, "El", 7782, 1000, 995, 60, "Södertälje", [59.2, 17.63], "259254/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 PERFORMANCE 435Hk CALLIGRAPHY LINE AWD 110kWh 7-SITS", null, "El", 7795, 1000, 995, 59, "Danderyd", [59.4, 18.04], "259023/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 AWD - Calligraphy Line", null, "El", 7795, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "237710/pc-nc-hyundai-ioniq-9-2026", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Line - 110 kWh - Fyrhjulsdrift", null, "El", 7795, 1000, 995, 60, "Danderyd", [59.4, 18.04], "237558/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 AWD 110kWh Calligraphy Black 313hk 7 Sits", null, "El", 7995, 3000, 995, 60, "Södertälje", [59.2, 17.63], "259622/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 AWD 110kWh Calligraphy Black 313hk 7 Sits", null, "El", 7995, 1000, 995, 60, "Mölndal", [57.66, 12.01], "256062/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Line AWD 110.3 kWh Long Range 313hk", null, "El", 7995, 1000, 995, 60, "Mölndal", [57.66, 12.01], "249344/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Black Line 110 kWh", null, "El", 7995, 1000, 995, 60, "Danderyd", [59.4, 18.04], "246862/pc-nc-hyundai-ioniq-9-2027", 1, "", 0),
      HD("Hyundai", "Kona", "Kona HEV", "kona", "Hybrid", 3395, 1000, 995, 60, "Danderyd", [59.4, 18.04], "260387/pc-nc-hyundai-kona-2027", 1, "", 0),
      HD("Hyundai", "Kona", "Kona ESSENTIAL HYBRID HEV AUTOMAT", "kona", "Hybrid", 3395, 1000, 995, 60, "Danderyd", [59.4, 18.04], "251021/pc-nc-hyundai-kona-2027", 1, "", 0),
      HD("Hyundai", "Kona", "Kona HYBRID - 2.99%", "kona", "Hybrid", 3395, 1000, 995, 60, "Kista", [59.4, 17.94], "250578/pc-nc-hyundai-kona-2027", 1, "", 0),
      HD("Hyundai", "Kona", "Kona 2,99%", "kona", "Hybrid", 3395, 1000, 995, 60, "Danderyd", [59.4, 18.04], "249600/pc-nc-hyundai-kona-2027", 1, "", 0),
      HD("Hyundai", "Kona", "Kona 2,99%", "kona", "Hybrid", 3695, 1000, 995, 60, "Mölndal", [57.66, 12.01], "251518/pc-nc-hyundai-kona-2027", 1, "", 0),
      HD("Hyundai", "Kona", "Kona 2,99%", "kona", "Hybrid", 3838, 1000, 995, 60, "Danderyd", [59.4, 18.04], "247958/pc-nc-hyundai-kona-2026", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe 2,99%", null, "Laddhybrid", 5995, 1000, 995, 60, "Södertälje", [59.2, 17.63], "259624/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV AWD Advanced 2,99% i", null, "Laddhybrid", 5995, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "254415/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV Calligraphy Line 4WD HEDIN EDITION", null, "Laddhybrid", 5995, 1000, 995, 60, "Kista", [59.4, 17.94], "250573/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV 4WD CALLIGRAPHY LINE HEDIN EDITION", null, "Laddhybrid", 5995, 1000, 995, 60, "Kista", [59.4, 17.94], "250440/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV Calligraphy 4WD HEDIN EDITION", null, "Laddhybrid", 5995, 1000, 995, 60, "Kista", [59.4, 17.94], "250434/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe ADVANCED AWD PHEV 7-SITS", null, "Laddhybrid", 5995, 1000, 995, 60, "Danderyd", [59.4, 18.04], "247044/pc-nc-hyundai-santa-fe-2026", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV 4WD 7-sits 2,99%", null, "Laddhybrid", 5995, 1000, 995, 60, "Kista", [59.4, 17.94], "246848/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV 7-SITS 4WD CALLIGRAPHY LINE HEDIN EDITION", null, "Laddhybrid", 5995, 1000, 995, 60, "Kista", [59.4, 17.94], "246003/pc-nc-hyundai-santa-fe-2026", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe 2,99%", null, "Laddhybrid", 5995, 1000, 995, 60, "Mölndal", [57.66, 12.01], "246446/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV AWD Calligraphy", null, "Laddhybrid", 5995, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "237711/pc-nc-hyundai-santa-fe-2026", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe 2,99%", null, "Laddhybrid", 5995, 1000, 995, 60, "Danderyd", [59.4, 18.04], "237559/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV AWD, Calligraphy+", null, "Laddhybrid", 6185, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "237717/pc-nc-hyundai-santa-fe-2026", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV AWD, Calligraphy", null, "Laddhybrid", 6495, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "249963/pc-nc-hyundai-santa-fe-2026", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV", null, "Laddhybrid", 6595, 1000, 995, 60, "Södertälje", [59.2, 17.63], "260314/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV 4WD Calligraphy Line 288hk", null, "Laddhybrid", 6595, 1000, 995, 60, "Mölndal", [57.66, 12.01], "259676/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe 2,99% PHEV 4WD Calligraphy Line", null, "Laddhybrid", 6595, 1200, 995, 60, "Mölndal", [57.66, 12.01], "254403/pc-nc-hyundai-santa-fe-2026", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe 2,99 %", null, "Laddhybrid", 6595, 1000, 995, 60, "Mölndal", [57.66, 12.01], "254405/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe 2,99%", null, "Laddhybrid", 6595, 1000, 995, 60, "Danderyd", [59.4, 18.04], "251023/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV AWD Calligraphy 2,99% i", null, "Laddhybrid", 6795, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "257907/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe PHEV AWD Calligraphy", null, "Laddhybrid", 6795, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "249967/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe Hyundai SANTA FE", null, "Laddhybrid", 6803, 1000, 995, 60, "Danderyd", [59.4, 18.04], "259202/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe AWD CALLIGRAPHY PLUG-IN 6 alt 7-SITS - EARTHY BRASS MATT", null, "Laddhybrid", 6915, 1000, 995, 59, "Danderyd", [59.4, 18.04], "258286/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Santa Fe", "Santa Fe 2,99%", null, "Laddhybrid", 6916, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "255818/pc-nc-hyundai-santa-fe-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL HYBRID HEV", "tucson", "Laddhybrid", 3395, 1000, 995, 60, "Södertälje", [59.2, 17.63], "261148/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL HYBRID HEV - ABYSS BLACK PEARL", "tucson", "Hybrid", 3395, 1000, 995, 60, "Danderyd", [59.4, 18.04], "239122/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL 2WD HEV HYBRID", "tucson", "Hybrid", 3495, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "260579/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL 2WD HEV HYBRID", "tucson", "Hybrid", 3495, 1000, 995, 60, "Danderyd", [59.4, 18.04], "259021/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson HYBRID ESSENTIAL 2WD HEDIN-EDITION", "tucson", "Hybrid", 3495, 1000, 995, 60, "Kista", [59.4, 17.94], "258758/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL HYBRID HEV 239Hk", "tucson", "Laddhybrid", 3495, 1000, 995, 60, "Danderyd", [59.4, 18.04], "245501/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL PHEV", "tucson", "Laddhybrid", 3595, 1000, 995, 60, "Södertälje", [59.2, 17.63], "261151/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson HEV AWD", "tucson", "Hybrid", 3595, 1000, 995, 60, "Danderyd", [59.4, 18.04], "260606/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL 1.6 HYBRID HEV 239Hk 4WD", "tucson", "Hybrid", 3595, 1000, 995, 59, "Danderyd", [59.4, 18.04], "249384/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Plug-in hybrid AWD", "tucson", "Laddhybrid", 3695, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "260576/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson", "tucson", "Laddhybrid", 3695, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "260571/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Plug-in Hybrid 2wd Essential", "tucson", "Laddhybrid", 3695, 1000, 995, 60, "Södertälje", [59.2, 17.63], "260331/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Plug-in Hybrid 2wd Essential", "tucson", "Laddhybrid", 3695, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "253515/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV ESSENTIAL 2WD HEDIN-EDITION", "tucson", "Hybrid", 3695, 1000, 995, 60, "Kista", [59.4, 17.94], "250575/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PLUG-IN HYBRID ESSENTIAL HEDIN-EDITION", "tucson", "Laddhybrid", 3695, 1000, 995, 60, "Kista", [59.4, 17.94], "250018/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Essential", "tucson", "Laddhybrid", 3695, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "238140/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV AWD", "tucson", "Laddhybrid", 3795, 1000, 995, 60, "Danderyd", [59.4, 18.04], "260616/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV 4WD Essential", "tucson", "Laddhybrid", 3795, 3000, 995, 60, "Södertälje", [59.2, 17.63], "260147/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV", "tucson", "Laddhybrid", 3795, 1000, 995, 60, "Danderyd", [59.4, 18.04], "259815/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV 4WD Essential", "tucson", "Laddhybrid", 3795, 1000, 995, 60, "Mölndal", [57.66, 12.01], "259616/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Fast Månadskostnad - Plug-in Hybrid - AWD", "tucson", "Laddhybrid", 3795, 1000, 995, 60, "Danderyd", [59.4, 18.04], "259141/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Plug-in hybrid AWD Essential", "tucson", "Laddhybrid", 3795, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "254441/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV ESSENTIAL 4WD HEDIN-EDITION", "tucson", "Hybrid", 3795, 1000, 995, 60, "Kista", [59.4, 17.94], "250577/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PLUG-IN HYBRID 4WD HEDIN-EDITION", "tucson", "Laddhybrid", 3795, 1000, 995, 60, "Kista", [59.4, 17.94], "250019/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PLUG-IN HYBRID Essential 4WD HEDIN-EDITION", "tucson", "Hybrid", 3795, 1000, 995, 60, "Kista", [59.4, 17.94], "250016/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson ESSENTIAL PLUG-IN HYBRID AWD 288Hk", "tucson", "Laddhybrid", 3795, 1000, 995, 60, "Danderyd", [59.4, 18.04], "247078/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV 1.6T 288hk 4WD HEDIN-EDITION", "tucson", "Laddhybrid", 3795, 1000, 995, 60, "Kista", [59.4, 17.94], "246745/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson", "tucson", "Laddhybrid", 3895, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "257905/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Plug-in Hybrid 2wd Essential", "tucson", "Laddhybrid", 3895, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "251279/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV", "tucson", "Laddhybrid", 3975, 1000, 995, 60, "Danderyd", [59.4, 18.04], "255023/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Plug-in hybrid AWD Essential", "tucson", "Laddhybrid", 3995, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "255790/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Plug-in Hybrid 4wd Essential", "tucson", "Laddhybrid", 3995, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "253511/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson Essential - Plug-in Hybrid - AWD", "tucson", "Laddhybrid", 3995, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "231424/pc-nc-hyundai-tucson-2026", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV 2WD", "tucson", "Laddhybrid", 4075, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "237738/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV 2WD Essential", "tucson", "El", 4395, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "237736/pc-nc-hyundai-tucson-2027", 1, "", 1),
      HD("Hyundai", "Tucson", "Tucson PHEV 2WD", "tucson", "Laddhybrid", 4395, 3000, 995, 60, "Segeltorp", [59.28, 17.94], "237723/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PHEV 4WD", "tucson", "Bensin", 4465, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "237739/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PLUG-IN HYBRID ADVANCED 288HK HEDIN-EDITION", "tucson", "Hybrid", 4495, 1000, 995, 60, "Kista", [59.4, 17.94], "246155/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson PLUG-IN HYBRID 4WD ADVANCED HEDIN-EDITION", "tucson", "Laddhybrid", 4495, 1000, 995, 60, "Kista", [59.4, 17.94], "246662/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "Tucson", "Tucson N Line", "tucson", "Laddhybrid", 5284, 1000, 995, 60, "Danderyd", [59.4, 18.04], "252938/pc-nc-hyundai-tucson-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 Essential - Manuell 2,99% i", "i20", "Bensin", 2395, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "245702/pc-nc-hyundai-i20-2026", 1, "", 0),
      HD("Hyundai", "i20", "i20 1.0 T-GDI", "i20", "Bensin", 2595, 1000, 995, 60, "Södertälje", [59.2, 17.63], "258955/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 ESSENTIAL Manuell 1.0 T-GDI", "i20", "Bensin", 2595, 1000, 995, 60, "Kista", [59.4, 17.94], "247046/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 Automat", "i20", "Bensin", 2895, 1000, 995, 60, "Danderyd", [59.4, 18.04], "260356/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20", "i20", "Bensin", 2895, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "257904/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 2,99% I", "i20", "Bensin", 2895, 1000, 995, 59, "Segeltorp", [59.28, 17.94], "256544/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 2,99%", "i20", "Bensin", 2895, 1000, 995, 60, "Danderyd", [59.4, 18.04], "247229/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 ESSENTIAL AUTOMAT 1.0 T-GDI DCT 2.99%", "i20", "Bensin", 2895, 1000, 995, 60, "Kista", [59.4, 17.94], "247068/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 1.0 T-GDI DCT AUT ADVANCED", "i20", "Bensin", 2995, 1000, 995, 60, "Kista", [59.4, 17.94], "257930/pc-nc-hyundai-i20-2027", 1, "", 0),
      HD("Hyundai", "i20", "i20 2,99%", "i20", "Bensin", 3095, 1000, 995, 60, "Mölndal", [57.66, 12.01], "251255/pc-nc-hyundai-i20-2026", 1, "", 0),
      HD("Kia", "EV2", "EV2 42,2 kWh", "ev2", "El", 3495, 1000, 995, 59, "Hisings Kärra", null, "256608/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 SR 5-SITS", "ev2", "El", 3495, 1000, 995, 59, "Hisings Kärra", null, "256607/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 STANDARD RANGE *SNABB", "ev2", "El", 3495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "255370/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 SR 5-SITS", "ev2", "El", 3495, 1000, 995, 59, "Hisings Kärra", null, "254722/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 SR 5-SITS - Omedelbar", "ev2", "El", 3495, 1000, 995, 59, "Hisings Kärra", null, "252934/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 SR 5-SITS", "ev2", "El", 3495, 1000, 995, 59, "Jönköping", [57.78, 14.16], "246798/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 SR 42.2 kWh", "ev2", "El", 3495, 1000, 995, 59, "Hisings Kärra", null, "247194/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 Standard range", "ev2", "El", 3495, 1000, 995, 59, "Hisings Kärra", null, "246245/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 Standard range 5-sits", "ev2", "El", 3495, 1000, 995, 59, "Hisings Kärra", null, "245549/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 Standard range 5-sits", "ev2", "El", 3495, 1000, 995, 59, "Alingsås", null, "244567/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2", "ev2", "El", 3495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "224075/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 STANDARD *Beställningsbar", "ev2", "El", 3495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "228211/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 5 sits Standard Range", "ev2", "El", 3495, 1000, 995, 59, "Värnamo", null, "227995/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 standard", "ev2", "El", 3495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "227036/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 Plus 42,2 kWh FWD", "ev2", "El", 3495, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "226727/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 Standard Range", "ev2", "El", 3495, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "226431/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 Standard Range 5-sits", "ev2", "El", 3495, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "226266/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 STANDARD *Beställningsbar", "ev2", "El", 3495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "226255/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 Standard", "ev2", "El", 3495, 1000, 595, 55, "Borås", [57.72, 12.94], "226249/pc-nc-kia-ev2-2026", 0, "", 1),
      HD("Kia", "EV2", "EV2 Standard range", "ev2", "El", 3495, 1500, 995, 59, "Halmstad", [56.67, 12.86], "226224/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 Standard Range", "ev2", "El", 3495, 1000, 995, 59, "Ängelholm", null, "226199/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 Standard Range", "ev2", "El", 3495, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "225492/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 Standard Range", "ev2", "El", 3495, 1000, 995, 59, "Alingsås", null, "223873/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 5-SITS", "ev2", "El", 3695, 1000, 995, 59, "Jönköping", [57.78, 14.16], "255259/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 5-SITS", "ev2", "El", 3695, 1000, 995, 59, "Hisings Kärra", null, "256610/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 5-SITS", "ev2", "El", 3695, 1000, 995, 59, "Mölndal", [57.66, 12.01], "247386/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 SR, PLUS", "ev2", "El", 3695, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246901/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR", "ev2", "El", 3695, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246634/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR", "ev2", "El", 3695, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "245855/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 5-SITS", "ev2", "El", 3695, 1000, 995, 59, "Alingsås", null, "238249/pc-nc-kia-ev2-2026", 0, "", 1),
      HD("Kia", "EV2", "EV2 Plus SR 5-sits", "ev2", "El", 3695, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "230336/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 LONG RANGE", "ev2", "El", 3795, 1000, 995, 59, "Alingsås", null, "248159/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 5-SITS", "ev2", "El", 3795, 1000, 995, 59, "Hisings Kärra", null, "243926/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 4-SITS", "ev2", "El", 3795, 1000, 995, 59, "Alingsås", null, "238251/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 5-SITS", "ev2", "El", 3795, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "236930/pc-nc-kia-ev2-2026", 0, "", 1),
      HD("Kia", "EV2", "EV2", "ev2", "El", 3795, 1000, 995, 59, "Danderyd", [59.4, 18.04], "235495/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 5-SITS", "ev2", "El", 3795, 1000, 995, 59, "Danderyd", [59.4, 18.04], "229711/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS 5-Sits Standard Range", "ev2", "El", 3795, 1000, 995, 59, "Värnamo", null, "227982/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 Plus Standard Range 5-Sits", "ev2", "El", 3795, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "226432/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 4-SITS", "ev2", "El", 3895, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "237259/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 4-SITS", "ev2", "El", 3895, 1000, 995, 59, "Hisings Kärra", null, "236389/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS 4-sits", "ev2", "El", 3895, 1000, 995, 59, "Hisings Kärra", null, "235476/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS 4 SITS", "ev2", "El", 3895, 1000, 995, 59, "Danderyd", [59.4, 18.04], "234492/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 4-SITS", "ev2", "El", 3895, 1000, 995, 59, "Danderyd", [59.4, 18.04], "229713/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS SR 4-SITS *LANSERINGS", "ev2", "El", 3895, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "229216/pc-nc-kia-ev2-2026", 0, "", 1),
      HD("Kia", "EV2", "EV2 pluspaket", "ev2", "El", 3895, 1000, 995, 59, "Mölndal", [57.66, 12.01], "228256/pc-nc-kia-ev2-2026", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS 4-SITS", "ev2", "El", 3895, 1000, 995, 59, "Alingsås", null, "228230/pc-nc-kia-ev2-2026", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS 4-Sits Standard Range", "ev2", "El", 3895, 1000, 995, 59, "Värnamo", null, "227975/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 LONG RANGE PLUS", "ev2", "El", 3995, 1000, 995, 59, "Alingsås", null, "248157/pc-nc-kia-ev2-2026", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS LONG RANGE/SUPER", "ev2", "El", 3995, 1000, 995, 59, "Danderyd", [59.4, 18.04], "247376/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 PLUS LONGRANGE", "ev2", "El", 3995, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246900/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 LONG RANGE", "ev2", "El", 4195, 1000, 995, 59, "Hisings Kärra", null, "259581/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 LONG RANGE *SNABB", "ev2", "El", 4195, 1000, 995, 59, "Hisings Kärra", null, "256609/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 Long Range 5-SITS", "ev2", "El", 4195, 1000, 995, 59, "Mölndal", [57.66, 12.01], "247738/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 Long Range", "ev2", "El", 4195, 1000, 995, 59, "Borås", [57.72, 12.94], "233074/pc-nc-kia-ev2-2027", 0, "", 1),
      HD("Kia", "EV2", "EV2 LONG RANGE", "ev2", "El", 4195, 1000, 995, 59, "Mölndal", [57.66, 12.01], "230380/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS LONG RANGE", "ev2", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "260439/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS LONG RANGE", "ev2", "El", 4495, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "261058/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS LONG RANGE", "ev2", "El", 4495, 1000, 995, 59, "Halmstad", [56.67, 12.86], "260283/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 PLUS LONG RANGE", "ev2", "El", 4495, 1000, 995, 59, "Jönköping", [57.78, 14.16], "255466/pc-nc-kia-ev2-2027", 1, "", 1),
      HD("Kia", "EV2", "EV2 GT-LINE LONGRANGE", "ev2", "El", 5195, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246640/pc-nc-kia-ev2-2027", 1, "", 0),
      HD("Kia", "EV2", "EV2 GT LINE LONG RANGE", "ev2", "El", 5595, 1000, 995, 59, "Borås", [57.72, 12.94], "252745/pc-nc-kia-ev2-2027", 0, "", 0),
      HD("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "259778/pc-nc-kia-ev3-2027", 0, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "257448/pc-nc-kia-ev3-2027", 1, "", 1),
      HD("Kia", "EV3", "EV3 FWD LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "256605/pc-nc-kia-ev3-2027", 0, "", 1),
      HD("Kia", "EV3", "EV3 Long Range FWD", "ev3", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "256244/pc-nc-kia-ev3-2027", 1, "", 1),
      HD("Kia", "EV3", "EV3 FWD Long Range *SNABB", "ev3", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "254718/pc-nc-kia-ev3-2027", 0, "", 1),
      HD("Kia", "EV3", "EV3 FWD LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "251163/pc-nc-kia-ev3-2026", 1, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE SNABB", "ev3", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "249360/pc-nc-kia-ev3-2027", 0, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "246854/pc-nc-kia-ev3-2025", 1, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE *Laddkort 15", "ev3", "El", 4495, 1000, 995, 59, "Hisings Kärra", null, "246259/pc-nc-kia-ev3-2027", 0, "", 1),
      HD("Kia", "EV3", "EV3 FWD Long Range", "ev3", "El", 4495, 1000, 995, 59, "Danderyd", [59.4, 18.04], "245873/pc-nc-kia-ev3-2027", 1, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Borås", [57.72, 12.94], "237880/pc-nc-kia-ev3-2027", 0, "", 1),
      HD("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 1000, 995, 59, "Ängelholm", null, "236845/pc-nc-kia-ev3-2027", 1, "", 1),
      HD("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 1000, 995, 59, "Värnamo", null, "230639/pc-nc-kia-ev3-2026", 0, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Alingsås", null, "207371/pc-nc-kia-ev3-2026", 1, "", 1),
      HD("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "203964/pc-nc-kia-ev3-2026", 1, "", 1),
      HD("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "194971/pc-nc-kia-ev3-2025", 1, "", 1),
      HD("Kia", "EV3", "EV3 81.4 kWh Long Range", "ev3", "El", 4495, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "186838/pc-nc-kia-ev3-2026", 0, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "120614/pc-nc-kia-ev3-2026", 0, "", 1),
      HD("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "108347/pc-nc-kia-ev3-2025", 0, "", 1),
      HD("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4695, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "226725/pc-nc-kia-ev3-2025", 0, "", 0),
      HD("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4695, 1000, 995, 59, "Mölndal", [57.66, 12.01], "172842/pc-nc-kia-ev3-2027", 0, "", 0),
      HD("Kia", "EV3", "EV3 PLUS LONG RANGE", "ev3", "El", 4795, 1000, 995, 59, "Hisings Kärra", null, "259648/pc-nc-kia-ev3-2026", 1, "", 0),
      HD("Kia", "EV3", "EV3 PLUS LONGRANGE 4.795", "ev3", "El", 4795, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246934/pc-nc-kia-ev3-2027", 1, "", 0),
      HD("Kia", "EV3", "EV3 LONGRANGE", "ev3", "El", 4795, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "201375/pc-nc-kia-ev3-2027", 0, "", 0),
      HD("Kia", "EV3", "EV3 PLUS FWD Long Range", "ev3", "El", 4795, 1000, 995, 59, "Värnamo", null, "230621/pc-nc-kia-ev3-2026", 0, "", 0),
      HD("Kia", "EV3", "EV3 Long range plus", "ev3", "El", 4795, 1000, 995, 59, "Ängelholm", null, "197986/pc-nc-kia-ev3-2027", 1, "", 0),
      HD("Kia", "EV3", "EV3 PLUS LONG RANGE Long Range Plus", "ev3", "El", 4795, 1000, 995, 59, "Alingsås", null, "97722/pc-nc-kia-ev3-2026", 0, "", 0),
      HD("Kia", "EV3", "EV3 Plus Long range", "ev3", "El", 4995, 1000, 995, 59, "Ängelholm", null, "197977/pc-nc-kia-ev3-2027", 1, "", 0),
      HD("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4995, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "171307/pc-nc-kia-ev3-2026", 0, "", 0),
      HD("Kia", "EV3", "EV3 GT LINE LONG RANGE BUSINESS EDITION", "ev3", "El", 5295, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "247574/pc-nc-kia-ev3-2025", 1, "", 0),
      HD("Kia", "EV3", "EV3 GT LINE LONG RANGE", "ev3", "El", 5295, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "237273/pc-nc-kia-ev3-2026", 1, "", 0),
      HD("Kia", "EV3", "EV3 GT-Line Long range", "ev3", "El", 5295, 1000, 995, 59, "Ängelholm", null, "236593/pc-nc-kia-ev3-2027", 1, "", 0),
      HD("Kia", "EV3", "EV3 GT LINE LONG RANGE", "ev3", "El", 5295, 1000, 995, 59, "Danderyd", [59.4, 18.04], "235091/pc-nc-kia-ev3-2026", 1, "", 0),
      HD("Kia", "EV3", "EV3 GT-LINE", "ev3", "El", 5295, 1000, 995, 59, "Danderyd", [59.4, 18.04], "234652/pc-nc-kia-ev3-2027", 0, "", 0),
      HD("Kia", "EV3", "EV3 GT Line FWD Long Range \"", "ev3", "El", 5295, 1000, 995, 59, "Värnamo", null, "230185/pc-nc-kia-ev3-2026", 0, "", 0),
      HD("Kia", "EV3", "EV3 GT-LINE", "ev3", "El", 5295, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "191315/pc-nc-kia-ev3-2027", 1, "", 0),
      HD("Kia", "EV3", "EV3 GT LINE LONG RANGE - Business Edition", "ev3", "El", 5295, 1000, 995, 59, "Danderyd", [59.4, 18.04], "184589/pc-nc-kia-ev3-2026", 0, "", 0),
      HD("Kia", "EV3", "EV3 GT LINE AWD LONG RANGE", "ev3", "El", 5795, 1000, 995, 59, "Mölndal", [57.66, 12.01], "247388/pc-nc-kia-ev3-2027", 0, "", 0),
      HD("Kia", "EV3", "EV3 GT Line AWD Long Range", "ev3", "El", 5795, 1000, 995, 59, "Värnamo", null, "230634/pc-nc-kia-ev3-2026", 0, "", 0),
      HD("Kia", "EV3", "EV3 BUSINESS EDITION GT LINE LONG RANGE", "ev3", "El", 6095, 1000, 995, 59, "Lysekil", null, "113899/pc-nc-kia-ev3-2026", 0, "", 0),
      HD("Kia", "EV5", "EV5 Long Range Lanserings", "ev5", "El", 6495, 1000, 995, 59, "Ängelholm", null, "207619/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 PLUS FWD LONG RANGE", "ev5", "El", 6995, 1000, 995, 59, "Hisings Kärra", null, "249368/pc-nc-kia-ev5-2026", 0, "", 0),
      HD("Kia", "EV5", "EV5 PLUS FWD LONG RANGE", "ev5", "El", 6995, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246876/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 PLUS FWD LONG RANGE", "ev5", "El", 6995, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "237260/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 Plus Long Range FWD", "ev5", "El", 6995, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "227204/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT-LINE", "ev5", "El", 6995, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "222049/pc-nc-kia-ev5-2026", 0, "", 0),
      HD("Kia", "EV5", "EV5 Plus Long range *Lanserings", "ev5", "El", 6995, 1000, 995, 59, "Ängelholm", null, "207618/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 PLUS FWD LONG RANGE", "ev5", "El", 6995, 1000, 995, 59, "Alingsås", null, "207361/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 PLUS AWD LONG RANGE", "ev5", "El", 7295, 1000, 995, 59, "Mölndal", [57.66, 12.01], "256822/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE FWD LONG RANGE", "ev5", "El", 7495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "260204/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE FWD LONG RANGE", "ev5", "El", 7495, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "258173/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE AWD LONG RANGE *Business Edition", "ev5", "El", 7495, 1000, 995, 59, "Hisings Kärra", null, "243721/pc-nc-kia-ev5-2026", 0, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE PANORAMA FWD LONG RANGE", "ev5", "El", 7495, 1000, 995, 59, "Hisings Kärra", null, "234724/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT-LINE", "ev5", "El", 7495, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "205481/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT-Line Long Range Business Edition", "ev5", "El", 7495, 1000, 995, 59, "Ängelholm", null, "204741/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE PANORAMA FWD LONG RANGE *BUSINESS EDITION", "ev5", "El", 7595, 1000, 995, 59, "Hisings Kärra", null, "255362/pc-nc-kia-ev5-2026", 0, "", 0),
      HD("Kia", "EV5", "EV5 GT-LINE PANORAMA", "ev5", "El", 7595, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246653/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE PANORAMA FWD LONG RANGE", "ev5", "El", 7595, 1000, 995, 59, "Hisings Kärra", null, "234719/pc-nc-kia-ev5-2025", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE PANORAMA FWD LONG RANGE", "ev5", "El", 7595, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "222085/pc-nc-kia-ev5-2026", 0, "", 0),
      HD("Kia", "EV5", "EV5", "ev5", "El", 7795, 1000, 995, 59, "Hisings Kärra", null, "248932/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE AWD LONG RANGE", "ev5", "El", 7795, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "246878/pc-nc-kia-ev5-2026", 1, "", 0),
      HD("Kia", "EV5", "EV5 GT LINE AWD LONG RANGE", "ev5", "El", 7995, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "242641/pc-nc-kia-ev5-2026", 0, "", 0),
      HD("Kia", "EV6", "EV6 GT LINE AWD 325 HK", null, "El", 9595, 1000, 995, 59, "Alingsås", null, "121765/pc-nc-kia-ev6-2026", 0, "", 0),
      HD("Kia", "K4", "K4 Action", null, "Bensin", 3595, 1000, 995, 59, "Hisings Kärra", null, "259605/pc-nc-kia-k4-2027", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0 T-GDI 115HP MT6 ACTION", null, "Bensin", 3595, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "255458/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0 T-GDI 115HP MT6 ACTION", null, "Bensin", 3595, 1000, 995, 59, "Alingsås", null, "244565/pc-nc-kia-k4-2027", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T MANUELL ACTION", null, "Bensin", 3595, 1000, 995, 59, "Alingsås", null, "237134/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0 T-GDi MT6 Action", null, "Bensin", 3595, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "232832/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T-GDi Action", null, "Bensin", 3595, 1000, 995, 59, "Värnamo", null, "231713/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T ACTION", null, "Bensin", 3595, 1000, 995, 59, "Mölndal", [57.66, 12.01], "230620/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 Action", null, "Bensin", 3595, 3000, 995, 59, "Halmstad", [56.67, 12.86], "219907/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T-GDi Action * Finns nu för provkörning", null, "Bensin", 3595, 1000, 595, 55, "Borås", [57.72, 12.94], "226228/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 Action", null, "Bensin", 3595, 1000, 995, 59, "Alingsås", null, "222775/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T-GDi Action", null, "Bensin", 3595, 1000, 995, 59, "Ängelholm", null, "219669/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T-GDi Action", null, "Bensin", 3595, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "219512/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 Action", null, "Bensin", 3895, 1000, 995, 59, "Hisings Kärra", null, "259627/pc-nc-kia-k4-2027", 1, "", 0),
      HD("Kia", "K4", "K4", null, "Hybrid", 3895, 1000, 995, 59, "Hisings Kärra", null, "257860/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T AUT ACTION", null, "Bensin", 3895, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "237269/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T-GDi Action", null, "Bensin", 3895, 1000, 995, 59, "Värnamo", null, "231714/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 ACTION mHEV", null, "Bensin", 3895, 1000, 995, 59, "Mölndal", [57.66, 12.01], "230597/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 Action MHEV", null, "Bensin", 3895, 1000, 995, 59, "Alingsås", null, "222776/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T AUT ACTION", null, "Bensin", 3895, 1000, 995, 59, "Ängelholm", null, "219672/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.0T AUT ACTION", null, "Hybrid", 4295, 1000, 995, 59, "Kista", [59.4, 17.94], "261105/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE *Lager", null, "Bensin", 4495, 1000, 995, 59, "Ängelholm", null, "259479/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "257476/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Halmstad", [56.67, 12.86], "256679/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "256819/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "256820/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "256276/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Jönköping", [57.78, 14.16], "251625/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Alingsås", null, "237135/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 150HP DCT ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Hisings Kärra", null, "237133/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 Advance 1.6 T-GDI 150 HK DCT", null, "Bensin", 4495, 1000, 995, 59, "Borås", [57.72, 12.94], "233909/pc-nc-kia-k4-2027", 0, "", 0),
      HD("Kia", "K4", "K4 ADVANCE", null, "Bensin", 4495, 1000, 995, 59, "Mölndal", [57.66, 12.01], "230603/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 180HP DCT GT LINE", null, "Bensin", 4995, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "260072/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 180HP DCT GT LINE *Lager", null, "Bensin", 4995, 1000, 995, 59, "Ängelholm", null, "259480/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 180HP DCT GT LINE", null, "Bensin", 4995, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "255459/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 180HP DCT GT LINE", null, "Bensin", 4995, 1000, 995, 59, "Jönköping", [57.78, 14.16], "251624/pc-nc-kia-k4-2026", 1, "", 0),
      HD("Kia", "K4", "K4 180HP DCT GT LINE *LAGER", null, "Bensin", 4995, 1000, 995, 59, "Borås", [57.72, 12.94], "237560/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 SW 1.6 T-GDI 180HP DCT GT LINE", null, "Bensin", 4995, 1000, 995, 59, "Hisings Kärra", null, "237132/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "K4", "K4 GT-LINE", null, "Bensin", 4995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "230624/pc-nc-kia-k4-2026", 0, "", 0),
      HD("Kia", "Niro", "Niro PLUG-IN ACTION", null, "Laddhybrid", 4795, 1000, 995, 59, "Hisings Kärra", null, "245101/pc-nc-kia-niro-2026", 0, "", 0),
      HD("Kia", "Niro", "NIRO PLUG-IN ADVANCE", null, "Laddhybrid", 5195, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "237270/pc-nc-kia-niro-2025", 1, "", 0),
      HD("Kia", "Picanto", "PICANTO 1.0 GDI AMT ACTION", "picanto", "Bensin", 2995, 1000, 995, 59, "Halmstad", [56.67, 12.86], "238366/pc-nc-kia-picanto-2026", 1, "", 0),
      HD("Kia", "Picanto", "Picanto 1.0 GDI ACTION", "picanto", "Bensin", 2995, 1000, 995, 59, "Danderyd", [59.4, 18.04], "223102/pc-nc-kia-picanto-2026", 1, "", 0),
      HD("Kia", "Picanto", "Picanto ADVANCE", "picanto", "Bensin", 2995, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "206111/pc-nc-kia-picanto-2025", 1, "", 0),
      HD("Kia", "Picanto", "Picanto 1.0 GDI Action", "picanto", "Bensin", 3045, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "217744/pc-nc-kia-picanto-2026", 1, "", 0),
      HD("Kia", "Picanto", "PICANTO 1.0 GDI AMT ACTION", "picanto", "Bensin", 3095, 1000, 995, 59, "Jönköping", [57.78, 14.16], "226907/pc-nc-kia-picanto-2026", 1, "", 0),
      HD("Kia", "Picanto", "Picanto 1.0 GDI AMT ACTION", "picanto", "Bensin", 3095, 1000, 995, 59, "Hisings Kärra", null, "244555/pc-nc-kia-picanto-2026", 0, "", 0),
      HD("Kia", "Picanto", "PICANTO 1.0 GDI AMT ACTION", "picanto", "Bensin", 3145, 3000, 995, 59, "Trelleborg", null, "260249/pc-nc-kia-picanto-2027", 1, "", 0),
      HD("Kia", "Picanto", "Picanto AMT 1.0 Action", "picanto", "Bensin", 3164, 1000, 995, 59, "Alingsås", null, "121751/pc-nc-kia-picanto-2026", 0, "", 0),
      HD("Kia", "Picanto", "Picanto Action", "picanto", "Bensin", 3166, 1000, 995, 59, "Ängelholm", null, "170957/pc-nc-kia-picanto-2026", 1, "", 0),
      HD("Kia", "Picanto", "Picanto ACTION AUTOMAT", "picanto", "Bensin", 3495, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "222061/pc-nc-kia-picanto-2025", 0, "", 0),
      HD("Kia", "Seltos", "Seltos 1.6 T-GDI DCT FWD", "seltos", "Bensin", 3895, 1000, 995, 59, "Hisings Kärra", null, "252768/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "SELTOS", "seltos", "Bensin", 3895, 1000, 995, 59, "Hisings Kärra", null, "258247/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos ACTION 1.6 T-GDI DCT FWD", "seltos", "Bensin", 3895, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "250583/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos ACTION 1.6 T-GDI DCT *SNABB", "seltos", "Bensin", 3895, 1000, 995, 59, "Hisings Kärra", null, "250300/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "SELTOS ACTION 1.6 T-GDI DCT FWD", "seltos", "Bensin", 3895, 1000, 995, 59, "Hisings Kärra", null, "250298/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos ACTION Automat", "seltos", "Bensin", 3895, 1000, 995, 59, "Alingsås", null, "248160/pc-nc-kia-seltos-2027", 0, "", 0),
      HD("Kia", "Seltos", "Seltos ADVANCE 1.6 T-GDI DCT FWD", "seltos", "Bensin", 4095, 1000, 995, 59, "Hisings Kärra", null, "259630/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos ADVANCE 1.6 T-GDI DCT FWD", "seltos", "Bensin", 4095, 1000, 995, 59, "Borås", [57.72, 12.94], "252748/pc-nc-kia-seltos-2027", 0, "", 0),
      HD("Kia", "Seltos", "SELTOS ADVANCE 1.6 T-GDI DCT FWD", "seltos", "Bensin", 4095, 1000, 995, 59, "Hisings Kärra", null, "249647/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos ADVANCE 1.6 T-GDI DCT FWD. LAGER", "seltos", "Bensin", 4095, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "241699/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos ADVANCE", "seltos", "Bensin", 4095, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "245862/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos ADVANCE 1.6 T-GDI DCT FWD", "seltos", "Bensin", 4095, 1000, 995, 59, "Mölndal", [57.66, 12.01], "241860/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos X-LINE 1.6 T-GDI DCT AWD", "seltos", "Bensin", 4995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "242374/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos X-LINE 1.6 T-GDI DCT AWD", "seltos", "Bensin", 4995, 1000, 995, 59, "Borås", [57.72, 12.94], "252750/pc-nc-kia-seltos-2027", 0, "", 0),
      HD("Kia", "Seltos", "SELTOS X-LINE 1.6 T-GDI DCT AWD", "seltos", "Bensin", 4995, 1000, 995, 59, "Jönköping", [57.78, 14.16], "249256/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos X-LINE AWD. LAGER", "seltos", "Bensin", 4995, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "245861/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos X-LINE 1.6 T-GDI DCT AWD", "seltos", "Bensin", 4995, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "241717/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos X-LINE 1.6 T-GDI DCT AWD", "seltos", "Bensin", 4995, 1000, 995, 59, "Hisings Kärra", null, "245097/pc-nc-kia-seltos-2027", 0, "", 0),
      HD("Kia", "Seltos", "Seltos X-LINE 1.6 T-GDI DCT AWD", "seltos", "Bensin", 4995, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "241547/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Seltos", "Seltos X-Line 1.6 T. AWD", "seltos", "Bensin", 4995, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "241853/pc-nc-kia-seltos-2027", 0, "", 0),
      HD("Kia", "Seltos", "Seltos X-LINE PANORAMA 1.6 T-GDI DCT AWD", "seltos", "Bensin", 5095, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "259153/pc-nc-kia-seltos-2027", 1, "", 0),
      HD("Kia", "Sorento", "Sorento PHEV AWD ADVANCE PLUS", "sorento", "Laddhybrid", 7845, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "234297/pc-nc-kia-sorento-2026", 1, "", 0),
      HD("Kia", "Sorento", "Sorento 1.6 T-GDI Plug-in Hybrid AWD Advance *pris kia billån", "sorento", "Laddhybrid", 8445, 1000, 995, 59, "Trelleborg", null, "221570/pc-nc-kia-sorento-2026", 1, "", 0),
      HD("Kia", "Sorento", "Sorento ADVANCE PLUS PHEV AWD", "sorento", "Laddhybrid", 8845, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "242392/pc-nc-kia-sorento-2027", 1, "", 0),
      HD("Kia", "Sorento", "Sorento PHEV AWD ADVANCE PLUS", "sorento", "Laddhybrid", 8845, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "237272/pc-nc-kia-sorento-2026", 1, "", 0),
      HD("Kia", "Sorento", "Sorento PHEV ADVANCE PLUS PANORAMA *BUSINESS EDITION", "sorento", "Laddhybrid", 9045, 1000, 995, 59, "Hisings Kärra", null, "259377/pc-nc-kia-sorento-2027", 0, "", 0),
      HD("Kia", "Sorento", "Sorento PHEV AUT AWD ADVANCE PLUS PANORAMA", "sorento", "Laddhybrid", 9045, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "247475/pc-nc-kia-sorento-2027", 1, "", 0),
      HD("Kia", "Sorento", "Sorento PHEV ADVANCE PLUS PANO", "sorento", "Laddhybrid", 9045, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "242527/pc-nc-kia-sorento-2027", 1, "", 0),
      HD("Kia", "Sorento", "Sorento ADVANCE PLUS PANORAMA AWD", "sorento", "Laddhybrid", 9045, 1000, 995, 59, "Hisings Kärra", null, "234285/pc-nc-kia-sorento-2026", 0, "", 0),
      HD("Kia", "Sportage", "Sportage PHEV 288HK AWD AUT Advance", "sportage", "Laddhybrid", 4695, 1000, 995, 59, "Alingsås", null, "228511/pc-nc-kia-sportage-2027", 1, "", 0),
      HD("Kia", "Sportage", "SPORTAGE PHEV GT LINE", "sportage", "Laddhybrid", 5595, 1000, 995, 59, "Hisings Kärra", null, "261214/pc-nc-kia-sportage-2027", 1, "", 0),
      HD("Kia", "Sportage", "SPORTAGE PHEV GT LINE *2,99%", "sportage", "Laddhybrid", 5595, 1000, 995, 59, "Mölndal", [57.66, 12.01], "245348/pc-nc-kia-sportage-2026", 1, "", 0),
      HD("Kia", "Sportage", "Sportage GT Line", "sportage", "Laddhybrid", 5595, 1000, 995, 59, "Värnamo", null, "231653/pc-nc-kia-sportage-2026", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid PHEV ACTION *FRIA VINTERHJUL* *2.99%", null, "Laddhybrid", 4695, 1000, 995, 59, "Hisings Kärra", null, "259631/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid ACTION *FRIA VINTERHJUL* 2,99%", null, "Laddhybrid", 4695, 1000, 995, 59, "Hisings Kärra", null, "257114/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid PHEV ACTION *FRIA VINTERHJUL* 2,99%", null, "Laddhybrid", 4695, 1000, 995, 59, "Borås", [57.72, 12.94], "257103/pc-nc-kia-sportage-plug-in-hybrid-2027", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid SPORTAGE PHEV ACTION", null, "Laddhybrid", 4695, 1000, 995, 59, "Hisings Kärra", null, "254881/pc-nc-kia-sportage-plug-in-hybrid-2027", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid ACTION", null, "Laddhybrid", 4695, 1000, 995, 59, "Hisings Kärra", null, "251369/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid ACTION *V-HJUL INGÅR & 2,99%", null, "Laddhybrid", 4695, 1000, 995, 59, "Kista", [59.4, 17.94], "249409/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid Action", null, "Hybrid", 4695, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "226264/pc-nc-kia-sportage-plug-in-hybrid-2026", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid ADVANCE", null, "Laddhybrid", 4995, 1000, 995, 59, "Hisings Kärra", null, "249573/pc-nc-kia-sportage-plug-in-hybrid-2027", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid ADVANCE *Fria Vinterhjul", null, "Laddhybrid", 4995, 1000, 995, 59, "Hisings Kärra", null, "246425/pc-nc-kia-sportage-plug-in-hybrid-2027", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid Advance *2,99%", null, "Laddhybrid", 4995, 1000, 995, 59, "Ängelholm", null, "229403/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid Advance", null, "Laddhybrid", 4995, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "225973/pc-nc-kia-sportage-plug-in-hybrid-2026", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid PHEV GT LINE", null, "Laddhybrid", 4995, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "222064/pc-nc-kia-sportage-plug-in-hybrid-2026", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT LINE PHEV AUT AWD", null, "Laddhybrid", 5595, 1000, 995, 59, "Borås", [57.72, 12.94], "257267/pc-nc-kia-sportage-plug-in-hybrid-2027", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT LINE *V-HJUL INGÅR & 2,99%", null, "Laddhybrid", 5595, 1000, 995, 59, "Kista", [59.4, 17.94], "250847/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid PHEV GT LINE", null, "Laddhybrid", 5595, 1000, 995, 59, "Hisings Kärra", null, "246619/pc-nc-kia-sportage-plug-in-hybrid-2027", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT-LINE /SUPER", null, "Laddhybrid", 5595, 1000, 995, 59, "Danderyd", [59.4, 18.04], "245853/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT Line", null, "Hybrid", 5595, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "226235/pc-nc-kia-sportage-plug-in-hybrid-2026", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT-Line", null, "Laddhybrid", 5595, 1000, 995, 59, "Ängelholm", null, "213292/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid PHEV GT LINE PANORAMA TWO COLOR Fria V-Hjul & 2,99%", null, "Laddhybrid", 5895, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "260079/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT LINE PANORAMA BUSINESS EDITION* FRIA VINTERHJUL", null, "Laddhybrid", 5895, 1000, 995, 59, "Hisings Kärra", null, "260234/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT-LINE PANORAMA BUSINESS EDITION* SNABB", null, "Laddhybrid", 5895, 1000, 995, 59, "Hisings Kärra", null, "259848/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT-LINE PANORAMA", null, "Laddhybrid", 5895, 1000, 995, 59, "Hisings Kärra", null, "260182/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid SPORTAGE PHEV GT LINE", null, "Laddhybrid", 5895, 1000, 995, 59, "Mölndal", [57.66, 12.01], "256627/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT LINE PANORAMA 2.99%! FRIA VINTERHJUL", null, "Laddhybrid", 5895, 1000, 995, 59, "Hisings Kärra", null, "259846/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT LINE PANORAMA 2-COLOR *FRIA VINTERHJUL", null, "Laddhybrid", 5895, 1000, 995, 59, "Hisings Kärra", null, "259120/pc-nc-kia-sportage-plug-in-hybrid-2027", 0, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT LINE PANORAMA AWD AUT \"2,99%", null, "Laddhybrid", 5895, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "253026/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid PHEV GT LINE PANORAMA TWO COLOR", null, "Laddhybrid", 5895, 1000, 995, 59, "Kungsbacka", [57.49, 12.08], "256285/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GTLine Panorama / 2,99%", null, "Laddhybrid", 5895, 1000, 995, 59, "Jönköping", [57.78, 14.16], "249489/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT LINE PANORAMA TWO COLOR \"", null, "Laddhybrid", 5895, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "247481/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Sportage Plug-In Hybrid", "Sportage Plug-In Hybrid GT-Line *2,99%", null, "Laddhybrid", 5995, 1000, 995, 59, "Ängelholm", null, "209283/pc-nc-kia-sportage-plug-in-hybrid-2027", 1, "", 0),
      HD("Kia", "Stonic", "Stonic 1.0T AUT ADVANCE", "stonic", "Bensin", 3295, 1000, 995, 59, "Kista", [59.4, 17.94], "261104/pc-nc-kia-stonic-2027", 1, "", 0),
      HD("Kia", "Stonic", "Stonic Action", "stonic", "Bensin", 3295, 1000, 995, 59, "Alingsås", null, "232808/pc-nc-kia-stonic-2026", 1, "", 0),
      HD("Kia", "Stonic", "Stonic Advance Hybrid *LANSERINGS", "stonic", "Hybrid", 3295, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "222070/pc-nc-kia-stonic-2026", 0, "", 0),
      HD("Kia", "Stonic", "Stonic ACTION *LANSERINGS", "stonic", "Bensin", 3295, 1000, 995, 59, "Norrtälje", [59.76, 18.7], "222080/pc-nc-kia-stonic-2026", 0, "", 0),
      HD("Kia", "Stonic", "Stonic PE2 1.0 T-GDI MHEV DCT ADVANCE *Lanserings", "stonic", "Bensin", 3295, 1000, 995, 59, "Alingsås", null, "221931/pc-nc-kia-stonic-2026", 0, "", 0),
      HD("Kia", "Stonic", "STONIC 1.0 T-GDI DCT ACTION", "stonic", "Bensin", 3495, 1000, 995, 59, "Danderyd", [59.4, 18.04], "257318/pc-nc-kia-stonic-2026", 1, "", 0),
      HD("Kia", "Stonic", "Stonic PE2 1.0 T-GDI MHEV DCT ACTION", "stonic", "Hybrid", 3495, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "217009/pc-nc-kia-stonic-2026", 1, "", 0),
      HD("Kia", "Stonic", "STONIC PE2 1.0 T-GDI MHEV DCT ADVANCE", "stonic", "Hybrid", 3795, 1000, 995, 59, "Hisings Kärra", null, "244617/pc-nc-kia-stonic-2026", 0, "", 0),
      HD("Kia", "Stonic", "Stonic PE2 1.0 T-GDI MHEV DCT ADVANCE", "stonic", "Bensin", 3795, 1000, 995, 59, "Hisings Kärra", null, "237131/pc-nc-kia-stonic-2026", 0, "", 0),
      HD("Kia", "Stonic", "Stonic 1.0 T-GDI DCT Action *Lanserings", "stonic", "Bensin", 4307, 1000, 995, 59, "Ängelholm", null, "209724/pc-nc-kia-stonic-2026", 1, "", 0),
      HD("Kia", "Stonic", "Stonic 1.0 T-GDI MHEV DCT ADVANCE *Lanserings", "stonic", "Bensin", 4589, 1000, 995, 59, "Ängelholm", null, "209723/pc-nc-kia-stonic-2026", 1, "", 0),
      HD("MG", "4 EV Urban", "4 EV Urban Comfort 43kWh 160hk 0%", null, "El", 2995, 1000, 0, 0, "Segeltorp", [59.28, 17.94], "260412/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban Comfort 43kWh 160hk", null, "El", 2995, 1000, 0, 0, "Segeltorp", [59.28, 17.94], "259649/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban Comfort", null, "El", 2995, 3000, 0, 0, "Kista", [59.4, 17.94], "258178/pc-nc-mg-4-ev-urban-2026", 0, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban Premium 54kWh 160hk 360º", null, "El", 2995, 1000, 0, 0, "Segeltorp", [59.28, 17.94], "257812/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban Comfort 43 kWh 325km Range Privatlease", null, "El", 2995, 1000, 0, 0, "Eskilstuna", [59.37, 16.51], "256769/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban", null, "El", 2995, 1000, 995, 60, "Varberg", [57.11, 12.25], "244782/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban COMFORT", null, "El", 2995, 1000, 0, 0, "Malmö", [55.6, 13.0], "241830/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban", null, "El", 2995, 1000, 0, 0, "Hisings Kärra", null, "240886/pc-nc-mg-4-ev-urban-2026", 0, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban MG4 Urban", null, "El", 2995, 1000, 995, 60, "Alingsås", null, "234893/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban Urban", null, "El", 2995, 1000, 995, 59, "Varberg", [57.11, 12.25], "234881/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban MG4 EV URBAN PREMIUM 54KWH (BLACK) - COSMIC SILVER", null, "El", 4250, 1000, 995, 60, "Lund", [55.7, 13.19], "259751/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban MG4 EV URBAN PREMIUM", null, "El", 4250, 3000, 995, 59, "Kista", [59.4, 17.94], "258835/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban PREMIUM 54 KWH", null, "El", 4250, 1000, 0, 0, "Mölndal", [57.66, 12.01], "259376/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban PREMIUM 54KWH", null, "El", 4250, 1000, 0, 0, "Malmö", [55.6, 13.0], "254853/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban PREMIUM 54KWH", null, "El", 4250, 1000, 0, 0, "Kristianstad", [56.03, 14.16], "251188/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban URBAN PREMIUM 54KWH", null, "El", 4250, 1000, 0, 0, "Alingsås", null, "250668/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban Premium", null, "El", 4250, 1000, 0, 0, "Varberg", [57.11, 12.25], "248655/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "4 EV Urban", "4 EV Urban PREMIUM 54KWH", null, "El", 4466, 1000, 0, 0, "Kristianstad", [56.03, 14.16], "258177/pc-nc-mg-4-ev-urban-2026", 1, "", 1),
      HD("MG", "S5", "S5 Comfort 49 kWh", null, "El", 4295, 1000, 0, 0, "Jönköping", [57.78, 14.16], "187185/pc-nc-mg-s5-2025", 1, "", 1),
      HD("MG", "S5", "S5 COMFORT 49KWH", null, "El", 4295, 1000, 0, 0, "Västerås", [59.61, 16.55], "187047/pc-nc-mg-s5-2025", 1, "", 1),
      HD("MG", "S5", "S5 EV COMFORT 49 KWH 170Hk", null, "El", 4295, 1000, 0, 0, "Hisings Kärra", null, "245971/pc-nc-mg-s5-2025", 0, "", 1),
      HD("MG", "S5", "S5 Standard Range Comfort 49kWh 170hk", null, "El", 4295, 3000, 0, 0, "Segeltorp", [59.28, 17.94], "242356/pc-nc-mg-s5-2025", 1, "", 1),
      HD("MG", "S5", "S5 COMFORT 49KWH *0%", null, "El", 4295, 1000, 0, 0, "Västerås", [59.61, 16.55], "188458/pc-nc-mg-s5-2025", 1, "", 1),
      HD("MG", "S5", "S5 Comfort 49 kWh", null, "El", 4295, 1000, 0, 0, "Värnamo", null, "187280/pc-nc-mg-s5-2025", 0, "", 1),
      HD("MG", "S5", "S5 EV COM 49KWH", null, "El", 4295, 1000, 0, 0, "Jönköping", [57.78, 14.16], "190960/pc-nc-mg-s5-2025", 1, "", 1),
      HD("MG", "S5", "S5 COMFORT 49 KWH", null, "El", 4295, 1000, 0, 0, "Kristianstad", [56.03, 14.16], "187057/pc-nc-mg-s5-2025", 1, "", 1),
      HD("MG", "S5", "S5 EV COMFORT 49KWH", null, "El", 4295, 1000, 0, 0, "Kista", [59.4, 17.94], "189459/pc-nc-mg-s5-2025", 0, "", 1),
      HD("MG", "S5", "S5 COMFORT 64 KWH", null, "El", 4595, 1000, 0, 0, "Västerås", [59.61, 16.55], "219294/pc-nc-mg-s5-2026", 1, "", 1),
      HD("MG", "S5", "S5 Luxury", null, "El", 4995, 1000, 0, 0, "Alingsås", null, "245545/pc-nc-mg-s5-2025", 1, "", 0),
      HD("MG", "S5", "S5 LUXURY 64 KWH", null, "El", 4995, 1000, 0, 0, "Mölndal", [57.66, 12.01], "242369/pc-nc-mg-s5-2025", 1, "", 0),
      HD("MG", "S6", "S6 EV LUXURY AWD 77KWH (BLACK) - DOVER WHITE", null, "El", 6950, 1000, 995, 59, "Jönköping", [57.78, 14.16], "234816/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 LUXURY AWD 77 KWH", null, "El", 6995, 3000, 995, 59, "Kista", [59.4, 17.94], "258357/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 LUXURY 77 KWH AWD - 0%", null, "El", 6995, 1000, 0, 0, "Västerås", [59.61, 16.55], "257733/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 MGS6 EV Luxury AWD 77kWh 485km WLTP 0%", null, "El", 6995, 1000, 0, 0, "Eskilstuna", [59.37, 16.51], "253448/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 EV LUXURY AWD 77 KWH", null, "El", 6995, 1000, 0, 0, "Borås", [57.72, 12.94], "246663/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 MGS6 EV LUXURY AWD 77KWH", null, "El", 6995, 1000, 995, 59, "Kista", [59.4, 17.94], "245258/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 MGS6 EV LUXURY AWD 77KWH (BLACK) - COSMIC SILVER", null, "El", 6995, 1000, 0, 0, "Varberg", [57.11, 12.25], "239571/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 Luxury AWD 77kWh 362hk", null, "El", 6995, 1000, 0, 0, "Segeltorp", [59.28, 17.94], "242321/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 MGS6 EV LUXURY AWD 77KWH - ARCTIC WHITE 0%", null, "El", 6995, 1000, 0, 0, "Lund", [55.7, 13.19], "238740/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 Luxury", null, "El", 6995, 1000, 0, 0, "Alingsås", null, "241199/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MG", "S6", "S6 EV LUXURY AWD 77KWH", null, "El", 6995, 1000, 0, 0, "Hisings Kärra", null, "238715/pc-nc-mg-s6-2026", 0, "", 0),
      HD("MG", "S6", "S6 LUXURY AWD 77KWH", null, "El", 6995, 1000, 0, 0, "Trollhättan", [58.28, 12.29], "238315/pc-nc-mg-s6-2026", 1, "", 0),
      HD("MINI", "Aceman", "Aceman E Blackyard Backkamera / Apple CarPay", null, "El", 4195, 1000, 595, 55, "Danderyd", [59.4, 18.04], "243123/pc-nc-mini-aceman-2026", 0, "", 1),
      HD("MINI", "Cooper", "Cooper E Blackyard Backkamera / Apple CarPlay", null, "El", 4095, 1000, 595, 55, "Danderyd", [59.4, 18.04], "242332/pc-nc-mini-cooper-2026", 1, "", 1),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250 e AMG Advanced Edition", null, "Laddhybrid", 4995, 1500, 695, 65, "Hisings Kärra", null, "260416/pc-nc-mercedes-benz-a-class-2027", 1, "", 0),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250 e AMG Night", null, "Laddhybrid", 4995, 1500, 695, 65, "Halmstad", [56.67, 12.86], "260138/pc-nc-mercedes-benz-a-class-2027", 1, "", 0),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250 e", null, "Laddhybrid", 4995, 1500, 695, 65, "Uddevalla", [58.35, 11.94], "259364/pc-nc-mercedes-benz-a-class-2027", 1, "", 0),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250e", null, "Laddhybrid", 4995, 1500, 695, 65, "Alingsås", null, "259128/pc-nc-mercedes-benz-a-class-2027", 0, "", 0),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250 e Halvkombi AMG Advanced Edition", null, "Laddhybrid", 4995, 1500, 695, 65, "Varberg", [57.11, 12.25], "255151/pc-nc-mercedes-benz-a-class-2027", 0, "", 0),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250 e", null, "Laddhybrid", 4995, 1500, 695, 65, "Mölndal", [57.66, 12.01], "251049/pc-nc-mercedes-benz-a-class-2027", 0, "", 0),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250 E", null, "Laddhybrid", 4995, 1500, 695, 65, "Västra Frölunda", null, "227250/pc-nc-mercedes-benz-a-class-2026", 1, "", 0),
      HD("Mercedes-Benz", "A-Klass", "A-Klass 250 e AMG Advanced Edition", null, "Laddhybrid", 4995, 1500, 695, 65, "Kungsbacka", [57.49, 12.08], "237749/pc-nc-mercedes-benz-a-class-2027", 1, "", 0),
      HD("Mercedes-Benz", "CLA", "CLA 250+ AMG LINE PLUS", "cla", "El", 6121, 1500, 695, 65, "Västra Frölunda", null, "188503/pc-nc-mercedes-benz-cla-2026", 0, "", 0),
      HD("Mercedes-Benz", "CLA", "CLA 250+ Advanced Edition", "cla", "El", 6141, 1500, 695, 65, "Varberg", [57.11, 12.25], "260401/pc-nc-mercedes-benz-cla-2025", 1, "", 0),
      HD("Mercedes-Benz", "CLA", "CLA 250+ SHOOTING BRAKE *BESTÄLLNING", "cla", "El", 7678, 1500, 695, 65, "Västra Frölunda", null, "223903/pc-nc-mercedes-benz-cla-2027", 1, "", 0),
      HD("Mercedes-Benz", "CLA", "CLA 350 4MATIC Advanced", "cla", "El", 7899, 1500, 695, 65, "Ängelholm", null, "218243/pc-nc-mercedes-benz-cla-2026", 1, "", 0),
      HD("Mercedes-Benz", "GLB", "GLB 250+ Advanced Edition", "glb", "El", 7283, 1500, 695, 65, "Kungsbacka", [57.49, 12.08], "260386/pc-nc-mercedes-benz-glb-2027", 1, "", 0),
      HD("Mercedes-Benz", "GLB", "GLB 250+ Advanced Edition", "glb", "El", 7702, 1500, 695, 65, "Varberg", [57.11, 12.25], "260397/pc-nc-mercedes-benz-glb-2027", 1, "", 0),
      HD("Nissan", "Ariya", "Ariya 63KWH Engage INKL SERVICE", null, "El", 6095, 1000, 995, 59, "Mölndal", [57.66, 12.01], "201480/pc-nc-nissan-ariya-2025", 1, "", 0),
      HD("Nissan", "Ariya", "Ariya Advance 63kwh", null, "El", 6516, 3000, 995, 59, "Helsingborg", [56.05, 12.69], "217028/pc-nc-nissan-ariya-2025", 0, "", 0),
      HD("Nissan", "Ariya", "Ariya Advance 63 KWH 109", null, "El", 6564, 1000, 995, 59, "Kista", [59.4, 17.94], "257677/pc-nc-nissan-ariya-2025", 1, "", 0),
      HD("Nissan", "Ariya", "Ariya 63Khw Advance *3 år fri service// 9000 mil", null, "El", 6564, 1000, 995, 59, "Borås", [57.72, 12.94], "244912/pc-nc-nissan-ariya-2024", 0, "", 0),
      HD("Nissan", "Juke", "Juke N-Connecta P-LEASING", "juke", "Bensin", 2899, 1000, 995, 59, "Kista", [59.4, 17.94], "257814/pc-nc-nissan-juke-2025", 1, "", 0),
      HD("Nissan", "Juke", "Juke", "juke", "Hybrid", 2995, 1000, 995, 59, "Halmstad", [56.67, 12.86], "218122/pc-nc-nissan-juke-2024", 0, "", 0),
      HD("Nissan", "Juke", "Juke DIG-T 114HP 7DCT Acenta", "juke", "Bensin", 2995, 1000, 995, 59, "Alingsås", null, "213826/pc-nc-nissan-juke-2025", 1, "", 0),
      HD("Nissan", "Juke", "Juke Acenta", "juke", "Bensin", 2995, 1000, 995, 59, "Alingsås", null, "209035/pc-nc-nissan-juke-2025", 0, "", 0),
      HD("Nissan", "Juke", "Juke DIG-T 114HP 7DCT Acenta", "juke", "Bensin", 2995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "202003/pc-nc-nissan-juke-2025", 1, "", 0),
      HD("Nissan", "Juke", "Juke DIG-T DCT Acenta", "juke", "Bensin", 2995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "187699/pc-nc-nissan-juke-2025", 1, "", 0),
      HD("Nissan", "Juke", "Juke Acenta / Backkamera / Apple CarPlay / 4 år Service", "juke", "Bensin", 3186, 1000, 995, 59, "Mölndal", [57.66, 12.01], "202007/pc-nc-nissan-juke-2025", 0, "", 0),
      HD("Nissan", "Juke", "Juke DIG-T 114 / 3 års Service / CarPlay & Android Auto", "juke", "Bensin", 3186, 1000, 995, 59, "Mölndal", [57.66, 12.01], "199684/pc-nc-nissan-juke-2025", 0, "", 0),
      HD("Nissan", "Juke", "Juke DIG-T 114 Automat Acenta Plus 0kr Serviceavtal", "juke", "Bensin", 3295, 1000, 995, 59, "Varberg", [57.11, 12.25], "245845/pc-nc-nissan-juke-2027", 0, "", 0),
      HD("Nissan", "Juke", "Juke ACENTA PLUS", "juke", "Bensin", 3295, 3000, 995, 59, "Halmstad", [56.67, 12.86], "243127/pc-nc-nissan-juke-2026", 1, "", 0),
      HD("Nissan", "Juke", "Juke Acenta", "juke", "Bensin", 3295, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "217026/pc-nc-nissan-juke-2025", 0, "", 0),
      HD("Nissan", "Juke", "Juke ACENTA PLUS *Inkl. Serviceavtal", "juke", "Bensin", 3295, 1000, 995, 59, "Alingsås", null, "124619/pc-nc-nissan-juke-2027", 0, "", 0),
      HD("Nissan", "Juke", "Juke 6MT Acenta", "juke", "Bensin", 3295, 1000, 995, 59, "Mölndal", [57.66, 12.01], "117891/pc-nc-nissan-juke-2025", 0, "", 0),
      HD("Nissan", "Juke", "Juke Acenta", "juke", "Bensin", 3295, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "92536/pc-nc-nissan-juke-2026", 0, "", 0),
      HD("Nissan", "Juke", "Juke DIG-T 114 N-Connecta / 3 års service / CarPlay & Android Aut", "juke", "Bensin", 3386, 1000, 995, 59, "Mölndal", [57.66, 12.01], "201042/pc-nc-nissan-juke-2025", 0, "", 0),
      HD("Nissan", "Juke", "Juke N-Connecta", "juke", "Bensin", 3386, 1000, 995, 59, "Mölndal", [57.66, 12.01], "136603/pc-nc-nissan-juke-2025", 1, "", 0),
      HD("Nissan", "Juke", "Juke Pulse Bensin 114hk", "juke", "Bensin", 3695, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "259382/pc-nc-nissan-juke-2027", 1, "", 0),
      HD("Nissan", "Juke", "Juke Pulse", "juke", "Bensin", 3695, 1000, 995, 59, "Kista", [59.4, 17.94], "259969/pc-nc-nissan-juke-2026", 1, "", 0),
      HD("Nissan", "Juke Hybrid", "Juke Hybrid N-Connecta Hybrid 61", null, "Hybrid", 4645, 1000, 995, 59, "Kista", [59.4, 17.94], "257813/pc-nc-nissan-juke-hybrid-2025", 1, "", 0),
      HD("Nissan", "Juke Hybrid", "Juke Hybrid Hybrid N-Connecta", null, "Hybrid", 4645, 1000, 995, 59, "Borås", [57.72, 12.94], "207362/pc-nc-nissan-juke-hybrid-2025", 1, "", 0),
      HD("Nissan", "Juke Hybrid", "Juke Hybrid Hybrid Tekna", null, "Hybrid", 4836, 1000, 995, 59, "Borås", [57.72, 12.94], "193085/pc-nc-nissan-juke-hybrid-2025", 1, "", 0),
      HD("Nissan", "Juke Hybrid", "Juke Hybrid Hybrid 143 hk Pulse Serviceavtal 0 kr", null, "Hybrid", 4995, 1000, 995, 59, "Varberg", [57.11, 12.25], "246743/pc-nc-nissan-juke-hybrid-2027", 0, "", 0),
      HD("Nissan", "Leaf", "Leaf P-LEASING", null, "El", 3995, 1000, 995, 59, "Kista", [59.4, 17.94], "257936/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52kWh Engage", null, "El", 3995, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "257233/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52kwh Engage", null, "El", 3995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "254213/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf ADVANCE 52 kWh", null, "El", 3995, 1000, 995, 59, "Alingsås", null, "255182/pc-nc-nissan-leaf-2026", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf 52kWh", null, "El", 3995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "254877/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52 kWh Advance", null, "El", 3995, 1000, 995, 59, "Varberg", [57.11, 12.25], "247232/pc-nc-nissan-leaf-2027", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf 52 kWh", null, "El", 3995, 1000, 995, 59, "Varberg", [57.11, 12.25], "237735/pc-nc-nissan-leaf-2027", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf", null, "El", 3995, 3000, 995, 59, "Halmstad", [56.67, 12.86], "232236/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52 kWh Engage", null, "El", 3995, 1000, 995, 59, "Varberg", [57.11, 12.25], "221459/pc-nc-nissan-leaf-2027", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf 52kwh Engage / Privatleasa fr", null, "El", 3995, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "214010/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52 kWh ENGAGE", null, "El", 3995, 1000, 995, 59, "Alingsås", null, "213793/pc-nc-nissan-leaf-2026", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf 52kwh Engage / Privatleasa", null, "El", 3995, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "213341/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52kWh", null, "El", 4095, 1000, 0, 0, "Mölndal", [57.66, 12.01], "239030/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf NYA LEAF 52 kWh ENGAGE", null, "El", 4095, 1000, 0, 0, "Kungsbacka", [57.49, 12.08], "216136/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf Engange", null, "El", 4095, 3000, 0, 0, "Halmstad", [56.67, 12.86], "213773/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52 khw Engage +", null, "El", 4336, 1000, 995, 59, "Borås", [57.72, 12.94], "241638/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf ADVANCE", null, "El", 4395, 3000, 995, 59, "Halmstad", [56.67, 12.86], "236356/pc-nc-nissan-leaf-2026", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf 72 kWh Evolve / Beställning / Redo för Provkörning", null, "El", 4495, 1000, 0, 0, "Mölndal", [57.66, 12.01], "237293/pc-nc-nissan-leaf-2026", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf 75kWh Evolve", null, "El", 4495, 1000, 0, 0, "Mölndal", [57.66, 12.01], "237128/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 75 kWh Evolve / Beställning / Redo för Provkörning", null, "El", 4495, 1000, 0, 0, "Mölndal", [57.66, 12.01], "237139/pc-nc-nissan-leaf-2026", 0, "", 1),
      HD("Nissan", "Leaf", "Leaf 75kWh Evolve 2-tone", null, "El", 4495, 1000, 0, 0, "Mölndal", [57.66, 12.01], "237129/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 52kWh Advance + 2 Tone Metallic", null, "El", 4563, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "257228/pc-nc-nissan-leaf-2026", 1, "", 1),
      HD("Nissan", "Leaf", "Leaf 62MIL WLTP P-LEASING", null, "El", 4695, 1000, 995, 59, "Kista", [59.4, 17.94], "257935/pc-nc-nissan-leaf-2026", 1, "", 0),
      HD("Nissan", "Leaf", "Leaf ADVANCE 52 kWh", null, "El", 4695, 1000, 0, 0, "Kungsbacka", [57.49, 12.08], "247058/pc-nc-nissan-leaf-2026", 1, "", 0),
      HD("Nissan", "Leaf", "Leaf 52 kWh Advance", null, "El", 4695, 1000, 0, 0, "Mölndal", [57.66, 12.01], "241438/pc-nc-nissan-leaf-2026", 1, "", 0),
      HD("Nissan", "Leaf", "Leaf 75 kwh Engage 622 km", null, "El", 4695, 1000, 995, 59, "Varberg", [57.11, 12.25], "221650/pc-nc-nissan-leaf-2027", 0, "", 0),
      HD("Nissan", "Leaf", "Leaf 75KWH P-Leasing", null, "El", 4695, 1000, 0, 0, "Värnamo", null, "214583/pc-nc-nissan-leaf-2026", 0, "", 0),
      HD("Nissan", "Leaf", "Leaf 75 khw Evolve 2 tone", null, "El", 5503, 1000, 995, 59, "Borås", [57.72, 12.94], "242636/pc-nc-nissan-leaf-2026", 1, "", 0),
      HD("Nissan", "Leaf", "Leaf 75KWH EVOLVE", null, "El", 5503, 1000, 0, 0, "Alingsås", null, "214011/pc-nc-nissan-leaf-2026", 0, "", 0),
      HD("Nissan", "Micra", "Micra 52 kWh Evolve * INKL. Vinterhjul & Serviceavtal", "micra", "El", 3895, 1000, 0, 0, "Alingsås", null, "218293/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra INKL V-HJUL/SERVICE 3ÅR/INBYTES", "micra", "El", 3995, 1000, 995, 59, "Kista", [59.4, 17.94], "257937/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra 40kWh Engage", "micra", "El", 3995, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "257230/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra Engage Service & vinterhjul ingår", "micra", "El", 3995, 1000, 995, 59, "Varberg", [57.11, 12.25], "226200/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra 52 kWh Evolve *V-Hjul & Service påköpet", "micra", "El", 3995, 1000, 0, 0, "Borås", [57.72, 12.94], "219250/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra ENGAGE", "micra", "El", 3995, 1000, 0, 0, "Kungsbacka", [57.49, 12.08], "217070/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra Engage 40kWh *INKL. Vinterhjul & Serviceavtal", "micra", "El", 3995, 1000, 995, 59, "Alingsås", null, "216357/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra 40kWh", "micra", "El", 3995, 1000, 0, 0, "Mölndal", [57.66, 12.01], "214714/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra 40 kWh Advance", "micra", "El", 3995, 1000, 995, 59, "Borås", [57.72, 12.94], "213112/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra Engage 40kWh", "micra", "El", 3995, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "200410/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra ADVANCE 40kWh *INKL. Vinterhjul & Serviceavtal", "micra", "El", 4295, 1000, 995, 59, "Alingsås", null, "243125/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra 40 kWh Advance vinterhjul & Serviceavtal ingår", "micra", "El", 4295, 1000, 995, 59, "Varberg", [57.11, 12.25], "238501/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra Advance 40 kWh / 31 mil Räckvidd / Parkeringsvärme", "micra", "El", 4295, 1000, 0, 0, "Mölndal", [57.66, 12.01], "237117/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra INKL V-HJUL/SERVICE 3ÅR/INBYTES", "micra", "El", 4595, 1000, 995, 59, "Kista", [59.4, 17.94], "257938/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra Advance 52 kWh / 41 mil Räckvidd / Parkeringsvärme", "micra", "El", 4595, 1000, 0, 0, "Mölndal", [57.66, 12.01], "237116/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra 52 kWh ADVANCE *INKL. Vinterhjul & Serviceavtal", "micra", "El", 4595, 1000, 995, 59, "Alingsås", null, "208875/pc-nc-nissan-micra-2026", 0, "", 1),
      HD("Nissan", "Micra", "Micra 52 kWh Advance", "micra", "El", 4595, 1000, 0, 0, "Mölndal", [57.66, 12.01], "188884/pc-nc-nissan-micra-2026", 1, "", 1),
      HD("Nissan", "Micra", "Micra 52kWh Advance", "micra", "El", 4768, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "257225/pc-nc-nissan-micra-2026", 1, "", 0),
      HD("Nissan", "Micra", "Micra INKL V-HJUL/SERVICE 3ÅR/INBYTES", "micra", "El", 4795, 1000, 995, 59, "Kista", [59.4, 17.94], "257939/pc-nc-nissan-micra-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai ACENTA P-LEASING FR", "qashqai", "Bensin", 2995, 1000, 995, 59, "Kista", [59.4, 17.94], "257942/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai 158 hk Mildhybrid Automat Gratis service 3st", "qashqai", "Bensin", 2995, 1000, 995, 59, "Varberg", [57.11, 12.25], "237862/pc-nc-nissan-qashqai-2027", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai", "qashqai", "Bensin", 2995, 1000, 995, 59, "Halmstad", [56.67, 12.86], "236359/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai ACENTA", "qashqai", "Bensin", 2995, 1000, 995, 59, "Alingsås", null, "228885/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai", "qashqai", "Hybrid", 2995, 1000, 995, 59, "Varberg", [57.11, 12.25], "221275/pc-nc-nissan-qashqai-2027", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV 158 Automat", "qashqai", "Hybrid", 2995, 1000, 995, 59, "Varberg", [57.11, 12.25], "218971/pc-nc-nissan-qashqai-2027", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV Acenta / 3 år Service / Apple CarPlay / Rattvärme", "qashqai", "Bensin", 2995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "174465/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV Acenta Leasing fr:", "qashqai", "Bensin", 2995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "203039/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Acenta / Privatleasng fr", "qashqai", "Bensin", 2995, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "202797/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV Acenta P-leasing", "qashqai", "Bensin", 2995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "196163/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV ACENTA", "qashqai", "Bensin", 2995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "189841/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Acenta / Privatleasa fr", "qashqai", "Bensin", 2995, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "175692/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Acenta /Privalteasing fr", "qashqai", "Bensin", 2995, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "171580/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV 158 Xtronic 2WD Acenta /3 år fri service", "qashqai", "Bensin", 2995, 1000, 995, 59, "Mölndal", [57.66, 12.01], "123903/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Acenta", "qashqai", "Bensin", 2995, 1000, 995, 59, "Uddevalla", [58.35, 11.94], "92545/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai N-Connecta Hedin Edition *omg", "qashqai", "Bensin", 3177, 1000, 995, 59, "Kista", [59.4, 17.94], "259442/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV N-Connecta", "qashqai", "Bensin", 3177, 1000, 995, 59, "Mölndal", [57.66, 12.01], "236918/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV N-Connecta / 3års Serviceavtal", "qashqai", "Bensin", 3177, 1000, 995, 59, "Mölndal", [57.66, 12.01], "231487/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai N-CONNECTA", "qashqai", "Bensin", 3177, 1000, 995, 59, "Alingsås", null, "215976/pc-nc-nissan-qashqai-2025", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV N-Connecta / 3 år Service / 360° kamera / CarPlay", "qashqai", "Hybrid", 3177, 1000, 995, 59, "Mölndal", [57.66, 12.01], "213816/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai N-Connecta MHEV Xtronic", "qashqai", "Hybrid", 3177, 1000, 995, 59, "Mölndal", [57.66, 12.01], "207401/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Xtronic 158 N-Connecta / 3 år service / 360° Kamera", "qashqai", "Hybrid", 3177, 1000, 995, 59, "Mölndal", [57.66, 12.01], "198076/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai N-Connecta 158 Xtronic", "qashqai", "Hybrid", 3177, 1000, 995, 59, "Mölndal", [57.66, 12.01], "197829/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai TEKNA MHEV 2WD", "qashqai", "Bensin", 3387, 1000, 995, 59, "Alingsås", null, "227416/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Tekna", "qashqai", "Hybrid", 3387, 3000, 995, 59, "Mölndal", [57.66, 12.01], "217402/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Tekna MHEV", "qashqai", "Bensin", 3387, 1000, 995, 59, "Mölndal", [57.66, 12.01], "171573/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "QASHQAI MILDHYBRID XTRONIC AUT 2WD", "qashqai", "Hybrid", 3495, 3000, 995, 60, "Halmstad", [56.67, 12.86], "259498/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai N-CONNECTA", "qashqai", "Bensin", 3495, 1000, 995, 60, "Alingsås", null, "255826/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Tekna+ P-LEASING", "qashqai", "Bensin", 3628, 1000, 995, 59, "Kista", [59.4, 17.94], "257943/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV TEKNA", "qashqai", "Bensin", 3795, 1000, 995, 59, "Borås", [57.72, 12.94], "252722/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV Tekna +", "qashqai", "Bensin", 3807, 1000, 995, 59, "Borås", [57.72, 12.94], "235307/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai MHEV", "qashqai", "Bensin", 3990, 1000, 995, 59, "Borås", [57.72, 12.94], "156529/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai Acenta e-POWER *NYA GENERATIONEN", "qashqai", "Hybrid", 3995, 1000, 995, 59, "Kista", [59.4, 17.94], "257940/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai E-power Fullhybrid 0,44 L/mil* Fullhybrid 206 hk", "qashqai", "Hybrid", 3995, 1000, 995, 59, "Varberg", [57.11, 12.25], "225700/pc-nc-nissan-qashqai-2027", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai E-power 190hk Acenta", "qashqai", "Hybrid", 3995, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "222604/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai TEKNA *INKL DRAG & VINTERHJUL", "qashqai", "Bensin", 4034, 1000, 995, 59, "Alingsås", null, "226801/pc-nc-nissan-qashqai-2025", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai TEKNA ePOWER GEN3 inkl Serviceavtal", "qashqai", "Hybrid", 4295, 1000, 995, 59, "Alingsås", null, "255199/pc-nc-nissan-qashqai-2026", 0, "", 0),
      HD("Nissan", "Qashqai", "Qashqai ePOWER GEN3 Tekna inkl Serviceavtal", "qashqai", "Hybrid", 4690, 1000, 995, 59, "Mölndal", [57.66, 12.01], "245555/pc-nc-nissan-qashqai-2026", 1, "", 0),
      HD("Nissan", "Qashqai", "Qashqai E-Power Fullhybrid Tekna Plus Automat / Fri service", "qashqai", "Hybrid", 4995, 1000, 995, 59, "Varberg", [57.11, 12.25], "249757/pc-nc-nissan-qashqai-2027", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail MHEV / Lager", null, "Bensin", 4495, 1000, 995, 59, "Trollhättan", [58.28, 12.29], "126512/pc-nc-nissan-x-trail-2025", 1, "", 0),
      HD("Nissan", "X-Trail", "X-Trail MHEV 163 hk Automat Tekna", null, "Hybrid", 4792, 1000, 995, 59, "Varberg", [57.11, 12.25], "237921/pc-nc-nissan-x-trail-2026", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail N-Connecta ​MHEV 2WD *INKL SERVICE", null, "Bensin", 4855, 1000, 995, 59, "Alingsås", null, "224629/pc-nc-nissan-x-trail-2025", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail MHEV 2WD Tekna 5ST /3 år fri service", null, "Bensin", 5017, 1000, 995, 59, "Mölndal", [57.66, 12.01], "138112/pc-nc-nissan-x-trail-2025", 1, "", 0),
      HD("Nissan", "X-Trail", "X-Trail Tekna / 4 år Service / Skinsäte Minne / Elbagage", null, "Hybrid", 5045, 1000, 995, 59, "Mölndal", [57.66, 12.01], "220422/pc-nc-nissan-x-trail-2025", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail E-4orce N-Connecta inkl 3 års Serviceavtal", null, "Hybrid", 5115, 1000, 995, 59, "Mölndal", [57.66, 12.01], "199341/pc-nc-nissan-x-trail-2025", 1, "", 0),
      HD("Nissan", "X-Trail", "X-Trail Tekna+ ​85", null, "Bensin", 5165, 1000, 995, 59, "Kista", [59.4, 17.94], "257678/pc-nc-nissan-x-trail-2025", 1, "", 0),
      HD("Nissan", "X-Trail", "X-Trail MHEV 2WD Tekna inkl 3års serviceavtal", null, "Bensin", 5271, 1000, 995, 59, "Mölndal", [57.66, 12.01], "204547/pc-nc-nissan-x-trail-2025", 1, "", 0),
      HD("Nissan", "X-Trail", "X-Trail N-Trek e-4orce / 4WD / 360° kamera / 3 servicetillfälle", null, "Hybrid", 5542, 1000, 995, 59, "Mölndal", [57.66, 12.01], "229448/pc-nc-nissan-x-trail-2025", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail E-4orce N-Connecta /3 år fri service", null, "Hybrid", 5739, 1000, 995, 59, "Mölndal", [57.66, 12.01], "138885/pc-nc-nissan-x-trail-2025", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail e-4ORCE N-Connecta 5ST", null, "Hybrid", 5827, 1000, 995, 59, "Mölndal", [57.66, 12.01], "186871/pc-nc-nissan-x-trail-2025", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail Tekna E4ORCE", null, "Hybrid", 6027, 3000, 995, 59, "Helsingborg", [56.05, 12.69], "217030/pc-nc-nissan-x-trail-2025", 0, "", 0),
      HD("Nissan", "X-Trail", "X-Trail e-4ORCE Tekna 5ST", null, "Hybrid", 6087, 1000, 995, 59, "Mölndal", [57.66, 12.01], "212930/pc-nc-nissan-x-trail-2025", 1, "", 0),
      HD("Nissan", "X-Trail", "X-Trail e-4ORCE Tekna 5ST , 3års Serviceavtal", null, "Hybrid", 6087, 1000, 995, 59, "Mölndal", [57.66, 12.01], "192023/pc-nc-nissan-x-trail-2025", 0, "", 0),
      HD("Renault", "4", "4 EVOLUTION 40kWh", null, "El", 3390, 1000, 995, 59, "Kista", [59.4, 17.94], "236131/pc-nc-renault-4-2026", 1, "", 1),
      HD("Renault", "4", "4 E-TECH EVOLUTION", null, "El", 3790, 1000, 995, 59, "Västerås", [59.61, 16.55], "231718/pc-nc-renault-4-2025", 1, "", 1),
      HD("Renault", "4", "4 ICONIC EV52", null, "El", 3890, 1000, 995, 59, "Kista", [59.4, 17.94], "202754/pc-nc-renault-4-2026", 1, "", 1),
      HD("Renault", "4", "4", null, "El", 3890, 1000, 995, 59, "Ängelholm", null, "228000/pc-nc-renault-4-2026", 1, "", 1),
      HD("Renault", "4", "4 Techno", null, "El", 3890, 1000, 995, 59, "Halmstad", [56.67, 12.86], "199061/pc-nc-renault-4-2025", 1, "", 1),
      HD("Renault", "4", "4 EVOLUTION 40kWh", null, "El", 3890, 1000, 995, 59, "Kista", [59.4, 17.94], "195459/pc-nc-renault-4-2026", 1, "", 1),
      HD("Renault", "4", "4 R4 TECHNO *4", null, "El", 4190, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "233311/pc-nc-renault-4-2026", 1, "", 1),
      HD("Renault", "4", "4 Techno", null, "El", 4190, 1000, 995, 59, "Halmstad", [56.67, 12.86], "231989/pc-nc-renault-4-2026", 1, "", 1),
      HD("Renault", "4", "4 E-TECH TECHNO", null, "El", 4290, 1000, 995, 59, "Västerås", [59.61, 16.55], "231717/pc-nc-renault-4-2025", 1, "", 1),
      HD("Renault", "4", "4 TECHNO 52KWH", null, "El", 4290, 1000, 995, 59, "Västerås", [59.61, 16.55], "231716/pc-nc-renault-4-2025", 1, "", 1),
      HD("Renault", "4", "4 TECHNO", null, "El", 4290, 1000, 995, 59, "Västerås", [59.61, 16.55], "219239/pc-nc-renault-4-2026", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech ELECTRIC TECHNO EV52", null, "El", 3890, 1000, 995, 59, "Mölndal", [57.66, 12.01], "259662/pc-nc-renault-4-e-tech-2026", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech R4 E-TECH ELECTRIC TECHNO EV52", null, "El", 3890, 1000, 995, 59, "Ängelholm", null, "251478/pc-nc-renault-4-e-tech-2026", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech R4 E-TECH ELECTRIC ICONIC EV52", null, "El", 3890, 1000, 995, 59, "Jönköping", [57.78, 14.16], "248581/pc-nc-renault-4-e-tech-2026", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech R4 E-TECH TECHNO EV52", null, "El", 4190, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "258900/pc-nc-renault-4-e-tech-2026", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech R4 TECHNO EV52 *4", null, "El", 4190, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "253876/pc-nc-renault-4-e-tech-2026", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech ELECTRIC ICONIC EV52", null, "El", 4390, 1000, 995, 59, "Mölndal", [57.66, 12.01], "260203/pc-nc-renault-4-e-tech-2026", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech Plein Sud 4", null, "El", 4390, 1000, 995, 59, "Halmstad", [56.67, 12.86], "260151/pc-nc-renault-4-e-tech-2027", 1, "", 1),
      HD("Renault", "4 E-Tech", "4 E-Tech Electric Iconic 52kwh", null, "El", 4390, 1000, 995, 59, "Trelleborg", null, "253863/pc-nc-renault-4-e-tech-2026", 1, "", 1),
      HD("Renault", "5", "5 Iconic", null, "El", 3290, 1000, 995, 59, "Lund", [55.7, 13.19], "126924/pc-nc-renault-5-2025", 0, "", 1),
      HD("Renault", "5", "5 R5", null, "El", 3290, 1000, 995, 59, "Lund", [55.7, 13.19], "123159/pc-nc-renault-5-2025", 0, "", 1),
      HD("Renault", "5", "5 R5 Electric Evolution", null, "El", 3290, 1000, 995, 59, "Malmö", [55.6, 13.0], "121961/pc-nc-renault-5-2026", 0, "", 1),
      HD("Renault", "5", "5 E-TECH EVOLUTION EV40", null, "El", 3490, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "247641/pc-nc-renault-5-2026", 0, "", 1),
      HD("Renault", "5", "5 E-TECH ELECTRIC EVOLUTION EV40 *0%", null, "El", 3490, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "255268/pc-nc-renault-5-2027", 0, "", 1),
      HD("Renault", "5", "5 ELECTRIC EVOLUTION EV40", null, "El", 3490, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "255176/pc-nc-renault-5-2027", 1, "", 1),
      HD("Renault", "5", "5 EVOLUTION EV40", null, "El", 3490, 1000, 995, 59, "Kista", [59.4, 17.94], "233165/pc-nc-renault-5-2026", 1, "", 1),
      HD("Renault", "5", "5 E-TECH 40 KWH EVOLUTION", null, "El", 3490, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "214530/pc-nc-renault-5-2025", 1, "", 1),
      HD("Renault", "5", "5 EVOLUTION 40 KWh", null, "El", 3490, 1000, 995, 59, "Ängelholm", null, "122502/pc-nc-renault-5-2026", 1, "", 1),
      HD("Renault", "5", "5 R5 Techno 52kwh", null, "El", 3690, 1000, 995, 59, "Malmö", [55.6, 13.0], "121972/pc-nc-renault-5-2025", 0, "", 1),
      HD("Renault", "5", "5 R5 Iconic Five 52kwh", null, "El", 3890, 1000, 995, 59, "Malmö", [55.6, 13.0], "121975/pc-nc-renault-5-2025", 0, "", 1),
      HD("Renault", "5", "5 E-TECH ELECTRIC TECHNO EV52", null, "El", 3990, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "260478/pc-nc-renault-5-2027", 0, "", 1),
      HD("Renault", "5", "5 E-TECH TECHNO EV52", null, "El", 3990, 1000, 995, 59, "Kista", [59.4, 17.94], "257301/pc-nc-renault-5-2027", 1, "", 1),
      HD("Renault", "5", "5 E-TECH TECHNO EV52", null, "El", 3990, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "238583/pc-nc-renault-5-2026", 1, "", 1),
      HD("Renault", "5", "5 TECHNO 52KWH", null, "El", 3990, 1000, 995, 59, "Västerås", [59.61, 16.55], "220443/pc-nc-renault-5-2026", 1, "", 1),
      HD("Renault", "5", "5 TECHNO 3", null, "El", 3990, 1000, 995, 59, "Halmstad", [56.67, 12.86], "187102/pc-nc-renault-5-2025", 1, "", 1),
      HD("Renault", "5", "5 TECHNO 52kWh", null, "El", 3990, 1000, 995, 59, "Ängelholm", null, "122501/pc-nc-renault-5-2026", 1, "", 1),
      HD("Renault", "5", "5 E-tech 52KWH", null, "El", 4190, 1000, 995, 59, "Kista", [59.4, 17.94], "260475/pc-nc-renault-5-2027", 0, "", 1),
      HD("Renault", "5", "5 ICONIC 4", null, "El", 4190, 1000, 995, 59, "Halmstad", [56.67, 12.86], "187840/pc-nc-renault-5-2025", 1, "", 1),
      HD("Renault", "5", "5 ICONIC 5 E-TECH ELECTRIC", null, "El", 4490, 1000, 995, 59, "Kista", [59.4, 17.94], "260473/pc-nc-renault-5-2025", 0, "", 1),
      HD("Renault", "5", "5 ICONIC 52kWh", null, "El", 4490, 1000, 995, 59, "Ängelholm", null, "122503/pc-nc-renault-5-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech E-TECH ELECTRIC EVOLUTION EV40", "r5", "El", 3490, 1000, 995, 59, "Kista", [59.4, 17.94], "258571/pc-nc-renault-5-e-tech-2026", 0, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech Evolution 3", "r5", "El", 3490, 1000, 995, 59, "Halmstad", [56.67, 12.86], "246107/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech Techno 52KWh 3", "r5", "El", 3690, 1000, 995, 59, "Halmstad", [56.67, 12.86], "246579/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech E-TECH ELECTRIC TECHNO EV52", "r5", "El", 3990, 1000, 995, 59, "Kista", [59.4, 17.94], "251390/pc-nc-renault-5-e-tech-2026", 0, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech R5 Techno 52kwh", "r5", "El", 3990, 1000, 995, 59, "Kista", [59.4, 17.94], "257300/pc-nc-renault-5-e-tech-2027", 0, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech 3ÅRS FRI SERVICE & FÖRSÄKRING INGÅR VIA SMARTABILLÅN", "r5", "El", 3990, 1000, 995, 59, "Mölndal", [57.66, 12.01], "256273/pc-nc-renault-5-e-tech-2027", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech 3ÅRS FRI SERVICE & FÖRSÄKRING INGÅR VIA BILLÅN", "r5", "El", 3990, 1000, 995, 59, "Mölndal", [57.66, 12.01], "254044/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech Techno 52kwh", "r5", "El", 3990, 3000, 995, 59, "Trelleborg", null, "249666/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech R5 TECHNO EV52", "r5", "El", 3990, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "243478/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech Techno 52KWh 3", "r5", "El", 3990, 1000, 995, 59, "Halmstad", [56.67, 12.86], "249266/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech TECHNO EV52", "r5", "El", 3990, 1000, 995, 59, "Borås", [57.72, 12.94], "247279/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech R5 Techno 52kwh", "r5", "El", 3990, 1000, 995, 59, "Trelleborg", null, "244297/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech TECHNO EV52", "r5", "El", 3990, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "243795/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech R5 TECHNO", "r5", "El", 3990, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "243482/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech ELECTRIC TECHNO EV52", "r5", "El", 3990, 1000, 995, 59, "Ängelholm", null, "244128/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech ELECTRIC TECHNO EV52", "r5", "El", 3990, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "243796/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech R5 E-TECH ELECTRIC TECHNO EV52", "r5", "El", 3990, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "242534/pc-nc-renault-5-e-tech-2026", 1, "", 1),
      HD("Renault", "5 E-Tech", "5 E-Tech E-TECH ELECTRIC ICONIC FIVE EV52", "r5", "El", 4490, 1000, 995, 59, "Kista", [59.4, 17.94], "260472/pc-nc-renault-5-e-tech-2027", 0, "", 1),
      HD("Renault", "Captur", "Captur TECHNO AUTOMAT MILDHYBRID", null, "Hybrid", 4390, 1000, 995, 59, "Kista", [59.4, 17.94], "228624/pc-nc-renault-captur-2026", 1, "", 0),
      HD("Renault", "Captur", "Captur 3ÅRS FRI SERVICE & FÖRSÄKRING INGÅR VIA SMARTABILLÅN", null, "Hybrid", 4490, 1000, 995, 59, "Mölndal", [57.66, 12.01], "250902/pc-nc-renault-captur-2026", 1, "", 0),
      HD("Renault", "Captur", "CAPTUR TECHNO MILDHYBRID 140 EDC", null, "Hybrid", 4490, 1000, 995, 59, "Borås", [57.72, 12.94], "236210/pc-nc-renault-captur-2026", 1, "", 0),
      HD("Renault", "Clio", "Clio TECHNO TCE 115 EDC", null, "Bensin", 3990, 1000, 995, 59, "Kista", [59.4, 17.94], "230995/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Clio", "CLIO TECHNO TCE 115 EDC 2,99%", null, "Bensin", 3990, 1000, 995, 59, "Halmstad", [56.67, 12.86], "242824/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Clio", "Clio AUTOMAT 115Hk", null, "Bensin", 3990, 1000, 995, 59, "Kista", [59.4, 17.94], "241138/pc-nc-renault-clio-2026", 0, "", 0),
      HD("Renault", "Clio", "CLIO TECHNO TCE 115 EDC", null, "Bensin", 3990, 1000, 995, 59, "Trelleborg", null, "226894/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Clio", "Clio TECHNO TCE 115 EDC", null, "Bensin", 3990, 1000, 995, 59, "Jönköping", [57.78, 14.16], "224385/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Clio", "Clio TECHNO TCE 115 EDC", null, "Bensin", 3990, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "223722/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Clio", "CLIO TECHNO TCE 115 EDC", null, "Bensin", 3990, 1000, 995, 59, "Ängelholm", null, "223546/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Clio", "Clio Nya Clio - Techno TCE 115", null, "Bensin", 3990, 1000, 995, 59, "Västerås", [59.61, 16.55], "219238/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Clio", "Clio Nya Clio - Techno TCE 115", null, "Bensin", 3990, 3000, 995, 59, "Halmstad", [56.67, 12.86], "214573/pc-nc-renault-clio-2026", 1, "", 0),
      HD("Renault", "Rafale", "Rafale Plug-in Hybrid AWD 300hk 2.99%", null, "Laddhybrid", 7690, 1000, 995, 59, "Västerås", [59.61, 16.55], "241447/pc-nc-renault-rafale-2026", 1, "", 0),
      HD("Renault", "Rafale", "Rafale ESPRIT ALPINE 300 4X4 PLUGIN", null, "Laddhybrid", 7790, 1000, 995, 59, "Kista", [59.4, 17.94], "247643/pc-nc-renault-rafale-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic E-TECH EVOLUTION+ 60 KWH FR", null, "El", 3990, 1000, 995, 59, "Alingsås", null, "197545/pc-nc-renault-scenic-2025", 1, "", 1),
      HD("Renault", "Scénic", "Scénic Techno 87KWh 4", null, "El", 4680, 1000, 995, 59, "Halmstad", [56.67, 12.86], "231960/pc-nc-renault-scenic-2026", 1, "", 0),
      HD("Renault", "Scénic", "SCENIC E-TECH ELECTRIC TECHNO 610KM RÄCKVIDD", null, "El", 4690, 1000, 995, 59, "Västerås", [59.61, 16.55], "249038/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic TECHNO EV87 87kWh", null, "El", 4690, 1000, 995, 59, "Kista", [59.4, 17.94], "222286/pc-nc-renault-scenic-2026", 1, "", 0),
      HD("Renault", "Scénic", "SCENIC E-TECH ELECTRIC TECHNO EV87", null, "El", 4690, 1000, 995, 59, "Jönköping", [57.78, 14.16], "248578/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic TECHNO 87KWh", null, "El", 4690, 1000, 995, 59, "Halmstad", [56.67, 12.86], "234017/pc-nc-renault-scenic-2026", 1, "", 0),
      HD("Renault", "Scénic", "Scénic TECHNO EV87 LONG RANGE", null, "El", 4690, 1000, 995, 59, "Kista", [59.4, 17.94], "234924/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic E-TECH TECHNO 87KWH 622km WLTP", null, "El", 4690, 1000, 995, 59, "Västerås", [59.61, 16.55], "231741/pc-nc-renault-scenic-2026", 1, "", 0),
      HD("Renault", "Scénic", "Scénic TECHNO 4", null, "El", 4690, 1000, 995, 59, "Halmstad", [56.67, 12.86], "187842/pc-nc-renault-scenic-2026", 1, "", 0),
      HD("Renault", "Scénic", "SCENIC E-TECH ELECTRIC TECHNO EV87", null, "El", 4990, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "260071/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic ELECTRIC TECHNO EV87", null, "El", 4990, 1000, 995, 59, "Mölndal", [57.66, 12.01], "257098/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic E-Tech Techno 87kwh", null, "El", 4990, 1000, 995, 59, "Trelleborg", null, "249669/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic Techno 87KWh 4", null, "El", 4990, 1000, 995, 59, "Halmstad", [56.67, 12.86], "249268/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic TECHNO EV87", null, "El", 4990, 1000, 995, 59, "Borås", [57.72, 12.94], "247624/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic E-TECH ELECTRIC TECHNO EV87", null, "El", 4990, 1000, 995, 59, "Kristianstad", [56.03, 14.16], "246793/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic E-TECH ELECTRIC TECHNO EV87 *FR", null, "El", 4990, 3000, 995, 59, "Segeltorp", [59.28, 17.94], "246570/pc-nc-renault-scenic-2027", 0, "", 0),
      HD("Renault", "Scénic", "SCENIC E-TECH ELECTRIC TECHNO EV87", null, "El", 4990, 3000, 995, 59, "Ängelholm", null, "246356/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Renault", "Scénic", "Scénic E-Tech Techno EV87", null, "El", 4990, 1000, 995, 59, "Ängelholm", null, "223320/pc-nc-renault-scenic-2026", 0, "", 0),
      HD("Renault", "Scénic", "Scénic Techno 87kWh", null, "El", 4990, 1000, 995, 59, "Helsingborg", [56.05, 12.69], "232187/pc-nc-renault-scenic-2026", 1, "", 0),
      HD("Renault", "Scénic", "Scénic Esprit Alpine 87KWh 5", null, "El", 5790, 1000, 995, 59, "Halmstad", [56.67, 12.86], "250945/pc-nc-renault-scenic-2027", 1, "", 0),
      HD("Subaru", "E-Outback", "E-Outback Touring Plus Inkl V-hjul + 0,99% + Service", null, "El", 10040, 1000, 995, 60, "Segeltorp", [59.28, 17.94], "253362/pc-nc-subaru-e-outback-2027", 1, "", 0),
      // --- HEDIN SLUT ---
      // --- BILWEB START: handlarnas egna annonser från Bilweb (genereras av verktyg/gen_bilweb2.py – ändra inte för hand) ---
      BW("Alpine", "A290", "A290 GT ELECTRIC", null, "El", 4600, 0, "Hedin Automotive Segeltorp", "Segeltorp", "stockholms-lan/alpine-a290-gt-electric-180hk-privatleasing-fr-4600-man-2026-halvkombi-164795", "27 maj", 0, "Halvkombi/sedan"),
      BW("Audi", "A2 e-tron", "A2 e-tron E-tron", null, "El", 4389, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/audi-a2-e-tron-e-tron-privatleasing-4383kr-man-2027-halvkombi-394049", "24 sep", 10000, "Halvkombi/sedan"),
      BW("Audi", "A2 e-tron", "A2 e-tron Proline 140 KW", null, "El", 4695, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a2-e-tron-proline-140-kw-privatleasing-2027-suv-440898", "23 okt", 0, "SUV"),
      BW("Audi", "A2 e-tron", "A2 e-tron e-tron 140kW", null, "El", 4695, 1000, "Din Bil / Audi Göteborg", "Mölndal", "vastra-gotalands-lan/audi-a2-e-tron-e-tron-140kw-proline-privatleasing-2027-halvkombi-421773", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A2 e-tron", "A2 e-tron e-tron", null, "El", 4695, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a2-e-tron-e-tron-privatleasing-2027-halvkombi-415936", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A2 e-tron", "A2 e-tron 140 kw proline", null, "El", 4695, 1000, "Din Bil / Audi Hudiksvall", "Hudiksvall", "gavleborgs-lan/audi-a2-e-tron-140-kw-proline-privatleasing-2027-halvkombi-412896", "9 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A2 e-tron", "A2 e-tron e-tron Proline", null, "El", 4695, 1000, "Börjessons Bil i Ängelholm AB", "Ängelholm", "skane-lan/audi-a2-e-tron-e-tron-proline-140-00-kw-privatleasing-2027-halvkombi-385472", "18 sep", 0, "Halvkombi/sedan"),
      BW("Audi", "A2 e-tron", "A2 e-tron e-tron 140,00 kW", null, "El", 4995, 0, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/audi-a2-e-tron-e-tron-140-00-kw-proline-privatleasing-2027-halvkombi-373810", "10 sep", 0, "Halvkombi/sedan"),
      BW("Audi", "A3", "A3 150 hk", null, "Bensin", 2795, 1000, "Toveks Bil Motala", "Motala", "ostergotlands-lan/audi-a3-150-hk-privatleasing-0-i-kontant-bilar-bestallda-2027-halvkombi-439114", "22 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3", "A3", null, "Hybrid", 2795, 1000, "Toveks Bil Motala", "Motala", "ostergotlands-lan/audi-a3-privatleasing-0-i-kontant-bilar-hemma-2027-halvkombi-387853", "21 sep", 0, "Halvkombi/sedan"),
      BW("Audi", "A3", "A3 150hk automat", null, "Bensin", 2879, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/audi-a3-150hk-automat-privatleasing-2879-kr-man-lagerbil-2027-halvkombi-437503", "21 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3", "A3", null, "Hybrid", 3195, 1000, "Bilia Haninge Audi", "Handen", "stockholms-lan/audi-a3-privatleasing-3195kr-man-2027-halvkombi-428125", "14 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3", "A3 150 hk S-LINE", null, "Hybrid", 3464, 1000, "Toveks Bil Motala", "Motala", "ostergotlands-lan/audi-a3-150-hk-s-line-0-i-kontant-privatleasing-3-464kr-man-2027-halvkombi-440724", "23 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sedan", "A3 Sedan 35", "a3sedan", "Bensin", 2895, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a3-sedan-35-tfsi-s-tronic-proline-privatleasing-2027-halvkombi-435298", "20 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sedan", "A3 Sedan TFSI", "a3sedan", "Bensin", 2895, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a3-sedan-tfsi-110-kw-s-tronic-proline-privatleasing-2027-halvkombi-372503", "10 sep", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sedan", "A3 Sedan TFSI", "a3sedan", "Hybrid", 3095, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a3-sedan-tfsi-150hk-s-tronic-s-line-privatleasing-3095-2027-halvkombi-404701", "2 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback 35", "a3", "Bensin", 2795, 1000, "Börjessons Bil i Ängelholm AB", "Ängelholm", "skane-lan/audi-a3-sportback-35-tfsi-150-hk-s-tronic-privatleasing-2027-halvkombi-454393", "4 nov", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback 35", "a3", "Bensin", 2795, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a3-sportback-35-tfsi-s-tronic-privatleasing-2027-halvkombi-437494", "21 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback 35", "a3", "Bensin", 2795, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a3-sportback-35-tfsi-s-tronic-proline-privatleasing-2027-halvkombi-415950", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback TFSI", "a3", "Bensin", 2795, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a3-sportback-tfsi-110-kw-s-tronic-proline-privatleasing-2027-halvkombi-372504", "10 sep", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback TFSI", "a3", "Bensin", 2795, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-a3-sportback-tfsi-proline-110-kw-s-tr-privatleasing-2026-halvkombi-330458", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback TFSI", "a3", "Bensin", 2795, 1000, "Din Bil / Audi Smista", "Segeltorp", "stockholms-lan/audi-a3-sportback-tfsi-150-hk-proline-s-tronic-privatleasing-2025-halvkombi-329839", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback 150hk", "a3", "Bensin", 2879, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/audi-a3-sportback-150hk-automat-privatleasing-nya-modellen-2027-halvkombi-302924", "18 jul", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 NYA! Sportback", "a3", "Bensin", 2995, 1000, "Din Bil / Audi Danderyd", "Danderyd", "stockholms-lan/audi-a3-nya-sportback-35-tfsi-proline-s-tronic-privatleasing-2027-halvkombi-332335", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback", "a3", "Bensin", 2995, 1000, "AB Norrbil", "Norrtälje", "stockholms-lan/audi-a3-sportback-privatleasing-150hk-kampanjpris-2026-halvkombi-331588", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback S-tronic", "a3", "Bensin", 2995, 1000, "Din Bil / Audi Smista", "Segeltorp", "stockholms-lan/audi-a3-sportback-s-tronic-s-line-kampanj-privatleasing-2025-halvkombi-329848", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback TFSI", "a3", "Bensin", 3195, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-a3-sportback-tfsi-110-kw-s-tr-prol-privatleasing-nya-2027-halvkombi-330398", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback Proline", "a3", "Bensin", 3195, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/audi-a3-sportback-proline-tfsi-privatleasing-3195-kr-man-2027-halvkombi-231959", "15 jun", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback TFSI", "a3", "Bensin", 3195, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/audi-a3-sportback-tfsi-150-hk-proline-s-tronic-privatleasing-2026-halvkombi-231912", "15 jun", 0, "Halvkombi/sedan"),
      BW("Audi", "A3 Sportback", "A3 Sportback e-hybrid", "a3", "Laddhybrid", 4995, 0, "Bilia Haninge Audi", "Handen", "stockholms-lan/audi-a3-sportback-e-hybrid-150kw-s-tronic-proline-privatleasing-2027-halvkombi-293520", "9 jul", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5 E-HYBRID", "a5", "Laddhybrid", 4395, 1000, "Toveks Bil Varberg", "Åskloster", "hallands-lan/audi-a5-e-hybrid-privatleasing-kampanj-2027-sportkupe-461977", "10 nov", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5 Sedan e-hybrid", "a5", "Laddhybrid", 4395, 1000, "Din Bil / Audi Göteborg", "Mölndal", "vastra-gotalands-lan/audi-a5-sedan-e-hybrid-quattro-299hk-privatleasing-4395kr-man-2027-sportkupe-421779", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5 Sedan e-hybrid", "a5", "Laddhybrid", 4595, 0, "Din Bil / Audi Södertälje", "Södertälje", "stockholms-lan/audi-a5-sedan-e-hybrid-quattro-proline-299hk-privatleasing-2027-sportkupe-441887", "24 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5", "a5", "Laddhybrid", 4595, 0, "Toveks Bil Varberg", "Åskloster", "hallands-lan/audi-a5-privatleasing-4-595kr-man-2027-sportkupe-408373", "6 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5 sedan e-hybrid", "a5", "Laddhybrid", 4595, 1000, "Din Bil / Audi Danderyd", "Danderyd", "stockholms-lan/audi-a5-sedan-e-hybrid-quattro-proline-edition-privatleasing-2027-sportkupe-332440", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5 Sedan e-hybrid", "a5", "Laddhybrid", 4595, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a5-sedan-e-hybrid-proline-quattro-220-kw-privatleasing-2027-sportkupe-330476", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5", "a5", "Laddhybrid", 4795, 1000, "Bilia Haninge Audi", "Handen", "stockholms-lan/audi-a5-privatleasing-4795kr-man-2027-sportkupe-426672", "13 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5 e-hybrid", "a5", "Laddhybrid", 4995, 0, "Berners Person & Transportbilar AB", "Sundsvall", "vasternorrlands-lan/audi-a5-e-hybrid-privatleasing-4995-2027-sportkupe-301188", "16 jul", 0, "Halvkombi/sedan"),
      BW("Audi", "A5", "A5 sedan s-line", "a5", "Laddhybrid", 5195, 1000, "Din Bil / Audi Danderyd", "Danderyd", "stockholms-lan/audi-a5-sedan-s-line-e-hybrid-270-kw-privatleasing-2027-sportkupe-332357", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4395, 0, "Din Bil / Audi Södertälje", "Södertälje", "stockholms-lan/audi-a5-avant-e-hybrid-quattro-proline-299hk-privatleasing-2027-sportkupe-441886", "24 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant laddhybrid", "a5avant", "Laddhybrid", 4395, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a5-avant-laddhybrid-quattro-s-tronic-299hk-privatleasing-2027-sportkupe-437492", "21 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4395, 1000, "Din Bil / Audi Göteborg", "Mölndal", "vastra-gotalands-lan/audi-a5-avant-e-hybrid-quattro-299hk-privatleasing-4395kr-man-2027-sportkupe-421777", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4395, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a5-avant-e-hybrid-q-s-tr-proline-299-hk-privatleasing-2027-sportkupe-415993", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant Quattro", "a5avant", "Hybrid", 4395, 1000, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a5-avant-quattro-laddhybrid-privatleasing-fran-4395-2026-sportkupe-335195", "14 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4395, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a5-avant-e-hybrid-proline-quattro-220-kw-privatleasing-2027-sportkupe-330577", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant E-Hybrid", "a5avant", "Laddhybrid", 4495, 1000, "AB Norrbil", "Norrtälje", "stockholms-lan/audi-a5-avant-e-hybrid-quattro-privatleasing-kampanj-just-nu-2026-sportkupe-331647", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant E-HYBRID", "a5avant", "Laddhybrid", 4595, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a5-avant-e-hybrid-quattro-299hk-privatleasing-fran-4595-2026-sportkupe-362492", "3 sep", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4595, 1000, "Din Bil / Audi Danderyd", "Danderyd", "stockholms-lan/audi-a5-avant-e-hybrid-quattro-proline-edition-privatleasing-2027-sportkupe-332426", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4595, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-a5-avant-e-hybrid-q-proline-220-kw-s-tr-privatleasing-2027-sportkupe-330463", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant Quattro", "a5avant", "Laddhybrid", 4995, 1000, "Börjessons Karlskrona", "Karlskrona", "blekinge-lan/audi-a5-avant-quattro-laddhybrid-299hk-106km-privatleasing-2026-sportkupe-421414", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 5095, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a5-avant-e-hybrid-q-s-tronic-s-line-privatleasing-2027-sportkupe-415961", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 5095, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a5-avant-e-hybrid-s-line-quattro-220-kw-privatleasing-2027-sportkupe-330505", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 5195, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-a5-avant-e-hybrid-q-s-line-edition-220kw-privatleasing-2027-sportkupe-330479", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 5495, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a5-avant-e-hybrid-q-s-tr-s-line-privatleasing-2027-sportkupe-415962", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 5695, 0, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/audi-a5-avant-e-hybrid-quattro-s-tronic-privatleasing-5-695-2026-sportkupe-231914", "15 jun", 0, "Halvkombi/sedan"),
      BW("Audi", "A5 Avant", "A5 Avant E-Hybrid", "a5avant", "Laddhybrid", 6828, 1000, "AB Norrbil", "Norrtälje", "stockholms-lan/audi-a5-avant-e-hybrid-privatleasing-keyless-drag-360cam-2025-sportkupe-331628", "13 aug", 0, "Halvkombi/sedan"),
      BW("Audi", "A6", "A6 Avant e-hybrid", null, "Laddhybrid", 7595, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a6-avant-e-hybrid-quattro-s-tronic-s-line-privatleasing-2026-kombi-415947", "10 okt", 0, "Kombi"),
      BW("Audi", "A6", "A6 Avant e-hybrid", null, "Laddhybrid", 7895, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a6-avant-e-hybrid-q-s-tronic-selection-ed-privatleasing-2026-kombi-415959", "10 okt", 0, "Kombi"),
      BW("Audi", "A6", "A6 Avant e-hybrid", null, "Laddhybrid", 7895, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a6-avant-e-hybrid-selection-edition-220-kw-privatleasing-2027-kombi-330475", "13 aug", 0, "Kombi"),
      BW("Audi", "A6", "A6 Avant e-hybrid", null, "Laddhybrid", 7895, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-a6-avant-e-hybrid-q-s-line-selection-s-tr-privatleasing-2027-kombi-330444", "13 aug", 0, "Kombi"),
      BW("Audi", "A6 Allroad", "A6 Allroad e-hybrid Proline", null, "Laddhybrid", 8995, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a6-allroad-e-hybrid-proline-edition-367hk-privatleasing-2027-kombi-437491", "21 okt", 0, "Kombi"),
      BW("Audi", "A6 Allroad", "A6 Allroad e-hybrid quattro", null, "Laddhybrid", 8995, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a6-allroad-e-hybrid-quattro-s-tronic-proline-ed-privatleasing-2027-kombi-415957", "10 okt", 0, "Kombi"),
      BW("Audi", "A6 Allroad", "A6 Allroad e-hybrid 270 kW", null, "Laddhybrid", 8995, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a6-allroad-e-hybrid-270-kw-quattro-s-tr-proline-privatleasing-2027-kombi-372506", "10 sep", 0, "Kombi"),
      BW("Audi", "A6 e-tron", "A6 e-tron Sportback e-tron", null, "El", 10295, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a6-e-tron-sportback-e-tron-proline-edition-privatleasing-2027-halvkombi-415983", "10 okt", 0, "Halvkombi/sedan"),
      BW("Audi", "A6 e-tron", "A6 e-tron Avant e-tron", null, "El", 10395, 1000, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-a6-e-tron-avant-e-tron-proline-edition-privatleasing-2027-kombi-437493", "21 okt", 0, "Kombi"),
      BW("Audi", "A6 e-tron", "A6 e-tron Avant e-tron", null, "El", 10395, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-a6-e-tron-avant-e-tron-proline-edition-privatleasing-2027-kombi-415981", "10 okt", 0, "Kombi"),
      BW("Audi", "A6 e-tron", "A6 e-tron Avant e-tron", null, "El", 10395, 1000, "Din Bil / Audi Danderyd", "Danderyd", "stockholms-lan/audi-a6-e-tron-avant-e-tron-proline-edition-privatleasing-2027-kombi-405587", "4 okt", 0, "Kombi"),
      BW("Audi", "A6 e-tron", "A6 e-tron Avant e-tron", null, "El", 10395, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-a6-e-tron-avant-e-tron-proline-210-kw-pluspaket-privatleasing-2027-kombi-330553", "13 aug", 0, "Kombi"),
      BW("Audi", "A6 e-tron", "A6 e-tron Avant e-tron", null, "El", 10395, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-a6-e-tron-avant-e-tron-proline-edition-210-00-kw-privatleasing-2027-kombi-330410", "13 aug", 0, "Kombi"),
      BW("Audi", "Q3", "Q3 SUV TFSI", null, "Bensin", 5195, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q3-suv-tfsi-proline-110-kw-s-tr-plus-alpinpkt-privatleasing-2027-suv-330597", "13 aug", 0, "SUV"),
      BW("Audi", "Q3", "Q3 SUV TFSI", null, "Bensin", 5895, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/audi-q3-suv-tfsi-proline-privatleasing-fr-5895-kr-man-2027-suv-231813", "15 jun", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron SUV Proline", "q4", "El", 4995, 1000, "Din Bil / Audi Göteborg", "Mölndal", "vastra-gotalands-lan/audi-q4-e-tron-suv-proline-performance-privatleasing-2027-crossover-421781", "10 okt", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Proline Performance", "q4", "El", 4995, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q4-e-tron-proline-performance-edition-privatleasing-2027-crossover-415968", "10 okt", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Proline Performance", "q4", "El", 4995, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-q4-e-tron-proline-performance-privatleasing-2027-crossover-410451", "7 okt", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron SUV e-tron", "q4", "El", 4995, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q4-e-tron-suv-e-tron-performance-proline-210-kw-privatleasing-2027-crossover-330544", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Performance Proline", "q4", "El", 4995, 1000, "Din Bil / Audi Smista", "Segeltorp", "stockholms-lan/audi-q4-e-tron-performance-proline-privatleasing-2027-crossover-329831", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron performance", "q4", "El", 5195, 0, "Din Bil / Audi Danderyd", "Danderyd", "stockholms-lan/audi-q4-e-tron-performance-privatleasing-2027-crossover-332439", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron SUV performance", "q4", "El", 5195, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q4-e-tron-suv-performance-proline-210-00-kw-privatleasing-2027-crossover-330401", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron E-tron 286hk", "q4", "El", 5345, 0, "Börjessons Karlskrona", "Karlskrona", "blekinge-lan/audi-q4-e-tron-e-tron-286hk-proline-performance-privatleasing-2027-crossover-421495", "10 okt", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Sportback Performance", "q4", "El", 5395, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q4-e-tron-sportback-performance-proline-privatleasing-2027-crossover-461726", "10 nov", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron quattro Proline", "q4", "El", 5395, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q4-e-tron-quattro-proline-edition-privatleasing-2027-crossover-415966", "10 okt", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron 45 Proline", "q4", "El", 5395, 1000, "Toveks Bil Motala", "Motala", "ostergotlands-lan/audi-q4-e-tron-45-proline-quattro-286-hk-privatleasing-54-mil-rackvidd-2027-crossover-151281", "19 maj", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Performance Privatleasingfr", "q4", "El", 4995, 0, "AB Norrbil", "Norrtälje", "stockholms-lan/audi-q4-e-tron-performance-privatleasingfr-4995kr-man-2027-crossover-331909", "13 aug", 15000, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron SUV 210kW", "q4", "El", 5494, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/audi-q4-e-tron-suv-210kw-performance-facelift-privatleasing-2027-crossover-178540", "4 jun", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron e-tron quattro", "q4", "El", 5595, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q4-e-tron-e-tron-quattro-proline-edition-evolution-privatleasing-2027-crossover-415967", "10 okt", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron SUV e-tron", "q4", "El", 5595, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q4-e-tron-suv-e-tron-quattro-proline-ed-evolution-privatleasing-2027-crossover-330536", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron SUV quattro", "q4", "El", 5595, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q4-e-tron-suv-quattro-proline-edition-210-00-kw-privatleasing-2027-crossover-330399", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Sportback quattro", "q4", "El", 5795, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q4-e-tron-sportback-quattro-proline-ed-privatleasing-2027-crossover-461727", "10 nov", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron SUV q", "q4", "El", 5795, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q4-e-tron-suv-q-proline-edition-evolu-210-00-kw-privatleasing-2027-crossover-330404", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Proline quattro", "q4", "El", 5795, 1000, "Din Bil / Audi Smista", "Segeltorp", "stockholms-lan/audi-q4-e-tron-proline-quattro-edition-privatleasing-2027-crossover-329843", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Proline quattro", "q4", "El", 5895, 1000, "Din Bil / Audi Smista", "Segeltorp", "stockholms-lan/audi-q4-e-tron-proline-quattro-edition-evolution-privatleasing-2027-crossover-329819", "13 aug", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron Sportback quattro", "q4", "El", 5995, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q4-e-tron-sportback-quattro-proline-ed-evolution-privatleasing-2027-crossover-461729", "10 nov", 0, "SUV"),
      BW("Audi", "Q4 e-tron", "Q4 e-tron quattro proline", "q4", "El", 6145, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/audi-q4-e-tron-quattro-proline-edition-privatleasing-2027-crossover-218338", "4 jun", 0, "SUV"),
      BW("Audi", "Q5", "Q5 SUV e-hybrid", null, "Laddhybrid", 6995, 1000, "Din Bil / Audi Smista", "Segeltorp", "stockholms-lan/audi-q5-suv-e-hybrid-kampanj-privatleasing-2026-suv-329835", "13 aug", 0, "SUV"),
      BW("Audi", "Q5", "Q5 SUV e-hybrid", null, "Laddhybrid", 7395, 1000, "Din Bil / Audi Göteborg", "Mölndal", "vastra-gotalands-lan/audi-q5-suv-e-hybrid-quattro-s-line-selection-privatleasing-2027-suv-421778", "10 okt", 0, "SUV"),
      BW("Audi", "Q5", "Q5 e-Hybrid q", null, "Laddhybrid", 7395, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q5-e-hybrid-q-s-tr-s-line-selection-ed-privatleasing-2027-suv-415988", "10 okt", 0, "SUV"),
      BW("Audi", "Q5", "Q5 e-hybrid quattro", null, "Laddhybrid", 7395, 1000, "Din Bil / Audi Danderyd", "Danderyd", "stockholms-lan/audi-q5-e-hybrid-quattro-s-line-edition-privatleasing-2027-suv-332493", "13 aug", 0, "SUV"),
      BW("Audi", "Q5", "Q5 SUV e-hybrid", null, "Laddhybrid", 7395, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q5-suv-e-hybrid-selection-edition-270-kw-privatleasing-2027-suv-330484", "13 aug", 0, "SUV"),
      BW("Audi", "Q5", "Q5 e-hybrid q", null, "Laddhybrid", 7395, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q5-e-hybrid-q-s-tr-s-line-selection-privatleasing-2027-suv-330437", "13 aug", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron Proline 185 KW", "q6", "El", 6395, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-q6-e-tron-proline-185-kw-privatleasing-2027-suv-440904", "23 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron SUV e-tron", "q6", "El", 6395, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q6-e-tron-suv-e-tron-185-00-kw-proline-privatleasing-2027-suv-427164", "13 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron e-tron Proline", "q6", "El", 6395, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q6-e-tron-e-tron-proline-privatleasing-2027-suv-415942", "10 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron Proline 185 Kw", "q6", "El", 6395, 1000, "Din Bil / Audi Hudiksvall", "Hudiksvall", "gavleborgs-lan/audi-q6-e-tron-proline-185-kw-privatleasing-2027-suv-412895", "9 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron SUV e-tron", "q6", "El", 6395, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q6-e-tron-suv-e-tron-185-00-kw-proline-edition-privatleasing-2027-suv-373771", "10 sep", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron e-tron Sportback", "q6", "El", 6795, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q6-e-tron-e-tron-sportback-proline-privatleasing-2027-suv-415944", "10 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron SUV e-tron", "q6", "El", 6995, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q6-e-tron-suv-e-tron-performan-225-00-kw-proline-privatleasing-2027-suv-427163", "13 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron e-tron Proline", "q6", "El", 6995, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q6-e-tron-e-tron-proline-performance-privatleasing-2027-suv-415940", "10 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron SUV e-tron", "q6", "El", 6995, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q6-e-tron-suv-e-tron-perf-225-00-kw-proline-ed-privatleasing-2027-suv-373769", "10 sep", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron e-tron Sportback", "q6", "El", 7395, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q6-e-tron-e-tron-sportback-performance-privatleasing-2027-suv-415946", "10 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron quattro Proline", "q6", "El", 10995, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q6-e-tron-quattro-proline-privatleasing-2027-suv-415999", "10 okt", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron e-tron quattro", "q6", "El", 10995, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q6-e-tron-e-tron-quattro-proline-315-kw-pluspkt-privatleasing-2027-suv-330502", "13 aug", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron SUV e-tron", "q6", "El", 10995, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q6-e-tron-suv-e-tron-q-proline-edition-315-00-kw-privatleasing-2027-suv-330416", "13 aug", 0, "SUV"),
      BW("Audi", "Q6 e-tron", "Q6 e-tron e-tron Sportback", "q6", "El", 11495, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q6-e-tron-e-tron-sportback-quattro-proline-privatleasing-2027-suv-415953", "10 okt", 0, "SUV"),
      BW("Audi", "Q7", "Q7 TDI quattro", null, "Diesel", 11595, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q7-tdi-quattro-tiptronic-privatleasing-2027-suv-415929", "10 okt", 0, "SUV"),
      BW("Audi", "Q8", "Q8 SUV 60", null, "Laddhybrid", 7995, 0, "Din Bil / Audi Gävle", "Gävle", "gavleborgs-lan/audi-q8-suv-60-tfsie-quattro-privatleasing-2027-suv-440901", "23 okt", 0, "SUV"),
      BW("Audi", "Q8", "Q8 e-hybrid quattro", null, "Laddhybrid", 7995, 0, "Din Bil / Audi Göteborg", "Mölndal", "vastra-gotalands-lan/audi-q8-e-hybrid-quattro-s-line-490hk-privatleasing-2027-suv-421774", "10 okt", 0, "SUV"),
      BW("Audi", "Q8", "Q8 60 TFSIe", null, "Hybrid", 7995, 1000, "Din Bil / Audi Helsingborg", "Helsingborg", "skane-lan/audi-q8-60-tfsie-quattro-edition-tiptronic-s-line-privatleasing-2027-suv-415960", "10 okt", 0, "SUV"),
      BW("Audi", "Q8", "Q8 e-hybrid quattro", null, "Laddhybrid", 7995, 1000, "Din Bil / Audi Kista", "Kista", "stockholms-lan/audi-q8-e-hybrid-quattro-s-line-edition-360-kw-privatleasing-2027-suv-330537", "13 aug", 0, "SUV"),
      BW("Audi", "Q8", "Q8 SUV TFSI", null, "Hybrid", 7995, 1000, "Din Bil / Audi Hammarby", "Stockholm", "stockholms-lan/audi-q8-suv-tfsi-e-q-edition-360-kw-tip-tr-privatleasing-2026-suv-330480", "13 aug", 0, "SUV"),
      BW("Audi", "Q8", "Q8 TFSIe 490hk", null, "Laddhybrid", 8749, 1000, "Bilab Kungälv", "Kungälv", "vastra-gotalands-lan/audi-q8-tfsie-490hk-s-line-privatleasing-8-749-man-2026-suv-332576", "13 aug", 0, "SUV"),
      BW("Audi", "e-tron", "e-tron Q4 Performance", null, "El", 4995, 0, "AB Norrbil", "Norrtälje", "stockholms-lan/audi-e-tron-q4-performance-privatleasing-fr-4995kr-man-2027-suv-331829", "13 aug", 15000, "SUV"),
      BW("BMW", "1-serie", "M135", "bmw120", "Bensin", 2895, 0, "Autowåx Bil AB", "Karlstad", "varmlands-lan/bmw-m135-privatleasing-kampanj-2027-halvkombi-446180", "28 okt", 0, "Halvkombi/sedan"),
      BW("BMW", "1-serie", "120", "bmw120", "Bensin", 3753, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-120-privatleasing-fr-3-753-kr-man-kampanj-2027-halvkombi-362220", "3 sep", 0, "Halvkombi/sedan"),
      BW("BMW", "1-serie", "120", "bmw120", "Bensin", 2795, 1000, "Autowåx Bil AB", "Karlstad", "varmlands-lan/bmw-120-privatleasing-kampanj-2026-halvkombi-257187", "26 jun", 35000, "Halvkombi/sedan"),
      BW("BMW", "1-serie", "120", "bmw120", "Bensin", 3795, 1000, "Förenade Bil i Ängelholm", "Ängelholm", "skane-lan/bmw-120-privatleasing-fran-3-795-kr-man-2026-halvkombi-418628", "10 okt", 0, "Halvkombi/sedan"),
      BW("BMW", "1-serie", "120", "bmw120", "Bensin", 3795, 1000, "Förenade Bil i Helsingborg", "Helsingborg", "skane-lan/bmw-120-privatleasing-fast-ranta-fran-3-795kr-man-2026-halvkombi-330688", "13 aug", 0, "Halvkombi/sedan"),
      BW("BMW", "1-serie", "M135 i", "bmw120", "Bensin", 3999, 1000, "Förenade Bil i Helsingborg", "Helsingborg", "skane-lan/bmw-m135-i-privatleasing-kampanj-24-man-fr-3-999-man-2026-halvkombi-330723", "13 aug", 0, "Halvkombi/sedan"),
      BW("BMW", "1-serie", "M135 i xDrive", "bmw120", "Bensin", 4264, 1000, "Förenade Bil i Kristianstad", "Kristianstad", "skane-lan/bmw-m135-i-xdrive-harman-kardon-privatleasing-24-man-2027-halvkombi-416454", "10 okt", 0, "Halvkombi/sedan"),
      BW("BMW", "5-serie", "530 e xDrive", null, "Hybrid", 6995, 0, "Förenade Bil i Lund", "Lund", "skane-lan/bmw-530-e-xdrive-touring-m-sport-privatleasing-12man-fran-6-995kr-2027-kombi-438870", "22 okt", 0, "Kombi"),
      BW("BMW", "X1", "X1 Active Edition", null, "Bensin", 5395, 0, "Förenade Bil i Helsingborg", "Helsingborg", "skane-lan/bmw-x1-active-edition-privatleasing-kampanj-fr-5-395-man-2026-suv-330711", "13 aug", 0, "SUV"),
      BW("BMW", "X1", "X1 xDrive25e", null, "Hybrid", 6395, 0, "Förenade Bil i Ängelholm", "Ängelholm", "skane-lan/bmw-x1-xdrive25e-privatleasing-fr-6-395kr-man-2026-suv-418640", "10 okt", 0, "SUV"),
      BW("BMW", "X1", "X1 xDrive25e", null, "Hybrid", 6395, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-x1-xdrive25e-privatleasing-fr-6-395-kr-man-2027-suv-333316", "13 aug", 0, "SUV"),
      BW("BMW", "X3", "X3 xDrive30e M", null, "Laddhybrid", 7995, 0, "Bilia Trollhättan - BMW MINI", "Trollhättan", "vastra-gotalands-lan/bmw-x3-xdrive30e-m-sport-active-ed-privatleasing-kampanj-2025-suv-420283", "10 okt", 0, "SUV"),
      BW("BMW", "X3", "X3 30 xDrive", null, "Hybrid", 8295, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-x3-30-xdrive-privatleasing-fr-8-295-kr-man-2027-suv-332669", "13 aug", 0, "SUV"),
      BW("BMW", "iX", "iX xDrive60", null, "El", 12295, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-ix-xdrive60-privatleasing-fr-12-295-kr-man-2027-suv-332664", "13 aug", 0, "SUV"),
      BW("BMW", "iX1", "iX1 eDrive20 Active", null, "El", 5995, 1000, "Förenade Bil i Ängelholm", "Ängelholm", "skane-lan/bmw-ix1-edrive20-active-edition-privatleasing-fr-5-995kr-man-2027-suv-463073", "10 nov", 0, "SUV"),
      BW("BMW", "iX1", "iX1 eDrive20", null, "El", 5995, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-ix1-edrive20-privatleasing-fr-5-995-kr-man-2027-suv-333314", "13 aug", 0, "SUV"),
      BW("BMW", "iX1", "iX1 eDrive20", null, "El", 5995, 1000, "Förenade Bil i Helsingborg", "Helsingborg", "skane-lan/bmw-ix1-edrive20-privatleasing-fran-5-995-kr-man-2026-suv-330667", "13 aug", 0, "SUV"),
      BW("BMW", "iX1", "iX1 xDrive30", null, "El", 6195, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-ix1-xdrive30-privatleasing-fr-6-195-kr-man-2027-suv-333354", "13 aug", 0, "SUV"),
      BW("BMW", "iX1", "iX1 xDrive 30", null, "El", 5249, 1000, "Autowåx Bil AB", "Karlstad", "varmlands-lan/bmw-ix1-xdrive-30-privatleasing-kampanj-2027-suv-350415", "25 aug", 35000, "SUV"),
      BW("BMW", "iX2", "iX2 xDrive30", "ix2", "El", 6895, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-ix2-xdrive30-privatleasing-fr-6-895-kr-man-2027-suv-333330", "13 aug", 0, "SUV"),
      BW("BMW", "iX2", "iX2 xDrive30", "ix2", "El", 6895, 0, "Förenade Bil i Helsingborg", "Helsingborg", "skane-lan/bmw-ix2-xdrive30-privatleasing-kampanj-fr-6-895-man-2026-suv-330699", "13 aug", 0, "SUV"),
      BW("BMW", "iX3", "iX3 40 xDrive", null, "El", 9695, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/bmw-ix3-40-xdrive-snabb-leverans-privatleasing-fr-9-695kr-man-2027-suv-332659", "13 aug", 0, "SUV"),
      BW("BYD", "Seal", "Seal 6 DM-i", null, "Laddhybrid", 3895, 0, "Platinumcars.se", "Åby", "ostergotlands-lan/byd-seal-6-dm-i-touring-privatleasing-forsakring-service-0kr-2026-sedan-271169", "26 jun", 0, "Halvkombi/sedan"),
      BW("BYD", "Seal 6", "Seal 6 Comfort", "seal6", "Laddhybrid", 4869, 1000, "Hedin Automotive Akalla", "Kista", "stockholms-lan/byd-seal-6-comfort-privatleasing-4869kr-man-2025-halvkombi-429942", "15 okt", 0, "Halvkombi/sedan"),
      BW("BYD", "Seal U", "Seal U DM-i", null, "Laddhybrid", 4595, 1000, "Bendt Bil AB", "Halmstad", "hallands-lan/byd-seal-u-dm-i-privatleasing-inkl-forsakring-0-kontant-2026-suv-272875", "26 jun", 0, "SUV"),
      BW("BYD", "Seal U", "Seal U DM-i AWD", null, "Laddhybrid", 4595, 0, "Platinumcars.se", "Åby", "ostergotlands-lan/byd-seal-u-dm-i-awd-324hk-privatleasing-ink-forsakring-0-kontant-2026-suv-271173", "26 jun", 0, "SUV"),
      BW("BYD", "Seal U", "Seal U DM-i", null, "Laddhybrid", 4846, 1000, "Bendt Bil AB", "Halmstad", "hallands-lan/byd-seal-u-dm-i-privatleasing-inkl-forsakring-0-kontant-2026-suv-273148", "26 jun", 0, "SUV"),
      BW("BYD", "Seal U", "Seal U DM-i", null, "Laddhybrid", 4895, 1000, "Bendt Bil AB", "Halmstad", "hallands-lan/byd-seal-u-dm-i-privatleasing-inkl-forsakring-0-kontant-2026-suv-273127", "26 jun", 0, "SUV"),
      BW("BYD", "Seal U", "Seal U DM-i", null, "Laddhybrid", 5095, 1000, "Bendt Bil AB", "Halmstad", "hallands-lan/byd-seal-u-dm-i-privatleasing-inkl-forsakring-0-kontant-2026-suv-370296", "9 sep", 0, "SUV"),
      BW("BYD", "Seal U", "Seal U DM-i", null, "Laddhybrid", 5346, 1000, "Bendt Bil AB", "Halmstad", "hallands-lan/byd-seal-u-dm-i-privatleasing-inkl-forsakring-0-kontant-2026-suv-364069", "4 sep", 0, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross Plus", null, "Bensin", 2799, 0, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/citroen-c3-aircross-plus-privatleasing-fran-2799kr-manad-2026-crossover-328445", "13 aug", 0, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-377018", "14 sep", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-376872", "14 sep", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-376420", "14 sep", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-285614", "3 jul", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-270682", "26 jun", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-269039", "26 jun", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-254531", "26 jun", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-252219", "26 jun", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-250153", "26 jun", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-249197", "26 jun", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross MAX Hybrid", null, "Hybrid", 2999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-c3-aircross-max-hybrid-145hk-privatleasing-2026-crossover-245455", "26 jun", 10000, "SUV"),
      BW("Citroën", "C3 Aircross", "Citroen C3 Aircross Plus Hybrid", null, "Hybrid", 3527, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/citroen-c3-aircross-plus-hybrid-7sits-privatleasing-36man-2026-crossover-328431", "13 aug", 0, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-377016", "14 sep", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-376874", "14 sep", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-376415", "14 sep", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-285609", "3 jul", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-270610", "26 jun", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-268931", "26 jun", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-254463", "26 jun", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-252140", "26 jun", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-250123", "26 jun", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-249066", "26 jun", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 PLUS Hybrid", null, "Hybrid", 2599, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-suv-245449", "26 jun", 10000, "SUV"),
      BW("Citroën", "C4", "Citroen C4 Plus Hybrid", null, "Hybrid", 2899, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/citroen-c4-plus-hybrid-145hk-aut-privatleasing-2026-halvkombi-330791", "13 aug", 0, "Halvkombi/sedan"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross PLUS Hybrid", null, "Hybrid", 2799, 0, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/citroen-c5-aircross-plus-hybrid-145hk-auto-privatleasing-fran-2799kr-mnd-2026-suv-328412", "13 aug", 0, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 2899, 0, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/citroen-c5-aircross-max-hybrid-145hk-auto-privatleasing-fran-2899kr-mnd-2026-suv-328410", "13 aug", 0, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3199, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/citroen-c5-aircross-max-hybrid-145-e-dcs-privatleasing-2026-suv-330834", "13 aug", 0, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-377013", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-376867", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-376414", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-285611", "3 jul", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-270977", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-269036", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-254532", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-252215", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-250235", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-249100", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross Plus Hybrid", null, "Hybrid", 3299, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-c5-aircross-plus-hybrid-145hk-aut-privatleasing-2026-suv-245447", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-377021", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-376868", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-376417", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-285607", "3 jul", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-271020", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-269052", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-254538", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-252268", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-250162", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-249106", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3399, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-2026-suv-245441", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Hybrid", null, "Hybrid", 3699, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/citroen-c5-aircross-max-hybrid-145hk-aut-privatleasing-3699-kr-man-2026-suv-270262", "26 jun", 0, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4199, 0, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/citroen-c5-aircross-max-phev-hybrid-225hk-95km-rackvidd-pa-el-privatleasing-2026-suv-328413", "13 aug", 0, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Plug-in", null, "Laddhybrid", 4799, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/citroen-c5-aircross-max-plug-in-hybrid-195hk-privatleasing-4799-kr-man-2026-suv-270263", "26 jun", 0, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-377017", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-376869", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-376413", "14 sep", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-285610", "3 jul", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-270684", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-269041", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-254679", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-252228", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-250157", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-249107", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX PHEV", null, "Laddhybrid", 4699, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-c5-aircross-max-phev-195hk-aut-privatleasing-2026-suv-245439", "26 jun", 10000, "SUV"),
      BW("Citroën", "C5 AirCross", "Citroen C5 AirCross MAX Elektrisk", null, "El", 5499, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/citroen-c5-aircross-max-elektrisk-73-kwh-520km-privatleasing-5499-kr-man-2026-suv-270265", "26 jun", 0, "SUV"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3399, 0, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-285616", "3 jul", 0, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-377022", "14 sep", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-376878", "14 sep", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-376422", "14 sep", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-270989", "26 jun", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-269044", "26 jun", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-254681", "26 jun", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-252232", "26 jun", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-250244", "26 jun", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-249101", "26 jun", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3", "Citroen e-C3 MAX 44 kWh", null, "El", 3199, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-e-c3-max-44-kwh-privatleasing-2026-halvkombi-245463", "26 jun", 10000, "Halvkombi/sedan"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-377019", "14 sep", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-376876", "14 sep", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-376419", "14 sep", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-285613", "3 jul", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-270717", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-268960", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-254524", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-252162", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-250142", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-249099", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX", null, "El", 3099, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-e-c3-aircross-max-privatleasing-2026-suv-245453", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX 44 kWh", null, "El", 3399, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/citroen-e-c3-aircross-max-44-kwh-300-km-privatleasing-3399-kr-man-2026-suv-270196", "26 jun", 0, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-377012", "14 sep", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-376870", "14 sep", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-376418", "14 sep", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-285612", "3 jul", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Täby", "Täby", "stockholms-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-270704", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-268959", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-254529", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-252164", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-250143", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Haninge", "Handen", "stockholms-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-249104", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3399, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/citroen-e-c3-aircross-max-long-range-privatleasing-2026-suv-245452", "26 jun", 10000, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX Long Range", null, "El", 3699, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/citroen-e-c3-aircross-max-long-range-400km-privatleasing-2025-suv-330779", "13 aug", 0, "SUV"),
      BW("Citroën", "e-C3 Aircross", "Citroen e-C3 Aircross MAX 54 kWh", null, "El", 3699, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/citroen-e-c3-aircross-max-54-kwh-400-km-privatleasing-3699-kr-man-2026-suv-270264", "26 jun", 0, "SUV"),
      BW("Cupra", "Born", "Born 58kWh 190hk", "born", "El", 3595, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-born-58kwh-190hk-privatleasing-nya-sommar-kampanj-2027-halvkombi-305701", "22 jul", 20000, "Halvkombi/sedan"),
      BW("Cupra", "Born", "Born 58kWh 190hk", "born", "El", 3945, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-born-58kwh-190hk-privatleasing-nya-2027-halvkombi-424405", "12 okt", 15000, "Halvkombi/sedan"),
      BW("Cupra", "Born", "Born 58kWh 190hk", "born", "El", 4095, 1000, "Aftén Bil CUPRA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/cupra-born-58kwh-190hk-hostkampanj-privatleasing-2027-halvkombi-281248", "1 jul", 10000, "Halvkombi/sedan"),
      BW("Cupra", "Born", "Born 58 kWh 190hk", "born", "El", 4646, 0, "Din Bil / CUPRA Falun", "Falun", "dalarnas-lan/cupra-born-58-kwh-190hk-privatleasing-2027-halvkombi-238183", "24 jun", 10000, "Halvkombi/sedan"),
      BW("Cupra", "Formentor", "Formentor 1.5 eTSI", "formentor", "Bensin", 2695, 1000, "Din Bil / CUPRA Lund", "Lund", "skane-lan/cupra-formentor-1-5-etsi-150hk-dsg-privatleasing-kampanj-lager-bilar-2026-suv-224950", "9 jun", 0, "SUV"),
      BW("Cupra", "Formentor", "Formentor 1.5 eTSI", "formentor", "Bensin", 3085, 1000, "CUPRA Norrköping Bilia", "Norrköping", "ostergotlands-lan/cupra-formentor-1-5-etsi-150-hk-dsg7-privatleasing-lagerbil-2026-suv-280349", "1 jul", 0, "SUV"),
      BW("Cupra", "Formentor", "Formentor eTSI 150hk", "formentor", "Bensin", 2845, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-formentor-etsi-150hk-dsg-tribe-edition-privatleasing-2026-suv-424403", "12 okt", 15000, "SUV"),
      BW("Cupra", "Formentor", "Formentor eTSI 150hk", "formentor", "Bensin", 2845, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/cupra-formentor-etsi-150hk-dsg-tribe-edition-privatleasing-2026-suv-411819", "8 okt", 15000, "SUV"),
      BW("Cupra", "Formentor", "Formentor 1.5 eTSI", "formentor", "Bensin", 3495, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/cupra-formentor-1-5-etsi-150-hk-tribe-edt-privatleasing-2027-suv-296141", "13 jul", 0, "SUV"),
      BW("Cupra", "Formentor", "Formentor eTSI150hk", "formentor", "Bensin", 3649, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/cupra-formentor-etsi150hk-privatleasing-inkl-edgepaket-2027-suv-414251", "10 okt", 0, "SUV"),
      BW("Cupra", "Formentor", "Formentor eTSI 150hk", "formentor", "Bensin", 3195, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-formentor-etsi-150hk-dsg-privatleasing-2026-suv-306876", "23 jul", 20000, "SUV"),
      BW("Cupra", "Formentor", "Formentor eTSI 150hk", "formentor", "Bensin", 3795, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/cupra-formentor-etsi-150hk-b-w-privatleasing-2026-suv-428774", "14 okt", 0, "SUV"),
      BW("Cupra", "Formentor", "Formentor 150hk", "formentor", "Bensin", 3995, 0, "CUPRA Norrköping Bilia", "Norrköping", "ostergotlands-lan/cupra-formentor-150hk-privatleasing-3695-inkl-utrustning-2026-suv-158365", "22 maj", 0, "SUV"),
      BW("Cupra", "Formentor", "Formentor e-HYBRID e-Hybrid", "formentor", "Laddhybrid", 4630, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-formentor-e-hybrid-e-hybrid-204hk-tribe-edition-privatleasing-lagerbil-2026-suv-218350", "4 jun", 20000, "SUV"),
      BW("Cupra", "Leon", "Leon", "leon", "Bensin", 3295, 1000, "CUPRA Norrköping Bilia", "Norrköping", "ostergotlands-lan/cupra-leon-privatleasing-24man-inklusive-vinterhjul-plus-edgepaket-2026-suv-437161", "21 okt", 0, "SUV"),
      BW("Cupra", "Leon", "Leon", "leon", "Laddhybrid", 3795, 1000, "Din Bil / CUPRA Malmö", "Malmö", "skane-lan/cupra-leon-privatleasing-sp-204hk-e-hybrid-inkl-ultimate-edition-2026-suv-354035", "27 aug", 10000, "SUV"),
      BW("Cupra", "Leon", "Leon SP 1.5", "leon", "Laddhybrid", 4295, 1000, "Aftén Bil CUPRA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/cupra-leon-sp-1-5-plug-in-12-mil-pa-el-privatleasing-utan-insats-2026-suv-266926", "26 jun", 0, "SUV"),
      BW("Cupra", "Leon", "Leon 1.5 E-HYBRID", "leon", "Laddhybrid", 4595, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/cupra-leon-1-5-e-hybrid-204-dsg-privatleasing-2026-suv-414249", "10 okt", 0, "SUV"),
      BW("Cupra", "Leon Sportstourer", "Leon Sportstourer eTSI", "cupraleon", "Bensin", 3445, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-leon-sportstourer-etsi-150hk-privatleasing-2026-suv-424400", "12 okt", 15000, "SUV"),
      BW("Cupra", "Leon Sportstourer", "Leon Sportstourer 1.5", "cupraleon", "Bensin", 4495, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/cupra-leon-sportstourer-1-5-150-hk-privatleasing-tribe-edt-2027-suv-296142", "13 jul", 0, "SUV"),
      BW("Cupra", "Raval", "Raval Plus 37 kWh", "raval", "El", 2995, 1000, "Din Bil / CUPRA Lund", "Lund", "skane-lan/cupra-raval-plus-37-kwh-135hk-privatleasing-2027-halvkombi-304946", "21 jul", 10000, "Halvkombi/sedan"),
      BW("Cupra", "Raval", "Raval Plus 37 kWh", "raval", "El", 3195, 1000, "Frontbilar AB", "Hisings Kärra", "vastra-gotalands-lan/cupra-raval-plus-37-kwh-135-hk-privatleasing-2027-halvkombi-297686", "14 jul", 10000, "Halvkombi/sedan"),
      BW("Cupra", "Raval", "Raval Plus 37 kWh", "raval", "El", 3195, 1000, "Din Bil / CUPRA Malmö", "Malmö", "skane-lan/cupra-raval-plus-37-kwh-135hk-privatleasing-2027-halvkombi-296689", "13 jul", 10000, "Halvkombi/sedan"),
      BW("Cupra", "Raval", "Raval Plus 37 kWh", "raval", "El", 3145, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-raval-plus-37-kwh-135hk-privatleasing-2026-halvkombi-424399", "12 okt", 15000, "Halvkombi/sedan"),
      BW("Cupra", "Raval", "Raval Endurance 52 kWh", "raval", "El", 3345, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-raval-endurance-52-kwh-210hk-privatleasing-2026-halvkombi-424401", "12 okt", 15000, "Halvkombi/sedan"),
      BW("Cupra", "Raval", "Raval Endurance 52kWh", "raval", "El", 3995, 1000, "Aftén Bil CUPRA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/cupra-raval-endurance-52kwh-211hk-privatleasing-0kr-insats-2026-halvkombi-266826", "26 jun", 0, "Halvkombi/sedan"),
      BW("Cupra", "Raval", "Raval Endurance 52kWh", "raval", "El", 4250, 1000, "Aftén Bil CUPRA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/cupra-raval-endurance-52kwh-privatleaisng-ink-vinterhjul-2027-halvkombi-457621", "6 nov", 0, "Halvkombi/sedan"),
      BW("Cupra", "Raval", "Raval VZ 52kWh", "raval", "El", 4395, 1000, "Frontbilar AB", "Hisings Kärra", "vastra-gotalands-lan/cupra-raval-vz-52kwh-225hk-privatleasing-2027-halvkombi-412259", "8 okt", 10000, "Halvkombi/sedan"),
      BW("Cupra", "Tavascan", "Tavascan Drive 77 kWh", "tavascan", "El", 4215, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-tavascan-drive-77-kwh-286hk-privatleasing-kampanj-2025-suv-373539", "10 sep", 20000, "SUV"),
      BW("Cupra", "Tavascan", "Tavascan VZ 77kWh", "tavascan", "El", 4895, 1000, "Din Bil / CUPRA Malmö", "Malmö", "skane-lan/cupra-tavascan-vz-77kwh-awd-swedish-edition-privatleasing-2025-suv-224953", "9 jun", 10000, "SUV"),
      BW("Cupra", "Tavascan", "Tavascan 77 kWh 286hk", "tavascan", "El", 5835, 1000, "Lecab AB", "Karlstad", "varmlands-lan/cupra-tavascan-77-kwh-286hk-privatleasing-fran-5835-kr-man-2025-suv-227944", "11 jun", 10000, "SUV"),
      BW("Cupra", "Tavascan", "Tavascan VZ 77 kWh", "tavascan", "El", 6959, 1000, "Lecab AB", "Karlstad", "varmlands-lan/cupra-tavascan-vz-77-kwh-340hk-awd-privatleasing-fran-6-959-kr-man-2025-suv-227942", "11 jun", 10000, "SUV"),
      BW("Cupra", "Terramar", "Terramar 150 eTSI", "terramar", "Bensin", 2695, 1000, "Frontbilar AB", "Hisings Kärra", "vastra-gotalands-lan/cupra-terramar-150-etsi-privatleasing-bast-i-sverige-erbjudande-2026-suv-413690", "9 okt", 10000, "SUV"),
      BW("Cupra", "Terramar", "Terramar TRIBE Edition", "terramar", "Bensin", 3499, 1000, "Din Bil / CUPRA Lund", "Lund", "skane-lan/cupra-terramar-tribe-edition-1-5-etsi-150hk-privatleasing-kampanj-2026-suv-312239", "29 jul", 0, "SUV"),
      BW("Cupra", "Terramar", "Terramar", "terramar", "Bensin", 3595, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/cupra-terramar-privatleasing-erbjudande-2027-suv-428773", "14 okt", 0, "SUV"),
      BW("Cupra", "Terramar", "Terramar 1.5 eTSI", "terramar", "Bensin", 3595, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/cupra-terramar-1-5-etsi-150hk-privatleasing-inkl-edgepaket-2026-suv-414250", "10 okt", 0, "SUV"),
      BW("Cupra", "Terramar", "Terramar eTSI 150hk", "terramar", "Bensin", 3195, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/cupra-terramar-etsi-150hk-dsg-tribe-edition-privatleasing-2026-suv-373538", "10 sep", 20000, "SUV"),
      BW("DFSK", "500", "500 114hk Automat", null, "Bensin", 3299, 0, "Dahlbacka Bil AB", "Saltsjö-Boo", "stockholms-lan/dfsk-500-114hk-automat-6-ars-garanti-privatleasing-2025-suv-268677", "26 jun", 0, "SUV"),
      BW("DFSK", "E5", "E5 Plug-in Hybrid", null, "Laddhybrid", 6490, 0, "Dahlbacka Bil AB", "Saltsjö-Boo", "stockholms-lan/dfsk-e5-plug-in-hybrid-283hk-87km-wltp-privatleasing-2025-suv-268685", "26 jun", 0, "SUV"),
      BW("DS", "7", "7 7 130hk", null, "Diesel", 2799, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/ds-7-7-130hk-auto-pallas-premiumbil-privatleasing-36-manad-2026-suv-328466", "13 aug", 0, "SUV"),
      BW("DS", "7 Crossback", "7 Crossback 7 Pallas", null, "Diesel", 2799, 1000, "J BIL Täby", "Täby", "stockholms-lan/ds-7-crossback-7-pallas-130hk-aut-privatleasing-2026-suv-270802", "26 jun", 0, "SUV"),
      BW("DS", "7 Crossback", "7 Crossback 7 Pallas", null, "Diesel", 2799, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/ds-7-crossback-7-pallas-130hk-aut-privatleasing-2026-suv-268988", "26 jun", 0, "SUV"),
      BW("DS", "7 Crossback", "7 Crossback 7 Pallas", null, "Diesel", 2799, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/ds-7-crossback-7-pallas-130hk-aut-privatleasing-2026-suv-254590", "26 jun", 0, "SUV"),
      BW("DS", "7 Crossback", "7 Crossback 7 Pallas", null, "Diesel", 2799, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/ds-7-crossback-7-pallas-130hk-aut-privatleasing-2026-suv-252171", "26 jun", 0, "SUV"),
      BW("DS", "7 Crossback", "7 Crossback 7 Pallas", null, "Diesel", 2799, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/ds-7-crossback-7-pallas-130hk-aut-privatleasing-2026-suv-250186", "26 jun", 0, "SUV"),
      BW("DS", "7 Crossback", "7 Crossback 7 Pallas", null, "Diesel", 2799, 1000, "J BIL Haninge", "Handen", "stockholms-lan/ds-7-crossback-7-pallas-130hk-aut-privatleasing-2026-suv-249139", "26 jun", 0, "SUV"),
      BW("DS", "7 Crossback", "7 Crossback 7 Pallas", null, "Diesel", 2799, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/ds-7-crossback-7-pallas-130hk-aut-privatleasing-2026-suv-245579", "26 jun", 0, "SUV"),
      BW("Dacia", "Duster", "Duster 4x4 hybrid", null, "Hybrid", 3390, 0, "Tage Rejmes Bil AB - Norrköping", "Norrköping", "ostergotlands-lan/dacia-duster-4x4-hybrid-150-expression-privatleasing-2026-suv-467063", "13 nov", 0, "SUV"),
      BW("Dacia", "Duster", "Duster 155 EXPRESSION", null, "Hybrid", 3390, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/dacia-duster-155-expression-3390-man-privatleasing-2026-suv-408151", "6 okt", 0, "SUV"),
      BW("Dacia", "Duster", "Duster EXPRESSION HYBRID", null, "Hybrid", 3390, 0, "Hedin Automotive Borås", "Borås", "vastra-gotalands-lan/dacia-duster-expression-hybrid-150-4x4-privatleasing-fr-3390-kr-ma-2026-suv-395265", "25 sep", 0, "SUV"),
      BW("Dacia", "Duster", "Duster Expression HYBRID", null, "Hybrid", 3390, 0, "Hedin Automotive Alingsås", "Alingsås", "vastra-gotalands-lan/dacia-duster-expression-hybrid-150-4x4-privatleasing-fr-3390kr-man-2026-suv-288024", "6 jul", 0, "SUV"),
      BW("Dacia", "Duster", "Duster EXPRESSION FULLHYBRID", null, "Hybrid", 3390, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/dacia-duster-expression-fullhybrid-155-aut-privatleasing-3390-man-2026-suv-157897", "22 maj", 0, "SUV"),
      BW("Dacia", "Duster", "Duster 4x4 hybrid", null, "Hybrid", 3590, 0, "Tage Rejmes Bil AB - Norrköping", "Norrköping", "ostergotlands-lan/dacia-duster-4x4-hybrid-150-extreme-privatleasing-2026-suv-467061", "13 nov", 0, "SUV"),
      BW("Dacia", "Duster", "Duster EXTREME HYBRID", null, "Hybrid", 3590, 0, "Hedin Automotive Västerås Bilvaruhuset", "Västerås", "vastmanlands-lan/dacia-duster-extreme-hybrid-150-4x4-privatleasing-fr-3590-man-2026-suv-365936", "5 sep", 0, "SUV"),
      BW("Dacia", "Sandero", "Sandero essential TCe", "sandero", "Bensin", 1990, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/dacia-sandero-essential-tce-100-privatleasing-1-990-kr-man-2026-halvkombi-366497", "7 sep", 0, "Halvkombi/sedan"),
      BW("Dacia", "Sandero", "Sandero ESSENTIAL", "sandero", "Bensin", 1990, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/dacia-sandero-essential-1990-man-privatleasing-inkl-service-2026-halvkombi-157895", "22 maj", 0, "Halvkombi/sedan"),
      BW("Dacia", "Sandero", "Sandero Stepway III", "sandero", "Bensin", 2190, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/dacia-sandero-stepway-iii-tce-110-stepway-extreme-privatleasing-2027-kombi-366437", "7 sep", 0, "Kombi"),
      BW("Dacia", "Sandero", "Sandero Stepway EXTREME", "sandero", "Bensin", 2190, 0, "Hedin Automotive Borås", "Borås", "vastra-gotalands-lan/dacia-sandero-stepway-extreme-tce-110-privatleasing-fr-2190-kr-man-2026-kombi-243093", "26 jun", 0, "Kombi"),
      BW("Dacia", "Sandero", "Sandero Stepway STEPWAY", "sandero", "Bensin", 2190, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/dacia-sandero-stepway-stepway-110-extreme-privatleasing-inkl-service-2190-m-2026-halvkombi-170774", "30 maj", 0, "Halvkombi/sedan"),
      BW("Dacia", "Sandero", "Sandero III TCe", "sandero", "Bensin", 2290, 0, "Tage Rejmes Bil AB - Norrköping", "Norrköping", "ostergotlands-lan/dacia-sandero-iii-tce-110-stepway-extreme-privatleasing-2026-halvkombi-467062", "13 nov", 0, "Halvkombi/sedan"),
      BW("Dacia", "Sandero", "Sandero Expression Hybrid", "sandero", "Hybrid", 2790, 0, "Hedin Automotive Ängelholm", "Ängelholm", "skane-lan/dacia-sandero-expression-hybrid-155-privatleasing-fr-2790-kr-man-2027-halvkombi-428763", "14 okt", 0, "Halvkombi/sedan"),
      BW("Dacia", "Sandero", "Sandero Extreme HYBRID", "sandero", "Hybrid", 2990, 0, "Hedin Automotive Ängelholm", "Ängelholm", "skane-lan/dacia-sandero-extreme-hybrid-155-privatleasing-2990-kr-man-2027-suv-425196", "12 okt", 0, "SUV"),
      BW("Ford", "Capri", "Capri RWD LR", null, "El", 4995, 1000, "Hedin Automotive Lund", "Lund", "skane-lan/ford-capri-rwd-lr-business-edition-privatleasing-fr-4995-2025-sportkupe-425953", "13 okt", 0, "Halvkombi/sedan"),
      BW("Ford", "Capri", "Capri Premium RWD", null, "El", 5995, 0, "Hedin Automotive Ford Haninge", "Österhaninge", "stockholms-lan/ford-capri-premium-rwd-long-range-privatleasing-fran-5995kr-man-2027-sportkupe-379272", "15 sep", 0, "Halvkombi/sedan"),
      BW("Ford", "Capri", "Capri Premium AWD", null, "El", 6195, 0, "Hedin Automotive Ford Haninge", "Österhaninge", "stockholms-lan/ford-capri-premium-awd-long-range-privatleasing-fran-6195kr-man-2027-sportkupe-381766", "16 sep", 0, "Halvkombi/sedan"),
      BW("Ford", "Capri", "Capri Premium AWD", null, "El", 6195, 0, "Hedin Automotive Ford Nacka", "Nacka Strand", "stockholms-lan/ford-capri-premium-awd-long-range-privatleasing-fran-6195-2026-sportkupe-378974", "15 sep", 0, "Halvkombi/sedan"),
      BW("Ford", "Explorer", "Explorer Premium RWD", null, "El", 5395, 0, "Hedin Automotive Eskilstuna", "Eskilstuna", "sodermanlands-lan/ford-explorer-premium-rwd-long-range-5395kr-man-privatleasing-2027-suv-464812", "11 nov", 0, "SUV"),
      BW("Ford", "Explorer", "Explorer Premium Edition", null, "El", 5395, 0, "Hedin Automotive Ford Södertälje", "Södertälje", "stockholms-lan/ford-explorer-premium-edition-lr-rwd-286hk-privatleasing-fran-5395-2026-suv-413316", "9 okt", 0, "SUV"),
      BW("Ford", "Explorer", "Explorer RWD Long Range", null, "El", 5395, 0, "Hedin Automotive Eskilstuna", "Eskilstuna", "sodermanlands-lan/ford-explorer-rwd-long-range-premium-edition-privatleasing-5395kr-man-2027-suv-391272", "23 sep", 0, "SUV"),
      BW("Ford", "Explorer", "Explorer RWD Premium", null, "El", 5395, 0, "Hedin Automotive Eskilstuna", "Eskilstuna", "sodermanlands-lan/ford-explorer-rwd-premium-edition-privatleasing-5395kr-man-2027-suv-164738", "27 maj", 0, "SUV"),
      BW("Ford", "Explorer", "Explorer Premium", null, "El", 5595, 0, "Hedin Automotive Ford Södertälje", "Södertälje", "stockholms-lan/ford-explorer-premium-privatleasing-fran-5595-2026-suv-466063", "13 nov", 0, "SUV"),
      BW("Ford", "Explorer", "Explorer LONG RANGE AWD", null, "El", 5595, 0, "Hedin Automotive Ford Nacka", "Nacka Strand", "stockholms-lan/ford-explorer-long-range-awd-privatleasing-fran-5595-2026-suv-378982", "15 sep", 0, "SUV"),
      BW("Ford", "Kuga", "Kuga pHev 243hk", null, "Laddhybrid", 4795, 0, "Hedin Automotive Eskilstuna", "Eskilstuna", "sodermanlands-lan/ford-kuga-phev-243hk-black-edt-4795kr-man-privatleasing-2026-suv-343597", "19 aug", 0, "SUV"),
      BW("Ford", "Kuga", "Kuga ST-Line X", null, "Laddhybrid", 4795, 0, "Hedin Automotive Ford Karlshamn", "Karlshamn", "blekinge-lan/ford-kuga-st-line-x-black-edition-privatleasing-fr-4795-man-2026-suv-341085", "18 aug", 0, "SUV"),
      BW("Ford", "Mustang Mach-E", "Mustang Mach-E PREMIUM LONG RANGE", null, "El", 5995, 0, "Hedin Automotive Akalla Väst", "Kista", "stockholms-lan/ford-mustang-mach-e-premium-long-range-rwd-276hk-privatleasing-5-995-kr-man-2025-suv-380796", "16 sep", 0, "SUV"),
      BW("Ford", "Mustang Mach-E", "Mustang Mach-E Premium LR", null, "El", 6995, 0, "Hedin Automotive Ford Haninge", "Österhaninge", "stockholms-lan/ford-mustang-mach-e-premium-lr-rwd-privatleasing-fran-6995kr-man-2025-suv-341459", "18 aug", 0, "SUV"),
      BW("Ford", "Puma", "Puma Gen-E Premium", null, "El", 2995, 0, "Hedin Automotive Segeltorp Syd", "Segeltorp", "stockholms-lan/ford-puma-gen-e-premium-168hk-privatleasing-2995-2026-halvkombi-394950", "25 sep", 0, "Halvkombi/sedan"),
      BW("Ford", "Puma", "Puma Gen-E Privatleasning", null, "El", 2995, 0, "Hedin Automotive Ford Enköping", "Enköping", "uppsala-lan/ford-puma-gen-e-privatleasning-fr-2995kr-man-2026-halvkombi-353617", "27 aug", 0, "Halvkombi/sedan"),
      BW("Honda", "HR-V", "HR-V Elegance e:HEV", null, "Hybrid", 2995, 1000, "Laholms Bil", "Laholm", "hallands-lan/honda-hr-v-elegance-e-hev-hybrid-1-5-131-hk-privatleasing-kampanj-2026-suv-169208", "29 maj", 0, "SUV"),
      BW("Honda", "Jazz", "Jazz Elegance Hybrid", null, "Hybrid", 3715, 1000, "ER Bil AB, Nässjö", "Nässjö", "jonkopings-lan/honda-jazz-elegance-hybrid-aut-privatleasing-2025-halvkombi-420005", "10 okt", 0, "Halvkombi/sedan"),
      BW("Hyundai", "Bayon", "Bayon 1.0 T-GDi", "bayon", "Bensin", 2695, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-bayon-1-0-t-gdi-90hk-essential-manuell-privatleasing-2027-halvkombi-336335", "14 aug", 0, "Halvkombi/sedan"),
      BW("Hyundai", "Bayon", "Bayon 1.0 T-GDi", "bayon", "Bensin", 2995, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-bayon-1-0-t-gdi-90hk-dct-essential-automat-privatleasing-2027-suv-336331", "14 aug", 0, "SUV"),
      BW("Hyundai", "Bayon", "Bayon 1.0 T-GDi", "bayon", "Bensin", 3195, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-bayon-1-0-t-gdi-90hk-dct-advanced-automat-privatleasing-2027-suv-336332", "14 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh Essential", null, "El", 3903, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-5-84-kwh-essential-privatleasing-med-fast-hyra-2027-suv-460371", "9 nov", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh Essential", null, "El", 4495, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-ioniq-5-84-kwh-essential-privatleasing-fast-ranta-2027-suv-452624", "3 nov", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh Essential", null, "El", 4495, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-5-84-kwh-essential-privatleasing-2027-suv-326966", "12 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 84 kWh AWD", null, "El", 4795, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-ioniq-5-84-kwh-awd-essential-privatleasing-fast-ranta-2027-suv-452623", "3 nov", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 Facelift 84 kWh", null, "El", 4795, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-5-facelift-84-kwh-awd-essential-privatleasing-2027-suv-326965", "12 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 Facelift 84 kWh", null, "El", 5095, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-5-facelift-84-kwh-awd-advanced-privatleasing-2027-suv-326967", "12 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 Facelift 84 kWh", null, "El", 5695, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-5-facelift-84-kwh-awd-n-line-privatleasing-2027-suv-326968", "12 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 5", "IONIQ 5 Facelift 84 kWh", null, "El", 5995, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-ioniq-5-facelift-84-kwh-awd-n-line-privatleasing-2027-suv-452621", "3 nov", 0, "SUV"),
      BW("Hyundai", "IONIQ 9", "IONIQ 9 9 Essential", null, "El", 6203, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-9-9-essential-110-kwh-privatleasing-med-fast-hyra-2027-suv-460367", "9 nov", 0, "SUV"),
      BW("Hyundai", "IONIQ 9", "IONIQ 9 9 Essential", null, "El", 6795, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-9-9-essential-110-kwh-rackvidd-620km-privatleasing-2027-suv-326961", "12 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 9", "IONIQ 9 9 Advanced", null, "El", 7295, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-9-9-advanced-awd-110-3-kwh-privatleasing-2027-suv-326962", "12 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 9", "IONIQ 9 9 Calligraphy", null, "El", 7395, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-9-9-calligraphy-line-awd-110-3kwh-privatleasing-2027-suv-326963", "12 aug", 0, "SUV"),
      BW("Hyundai", "IONIQ 9", "IONIQ 9 Calligraphy Performance", null, "El", 7595, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-9-calligraphy-performance-awd-7-sits-privatleasing-2026-suv-326964", "12 aug", 0, "SUV"),
      BW("Hyundai", "Ioniq 3", "Ioniq 3 Standard Range", null, "El", 3395, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-3-standard-range-select-privatleasing-2027-halvkombi-463959", "11 nov", 0, "Halvkombi/sedan"),
      BW("Hyundai", "Ioniq 3", "Ioniq 3 Standard Range Select", null, "El", 3495, 0, "Hedin Automotive Akalla Väst", "Kista", "stockholms-lan/hyundai-ioniq-3-standard-range-select-42-kwh-privatleasing-2027-suv-361780", "3 sep", 0, "SUV"),
      BW("Hyundai", "Ioniq 3", "Ioniq 3 3 Standard Range", null, "El", 3495, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-ioniq-3-3-standard-range-select-privatleasing-2027-halvkombi-358967", "1 sep", 0, "Halvkombi/sedan"),
      BW("Hyundai", "Ioniq 3", "Ioniq 3 Standard Range", null, "El", 3595, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-ioniq-3-standard-range-trend-privatleasing-2027-halvkombi-463960", "11 nov", 0, "Halvkombi/sedan"),
      BW("Hyundai", "Ioniq 3", "Ioniq 3 Standard Range", null, "El", 3695, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-ioniq-3-standard-range-trend-privatleasing-2027-halvkombi-358971", "1 sep", 0, "Halvkombi/sedan"),
      BW("Hyundai", "Ioniq 3", "Ioniq 3 Longe Range", null, "El", 3995, 0, "MMC Malmö AB", "Malmö", "skane-lan/hyundai-ioniq-3-longe-range-privatleasing-2027-suv-358901", "1 sep", 0, "SUV"),
      BW("Hyundai", "Kona", "Kona Hybrid Automat", "kona", "Hybrid", 2703, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-kona-hybrid-automat-essential-privatleasing-med-fast-hyra-2026-suv-460372", "9 nov", 0, "SUV"),
      BW("Hyundai", "Kona", "Kona Hybrid DCT", "kona", "Hybrid", 3295, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-kona-hybrid-dct-essential-privatleasing-2026-suv-326960", "12 aug", 0, "SUV"),
      BW("Hyundai", "Kona", "Kona Hybrid Automat", "kona", "Hybrid", 3495, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-kona-hybrid-automat-advanced-privatleasing-2026-suv-334614", "13 aug", 0, "SUV"),
      BW("Hyundai", "Santa Fe", "Santa Fe Plug-In Hybrid", null, "Laddhybrid", 5203, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-santa-fe-plug-in-hybrid-7s-advanced-privatleasing-med-fast-hyra-2027-suv-460370", "9 nov", 0, "SUV"),
      BW("Hyundai", "Santa Fe", "Santa Fe Plug-In Hybrid", null, "Laddhybrid", 5795, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-santa-fe-plug-in-hybrid-7s-288hk-advanced-privatleasing-2027-suv-336334", "14 aug", 0, "SUV"),
      BW("Hyundai", "Santa Fe", "Santa Fe Plug-In Hybrid", null, "Laddhybrid", 6395, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-santa-fe-plug-in-hybrid-288hk-calligraphy-line-privatleasing-2027-suv-336333", "14 aug", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Hybrid 2WD", "tucson", "Hybrid", 2903, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-tucson-hybrid-2wd-essential-privatleasing-med-fast-hyra-2027-suv-460373", "9 nov", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Plug-in-Hybrid 2WD", "tucson", "Laddhybrid", 3103, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-tucson-plug-in-hybrid-2wd-essential-privatleasing-fast-hyra-2027-suv-460366", "9 nov", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Hybrid 2WD", "tucson", "Hybrid", 3495, 1000, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-tucson-hybrid-2wd-essential-privatleasing-fast-ranta-2027-suv-361215", "2 sep", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Hybrid 4WD", "tucson", "Hybrid", 3595, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-tucson-hybrid-4wd-essential-239hk-privatleasing-2027-suv-426920", "13 okt", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Hybrid 4WD", "tucson", "Hybrid", 3595, 1000, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-tucson-hybrid-4wd-essential-privatleasing-fast-ranta-2027-suv-361214", "2 sep", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Plug-in-Hybrid 4WD", "tucson", "Laddhybrid", 4495, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-tucson-plug-in-hybrid-4wd-advanced-privatleasing-2027-suv-334617", "13 aug", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Plug-in-Hybrid 2WD", "tucson", "Laddhybrid", 4695, 1000, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-tucson-plug-in-hybrid-2wd-n-line-privatleasing-fast-ranta-2027-suv-358980", "1 sep", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Plug-in-Hybrid 2WD", "tucson", "Laddhybrid", 4695, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-tucson-plug-in-hybrid-2wd-n-line-privatleasing-2027-suv-334615", "13 aug", 0, "SUV"),
      BW("Hyundai", "Tucson", "Tucson Plug-in-Hybrid 4WD", "tucson", "Laddhybrid", 4795, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-tucson-plug-in-hybrid-4wd-n-line-privatleasing-2027-suv-334616", "13 aug", 0, "SUV"),
      BW("Hyundai", "i20", "i20 1.0 T-GDi", "i20", "Bensin", 2595, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-i20-1-0-t-gdi-manuell-privatleasing-2027-halvkombi-336330", "14 aug", 0, "Halvkombi/sedan"),
      BW("Hyundai", "i20", "i20 Essential Manuell", "i20", "Bensin", 2595, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/hyundai-i20-essential-manuell-t-gdi-privatleasing-2595-kr-man-2027-halvkombi-272826", "26 jun", 0, "Halvkombi/sedan"),
      BW("Hyundai", "i20", "i20 Essential 1.0", "i20", "Bensin", 2895, 1000, "Bendt Bil AB", "Halmstad", "hallands-lan/hyundai-i20-essential-1-0-t-gdi-automat-privatleasing-2895-kr-man-2027-halvkombi-272844", "26 jun", 0, "Halvkombi/sedan"),
      BW("Hyundai", "i20", "i20 1.0 T-GDI", "i20", "Bensin", 2895, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-i20-1-0-t-gdi-dct-essential-privatleasing-2027-halvkombi-155893", "21 maj", 0, "Halvkombi/sedan"),
      BW("Hyundai", "i20", "i20 1.0T Automat", "i20", "Bensin", 2995, 0, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/hyundai-i20-1-0t-automat-advanced-privatleasing-2027-halvkombi-402719", "1 okt", 0, "Halvkombi/sedan"),
      BW("Hyundai", "i20", "i20 3,49% ränta", "i20", "Bensin", 2995, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/hyundai-i20-3-49-ranta-1-0t-automat-advanced-privatleasing-2027-halvkombi-358982", "1 sep", 0, "Halvkombi/sedan"),
      BW("Kia", "EV2", "EV2 StandardRange", "ev2", "El", 2896, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev2-standardrange-privatleasing-kampanj-2026-suv-274492", "26 jun", 20000, "SUV"),
      BW("Kia", "EV2", "EV2 5-SITS", "ev2", "El", 3495, 0, "Hedin Automotive KIA Helsingborg", "Helsingborg", "skane-lan/kia-ev2-5-sits-privatleasing-fran-3495kr-man-2027-suv-442896", "26 okt", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Standard Range", "ev2", "El", 3495, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev2-standard-range-privatleasing-kampanj-snabb-leverans-2027-suv-441734", "24 okt", 0, "SUV"),
      BW("Kia", "EV2", "EV2 SR 5-SITS", "ev2", "El", 3495, 1000, "Hedin Automotive KIA Tagene", "Hisings Kärra", "vastra-gotalands-lan/kia-ev2-sr-5-sits-privatleasing-3495kr-man-2027-suv-432433", "16 okt", 0, "SUV"),
      BW("Kia", "EV2", "EV2 5-SITS", "ev2", "El", 3495, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-ev2-5-sits-privatleasing-fran-3495kr-man-2027-suv-431475", "16 okt", 0, "SUV"),
      BW("Kia", "EV2", "EV2 5 sits", "ev2", "El", 3495, 0, "Hedin Automotive Kia Värnamo", "Värnamo", "jonkopings-lan/kia-ev2-5-sits-standard-range-privatleasing-fran-3495-kr-man-2027-suv-372202", "10 sep", 0, "SUV"),
      BW("Kia", "EV2", "EV2 SR 42.2 kWh", "ev2", "El", 3495, 0, "Hedin Automotive KIA Tagene", "Hisings Kärra", "vastra-gotalands-lan/kia-ev2-sr-42-2-kwh-privatleasing-3495kr-man-15-000kr-laddn-2027-suv-349026", "24 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 LANSERINGSKAMPANJ", "ev2", "El", 3495, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-ev2-lanseringskampanj-privatleasing-serviceavtal-2027-suv-328864", "13 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Standard range 5-sits", "ev2", "El", 3495, 0, "Hedin Automotive Alingsås Öst", "Alingsås", "vastra-gotalands-lan/kia-ev2-standard-range-5-sits-kampanj-privatleasing-3495kr-2027-suv-315315", "2 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 StandardRange", "ev2", "El", 3495, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev2-standardrange-privatleasing-kampanj-2027-suv-274488", "26 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Standard range 5-sits", "ev2", "El", 3495, 0, "Hedin Automotive KIA Tagene", "Hisings Kärra", "vastra-gotalands-lan/kia-ev2-standard-range-5-sits-kampanj-privatleasing-fran-3495-2027-suv-176233", "3 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS 5-SITS", "ev2", "El", 3695, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-ev2-plus-5-sits-privatleasing-fran-3695kr-man-2027-suv-431474", "16 okt", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Plus Standard Range", "ev2", "El", 3695, 0, "Wafab Bil AB, Arvika", "Arvika", "varmlands-lan/kia-ev2-plus-standard-range-42-2-kwh-privatleasing-2027-suv-402753", "1 okt", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Standard Range PLUS", "ev2", "El", 3695, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev2-standard-range-plus-5-sits-privatleasing-kampanj-2026-suv-344413", "20 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Plus Standard Range", "ev2", "El", 3695, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev2-plus-standard-range-5-sits-kampanj-privatleasing-2026-suv-241176", "24 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS 5-Sits", "ev2", "El", 3795, 0, "Hedin Automotive Kia Värnamo", "Värnamo", "jonkopings-lan/kia-ev2-plus-5-sits-standard-range-privatleasing-fran-3795-kr-2027-suv-372204", "10 sep", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS 5-SITS", "ev2", "El", 3795, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-ev2-plus-5-sits-lanseringskampanj-privatleasing-2027-suv-328865", "13 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS SR", "ev2", "El", 3795, 1000, "Hedin Automotive KIA Tagene", "Hisings Kärra", "vastra-gotalands-lan/kia-ev2-plus-sr-5-sits-privatleasing-fran-3795-manad-2027-suv-310773", "28 jul", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Standard Range Plus", "ev2", "El", 3795, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev2-standard-range-plus-privatleasing-super-kampanj-2027-suv-274491", "26 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Plus Standard Range", "ev2", "El", 3795, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev2-plus-standard-range-4-sits-kampanj-privatleasing-2026-suv-241206", "24 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2", "ev2", "El", 3795, 0, "Hedin Automotive KIA Danderyd", "Täby", "stockholms-lan/kia-ev2-privatleasing-fran-3795kr-man-2026-suv-168770", "29 maj", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS 4-Sits", "ev2", "El", 3895, 0, "Hedin Automotive Kia Värnamo", "Värnamo", "jonkopings-lan/kia-ev2-plus-4-sits-standard-range-privatleasing-fran-3895-kr-2027-suv-372205", "10 sep", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Standard Range PLUS", "ev2", "El", 3895, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev2-standard-range-plus-4-sits-privatleasing-kampanj-2026-suv-249678", "26 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS SR", "ev2", "El", 3895, 0, "Hedin Automotive KIA Norrtälje", "Norrtälje", "stockholms-lan/kia-ev2-plus-sr-4-sits-privatleasing-fran-3895-kr-man-2026-suv-222258", "8 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS 4", "ev2", "El", 3895, 0, "Hedin Automotive KIA Danderyd", "Täby", "stockholms-lan/kia-ev2-plus-4-sits-privatleasing-3895kr-man-2027-suv-157849", "22 maj", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS LONG RANGE", "ev2", "El", 3995, 0, "Hedin Automotive KIA Danderyd", "Täby", "stockholms-lan/kia-ev2-plus-long-range-superkampanj-3995kr-man-privatleasing-2027-suv-350719", "25 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Long Range", "ev2", "El", 2998, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev2-long-range-privatleasing-2026-suv-249792", "26 jun", 40000, "SUV"),
      BW("Kia", "EV2", "EV2 LONG RANGE LANSERINGSKAMPANJ", "ev2", "El", 4195, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-ev2-long-range-lanseringskampanj-privatleasing-2027-suv-328855", "13 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Long Range 61 kWh", "ev2", "El", 4195, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev2-long-range-61-kwh-kampanj-privatleasing-2027-suv-241158", "24 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS LONG RANGE", "ev2", "El", 4495, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-ev2-plus-long-range-5-sits-privatleasing-fran-4495kr-man-2027-suv-466116", "13 nov", 0, "SUV"),
      BW("Kia", "EV2", "EV2 PLUS LONG RANGE", "ev2", "El", 4495, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-ev2-plus-long-range-lanseringskampanj-privatleasing-2027-suv-328854", "13 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 Plus Long Range", "ev2", "El", 4495, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev2-plus-long-range-range-5-sits-privatleasing-2027-suv-241179", "24 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 GT LINE", "ev2", "El", 5595, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-ev2-gt-line-long-range-5-sits-privatleasing-2027-suv-328848", "13 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 GT-Line Long Range", "ev2", "El", 5595, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev2-gt-line-long-range-range-5-sits-privatleasing-2027-suv-241178", "24 jun", 0, "SUV"),
      BW("Kia", "EV2", "EV2 GT LINE", "ev2", "El", 5695, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-ev2-gt-line-long-range-4-sits-privatleasing-2027-suv-328851", "13 aug", 0, "SUV"),
      BW("Kia", "EV2", "EV2 GT-Line Long Range", "ev2", "El", 5695, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev2-gt-line-long-range-range-4-sits-privatleasing-2027-suv-241177", "24 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Long Range 81.4 kWh", "ev3", "El", 3900, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev3-long-range-81-4-kwh-privatleasing-kampanj-3900kr-2027-suv-410364", "7 okt", 20000, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 0, "Hedin Automotive KIA Tagene", "Hisings Kärra", "vastra-gotalands-lan/kia-ev3-long-range-privatleasing-fran-4495kr-man-2027-suv-439749", "22 okt", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Long Range 81.4 kWh", "ev3", "El", 4495, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev3-long-range-81-4-kwh-privatleasing-4495kr-2027-suv-439042", "22 okt", 0, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-ev3-long-range-privatleasing-fran-4495kr-man-2026-suv-431488", "16 okt", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 0, "Hedin Automotive Kia Värnamo", "Värnamo", "jonkopings-lan/kia-ev3-long-range-privatleasing-4495kr-man-2026-suv-372189", "10 sep", 0, "SUV"),
      BW("Kia", "EV3", "EV3 FWD Long Range", "ev3", "El", 4495, 0, "Hedin Automotive KIA Danderyd", "Täby", "stockholms-lan/kia-ev3-fwd-long-range-privatleasing-fran-4495kr-manad-2027-suv-334006", "13 aug", 0, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4495, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev3-long-range-privatleasing-2026-suv-249911", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev3-long-range-privatleasing-kampanj-begransat-antal-2026-suv-249693", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Long Range 81,4 kWh", "ev3", "El", 4495, 1000, "Björkmans Bil Örebro", "Örebro", "orebro-lan/kia-ev3-long-range-81-4-kwh-privatleasing-kampanj-2026-suv-244463", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Long Range", "ev3", "El", 4495, 0, "Hedin Automotive Ängelholm", "Ängelholm", "skane-lan/kia-ev3-long-range-privatleasing-fr-4495kr-man-2027-suv-218184", "4 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 PLUS Long Range", "ev3", "El", 4197, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev3-plus-long-range-privatleasing-4197kr-man-2026-suv-412100", "8 okt", 20000, "SUV"),
      BW("Kia", "EV3", "EV3 PLUS Long Range", "ev3", "El", 4795, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev3-plus-long-range-privatleasing-4795kr-man-2026-suv-412101", "8 okt", 0, "SUV"),
      BW("Kia", "EV3", "EV3 PLUS FWD", "ev3", "El", 4795, 0, "Hedin Automotive Kia Värnamo", "Värnamo", "jonkopings-lan/kia-ev3-plus-fwd-long-range-privatleasing-4795kr-man-2026-suv-372198", "10 sep", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Plus Long Range", "ev3", "El", 4795, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev3-plus-long-range-81-4-kwh-privatleasing-kampanj-2026-suv-249809", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE PLUS", "ev3", "El", 4795, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev3-long-range-plus-privatleasing-2026-suv-249791", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4933, 0, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev3-long-range-privatleasing-inkl-vinterhjul-2026-suv-274533", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE", "ev3", "El", 4933, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev3-long-range-privatleasing-inkl-v-hjul-2026-suv-249730", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Plus AWD", "ev3", "El", 4943, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev3-plus-awd-long-range-265hk-privatleasing-kampanj-2027-suv-432897", "17 okt", 0, "SUV"),
      BW("Kia", "EV3", "EV3 FWD Long Range", "ev3", "El", 4495, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev3-fwd-long-range-privatleasing-2026-suv-241086", "24 jun", 20000, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE PLUS", "ev3", "El", 5233, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev3-long-range-plus-privatleasing-inkl-v-hjul-2026-suv-249781", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-LINE Long Range", "ev3", "El", 4697, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev3-gt-line-long-range-81-4-kwh-privatleasing-4697kr-2026-suv-410363", "7 okt", 20000, "SUV"),
      BW("Kia", "EV3", "EV3 GT Line", "ev3", "El", 5295, 0, "Hedin Automotive Kia Värnamo", "Värnamo", "jonkopings-lan/kia-ev3-gt-line-fwd-long-range-privatleasing-5295kr-man-2026-suv-372200", "10 sep", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-LINE LongRange", "ev3", "El", 5295, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev3-gt-line-longrange-81-4-kwh-privatleasing-2026-suv-274567", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE GT", "ev3", "El", 5295, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev3-long-range-gt-line-privatleasing-2026-suv-249909", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-Line Long Range", "ev3", "El", 5295, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev3-gt-line-long-range-81-4kwh-privatleasing-kampanj-2026-suv-249806", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-Line Long range", "ev3", "El", 5295, 0, "Hedin Automotive Ängelholm", "Ängelholm", "skane-lan/kia-ev3-gt-line-long-range-privatleasing-fr-5295kr-man-2027-suv-178631", "4 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-LINE", "ev3", "El", 5295, 0, "Hedin Automotive KIA Danderyd", "Täby", "stockholms-lan/kia-ev3-gt-line-privatleasing-fran-5295kr-man-2027-suv-160261", "23 maj", 0, "SUV"),
      BW("Kia", "EV3", "EV3 Plus FWD", "ev3", "El", 4795, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev3-plus-fwd-long-range-privatleasing-2027-suv-241157", "24 jun", 20000, "SUV"),
      BW("Kia", "EV3", "EV3 LONG RANGE GT", "ev3", "El", 5733, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev3-long-range-gt-line-privatleasing-inkl-v-hjul-2026-suv-249779", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-Line Long Range", "ev3", "El", 5737, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev3-gt-line-long-range-ink-vinterhjul-privatleasing-kampanj-2026-suv-249855", "26 jun", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-Line AWD", "ev3", "El", 5795, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev3-gt-line-awd-265hk-privatleasing-tillfallig-kampanj-2027-suv-432898", "17 okt", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT Line", "ev3", "El", 5795, 0, "Hedin Automotive Kia Värnamo", "Värnamo", "jonkopings-lan/kia-ev3-gt-line-awd-long-range-privatleasing-5795kr-man-2026-suv-372196", "10 sep", 0, "SUV"),
      BW("Kia", "EV3", "EV3 GT-Line FWD", "ev3", "El", 5295, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev3-gt-line-fwd-long-range-privatleasing-2026-suv-241171", "24 jun", 20000, "SUV"),
      BW("Kia", "EV3", "EV3 Plus AWD", "ev3", "El", 5395, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev3-plus-awd-long-range-privatleasing-2027-suv-432501", "16 okt", 20000, "SUV"),
      BW("Kia", "EV3", "EV3 GT-Line AWD", "ev3", "El", 5795, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev3-gt-line-awd-long-range-privatleasing-2027-suv-432502", "16 okt", 20000, "SUV"),
      BW("Kia", "EV4", "EV4 LONG RANGE", "ev4", "El", 4995, 1000, "Björkmans Bil Ludvika", "Ludvika", "dalarnas-lan/kia-ev4-long-range-privatleasing-4995-kr-man-2026-sedan-269139", "26 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "EV4", "EV4 GT LINE", "ev4", "El", 6195, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev4-gt-line-fwd-long-range-my26-privatleasing-kampanj-2026-sedan-249862", "26 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "EV4", "EV4 GT-Line FWD", "ev4", "El", 6195, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev4-gt-line-fwd-long-range-privatleasing-2027-sedan-241228", "24 jun", 20000, "Halvkombi/sedan"),
      BW("Kia", "EV4", "EV4 GT LINE", "ev4", "El", 6632, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-ev4-gt-line-fwd-long-range-inkl-v-hjul-privatleasing-2026-sedan-249857", "26 jun", 20000, "Halvkombi/sedan"),
      BW("Kia", "EV5", "EV5 PLUS FWD", "ev5", "El", 6995, 0, "Hedin Automotive KIA Norrtälje", "Norrtälje", "stockholms-lan/kia-ev5-plus-fwd-long-range-privatleasing-fran-6995kr-man-2026-suv-222253", "8 jun", 0, "SUV"),
      BW("Kia", "EV5", "EV5 FWD Long Range", "ev5", "El", 6495, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev5-fwd-long-range-privatleasing-2027-suv-388780", "22 sep", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 FWD Long Range", "ev5", "El", 6495, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev5-fwd-long-range-kampanj-privatleasing-2026-suv-274508", "26 jun", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 FWD Long Range", "ev5", "El", 6495, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev5-fwd-long-range-81-4kwh-kampanj-privatleasing-2026-suv-249944", "26 jun", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 PLUS FWD", "ev5", "El", 6995, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-ev5-plus-fwd-long-range-kampanj-privatleasing-2026-suv-274539", "26 jun", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 Plus FWD", "ev5", "El", 6995, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev5-plus-fwd-long-range-81-4kwh-kampanj-privatleasing-2026-suv-249937", "26 jun", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 Plus FWD", "ev5", "El", 6995, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev5-plus-fwd-long-range-privatleasing-2027-suv-241232", "24 jun", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 GT Line", "ev5", "El", 7495, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-ev5-gt-line-pano-fwd-long-range-kampanj-privatleasing-2026-suv-249899", "26 jun", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 GT-Line FWD", "ev5", "El", 7495, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev5-gt-line-fwd-long-range-privatleasing-2027-suv-241250", "24 jun", 20000, "SUV"),
      BW("Kia", "EV5", "EV5 GT-Line Panorama", "ev5", "El", 7595, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-ev5-gt-line-panorama-fwd-long-range-privatleasing-2027-suv-241235", "24 jun", 20000, "SUV"),
      BW("Kia", "K4", "K4 Action Mildhybrid", null, "Hybrid", 3296, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-k4-action-mildhybrid-automat-privatleasing-3296kr-man-2026-kombi-412707", "9 okt", 20000, "Kombi"),
      BW("Kia", "K4", "K4", null, "Hybrid", 3895, 0, "Hedin Automotive KIA Tagene", "Hisings Kärra", "vastra-gotalands-lan/kia-k4-privatleasing-fran-3895-manad-2026-kombi-443271", "26 okt", 0, "Kombi"),
      BW("Kia", "K4", "K4 Action Mildhybrid", null, "Hybrid", 3895, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-k4-action-mildhybrid-automat-privatleasing-3895kr-2026-kombi-297785", "14 jul", 0, "Kombi"),
      BW("Kia", "K4", "K4 1.0 T-GDI", null, "Bensin", 3895, 0, "Bilbörsen i Linköping AB", "Linköping", "ostergotlands-lan/kia-k4-1-0-t-gdi-mhev-dct-115-hk-privatleasing-kampanj-2026-kombi-178503", "4 jun", 0, "Kombi"),
      BW("Kia", "K4", "K4 NYA SW1.6", null, "Bensin", 4495, 1000, "Björkmans Bil Lindesberg", "Lindesberg", "orebro-lan/kia-k4-nya-sw1-6-t-gdi-150-hk-dct-privatleasing-2027-kombi-252207", "26 jun", 0, "Kombi"),
      BW("Kia", "K4", "K4 NYA SW1.6", null, "Bensin", 4495, 1000, "Björkmans Bil Örebro", "Örebro", "orebro-lan/kia-k4-nya-sw1-6-t-gdi-150-hk-dct-privatleasing-2026-kombi-244451", "26 jun", 0, "Kombi"),
      BW("Kia", "K4", "K4 Advance 1.6", null, "Bensin", 4495, 0, "Bilbörsen i Linköping AB", "Linköping", "ostergotlands-lan/kia-k4-advance-1-6-t-gdi-dct-150-hk-privatleasing-kampanj-2026-kombi-178499", "4 jun", 0, "Kombi"),
      BW("Kia", "K4", "K4 GT-Line 1.6", null, "Bensin", 4995, 0, "Bilbörsen i Linköping AB", "Linköping", "ostergotlands-lan/kia-k4-gt-line-1-6-t-gdi-dct-180-hk-privatleasing-kampanj-2026-kombi-178494", "4 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW ACTION", "k4sw", "Bensin", 2996, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-k4-sw-action-115hk-privatleasing-2996kr-man-2026-kombi-412708", "9 okt", 20000, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW 1.6", "k4sw", "Bensin", 3595, 0, "Hedin Automotive KIA Danderyd", "Täby", "stockholms-lan/kia-k4-sw-1-6-advance-privatleasing-fr-3595-2026-kombi-297034", "14 jul", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW ACTION", "k4sw", "Bensin", 3595, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-k4-sw-action-115hk-privatleasing-3595kr-man-2026-kombi-274573", "26 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW Action", "k4sw", "Bensin", 3595, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-k4-sw-action-1-0-t-gdi-115hk-manuell-privatleasing-2026-kombi-241216", "24 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW 1.0T", "k4sw", "Bensin", 3595, 0, "Hedin Automotive Alingsås Öst", "Alingsås", "vastra-gotalands-lan/kia-k4-sw-1-0t-manuell-action-privatleasing-fran-3595kr-man-2026-kombi-220920", "5 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW 1.0T", "k4sw", "Hybrid", 3895, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-k4-sw-1-0t-aut-action-privatleasing-fran-3895kr-man-2026-kombi-466102", "13 nov", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW Action", "k4sw", "Bensin", 3895, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-k4-sw-action-1-0-t-gdi-mildhybrid-automat-privatleasing-2026-kombi-442440", "26 okt", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW 1.0T-GDi", "k4sw", "Bensin", 3895, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-k4-sw-1-0t-gdi-mildhybrid-dct-action-kampanj-privatleasing-2026-kombi-328857", "13 aug", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 NYA SW", "k4sw", "Bensin", 3895, 1000, "Björkmans Bil Lindesberg", "Lindesberg", "orebro-lan/kia-k4-nya-sw-action-1-0-t-gdi-mhev-aut-privatleasing-2027-kombi-252208", "26 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 NYA SW", "k4sw", "Bensin", 3895, 1000, "Björkmans Bil Örebro", "Örebro", "orebro-lan/kia-k4-nya-sw-action-1-0-t-gdi-mhev-aut-privatleasing-2026-kombi-244448", "26 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW 1.0T", "k4sw", "Bensin", 3895, 0, "Hedin Automotive KIA Norrtälje", "Norrtälje", "stockholms-lan/kia-k4-sw-1-0t-aut-action-privatleasing-fran-3895kr-man-2026-kombi-222249", "8 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW 1.6", "k4sw", "Bensin", 4495, 0, "Hedin Automotive Mölndal Bilvaruhuset", "Mölndal", "vastra-gotalands-lan/kia-k4-sw-1-6-t-gdi-150hp-dct-advance-4495kr-man-privatleasin-2026-kombi-452759", "3 nov", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW Advance", "k4sw", "Bensin", 4495, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-k4-sw-advance-1-6-t-gdi-150hk-dct-aut-privatleasing-2026-kombi-241217", "24 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 Sportswagon GT-Line", "k4sw", "Bensin", 4396, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-k4-sportswagon-gt-line-4396kr-man-privatleasing-2026-kombi-412709", "9 okt", 20000, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 Sportswagon GT-Line", "k4sw", "Bensin", 4995, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-k4-sportswagon-gt-line-4995kr-privatleasing-2026-kombi-412710", "9 okt", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW 1.6", "k4sw", "Bensin", 4995, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-k4-sw-1-6-t-gdi-dct-gt-line-kampanj-privatleasing-2026-kombi-328889", "13 aug", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW GT-Line", "k4sw", "Bensin", 4995, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-k4-sw-gt-line-dct-180hk-privatleasing-kampanj-2026-kombi-249674", "26 jun", 0, "Kombi"),
      BW("Kia", "K4 Sportswagon", "K4 SW GT-Line", "k4sw", "Bensin", 4995, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-k4-sw-gt-line-1-6-t-gdi-180hk-dct-aut-privatleasing-2026-kombi-241218", "24 jun", 0, "Kombi"),
      BW("Kia", "Niro", "Niro PLUG-IN HYBRID", null, "Laddhybrid", 4795, 1000, "Björkmans Bil Erikslund, i Västerås", "Västerås", "vastmanlands-lan/kia-niro-plug-in-hybrid-action-privatleasing-4-795-kr-manad-2026-suv-266988", "26 jun", 0, "SUV"),
      BW("Kia", "Niro", "Niro PLUG-IN ADVANCE", null, "Laddhybrid", 4795, 1000, "Hedin Automotive KIA Norrtälje", "Norrtälje", "stockholms-lan/kia-niro-plug-in-advance-privatleasing-fran-4795kr-man-2025-suv-222248", "8 jun", 0, "SUV"),
      BW("Kia", "Niro", "Niro ACTION", null, "Laddhybrid", 4795, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-niro-action-privatleasing-fran-4795kr-man-2026-suv-151458", "19 maj", 0, "SUV"),
      BW("Kia", "Picanto", "Picanto 1.0 ACTION", "picanto", "Bensin", 2995, 0, "Björkmans Bil Lindesberg", "Lindesberg", "orebro-lan/kia-picanto-1-0-action-manuell-privatleasing-kampanj-2026-halvkombi-252325", "26 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "Picanto", "Picanto Action 1.0", "picanto", "Bensin", 2995, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-picanto-action-1-0-67hk-privatleasing-2026-halvkombi-249817", "26 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "Picanto", "Picanto 1.0 ACTION", "picanto", "Bensin", 3095, 0, "Björkmans Bil Lindesberg", "Lindesberg", "orebro-lan/kia-picanto-1-0-action-automat-privatleasing-kampanj-2026-halvkombi-252310", "26 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "Picanto", "Picanto Action AMT", "picanto", "Bensin", 3095, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-picanto-action-amt-automat-privatleasing-2026-halvkombi-249913", "26 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "Picanto", "Picanto 1.0 AUT", "picanto", "Bensin", 3145, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-picanto-1-0-aut-action-privatleasing-fran-3145kr-man-2027-halvkombi-452844", "3 nov", 0, "Halvkombi/sedan"),
      BW("Kia", "Picanto", "Picanto 1.0 GDI", "picanto", "Bensin", 3145, 1000, "Wafab Bil AB, Arvika", "Arvika", "varmlands-lan/kia-picanto-1-0-gdi-amt-action-privatleasing-2027-halvkombi-346414", "21 aug", 0, "Halvkombi/sedan"),
      BW("Kia", "Picanto", "Picanto Action Automat", "picanto", "Bensin", 3145, 1000, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-picanto-action-automat-privatleasing-2027-halvkombi-241219", "24 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "Picanto", "Picanto Action Automat", "picanto", "Bensin", 3378, 1000, "Aftén Bil KIA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/kia-picanto-action-automat-inkl-v-hjul-privatleasing-2027-halvkombi-249756", "26 jun", 0, "Halvkombi/sedan"),
      BW("Kia", "Seltos", "Seltos ACTION 1.6", "seltos", "Bensin", 3795, 0, "Hedin Automotive KIA & BYD Halmstad", "Halmstad", "hallands-lan/kia-seltos-action-1-6-t-gdi-privatleasing-3795-2027-suv-408484", "6 okt", 0, "SUV"),
      BW("Kia", "Seltos", "Seltos 1.6 T-GDI", "seltos", "Bensin", 4095, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-seltos-1-6-t-gdi-dct-advance-privatleasing-2027-suv-328808", "13 aug", 0, "SUV"),
      BW("Kia", "Seltos", "Seltos 1.6 T-GDI", "seltos", "Bensin", 4995, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-seltos-1-6-t-gdi-dct-awd-x-line-privatleasing-2027-suv-328807", "13 aug", 0, "SUV"),
      BW("Kia", "Seltos", "Seltos X-LINE AUT", "seltos", "Bensin", 5095, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-seltos-x-line-aut-awd-soltak-privatleasing-fran-5095kr-man-2027-suv-446487", "28 okt", 0, "SUV"),
      BW("Kia", "Sorento", "Sorento Plug-in AWD", "sorento", "Laddhybrid", 9407, 1500, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-sorento-plug-in-awd-advance-plus-panorama-my27-privatleasing-2027-suv-323535", "11 aug", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage Plug-In Hybrid", "sportage", "Laddhybrid", 4695, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-sportage-plug-in-hybrid-awd-my27-action-privatleasing-2027-suv-354059", "27 aug", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage ACTION 1.6", "sportage", "Laddhybrid", 4695, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-sportage-action-1-6-t-gdi-plug-in-hybrid-awd-privatleasing-2027-suv-328799", "13 aug", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage Plug-in Hybrid", "sportage", "Laddhybrid", 4695, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-sportage-plug-in-hybrid-action-privatleasing-kampanj-2027-suv-249621", "26 jun", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage ADVANCE 1.6", "sportage", "El", 4995, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-sportage-advance-1-6-t-gdi-plug-in-hybrid-awd-privatleasing-2027-suv-328816", "13 aug", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage PHEV AWD", "sportage", "Laddhybrid", 4995, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-sportage-phev-awd-my27-advance-privatleasing-2027-suv-274566", "26 jun", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage Plug-in Hybrid", "sportage", "Laddhybrid", 4995, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-sportage-plug-in-hybrid-advance-privatleasing-kampanj-2027-suv-249723", "26 jun", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage PHEV AWD", "sportage", "Laddhybrid", 5465, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-sportage-phev-awd-my27-advance-ink-vinterhjul-privatleasing-2027-suv-354061", "27 aug", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage PHEV GT-LINE", "sportage", "Laddhybrid", 5595, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-sportage-phev-gt-line-privatleasing-inkl-d-krok-dackhotell-2027-suv-457517", "6 nov", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage PHEV GT-Line", "sportage", "Laddhybrid", 5595, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-sportage-phev-gt-line-pano-privatleasing-2027-suv-409927", "7 okt", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage PHEV AWD", "sportage", "Laddhybrid", 5595, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-sportage-phev-awd-gt-line-inkl-vhjul-privatleasing-5595kr-2027-suv-274516", "26 jun", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage GT LINE", "sportage", "Laddhybrid", 5595, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-sportage-gt-line-privatleasing-fran-5595kr-man-2026-suv-151461", "19 maj", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage GT LINE", "sportage", "Laddhybrid", 5895, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-sportage-gt-line-pano-1-6-t-gdi-phev-awd-privatleasing-2027-suv-328801", "13 aug", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage Plug-In Hybrid", "sportage", "Laddhybrid", 5895, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-sportage-plug-in-hybrid-awd-gt-line-pano-privatleasing-2027-suv-274500", "26 jun", 0, "SUV"),
      BW("Kia", "Sportage", "Sportage Plug-In Hybrid", "sportage", "Laddhybrid", 5167, 1000, "Aftén Bil KIA Nybil Bromma", "Bromma", "stockholms-lan/kia-sportage-plug-in-hybrid-awd-gt-line-inkl-v-hjul-privatleasing-2027-suv-274537", "26 jun", 30000, "SUV"),
      BW("Kia", "Stonic", "Stonic Action 100hk", "stonic", "Bensin", 3295, 0, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-stonic-action-100hk-my26-privatleasing-kampanj-2026-suv-401528", "1 okt", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic 1.0 T-GDi", "stonic", "Bensin", 3295, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-stonic-1-0-t-gdi-mt-action-facelift-kampanj-privatleasing-2026-suv-328900", "13 aug", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic 1.0 T-GDI", "stonic", "Bensin", 3495, 0, "Hedin Automotive KIA Danderyd", "Täby", "stockholms-lan/kia-stonic-1-0-t-gdi-dct-action-privatleasing-3495kr-man-2026-suv-444604", "27 okt", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic 1.0 T-GDi", "stonic", "Bensin", 3495, 1000, "Förenade Bil i Göteborg AB", "Mölndal", "vastra-gotalands-lan/kia-stonic-1-0-t-gdi-dct-action-facelift-kampanj-privatleasing-2026-suv-328891", "13 aug", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic Action 100hk", "stonic", "Bensin", 3495, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-stonic-action-100hk-my26-privatleasing-kampanj-2026-suv-249828", "26 jun", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic 1.0T AUT", "stonic", "Hybrid", 3795, 0, "Hedin Automotive Akalla", "Kista", "stockholms-lan/kia-stonic-1-0t-aut-advance-privatleasing-fran-3795kr-man-2027-suv-466123", "13 nov", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic 1.0 Mild-Hybrid", "stonic", "Hybrid", 3795, 0, "Björkmans Bil Lindesberg", "Lindesberg", "orebro-lan/kia-stonic-1-0-mild-hybrid-automat-advance-privatleasing-kampanj-2026-suv-252321", "26 jun", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic Action 100hk", "stonic", "Bensin", 3795, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-stonic-action-100hk-my26-inkl-privatleasing-kampanj-2026-suv-249824", "26 jun", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic Advance Mildhybrid", "stonic", "Hybrid", 3795, 0, "Aftén Bil KIA Nybil Åkersberga", "Åkersberga", "stockholms-lan/kia-stonic-advance-mildhybrid-automat-privatleasing-2027-suv-241139", "24 jun", 0, "SUV"),
      BW("Kia", "Stonic", "Stonic GT-Line Aut", "stonic", "Bensin", 3995, 1000, "Aftén Bil KIA Nybil Barkarby", "Järfälla", "stockholms-lan/kia-stonic-gt-line-aut-sollucka-my26-privatleasing-kampanj-2026-suv-249866", "26 jun", 0, "SUV"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-392268", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391733", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391724", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391423", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Lund", "Lund", "skane-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391295", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391094", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391075", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391027", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Täby", "Täby", "stockholms-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-391004", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Haninge", "Handen", "stockholms-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-390999", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-390976", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-390942", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B05", "B05 Design ProMax", null, "El", 4899, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/leapmotor-b05-design-promax-218hk-privatleasing-2026-halvkombi-390887", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "B10", "B10 ProMax Design", null, "El", 4499, 0, "Deluxe Bil AB", "Varberg", "hallands-lan/leapmotor-b10-promax-design-218hk-434km-privatleasing-4499-kr-man-2026-suv-394065", "24 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-392264", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391732", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391720", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391422", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Lund", "Lund", "skane-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391298", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391093", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391074", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391026", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Täby", "Täby", "stockholms-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-391003", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Haninge", "Handen", "stockholms-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-390998", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-390975", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-390941", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 Design ProMax", null, "El", 4499, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/leapmotor-b10-design-promax-218hk-privatleasing-2026-suv-390886", "23 sep", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 ProMax Design", null, "El", 4499, 3000, "Aros Auto AB", "Västerås", "vastmanlands-lan/leapmotor-b10-promax-design-el-218hk-privatleasing-fr-4499-2026-suv-333066", "13 aug", 0, "SUV"),
      BW("Leapmotor", "B10", "B10 ProMax Räckvidd", null, "El", 4899, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/leapmotor-b10-promax-rackvidd-434km-privatleasing-4-899-man-2026-suv-273126", "26 jun", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 EREV I", null, "El", 4499, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/leapmotor-c10-erev-i-970km-rackvidd-i-privatleasing-4-499-man-2026-suv-273129", "26 jun", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-392265", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391735", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391723", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391425", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Lund", "Lund", "skane-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391297", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391095", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391076", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391028", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Täby", "Täby", "stockholms-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391005", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Haninge", "Handen", "stockholms-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-391000", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-390978", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "Hybrid", 4799, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-390943", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design EREV", null, "El", 4799, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/leapmotor-c10-design-erev-215hk-privatleasing-2026-suv-390888", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 EREV Design", null, "Hybrid", 4799, 3000, "Aros Auto AB", "Västerås", "vastmanlands-lan/leapmotor-c10-erev-design-215hk-970km-privatleasing-fr-4799-manad-2026-suv-333078", "13 aug", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 ProMax Design", null, "El", 5499, 0, "Deluxe Bil AB", "Varberg", "hallands-lan/leapmotor-c10-promax-design-299hk-510-km-privatleasing-5499-kr-man-2026-suv-394066", "24 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-392267", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391736", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391722", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391426", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Lund", "Lund", "skane-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391296", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391096", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391077", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391029", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Täby", "Täby", "stockholms-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391006", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Haninge", "Handen", "stockholms-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-391001", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-390977", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-390945", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5499, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/leapmotor-c10-design-promax-299hk-privatleasing-2026-suv-390889", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-392379", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-392266", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-392158", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Täby", "Täby", "stockholms-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391856", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391778", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391734", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391721", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391601", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391436", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391424", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Lund", "Lund", "skane-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391294", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Haninge", "Handen", "stockholms-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-391261", "23 sep", 0, "SUV"),
      BW("Leapmotor", "C10", "C10 Design ProMax", null, "El", 5799, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/leapmotor-c10-design-promax-awd-598hk-privatleasing-2026-suv-390944", "23 sep", 0, "SUV"),
      BW("Leapmotor", "T03", "T03 Design 100", null, "El", 3199, 0, "Deluxe Bil AB", "Varberg", "hallands-lan/leapmotor-t03-design-100-el-privatleasing-3199-kr-man-2026-halvkombi-394064", "24 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-392378", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-392263", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Täby", "Täby", "stockholms-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391855", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-392157", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391777", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391731", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391719", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391600", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391435", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391421", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Lund", "Lund", "skane-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391291", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Haninge", "Handen", "stockholms-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-391260", "23 sep", 0, "Halvkombi/sedan"),
      BW("Leapmotor", "T03", "T03 Design", null, "El", 3199, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/leapmotor-t03-design-privatleasing-2026-halvkombi-390940", "23 sep", 0, "Halvkombi/sedan"),
      BW("Lynk & Co", "01", "01 Core", null, "Laddhybrid", 4895, 0, "Bilia Jägersro - Volvo", "Malmö", "skane-lan/lynk-co-01-core-privatleasing-fran-4895-kr-man-2025-crossover-418584", "10 okt", 0, "SUV"),
      BW("Lynk & Co", "08", "08", null, "Hybrid", 5995, 0, "Volvo Car Kista", "Sollentuna", "stockholms-lan/lynk-co-08-superkampanj-core-privatleasing-24-man-plus-vinterhjul-2026-suv-424508", "12 okt", 0, "SUV"),
      BW("MG", "4 EV Urban", "4 EV Urban 43 kWh", null, "El", 2995, 1000, "Niemi Bil Uppsala - Begagnat", "Uppsala", "uppsala-lan/mg-4-ev-urban-43-kwh-kampanj-privatleasing-2995kr-man-2026-halvkombi-394845", "25 sep", 0, "Halvkombi/sedan"),
      BW("MINI", "Aceman", "Aceman E Paket", null, "El", 3895, 1000, "Holmgrens Bil Värnamo", "Värnamo", "jonkopings-lan/mini-aceman-e-paket-xs-headup-kamera-driv-ass-led-privatleasing-fr-2026-suv-465181", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Paket", null, "El", 3895, 1000, "Holmgrens Bil Norrköping", "Östergötland", "ostergotlands-lan/mini-aceman-e-paket-xs-headup-kamera-driv-ass-led-privatleasing-fr-2026-suv-465152", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Paket", null, "El", 3895, 1000, "Holmgrens Bil AB Kalmar", "Kalmar", "kalmar-lan/mini-aceman-e-paket-xs-headup-kamera-driv-ass-led-privatleasing-fr-2026-suv-464988", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Paket", null, "El", 3895, 1000, "Holmgrens Bil Jönköping", "Jönköping", "jonkopings-lan/mini-aceman-e-paket-xs-headup-kamera-driv-ass-led-privatleasing-fr-2026-suv-464945", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Paket", null, "El", 3895, 1000, "Holmgrens Bil AB Skövde", "Västra Götaland", "vastra-gotalands-lan/mini-aceman-e-paket-xs-headup-kamera-driv-ass-led-privatleasing-fr-2026-suv-464576", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Blackyard", null, "El", 3895, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/mini-aceman-e-blackyard-privatleasing-fran-3-895kr-man-2026-suv-368141", "7 sep", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Blackyard", null, "El", 3995, 1000, "Holmgrens Bil Värnamo", "Värnamo", "jonkopings-lan/mini-aceman-e-blackyard-headup-tonade-kamera-18-privatleasing-fr-2026-suv-465180", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Blackyard", null, "El", 3995, 1000, "Holmgrens Bil Norrköping", "Östergötland", "ostergotlands-lan/mini-aceman-e-blackyard-headup-tonade-kamera-18-privatleasing-fr-2026-suv-465153", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Blackyard", null, "El", 3995, 1000, "Holmgrens Bil AB Kalmar", "Kalmar", "kalmar-lan/mini-aceman-e-blackyard-headup-tonade-kamera-18-privatleasing-fr-2026-suv-464987", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Blackyard", null, "El", 3995, 1000, "Holmgrens Bil Jönköping", "Jönköping", "jonkopings-lan/mini-aceman-e-blackyard-headup-tonade-kamera-18-privatleasing-fr-2026-suv-464940", "11 nov", 0, "SUV"),
      BW("MINI", "Aceman", "Aceman E Blackyard", null, "El", 3995, 1000, "Holmgrens Bil AB Skövde", "Västra Götaland", "vastra-gotalands-lan/mini-aceman-e-blackyard-headup-tonade-kamera-18-privatleasing-fr-2026-suv-464577", "11 nov", 0, "SUV"),
      BW("MINI", "Cooper", "Cooper S", null, "Bensin", 2995, 0, "Förenade Bil i Malmö", "Malmö", "skane-lan/mini-cooper-s-privatleasing-fran-2-995-kr-man-2026-halvkombi-333176", "13 aug", 0, "Halvkombi/sedan"),
      BW("MINI", "Cooper", "Cooper E Blackyard", null, "El", 3795, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/mini-cooper-e-blackyard-privatleasing-fran-3-795kr-man-2026-halvkombi-368140", "7 sep", 0, "Halvkombi/sedan"),
      BW("MINI", "Cooper", "Cooper E Paul", null, "El", 4644, 1000, "Holmgrens Bil Värnamo", "Värnamo", "jonkopings-lan/mini-cooper-e-paul-smith-edition-paket-m-privatleasing-fr-4644-2026-halvkombi-465189", "11 nov", 0, "Halvkombi/sedan"),
      BW("MINI", "Cooper", "Cooper E Paul", null, "El", 4644, 1000, "Holmgrens Bil Norrköping", "Östergötland", "ostergotlands-lan/mini-cooper-e-paul-smith-edition-paket-m-privatleasing-fr-4644-2026-halvkombi-465157", "11 nov", 0, "Halvkombi/sedan"),
      BW("MINI", "Cooper", "Cooper E Paul", null, "El", 4644, 1000, "Holmgrens Bil AB Kalmar", "Kalmar", "kalmar-lan/mini-cooper-e-paul-smith-edition-paket-m-privatleasing-fr-4644-2026-halvkombi-464985", "11 nov", 0, "Halvkombi/sedan"),
      BW("MINI", "Cooper", "Cooper E Paul", null, "El", 4644, 1000, "Holmgrens Bil Jönköping", "Jönköping", "jonkopings-lan/mini-cooper-e-paul-smith-edition-paket-m-privatleasing-fr-4644-2026-halvkombi-464932", "11 nov", 0, "Halvkombi/sedan"),
      BW("MINI", "Cooper", "Cooper E Paul", null, "El", 4644, 1000, "Holmgrens Bil AB Skövde", "Västra Götaland", "vastra-gotalands-lan/mini-cooper-e-paul-smith-edition-paket-m-privatleasing-fr-4644-2026-halvkombi-464586", "11 nov", 0, "Halvkombi/sedan"),
      BW("MINI", "Countryman", "Countryman S Essential", null, "Bensin", 3795, 1000, "Förenade Bil i Malmö", "Malmö", "skane-lan/mini-countryman-s-essential-trim-paket-xs-privatleasing-fran-3795-kr-man-2026-halvkombi-370173", "8 sep", 0, "Halvkombi/sedan"),
      BW("MINI", "Countryman", "Countryman E", null, "El", 4595, 1000, "Bilia Mölndal - BMW MINI", "Mölndal", "vastra-gotalands-lan/mini-countryman-e-privatleasing-kampanj-blackyard-edition-2027-suv-417089", "10 okt", 0, "SUV"),
      BW("Mazda", "2", "2 Hybrid Centre", null, "Hybrid", 4390, 0, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mazda-2-hybrid-centre-line-privatleasing-4390-kr-man-2025-halvkombi-328276", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mazda", "CX-30", "CX-30 2.5 Centre", null, "Bensin", 5074, 0, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mazda-cx-30-2-5-centre-line-privatleasing-5074-kr-man-2026-suv-328290", "13 aug", 0, "SUV"),
      BW("Mazda", "CX-60", "CX-60 PHEV 2,5", null, "Laddhybrid", 8344, 2000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/mazda-cx-60-phev-2-5-327-hk-exclusive-line-privatleasing-m-serv-2026-suv-328393", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "A-Klass", "Mercedes A250 e AMG", null, "Hybrid", 4995, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-a250-e-amg-night-edition-privatleasing-kampanj-4-995kr-man-2027-halvkombi-466669", "13 nov", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "A-Klass", "Mercedes A250", null, "Hybrid", 4995, 1500, "Landrins Bil Västerås Hässlö", "Västerås", "vastmanlands-lan/mercedes-a250-privatleasing-kampanj-4995kr-man-2026-halvkombi-466044", "13 nov", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "C-Klass", "Mercedes C300 4MATIC electric", null, "El", 6995, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-c300-4matic-electric-adv-ed-privatleasing-6995kr-man-2027-sedan-385021", "18 sep", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "C-Klass", "Mercedes C400 4MATIC Electric", null, "El", 7795, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-c400-4matic-electric-adv-privatleasing-fran-7795kr-man-2027-sedan-328187", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA250 Advanced Edition", "cla", "El", 5995, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-cla250-advanced-edition-privatleasing-fran-5995kr-man-2027-sedan-328268", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA250 Shooting Brake", "cla", "El", 6295, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-cla250-shooting-brake-adv-privatleasing-fran-6295kr-man-2027-kombi-328255", "13 aug", 0, "Kombi"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA250 Shooting Brake", "cla", "El", 6295, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-cla250-shooting-brake-privatleasing-761km-2026-kombi-269492", "26 jun", 0, "Kombi"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA250 Shooting Brake", "cla", "El", 6295, 1500, "Veho Bil AB Smista", "Segeltorp", "stockholms-lan/mercedes-cla250-shooting-brake-privatleasing-761km-2026-kombi-252825", "26 jun", 0, "Kombi"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA350 4MATIC Advanced", "cla", "El", 6495, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-cla350-4matic-advanced-ed-privatleasing-fran-6495kr-man-2027-sedan-328214", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA350 4M Shooting", "cla", "El", 6795, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-cla350-4m-shooting-br-adv-privatleasing-fran-6795kr-man-2027-kombi-328253", "13 aug", 0, "Kombi"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA350 4M Shooting", "cla", "El", 6995, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-cla350-4m-shooting-brake-privatleasing-761km-2026-sportkupe-269508", "26 jun", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "CLA", "Mercedes CLA250 Advanced Edition", "cla", "El", 7172, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-cla250-advanced-edition-privatleasing-7172kr-man-2026-sedan-328319", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "CLE", "Mercedes CLE300 e Coupe", null, "Hybrid", 9195, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-cle300-e-coupe-amg-adv-ed-privatleasing-fran-9195kr-man-2027-sportkupe-328195", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "CLE", "Mercedes CLE300 e Coupe", null, "Hybrid", 10515, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-cle300-e-coupe-140th-ed-privatleasing-fran-10515kr-man-2027-sportkupe-328183", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "E-Klass", "Mercedes E300 e Kombi", "eclass", "Hybrid", 7995, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-e300-e-kombi-amg-advanced-privatleasing-fran-7995kr-man-2027-kombi-328231", "13 aug", 0, "Kombi"),
      BW("Mercedes-Benz", "E-Klass", "Mercedes E300 e Kombi", "eclass", "Hybrid", 7995, 0, "Landrins Bil Västervik", "Västervik", "kalmar-lan/mercedes-e300-e-kombi-amg-advanced-edition-privatleasing-2025-kombi-265072", "26 jun", 0, "Kombi"),
      BW("Mercedes-Benz", "E-Klass", "Mercedes E300 de 4M", "eclass", "Diesel", 9875, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-e300-de-4m-kombi-140th-privatleasing-fran-9875kr-man-2027-kombi-328164", "13 aug", 0, "Kombi"),
      BW("Mercedes-Benz", "E-Klass", "Mercedes E300 de 4M", "eclass", "Diesel", 9887, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-e300-de-4m-all-terr-140th-privatleasing-fran-9887kr-man-2027-kombi-328154", "13 aug", 0, "Kombi"),
      BW("Mercedes-Benz", "E-Klass", "Mercedes E300 de 4M", "eclass", "Diesel", 9900, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-e300-de-4m-sedan-140th-an-privatleasing-fran-9900kr-man-2027-sedan-328179", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "E-Klass", "Mercedes E400 e 4M", "eclass", "Hybrid", 10123, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-e400-e-4m-sedan-140th-an-privatleasing-fran-10123kr-man-2027-sedan-328175", "13 aug", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "EQE", "Mercedes EQE350+ AMG", null, "El", 7695, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-eqe350-plus-amg-privatleasing-kampanj-690km-rackvidd-2025-sedan-269516", "26 jun", 0, "Halvkombi/sedan"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA250+ electric Advanced", null, "El", 5495, 0, "Landrins Bil Västervik", "Västervik", "kalmar-lan/mercedes-gla250-plus-electric-advanced-paket-plus-privatleasing-54-2027-suv-452804", "3 nov", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA250+ Beställning", null, "El", 5495, 0, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-gla250-plus-bestallning-privatleasing-fr-5495kr-man-2027-suv-343875", "20 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA250+ electric Advanced", null, "El", 5495, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-gla250-plus-electric-advanced-ed-privatleasing-5495kr-man-2027-suv-343138", "19 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA250+ Electric Advanced", null, "El", 5495, 0, "Råbergs Bil, Karlskrona", "Karlskrona", "blekinge-lan/mercedes-gla250-plus-electric-advanced-edition-privatleasing-2027-suv-336922", "15 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA250+ Electric Advanced", null, "El", 5495, 0, "Veho Bil AB Uppsala", "Uppsala", "uppsala-lan/mercedes-gla250-plus-electric-advanced-edition-privatleasing-2027-suv-320042", "6 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA250+", null, "El", 5495, 1500, "Hedin Automotive Mercedes-Benz Sisjön", "Västra Frölunda", "vastra-gotalands-lan/mercedes-gla250-plus-privatleasing-fran-5495-2027-suv-313289", "30 jul", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA250 e AMG", null, "Hybrid", 5995, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-gla250-e-amg-privatleasing-kampnj-69km-rackvidd-2025-suv-269478", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA350 4M electric", null, "El", 6295, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-gla350-4m-electric-advanced-ed-privatleasing-6295kr-man-2027-suv-368578", "8 sep", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA350 4MATIC", null, "El", 6295, 1500, "Hedin Automotive Mercedes-Benz Sisjön", "Västra Frölunda", "vastra-gotalands-lan/mercedes-gla350-4matic-privatleasing-fran-6295-2027-suv-313288", "30 jul", 0, "SUV"),
      BW("Mercedes-Benz", "GLA", "Mercedes GLA350 4Matic Beställning", null, "El", 6395, 0, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-gla350-4matic-bestallning-privatleasing-fr-6395kr-man-2027-suv-343876", "20 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB250+", "glb", "El", 5495, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-glb250-plus-privatleasing-5495kr-man-630km-2026-suv-269500", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB200 Advanced Edition", "glb", "Bensin", 5695, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glb200-advanced-edition-privatleasing-fran-5695kr-man-2027-suv-328264", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB350 4Matic", "glb", "El", 5995, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-glb350-4matic-privatleasing-5995kr-man-613km-2026-suv-269499", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB220 4MATIC Advanced", "glb", "Bensin", 6295, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glb220-4matic-advanced-ed-privatleasing-fran-6295kr-man-2027-suv-328263", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB250+ Advanced Edition", "glb", "El", 6295, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glb250-plus-advanced-edition-privatleasing-fran-6295kr-man-2027-suv-328295", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB250+", "glb", "El", 6295, 1500, "Veho Bil AB Smista", "Segeltorp", "stockholms-lan/mercedes-glb250-plus-privatleasing-fr-6295kr-man-630km-2026-suv-252829", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB250+", "glb", "El", 6495, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-glb250-plus-privatleasing-fr-6495kr-man-630km-2026-suv-269505", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB250+ Advanced Edition", "glb", "El", 6495, 0, "Landrins Bil Västervik", "Västervik", "kalmar-lan/mercedes-glb250-plus-advanced-edition-privatleasing-2026-suv-265068", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB350 4MATIC Advanced", "glb", "El", 6795, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glb350-4matic-advanced-ed-privatleasing-fran-6795kr-man-2027-suv-328293", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB350 4Matic", "glb", "El", 6795, 1500, "Veho Bil AB Smista", "Segeltorp", "stockholms-lan/mercedes-glb350-4matic-privatleasing-fr-6795kr-man-613km-2026-suv-252827", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB350 4Matic", "glb", "El", 6995, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-glb350-4matic-privatleasing-fr-6995kr-man-613km-2026-suv-269501", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLB", "Mercedes GLB350 4MATIC Advanced", "glb", "El", 6995, 0, "Landrins Bil Västervik", "Västervik", "kalmar-lan/mercedes-glb350-4matic-advanced-edition-privatleasing-2026-suv-265019", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC300 4MATIC Advanced", "glc", "El", 7995, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glc300-4matic-advanced-edition-privatleasing-7995kr-man-2027-suv-337486", "17 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC300 e 4MATIC", "glc", "Hybrid", 8495, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glc300-e-4matic-suv-amg-adv-privatleasing-fran-8495kr-man-2027-suv-328235", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC400 4MATIC Advanced", "glc", "El", 8495, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glc400-4matic-advanced-ed-privatleasing-fran-8495kr-man-2027-suv-328173", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC400 Matic", "glc", "El", 8495, 1500, "Veho Bil AB Smista", "Segeltorp", "stockholms-lan/mercedes-glc400-matic-privatleasing-fr-8495kr-man-2026-suv-252819", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC400 Matic", "glc", "El", 8695, 1500, "Veho Bil AB Karlstad", "Karlstad", "varmlands-lan/mercedes-glc400-matic-privatleasing-fr-8695kr-man-2026-suv-269512", "26 jun", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC400 e 4M", "glc", "Hybrid", 9565, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glc400-e-4m-suv-140th-privatleasing-fran-9565kr-man-2027-suv-328143", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC300 de 4M", "glc", "Diesel", 9565, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glc300-de-4m-suv-140th-privatleasing-fran-9565kr-man-2027-suv-328152", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC300 de 4M", "glc", "Diesel", 10140, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glc300-de-4m-coupe-140th-privatleasing-fran-10140kr-man-2027-suv-328170", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLC", "Mercedes GLC400 e 4M", "glc", "Hybrid", 10140, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-glc400-e-4m-coupe-140th-privatleasing-fran-10140kr-man-2027-suv-328167", "13 aug", 0, "SUV"),
      BW("Mercedes-Benz", "GLS", "Mercedes GLS450 d 4MATIC", null, "Diesel", 15331, 1500, "Höglunds Bil AB, Norrtälje", "Norrtälje", "stockholms-lan/mercedes-gls450-d-4matic-grand-edition-privatleasing-15331kr-man-2025-suv-328315", "13 aug", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-376959", "14 sep", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-376818", "14 sep", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Täby", "Täby", "stockholms-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-270328", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-268777", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-254385", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-251955", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-250032", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-248983", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-245104", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Invite PHEV", null, "Laddhybrid", 3999, 1000, "J BIL Lund", "Lund", "skane-lan/mitsubishi-outlander-invite-phev-4wd-privatleasing-2026-suv-228981", "11 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Plug-In hybrid", null, "Laddhybrid", 3999, 0, "Svema Bil AB", "Karlstad", "varmlands-lan/mitsubishi-outlander-plug-in-hybrid-4wd-privatleasing-2026-suv-226431", "10 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-376960", "14 sep", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-376817", "14 sep", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Täby", "Täby", "stockholms-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-270327", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-268772", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-254384", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-251953", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-250029", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Haninge", "Handen", "stockholms-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-248981", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-245100", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Intense PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Lund", "Lund", "skane-lan/mitsubishi-outlander-intense-phev-4wd-privatleasing-2026-suv-228982", "11 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-376966", "14 sep", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-376824", "14 sep", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Täby", "Täby", "stockholms-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-270698", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-268961", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-254642", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-252180", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-250161", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Haninge", "Handen", "stockholms-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-249097", "26 jun", 0, "SUV"),
      BW("Mitsubishi", "Outlander", "Outlander Instyle PHEV", null, "Laddhybrid", 4599, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/mitsubishi-outlander-instyle-phev-4wd-privatleasing-2026-suv-245672", "26 jun", 0, "SUV"),
      BW("Nissan", "Juke", "Juke DIG-T 114 hk", "juke", "Bensin", 2995, 1000, "Bilia Haninge - Volvo", "Handen", "stockholms-lan/nissan-juke-dig-t-114-hk-at-acenta-privatleasing-kampanj-2025-suv-417086", "10 okt", 0, "SUV"),
      BW("Nissan", "Juke", "Juke 1.0 DIG-T", "juke", "Bensin", 2995, 1000, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/nissan-juke-1-0-dig-t-114-acenta-aut-privatleasing-kampanj-2025-suv-332811", "13 aug", 0, "SUV"),
      BW("Nissan", "Leaf", "Leaf 52kwh Engage", null, "El", 3995, 1000, "Hedin Automotive Nissan Mölndal", "Mölndal", "vastra-gotalands-lan/nissan-leaf-52kwh-engage-privatleasing-fr-3995kr-man-2026-halvkombi-428512", "14 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf Engage 52 kWh", null, "El", 3995, 0, "Bilia Haninge - Volvo", "Handen", "stockholms-lan/nissan-leaf-engage-52-kwh-privatleasing-2026-halvkombi-417082", "10 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf ADVANCE 52 kWh", null, "El", 3995, 0, "Hedin Automotive Alingsås Öst", "Alingsås", "vastra-gotalands-lan/nissan-leaf-advance-52-kwh-privatleasing-fran-3995kr-man-2026-halvkombi-409973", "7 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf Evolve 75 kWh", null, "El", 3995, 0, "Hedin Automotive Alingsås Öst", "Alingsås", "vastra-gotalands-lan/nissan-leaf-evolve-75-kwh-privatleasing-fran-3995kr-man-2026-halvkombi-409975", "7 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf 52 kWh Engage", null, "El", 3995, 2000, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/nissan-leaf-52-kwh-engage-privatleasing-kampanj-2026-halvkombi-403565", "2 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf", null, "El", 3995, 1000, "Landrins Bil Västerås Hälla", "Västerås", "vastmanlands-lan/nissan-leaf-privatleasing-52-kwh-engage-2027-halvkombi-402811", "1 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf 52kWh", null, "El", 4095, 1000, "Hedin Automotive Nissan Mölndal", "Mölndal", "vastra-gotalands-lan/nissan-leaf-52kwh-privatleasing-fr-4095kr-man-2026-halvkombi-238602", "24 jun", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf", null, "El", 4695, 1000, "Landrins Bil Västerås Hälla", "Västerås", "vastmanlands-lan/nissan-leaf-privatleasing-75-kwh-engage-2027-halvkombi-402809", "1 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf 75kwh Engage", null, "El", 4695, 0, "Hedin Automotive Trollhättan Bilvaruhuset", "Trollhättan", "vastra-gotalands-lan/nissan-leaf-75kwh-engage-privatleasing-fr-4695kr-man-2026-halvkombi-289862", "7 jul", 0, "Halvkombi/sedan"),
      BW("Nissan", "Leaf", "Leaf 75kwh Engage", null, "El", 5040, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/nissan-leaf-75kwh-engage-privatleasing-2026-halvkombi-427983", "14 okt", 0, "Halvkombi/sedan"),
      BW("Nissan", "Micra", "Micra 52kwh Advance", "micra", "El", 4595, 0, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/nissan-micra-52kwh-advance-privatleasing-2026-halvkombi-250372", "26 jun", 0, "Halvkombi/sedan"),
      BW("Nissan", "Qashqai", "Qashqai Acenta MHEV", "qashqai", "Hybrid", 2995, 1000, "Bilia Haninge - Volvo", "Handen", "stockholms-lan/nissan-qashqai-acenta-mhev-privatleasing-superkampanj-2025-suv-417081", "10 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai Acenta Mhev", "qashqai", "Bensin", 2995, 1000, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/nissan-qashqai-acenta-mhev-privatleasing-kampanj-2026-suv-405160", "3 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai", "qashqai", "Hybrid", 2995, 1000, "Landrins Bil Västerås Hälla", "Västerås", "vastmanlands-lan/nissan-qashqai-privatleasing-mildhybrid-xtronic-aut-2wd-acenta-2026-suv-402822", "1 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai ACENTA AUTOMAT", "qashqai", "Bensin", 2995, 1000, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/nissan-qashqai-acenta-automat-privatleasing-kampanj-2026-suv-250354", "26 jun", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai MHEV 4WD", "qashqai", "Hybrid", 3495, 0, "Hedin Automotive Nissan Mölndal", "Mölndal", "vastra-gotalands-lan/nissan-qashqai-mhev-4wd-tekna-privatleasing-fast-ranta-fr-3495kr-man-2026-suv-448119", "29 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai Mildhybrid", "qashqai", "Hybrid", 3495, 0, "Hedin Automotive Nissan Mölndal", "Mölndal", "vastra-gotalands-lan/nissan-qashqai-mildhybrid-privatleasing-fast-ranta-fr-3495kr-man-2026-suv-434524", "19 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai MHEV N-Connecta", "qashqai", "Bensin", 3495, 0, "Hedin Automotive Nissan Mölndal", "Mölndal", "vastra-gotalands-lan/nissan-qashqai-mhev-n-connecta-privatleasing-fast-ranta-fr-3495kr-man-2026-suv-424957", "12 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai", "qashqai", "Hybrid", 3495, 0, "Bilkompaniet AB Mora", "Mora", "dalarnas-lan/nissan-qashqai-privatleasing-inkl-serviceavtal-2026-suv-352704", "27 aug", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai", "qashqai", "Bensin", 3745, 0, "Hedin Automotive Helsingborg Östra", "Helsingborg", "skane-lan/nissan-qashqai-privatleasing-3-745-man-2025-suv-165192", "27 maj", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai MHEV 158 HK", "qashqai", "Bensin", 3884, 3000, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/nissan-qashqai-mhev-158-hk-n-connecta-4wd-privatleasing-kampanj-2026-suv-333398", "13 aug", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai Acenta E-Power", "qashqai", "Hybrid", 3995, 1000, "RA Motor AB - Kungsängen", "Kungsängen", "stockholms-lan/nissan-qashqai-acenta-e-power-privatleasing-kampanj-2026-suv-405161", "3 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai", "qashqai", "Hybrid", 3995, 1000, "Landrins Bil Västerås Hälla", "Västerås", "vastmanlands-lan/nissan-qashqai-privatleasing-epower-acenta-base-2026-suv-402821", "1 okt", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai MHEV 158 HK", "qashqai", "Bensin", 4432, 3000, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/nissan-qashqai-mhev-158-hk-tekna-plus-4wd-privatleasing-k-2026-suv-332721", "13 aug", 0, "SUV"),
      BW("Nissan", "Qashqai", "Qashqai MHEV 158 hk", "qashqai", "Bensin", 4468, 3000, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/nissan-qashqai-mhev-158-hk-automat-acenta-privatleasing-kampanj-2026-suv-333272", "13 aug", 0, "SUV"),
      BW("Nissan", "X-Trail", "X-Trail MHEV 2WD", null, "Bensin", 3995, 0, "Bilia Haninge - Volvo", "Handen", "stockholms-lan/nissan-x-trail-mhev-2wd-privatleasing-2025-suv-417085", "10 okt", 0, "SUV"),
      BW("Nissan", "X-Trail", "X-Trail N-Connecta MHEV", null, "Bensin", 4397, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/nissan-x-trail-n-connecta-mhev-158-hk-7-saten-privatleasing-lagerbil-2025-suv-332717", "13 aug", 0, "SUV"),
      BW("Opel", "Astra", "Astra Sports Tourer", null, "El", 4999, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-astra-sports-tourer-electric-gs-privatleasing-ink-forsakring-2026-kombi-323566", "11 aug", 0, "Kombi"),
      BW("Opel", "Corsa", "Corsa GS 100", null, "Bensin", 3399, 0, "Newman Bil", "Hässleholm", "skane-lan/opel-corsa-gs-100-aut-privatleasing-2025-halvkombi-333554", "13 aug", 0, "Halvkombi/sedan"),
      BW("Opel", "Corsa-e", "Corsa-e Electric", null, "El", 5999, 0, "Newman Bil", "Hässleholm", "skane-lan/opel-corsa-e-electric-privatleasing-2025-halvkombi-333575", "13 aug", 0, "Halvkombi/sedan"),
      BW("Opel", "Corsa-e", "Corsa-e Electric 136 hk", null, "El", 5999, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/opel-corsa-e-electric-136-hk-privatleasing-5999-kr-man-2025-halvkombi-270424", "26 jun", 0, "Halvkombi/sedan"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-frontera-gs-electric-privatleasing-2026-suv-377214", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-frontera-gs-electric-privatleasing-2026-suv-377107", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-frontera-gs-electric-privatleasing-2026-suv-376973", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-frontera-gs-electric-privatleasing-2026-suv-376826", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-frontera-gs-electric-privatleasing-2026-suv-376372", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/opel-frontera-gs-electric-305-km-rackvidd-privatleasing-2026-suv-330569", "13 aug", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera Electric GS", null, "El", 2899, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/opel-frontera-electric-gs-36man-privatleasing-fran-2-899kr-man-2026-suv-328441", "13 aug", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-frontera-gs-electric-privatleasing-2026-suv-285594", "3 jul", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-frontera-gs-electric-standard-range-2899-privatleasing-2026-suv-273122", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-frontera-gs-electric-privatleasing-2026-suv-270678", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/opel-frontera-gs-electric-44-kwh-privatleasing-2899-kr-man-2026-suv-270377", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-frontera-gs-electric-privatleasing-2026-suv-268962", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-frontera-gs-electric-privatleasing-2026-suv-254537", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-frontera-gs-electric-privatleasing-2026-suv-252159", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-frontera-gs-electric-privatleasing-2026-suv-250152", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-frontera-gs-electric-privatleasing-2026-suv-249177", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 2899, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-frontera-gs-electric-privatleasing-2026-suv-245695", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Electric", null, "El", 3199, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/opel-frontera-gs-electric-long-range-401km-privatleasing-2026-suv-330599", "13 aug", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-285588", "3 jul", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS. Electric", null, "El", 3199, 1000, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-frontera-gs-electric-long-range-privatleasing-fr-3-199-man-2026-suv-273171", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-frontera-gs-long-range-rackvidd-400km-privatleasing-3199-2026-suv-272633", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-270818", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-268992", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-254595", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-252173", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-250156", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-249118", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3199, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-245505", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-377218", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3299, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-377213", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-377111", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3299, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-377106", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3299, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-376970", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-376974", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3299, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-376825", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-376829", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Long Range", null, "El", 3299, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-frontera-gs-long-range-electric-privatleasing-2026-suv-376370", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-376374", "14 sep", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera Hybrid 145", null, "Hybrid", 3299, 0, "Newman Bil", "Hässleholm", "skane-lan/opel-frontera-hybrid-145-aut-privatleasing-aven-7-sits-2025-suv-332921", "13 aug", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Laddhybrid", 3299, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/opel-frontera-gs-hybrid-145-edct-privatleasing-2026-suv-330906", "13 aug", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 0, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/opel-frontera-gs-hybrid-145hk-36man-privatleasing-2026-suv-328507", "13 aug", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-285595", "3 jul", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-270838", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera Hybrid GS", null, "Hybrid", 3299, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/opel-frontera-hybrid-gs-145hk-aut-privatleasing-3299-kr-man-2026-suv-270128", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-268991", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-254598", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-252172", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-250151", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-249136", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-frontera-gs-hybrid-145hk-aut-privatleasing-2026-suv-245595", "26 jun", 0, "SUV"),
      BW("Opel", "Frontera", "Frontera Hybrid 145hk", null, "Hybrid", 3300, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/opel-frontera-hybrid-145hk-36man-privatleasing-2025-suv-328506", "13 aug", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland Hybrid 145", null, "Hybrid", 4299, 0, "Newman Bil", "Hässleholm", "skane-lan/opel-grandland-hybrid-145-aut-privatleasing-2025-suv-333545", "13 aug", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland Hybrid 145hk", null, "Hybrid", 4299, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/opel-grandland-hybrid-145hk-automat-36man-privatleasing-2025-suv-328439", "13 aug", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland Hybrid", null, "Hybrid", 4299, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/opel-grandland-hybrid-privatleasing-4299-omgaende-leverans-2025-suv-271154", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-285460", "3 jul", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-270936", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-269025", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland Plug in", null, "Hybrid", 4399, 0, "Grahns Bilar AB", "Tranås", "jonkopings-lan/opel-grandland-plug-in-hybrid-privatleasing-2025-suv-260921", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-254545", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-252158", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-250160", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-249094", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4399, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-245710", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4499, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-377224", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4499, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-377119", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4499, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-376983", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4499, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-376837", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS PHEV", null, "Laddhybrid", 4499, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-grandland-gs-phev-195hk-aut-privatleasing-2026-suv-376383", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Plug-in", null, "Laddhybrid", 4499, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/opel-grandland-gs-plug-in-hybrid-195hk-privatleasing-4499-kr-man-drag-2026-suv-270197", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Hybrid", null, "Hybrid", 4999, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/opel-grandland-gs-hybrid-145hk-automat-36man-privatleasing-2025-suv-328437", "13 aug", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-377221", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-377115", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-376979", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-376834", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-376380", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-285482", "3 jul", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-270711", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-268967", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-254547", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-252160", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-250168", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-249117", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5199, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-grandland-gs-electric-aut-privatleasing-2026-suv-245510", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-377217", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-377114", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-376977", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-376832", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-376377", "14 sep", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-285477", "3 jul", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-270929", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-268966", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-254657", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-252199", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-250222", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-249109", "26 jun", 0, "SUV"),
      BW("Opel", "Grandland", "Grandland GS Electric", null, "El", 5399, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-grandland-gs-electric-aut-4x4-privatleasing-2026-suv-245514", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS PT", null, "Bensin", 2999, 0, "Newman Bil", "Hässleholm", "skane-lan/opel-mokka-gs-pt-130-aut-privatleasing-2025-suv-333589", "13 aug", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-377232", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-377124", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-376988", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-376844", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-376387", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Laddhybrid", 3299, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-330850", "13 aug", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka 145 hk hybrid", null, "Hybrid", 3299, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/opel-mokka-145-hk-hybrid-gs-automat-36-man-privatleasing-2026-suv-328400", "13 aug", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/opel-mokka-gs-hybrid-privatleasing-3299kr-man-omgaende-leverans-2026-suv-312403", "29 jul", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-285475", "3 jul", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-mokka-gs-hybrid-145-automat-privatleasing-3299-man-2026-suv-272701", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka Hybrid 145", null, "Hybrid", 3299, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-mokka-hybrid-145-privatleasing-rattvarme-navi-fr-3-299-2026-suv-272748", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-270967", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-269032", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-254670", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-252211", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-250232", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-249188", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka", "Mokka GS Hybrid", null, "Hybrid", 3299, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-mokka-gs-hybrid-145hk-aut-privatleasing-2026-suv-245745", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-377229", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-377122", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-376984", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-376839", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-376385", "14 sep", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-285476", "3 jul", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS. ELECTRIC", null, "El", 3999, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-mokka-e-gs-electric-privatleasing-fr-3-999-man-2026-suv-273155", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-270937", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-269029", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-254665", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-252202", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-250227", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-249182", "26 jun", 0, "SUV"),
      BW("Opel", "Mokka-e", "Mokka-e GS Electric", null, "El", 3999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-mokka-e-gs-electric-privatleasing-2026-suv-245722", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-377211", "14 sep", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-377105", "14 sep", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-376971", "14 sep", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-376827", "14 sep", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-376368", "14 sep", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-285589", "3 jul", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Täby", "Täby", "stockholms-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-270935", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-269022", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-254487", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-252201", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-250224", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Haninge", "Handen", "stockholms-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-249180", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS 180hk", null, "Diesel", 4299, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/opel-zafira-gs-180hk-aut-privatleasing-2026-suv-245706", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira 180hk AUT", null, "Diesel", 4999, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/opel-zafira-180hk-aut-gs-privatleasing-fr-4-999-man-8-9-saten-2026-suv-273176", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS BlueHDi", null, "Diesel", 4999, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/opel-zafira-gs-bluehdi-180hk-8-sits-privatleasing-4999-kr-man-2026-suv-270267", "26 jun", 0, "SUV"),
      BW("Opel", "Zafira", "Zafira GS BlueHDi", null, "Diesel", 4999, 0, "Bråviken Bil AB", "Norrköping", "ostergotlands-lan/opel-zafira-gs-bluehdi-180-aut-privatleasing-4-999kr-man-2026-suv-258390", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 1.2 PT", "p2008", "Bensin", 2499, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-2008-1-2-pt-100-hk-manuell-privatleasing-fran-2499-2026-suv-333328", "13 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Style 1.2", "p2008", "Bensin", 2499, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-2008-style-1-2-puretech-100hk-privatleasing-2026-suv-330836", "13 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Style 100hk", "p2008", "Bensin", 2499, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-2008-style-100hk-manuell-36man-privatleasing-fran-2-499kr-2025-suv-328440", "13 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 STYLE 100hk", "p2008", "Bensin", 2499, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-2008-style-100hk-pt-privatleasing-2499-kr-man-2026-suv-270274", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2699, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-2008-allure-hybrid-aut-privatleasing-fran-2699kr-man-2026-suv-328419", "13 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 HYBRID 145hk", "p2008", "Hybrid", 2699, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-2008-hybrid-145hk-aut-privatleasing-0-i-insats-2026-suv-275943", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 PureTech 145hk", "p2008", "Bensin", 2699, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-2008-puretech-145hk-style-hybrid-privatleasing-2026-suv-275814", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Hybrid", "p2008", "Hybrid", 2699, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-2008-hybrid-privatleasing-fran-2699-fast-pris-serviceavtal-2026-suv-271060", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 ALLURE Hybrid", "p2008", "Hybrid", 2699, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-2699-kr-man-2026-suv-270211", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-445839", "28 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Lund", "Lund", "skane-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-432307", "16 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-432102", "16 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-431849", "16 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-432068", "16 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-431209", "16 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-431176", "16 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-408735", "6 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-407783", "6 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-407591", "6 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-402372", "1 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J Bil Norrtälje", "Norrtälje", "stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-402057", "1 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-401732", "1 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-401595", "1 okt", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT Hybrid", "p2008", "Hybrid", 2799, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-2008-gt-hybrid-privatleasing-fran-2799kr-man-lagerbil-2026-suv-396671", "28 sep", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT", "p2008", "Hybrid", 2799, 0, "Biltjänst Truvegatan Lidköping", "Lidköping", "vastra-gotalands-lan/peugeot-2008-gt-privatleasing-fran-2799-man-2026-suv-371312", "9 sep", 0, "SUV"),
      BW("Peugeot", "2008", "2008 HYBRID 145", "p2008", "Hybrid", 2799, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-2008-hybrid-145-gt-automat-privatleasing-fran-2799-2026-suv-333384", "13 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT Hybrid", "p2008", "Laddhybrid", 2799, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-2008-gt-hybrid-145hk-privatleasing-2026-suv-330587", "13 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Hybrid STYLE", "p2008", "Hybrid", 2799, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-2008-hybrid-style-145hk-automat-privatleasing-2026-suv-275920", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT Hybrid", "p2008", "Hybrid", 2799, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-2008-gt-hybrid-145-aut-privatleasing-2799-kr-man-2026-suv-270273", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT Hybrid", "p2008", "Hybrid", 2799, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-2008-gt-hybrid-aut-privatleasing-2026-suv-245516", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Allure Hybrid", "p2008", "Hybrid", 2814, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-2008-allure-hybrid-145hk-automat-privatleasing-2026-suv-346702", "21 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT Hybrid", "p2008", "Hybrid", 2914, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-2008-gt-hybrid-145hk-automat-privatleasing-2026-suv-344789", "20 aug", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT PureTech", "p2008", "Bensin", 2999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-2008-gt-puretech-130hk-aut-kampanj-privatleasing-2025-suv-376921", "14 sep", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT PureTech", "p2008", "Bensin", 2999, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-2008-gt-puretech-130hk-aut-kampanj-privatleasing-2025-suv-270675", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT PureTech", "p2008", "Bensin", 2999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-2008-gt-puretech-130hk-aut-kampanj-privatleasing-2025-suv-268955", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Edition Hybrid", "p2008", "Hybrid", 2999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-2008-edition-hybrid-aut-kampanj-privatleasing-2025-suv-252218", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT PureTech", "p2008", "Bensin", 2999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-2008-gt-puretech-130hk-aut-kampanj-privatleasing-2025-suv-249092", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT PureTech", "p2008", "Bensin", 2999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-2008-gt-puretech-130hk-aut-kampanj-privatleasing-2025-suv-245815", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 GT Hybrid", "p2008", "Hybrid", 3214, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-2008-gt-hybrid-145hk-automat-privatleasing-2026-suv-275887", "26 jun", 0, "SUV"),
      BW("Peugeot", "2008", "2008 Hybrid", "p2008", "Hybrid", 3299, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-2008-hybrid-privatleasing-12man-3299-kr-man-fast-pris-2026-suv-400466", "30 sep", 0, "SUV"),
      BW("Peugeot", "208", "208 STYLE manuell", null, "Bensin", 2699, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-208-style-manuell-36man-privatleasing-2025-halvkombi-328443", "13 aug", 0, "Halvkombi/sedan"),
      BW("Peugeot", "208", "208 STYLE hybrid", null, "Hybrid", 3999, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-208-style-hybrid-36man-privatleasing-2025-halvkombi-328442", "13 aug", 0, "Halvkombi/sedan"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-377250", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-377145", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-377010", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-376861", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-376408", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-285634", "3 jul", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-270608", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-268923", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-254459", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-252139", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-250120", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-249065", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3099, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-2026-suv-245412", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3199, 0, "Newman Bil", "Hässleholm", "skane-lan/peugeot-3008-gt-hybrid-145-aut-privatleasing-2025-suv-332844", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 HYBRID GT", "p3008", "Hybrid", 3199, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-3008-hybrid-gt-145-automat-privatleasing-3199-man-2026-suv-332729", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT HYBRID", "p3008", "Laddhybrid", 3199, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-3008-gt-hybrid-145-edct-privatleasing-2026-suv-330656", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT HYBRID", "p3008", "Hybrid", 3199, 0, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-3008-gt-hybrid-automat-36man-privatleasing-fran-3199kr-man-2026-suv-328361", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3199, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-3008-gt-hybrid-145hkl-automat-privatleasing-2026-suv-275689", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3199, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-3008-gt-hybrid-privatleasing-fran-3199-kr-manad-2026-suv-271029", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Hybrid", "p3008", "Hybrid", 3199, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-3008-gt-hybrid-145hk-privatleasing-3199-kr-man-2026-suv-270272", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 HYBRID GT", "p3008", "Hybrid", 3585, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-3008-hybrid-gt-automat-dragkrok-privatleasing-2026-suv-275939", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466926", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466424", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466333", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466263", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J Bil Norrtälje", "Norrtälje", "stockholms-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466137", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Lund", "Lund", "skane-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466079", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465977", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465711", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465703", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465701", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465680", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465602", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465628", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465587", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3599, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-3008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465567", "13 nov", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ulitmate", "p3008", "Hybrid", 3699, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-3008-gt-ulitmate-hybrid-145-e-dsc-privatleasing-2026-suv-330807", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Ultimate", "p3008", "Hybrid", 3892, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-3008-gt-ultimate-hybrid-automat-privatleasing-2026-suv-275983", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT HYBRID", "p3008", "Hybrid", 3973, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-3008-gt-hybrid-privatleasing-panoramaglastak-focal-hifi-2026-suv-428811", "14 okt", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT HYBRID", "p3008", "Hybrid", 3999, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-3008-gt-hybrid-automat-privatleasing-12-manader-2026-suv-275981", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-377247", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-377141", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-377004", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-376859", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-376405", "14 sep", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Edition", "p3008", "Laddhybrid", 4999, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-3008-gt-edition-plug-in-hybrid-privatleasing-2026-suv-333168", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Plug-in", "p3008", "Laddhybrid", 4999, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-3008-gt-plug-in-hybrid-85km-195hk-privatleasing-2026-suv-330777", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-3008-gt-phev-el-rackvidd-85km-55l-tank-privatleasing-2026-suv-328414", "13 aug", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-285628", "3 jul", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PLUG-IN-HYBRID", "p3008", "Laddhybrid", 4999, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-3008-gt-plug-in-hybrid-automat-privatleasing-2026-suv-275921", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-270663", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT Plug-in", "p3008", "Laddhybrid", 4999, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-3008-gt-plug-in-hybrid-225hk-privatleasing-4999-kr-man-2026-suv-270304", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-268945", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-254513", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-252250", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-250248", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-249098", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 GT PHEV", "p3008", "Laddhybrid", 4999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-3008-gt-phev-195hk-privatleasing-2026-suv-245787", "26 jun", 0, "SUV"),
      BW("Peugeot", "3008", "3008 Plug-In Hybrid", "p3008", "Laddhybrid", 5192, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-3008-plug-in-hybrid-225hk-automat-privatleasing-2026-suv-344788", "20 aug", 0, "SUV"),
      BW("Peugeot", "408", "408 GT Hybrid", null, "Hybrid", 3299, 1000, "Svema Bil AB", "Karlstad", "varmlands-lan/peugeot-408-gt-hybrid-auto-privatleasing-3-299kr-man-2026-crossover-430510", "15 okt", 0, "SUV"),
      BW("Peugeot", "408", "408 Edition Hybrid", null, "Hybrid", 3299, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-408-edition-hybrid-automat-facelift-privatleasing-3299-2026-crossover-332805", "13 aug", 0, "SUV"),
      BW("Peugeot", "408", "408 GT Hybrid", null, "Hybrid", 3299, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-408-gt-hybrid-145-e-dsc-privatleasing-2026-crossover-330742", "13 aug", 0, "SUV"),
      BW("Peugeot", "408", "408 Hybrid GT", null, "Hybrid", 3299, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-408-hybrid-gt-privatleasing-3299kr-man-ink-serviceavtal-2026-crossover-271057", "26 jun", 0, "SUV"),
      BW("Peugeot", "408", "408 GT Hybrid", null, "Hybrid", 3299, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-408-gt-hybrid-145hk-aut-privatleasing-3299-kr-man-2026-crossover-270156", "26 jun", 0, "SUV"),
      BW("Peugeot", "408", "408 1.2 Aut", null, "Bensin", 3299, 0, "Njudungs Bil Oskarshamn AB", "Oskarshamn", "kalmar-lan/peugeot-408-1-2-aut-gt-hybrid-privatleasing-fran-3299-man-2025-crossover-224131", "9 jun", 0, "SUV"),
      BW("Peugeot", "408", "408 GT Hybrid", null, "Hybrid", 3745, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-408-gt-hybrid-145hk-automat-privatleasing-2026-crossover-275669", "26 jun", 0, "SUV"),
      BW("Peugeot", "408", "408 Hybrid PureTech", null, "Hybrid", 3938, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-408-hybrid-puretech-145hk-gt-exclusive-drag-privatleasing-2026-crossover-435100", "20 okt", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-377239", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-377135", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-377000", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-376854", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-376398", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-285630", "3 jul", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-270606", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-268924", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-254460", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-252138", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-250119", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-249064", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3299, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-5008-gt-hybrid-145hk-privatleasing-2026-suv-245409", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3399, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-5008-gt-hybrid-aut-privatleasing-fran-3399-man-2026-suv-333352", "13 aug", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT HYBRID", "p5008", "Hybrid", 3399, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-5008-gt-hybrid-145-e-dsc-7-sits-privatleasing-2026-suv-330642", "13 aug", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT HYBRID", "p5008", "Hybrid", 3399, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-5008-gt-hybrid-automat-7-sits-36man-privatleasing-2025-suv-328359", "13 aug", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT HYBRID", "p5008", "Hybrid", 3399, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-5008-gt-hybrid-145hk-automat-7-sits-privatleasing-2026-suv-275974", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 Hybrid PureTech", "p5008", "Hybrid", 3399, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-5008-hybrid-puretech-145-automat-7-sits-privatleasing-2026-suv-275743", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3399, 0, "Bendt Bil AB", "Halmstad", "hallands-lan/peugeot-5008-gt-hybrid-7-sits-privatleasing-3-399-man-2026-suv-273019", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3399, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-5008-gt-hybrid-privatleasing-fran-3399-kr-man-7-sitsig-2026-suv-271023", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Hybrid", "p5008", "Hybrid", 3399, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-5008-gt-hybrid-aut-7-sits-privatleasing-3399-kr-man-2026-suv-270269", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466927", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466425", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466334", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466264", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J Bil Norrtälje", "Norrtälje", "stockholms-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466138", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Lund", "Lund", "skane-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-466080", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465978", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465712", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465704", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465702", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465681", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465629", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465603", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465588", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 3899, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-5008-gt-ultimate-hybrid-145hk-privatleasing-2026-suv-465568", "13 nov", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-377243", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-377134", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-376995", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-376851", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-376397", "14 sep", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Edition", "p5008", "Laddhybrid", 4999, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-5008-gt-edition-plug-in-hybrid-privatleasing-2026-suv-333175", "13 aug", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-285626", "3 jul", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Plug-In-Hybrid", "p5008", "El", 4999, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-5008-gt-plug-in-hybrid-automat-7-sits-privatleasing-2026-suv-275856", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Plug-In", "p5008", "Laddhybrid", 4999, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-5008-gt-plug-in-hybrid-225hk-automat-privatleasing-7-sits-2026-suv-275839", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-270640", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Plug-in", "p5008", "Laddhybrid", 4999, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-5008-gt-plug-in-hybrid-85km-7-sits-privatleasing-4999-kr-man-2026-suv-270292", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-268958", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-254493", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-252242", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-250246", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-249079", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT PHEV", "p5008", "Laddhybrid", 4999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-5008-gt-phev-195hk-privatleasing-2026-suv-245767", "26 jun", 0, "SUV"),
      BW("Peugeot", "5008", "5008 GT Ultimate", "p5008", "Hybrid", 5499, 0, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-5008-gt-ultimate-plug-in-hybrid-7-sits-privatleasing-2026-suv-330750", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-377249", "14 sep", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-377143", "14 sep", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-377005", "14 sep", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-376862", "14 sep", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-376407", "14 sep", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT Elbil", "pe2008", "El", 3899, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-e-2008-gt-elbil-privatleasing-2026-halvkombi-333120", "13 aug", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT 406km", "pe2008", "El", 3899, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-e-2008-gt-406km-rackvidd-privatleasing-2026-halvkombi-330874", "13 aug", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT, 406km", "pe2008", "El", 3899, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-e-2008-gt-406km-privatleasing-36man-bakkamera-carplay-2026-halvkombi-328415", "13 aug", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-285633", "3 jul", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT Automat", "pe2008", "El", 3899, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-2008-gt-automat-privatleasing-2026-halvkombi-275947", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-e-2008-gt-privatleasing-156hk-54kwh-ink-serviceavtal-2026-halvkombi-271110", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-270665", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT 156hk", "pe2008", "El", 3899, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-e-2008-gt-156hk-406km-privatleasing-3899-kr-man-2026-halvkombi-270310", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-268953", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-254515", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-252263", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-250150", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-249110", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT", "pe2008", "El", 3899, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-e-2008-gt-privatleasing-2026-halvkombi-245807", "26 jun", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-2008", "e-2008 GT 54 kWh", "pe2008", "El", 4014, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-2008-gt-54-kwh-156hk-automat-privatleasing-2026-halvkombi-347188", "22 aug", 0, "Halvkombi/sedan"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-e-3008-gt-privatleasing-2026-suv-377245", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-e-3008-gt-privatleasing-2026-suv-377139", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-e-3008-gt-privatleasing-2026-suv-377002", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-e-3008-gt-privatleasing-2026-suv-376857", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-e-3008-gt-privatleasing-2026-suv-376403", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT Automat", null, "El", 4999, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-3008-gt-automat-privatleasing-2026-suv-368112", "7 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-e-3008-gt-privatleasing-fran-4999-ink-serviceavtal-2026-suv-367315", "7 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT Edition", null, "El", 4999, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-e-3008-gt-edition-elbil-privatleasing-2026-suv-333155", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 525km", null, "El", 4999, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-e-3008-gt-525km-privatleasing-2026-suv-330829", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT, 525km", null, "El", 4999, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-e-3008-gt-525km-privatleasing-motoriserad-baklucka-2026-suv-328420", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-e-3008-gt-privatleasing-2026-suv-285627", "3 jul", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 73 kWh", null, "El", 4999, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-3008-gt-73-kwh-automat-privatleasing-2026-suv-275892", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-e-3008-gt-privatleasing-2026-suv-270659", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 213hk", null, "El", 4999, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-e-3008-gt-213hk-525-km-privatleasing-4999-kr-man-2026-suv-270306", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-e-3008-gt-privatleasing-2026-suv-268948", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-e-3008-gt-privatleasing-2026-suv-254503", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-e-3008-gt-privatleasing-2026-suv-252267", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-e-3008-gt-privatleasing-2026-suv-250163", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-e-3008-gt-privatleasing-2026-suv-249085", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT", null, "El", 4999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-e-3008-gt-privatleasing-2026-suv-245820", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-377241", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-377137", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-376998", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-376853", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-376400", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4X4", null, "El", 5499, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-e-3008-gt-4x4-490km-325hk-privatleasing-2026-suv-330876", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 490km", null, "El", 5499, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-e-3008-gt-490km-4x4-awd-privatleasing-hog-utrustning-2026-suv-328416", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-285629", "3 jul", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT Dual", null, "El", 5499, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-3008-gt-dual-motor-4x4-awd-325hk-automat-privaleasing-2026-suv-275817", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-e-3008-gt-4x4-325hk-privatleasing-inklusive-serviceavtal-2026-suv-271112", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-270642", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 4x4 GT", null, "El", 5499, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-e-3008-4x4-gt-325hk-490km-privatleasing-5499-kr-man-2026-suv-270302", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-268946", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-254689", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-252247", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-250139", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-249088", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-3008", "e-3008 GT 4x4", null, "El", 5499, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-e-3008-gt-4x4-privatleasing-2026-suv-245771", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 7-sits", null, "El", 4999, 1000, "Svema Bil AB", "Karlstad", "varmlands-lan/peugeot-e-5008-gt-7-sits-privatleasing-4-999kr-man-2026-suv-430513", "15 okt", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-e-5008-gt-privatleasing-2026-suv-377237", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-e-5008-gt-privatleasing-2026-suv-377131", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-e-5008-gt-privatleasing-2026-suv-376994", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-e-5008-gt-privatleasing-2026-suv-376849", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-e-5008-gt-privatleasing-2026-suv-376395", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT Edition", null, "El", 4999, 0, "Aros Auto AB", "Västerås", "vastmanlands-lan/peugeot-e-5008-gt-edition-elbil-privatleasing-2026-suv-333156", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 7-sits", null, "El", 4999, 1000, "Dala Bilgalleri AB", "Borlänge", "dalarnas-lan/peugeot-e-5008-gt-7-sits-525km-privatleasing-2026-suv-330566", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT, 7sits", null, "El", 4999, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-e-5008-gt-7sits-525km-privatleasing-2026-suv-328407", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-e-5008-gt-privatleasing-2026-suv-285621", "3 jul", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT Automat", null, "El", 4999, 0, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-5008-gt-automat-7-sits-privatleasing-2026-suv-275938", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 0, "Bilkompani Karlskrona", "Karlskrona", "blekinge-lan/peugeot-e-5008-gt-privatleasing-fran-4999-7-sits-ink-serviceavtal-2026-suv-271108", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-e-5008-gt-privatleasing-2026-suv-270676", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 213hk", null, "El", 4999, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-e-5008-gt-213hk-500km-7-sits-privatleasing-4999-kr-man-2026-suv-270289", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-e-5008-gt-privatleasing-2026-suv-268943", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-e-5008-gt-privatleasing-2026-suv-254517", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-e-5008-gt-privatleasing-2026-suv-252238", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-e-5008-gt-privatleasing-2026-suv-250136", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-e-5008-gt-privatleasing-2026-suv-249108", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT", null, "El", 4999, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-e-5008-gt-privatleasing-2026-suv-245759", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT Automat", null, "El", 5192, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-5008-gt-automat-privatleasing-7-sits-2026-suv-275802", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Kristianstad", "Kristianstad", "skane-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-377235", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Helsingborg", "Helsingborg", "skane-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-377130", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Ängelholm", "Ängelholm", "skane-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-376992", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Jönköping", "Jönköping", "jonkopings-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-376847", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Falkenberg", "Falkenberg", "hallands-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-376393", "14 sep", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "Uppsala Bilgalleri AB", "Uppsala", "uppsala-lan/peugeot-e-5008-gt-4x4-awd-465km-325hk-privatleasing-2026-suv-328405", "13 aug", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J Bil Linköping", "Linköping", "ostergotlands-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-285620", "3 jul", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Täby", "Täby", "stockholms-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-270647", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 4x4 GT", null, "El", 5499, 1500, "Deluxe Bil AB", "Varberg", "hallands-lan/peugeot-e-5008-4x4-gt-325hk-465km-7-sits-privatleasing-5499-kr-man-2026-suv-270280", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J Bil Sätra", "Skärholmen", "stockholms-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-268937", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Vällingby", "Vällingby", "stockholms-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-254491", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Tagene", "Hisings Kärra", "vastra-gotalands-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-252229", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Väsby", "Upplands Väsby", "stockholms-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-250241", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Haninge", "Handen", "stockholms-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-249082", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT 4x4", null, "El", 5499, 1000, "J BIL Frölunda", "Västra Frölunda", "vastra-gotalands-lan/peugeot-e-5008-gt-4x4-privatleasing-2026-suv-245753", "26 jun", 0, "SUV"),
      BW("Peugeot", "e-5008", "e-5008 GT Dual", null, "El", 5692, 1000, "Eksjö Bilaffär AB", "Eksjö", "jonkopings-lan/peugeot-e-5008-gt-dual-motor-4x4-325hk-automat-privatleasing-7-sits-2026-suv-275809", "26 jun", 0, "SUV"),
      BW("Polestar", "4", "4 Business edition", "pol4", "El", 6995, 1500, "Volvo Car Kista", "Sollentuna", "stockholms-lan/polestar-4-business-edition-privatleasing-fran-6995-kr-manad-2027-suv-459583", "7 nov", 0, "SUV"),
      BW("Polestar", "4", "4 Coupé Rear", "pol4", "El", 6995, 1500, "Tage Rejmes Bil AB - Örebro", "Örebro", "orebro-lan/polestar-4-coupe-rear-motor-privatleasing-fran-6995-2027-suv-354678", "28 aug", 0, "SUV"),
      BW("Polestar", "4", "4 LRSM Pilot", "pol4", "El", 6995, 0, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/polestar-4-lrsm-pilot-privatleasing-fran-6995-kr-manad-2027-suv-354012", "27 aug", 0, "SUV"),
      BW("Polestar", "4", "4", "pol4", "El", 6995, 1500, "Volvo Car Kista", "Sollentuna", "stockholms-lan/polestar-4-privatleasing-fran-6995-man-2027-suv-299772", "15 jul", 0, "SUV"),
      BW("Polestar", "4", "4 Coupé Dual", "pol4", "El", 7295, 0, "Volvo Car Hisings Backa", "Hisings Backa", "vastra-gotalands-lan/polestar-4-coupe-dual-motor-privatleasing-7-295-kr-man-2027-suv-456660", "5 nov", 0, "SUV"),
      BW("Polestar", "4", "4 Dual motor", "pol4", "El", 7295, 1500, "Volvo Car Kista", "Sollentuna", "stockholms-lan/polestar-4-dual-motor-privatleasing-fran-7295kr-manad-2027-suv-444279", "27 okt", 0, "SUV"),
      BW("Polestar", "4", "4 LRDM Pilot", "pol4", "El", 7295, 0, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/polestar-4-lrdm-pilot-privatleasing-fran-7295-kr-manad-2027-suv-354002", "27 aug", 0, "SUV"),
      BW("Polestar", "4", "4 LRSM Prime", "pol4", "El", 7495, 0, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/polestar-4-lrsm-prime-privatleasing-fran-7495-kr-manad-2027-suv-354010", "27 aug", 0, "SUV"),
      BW("Polestar", "4", "4 LRDM Prime", "pol4", "El", 7795, 0, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/polestar-4-lrdm-prime-privatleasing-fran-7795-kr-manad-2027-suv-354005", "27 aug", 0, "SUV"),
      BW("Renault", "4", "4 ICONIC EV52", null, "El", 3390, 0, "Hedin Automotive Borås", "Borås", "vastra-gotalands-lan/renault-4-iconic-ev52-privatleasing-fr-3390-kr-man-2026-suv-153529", "20 maj", 0, "SUV"),
      BW("Renault", "4", "4 R4 TECHNO", null, "El", 3890, 0, "Hedin Automotive Alingsås", "Alingsås", "vastra-gotalands-lan/renault-4-r4-techno-ev52-privatleasing-fran-3890-kr-man-2026-suv-174000", "2 jun", 0, "SUV"),
      BW("Renault", "4 E-Tech", "4 E-Tech R4 E-TECH", null, "El", 3390, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-4-e-tech-r4-e-tech-evolution-ev40-privatleasing-2025-suv-366512", "7 sep", 0, "SUV"),
      BW("Renault", "4 E-Tech", "4 E-Tech R4 E-TECH", null, "El", 3890, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-4-e-tech-r4-e-tech-techno-ev52-privatleasing-2025-suv-366513", "7 sep", 0, "SUV"),
      BW("Renault", "4 E-Tech", "4 E-Tech R4 E-Tech", null, "El", 3990, 0, "Tage Rejmes Bil AB - Norrköping", "Norrköping", "ostergotlands-lan/renault-4-e-tech-r4-e-tech-techno-52kwh-privatleasing-2026-suv-465295", "11 nov", 0, "SUV"),
      BW("Renault", "4 E-Tech", "4 E-Tech R4 E-TECH", null, "El", 4390, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-4-e-tech-r4-e-tech-iconic-ev52-privatleasing-2025-suv-366510", "7 sep", 0, "SUV"),
      BW("Renault", "5", "5 TECHNO EV52", null, "El", 3690, 0, "Hedin Automotive Borås", "Borås", "vastra-gotalands-lan/renault-5-techno-ev52-privatleasing-fr-3690-kr-man-2026-halvkombi-155670", "21 maj", 0, "Halvkombi/sedan"),
      BW("Renault", "5 E-Tech", "5 E-Tech TECHNO EV52", "r5", "El", 3690, 0, "Hedin Automotive Borås", "Borås", "vastra-gotalands-lan/renault-5-e-tech-techno-ev52-privatleasing-fran-3690-kr-man-2026-halvkombi-383254", "17 sep", 0, "Halvkombi/sedan"),
      BW("Renault", "5 E-Tech", "5 E-Tech R5 E-Tech", "r5", "El", 3990, 0, "Tage Rejmes Bil AB - Norrköping", "Norrköping", "ostergotlands-lan/renault-5-e-tech-r5-e-tech-techno-52kwh-ii-privatleasing-2026-halvkombi-465296", "11 nov", 0, "Halvkombi/sedan"),
      BW("Renault", "5 E-Tech", "5 E-Tech R5 E-Tech", "r5", "El", 3990, 0, "Tage Rejmes Bil AB - Örebro", "Örebro", "orebro-lan/renault-5-e-tech-r5-e-tech-techno-52kwh-privatleasing-2026-halvkombi-465293", "11 nov", 0, "Halvkombi/sedan"),
      BW("Renault", "5 E-Tech", "5 E-Tech TECHNO EV52", "r5", "El", 3990, 0, "Hedin Automotive Borås", "Borås", "vastra-gotalands-lan/renault-5-e-tech-techno-ev52-privatleasing-fran-3990-kr-man-2026-halvkombi-365506", "4 sep", 0, "Halvkombi/sedan"),
      BW("Renault", "5 E-Tech", "5 E-Tech ELECTRIC TECHNO", "r5", "El", 3990, 0, "Hedin Automotive Ängelholm", "Ängelholm", "skane-lan/renault-5-e-tech-electric-techno-ev52-privatleasing-fr-3990-kr-man-2026-halvkombi-314789", "31 jul", 0, "Halvkombi/sedan"),
      BW("Renault", "Rafale", "Rafale Esprit Alpine", null, "Hybrid", 7690, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-rafale-esprit-alpine-edition-4x4-privatleasing-2025-suv-366503", "7 sep", 0, "SUV"),
      BW("Renault", "Rafale", "Rafale Atelier Alpine", null, "Hybrid", 8291, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-rafale-atelier-alpine-edition-4x4-privatleasing-2025-suv-366502", "7 sep", 0, "SUV"),
      BW("Renault", "Scenic E-Tech", "Scenic E-Tech E-TECH Evolution", null, "El", 3990, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-scenic-e-tech-e-tech-evolution-privatleasing-2025-suv-366505", "7 sep", 0, "SUV"),
      BW("Renault", "Scenic E-Tech", "Scenic E-Tech TECHNO 87KWh", null, "El", 4690, 1000, "Hedin Automotive Halmstad Bilvaruhuset", "Halmstad", "hallands-lan/renault-scenic-e-tech-techno-87kwh-privatleasing-4690-man-2026-suv-358827", "1 sep", 0, "SUV"),
      BW("Renault", "Scenic E-Tech", "Scenic E-Tech TECHNO EV87", null, "El", 4690, 1000, "Hedin Automotive Akalla", "Kista", "stockholms-lan/renault-scenic-e-tech-techno-ev87-long-range-privatleasing-4690-man-2027-suv-163029", "26 maj", 0, "SUV"),
      BW("Renault", "Scenic E-Tech", "Scenic E-Tech Electric techno", null, "El", 4990, 0, "Tage Rejmes Bil AB - Örebro", "Örebro", "orebro-lan/renault-scenic-e-tech-electric-techno-87kwh-220hk-privatleasing-2026-suv-467084", "13 nov", 0, "SUV"),
      BW("Renault", "Scenic E-Tech", "Scenic E-Tech E-TECH Techno", null, "El", 4990, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-scenic-e-tech-e-tech-techno-privatleasing-2025-suv-366504", "7 sep", 0, "SUV"),
      BW("Renault", "Scenic E-Tech", "Scenic E-Tech TECHNO EV87", null, "El", 4990, 0, "Hedin Automotive Borås", "Borås", "vastra-gotalands-lan/renault-scenic-e-tech-techno-ev87-privatleasing-fr-4990-kr-man-2027-suv-365507", "4 sep", 0, "SUV"),
      BW("Renault", "Scenic E-Tech", "Scenic E-Tech E-TECH Esprit", null, "El", 5790, 0, "Finnvedens Bil Peugeot & Begagnatcenter", "Värnamo", "jonkopings-lan/renault-scenic-e-tech-e-tech-esprit-alpine-privatleasing-2025-suv-366508", "7 sep", 0, "SUV"),
      BW("Seat", "Arona", "Arona", null, "Bensin", 2295, 1000, "CUPRA Haninge Bilia", "Österhaninge", "stockholms-lan/seat-arona-fr-115hk-privatleasing-2027-suv-452704", "3 nov", 0, "SUV"),
      BW("Seat", "Arona", "Arona 1.0 TSI", null, "Bensin", 2295, 1000, "Din Bil / CUPRA Malmö", "Malmö", "skane-lan/seat-arona-1-0-tsi-115hk-privatleasing-inkl-komfortpaket-2027-suv-449651", "30 okt", 0, "SUV"),
      BW("Seat", "Arona", "Arona", null, "Bensin", 2695, 1000, "Aftén Bil CUPRA Nybil Upplands Väsby", "Upplands Väsby", "stockholms-lan/seat-arona-fr-aften-edition-automat-privatleasing-2027-suv-266845", "26 jun", 0, "SUV"),
      BW("Skoda", "Elroq", "Elroq 60 Explore", "elroq", "El", 3695, 0, "Bilia Haninge Skoda", "Haninge", "stockholms-lan/skoda-elroq-60-explore-privatleasing-3695-2027-suv-222071", "8 jun", 0, "SUV"),
      BW("Skoda", "Elroq", "Elroq 60 Explore", "elroq", "El", 3695, 0, "CUPRA Nacka Bilia", "Nacka", "stockholms-lan/skoda-elroq-60-explore-privatleasing-3695-hos-bilia-nacka-2027-suv-222141", "8 jun", 0, "SUV"),
      BW("Skoda", "Elroq", "Elroq Selection 60", "elroq", "El", 3995, 1000, "Börjessons Bil i Alingsås", "Alingsås", "vastra-gotalands-lan/skoda-elroq-selection-60-explore-edition-privatleasing-3995-man-2027-suv-426151", "13 okt", 0, "SUV"),
      BW("Skoda", "Elroq", "Elroq 60", "elroq", "El", 3995, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-elroq-60-privatleasing-2027-suv-418904", "10 okt", 0, "SUV"),
      BW("Skoda", "Elroq", "Elroq 60 58 kWh", "elroq", "El", 3995, 1000, "Bilteam Östhammar AB", "Östhammar", "uppsala-lan/skoda-elroq-60-58-kwh-190hk-privatleasing-2027-suv-265541", "26 jun", 0, "SUV"),
      BW("Skoda", "Elroq", "Elroq iv60", "elroq", "El", 3995, 1000, "Din Bil / Skoda Eklanda", "Mölndal", "vastra-gotalands-lan/skoda-elroq-iv60-privatleasing-3995-2027-suv-176009", "3 jun", 0, "SUV"),
      BW("Skoda", "Elroq", "Elroq 85x", "elroq", "El", 5395, 1000, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-elroq-85x-fr-5-395kr-man-privatleasing-dragkrok-4x4-2027-suv-421998", "10 okt", 0, "SUV"),
      BW("Skoda", "Enyaq", "Enyaq 85 Selection", "enyaq", "El", 4995, 1000, "Din Bil / Skoda Bromma", "Bromma", "stockholms-lan/skoda-enyaq-85-selection-4-995-manad-privatleasing-2027-suv-436473", "20 okt", 0, "SUV"),
      BW("Skoda", "Enyaq", "Enyaq 85 Solid", "enyaq", "El", 4995, 0, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-enyaq-85-solid-edition-privatleasing-fr-4-995kr-man-2027-suv-421993", "10 okt", 0, "SUV"),
      BW("Skoda", "Enyaq", "Enyaq 85", "enyaq", "El", 4995, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-enyaq-85-privatleasing-2027-suv-418914", "10 okt", 0, "SUV"),
      BW("Skoda", "Enyaq", "Enyaq 85 Backkamera", "enyaq", "El", 4995, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/skoda-enyaq-85-backkamera-drag-navigation-privatleasing-2027-suv-410072", "7 okt", 0, "SUV"),
      BW("Skoda", "Enyaq", "Enyaq 85", "enyaq", "El", 5295, 1000, "Din Bil / Skoda Eklanda", "Mölndal", "vastra-gotalands-lan/skoda-enyaq-85-privatleasing-kampanj-5295-2027-suv-176011", "3 jun", 0, "SUV"),
      BW("Skoda", "Enyaq", "Enyaq Sportline 85X", "enyaq", "El", 5625, 0, "Din Bil / Skoda Bromma", "Bromma", "stockholms-lan/skoda-enyaq-sportline-85x-5-625-man-privatleasing-2027-suv-461666", "10 nov", 0, "SUV"),
      BW("Skoda", "Enyaq", "Enyaq 85x Sportline", "enyaq", "El", 5970, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-enyaq-85x-sportline-privatleasing-2027-suv-418936", "10 okt", 0, "SUV"),
      BW("Skoda", "Enyaq Coupé", "Enyaq Coupé RS", "enyaqc", "El", 5495, 0, "Din Bil / Skoda Bromma", "Bromma", "stockholms-lan/skoda-enyaq-coupe-rs-340-hk-hostkampanj-5-495-man-privatleasing-2027-suv-461663", "10 nov", 0, "SUV"),
      BW("Skoda", "Enyaq Coupé", "Enyaq Coupe RS", "enyaqc", "El", 5495, 1000, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-enyaq-coupe-rs-coupe-rs-hostkampanj-5-495-man-privatleasing-2027-suv-422005", "10 okt", 0, "SUV"),
      BW("Skoda", "Enyaq Coupé", "Enyaq Coupe RS", "enyaqc", "El", 5995, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-enyaq-coupe-rs-coupe-rs-fran-5-995kr-man-privatleasing-2027-suv-418933", "10 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq 35 ESSENCE", "epiq", "El", 2795, 0, "Börjessons Bil i Alingsås", "Alingsås", "vastra-gotalands-lan/skoda-epiq-35-essence-privatleasing-fran-2-795-kr-man-2027-suv-433149", "17 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq 35", "epiq", "El", 2795, 1000, "Din Bil / Skoda Bäckebol", "Västra Götaland", "vastra-gotalands-lan/skoda-epiq-35-privatleasing-2795-kr-man-ink-service-2027-suv-426817", "13 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq 55 ESSENCE", "epiq", "El", 3295, 0, "Börjessons Bil i Alingsås", "Alingsås", "vastra-gotalands-lan/skoda-epiq-55-essence-privatleasing-fran-3-295-kr-man-2027-suv-433148", "17 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq", "epiq", "El", 3295, 1000, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-epiq-fr-3-295-man-privatleasing-55-essence-211hk-2027-suv-421982", "10 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq 55 Essence", "epiq", "El", 3295, 0, "Din Bil / Skoda Bredden", "Upplands Väsby", "stockholms-lan/skoda-epiq-55-essence-privatleasing-3-295-2027-suv-420315", "10 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq Essence 55", "epiq", "El", 3295, 0, "Din Bil / Skoda Bredden", "Upplands Väsby", "stockholms-lan/skoda-epiq-essence-55-privatleasing-fran-3-295-inkl-service-2027-suv-420317", "10 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq 55 Essence", "epiq", "El", 3295, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-epiq-55-essence-privatleasing-2027-suv-418927", "10 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq 55 Essence", "epiq", "El", 3295, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/skoda-epiq-55-essence-privatleasing-2027-suv-410074", "7 okt", 0, "SUV"),
      BW("Skoda", "Epiq", "Epiq 50", "epiq", "El", 3295, 1000, "Din Bil / Skoda Eklanda", "Mölndal", "vastra-gotalands-lan/skoda-epiq-50-privatleasing-3295-2027-suv-176010", "3 jun", 0, "SUV"),
      BW("Skoda", "Fabia", "Fabia", "fabia", "Bensin", 2995, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-fabia-kampanj-privatleasing-monte-carlo-tsi-116-dsg-2027-halvkombi-418938", "10 okt", 0, "Halvkombi/sedan"),
      BW("Skoda", "Fabia", "Fabia Monte Carlo", "fabia", "Bensin", 2995, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-fabia-monte-carlo-dsg-privatleasing-2027-halvkombi-418917", "10 okt", 0, "Halvkombi/sedan"),
      BW("Skoda", "Kamiq", "Kamiq", "kamiq", "Bensin", 2795, 0, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-kamiq-privatleasing-fr-2795-man-inkl-service-2027-suv-422022", "10 okt", 0, "SUV"),
      BW("Skoda", "Kamiq", "Kamiq", "kamiq", "Bensin", 2995, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-kamiq-kampanj-privatleasing-2-995kr-man-2027-suv-418920", "10 okt", 0, "SUV"),
      BW("Skoda", "Karoq", "Karoq Selection DSG", "karoq", "Bensin", 3030, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-karoq-selection-dsg-privatleasing-2027-suv-418908", "10 okt", 0, "SUV"),
      BW("Skoda", "Kodiaq", "Kodiaq Selection 1,5", "kodiaq", "Hybrid", 4395, 1000, "Din Bil / Skoda Bromma", "Bromma", "stockholms-lan/skoda-kodiaq-selection-1-5-tsi-m-hev-dsg-privatleasing-fr-4395kr-man-2027-suv-461345", "9 nov", 0, "SUV"),
      BW("Skoda", "Kodiaq", "Kodiaq Sportline 1,5", "kodiaq", "Hybrid", 4679, 1000, "Din Bil / Skoda Bromma", "Bromma", "stockholms-lan/skoda-kodiaq-sportline-1-5-tsi-m-hev-dsg-privatleasing-fr-4679-2026-suv-461347", "9 nov", 0, "SUV"),
      BW("Skoda", "Kodiaq", "Kodiaq Selection Laddhybrid", "kodiaq", "Laddhybrid", 5280, 1000, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-kodiaq-selection-laddhybrid-privatleasing-fran-5280kr-man-2027-suv-448251", "29 okt", 0, "SUV"),
      BW("Skoda", "Kodiaq", "Kodiaq Selection iV", "kodiaq", "Hybrid", 5280, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-kodiaq-selection-iv-privatleasing-2027-suv-418948", "10 okt", 0, "SUV"),
      BW("Skoda", "Octavia", "Octavia", null, "Hybrid", 2995, 0, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-octavia-kampanj-privatleasing-fr-2-995kr-man-2027-kombi-422039", "10 okt", 0, "Kombi"),
      BW("Skoda", "Octavia", "Octavia", null, "Bensin", 3030, 1000, "Börjessons Karlskrona", "Karlskrona", "blekinge-lan/skoda-octavia-privatleasing-2027-kombi-421452", "10 okt", 0, "Kombi"),
      BW("Skoda", "Octavia", "Octavia 1.5 TSI", null, "Bensin", 3030, 1000, "Börjessons Karlshamn", "Karlshamn", "blekinge-lan/skoda-octavia-1-5-tsi-mhev-116hk-dsg-privatleasing-fr-3-030-man-2027-kombi-330760", "13 aug", 0, "Kombi"),
      BW("Skoda", "Octavia", "Octavia Sportline", null, "Hybrid", 3845, 0, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-octavia-sportline-privatleasing-fr-3845-kr-man-2027-kombi-421992", "10 okt", 0, "Kombi"),
      BW("Skoda", "Peaq", "Peaq 90", "peaq", "El", 6645, 1000, "Bilia Haninge Skoda", "Haninge", "stockholms-lan/skoda-peaq-90-privatleasing-6645-hos-bilia-haninge-2027-suv-243036", "26 jun", 10000, "SUV"),
      BW("Skoda", "Peaq", "Peaq 90", "peaq", "El", 6945, 1000, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-peaq-90-privatleasing-5-eller-7-sits-2027-suv-421985", "10 okt", 0, "SUV"),
      BW("Skoda", "Peaq", "Peaq 90", "peaq", "El", 6949, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-peaq-90-privatleasing-2027-suv-418919", "10 okt", 0, "SUV"),
      BW("Skoda", "Peaq", "Peaq 90X 4X4", "peaq", "El", 7095, 0, "CUPRA Nacka Bilia", "Nacka", "stockholms-lan/skoda-peaq-90x-4x4-privatleasing-7095-hos-bilia-nacka-2027-suv-460987", "9 nov", 0, "SUV"),
      BW("Skoda", "Peaq", "Peaq 90X", "peaq", "El", 7395, 1000, "Din Bil / Skoda Sätra", "Skärholmen", "stockholms-lan/skoda-peaq-90x-privatleasing-finns-som-7-sits-4x4-2027-suv-422019", "10 okt", 0, "SUV"),
      BW("Skoda", "Superb Combi", "Superb Combi Selection", "superb", "Hybrid", 4995, 1000, "Din Bil / Skoda Täby", "Täby", "stockholms-lan/skoda-superb-combi-selection-iv-privatleasing-2027-kombi-418945", "10 okt", 0, "Kombi"),
      BW("Subaru", "Forester", "Forester 2,0i e-Boxer", null, "Bensin", 4495, 1500, "RA Motor AB - Uppsala Nya bilar", "Uppsala", "uppsala-lan/subaru-forester-2-0i-e-boxer-boxer-privatleasing-ink-drag-vinterhjul-2025-kombi-426918", "13 okt", 0, "Kombi"),
      BW("Subaru", "Outback", "Outback 2.5 4WD", null, "Bensin", 4990, 0, "Landrins Bil Västerås Hälla", "Västerås", "vastmanlands-lan/subaru-outback-2-5-4wd-xfuel-adventure-erbjudande-privatleasing-2026-kombi-241988", "25 jun", 0, "Kombi"),
      BW("Subaru", "Uncharted", "Uncharted Adventure 451km", null, "El", 4795, 1500, "Risbergs Bil AB", "Täby", "stockholms-lan/subaru-uncharted-adventure-451km-privatleasing-kampanj-sista-bilen-2026-suv-260459", "26 jun", 0, "SUV"),
      BW("Suzuki", "Swift", "Swift Automat SERVICE", null, "Bensin", 2999, 1000, "Torvalla Bil Sätra AB", "Skärholmen", "stockholms-lan/suzuki-swift-automat-service-privatleasing-fr-1495-kr-man-2026-halvkombi-414969", "10 okt", 0, "Halvkombi/sedan"),
      BW("Suzuki", "Swift", "Swift Hybrid CVT", null, "Hybrid", 3295, 0, "Inlags Bil AB", "Kungsbacka", "hallands-lan/suzuki-swift-hybrid-cvt-select-privatleasing-3295-man-2026-halvkombi-266634", "26 jun", 0, "Halvkombi/sedan"),
      BW("Suzuki", "Vitara", "Vitara Hybrid Euro", null, "Hybrid", 3095, 0, "Inlags Bil AB", "Kungsbacka", "hallands-lan/suzuki-vitara-hybrid-euro-6-privatleasing-3095kr-man-2026-suv-378331", "14 sep", 0, "SUV"),
      BW("Suzuki", "Vitara", "Vitara 1.4T Hybrid", null, "Hybrid", 3795, 0, "Inlags Bil AB", "Kungsbacka", "hallands-lan/suzuki-vitara-1-4t-hybrid-base-mc-hybrid-privatleasing-2026-suv-266646", "26 jun", 0, "SUV"),
      BW("Suzuki", "e Vitara", "e Vitara 61 kWh Select", null, "El", 4645, 0, "Inlags Bil AB", "Kungsbacka", "hallands-lan/suzuki-e-vitara-61-kwh-select-2wd-privatleasing-4645kr-manad-2026-suv-266563", "26 jun", 0, "SUV"),
      BW("Toyota", "Aygo", "Aygo X 1.0", null, "Bensin", 2795, 0, "Bilia Eskilstuna - Toyota", "Eskilstuna", "sodermanlands-lan/toyota-aygo-x-1-0-manuell-x-play-privatleasing-fast-ranta-2025-halvkombi-421658", "10 okt", 0, "Halvkombi/sedan"),
      BW("Toyota", "Aygo", "Aygo X Hybrid", null, "Hybrid", 3503, 0, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-aygo-x-hybrid-x-play-biltrean-all-inclusive-privatleasing-2026-halvkombi-347760", "24 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Aygo X", "Aygo X", "aygox", "Bensin", 2995, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-aygo-x-privatleasing-fast-ranta-2025-halvkombi-418720", "10 okt", 0, "Halvkombi/sedan"),
      BW("Toyota", "Aygo X", "Aygo X HYBRID", "aygox", "Hybrid", 2995, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-aygo-x-hybrid-privatleasing-fran-2995-kr-man-2026-halvkombi-342543", "19 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Aygo X", "Aygo X X Hybrid", "aygox", "Hybrid", 2995, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-aygo-x-x-hybrid-privatleasing-fast-manadskostnad-2026-halvkombi-332370", "13 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Aygo X", "Aygo X HYBRID", "aygox", "Hybrid", 3503, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-aygo-x-hybrid-privatleasing-biltrean-all-inclusive-2026-halvkombi-332425", "13 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "C-HR", "C-HR Nya HEV", "chr", "Bensin", 3595, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-c-hr-nya-hev-privatleasing-fast-ranta-2025-suv-418718", "10 okt", 0, "SUV"),
      BW("Toyota", "C-HR", "C-HR 1,8 Hybrid", "chr", "Hybrid", 3595, 1500, "Biltrean Toyota Åkersberga nya bilar", "Åkersberga", "stockholms-lan/toyota-c-hr-1-8-hybrid-active-privatleasing-kampanj-2026-suv-345418", "21 aug", 0, "SUV"),
      BW("Toyota", "C-HR", "C-HR HYBRID", "chr", "Hybrid", 3595, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-c-hr-hybrid-privatleasing-fran-3-595kr-man-2026-suv-332626", "13 aug", 0, "SUV"),
      BW("Toyota", "C-HR", "C-HR Hybrid", "chr", "Hybrid", 3595, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-c-hr-hybrid-privatleasing-kampanj-fast-manadskostnad-2026-suv-332361", "13 aug", 0, "SUV"),
      BW("Toyota", "C-HR", "C-HR", "chr", "Hybrid", 4695, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-c-hr-privatleasing-style-fran-4-695kr-man-2026-suv-332890", "13 aug", 0, "SUV"),
      BW("Toyota", "C-HR+", "C-HR+ C-HR+ Active", null, "El", 5795, 0, "Bilia Lund - Toyota", "Lund", "skane-lan/toyota-c-hr-plus-c-hr-plus-active-18-privatleasing-2026-sedan-421358", "10 okt", 0, "Halvkombi/sedan"),
      BW("Toyota", "C-HR+", "C-HR+", null, "El", 5795, 1500, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-c-hr-plus-privatleasing-fran-5795-kr-2026-suv-347763", "24 aug", 0, "SUV"),
      BW("Toyota", "C-HR+", "C-HR+", null, "El", 5795, 1500, "Biltrean Toyota Åkersberga nya bilar", "Åkersberga", "stockholms-lan/toyota-c-hr-plus-privatleasing-fran-5795-kr-2026-suv-345441", "21 aug", 0, "SUV"),
      BW("Toyota", "Corolla", "Corolla 1,8 HSD", null, "Hybrid", 3395, 1500, "Europeiska Motor - Rissne", "Sundbyberg", "stockholms-lan/toyota-corolla-1-8-hsd-touring-sports-active-privatleasing-2025-kombi-419689", "10 okt", 0, "Kombi"),
      BW("Toyota", "Corolla", "Corolla 1,8 HSD", null, "Hybrid", 3595, 1500, "Europeiska Motor - Rissne", "Sundbyberg", "stockholms-lan/toyota-corolla-1-8-hsd-touring-active-plus-privatleasing-2025-kombi-419690", "10 okt", 0, "Kombi"),
      BW("Toyota", "Corolla", "Corolla 1.8 HSD", null, "Hybrid", 3945, 0, "Bilia Eskilstuna - Toyota", "Eskilstuna", "sodermanlands-lan/toyota-corolla-1-8-hsd-active-5-d-privatleasing-fast-ranta-2025-halvkombi-421638", "10 okt", 0, "Halvkombi/sedan"),
      BW("Toyota", "Corolla", "Corolla 5-D Hybrid", null, "Hybrid", 3945, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-corolla-5-d-hybrid-privatleasing-fast-ranta-2025-halvkombi-418710", "10 okt", 0, "Halvkombi/sedan"),
      BW("Toyota", "Corolla", "Corolla 5-D Hybrid", null, "Hybrid", 3945, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-corolla-5-d-hybrid-privatleasing-fast-manadskostnad-2026-halvkombi-332354", "13 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Corolla Cross", "Corolla Cross 1,8 Active", "corollacross", "Hybrid", 4595, 1500, "Bilia Eskilstuna - Toyota", "Eskilstuna", "sodermanlands-lan/toyota-corolla-cross-1-8-active-privatleasing-fast-ranta-2025-crossover-421636", "10 okt", 0, "SUV"),
      BW("Toyota", "Corolla Cross", "Corolla Cross Hybrid", "corollacross", "Hybrid", 4595, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-corolla-cross-hybrid-privatleasing-fast-ranta-2025-crossover-418719", "10 okt", 0, "SUV"),
      BW("Toyota", "Corolla Cross", "Corolla Cross Hybrid Active", "corollacross", "Hybrid", 4595, 0, "Bilia Kungens Kurva - Toyota", "Kungens Kurva", "stockholms-lan/toyota-corolla-cross-hybrid-active-privatleasing-2026-crossover-415900", "10 okt", 0, "SUV"),
      BW("Toyota", "Corolla Cross", "Corolla Cross NYA KAROSSEN", "corollacross", "Bensin", 4595, 0, "Biltrean Toyota Åkersberga nya bilar", "Åkersberga", "stockholms-lan/toyota-corolla-cross-nya-karossen-privatleasing-4595kr-man-2026-crossover-345439", "21 aug", 0, "SUV"),
      BW("Toyota", "Corolla Cross", "Corolla Cross", "corollacross", "Hybrid", 4595, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-corolla-cross-privatleasing-fran-4595-kr-man-2026-crossover-332861", "13 aug", 0, "SUV"),
      BW("Toyota", "Corolla Cross", "Corolla Cross Hybrid", "corollacross", "Hybrid", 4595, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-corolla-cross-hybrid-privatleasing-fast-manadskostnad-nya-modellen-2026-crossover-332367", "13 aug", 0, "SUV"),
      BW("Toyota", "Corolla Touring Sports", "Corolla 1.8 TS", "corollats", "Hybrid", 3395, 0, "Bilia Lund - Toyota", "Lund", "skane-lan/toyota-corolla-1-8-ts-hybrid-active-privatleasing-2026-kombi-421347", "10 okt", 0, "Kombi"),
      BW("Toyota", "Corolla Touring Sports", "Corolla Touring Hybrid", "corollats", "Hybrid", 3395, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-corolla-touring-hybrid-privatleasing-fast-ranta-2025-kombi-418722", "10 okt", 0, "Kombi"),
      BW("Toyota", "Corolla Touring Sports", "Corolla TS 1,8", "corollats", "Hybrid", 3395, 0, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-corolla-ts-1-8-140hk-elhybrid-privatleasing-endast-3395kr-man-2026-kombi-347751", "24 aug", 0, "Kombi"),
      BW("Toyota", "Corolla Touring Sports", "Corolla TS Hybrid", "corollats", "Hybrid", 3395, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-corolla-ts-hybrid-privatleasing-fast-manadskostnad-2026-kombi-332254", "13 aug", 0, "Kombi"),
      BW("Toyota", "RAV4", "RAV4 Hybrid", "rav4", "Hybrid", 5995, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-rav4-hybrid-privatleasing-fast-ranta-2025-suv-418708", "10 okt", 0, "SUV"),
      BW("Toyota", "RAV4", "RAV4 Hybrid AWD-i", "rav4", "Hybrid", 5995, 0, "Bilia Kungens Kurva - Toyota", "Kungens Kurva", "stockholms-lan/toyota-rav4-hybrid-awd-i-privatleasing-2026-suv-415906", "10 okt", 0, "SUV"),
      BW("Toyota", "RAV4", "RAV4 HYBRID", "rav4", "Hybrid", 6295, 1500, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-rav4-hybrid-nya-modellen-privatleasing-2026-suv-347761", "24 aug", 0, "SUV"),
      BW("Toyota", "RAV4", "RAV4 NYA Hybrid", "rav4", "Hybrid", 6295, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-rav4-nya-hybrid-privatleasing-fast-manadskostnad-2026-suv-332250", "13 aug", 0, "SUV"),
      BW("Toyota", "RAV4", "RAV4 Laddhybrid", "rav4", "Laddhybrid", 6795, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-rav4-laddhybrid-privatleasing-fast-ranta-2025-suv-418714", "10 okt", 0, "SUV"),
      BW("Toyota", "RAV4", "RAV4 Plug-in Hybrid", "rav4", "Laddhybrid", 7195, 0, "Bilia Kungens Kurva - Toyota", "Kungens Kurva", "stockholms-lan/toyota-rav4-plug-in-hybrid-active-privatleasing-2026-suv-415892", "10 okt", 0, "SUV"),
      BW("Toyota", "RAV4", "RAV4 NYA Laddhybrid", "rav4", "Laddhybrid", 7195, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-rav4-nya-laddhybrid-privatleasing-fast-manadskostnad-2026-suv-332275", "13 aug", 0, "SUV"),
      BW("Toyota", "RAV4", "RAV4 2.5 Laddhybrid", "rav4", "Laddhybrid", 7295, 0, "Bilia Eskilstuna - Toyota", "Eskilstuna", "sodermanlands-lan/toyota-rav4-2-5-laddhybrid-active-privatleasing-fast-ranta-2025-suv-421648", "10 okt", 0, "SUV"),
      BW("Toyota", "Yaris", "Yaris Hybrid", "yaris", "Hybrid", 2995, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-yaris-hybrid-privatleasing-fast-ranta-2025-halvkombi-418713", "10 okt", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris", "Yaris Hybrid 115 HK", "yaris", "Hybrid", 2995, 0, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-yaris-hybrid-115-hk-active-privatleasing-fran-2995kr-man-2026-halvkombi-347759", "24 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris", "Yaris Hybrid 115", "yaris", "Hybrid", 2995, 0, "Biltrean Toyota Åkersberga nya bilar", "Åkersberga", "stockholms-lan/toyota-yaris-hybrid-115-active-privatleasing-2995kr-2026-halvkombi-345415", "21 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris", "Yaris HYBRID", "yaris", "Hybrid", 2995, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-yaris-hybrid-privatleasing-fran-2995kr-man-2026-halvkombi-332800", "13 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris", "Yaris Hybrid", "yaris", "Hybrid", 2995, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-yaris-hybrid-privatleasing-fast-manadskostnad-2026-halvkombi-332251", "13 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris", "Yaris 1,5 Active", "yaris", "Hybrid", 2995, 1500, "Erlings Bil i Kungälv AB", "Kungälv", "vastra-gotalands-lan/toyota-yaris-1-5-active-kampanj-pa-privatleasing-2026-halvkombi-322634", "10 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris", "Yaris", "yaris", "Hybrid", 3248, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-yaris-privatleasing-biltrean-all-inclusive-se-annons-2026-halvkombi-332466", "13 aug", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris", "Yaris 1.5 HSD", "yaris", "Hybrid", 3595, 0, "Bilia Eskilstuna - Toyota", "Eskilstuna", "sodermanlands-lan/toyota-yaris-1-5-hsd-life-privatleasing-fast-ranta-2025-halvkombi-421663", "10 okt", 0, "Halvkombi/sedan"),
      BW("Toyota", "Yaris Cross", "Yaris Cross", "yariscross", "Bensin", 3195, 0, "Bilia Trelleborg - Toyota", "Trelleborg", "skane-lan/toyota-yaris-cross-kampanj-privatleasing-2025-crossover-421667", "10 okt", 0, "SUV"),
      BW("Toyota", "Yaris Cross", "Yaris Cross 1.5 Hybrid", "yariscross", "Hybrid", 3195, 1500, "Europeiska Motor - Rissne", "Sundbyberg", "stockholms-lan/toyota-yaris-cross-1-5-hybrid-active-privatleasing-2025-crossover-419691", "10 okt", 0, "SUV"),
      BW("Toyota", "Yaris Cross", "Yaris Cross Hybrid", "yariscross", "Hybrid", 3195, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-yaris-cross-hybrid-privatleasing-fast-ranta-2025-crossover-418721", "10 okt", 0, "SUV"),
      BW("Toyota", "Yaris Cross", "Yaris Cross 1,5 130HK", "yariscross", "Hybrid", 3195, 0, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-yaris-cross-1-5-130hk-elhybrid-privatleasing-endast-3195kr-man-2026-crossover-347752", "24 aug", 0, "SUV"),
      BW("Toyota", "Yaris Cross", "Yaris Cross 1,5 Active", "yariscross", "Hybrid", 3195, 1500, "Erlings Bil i Kungälv AB", "Kungälv", "vastra-gotalands-lan/toyota-yaris-cross-1-5-active-kampanj-pa-privatleasing-2026-crossover-334589", "13 aug", 0, "SUV"),
      BW("Toyota", "Yaris Cross", "Yaris Cross NYA", "yariscross", "Hybrid", 3195, 1500, "Toyota Uppsala", "Uppsala", "uppsala-lan/toyota-yaris-cross-nya-privatleasing-fran-3-195kr-man-2026-crossover-332624", "13 aug", 0, "SUV"),
      BW("Toyota", "Yaris Cross", "Yaris Cross Hybrid", "yariscross", "Hybrid", 3195, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-yaris-cross-hybrid-privatleasing-fast-manadskostnad-2026-crossover-332259", "13 aug", 0, "SUV"),
      BW("Toyota", "Yaris Cross", "Yaris Cross 1,5 130HK", "yariscross", "Hybrid", 3530, 0, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-yaris-cross-1-5-130hk-elhybrid-biltrean-all-inclusive-privatleasing-2026-crossover-347749", "24 aug", 0, "SUV"),
      BW("Toyota", "bZ4X", "bZ4X", "bz4x", "El", 5895, 1500, "Bilia Haninge - Toyota", "Handen", "stockholms-lan/toyota-bz4x-privatleasing-fast-ranta-2025-suv-418711", "10 okt", 0, "SUV"),
      BW("Toyota", "bZ4X", "bZ4X", "bz4x", "El", 5895, 1500, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-bz4x-privatleasing-fran-5895-kr-man-2026-suv-347736", "24 aug", 0, "SUV"),
      BW("Toyota", "bZ4X", "bZ4X", "bz4x", "El", 5895, 1500, "Biltrean Toyota Åkersberga nya bilar", "Åkersberga", "stockholms-lan/toyota-bz4x-privatleasing-fran-5895-kr-man-2026-suv-345440", "21 aug", 0, "SUV"),
      BW("Toyota", "bZ4X", "bZ4X", "bz4x", "El", 5895, 1500, "Bilia Nacka  - Toyota", "Nacka", "stockholms-lan/toyota-bz4x-privatleasing-fast-manadskostnad-2026-suv-332279", "13 aug", 0, "SUV"),
      BW("Toyota", "bZ4X", "bZ4X Active 2WD", "bz4x", "El", 5995, 1500, "Bilia Eskilstuna - Toyota", "Eskilstuna", "sodermanlands-lan/toyota-bz4x-active-2wd-100-el-privatleasing-fast-ranta-2025-suv-421664", "10 okt", 0, "SUV"),
      BW("Toyota", "bZ4X Touring", "bZ4X Touring", "bz4xt", "El", 6295, 1500, "Biltrean Toyota Norrtälje nya bilar", "Norrtälje", "stockholms-lan/toyota-bz4x-touring-privatleasing-fran-6295-kr-man-2026-kombi-347758", "24 aug", 0, "Kombi"),
      BW("Toyota", "bZ4X Touring", "bZ4X Touring", "bz4xt", "El", 6295, 1500, "Biltrean Toyota Åkersberga nya bilar", "Åkersberga", "stockholms-lan/toyota-bz4x-touring-privatleasing-fran-6295-kr-man-2026-kombi-345430", "21 aug", 0, "Kombi"),
      BW("Volkswagen", "Golf", "Golf", "golf", "Bensin", 2895, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-golf-privatleasing-kampanj-2027-halvkombi-409510", "7 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I", "golf", "Bensin", 2950, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-golf-i-privatleasing-life-edition-2-950kr-man-deal-2026-kombi-352819", "27 aug", 0, "Kombi"),
      BW("Volkswagen", "Golf", "Golf I GTI", "golf", "Bensin", 2795, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-golf-i-gti-2-0-tsi-265hk-privatleasing-2027-halvkombi-418057", "10 okt", 10000, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I Life", "golf", "Bensin", 3195, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-golf-i-life-edition-tsi-150-hk-privatleasing-2026-halvkombi-417766", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I eTSI", "golf", "Hybrid", 3295, 0, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-golf-i-etsi-150hk-dsg-privatleasing-2026-halvkombi-231960", "15 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf", "golf", "Bensin", 3295, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-golf-privatleasing-lojalitet-fran-3295kr-man-inkl-service-2026-halvkombi-157745", "22 maj", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I Life", "golf", "Bensin", 3495, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-golf-i-life-edition-etsi-150-dsg-privatleasing-2027-halvkombi-415248", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I", "golf", "Bensin", 3495, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-golf-i-privatleasing-fran-3495kr-manaden-inkl-service-2026-halvkombi-157744", "22 maj", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf Edition eTSI", "golf", "Bensin", 3575, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-golf-edition-etsi-dsg-privatleasing-2027-kombi-409487", "7 okt", 0, "Kombi"),
      BW("Volkswagen", "Golf", "Golf Edition eTSI", "golf", "Hybrid", 3575, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-golf-edition-etsi-dsg-privatleasing-2027-kombi-409498", "7 okt", 0, "Kombi"),
      BW("Volkswagen", "Golf", "Golf I eTSI", "golf", "Bensin", 3695, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-golf-i-etsi-dsg-150-hk-privatleasing-omgaende-leverans-2026-halvkombi-418033", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I GTI", "golf", "Bensin", 3995, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-golf-i-gti-2-0-tsi-265hk-privatleasing-fr-3995-2026-halvkombi-418095", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I GTI", "golf", "Bensin", 3895, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-golf-i-gti-2-0-tsi-265hk-privatleasing-2027-halvkombi-418108", "10 okt", 10000, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf I GTI", "golf", "Bensin", 4295, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-golf-i-gti-clubsport-300hk-performance-privatleasing-fr-4295kr-2025-halvkombi-246722", "26 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Golf", "Golf R-Line 2.0", "golf", "Bensin", 4795, 1000, "Aftén Bil VW Nybil Arlandastad", "Arlandastad", "stockholms-lan/volkswagen-golf-r-line-2-0-204-hk-4m-privatleasing-2026-kombi-273613", "26 jun", 0, "Kombi"),
      BW("Volkswagen", "Golf Sportscombi", "Golf I SC", "golfsc", "Bensin", 3995, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-golf-i-sc-life-etsi-150-hk-dsg-privatleasing-2026-kombi-418083", "10 okt", 0, "Kombi"),
      BW("Volkswagen", "Golf Sportscombi", "Golf I Sportscombi", "golfsc", "Bensin", 3995, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-golf-i-sportscombi-etsi-150hk-dsg-edition-privatleasing-2027-kombi-407372", "5 okt", 0, "Kombi"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Life", "id3", "El", 3895, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-3-neo-life-58-kwh-privatleasing-2027-halvkombi-417824", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Neo", "id3", "El", 3995, 1000, "Din Bil / Volkswagen Hammarby", "Stockholm", "stockholms-lan/volkswagen-id-3-neo-neo-trend-50kwh-privatleasing-kampanj-2027-halvkombi-416680", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Neo", "id3", "El", 3995, 0, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-3-neo-neo-trend-privatleasing-fr-3995-2027-halvkombi-415359", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Trend", "id3", "El", 3995, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-id-3-trend-kampanj-privatleasing-2027-halvkombi-413889", "9 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Life", "id3", "El", 3995, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-3-life-kampanj-privatleasing-2027-halvkombi-409491", "7 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo TREND", "id3", "El", 3995, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-id-3-neo-trend-privatleasing-fran-3995kr-man-2027-halvkombi-218086", "4 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Trend", "id3", "El", 3995, 1000, "Din Bil / Volkswagen Täby", "Täby", "stockholms-lan/volkswagen-id-3-neo-trend-50-kwh-batteri-privatleasing-fr-3995-kr-man-2027-halvkombi-179010", "4 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Neo", "id3", "El", 4125, 1000, "Aftén Bil VW Nybil Arlandastad", "Arlandastad", "stockholms-lan/volkswagen-id-3-neo-neo-life-privatleasing-fr-3-675-kr-man-2027-halvkombi-273547", "26 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo NEO", "id3", "El", 4150, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-id-3-neo-neo-life-privatleasing-fr-4-150-kr-man-kampanj-2027-halvkombi-427571", "14 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Life", "id3", "El", 4195, 0, "Din Bil / Volkswagen Trelleborg", "Trelleborg", "skane-lan/volkswagen-id-3-neo-life-58kwh-492km-rackvidd-privatleasing-fr-4195-2027-halvkombi-433726", "19 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Neo", "id3", "El", 4195, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-3-neo-neo-life-58-kwh-privatleasing-2027-halvkombi-417827", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Neo", "id3", "El", 4195, 0, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-3-neo-neo-life-privatleasing-fr-4195-2027-halvkombi-415354", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Neo", "id3", "El", 4195, 1000, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-id-3-neo-neo-life-58kwh-privatleasing-2027-halvkombi-366940", "7 sep", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo LIFE", "id3", "El", 4195, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-id-3-neo-life-privatleasing-fran-4195kr-man-2027-halvkombi-222769", "8 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.3", "ID.3 Neo Neo", "id3", "El", 4195, 0, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-id-3-neo-neo-58kwh-life-privatleasing-sommarkampanj-2027-halvkombi-217933", "4 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.4", "ID.4 GTX SWE", "id4", "El", 5195, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-4-gtx-swe-edition-privatleasing-2027-suv-432584", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.4", "ID.4 GTX", "id4", "El", 5045, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-4-gtx-kampanj-privatleasing-2027-suv-439058", "22 okt", 15000, "SUV"),
      BW("Volkswagen", "ID.4", "ID.4 GTX SWE", "id4", "El", 5495, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-id-4-gtx-swe-edition-4motion-privatleasing-2027-suv-443687", "26 okt", 0, "SUV"),
      BW("Volkswagen", "ID.4", "ID.4 GTX", "id4", "El", 5495, 1000, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-id-4-gtx-privatleasing-fran-5495kr-man-inkl-service-2027-suv-441059", "23 okt", 0, "SUV"),
      BW("Volkswagen", "ID.4", "ID.4 GTX", "id4", "El", 5495, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-4-gtx-kampanj-privatleasing-2027-suv-439059", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.4", "ID.4 GTX GTX", "id4", "El", 5495, 0, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-4-gtx-gtx-privatleasing-fran-5495-run-out-kampanj-2027-suv-432667", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.7", "ID.7 Pro S", "id7", "El", 6495, 1000, "Din Bil / Volkswagen Trelleborg", "Trelleborg", "skane-lan/volkswagen-id-7-pro-s-swe-edition-86kwh-286hk-privatleasing-fr-6495-2027-sedan-433727", "19 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7", "ID.7 Pro S", "id7", "El", 6495, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-7-pro-s-privatleasing-2027-sedan-415311", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7", "ID.7 Pro S", "id7", "El", 6495, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/volkswagen-id-7-pro-s-swe-edition-86kwh-286hk-677km-privatleasing-2027-sedan-404107", "2 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7", "ID.7 PRO S", "id7", "El", 6495, 1000, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-id-7-pro-s-privatleasing-6495kr-man-inkl-service-2027-sedan-400256", "30 sep", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7", "ID.7", "id7", "El", 7995, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-7-kampanj-privatleasing-2027-sedan-439057", "22 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7", "ID.7 GTX Edition", "id7", "El", 7995, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/volkswagen-id-7-gtx-edition-4m-86kwh-286hk-597km-privatleasing-2027-sedan-404105", "2 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer PRO", "id7t", "El", 5295, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-7-tourer-pro-s-swe-edition-privatleasing-2027-sedan-417776", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer PRO", "id7t", "El", 6495, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-7-tourer-pro-s-swe-edition-privatleasing-2027-sedan-417873", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer Pro", "id7t", "El", 6495, 1000, "Din Bil / Volkswagen Hammarby", "Stockholm", "stockholms-lan/volkswagen-id-7-tourer-pro-s-swe-edition-privatleasing-kampanj-2027-sedan-416671", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer Pro", "id7t", "El", 6495, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-7-tourer-pro-s-edition-privatleasing-2027-sedan-415312", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer Pro", "id7t", "El", 6495, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-7-tourer-pro-s-swe-edition-privatleasing-2027-sedan-407375", "5 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer GTX", "id7t", "El", 7995, 0, "Din Bil / Volkswagen Smista", "Segeltorp", "stockholms-lan/volkswagen-id-7-tourer-gtx-privatleasing-fr-7540-man-ink-serviceavtal-2027-sedan-434857", "19 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer PRO", "id7t", "El", 7995, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-7-tourer-pro-gtx-swe-edition-privatleasing-2027-sedan-417871", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer GTX", "id7t", "El", 7995, 0, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-7-tourer-gtx-privatleasing-2027-sedan-415310", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 GTX Tourer", "id7t", "El", 7995, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-7-gtx-tourer-privatleasing-kampanj-fr-7-995kr-man-2027-sedan-407377", "5 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.7 Tourer", "ID.7 Tourer GTX", "id7t", "El", 7995, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/volkswagen-id-7-tourer-gtx-edition-4m-86kwh-340hk-597km-privatleasing-2027-sedan-404104", "2 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend Privtaleasing", "idcross", "El", 2545, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-cross-trend-privtaleasing-2027-suv-439056", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend 37 kWh", "idcross", "El", 2995, 0, "Din Bil / Volkswagen Täby", "Täby", "stockholms-lan/volkswagen-id-cross-trend-37-kwh-batteri-privatleasing-fr-2995-kr-man-2027-suv-442873", "26 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend Privtaleasing", "idcross", "El", 2995, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-cross-trend-privtaleasing-2027-suv-439055", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross", "idcross", "El", 2995, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-id-cross-privatleasing-fran-2995-kr-manaden-2027-suv-439004", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend 37 kWh", "idcross", "El", 2995, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-cross-trend-37-kwh-116hk-privatleasing-fr-2995kr-man-2027-suv-436405", "20 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend 37kWh", "idcross", "El", 2995, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-id-cross-trend-37kwh-privatleasing-2027-suv-436465", "20 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend", "idcross", "El", 2995, 0, "AB Norrbil", "Norrtälje", "stockholms-lan/volkswagen-id-cross-trend-privatleasing-fran-2995kr-man-2027-suv-435313", "20 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend", "idcross", "El", 2995, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-id-cross-trend-privatleasing-2027-suv-434691", "19 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend 37 kWh", "idcross", "El", 2995, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-cross-trend-37-kwh-batteri-116-hk-privatleasing-2027-suv-432663", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Trend 37 kWh", "idcross", "El", 2995, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-cross-trend-37-kwh-116-hk-privatleasing-2027-suv-432578", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Life 52kWh", "idcross", "El", 3695, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-id-cross-life-52kwh-211hk-privatleasing-2027-suv-457352", "5 nov", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Life 52kWh", "idcross", "El", 3695, 1000, "Atteviks Bil AB - Ljungby", "Ljungby", "kronobergs-lan/volkswagen-id-cross-life-52kwh-211hk-stora-batteriet-privatleasing-2027-suv-452587", "3 nov", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross", "idcross", "El", 3695, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/volkswagen-id-cross-kampanjmodell-life-52kwh-211hk-427km-privatleasing-2027-halvkombi-447619", "29 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Life 37 kWh", "idcross", "El", 3695, 0, "Din Bil / Volkswagen Täby", "Täby", "stockholms-lan/volkswagen-id-cross-life-37-kwh-batteri-privatleasing-fr-3695-kr-man-2027-suv-442874", "26 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Life 37 kWh", "idcross", "El", 3695, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-cross-life-37-kwh-135hk-privatleasing-fr-3695-kr-man-2027-suv-433203", "17 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Life 37 kWh", "idcross", "El", 3695, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-cross-life-37-kwh-batteri-135-hk-privatleasing-2027-suv-432662", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Cross", "ID. Cross Life 52 kWh", "idcross", "El", 4195, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-cross-life-52-kwh-batteri-211-hk-privatleasing-2027-suv-440145", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Polo", "ID. Polo Life 37kWh", "idpolo", "El", 3495, 0, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-id-polo-life-37kwh-privatleasing-2027-halvkombi-434689", "19 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo Life", "idpolo", "El", 3495, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-polo-life-privatleasing-fr-3495kr-man-2027-halvkombi-425294", "12 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo Life", "idpolo", "El", 3495, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-polo-life-privatleasing-2027-halvkombi-415309", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo", "idpolo", "El", 3495, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-id-polo-kampanj-privatleasing-2027-halvkombi-413886", "9 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo", "idpolo", "El", 3495, 0, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-polo-privatleasing-kampanj-fran-3-495kr-man-2027-halvkombi-412426", "8 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo Life 116hk", "idpolo", "El", 3495, 0, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-polo-life-116hk-37kwh-privatleasing-2027-halvkombi-405001", "2 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo Life 116hk", "idpolo", "El", 3495, 0, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-id-polo-life-116hk-37kwh-privatleasing-2027-halvkombi-403095", "1 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo", "idpolo", "El", 3495, 0, "Toveks Bil Varberg", "Åskloster", "hallands-lan/volkswagen-id-polo-fr-3495-kr-man-privatleasing-erbjudande-2027-halvkombi-402607", "1 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo", "idpolo", "El", 3495, 1000, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-id-polo-privatleasing-fran-3495kr-man-inklusive-service-2027-halvkombi-400257", "30 sep", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo LIFE 116HK", "idpolo", "El", 3495, 0, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-id-polo-life-116hk-elbil-privatleasing-2027-halvkombi-366933", "7 sep", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo", "idpolo", "El", 3495, 0, "Din Bil / Volkswagen Smista", "Segeltorp", "stockholms-lan/volkswagen-id-polo-privatleasing-fr-3045-man-life-37-kwh-batteri-116-hk-2027-halvkombi-360412", "2 sep", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Polo", "ID. Polo Life 37 kWh", "idpolo", "El", 3495, 0, "Toveks Bil Varberg", "Åskloster", "hallands-lan/volkswagen-id-polo-life-37-kwh-privatleasing-fran-3495-2027-halvkombi-308911", "25 jul", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 58kWh", "idtiguan", "El", 5545, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-life-58kwh-kampanj-privatleasing-2027-suv-439046", "22 okt", 15000, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan LIFE 58 KWH", "idtiguan", "El", 5995, 0, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-id-tiguan-life-58-kwh-privatleasing-2027-suv-439317", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 58 kWh", "idtiguan", "El", 5995, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-life-58-kwh-kampanj-privatleasing-2027-suv-439053", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 58kWh", "idtiguan", "El", 5995, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-tiguan-life-58kwh-190hk-privatleasing-2027-suv-432668", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 58kWh", "idtiguan", "El", 5995, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-tiguan-life-58kwh-batteri-190hk-privatleasing-2027-suv-432582", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 58 kWh", "idtiguan", "El", 5995, 0, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-id-tiguan-life-58-kwh-190hk-privatleasing-fr-5995-kr-man-2027-suv-427207", "13 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 77kWh", "idtiguan", "El", 5845, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-life-77kwh-kampanj-privatleasing-2027-suv-439049", "22 okt", 15000, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan LIFE 77 KWH", "idtiguan", "El", 6295, 0, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-id-tiguan-life-77-kwh-privatleasing-2027-suv-439318", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 77kWh", "idtiguan", "El", 6295, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-life-77kwh-kampanj-privatleasing-2027-suv-439047", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "Tiguan ID Life", "idtiguan", "El", 6295, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-tiguan-id-life-286hk-privatleasing-6295kr-man-2027-suv-434938", "20 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "Tiguan ID. Life", "idtiguan", "El", 6295, 0, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tiguan-id-life-77kwh-286-hk-privatleasing-2027-suv-434373", "19 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 77kWh", "idtiguan", "El", 6295, 0, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-id-tiguan-life-77kwh-286-hk-privatleasing-2027-suv-434375", "19 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 77kWh", "idtiguan", "El", 6295, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-tiguan-life-77kwh-286hk-privatleasing-2027-suv-432669", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 77 kWh", "idtiguan", "El", 6295, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-tiguan-life-77-kwh-batteri-286-hk-privatleasing-2027-suv-432585", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 4Motion", "idtiguan", "El", 6145, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-life-4motion-77-kwh-kampanj-privatleasing-2027-suv-439054", "22 okt", 15000, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 4Motion", "idtiguan", "El", 6595, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-life-4motion-77-kwh-kampanj-privatleasing-2027-suv-439051", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "Tiguan ID. Life", "idtiguan", "El", 6595, 0, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tiguan-id-life-4motion-77-kwh-299-hk-privatleasing-2027-suv-434374", "19 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 4M", "idtiguan", "El", 6595, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-tiguan-life-4m-77kwh-299hk-privatleasing-2027-suv-432664", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Life 4MOTION", "idtiguan", "El", 6595, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-tiguan-life-4motion-299hk-privatleasing-2027-suv-432581", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Style", "idtiguan", "El", 6345, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-style-kampanj-privatleasing-2027-suv-439050", "22 okt", 15000, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan STYLE 77 KWH", "idtiguan", "El", 6795, 0, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-id-tiguan-style-77-kwh-privatleasing-2027-suv-439319", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Style", "idtiguan", "El", 6795, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-style-kampanj-privatleasing-2027-suv-439048", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Style 77kWh", "idtiguan", "El", 6795, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-tiguan-style-77kwh-286hk-privatleasing-2027-suv-432666", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Style 77 kWh", "idtiguan", "El", 6795, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-id-tiguan-style-77-kwh-batteri-286hk-privatleasing-2027-suv-432583", "16 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Style 4Motion", "idtiguan", "El", 6545, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-style-4motion-kampanj-privatleasing-2027-suv-439052", "22 okt", 15000, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Style 4Motion", "idtiguan", "El", 6995, 0, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-id-tiguan-style-4motion-kampanj-privatleasing-2027-suv-439045", "22 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "Tiguan ID. Style", "idtiguan", "El", 6995, 0, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tiguan-id-style-4motion-77-kwh-batteri-299-hk-privatleasing-2027-suv-434378", "19 okt", 0, "SUV"),
      BW("Volkswagen", "ID.Tiguan", "ID. Tiguan Style 4Motion", "idtiguan", "El", 6995, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-id-tiguan-style-4motion-77kwh-299hk-privatleasing-2027-suv-432665", "16 okt", 0, "SUV"),
      BW("Volkswagen", "Passat", "Passat R-Line SWE", "passat", "Laddhybrid", 4299, 0, "Din Bil / Volkswagen Kista", "Kista", "stockholms-lan/volkswagen-passat-r-line-swe-edition-ehybrid-privatleasing-kampanj-2027-kombi-404416", "2 okt", 4299, "Kombi"),
      BW("Volkswagen", "Passat", "Passat R-Line SWE", "passat", "Laddhybrid", 4495, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-passat-r-line-swe-edition-bilia-kampanj-privatleasing-2027-kombi-424461", "12 okt", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat R-Line SWE", "passat", "Laddhybrid", 4495, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-passat-r-line-swe-edition-kampanj-privatleasing-2027-kombi-409484", "7 okt", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat R-Line SWE", "passat", "Hybrid", 4495, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-passat-r-line-swe-edition-kampanj-privatleasing-2027-kombi-409485", "7 okt", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat eHybrid 272hk", "passat", "Laddhybrid", 4595, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-passat-ehybrid-272hk-r-line-privatleasing-fr-4595kr-2027-kombi-365712", "5 sep", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat Hybrid 272hk", "passat", "Laddhybrid", 4595, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-passat-hybrid-272hk-rline-privatleasing-fr4595kr-2027-kombi-246661", "26 jun", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat eHybrid 272hk", "passat", "Laddhybrid", 4669, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-passat-ehybrid-272hk-r-line-privatleasing-4595kr-2027-kombi-246688", "26 jun", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat eHybrid R-Line", "passat", "Laddhybrid", 4795, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-passat-ehybrid-r-line-swe-edition-privatleasing-2027-kombi-392461", "23 sep", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat Business eHybrid", "passat", "Laddhybrid", 4995, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-passat-business-ehybrid-272hk-privatleasing-fr-4995-kr-man-2027-kombi-427201", "13 okt", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat eHybrid 272hk", "passat", "Laddhybrid", 4995, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-passat-ehybrid-272hk-r-line-privatleasing-4595kr-2026-kombi-246704", "26 jun", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat eHybrid R-Line", "passat", "Laddhybrid", 5295, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-passat-ehybrid-r-line-swe-edition-privatleasing-2027-kombi-407376", "5 okt", 0, "Kombi"),
      BW("Volkswagen", "Passat", "Passat eHybrid SWE", "passat", "Laddhybrid", 5295, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-passat-ehybrid-swe-edition-privatleasing-fran-5295kr-man-2026-kombi-157746", "22 maj", 0, "Kombi"),
      BW("Volkswagen", "Polo", "Polo 0 KR", "polo", "Bensin", 2295, 1000, "Aftén Bil VW Nybil Arlandastad", "Arlandastad", "stockholms-lan/volkswagen-polo-0-kr-insats-swe-edition-privatleasing-fr-2-295-kr-man-2027-halvkombi-280222", "1 jul", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo TSI 115hk", "polo", "Bensin", 2395, 0, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-polo-tsi-115hk-dsg-privatleasing-2027-halvkombi-338467", "17 aug", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo 1.0 TSI", "polo", "Bensin", 2395, 0, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-polo-1-0-tsi-115hk-dsg-privatleasing-fr-2395kr-man-2027-halvkombi-231869", "15 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo", "polo", "Bensin", 2499, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-polo-bilia-kampanj-privatleasing-2027-halvkombi-424463", "12 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo", "polo", "Bensin", 2499, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-polo-kampanj-privatleasing-2027-halvkombi-409515", "7 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo", "polo", "Bensin", 2574, 1000, "AB Norrbil", "Norrtälje", "stockholms-lan/volkswagen-polo-privatleasing-fran-2574kr-man-2027-halvkombi-435311", "20 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo Life SWE", "polo", "Bensin", 2595, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-polo-life-swe-edition-1-0-tsi-115-hk-dsg-privatleasing-2027-halvkombi-417927", "10 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo SUPERDEAL* SWE", "polo", "Bensin", 2695, 1000, "Aftén Bil VW Nybil Arlandastad", "Arlandastad", "stockholms-lan/volkswagen-polo-superdeal-swe-edition-privatleasing-fr-2-395-kr-man-2027-halvkombi-437417", "21 okt", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo", "polo", "Bensin", 2995, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-polo-privatleasing-fran-2995-kr-manaden-2027-halvkombi-226036", "10 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "Polo", "Polo Life SWE", "polo", "Bensin", 2995, 1000, "Bilkompani Kalmar", "Kalmar", "kalmar-lan/volkswagen-polo-life-swe-edition-1-0-tsi-116hk-aut-privatleasing-2027-halvkombi-178541", "4 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "T-Cross", "T-Cross SUPER", null, "Bensin", 2823, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-t-cross-super-privatleasing-erbjudande-2823kr-man-2026-halvkombi-246658", "26 jun", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "T-Cross", "T-Cross 1.0 TSI", null, "Bensin", 3295, 1000, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-t-cross-1-0-tsi-95hk-superkampanj-privatleasing-2026-halvkombi-366964", "7 sep", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "T-Cross", "T-Cross", null, "Bensin", 3295, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-t-cross-privatleasing-fran3295kr-man-inklusive-service-2027-halvkombi-166791", "28 maj", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "T-Cross", "T-Cross LIFE 1.0", null, "Bensin", 3295, 1000, "Toveks Bil Varberg", "Åskloster", "hallands-lan/volkswagen-t-cross-life-1-0-tsi-95hk-privatleasing-3295kr-man-2026-halvkombi-153251", "20 maj", 0, "Halvkombi/sedan"),
      BW("Volkswagen", "T-Roc", "T-Roc", "troc", "Bensin", 2895, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-t-roc-kampanj-privatleasing-2027-suv-409507", "7 okt", 0, "SUV"),
      BW("Volkswagen", "T-Roc", "T-Roc NYA eTSi", "troc", "Bensin", 3095, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-t-roc-nya-etsi-privatleasing-fr-3095kr-erbjudande-2027-suv-425719", "13 okt", 0, "SUV"),
      BW("Volkswagen", "T-Roc", "T-Roc 150 hk", "troc", "Bensin", 3195, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-t-roc-150-hk-privatleasing-fr-3195-kr-man-2026-suv-408937", "6 okt", 0, "SUV"),
      BW("Volkswagen", "T-Roc", "T-Roc Life 1.5", "troc", "Bensin", 3195, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-t-roc-life-1-5-tsi-150-hk-7-vxl-dsg-privatleasing-2026-suv-231858", "15 jun", 0, "SUV"),
      BW("Volkswagen", "T-Roc", "T-Roc NYA", "troc", "Bensin", 2995, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-t-roc-nya-privatleasing-2026-suv-417793", "10 okt", 10000, "SUV"),
      BW("Volkswagen", "T-Roc", "T-Roc NYA eTSI", "troc", "Bensin", 3295, 1000, "Börjessons Karlskrona", "Karlskrona", "blekinge-lan/volkswagen-t-roc-nya-etsi-150hk-dsg-privatleasing-2026-suv-421420", "10 okt", 0, "SUV"),
      BW("Volkswagen", "T-Roc", "T-Roc NYA", "troc", "Bensin", 3295, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-t-roc-nya-privatleasing-0kr-kontantinsats-2027-suv-417796", "10 okt", 0, "SUV"),
      BW("Volkswagen", "T-Roc", "T-Roc 1.5 eTSI", "troc", "Bensin", 3295, 0, "Din Bil / Volkswagen Täby", "Täby", "stockholms-lan/volkswagen-t-roc-1-5-etsi-privatleasing-fr-3295kr-man-2026-suv-224234", "9 jun", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo", "taigo", "Bensin", 2695, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-taigo-bilia-kampanj-privatleasing-2027-suv-424459", "12 okt", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo", "taigo", "Bensin", 2695, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-taigo-kampanj-privatleasing-2027-suv-409514", "7 okt", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo R-line Edition", "taigo", "Bensin", 2995, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-taigo-r-line-edition-privatleasing-0kr-kontant-2026-suv-417801", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo R-Line Edition", "taigo", "Bensin", 2995, 1000, "Din Bil / Volkswagen Hammarby", "Stockholm", "stockholms-lan/volkswagen-taigo-r-line-edition-1-0tsi-116hk-dsg-privatleasing-kampanj-2027-suv-416672", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo 1.0 TSI", "taigo", "Bensin", 2995, 0, "Din Bil / Volkswagen Täby", "Täby", "stockholms-lan/volkswagen-taigo-1-0-tsi-r-line-edition-privatleasing-fr-2995-kr-man-2026-suv-224229", "9 jun", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo R-Line Black", "taigo", "Bensin", 3195, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-taigo-r-line-black-edition-116-hk-7-vxl-dsg-privatleasing-2026-suv-418054", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo R-Line Edition", "taigo", "Bensin", 3295, 1000, "Din Bil / Volkswagen Sisjön", "Askim", "vastra-gotalands-lan/volkswagen-taigo-r-line-edition-116-hk-dsg-privatleasing-2027-suv-429574", "15 okt", 0, "SUV"),
      BW("Volkswagen", "Taigo", "Taigo R-Line TSI", "taigo", "Bensin", 3295, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-taigo-r-line-tsi-115hk-edition-privatleasing-2027-suv-231790", "15 jun", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron 1.5 TSI", "tayron", "Bensin", 2895, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-tayron-1-5-tsi-edition-privatleasing-fr-2-895kr-man-passa-pa-2027-suv-460028", "9 nov", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron 1.5 TSI", "tayron", "Bensin", 3495, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-tayron-1-5-tsi-edition-privatleasing-fr-3-195kr-man-2027-suv-460602", "9 nov", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron Life Edition", "tayron", "Bensin", 3495, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-tayron-life-edition-kampanj-privatleasing-2027-suv-444978", "27 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron", "tayron", "Bensin", 3495, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tayron-bilia-kampanj-privatleasing-2027-suv-424472", "12 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron 1.5 TSI", "tayron", "Hybrid", 3495, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-tayron-1-5-tsi-edition-privatleasing-fr-3-195kr-man-2027-suv-390910", "23 sep", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron", "tayron", "Bensin", 3495, 1000, "Aftén Bil VW Nybil Arlandastad", "Arlandastad", "stockholms-lan/volkswagen-tayron-privatleasing-fr-3-495-kr-man-hostkampanj-2026-suv-347478", "23 aug", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron eTSI 150Hk", "tayron", "Bensin", 3795, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tayron-etsi-150hk-7-sits-dsg-privatleasing-2027-suv-418062", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron eTSI 150H", "tayron", "Bensin", 3795, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tayron-etsi-150h-7-sits-dsg-privatleasing-0-kr-kontantinsats-2026-suv-417968", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron Life Edition", "tayron", "Bensin", 3795, 0, "Toveks Bil Varberg", "Åskloster", "hallands-lan/volkswagen-tayron-life-edition-etsi-150hk-dsg-privatleasing-3795kr-man-2026-suv-153247", "20 maj", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron 150HK eTSI", "tayron", "Bensin", 3795, 1000, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-tayron-150hk-etsi-dsg-7-sits-privatleasing-2026-suv-366950", "7 sep", 4395, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron Life eTSI", "tayron", "Bensin", 3995, 1000, "AB Norrbil", "Norrtälje", "stockholms-lan/volkswagen-tayron-life-etsi-150-dsg-7-sits-privatleasing-fr-3995kr-man-2027-suv-435314", "20 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron eTSI 150hk", "tayron", "Bensin", 3995, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-tayron-etsi-150hk-life-edition-privatleasing-3995kr-man-2027-suv-231807", "15 jun", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron", "tayron", "Bensin", 3995, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-tayron-privatleasing-7-sits-3995kr-man-inkl-serviceavtal-2027-suv-224739", "9 jun", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-Line SWE", "tayron", "Bensin", 4150, 1000, "Din Bil / Volkswagen Kista", "Kista", "stockholms-lan/volkswagen-tayron-r-line-swe-edition-ehybrid-privatleasing-kampanj-2026-suv-230114", "12 jun", 4150, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-Line SWE", "tayron", "Hybrid", 4454, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tayron-r-line-swe-edition-privatleasing-0kr-kontantinsats-2027-suv-417839", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-line SWE", "tayron", "Hybrid", 4595, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-tayron-r-line-swe-edition-kampanj-privatleasing-2027-suv-444979", "27 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-line SWE", "tayron", "Hybrid", 4595, 0, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tayron-r-line-swe-edition-bilia-kampanj-privatleasing-2027-suv-424470", "12 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-line SWE", "tayron", "Laddhybrid", 4595, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-tayron-r-line-swe-edition-kampanj-privatleasing-2027-suv-409495", "7 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron eHybrid R-Line", "tayron", "El", 4695, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-tayron-ehybrid-r-line-swe-edt-privatleasing-host-deal-4695kr-2027-suv-455457", "4 nov", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-Line SWE", "tayron", "Hybrid", 4695, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tayron-r-line-swe-privatleasing-0kr-forsta-forhojd-avgift-2027-suv-417847", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron eHybrid R-Line", "tayron", "Laddhybrid", 4695, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-tayron-ehybrid-r-line-swe-edt-privatleasing-host-deal-4695kr-2027-suv-404660", "2 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron", "tayron", "Laddhybrid", 4795, 1000, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-tayron-superkampanj-privatleasing-4795kr-man-2027-suv-466435", "13 nov", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron SUPERKMAPANJ", "tayron", "Laddhybrid", 4795, 1000, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-tayron-superkmapanj-privatleasing-4795kr-man-2027-suv-466434", "13 nov", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-Line SWE", "tayron", "Hybrid", 5295, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tayron-r-line-swe-edition-privatleasing-2026-suv-417965", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-line eHybrid", "tayron", "Laddhybrid", 5295, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-tayron-r-line-ehybrid-swe-edition-privatleasing-5295-kr-man-2027-suv-231810", "15 jun", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron", "tayron", "El", 5295, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-tayron-privatleasing-5295kr-man-e-hybrid-r-line-2027-suv-227393", "10 jun", 0, "SUV"),
      BW("Volkswagen", "Tayron", "Tayron R-Line SWE", "tayron", "Laddhybrid", 5295, 0, "Toveks Bil Varberg", "Åskloster", "hallands-lan/volkswagen-tayron-r-line-swe-edition-ehybrid-privatleasing-5295kr-man-2026-suv-153250", "20 maj", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 2750, 1000, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-tiguan-privatleasing-2750-kr-man-inkl-service-life-etsi-2027-suv-437400", "21 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 2949, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-superkampanj-privatleasing-2027-suv-417800", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 2995, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tiguan-kampanj-privatleasing-2027-suv-413892", "9 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan eTSI 150hk", "tiguan", "Bensin", 3195, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-etsi-150hk-privatleasing-2027-suv-417829", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 3195, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tiguan-kampanj-privatleasing-2027-suv-413893", "9 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan Life Edition", "tiguan", "Bensin", 3195, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-tiguan-life-edition-1-5-etsi-150hk-dsg-kampanj-privatleasing-2027-suv-409504", "7 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan Life Edition", "tiguan", "Bensin", 3195, 1000, "Bilab Kungälv", "Kungälv", "vastra-gotalands-lan/volkswagen-tiguan-life-edition-1-5-etsi-160hk-dsg-privatleasing-2027-suv-332315", "13 aug", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan eTSI 150hk", "tiguan", "Bensin", 3254, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-etsi-150hk-privatleasing-2027-suv-417788", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 3350, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-tiguan-privatleasing-3350kr-man-erbjudande-2027-suv-407645", "6 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 3350, 1000, "Aftén Bil VW Nybil Arlandastad", "Arlandastad", "stockholms-lan/volkswagen-tiguan-privatleasing-fr-2-895-kr-man-superdeal-2026-suv-390411", "22 sep", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan T.O.M 30", "tiguan", "Bensin", 3350, 1000, "Aftén Bil VW Nybil Arlandastad", "Arlandastad", "stockholms-lan/volkswagen-tiguan-t-o-m-30-11-privatleasing-fr-2-895-kr-man-2027-suv-316719", "4 aug", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan eTSI 150hk", "tiguan", "Bensin", 3495, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-etsi-150hk-privatleasing-0kr-kontantinsats-2027-suv-417830", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan Life Edition", "tiguan", "Bensin", 3495, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-tiguan-life-edition-etsi-150hk-aut-privatleasing-fran-3-495kr-2027-suv-413970", "9 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan Edition eTSI", "tiguan", "Bensin", 3495, 1000, "Din Bil / Volkswagen Gävle", "Gävle", "gavleborgs-lan/volkswagen-tiguan-edition-etsi-150hk-din-bil-edition-privatleasing-2026-suv-366960", "7 sep", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 3495, 1000, "Aftén Bil VW Nybil Åkersberga", "Åkersberga", "stockholms-lan/volkswagen-tiguan-privatleasing-3495kr-man-erbjudande-drag-varmare-2027-suv-246679", "26 jun", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan Life Edition", "tiguan", "Bensin", 3495, 1000, "Atteviks Bil AB - Växjö", "Växjö", "kronobergs-lan/volkswagen-tiguan-life-edition-etsi-150hk-privatleasing-2026-suv-231792", "15 jun", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan Life Edition", "tiguan", "Bensin", 3795, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-tiguan-life-edition-etsi-150hk-aut-privatleasing-2027-suv-222687", "8 jun", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Bensin", 2995, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-superkampanj-privatleasing-2027-suv-417798", "10 okt", 40000, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-line SWE", "tiguan", "Hybrid", 4295, 1000, "Bilia Nyköping Volkswagen", "Nyköping", "sodermanlands-lan/volkswagen-tiguan-r-line-swe-edition-bilia-kampanj-privatleasing-2027-suv-413884", "9 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-line SWE", "tiguan", "Hybrid", 4295, 1000, "Bilia Haninge Volkswagen", "Handen", "stockholms-lan/volkswagen-tiguan-r-line-swe-edition-kampanj-privatleasing-2027-suv-409499", "7 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-Line SWE", "tiguan", "Laddhybrid", 4295, 1000, "Bilab Kungälv", "Kungälv", "vastra-gotalands-lan/volkswagen-tiguan-r-line-swe-edition-1-5-ehybrid-272hk-dsg-privatleasing-2027-suv-332348", "13 aug", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-LINE eHYBRID", "tiguan", "Laddhybrid", 4495, 0, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-r-line-ehybrid-272-hk-privatleasing-2027-suv-418081", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-Line", "tiguan", "Hybrid", 4495, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-r-line-privatleasing-0kr-kontant-2026-suv-417833", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-LINE SWE", "tiguan", "Hybrid", 4495, 1000, "Din Bil / Volkswagen Backa", "Hisings Backa", "vastra-gotalands-lan/volkswagen-tiguan-r-line-swe-ehybrid-272-hk-privatleasing-0kr-kontant-2026-suv-417838", "10 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan eHybrid R-Line", "tiguan", "Laddhybrid", 4795, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-tiguan-ehybrid-r-line-swe-edition-privatleasing-2027-suv-226162", "10 jun", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-Line eHybrid", "tiguan", "Laddhybrid", 4791, 1000, "Din Bil / Volkswagen Kista", "Kista", "stockholms-lan/volkswagen-tiguan-r-line-ehybrid-swe-edition-privatleasing-kampanj-2026-suv-230113", "12 jun", 3791, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan", "tiguan", "Hybrid", 4995, 1000, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-tiguan-privatleasing-4995kr-man-ehybrid-swe-edition-2027-suv-437399", "21 okt", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-Line eHybrid", "tiguan", "Laddhybrid", 4995, 1000, "Atteviks Bil AB - Jönköping", "Jönköping", "jonkopings-lan/volkswagen-tiguan-r-line-ehybrid-swe-edition-272hk-privatleasing-2027-suv-222689", "8 jun", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan R-Line HUD", "tiguan", "Hybrid", 4995, 0, "Motor Halland", "Halmstad", "hallands-lan/volkswagen-tiguan-r-line-hud-matrix-privatleasing-2026-suv-160162", "23 maj", 0, "SUV"),
      BW("Volkswagen", "Tiguan", "Tiguan eHybrid Swe", "tiguan", "Laddhybrid", 4995, 0, "Toveks Bil i Skee", "Skee", "vastra-gotalands-lan/volkswagen-tiguan-ehybrid-swe-edition-privatleasing-fran-4995kr-manaden-2027-suv-157747", "22 maj", 0, "SUV"),
      BW("Volvo", "EC40", "EC40 P5 RWD", "ec40", "El", 5590, 0, "Volvo Car Vallentuna", "Vallentuna", "stockholms-lan/volvo-ec40-p5-rwd-l-range-plus-se-privatleasing-2027-crossover-465813", "13 nov", 0, "SUV"),
      BW("Volvo", "EC40", "EC40 P5 RWD", "ec40", "El", 5598, 0, "Volvo Car Kungsängen", "Kungsängen", "stockholms-lan/volvo-ec40-p5-rwd-long-range-plus-se-privatleasing-5598-man-2027-crossover-465506", "13 nov", 0, "SUV"),
      BW("Volvo", "ES90", "ES90 SM Ext", null, "El", 9490, 1000, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-es90-sm-ext-range-ultra-privatleasing-9490kr-man-2026-sedan-397673", "28 sep", 0, "Halvkombi/sedan"),
      BW("Volvo", "EX30", "EX30", "ex30", "El", 3790, 0, "Volvo Car Enköping", "Enköping", "uppsala-lan/volvo-ex30-privatleasing-3790-man-2027-suv-449896", "30 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 RWD", "ex30", "El", 3790, 1000, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-ex30-p5-rwd-plus-privatleasing-3790kr-man-2027-suv-446353", "28 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 Long Range", "ex30", "El", 3790, 1000, "Volvo Car Kista", "Sollentuna", "stockholms-lan/volvo-ex30-p5-long-range-plus-privatleasing-3790-kr-man-2027-suv-350582", "25 aug", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 LR Plus", "ex30", "El", 3790, 1000, "Volvo Car Kista", "Sollentuna", "stockholms-lan/volvo-ex30-lr-plus-privatleasing-3-790kr-man-2027-suv-350583", "25 aug", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Long Range Plus", "ex30", "El", 3790, 1000, "Volvo Car Vallentuna", "Vallentuna", "stockholms-lan/volvo-ex30-long-range-plus-privatleasing-2027-suv-330082", "13 aug", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 LONG RANGE", "ex30", "El", 3890, 1000, "Volvo Car Kungsängen", "Kungsängen", "stockholms-lan/volvo-ex30-p5-long-range-plus-privatleasing-fr-3890kr-man-2027-suv-455543", "4 nov", 0, "SUV"),
      BW("Volvo", "EX30", "EX30", "ex30", "El", 3890, 0, "Volvo Car Enköping", "Enköping", "uppsala-lan/volvo-ex30-privatleasing-3890-man-2027-suv-449897", "30 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 RWD", "ex30", "El", 3890, 1000, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-ex30-p5-rwd-long-range-plus-privatleasing-3890kr-man-2027-suv-446354", "28 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Single Motor", "ex30", "El", 3895, 1000, "Bilia Västerås - Volvo", "Västerås", "vastmanlands-lan/volvo-ex30-single-motor-plus-privatleasing-fr-3895-man-2026-suv-421033", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30", "ex30", "El", 3990, 0, "Volvo Car Enköping", "Enköping", "uppsala-lan/volvo-ex30-privatleasing-3990-man-2027-suv-449898", "30 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Ext. Range", "ex30", "El", 3995, 1000, "Bilia Västerås - Volvo", "Västerås", "vastmanlands-lan/volvo-ex30-ext-range-plus-privatleasing-fr-3995-man-2026-suv-421028", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 Long Range", "ex30", "El", 3995, 1000, "Bilia Södertälje - Volvo", "Södertälje", "stockholms-lan/volvo-ex30-p5-long-range-privatleasing-3995-kr-man-2027-suv-330017", "13 aug", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 Plus", "ex30", "El", 4095, 1000, "Bilia Kungälv - Volvo", "Kungälv", "vastra-gotalands-lan/volvo-ex30-p5-plus-privatleasing-fr-4095-man-2027-suv-420559", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Single Motor", "ex30", "El", 4095, 1000, "Bilia Trelleborg - Volvo", "Trelleborg", "skane-lan/volvo-ex30-single-motor-plus-privatleasing-2027-suv-420237", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 Long Range", "ex30", "El", 4195, 1000, "Bilia Kungälv - Volvo", "Kungälv", "vastra-gotalands-lan/volvo-ex30-p5-long-range-plus-privatleasing-fr-4195-man-2027-suv-420605", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 EXT. Range", "ex30", "El", 4195, 1000, "Bilia Jägersro - Volvo", "Malmö", "skane-lan/volvo-ex30-ext-range-plus-privatleasing-2026-suv-418604", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Ext. Range", "ex30", "El", 4195, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-ex30-ext-range-plus-privatleasing-2027-suv-333379", "13 aug", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Single Motor", "ex30", "El", 4290, 1000, "Volvo Car Upplands Väsby", "Upplands Väsby", "stockholms-lan/volvo-ex30-single-motor-ext-range-ultra-privatleasing-4290-kr-man-2026-suv-415818", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Ultra", "ex30", "El", 4390, 1000, "Volvo Car Vallentuna", "Vallentuna", "stockholms-lan/volvo-ex30-ultra-privatleasing-2027-suv-330155", "13 aug", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Twin Motor", "ex30", "El", 4495, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-ex30-twin-motor-performance-plus-privatleasing-2027-suv-392906", "24 sep", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 P5 Long Range", "ex30", "El", 4995, 1000, "Bilia Kungälv - Volvo", "Kungälv", "vastra-gotalands-lan/volvo-ex30-p5-long-range-ultra-privatleasing-fr-4995-man-2027-suv-420602", "10 okt", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Ext. Range", "ex30", "El", 4995, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-ex30-ext-range-ultra-privatleasing-2027-suv-390485", "22 sep", 0, "SUV"),
      BW("Volvo", "EX30", "EX30 Twin Motor", "ex30", "El", 5295, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-ex30-twin-motor-performance-ultra-privatleasing-2027-suv-394109", "24 sep", 0, "SUV"),
      BW("Volvo", "EX30 Cross Country", "EX30 Cross Country", "ex30cc", "El", 4795, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-ex30-cross-country-twin-motor-plus-privatleasing-2027-suv-333374", "13 aug", 0, "SUV"),
      BW("Volvo", "EX40", "EX40 Ext Range", "ex40", "El", 4790, 1000, "Volvo Car Kungsängen", "Kungsängen", "stockholms-lan/volvo-ex40-ext-range-plus-se-privatleasing-4-790-kr-man-2027-suv-349255", "24 aug", 0, "SUV"),
      BW("Volvo", "EX40", "EX40 P5 Long Range", "ex40", "El", 4990, 1000, "Volvo Car Hisings Backa", "Hisings Backa", "vastra-gotalands-lan/volvo-ex40-p5-long-range-plus-se-privatleasing-kampanj-2027-suv-466645", "13 nov", 0, "SUV"),
      BW("Volvo", "EX40", "EX40 SM Extended Range", "ex40", "El", 4995, 1000, "Bilia Eskilstuna - Volvo", "Eskilstuna", "sodermanlands-lan/volvo-ex40-sm-extended-range-plus-se-privatleasing-fr-4995-man-2026-suv-420395", "10 okt", 0, "SUV"),
      BW("Volvo", "EX40", "EX40 Single M", "ex40", "El", 4995, 1000, "Bilia Haninge - Volvo", "Handen", "stockholms-lan/volvo-ex40-single-m-ext-plus-se-privatleasing-2027-suv-417057", "10 okt", 0, "SUV"),
      BW("Volvo", "EX40", "EX40 P5 RWD", "ex40", "El", 5391, 1000, "Bildeve AB, Helsingborg", "Helsingborg", "skane-lan/volvo-ex40-p5-rwd-l-range-plus-se-privatleasing-2027-suv-466094", "13 nov", 0, "SUV"),
      BW("Volvo", "EX60", "EX60 P10 AWD", "ex60", "El", 10462, 0, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-ex60-p10-awd-plus-privatleasing-10462kr-man-2027-suv-437881", "21 okt", 0, "SUV"),
      BW("Volvo", "EX60", "EX60 P12 AWD", "ex60", "El", 10495, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-ex60-p12-awd-plus-privatleasing-2027-suv-333228", "13 aug", 0, "SUV"),
      BW("Volvo", "EX60", "EX60 P10 AWD", "ex60", "El", 12001, 0, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-ex60-p10-awd-ultra-privatleasing-12001kr-man-2027-suv-437883", "21 okt", 0, "SUV"),
      BW("Volvo", "EX60", "EX60 P12 AWD", "ex60", "El", 12395, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-ex60-p12-awd-ultra-privatleasing-2027-suv-333184", "13 aug", 0, "SUV"),
      BW("Volvo", "XC60", "XC60 T6 Core", "xc60", "Laddhybrid", 7995, 0, "Bilia Nacka - Volvo", "Nacka", "stockholms-lan/volvo-xc60-t6-core-nordic-edition-privatleasing-7995-kr-man-2027-suv-414088", "10 okt", 0, "SUV"),
      BW("Volvo", "XC60", "XC60 T6 Core", "xc60", "Laddhybrid", 7997, 0, "Bilia Köping - Volvo", "Köping", "vastmanlands-lan/volvo-xc60-t6-core-nordic-edition-privatleasing-7997-kr-man-2027-suv-419048", "10 okt", 0, "SUV"),
      BW("Volvo", "XC60", "XC60", "xc60", "Bensin", 8990, 1000, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-xc60-helgerbjudande-privatleasing-fran-8-990-kr-man-2026-suv-399272", "29 sep", 0, "SUV"),
      BW("Volvo", "XC90", "XC90", "xc90", "Hybrid", 10200, 1000, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-xc90-privatleasing-10200-ink-vinterhjul-plus-dragkrok-2026-suv-375347", "11 sep", 0, "SUV"),
      BW("Volvo", "XC90", "XC90", "xc90", "Laddhybrid", 10200, 1500, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-xc90-privatleasing-10200-ink-vinterhjul-plus-dragkrok-2026-suv-375348", "11 sep", 0, "SUV"),
      BW("Volvo", "XC90", "XC90", "xc90", "Laddhybrid", 10990, 1500, "Volvo Car Enköping", "Enköping", "uppsala-lan/volvo-xc90-privatleasing-10990-ink-vinterhjul-plus-dragkrok-2026-suv-418038", "10 okt", 0, "SUV"),
      BW("Volvo", "XC90", "XC90", "xc90", "Laddhybrid", 10990, 1500, "Volvo Car Hammarby Sjöstad", "Stockholm", "stockholms-lan/volvo-xc90-privatleasing-10990-ink-vinterhjul-plus-dragkrok-2026-suv-375349", "11 sep", 0, "SUV"),
      BW("Volvo", "XC90", "XC90 Ultra", "xc90", "Hybrid", 12995, 1000, "Bilia Haga Norra - Volvo Nissan", "Solna", "stockholms-lan/volvo-xc90-ultra-privatleasing-care-by-2027-suv-333662", "13 aug", 0, "SUV"),
      BW("XPENG", "G6", "G6 RWD Standard Range", null, "El", 5995, 1000, "Olofsson Auto AB", "Norrköping", "ostergotlands-lan/xpeng-g6-rwd-standard-range-air-privatleasing-2026-suv-328608", "13 aug", 0, "SUV"),
      BW("XPENG", "L03", "L03 Standard Range", null, "El", 4995, 1000, "Olofsson Auto AB", "Norrköping", "ostergotlands-lan/xpeng-l03-standard-range-privatleasing-2026-suv-360280", "2 sep", 0, "SUV"),
      BW("XPENG", "L03", "L03 Long Rang", null, "El", 5795, 1000, "Olofsson Auto AB", "Norrköping", "ostergotlands-lan/xpeng-l03-long-rang-520-km-privatleasing-2026-suv-361458", "2 sep", 0, "SUV"),
      BW("XPENG", "L03", "L03 AWD Performance", null, "El", 6595, 1000, "Olofsson Auto AB", "Norrköping", "ostergotlands-lan/xpeng-l03-awd-performance-privatleasing-2026-suv-361457", "2 sep", 0, "SUV"),
      // --- BILWEB SLUT ---
      B("Volvo", "EX30 Single Motor Plus", "ex30", "El", 3795, 1000, 457000, { typ: "Märket", kalla: "Volvo Nationell Privatleasing (via Nybergs Bil)", url: "https://nybergsbil.se/kampanjer/volvo-ex30" }),
      B("Volvo", "EX30 Cross Country P5 Long Range Plus", "ex30cc", "El", 3990, 1000, 542000, { mer: {1500: 380, 2000: 839}, kalla: "Volvo Car Kungsängen", url: "https://bilweb.se/stockholms-lan/volvo-ex30-cross-country-plus-2027-suv-445689" }),
      B("Volvo", "EX40 Single Motor Extended Range Plus", "ex40", "El", 4790, 1000, 591000, { kalla: "Volvo Car Kista (Volvofinans)", url: "https://www.volvocarretail.se/bilar-i-lager/nya/volvo/ex40/single-motor-extended-range-b87144ea45ec4d118984580faf6be5f1", not: "Modellår 2027. Lagerbil, begränsat antal. Försäkring tillkommer", utr: ["Serviceavtal", "Volvo Assistans (36 mån)", "Privatleasingskydd i 3 månader"] }),
      B("Polestar", "4 coupé Rear Motor Business edition Pilot", "pol4", "El", 6995, 1500, 619000, { typ: "Märket", kalla: "Polestar Privatleasing", url: "https://www.polestar.com/se/offers/polestar-4-business-edition-private-lease", not: "Fast ränta, 0 kr förhöjd hyra. Leverans senast 31 dec 2026" }),
      // --- Škoda (märkets egna priser) ---
      // --- Kia (märkets egna priser) ---
      // --- VWFS START: Volkswagen, Škoda, Cupra och Audi från märkenas privatleasingsidor (genereras av verktyg/gen.py) ---
      B("Audi", "A5 e-hybrid quattro Proline Edition", "a5", "Laddhybrid", 5695, 1000, 579000, { ...AUDI, url: "https://privatleasing.audi.se/tillval/_a5_e-hybrid_quattro_proline_edition", cfg: "audi/_a5_e-hybrid_quattro_proline_edition", mer: {1500: 620, 2000: 1030} }),
      B("Audi", "A2 e-tron S line", null, "El", 5225, 1000, 531300, { ...AUDI, url: "https://privatleasing.audi.se/tillval/a2_e-tron_s-line", cfg: "audi/a2_e-tron_s-line", mer: {1500: 410, 2000: 570} }),
      B("Audi", "A5 Avant e-hybrid quattro Proline Edition", "a5avant", "Laddhybrid", 5695, 1000, 579000, { ...AUDI, url: "https://privatleasing.audi.se/tillval/a5_avant_e-hybrid_quattro_proline_edition", cfg: "audi/a5_avant_e-hybrid_quattro_proline_edition", mer: {1500: 620, 2000: 1030} }),
      B("Audi", "A5 Avant e-hybrid quattro S line Edition", "a5avant", "Laddhybrid", 6595, 1000, 609000, { ...AUDI, url: "https://privatleasing.audi.se/tillval/a5_avant_e-hybrid_quattro_s_line_edition_", cfg: "audi/a5_avant_e-hybrid_quattro_s_line_edition_", mer: {1500: 630, 2000: 1020} }),
      B("Audi", "A2 e-tron Proline", null, "El", 4995, 1000, 511300, { ...AUDI, url: "https://privatleasing.audi.se/tillval/nya_a2_e-tron", cfg: "audi/nya_a2_e-tron", mer: {1500: 420, 2000: 580} }),
      B("Audi", "A3 Sedan Proline", "a3sedan", "Bensin", 3795, 1000, 382800, { ...AUDI, url: "https://privatleasing.audi.se/tillval/nya_a3_sedan_proline", cfg: "audi/nya_a3_sedan_proline", mer: {1500: 380, 2000: 690} }),
      B("Audi", "A3 Sportback e-hybrid Proline", "a3", "Laddhybrid", 5145, 1000, 499800, { ...AUDI, url: "https://privatleasing.audi.se/tillval/nya_a3_sportback_e-hybrid_proline", cfg: "audi/nya_a3_sportback_e-hybrid_proline", mer: {1500: 480, 2000: 830} }),
      B("Audi", "A3 Sportback Proline", "a3", "Bensin", 3695, 1000, 372100, { ...AUDI, url: "https://privatleasing.audi.se/tillval/nya_a3_sportback_proline", cfg: "audi/nya_a3_sportback_proline", mer: {1500: 370, 2000: 680} }),
      B("Audi", "Q4 e-tron performance Proline", "q4", "El", 5795, 1000, 640000, { ...AUDI, url: "https://privatleasing.audi.se/tillval/nya_q4_e-tron_performance_proline", cfg: "audi/nya_q4_e-tron_performance_proline", mer: {1500: 540, 2000: 745} }),
      B("Audi", "Q4 e-tron quattro Proline Edition", "q4", "El", 5995, 1000, 619000, { ...AUDI, url: "https://privatleasing.audi.se/tillval/nya_q4_e-tron_quattro_proline_edition", cfg: "audi/nya_q4_e-tron_quattro_proline_edition", mer: {1500: 560, 2000: 770} }),
      B("Audi", "Q6 e-tron Proline Edition", "q6", "El", 7995, 1000, 669900, { ...AUDI, url: "https://privatleasing.audi.se/tillval/q6_e-tron_proline_edition", cfg: "audi/q6_e-tron_proline_edition", mer: {1500: 590, 2000: 810} }),
      B("Cupra", "Formentor eTSI 150hk DSG", "formentor", "Bensin", 2995, 1000, 434900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_formentor_etsi_150hk_dsg", cfg: "cupraofficial/cupra_formentor_etsi_150hk_dsg", mer: {1500: 470, 2000: 660} }),
      B("Cupra", "Formentor Swedish Edition e-HYBRID", "formentor", "Laddhybrid", 4945, 1000, 469900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_formentor_swe_edition_e-hybrid", cfg: "cupraofficial/cupra_formentor_swe_edition_e-hybrid", mer: {1500: 580, 2000: 795} }),
      B("Cupra", "Leon eTSI 150hk DSG", "leon", "Bensin", 4095, 1000, 402900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_leon_etsi_150hk_dsg", cfg: "cupraofficial/cupra_leon_etsi_150hk_dsg", mer: {1500: 480, 2000: 660} }),
      B("Cupra", "Leon Sportstourer eTSI 150hk DSG", "cupraleon", "Bensin", 3595, 1000, 413900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_leon_sportstourer_etsi_150hk_dsg", cfg: "cupraofficial/cupra_leon_sportstourer_etsi_150hk_dsg", mer: {1500: 490, 2000: 675} }),
      B("Cupra", "Leon Sportstourer Swedish Edition e-HYBRID", "cupraleon", "Laddhybrid", 4495, 1000, 429900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_leon_sportstourer_swe_edition_e-hybrid", cfg: "cupraofficial/cupra_leon_sportstourer_swe_edition_e-hybrid", mer: {1500: 530, 2000: 730} }),
      B("Cupra", "Tavascan Drive Swedish Edition", "tavascan", "El", 4695, 1000, 554900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_tavascan_drive_swe_ed", cfg: "cupraofficial/cupra_tavascan_drive_swe_ed", mer: {1500: 520, 2000: 715} }),
      B("Cupra", "Tavascan VZ Swedish Edition", "tavascan", "El", 5195, 1000, 599900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_tavascan_vz", cfg: "cupraofficial/cupra_tavascan_vz", mer: {1500: 620, 2000: 850} }),
      B("Cupra", "Terramar eTSI 150hk DSG", "terramar", "Bensin", 2995, 1000, 444900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_terramar_etsi_150hk_dsg", cfg: "cupraofficial/cupra_terramar_etsi_150hk_dsg", mer: {1500: 480, 2000: 670} }),
      B("Cupra", "Terramar Swedish Edition e-HYBRID", "terramar", "Laddhybrid", 5495, 1000, 519900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_terramar_swe_edition_e-hybrid", cfg: "cupraofficial/cupra_terramar_swe_edition_e-hybrid", mer: {1500: 610, 2000: 840} }),
      B("Cupra", "Terramar Swedish Edition TSI 204hk DSG 4Drive", "terramar", "Bensin", 5395, 1000, 499900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/cupra_terramar_swe_edition_tsi_204hk_dsg_4drive", cfg: "cupraofficial/cupra_terramar_swe_edition_tsi_204hk_dsg_4drive", mer: {1500: 580, 2000: 795} }),
      B("Cupra", "Born 58 kWh", "born", "El", 4095, 1000, 466900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/nya_cupra_born_58_kwh", cfg: "cupraofficial/nya_cupra_born_58_kwh", mer: {1500: 400, 2000: 545} }),
      B("Cupra", "Raval Endurance", "raval", "El", 3495, 1000, 425900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/nya_cupra_raval____", cfg: "cupraofficial/nya_cupra_raval____", mer: {1500: 365, 2000: 495} }),
      B("Cupra", "Raval Plus", "raval", "El", 3295, 1000, 368900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/nya_cupra_raval_plus____", cfg: "cupraofficial/nya_cupra_raval_plus____", mer: {1500: 315, 2000: 430} }),
      B("Cupra", "Raval VZ", "raval", "El", 4395, 1000, 457900, { ...CUPRA, url: "https://privatleasing.cupraofficial.se/tillval/nya_cupra_raval_vz", cfg: "cupraofficial/nya_cupra_raval_vz", mer: {1500: 390, 2000: 535} }),
      B("Skoda", "Fabia Monte Carlo Explore", "fabia", "Bensin", 2995, 1000, 279000, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/fabia_monte_carlo_explore", cfg: "skoda/fabia_monte_carlo_explore", mer: {1500: 265, 2000: 540} }),
      B("Skoda", "Kamiq Selection Explore", "kamiq", "Bensin", 2815, 1000, 289000, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/kamiq_130_edition", cfg: "skoda/kamiq_130_edition", mer: {1500: 295, 2000: 580} }),
      B("Skoda", "Karoq Selection Explore", "karoq", "Bensin", 3030, 1000, 356500, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/karoq_selection-2", cfg: "skoda/karoq_selection-2", mer: {1500: 360, 2000: 660} }),
      B("Skoda", "Karoq Sportline Explore", "karoq", "Bensin", 3325, 1000, 388900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/karoq_sportline_", cfg: "skoda/karoq_sportline_", mer: {1500: 390, 2000: 700} }),
      B("Skoda", "Kodiaq Sportline Explore Edition iV", "kodiaq", "Laddhybrid", 5645, 1000, 539400, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/kodiaq_sportline_iv_130_edition", cfg: "skoda/kodiaq_sportline_iv_130_edition", mer: {1500: 520, 2000: 880} }),
      B("Skoda", "Elroq 60", "elroq", "El", 3995, 1000, 484500, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_elroq_60_", cfg: "skoda/nya_elroq_60_", mer: {1500: 430, 2000: 590} }),
      B("Skoda", "Enyaq 85 Selection Solid Edition", "enyaq", "El", 4995, 1000, 598965, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_enyaq_85_solid_edition", cfg: "skoda/nya_enyaq_85_solid_edition", mer: {1500: 515, 2000: 710} }),
      B("Skoda", "Enyaq Coupé RS Solid Edition", "enyaqc", "El", 5995, 1000, 705900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_enyaq_coupe_rs_solid_edition", cfg: "skoda/nya_enyaq_coupe_rs_solid_edition", mer: {1500: 605, 2000: 835} }),
      B("Skoda", "Epiq 35 Essence", "epiq", "El", 2795, 1000, 315900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_epiq_35_essence", cfg: "skoda/nya_epiq_35_essence", mer: {1500: 285, 2000: 390} }),
      B("Skoda", "Epiq 55 Essence", "epiq", "El", 3295, 1000, 384900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_epiq_55_essence", cfg: "skoda/nya_epiq_55_essence", mer: {1500: 340, 2000: 470} }),
      B("Skoda", "Kodiaq Selection Explore", "kodiaq", "Bensin", 4395, 1000, 399900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_kodiaq", cfg: "skoda/nya_kodiaq", mer: {1500: 400, 2000: 715} }),
      B("Skoda", "Kodiaq Selection Explore Edition iV", "kodiaq", "Laddhybrid", 5280, 1000, 506400, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_kodiaq_iv", cfg: "skoda/nya_kodiaq_iv", mer: {1500: 490, 2000: 840} }),
      B("Skoda", "Kodiaq RS Explore", "kodiaq", "Bensin", 6345, 1000, 564900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_kodiaq_rs", cfg: "skoda/nya_kodiaq_rs", mer: {1500: 530, 2000: 895} }),
      B("Skoda", "Octavia Combi Selection", "octaviac", "Bensin", 2945, 1000, 353000, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_octavia", cfg: "skoda/nya_octavia", mer: {1500: 345, 2000: 650} }),
      B("Skoda", "Octavia Combi Sportline", "octaviac", "Bensin", 3845, 1000, 449000, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_octavia_sportline", cfg: "skoda/nya_octavia_sportline", mer: {1500: 425, 2000: 755} }),
      B("Skoda", "Superb Combi Selection Explore", "superb", "Bensin", 5225, 1000, 462900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/nya_superb_", cfg: "skoda/nya_superb_", mer: {1500: 435, 2000: 765} }),
      B("Skoda", "Peaq Selection Explore Edition", "peaq", "El", 6945, 1000, 654899, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/peaq_selection_explore_edition", cfg: "skoda/peaq_selection_explore_edition", mer: {1500: 595, 2000: 815} }),
      B("Skoda", "Peaq Sportline Explore Edition", "peaq", "El", 7795, 1000, 713500, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/peaq_sportline_explore_edition", cfg: "skoda/peaq_sportline_explore_edition", mer: {1500: 640, 2000: 880} }),
      B("Skoda", "Superb Combi L&K Explore", "superb", "Bensin", 6495, 1000, 560900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/superb_combi_l_k", cfg: "skoda/superb_combi_l_k", mer: {1500: 500, 2000: 860} }),
      B("Skoda", "Superb Combi L&K Explore Edition iV", "superb", "Laddhybrid", 5395, 1000, 522900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/superb_combi_l_k_iv", cfg: "skoda/superb_combi_l_k_iv", mer: {1500: 535, 2000: 905} }),
      B("Skoda", "Superb Combi Selection Explore Edition iV", "superb", "Laddhybrid", 4995, 1000, 477900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/superb_combi_selection_iv", cfg: "skoda/superb_combi_selection_iv", mer: {1500: 495, 2000: 850} }),
      B("Skoda", "Superb Combi Sportline Explore Edition iV", "superb", "Laddhybrid", 5200, 1000, 507900, { ...SKODA, url: "https://privatleasing.skoda.se/tillval/superb_combi_sportline_130_edition_iv", cfg: "skoda/superb_combi_sportline_130_edition_iv", mer: {1500: 535, 2000: 900} }),
      B("Volkswagen", "Golf Life Edition", "golf", "Bensin", 3495, 1000, 337200, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/golf_life_edition", cfg: "volkswagen/golf_life_edition", mer: {1500: 305, 2000: 585} }),
      B("Volkswagen", "Golf Sportscombi Life Edition", "golfsc", "Bensin", 3995, 1000, 370200, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/golf_sportscombi_life_edition", cfg: "volkswagen/golf_sportscombi_life_edition", mer: {1500: 335, 2000: 625} }),
      B("Volkswagen", "ID.3 Neo Life", "id3", "El", 4195, 1000, 481900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_3_neo_life", cfg: "volkswagen/id_3_neo_life", mer: {1500: 410, 2000: 560} }),
      B("Volkswagen", "ID.3 Neo Trend", "id3", "El", 3995, 1000, 409900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_3_neo_trend", cfg: "volkswagen/id_3_neo_trend", mer: {1500: 345, 2000: 475} }),
      B("Volkswagen", "ID.4 GTX SWE Edition", "id4", "El", 5495, 1000, 620900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_4_gtx_swe_edition", cfg: "volkswagen/id_4_gtx_swe_edition", mer: {1500: 580, 2000: 800} }),
      B("Volkswagen", "ID.7 GTX Edition", "id7", "El", 7995, 1000, 674900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_7_gtx_edition", cfg: "volkswagen/id_7_gtx_edition", mer: {1500: 615, 2000: 840} }),
      B("Volkswagen", "ID.7 Pro S SWE Edition", "id7", "El", 6495, 1000, 595900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_7_pro_s_edition", cfg: "volkswagen/id_7_pro_s_edition", mer: {1500: 580, 2000: 800} }),
      B("Volkswagen", "ID.7 Tourer GTX Edition", "id7t", "El", 7995, 1000, 679900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_7_tourer_gtx_edition", cfg: "volkswagen/id_7_tourer_gtx_edition", mer: {1500: 615, 2000: 845} }),
      B("Volkswagen", "ID.7 Tourer Pro S SWE Edition", "id7t", "El", 6495, 1000, 605900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_7_tourer_pro_s_edition", cfg: "volkswagen/id_7_tourer_pro_s_edition", mer: {1500: 585, 2000: 805} }),
      B("Volkswagen", "ID.Cross Life", "idcross", "El", 3695, 1000, 411900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_cross_life", cfg: "volkswagen/id_cross_life", mer: {1500: 385, 2000: 680} }),
      B("Volkswagen", "ID.Cross Trend", "idcross", "El", 2995, 1000, 356900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_cross_trend", cfg: "volkswagen/id_cross_trend", mer: {1500: 340, 2000: 615} }),
      B("Volkswagen", "ID.Polo GTI", "idpolo", "El", 5195, 1000, 484900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_polo_gti_", cfg: "volkswagen/id_polo_gti_", mer: {1500: 445, 2000: 765} }),
      B("Volkswagen", "ID.Tiguan Life 58 kWh", "idtiguan", "El", 5995, 1000, 564800, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_tiguan_life", cfg: "volkswagen/id_tiguan_life", mer: {1500: 475, 2000: 655} }),
      B("Volkswagen", "ID.Tiguan Life 77 kWh", "idtiguan", "El", 6295, 1000, 593800, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_tiguan_life_77", cfg: "volkswagen/id_tiguan_life_77", mer: {1500: 500, 2000: 685} }),
      B("Volkswagen", "ID.Tiguan Style 77 kWh", "idtiguan", "El", 6795, 1000, 611800, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/id_tiguan_style", cfg: "volkswagen/id_tiguan_style", mer: {1500: 515, 2000: 710} }),
      B("Volkswagen", "ID.Polo Life", "idpolo", "El", 3495, 1000, 373900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/nya_id_polo_life", cfg: "volkswagen/nya_id_polo_life", mer: {1500: 355, 2000: 640} }),
      B("Volkswagen", "ID.Polo Style", "idpolo", "El", 4295, 1000, 387900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/nya_id_polo_style", cfg: "volkswagen/nya_id_polo_style", mer: {1500: 385, 2000: 680} }),
      B("Volkswagen", "T-roc Life", "troc", "Bensin", 3495, 1000, 395900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/nya_t-roc_life", cfg: "volkswagen/nya_t-roc_life", mer: {1500: 360, 2000: 660} }),
      B("Volkswagen", "Passat Business Limited Edition eHybrid", "passat", "Laddhybrid", 4995, 1000, 505900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/passat_business_lim_ed_ehybrid", cfg: "volkswagen/passat_business_lim_ed_ehybrid", mer: {1500: 515, 2000: 875} }),
      B("Volkswagen", "Passat R-Line SWE Edition eHybrid", "passat", "Laddhybrid", 5295, 1000, 552900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/passat_r-line_swe_edition_ehybrid", cfg: "volkswagen/passat_r-line_swe_edition_ehybrid", mer: {1500: 555, 2000: 925} }),
      B("Volkswagen", "Polo Life SWE Edition", "polo", "Bensin", 2995, 1000, 306900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/polo_life_swe_edition", cfg: "volkswagen/polo_life_swe_edition", mer: {1500: 290, 2000: 570} }),
      B("Volkswagen", "Taigo R-Line Edition", "taigo", "Bensin", 3295, 1000, 325900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/taigo_r-line_edition", cfg: "volkswagen/taigo_r-line_edition", mer: {1500: 285, 2000: 565} }),
      B("Volkswagen", "Tayron Life Edition", "tayron", "Bensin", 3995, 1000, 457900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/tayron_life_edition", cfg: "volkswagen/tayron_life_edition", mer: {1500: 380, 2000: 705} }),
      B("Volkswagen", "Tayron R-line SWE Edition", "tayron", "Bensin", 5295, 1000, 623400, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/tayron_r-line_swe_edition", cfg: "volkswagen/tayron_r-line_swe_edition", mer: {1500: 570, 2000: 965} }),
      B("Volkswagen", "Tiguan Life Edition", "tiguan", "Bensin", 3795, 1000, 420200, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/tiguan_life_edition", cfg: "volkswagen/tiguan_life_edition", mer: {1500: 350, 2000: 665} }),
      B("Volkswagen", "Tiguan R-Line SWE Edition eHybrid", "tiguan", "Laddhybrid", 4995, 1000, 595900, { ...VW, url: "https://privatleasing.volkswagen.se/tillval/tiguan_r-line_swe_edition_ehybrid_", cfg: "volkswagen/tiguan_r-line_swe_edition_ehybrid_", mer: {1500: 560, 2000: 950} }),
      // --- VWFS SLUT ---
      B("Kia", "Picanto 1.0 GDI AMT Action", "picanto", "Bensin", 3145, 1000, 208500, { ...KIA, mer: {1500: 107, 2000: 357}, url: KU("picanto") }),
      B("Kia", "Stonic 1.0 T-GDi Action", "stonic", "Bensin", 3295, 1000, 266900, { ...KIA, mer: {1500: 175, 2000: 520}, url: KU("stonic") }),
      B("Kia", "K4 Sportswagon 1.0 T-GDi Action (manuell)", "k4sw", "Bensin", 3595, 1000, 312000, { ...KIA, mer: {1500: 160, 2000: 399}, url: KU("k4") }),
      B("Kia", "Seltos 1.6 T-GDi Action", "seltos", "Bensin", 3795, 1000, 332600, { ...KIA, mer: {1500: 170, 2000: 421}, url: KU("seltos") }),
      B("Kia", "Seltos Hybrid Action", "seltos", "Hybrid", 3995, 1000, 374400, { ...KIA, mer: {1500: 287, 2000: 559}, url: KU("seltos") }),
      B("Kia", "EV4 GT Line Long Range", "ev4", "El", 6195, 1000, 623400, { ...KIA, mer: {1500: 319, 2000: 798}, url: KU("ev4") }),
      B("Kia", "EV5 Long Range", "ev5", "El", 6495, 1000, 553900, { ...KIA, url: KU("ev5"), mer: {1500: 284, 2000: 567} }),
      B("Kia", "Sorento Plug-in Hybrid AWD Action", "sorento", "Laddhybrid", 7845, 1000, 619900, { ...KIA, mer: {1500: 317, 2000: 801}, url: KU("sorento-plug-in-hybrid") }),
      B("Kia", "Sportage Plug-in Hybrid AWD Advance", "sportage", "Laddhybrid", 4695, 1000, 508900, { ...HEDIN, url: HA + "228511/pc-nc-kia-sportage-2027" }),
      // --- Mercedes-Benz (märkets egna priser, 1 500 mil/år) ---
      B("Mercedes-Benz", "GLA 250+ electric Advanced Edition", null, "El", 5495, 1500, 559000, MB),
      B("Mercedes-Benz", "CLA 250+ electric Advanced Edition", "cla", "El", 5995, 1500, 599000, MB),
      B("Mercedes-Benz", "CLA 250+ Shooting Brake electric", "clasb", "El", 6295, 1500, 615000, MB),
      B("Mercedes-Benz", "GLB 250+ electric Advanced Edition", "glb", "El", 6495, 1500, 619000, MB),
      B("Mercedes-Benz", "C 300 4MATIC electric Advanced Edition", null, "El", 6995, 1500, 649000, MB),
      B("Mercedes-Benz", "GLC 300 4MATIC electric Advanced Edition", "glc", "El", 7995, 1500, 719000, MB),
      B("Mercedes-Benz", "Mercedes-AMG CLA 45 4MATIC+ electric", "cla", "El", 9595, 1500, 799000, MB),
      B("Mercedes-Benz", "E 300 e Sedan", "eclass", "Laddhybrid", 6795, 1500, 634000, { ...MB, kalla: "Hedin Automotive (Mercedes-Benz Finans)", typ: "Återförsäljare", url: HA + "47407/pc-sc-mercedes-benz-e-class" }),
      // --- Tesla ---
      B("Tesla", "Model 3 bakhjulsdrift", "m3", "El", 4795, 1000, 449900, { ...TESLA, url: "https://www.tesla.com/sv_SE/model3/design" }),
      B("Tesla", "Model 3 Long Range", "m3", "El", 5495, 1000, 539900, { ...TESLA, url: "https://www.tesla.com/sv_SE/model3/design" }),
      B("Tesla", "Model Y bakhjulsdrift", "my", "El", 4595, 1000, 499900, { ...TESLA, url: "https://www.tesla.com/sv_SE/modely/design" }),
      B("Tesla", "Model Y Long Range", "my", "El", 5495, 1000, 612900, { ...TESLA, url: "https://www.tesla.com/sv_SE/modely/design" }),
      B("Tesla", "Model Y Long Range AWD", "my", "El", 5995, 1000, 649900, { ...TESLA, url: "https://www.tesla.com/sv_SE/modely/design" }),
      // --- Volvo, fler modeller ---
      B("Volvo", "EC40 Single Motor Core SE", "ec40", "El", 5195, 1000, 529900, { typ: "Märket", kalla: "Volvo Nationell Privatleasing (via Nybergs Bil)", url: "https://nybergsbil.se/kampanjer/volvo-ec40" }),
      B("Volvo", "XC60 T6 Plus", "xc60", "Laddhybrid", 7995, 1000, 599900, { ...LEASABIL, url: LB + "Volvo/Volvo-XC60-Plus" }),
      B("Volvo", "V60 T6 Plus Dark Nordic Edition", "v60", "Laddhybrid", 7595, 1000, 542900, { kalla: "Volvo Car Hisings Backa (Volvofinans)", url: "https://www.volvocarretail.se/bilar-i-lager/nya/volvo/v60/bf247c793d344dd38df67cf0a40ff31d", not: "Modellår 2026. Lagerbil, begränsat antal. Försäkring tillkommer", utr: ["Serviceavtal", "Volvo Assistans (36 mån)", "Privatleasingskydd i 3 månader"] }),
      B("Volvo", "EX60 P6 Plus", "ex60", "El", 8995, 1000, 689000, { kalla: "Volvo Car Hammarby Sjöstad via Wayke", url: "https://www.wayke.se/objekt/170a712b-5743-4b66-9e23-bb33b98d7edd" }),
      B("Volvo", "XC90 T8 AWD Ultra Dark", "xc90", "Laddhybrid", 10900, 1000, 1050200, { kalla: "Volvo Car Hisings Backa (Volvofinans)", url: "https://www.volvocarretail.se/bilar-i-lager/nya/volvo/xc90/recharge-t8-awd-01a0aaa83f127b4a9ea8344ce2d7b075", not: "Modellår 2027. Lagerbil, begränsat antal. Annonsen anger 1 000 mil/år men handlarens kampanjtext 1 500 mil/år och vinterhjul – fråga handlaren. Försäkring tillkommer" }),
      B("Cupra", "Formentor eTSI 150 DSG", "formentor", "Bensin", 2495, 1000, 324500, { forhojd: 10000, kalla: "Lecab", url: "https://lecab.se/erbjudande/cupra-formentor-10/", not: "Gäller ett begränsat antal lagerbilar i färgen Fiord Blue. Metalliclack +300 kr/mån. Nybeställd bil 3 295 kr/mån" }),
      B("Seat", "Ibiza Edition 1.0 MPI 80 hk", "ibiza", "Bensin", 2695, 1000, 229900, { forhojd: 10000, kalla: "Bilia", url: "https://www.bilia.se/bilar/seat/" }),
      B("Audi", "A3 Sportback 35 TFSI S tronic Proline", "a3", "Bensin", 2795, 1000, 359900, { service: false, kalla: "Din Bil", url: "https://dinbil.se/audi/erbjudanden/privatleasing-audi-a3-sportback", start: 495, not: "Serviceavtal från 100 kr/mån tillkommer. Finansiering via VW Finans: aviavgift 59 kr/mån vid pappersfaktura, e-faktura gratis. Erbjudandet gäller t.o.m. 31 dec 2026" }),
      B("BMW", "120", "bmw120", "Bensin", 3690, 1000, 392400, { start: 595, adm: 55, kalla: "Hedin Automotive", url: HA + "246889/pc-nc-bmw-120-2026" }),
      B("BMW", "iX2 xDrive30 Active Edition", "ix2", "El", 6895, 1000, 569900, { typ: "Märket", start: 595, adm: 55, kalla: "BMW", url: "https://hitta.bmw.se/leasing/58a78c30-ae30-46d2-8bc8-89887262abdd/5977fbc3-ac12-42c0-a5bd-974161bea67c?offerType=0" }),
      B("Kia", "EV2 Standard Range", "ev2", "El", 3495, 1500, 324800, { ...HEDIN, url: HA + "226224/pc-nc-kia-ev2-2027" }),
      B("Kia", "EV3 Long Range", "ev3", "El", 4495, 1000, 508300, { typ: "Märket", start: 592, adm: 59, mer: {1500: 262, 2000: 655}, kalla: "Kia", url: "https://www.kia.com/se/nya-bilar/ev3/upptack/" }),
      B("Hyundai", "i20 1.0 T-GDi Essential (manuell)", "i20", "Bensin", 2395, 1000, 242900, { ...HEDIN, url: HA + "245702/pc-nc-hyundai-i20-2026", adm: 60 }),
      B("Hyundai", "Bayon 1.0 T-GDi Essential (manuell)", "bayon", "Bensin", 2595, 1000, 264900, { ...HEDIN, url: HA + "246041/pc-nc-hyundai-bayon-2026", adm: 60 }),
      B("Hyundai", "Kona Hybrid Essential", "kona", "Hybrid", 3395, 1000, 375400, { ...HEDIN, url: HA + "246649/pc-nc-hyundai-kona-2026", adm: 60 }),
      B("Hyundai", "Tucson Hybrid 4WD Essential", "tucson", "Hybrid", 3995, 1000, 427900, { typ: "Märket", start: 995, adm: 59, kalla: "Hyundai", url: "https://lager.hyundai.se/model/TUCSON%20Hybrid/JFW5D5G1GEV1KK0BB?ext=SAW&int=NNB&customer=private" }),
      B("Hyundai", "Tucson Plug-in Hybrid 2WD", "tucson", "Laddhybrid", 4075, 1000, 424900, { ...HEDIN, url: HA + "237738/pc-nc-hyundai-tucson-2027", adm: 60 }),
      B("Toyota", "Aygo X Hybrid", "aygox", "Hybrid", 2995, 1500, 238900, { ...TOYOTA, cfg: "toyota/ax" }),
      B("Toyota", "Yaris Hybrid", "yaris", "Hybrid", 2995, 1500, 254900, { ...TOYOTA, cfg: "toyota/ya" }),
      B("Toyota", "Yaris Cross Hybrid", "yariscross", "Hybrid", 3195, 1500, 294900, { ...TOYOTA, cfg: "toyota/yb" }),
      B("Toyota", "Corolla Touring Sports Hybrid", "corollats", "Hybrid", 3395, 1500, 334900, { ...TOYOTA, cfg: "toyota/corolla-ts" }),
      B("Toyota", "C-HR Hybrid", "chr", "Hybrid", 3595, 1500, 350900, { ...TOYOTA, cfg: "toyota/c-hr" }),
      B("Toyota", "RAV4 Hybrid AWD-i", "rav4", "Hybrid", 6295, 1500, 459900, { ...TOYOTA, cfg: "toyota/ra" }),
      B("Toyota", "bZ4X", "bz4x", "El", 5895, 1500, 479900, { ...TOYOTA, cfg: "toyota/de" }),
      B("Toyota", "C-HR+", null, "El", 5795, 1500, 519900, { ...TOYOTA, cfg: "toyota/cb" }),
      B("Toyota", "bZ4X Touring", "bz4xt", "El", 6295, 1500, 569900, { ...TOYOTA, cfg: "toyota/bz" }),
      B("Toyota", "Corolla Hybrid 5-dörrar", null, "Hybrid", 3995, 1500, 324900, { ...TOYOTA, cfg: "toyota/corolla-hb" }),
      B("Toyota", "Corolla Cross Hybrid", "corollacross", "Hybrid", 4595, 1500, 361900, { ...TOYOTA, cfg: "toyota/cx" }),
      B("Nissan", "Juke DIG-T DCT Acenta", "juke", "Bensin", 2995, 1000, 300600, { ...HEDIN, url: HA + "187699/pc-nc-nissan-juke-2025" }),
      B("Nissan", "Micra 40 kWh Engage", "micra", "El", 3995, 1000, 369000, { ...HEDIN, url: HA + "200410/pc-nc-nissan-micra-2026" }),
      B("Nissan", "Qashqai Acenta", "qashqai", "Bensin", 2995, 1000, 321750, { ...HEDIN, url: HA + "236359/pc-nc-nissan-qashqai-2026" }),
      B("Renault", "5 E-Tech Evolution EV40", "r5", "El", 3490, 1000, 364900, { ...HEDIN, url: HA + "233165/pc-nc-renault-5-2026" }),
      B("Dacia", "Sandero Essential TCe 100", "sandero", "Bensin", 1990, 1000, 199900, { ...HEDIN, adm: 60, url: HA + "44281/pc-sc-dacia-sandero" }),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2699, 1000, 349900, PEUGEOT),
      B("Peugeot", "3008 GT Hybrid", "p3008", "Hybrid", 3199, 1000, 354900, { ...PEUGEOT, mer: {1500: 200, 2000: 400} }),
      B("Peugeot", "5008 GT Hybrid", "p5008", "Hybrid", 3399, 1000, 394900, PEUGEOT),
      B("Peugeot", "e-2008 GT", "pe2008", "El", 3899, 1000, 369900, PEUGEOT),
      B("MG", "MG4 Urban", "mg4", "El", 2995, 1000, 307900, { ...HEDIN, adm: 60, url: HA + "234893/pc-nc-mg-4-ev-urban-2026", not: "15 000 kr att ladda för hos Hedin ingår" }),
      B("BYD", "Seal 6 DM-i Touring Comfort", "seal6", "Laddhybrid", 4511, 1000, 482800, { kalla: "Hedin Automotive (Arval)", url: HA + "214169/pc-nc-byd-seal-6-dm-i-touring-2025" }),
      B("Mazda", "6e Takumi", "mazda6e", "El", 8530, 1000, 464600, { kalla: "Nybergs Bil", url: "https://nybergsbil.se/kampanjer/mazda-6e" })
    ];

    // Utrustning som ingår i priset (utr), tillval med pris i kr/mån (tv) – från respektive erbjudandesida
    const UTRUSTNING = {
     "EX30 Cross Country P5 Long Range Plus": {
      "utr": [
       "Adaptiv farthållare",
       "Apple CarPlay",
       "Automatisk nödbromsning",
       "Backkamera",
       "DAB-radio",
       "Elbaklucka",
       "Laddkabel (typ 2)",
       "Premiumljudsystem",
       "Rattvärme",
       "Regnsensor",
       "Trådlös laddning",
       "2-zons klimatanläggning",
       "Uppvärmda framsäten",
       "ISOFIX"
      ]
     },
     "Picanto 1.0 GDI AMT Action": {
      "utr": [
       "8\" navigationssystem",
       "Apple CarPlay & Android Auto",
       "Bluetooth",
       "Backkamera",
       "Elfönsterhissar fram & bak",
       "Parkeringssensor bak",
       "Läderklädd ratt",
       "Skyltavläsning",
       "Farthållare",
       "Nyckelfritt dörrlås",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)"
      ]
     },
     "Stonic 1.0 T-GDi Action": {
      "utr": [
       "12,3\" pekskärm med navigation, Apple CarPlay & Android Auto",
       "16\" aluminiumfälgar",
       "Autobroms med fotgängar- och cyklistskydd",
       "Backkamera",
       "Bluetooth med röststyrning",
       "LED-varselljus",
       "Parkeringssensorer fram och bak",
       "Läderklädd ratt",
       "Takreling",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)"
      ]
     },
     "K4 Sportswagon 1.0 T-GDi Action (manuell)": {
      "utr": [
       "16\" aluminiumfälgar",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)"
      ],
      "utrnot": "Kia har inte publicerat hela utrustningslistan för K4 Action"
     },
     "Seltos 1.6 T-GDi Action": {
      "utr": [
       "12,3\" pekskärm och 12,3\" digital instrumentering",
       "Apple CarPlay & Android Auto",
       "16\" aluminiumfälgar",
       "Backkamera",
       "Dödavinkelvarning",
       "LED-strålkastare",
       "Nyckelfritt system med startknapp",
       "Parkeringssensorer fram och bak",
       "Läderklädd ratt",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)"
      ]
     },
     "Seltos Hybrid Action": {
      "utr": [
       "Samma Action-utrustning som Seltos 1.6 T-GDi Action",
       "Hybriddrivlina med DCT-växellåda",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)"
      ]
     },
     "EV4 GT Line Long Range": {
      "utr": [
       "GT Line-design ute och inne",
       "Head-up display",
       "Harman Kardon ljudsystem",
       "Digital Key",
       "Ventilerade framstolar, Relaxation-säten",
       "Förarstol med minne",
       "Elmanövrerad passagerarstol",
       "Sollucka",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)",
       "Värmepump"
      ]
     },
     "EV5 Long Range": {
      "utr": [
       "18\" aluminiumfälgar",
       "2 × 12,3\" skärmar med navigation och DAB",
       "Apple CarPlay & Android Auto",
       "Adaptiv farthållare med stop & go",
       "2-zons klimatanläggning",
       "Backkamera",
       "Dödavinkelassistans",
       "Nyckelfritt system",
       "Parkeringssensorer fram och bak",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)",
       "Värmepump"
      ]
     },
     "Sorento Plug-in Hybrid AWD Action": {
      "utr": [
       "19\" aluminiumfälgar",
       "Adaptiv farthållare med stop & go",
       "2-zons klimatanläggning",
       "LED-strålkastare",
       "12,3\" pekskärm med navigation, DAB och backkamera",
       "Nyckelfritt system",
       "Parkeringssensorer fram och bak",
       "Filhållnings- och filkörningsassistans",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)"
      ]
     },
     "Sportage Plug-in Hybrid AWD Advance": {
      "utr": [
       "Adaptiv farthållare",
       "Apple CarPlay & Android Auto",
       "Autobroms",
       "Backkamera",
       "Digital instrumentering",
       "Dödavinkelvarning",
       "Eluppvärmda framstolar och ytterplatser bak",
       "Filhållnings- och filföljningsassistans",
       "LED-strålkastare",
       "Nyckelfritt system",
       "Parkeringssensorer fram och bak",
       "Navigation på pekskärm",
       "Rattvärme",
       "Trådlös mobilladdning",
       "Metalliclack"
      ]
     },
     "E 300 e Sedan": {
      "utr": [
       "14,4\" MBUX-medieskärm",
       "Digital instrumentpanel",
       "Trådlös mobilladdning",
       "MULTIBEAM LED-strålkastare",
       "Mörktonade rutor bak",
       "Aktiv kurshållningsassistent",
       "Aktiv bromsassistent",
       "Dödvinkelassistent",
       "Vägmärkesassistent"
      ]
     },
     "XC60 T6 Plus": {
      "utr": [
       "Dragkrok",
       "Vinterdäck",
       "Laddhybrid 350 hk, fyrhjulsdrift, ca 80 km elräckvidd",
       "Automatlåda"
      ]
     },
     "Formentor eTSI 150 DSG": {
      "utr": [
       "Adaptiv farthållare",
       "LED-strålkastare",
       "Front Assist",
       "Full Link (Apple CarPlay & Android Auto)",
       "12,9\" pekskärm",
       "Helljusassistent",
       "Parkeringssensorer fram och bak",
       "Rattvärme",
       "CUPRA Care (service)"
      ],
      "tv": [
       {
        "n": "Metalliclack",
        "p": 300
       }
      ]
     },
     "Ibiza Edition 1.0 MPI 80 hk": {
      "utr": [
       "Full LED-strålkastare",
       "Uppgraderad interiör",
       "Multifunktionsratt",
       "SEAT Connect",
       "Parkeringssensorer bak",
       "Serviceavtal 3 år/3 000 mil",
       "Fri assistans i 3 år"
      ],
      "tv": [
       {
        "n": "SEAT Full Link (Apple CarPlay & Android Auto)",
        "p": 53
       }
      ]
     },
     "A3 Sportback 35 TFSI S tronic Proline": {
      "utr": [
       "3-zons automatisk klimatanläggning",
       "Audi virtual cockpit",
       "Audi smartphone interface",
       "Parkeringssensorer fram och bak med parkeringsassistent",
       "Backkamera",
       "Vägmärkesidentifiering",
       "Eluppvärmda och elinställbara ytterbackspeglar",
       "Audi connect (10 år)"
      ],
      "tv": [
       {
        "n": "Audi Serviceavtal",
        "p": 100
       }
      ]
     },
     "120": {
      "utr": [
       "17\" lättmetallfälgar",
       "Automatisk luftkonditionering",
       "Driving Assistant",
       "Parking Assistant",
       "Stolsvärme fram",
       "DAB-radio",
       "Steptronic-växellåda med dubbelkoppling",
       "Larm",
       "BMW Service Inclusive 5 år"
      ]
     },
     "EV2 Standard Range": {
      "utr": [
       "16\" aluminiumfälgar",
       "2 × 12,3\" skärmar",
       "11 kW 3-fasladdare och laddkabel",
       "Värmepump och batterivärmare",
       "Adaptiv farthållare med stop & go",
       "2-zons klimatanläggning",
       "Apple CarPlay & Android Auto",
       "Backkamera",
       "Dödavinkelvarning",
       "Eluppvärmda framstolar och ratt",
       "Nyckelfritt system",
       "Parkeringssensorer fram och bak",
       "Takreling"
      ]
     },
     "EV3 Long Range": {
      "utr": [
       "2 × 12,3\" skärmar med navigation",
       "Trådlös Apple CarPlay & Android Auto",
       "Digital Key",
       "Takreling",
       "Trådlös mobilladdare",
       "Nyckelfritt system",
       "Parkeringssensorer fram och bak",
       "Rattvärme",
       "Metallic-/pärllack",
       "7 års nybilsgaranti",
       "7 års Kia Connect (app)",
       "7 års uppkopplad navigation (Kia Live)",
       "Värmepump"
      ]
     },
     "i20 1.0 T-GDi Essential (manuell)": {
      "utr": [
       "16\" aluminiumfälgar",
       "Automatisk klimatanläggning",
       "Backkamera",
       "Eluppvärmd ratt",
       "Farthållare",
       "Filhållningsassistans",
       "Skyltavläsning",
       "Pekskärm med navigation",
       "Parkeringssensorer bak",
       "Regnsensor",
       "ISOFIX",
       "Förberedd för dragkrok"
      ]
     },
     "Bayon 1.0 T-GDi Essential (manuell)": {
      "utr": [],
      "utrnot": "Hedin listar bara färgen (Atlas white). Essential är samma utrustningsnivå som i20 Essential"
     },
     "Kona Hybrid Essential": {
      "utr": [],
      "utrnot": "Hedin har inte publicerat utrustningslistan för just den här bilen"
     },
     "Tucson Hybrid 4WD Essential": {
      "utr": [
       "17\" aluminiumfälgar",
       "LED-strålkastare",
       "12,3\" pekskärm med navigation och Bluelink",
       "12,3\" digital instrumentering",
       "Adaptiv farthållare med stop & go",
       "3-zons klimatanläggning",
       "Backkamera",
       "Parkeringssensorer fram och bak",
       "Dödavinkelvarnare med varning för korsande trafik",
       "Trådlös mobilladdare",
       "Smart Key",
       "Eluppvärmda framsäten och ratt",
       "Delläderklädsel",
       "Takrails",
       "Förberedd för dragkrok"
      ]
     },
     "Tucson Plug-in Hybrid 2WD": {
      "utr": [
       "2-zons klimatanläggning",
       "Adaptiv farthållare",
       "Apple CarPlay & Android Auto",
       "Navigation",
       "Backkamera",
       "Parkeringssensorer fram och bak",
       "Körfilsassistans",
       "Skyltigenkänning",
       "Rattvärme",
       "Sätesvärme fram",
       "Trådlös mobilladdare",
       "230 V-uttag",
       "Lättmetallfälgar"
      ]
     },
     "Juke DIG-T DCT Acenta": {
      "utr": [
       "Apple CarPlay & Android Auto",
       "Autobroms",
       "Avåkningsvarnare",
       "Backkamera",
       "Farthållare",
       "Elinfällbara sidospeglar",
       "Regn- och ljussensor",
       "Röststyrning",
       "Sätesvärme fram",
       "Skyltigenkänning",
       "Lättmetallfälgar"
      ]
     },
     "Micra 40 kWh Engage": {
      "utr": [
       "5 års nybilsgaranti",
       "10\" mittskärm och 7\" förardisplay",
       "Apple CarPlay & Android Auto",
       "11 kW AC- och 80 kW DC-laddning, laddkabel",
       "Värmepump",
       "V2L-adapter",
       "LED-strålkastare",
       "Klimatanläggning",
       "Aktiv filbytesvarnare",
       "Helljusassistans",
       "Parkeringssensorer bak",
       "Regnsensor",
       "18\" fälgar"
      ]
     },
     "Qashqai Acenta": {
      "utr": [
       "2-zons klimatanläggning",
       "Apple CarPlay & Android Auto",
       "Navigation på pekskärm",
       "Autobroms och kollisionsvarning",
       "Backkamera",
       "Döda vinkel-varning",
       "Farthållare med köassistans",
       "Helljusassistans",
       "Nyckelfritt lås och start",
       "LED-strålkastare",
       "Eluppvärmd vindruta",
       "Rattvärme och sätesvärme fram",
       "Lättmetallfälgar",
       "Gummimattor"
      ]
     },
     "5 E-Tech Evolution EV40": {
      "utr": [
       "40 kWh batteri, 120 hk, 312 km räckvidd",
       "11 kW AC- och 80 kW DC-laddning",
       "Värmepump",
       "V2L (bilen som powerbank)",
       "10,1\" huvudskärm och 7\" förardisplay",
       "Apple CarPlay & Android Auto",
       "Autobroms",
       "Automatisk AC",
       "Farthållare",
       "Parkeringssensor bak",
       "18\" stålfälgar med hjulsida"
      ]
     },
     "Sandero Essential TCe 100": {
      "utr": [],
      "utrnot": "Hedin har inte publicerat utrustningslistan för Essential"
     },
     "2008 Allure Hybrid": {
      "utr": [
       "10\" pekskärm",
       "Trådlös Apple CarPlay",
       "Adaptiv farthållare",
       "Automatisk klimatanläggning",
       "Backkamera",
       "Parkeringssensorer fram och bak",
       "Läderratt",
       "Höjdjusterbart passagerarsäte",
       "17\" aluminiumfälgar"
      ],
      "tv": [
       {
        "n": "Utrustningsnivå GT (Alcantara, massagestol, Full-LED, kamera fram och bak, nyckelfritt)",
        "p": 100
       }
      ]
     },
     "3008 GT Hybrid": {
      "utr": [
       "21\" Panorama i-Cockpit",
       "Motoriserad baklucka med handsfree",
       "Pixel LED-strålkastare",
       "Parkeringssensorer fram och bak",
       "Adaptiv farthållare"
      ],
      "tv": [
       {
        "n": "Utrustningsnivå GT Ultimate",
        "p": 500
       }
      ]
     },
     "5008 GT Hybrid": {
      "utr": [
       "21\" Panorama i-Cockpit",
       "Motoriserad baklucka med handsfree",
       "Pixel LED-strålkastare",
       "Parkeringssensorer fram och bak",
       "Adaptiv farthållare"
      ],
      "tv": [
       {
        "n": "Utrustningsnivå GT Ultimate",
        "p": 500
       }
      ]
     },
     "e-2008 GT": {
      "utr": [
       "Alcantara/halvläderklädsel",
       "Elinställbar förarstol med massage",
       "Full-LED-strålkastare",
       "Parkeringskamera fram och bak",
       "Nyckelfritt lås och start"
      ]
     },
     "MG4 Urban": {
      "utr": [
       "325 km räckvidd (WLTP)",
       "Snabbladdning 82 kW",
       "16\" lättmetallfälgar",
       "8\" pekskärm och 7\" förardisplay",
       "Trådlös Apple CarPlay & Android Auto",
       "Adaptiv farthållare",
       "Backkamera",
       "Dödvinkelvarnare",
       "Filhållningsassistans",
       "Keyless",
       "LED-strålkastare",
       "Navigation",
       "Rattvärme och uppvärmda framstolar"
      ]
     },
     "Seal 6 DM-i Touring Comfort": {
      "utr": [
       "360° kamera",
       "2-zons klimatanläggning",
       "Adaptiv farthållare",
       "Apple CarPlay & Android Auto",
       "Navigation",
       "Elektrisk baklucka",
       "Elstolar fram med värme och ventilation",
       "Helskinnsklädsel",
       "Panoramaglastak",
       "Parkeringssensorer fram och bak",
       "Rattvärme",
       "Trådlös mobilladdare",
       "Nyckelfritt lås och start"
      ]
     }
    };
    BILAR.forEach(b => Object.assign(b, UTRUSTNING[b.modell] || {}));


    /* ---------------------------------------------------------------
       FOTON – alla från Wikimedia Commons. Licensen kräver att vi anger
       fotograf, licens och att bilden är ändrad (beskuren och förminskad).
       Det görs under varje bild. "lic" säger vilken licens fotot har.
       ---------------------------------------------------------------- */
    const LICENSER = {
      "CC BY-SA 4.0":    "https://creativecommons.org/licenses/by-sa/4.0/deed.sv",
      "CC BY-SA 3.0 de": "https://creativecommons.org/licenses/by-sa/3.0/de/deed.sv",
      "CC BY 3.0":       "https://creativecommons.org/licenses/by/3.0/deed.sv",
      "CC BY 2.0":       "https://creativecommons.org/licenses/by/2.0/deed.sv",
      "CC0":             "https://creativecommons.org/publicdomain/zero/1.0/deed.sv"
    };
    const C = "https://commons.wikimedia.org/wiki/File:";
    const M = "Alexander Migl", A = "Alexander-93";
    const FOTON = {
      frontera: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Opel_Frontera_C_Electric_Auto_Zuerich_2024_DSC_6234.jpg" },
      grandland: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Opel_Grandland_B_Electric_DSC_6030.jpg" },
      k4: { av: "Oleg Yunakov", lic: "CC BY-SA 4.0", fil: "2026_Kia_K4_Hatchback_-_02.jpg" },
      c5aircross: { av: "Alexander Migl", lic: "CC BY-SA 4.0", fil: "Citro%C3%ABn_%C3%AB-C5_Aircross_Auto_Zuerich_2025_DSC_2991.jpg" },
      outlander: { av: "TTTNIS", lic: "CC0", fil: "2024_Mitsubishi_Outlander_PHEV_P_Executive_Package.jpg" },
      santafe: { av: "Alexander Migl", lic: "CC BY-SA 4.0", fil: "2024_Hyundai_Santa_Fe_%28MX5%29_IMG_5295.jpg" },
      c3aircross: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Citro%C3%ABn_C3_Aircross_%282024%29_DSC_0591.jpg" },
      scenic: { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Renault_Sc%C3%A9nic_E-Tech_Electric_220_Long_Range_Techno_%E2%80%93_f_30062024.jpg" },
      ioniq9: { av: "Alexander Migl", lic: "CC BY-SA 4.0", fil: "Hyundai_Ioniq_9_IMG_5950.jpg" },
      explorer: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Ford_Explorer_EV_Auto_Zuerich_2024_DSC_6362.jpg" },
      mokka: { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Opel_Mokka_Electric_Edition_%28B%2C_Facelift%29_%E2%80%93_f_12102025.jpg" },
      b10: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Leapmotor_B10_IAA_2025_DSC_2067.jpg" },
      t03: { av: "Alexander Migl (retuscherad av NearEMPTiness)", lic: "CC BY-SA 4.0", fil: "Leapmotor_T03_DSC_9337_%28retouched%29.jpg" },
      mgs5: { av: "Alexander Migl", lic: "CC BY-SA 4.0", fil: "MGS5_EV_DSC_2698.jpg" },
      capri: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Ford_Capri_%282024%29_Auto_Zuerich_2024_DSC_6382.jpg" },
      aceman: { av: "Alexander Migl", lic: "CC BY-SA 4.0", fil: "Mini_Aceman_JCW_Trim_DSC_7951.jpg" },
      duster: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Dacia_Duster_III_IMG_8961.jpg" },
      ix1: { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "BMW_iX1_xDrive30_%28U11%29_%E2%80%93_f_05052024.jpg" },
      gla: { av: "Dinkun Chen", lic: "CC BY-SA 4.0", fil: "MERCEDES-BENZ_GLA_%28H247%29_China_%286%29.jpg" },
      p408: { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Peugeot_408_%28crossover%29_1X7A7195.jpg" },
      a3:         { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Audi_A3_Sportback_(8Y,_Facelift)_%E2%80%93_f_03102025.jpg" },
      aygox:      { av: M, fil: "Toyota_Aygo_X_Hybrid_IMG_5984.jpg" },
      bayon:      { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Hyundai_Bayon_1.0_T-GDI_Prime_(Facelift)_%E2%80%93_f_07072024.jpg" },
      bmw120:     { av: A, fil: "BMW_120_(F70)_IMG_1166.jpg" },
      born:       { av: A, fil: "Cupra_Born_1X7A6953.jpg" },
      bz4x:       { av: M, fil: "2026_Toyota_bZ4X_IMG_8455.jpg" },
      chr:        { av: A, fil: "Toyota_C-HR_hybrid_II_GR_Sport_IMG_8881.jpg" },
      corollats:  { av: A, fil: "2024_Toyota_Corolla_Touring_Sports_Hybrid_(E210)_IMG_9888.jpg" },
      cupraleon:  { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Cupra_Leon_Sportstourer_VZ_2.0_TSI_4Drive_(Facelift)_%E2%80%93_f_19072025.jpg" },
      elroq:      { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Skoda_Elroq_85_%E2%80%93_f_09022025.jpg" },
      ev2:        { av: "Alexander Migl", lic: "CC BY-SA 4.0", fil: "Kia_EV2_Ditzingen_Mobil_2026_IMG_5552.jpg" },
      ev3:        { av: M, fil: "Kia_EV3_DSC_9146.jpg" },
      ex30:       { av: "Alexander-93", lic: "CC BY-SA 4.0", fil: "Volvo_EX30_1X7A2476.jpg" },
      ex30cc:     { av: "Chanokchon", fil: "2025_Volvo_EX30_Cross_Country_Ultra_Twin_Motor_Performance.jpg" },
      ex40:       { av: A, fil: "Volvo_XC40_Recharge_Facelift_IMG_8130.jpg" },
      formentor:  { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Cupra_Formentor_(Facelift)_%E2%80%93_f_01012025.jpg" },
      i20:        { av: A, fil: "Hyundai_i20_(BC3)_Facelift_IMG_8594.jpg" },
      ibiza:      { av: A, fil: "Seat_Ibiza_6F_Facelift_IMG_0117.jpg" },
      id3:        { av: M, fil: "Volkswagen_ID.3_Neo_IMG_7255.jpg" },
      id4:        { av: "Dennis Elzinga", lic: "CC BY 2.0", fil: "2020_Volkswagen_ID.4_Pro_(Netherlands)_front_view.jpg" },
      ix2:        { av: A, fil: "BMW_U10_1X7A2456.jpg" },
      juke:       { av: A, fil: "2024_Nissan_Juke_(F16)_IMG_2179.jpg" },
      karoq:      { av: M, fil: "Skoda_Karoq_Facelift_1X7A0318.jpg" },
      kodiaq:     { av: A, fil: "%C5%A0koda_Kodiaq_II_IMG_9433.jpg" },
      kona:       { av: "Damian B Oh", fil: "Hyundai_Kona_Hybrid_SX2_HEV_Abyss_Black_Pearl_Test_Vehicle_(1).jpg" },
      mazda6e:    { av: "Matti Blume", fil: "Mazda_6e,_Auto_2025,_Zurich_(20251029-P1073933).jpg" },
      mg4:        { av: "Captainmorlypogi1959", fil: "Morris_Garages_MG4_Urban_EV_2026_(1).jpg" },
      micra:      { av: M, fil: "Nissan_Micra_EV_IMG_4967.jpg" },
      octaviac:   { av: M, fil: "%C5%A0koda_Octavia_IV_Combi_RS_Facelift_DSC_7073.jpg" },
      p2008:      { av: A, fil: "Peugeot_2008_B_Facelift_IMG_1185.jpg" },
      p3008:      { av: A, fil: "Peugeot_3008_C_IMG_9387.jpg" },
      p5008:      { av: A, fil: "Peugeot_5008_C_Leonberg_2024_IMG_0827.jpg" },
      pe2008:     { av: A, fil: "Peugeot_e-2008_Facelift_Auto_Zuerich_2023_1X7A1206.jpg" },
      pol4:       { av: M, fil: "Polestar_4_DSC_8232_(cropped).jpg" },
      qashqai:    { av: "LuvsMG481", fil: "2025_Nissan_Qashqai_ST-L_facelift_front.jpg" },
      r5:         { av: M, fil: "Renault_5_E-Tech_Electric_DSC_7281.jpg" },
      rav4:       { av: M, fil: "Toyota_RAV4_Core_Hybrid_IMG_7545.jpg" },
      raval:      { av: M, fil: "Cupra_Raval_VZ_IMG_8811.jpg" },
      sandero:    { av: M, fil: "2023_Dacia_Sandero_III_1X7A6192.jpg" },
      seal6:      { av: A, fil: "BYD_Seal_6_DM-i_Touring_IAA_2025_DSC_2250.jpg" },
      superb:     { av: A, fil: "%C5%A0koda_Superb_IV_Combi_Automesse_Ludwigsburg_2024_IMG_1400.jpg" },
      tucson:     { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Hyundai_Tucson_1.6_T-GDI_PHEV_Trend_(IV,_Facelift)_%E2%80%93_f_15022025.jpg" },
      yaris:      { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Toyota_Yaris_Hybrid_Teamplayer_(IV,_Facelift)_%E2%80%93_f_12042026.jpg" },
      yariscross: { av: A, fil: "Toyota_Yaris_Cross_Hybrid_(XP210)_1X7A1846.jpg" },
      cla:        { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Mercedes-Benz_CLA_220_4MATIC_AMG_Line_(C_178)_%E2%80%93_f_11052026.jpg" },
      clasb:      { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Mercedes-Benz_CLA_220_Shooting_Brake_AMG_Line_Plus_(X_178)_%E2%80%93_f_30082026.jpg" },
      a3sedan:    { av: "Charles from Port Chester, New York", lic: "CC BY 2.0", fil: "Audi_A3_Limousine_35_TFSI_(2021)_(53334772786).jpg" },
      a5:         { av: "Alexander Migl", lic: "CC BY-SA 4.0", fil: "Audi_A5_B10_DSC_7306.jpg" },
      a5avant:    { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Audi_A5_Avant_Advanced_(B10)_%E2%80%93_f_18042026.jpg" },
      q4:         { av: "Calreyn88", fil: "2024_Audi_Q4_e-tron_Vorsprung_45.jpg" },
      q6:         { av: M, fil: "Audi_Q6_e-tron_DSC_2908.jpg" },
      tavascan:   { av: A, fil: "Cupra_Tavascan_Auto_Zuerich_2023_1X7A0992.jpg" },
      terramar:   { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Cupra_Terramar_1.5_eTSI_%E2%80%93_f_25012026.jpg" },
      leon:       { av: A, fil: "Cupra_Leon_Mk4_Facelift_Leonberg_2024_IMG_0888.jpg" },
      bz4xt:      { av: "TTTNIS", lic: "CC0", fil: "Toyota_bZ4X_Touring_Z_4WD.jpg" },
      corollacross: { av: "Ethan Llamas", fil: "Toyota_Corolla_Cross_FL_ZVG10_1.8_G_HEV_Platinum_White_Pearl_Mica.jpg" },
      ec40:       { av: "Ethan Llamas", fil: "Volvo_EC40_Crystal_White_Pearl_-_front.jpg" },
      eclass:     { av: A, fil: "Mercedes-Benz_W214_1X7A1841.jpg" },
      enyaq:      { av: "Ssu", fil: "2025_Skoda_Enyaq_sportline_(facelift)_-_front.jpg" },
      enyaqc:     { av: M, fil: "%C5%A0koda_Enyaq_Coup%C3%A9_DSC_7070.jpg" },
      epiq:       { av: A, fil: "%C5%A0koda_Epiq_Showcar_IAA_2025_DSC_1378.jpg" },
      ev4:        { av: M, fil: "Kia_EV4_GT-Line_Automesse_Ludwigsburg_2025_DSC_2534.jpg" },
      ev5:        { av: "Ethan Llamas", fil: "Kia_EV5_OV_GT-Line_Snow_White_Pearl_01.jpg" },
      ex60:       { av: M, fil: "Volvo_EX60_IMG_8339.jpg" },
      fabia:      { av: M, fil: "Skoda_Fabia_IV_1X7A6155.jpg" },
      glb:        { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Mercedes-Benz_GLB_250%2B_mit_EQ-Technologie_AMG_Line_(X_244)_%E2%80%93_f1_18042026.jpg" },
      glc:        { av: A, fil: "Mercedes-Benz_GLC_with_EQ_Technology_IAA_2025_DSC_2106.jpg" },
      golf:       { av: A, fil: "Volkswagen_Golf_VIII_Facelift_IMG_0375.jpg" },
      golfsc:     { av: A, fil: "Volkswagen_Golf_VIII_Variant_Facelift_IMG_0401.jpg" },
      id7:        { av: A, fil: "Volkswagen_ID.7_IAA_2023_1X7A0375.jpg" },
      id7t:       { av: M, fil: "Volkswagen_ID.7_Tourer_IMG_4193.jpg" },
      idcross:    { av: M, fil: "Volkswagen_ID._Cross_IAA_2025_DSC_1380.jpg" },
      idpolo:     { av: M, fil: "Volkswagen_ID.Polo_IMG_8403.jpg" },
      idtiguan:   { av: "Y.Leclercq", fil: "Volkswagen_ID._Tiguan_01.jpg" },
      k4sw:       { av: M, fil: "Kia_K4_Sportswagon_IMG_7822.jpg" },
      kamiq:      { av: A, fil: "%C5%A0koda_Kamiq_Facelift_IMG_8638.jpg" },
      m3:         { av: "Mliu92", fil: "Tesla_Model_3_%27Highland%27_(2024)_2.jpg" },
      my:         { av: "Damian B Oh", fil: "Tesla_Model_Y_Dual_Motor_First_Edition_Juniper_Quicksilver_(6).jpg" },
      passat:     { av: A, fil: "Volkswagen_Passat_Variant_B9_1X7A1960.jpg" },
      peaq:       { av: "Ssu", fil: "2026_Skoda_Peaq_(15).jpg" },
      picanto:    { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Kia_Picanto_Sport_(III,_2._Facelift)_%E2%80%93_f_02012026.jpg" },
      polo:       { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "VW_Polo_MOVE_(VI,_Facelift)_%E2%80%93_f_18042025.jpg" },
      seltos:     { av: M, fil: "Kia_Seltos_(SP3)_IMG_7812.jpg" },
      sorento:    { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Kia_Sorento_2.2_CRDi_DCT_AWD_Platinum_(IV,_Facelift)_%E2%80%93_f_14102025.jpg" },
      sportage:   { av: "LuvsMG481", fil: "2025_Kia_Sportage_GT-Line_facelift_front.jpg" },
      stonic:     { av: M, fil: "Kia_Stonic_Facelift_IMG_3649.jpg" },
      taigo:      { av: M, fil: "Volkswagen_Taigo_1X7A0350.jpg" },
      tayron:     { av: M, fil: "Volkswagen_Tayron_II_eHybrid_DSC_7824.jpg" },
      tiguan:     { av: A, fil: "Volkswagen_Tiguan_III_IMG_8388.jpg" },
      troc:       { av: M, fil: "Volkswagen_T-Roc_II_IMG_5693.jpg" },
      v60:        { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Volvo_V60_Cross_Country_B4_AWD_Plus_(II,_Facelift)_%E2%80%93_f_12102025.jpg" },
      xc60:       { av: "JustAnotherCarDesigner", lic: "CC0", fil: "Volvo_XC60_II_2025_facelift_002.jpg" },
      xc90:       { av: "Kevauto", fil: "2025_Volvo_XC90_(facelift),_front_4.11.25.jpg" }
    };

    /* ================================================================
       PLATS – var bilen hämtas, och avstånd från kunden.
       Märkets egna erbjudanden (typ "Märket") gäller i hela Sverige:
       bilen hämtas hos närmaste märkeshandlare.
       Handlarnas egna erbjudanden är lokala. orter = där handlaren finns.
       Källor (6 nov 2026): Din Bil – Stockholm, Göteborg, västra Skåne,
       Gävleborg-Dalarna. Rejmes – Östergötland, Närke, Västmanland,
       Södermanland och Småland. Lecab – Karlstad och Arvika. Nybergs Bil –
       Jönköping, Nässjö och Habo. Hedin Hyundai – Danderyd, Segeltorp, Mölndal.
       ================================================================ */
    const ORT = {
      "Stockholm": [59.33, 18.07], "Hammarby Sjöstad": [59.30, 18.10], "Kungsängen": [59.48, 17.75], "Kista": [59.40, 17.94],
      "Danderyd": [59.40, 18.04], "Segeltorp": [59.28, 17.94], "Mölndal": [57.66, 12.01], "Göteborg": [57.71, 11.97], "Hisings Backa": [57.75, 11.93],
      "Malmö": [55.60, 13.00], "Helsingborg": [56.05, 12.69], "Ystad": [55.43, 13.82],
      "Gävle": [60.67, 17.14], "Borlänge": [60.48, 15.43], "Falun": [60.61, 15.63],
      "Karlstad": [59.38, 13.50], "Arvika": [59.65, 12.59],
      "Jönköping": [57.78, 14.16], "Nässjö": [57.65, 14.69], "Habo": [57.91, 14.07],
      "Linköping": [58.41, 15.62], "Norrköping": [58.59, 16.19], "Mjölby": [58.32, 15.13], "Åtvidaberg": [58.20, 16.00]
    };
    const LANEXTRA = { "Uddevalla": "Västra Götaland", "Lysekil": "Västra Götaland", "Luleå": "Norrbotten", "Skellefteå": "Västerbotten", "Umeå": "Västerbotten", "Östersund": "Jämtland" };   // län för orter som kommer från annonser (fylls nedan)
    const ORTREGLER = [
      { om: b => /Kungsängen/.test(b.kalla), orter: ["Kungsängen"] },
      { om: b => /Kista/.test(b.kalla), orter: ["Kista"] },
      { om: b => /Hammarby Sjöstad/.test(b.kalla), orter: ["Hammarby Sjöstad"] },
      { om: b => /Hisings Backa/.test(b.kalla), orter: ["Hisings Backa"] },
      { om: b => /Ystad/.test(b.kalla), orter: ["Ystad"] },
      { om: b => /^Rejmes/.test(b.kalla), orter: ["Linköping", "Norrköping", "Mjölby", "Åtvidaberg"], text: "Rejmes i Östergötland, Närke, Västmanland, Södermanland och Småland" },
      { om: b => /^Lecab/.test(b.kalla), orter: ["Karlstad", "Arvika"] },
      { om: b => /^Din Bil/.test(b.kalla), orter: ["Stockholm", "Göteborg", "Malmö", "Helsingborg", "Gävle", "Borlänge", "Falun"], text: "Din Bil i Stockholm, Göteborg, västra Skåne och Gävleborg-Dalarna" },
      { om: b => b.kalla === "Nybergs Bil", orter: ["Jönköping", "Nässjö", "Habo"] },
      { om: b => /^Hedin/.test(b.kalla) && b.marke === "Hyundai", orter: ["Danderyd", "Segeltorp", "Mölndal"] }
    ];
    BILAR.forEach(b => {
      // Tillval: "alla" = märkets hela konfigurator med priser, "vissa" = några tillval med pris, "inga" = färdig bil
      b.tillval = b.cfg && typeof KONFIG !== "undefined" && KONFIG[b.cfg] ? "alla" : (b.tv && b.tv.length ? "vissa" : "inga");
      b.lokal = b.typ !== "Märket";
      if (!b.lokal) return;
      // Annonser från handlare (t.ex. via Bilweb) har orten med sig: { ort, ortpos: [lat, lon], ortlan }
      if (b.ort) { if (b.ortpos) ORT[b.ort] = b.ortpos; if (b.ortlan) LANEXTRA[b.ort] = b.ortlan; b.orter = [b.ort]; b.orttext = b.ort; return; }
      const r = ORTREGLER.find(x => x.om(b));
      b.orter = r ? r.orter : null;
      b.orttext = r ? (r.text || b.orter.join(", ")) : "";
    });

    // ---------- Modeller: samma bil hos olika handlare jämförs på en egen sida ----------
    // Nyckel = bildnamnet (foto). Namnet är modellens namn utan utrustningsnivå. build.py läser raden nedan.
    const MODELLNAMN = {"a3":"A3 Sportback","a3sedan":"A3 Sedan","a5":"A5","a5avant":"A5 Avant","aygox":"Aygo X","bayon":"Bayon","bmw120":"1-serie","born":"Born","bz4x":"bZ4X","bz4xt":"bZ4X Touring","chr":"C-HR","cla":"CLA","clasb":"CLA Shooting Brake","corollacross":"Corolla Cross","corollats":"Corolla Touring Sports","cupraleon":"Leon Sportstourer","ec40":"EC40","eclass":"E-Klass","elroq":"Elroq","enyaq":"Enyaq","enyaqc":"Enyaq Coupé","epiq":"Epiq","ev2":"EV2","ev3":"EV3","ev4":"EV4","ev5":"EV5","ex30":"EX30","ex30cc":"EX30 Cross Country","ex40":"EX40","ex60":"EX60","fabia":"Fabia","formentor":"Formentor","glb":"GLB","glc":"GLC","golf":"Golf","golfsc":"Golf Sportscombi","i20":"i20","ibiza":"Ibiza","id3":"ID.3","id4":"ID.4","id7":"ID.7","id7t":"ID.7 Tourer","idcross":"ID.Cross","idpolo":"ID.Polo","idtiguan":"ID.Tiguan","ix2":"iX2","juke":"Juke","k4sw":"K4 Sportswagon","kamiq":"Kamiq","karoq":"Karoq","kodiaq":"Kodiaq","kona":"Kona","leon":"Leon","m3":"Model 3","mazda6e":"6e","mg4":"MG4","micra":"Micra","my":"Model Y","octaviac":"Octavia Combi","p2008":"2008","p3008":"3008","p5008":"5008","passat":"Passat","pe2008":"e-2008","peaq":"Peaq","picanto":"Picanto","pol4":"4","polo":"Polo","q4":"Q4 e-tron","q6":"Q6 e-tron","qashqai":"Qashqai","r5":"5 E-Tech","rav4":"RAV4","raval":"Raval","sandero":"Sandero","seal6":"Seal 6","seltos":"Seltos","sorento":"Sorento","sportage":"Sportage","stonic":"Stonic","superb":"Superb Combi","taigo":"Taigo","tavascan":"Tavascan","tayron":"Tayron","terramar":"Terramar","tiguan":"Tiguan","troc":"T-Roc","tucson":"Tucson","v60":"V60","xc60":"XC60","xc90":"XC90","yaris":"Yaris","yariscross":"Yaris Cross","frontera":"Frontera","grandland":"Grandland","k4":"K4","c5aircross":"C5 Aircross","outlander":"Outlander","santafe":"Santa Fe","c3aircross":"C3 Aircross","scenic":"Scenic E-Tech","ioniq9":"IONIQ 9","explorer":"Explorer","mokka":"Mokka","b10":"B10","t03":"T03","mgs5":"S5","capri":"Capri","aceman":"Aceman","duster":"Duster","ix1":"iX1","gla":"GLA","p408":"408"};
    // Karosstyp per modell (nyckel = bildnamnet). Används av kategorisidorna (SUV, kombi, småbil).
    const KAROSS = {};
    const _kar = (typ, lista) => lista.split(" ").forEach(k => KAROSS[k] = typ);
    _kar("SUV", "bayon bz4x bz4xt chr corollacross ec40 elroq enyaq enyaqc epiq ev2 ev3 ev5 ex30 ex30cc ex40 ex60 formentor glb glc id4 idcross idtiguan ix2 juke kamiq karoq kodiaq kona my p2008 p3008 p5008 pe2008 peaq pol4 q4 q6 qashqai rav4 seltos sorento sportage stonic taigo tavascan tayron terramar tiguan troc tucson xc60 xc90 yariscross frontera grandland c5aircross outlander santafe c3aircross scenic ioniq9 explorer mokka b10 mgs5 capri aceman duster ix1 gla");
    _kar("Kombi", "a5avant clasb corollats cupraleon golfsc id7t k4sw octaviac passat superb v60");
    _kar("Småbil", "aygox fabia i20 ibiza idpolo micra picanto polo r5 raval sandero yaris t03");
    _kar("Halvkombi/sedan", "a3 a3sedan a5 bmw120 born cla eclass ev4 golf id3 id7 leon m3 mazda6e mg4 seal6 k4 p408");
    // Län per ort, för regionknapparna i jämförelsen
    const LAN = { "Stockholm": "Stockholm", "Hammarby Sjöstad": "Stockholm", "Kungsängen": "Stockholm", "Kista": "Stockholm", "Danderyd": "Stockholm", "Segeltorp": "Stockholm",
      "Mölndal": "Västra Götaland", "Göteborg": "Västra Götaland", "Hisings Backa": "Västra Götaland", "Malmö": "Skåne", "Helsingborg": "Skåne", "Ystad": "Skåne",
      "Gävle": "Gävleborg", "Borlänge": "Dalarna", "Falun": "Dalarna", "Karlstad": "Värmland", "Arvika": "Värmland",
      "Jönköping": "Jönköping", "Nässjö": "Jönköping", "Habo": "Jönköping", "Linköping": "Östergötland", "Norrköping": "Östergötland", "Mjölby": "Östergötland", "Åtvidaberg": "Östergötland" };
    // Samma bil från två källor: finns Hedins egen uppgift tas Hedins Bilweb-annons med samma modell och pris bort
    {
      const hd = new Set(BILAR.filter(b => b.hedin).map(b => slug(b.marke + " " + (b.mnamn || "")) + "|" + b.manad));
      for (let i = BILAR.length - 1; i >= 0; i--) { const b = BILAR[i]; if (b.bilweb && /^Hedin/i.test(b.kalla) && hd.has(slug(b.marke + " " + (MODELLNAMN[b.foto] || b.mnamn || "")) + "|" + b.manad)) BILAR.splice(i, 1); }
    }
    const MODELLER = {};
    BILAR.forEach(b => {
      b.mnamn = MODELLNAMN[b.foto] || b.mnamn || b.modell.split(" ")[0];
      b.mkey = slug(b.marke + " " + b.mnamn);
      b.kaross = KAROSS[b.foto] || b.kaross || "";
      b.msida = "privatleasing-" + b.mkey + ".html";
      b.lan = !b.lokal ? ["Hela Sverige"] : b.orter ? [...new Set(b.orter.map(o => LAN[o] || LANEXTRA[o] || o))] : ["Okänd ort"];
      (MODELLER[b.mkey] = MODELLER[b.mkey] || []).push(b);
    });
    // Erbjudanden utan egen bild lånar bild och karosstyp från samma modell
    Object.values(MODELLER).forEach(g => {
      const f = g.find(b => b.foto), k = g.find(b => b.kaross);
      g.forEach(b => { if (!b.foto && f) b.foto = f.foto; if (!b.kaross && k) b.kaross = k.kaross; });
    });
    // Körsträcka som saknas i handlarens annons: om priset är exakt detsamma som märkets eget erbjudande
    // på samma modell är det samma kampanj – då gäller märkets körsträcka. Annars gissar vi inte.
    BILAR.filter(b => b.milokand).forEach(b => {
      const lika = MODELLER[b.mkey].filter(x => !x.milokand && !x.bilweb && x.typ === "Märket" && x.manad === b.manad);
      const mils = [...new Set(lika.map(x => x.mil))];
      if (mils.length === 1) {
        b.mil = mils[0]; b.milokand = false; b.milharledd = true; b.mer = lika[0].mer;
        b.not = b.not.replace("Körsträckan framgår inte av annonsen – fråga handlaren", `Körsträckan står inte i annonsen, men priset är detsamma som ${b.marke}s eget kampanjpris (${b.mil.toLocaleString("sv-SE")} mil/år)`);
      }
    });

    // Postnummer -> ungefärlig plats (två första siffrorna). Räcker för avstånd i mil.
    const POSTNR = {
      10:[59.33,18.06],11:[59.33,18.06],12:[59.30,18.05],13:[59.31,18.15],14:[59.22,17.95],15:[59.20,17.63],16:[59.36,17.95],17:[59.37,17.98],18:[59.44,18.07],19:[59.58,17.85],
      20:[55.60,13.00],21:[55.59,13.02],22:[55.70,13.19],23:[55.42,13.10],24:[55.84,13.30],25:[56.05,12.69],26:[56.20,12.86],27:[55.43,13.82],28:[56.16,13.77],29:[56.03,14.16],
      30:[56.67,12.86],31:[57.00,12.40],33:[57.18,14.04],34:[56.83,13.94],35:[56.88,14.81],36:[56.63,15.54],37:[56.16,15.59],38:[56.66,16.00],39:[56.66,16.36],
      40:[57.71,11.97],41:[57.70,11.97],42:[57.78,12.00],43:[57.55,12.05],44:[57.90,12.25],45:[58.35,11.94],46:[58.28,12.29],47:[58.05,11.70],
      50:[57.72,12.94],51:[57.50,12.70],52:[58.17,13.55],53:[58.50,13.16],54:[58.39,13.85],55:[57.78,14.16],56:[57.86,14.40],57:[57.50,14.85],58:[58.41,15.62],59:[58.40,15.30],
      60:[58.59,16.19],61:[58.75,17.01],62:[57.64,18.30],63:[59.37,16.51],64:[59.00,16.20],65:[59.38,13.50],66:[59.13,12.93],67:[59.65,12.59],68:[59.60,13.50],69:[59.33,14.52],
      70:[59.27,15.21],71:[59.59,15.23],72:[59.61,16.55],73:[59.60,16.20],74:[59.90,17.50],75:[59.86,17.64],76:[59.76,18.70],77:[60.20,15.60],78:[60.48,15.43],79:[60.80,14.90],
      80:[60.67,17.14],81:[60.60,16.90],82:[61.50,16.60],83:[63.18,14.64],84:[62.50,15.00],85:[62.39,17.31],86:[62.55,17.60],87:[62.75,17.80],88:[63.17,17.27],89:[63.29,18.72],
      90:[63.83,20.26],91:[64.20,19.50],92:[64.60,17.80],93:[64.75,20.95],94:[65.32,21.48],95:[65.85,23.50],96:[66.00,21.00],97:[65.58,22.15],98:[67.40,20.50]
    };
    function km(a, b) {
      const r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
      return 6371 * 2 * Math.asin(Math.sqrt(x));
    }
    // Kundens plats: { pos: [lat, lon], text: "nära 754 xx" } – sparas bara i webbläsaren.
    let MINPLATS = null;
    try { MINPLATS = JSON.parse(localStorage.getItem("jp_plats") || "null"); } catch (e) {}
    function sparaPlats(p) { MINPLATS = p; try { p ? localStorage.setItem("jp_plats", JSON.stringify(p)) : localStorage.removeItem("jp_plats"); } catch (e) {} }
    function avstand(b) {
      if (!MINPLATS || !b.orter) return null;
      const kanda = b.orter.filter(o => ORT[o]);
      return kanda.length ? Math.min(...kanda.map(o => km(MINPLATS.pos, ORT[o]))) : null;
    }
    const tillMil = k => Math.max(1, Math.round(k / 10));
    function platstagg(b) {
      if (!b.lokal) return `<span class="tag el">Hela Sverige</span>`;
      if (!b.orter) return `<span class="tag warn">Lokal handlare – fråga var bilen hämtas</span>`;
      const a = avstand(b), namn = b.orter.length === 1 ? "Hämtas i " + b.orter[0] : "Lokal: " + b.orter.slice(0, 2).join(", ") + (b.orter.length > 2 ? " m.fl." : "");
      return `<span class="tag warn">📍 ${namn}${a != null ? " · " + tillMil(a) + " mil från dig" : ""}</span>`;
    }

    // Hämta elementen från HTML-delen så att vi kan läsa och ändra dem.
    const sok = document.getElementById("sok");
    const drivmedel = document.getElementById("drivmedel");
    const mil = document.getElementById("mil");
    const forsakring = document.getElementById("forsakring");
    const sortera = document.getElementById("sortera");
    const lista = document.getElementById("lista");
    const summary = document.getElementById("summary");
    // Vilken sida vi är på (sätts i <body data-sida="..." data-marke="...">)
    const SIDA = document.body.dataset.sida || "";
    const SIDMARKE = document.body.dataset.marke || "";
    const markeSel = document.getElementById("marke");
    const maxpris = document.getElementById("maxpris");
    const visaMer = document.getElementById("visaMer");
    const radieSel = document.getElementById("radie");
    const tillvalIn = document.getElementById("tillval");
    const STEGVIS = 12;            // så många bilar visas åt gången
    let antalVisas = STEGVIS;

    // Förval för listan: kategorisidor sätter data-driv/-tak/-kaross/-sort på <body>, och adressen kan ha ?q=&driv=&max=&kaross=&sort=
    const _qs = new URLSearchParams(location.search), _bd = document.body.dataset;
    const FORVAL = { driv: _qs.get("driv") || _bd.driv || "", tak: Number(_qs.get("max") || _bd.tak) || 0, kaross: _qs.get("kaross") || _bd.kaross || "", lan: _qs.get("lan") || _bd.lan || "", sort: _qs.get("sort") || _bd.sort || "", q: _qs.get("q") || "" };

    // Jämför bilar sida vid sida: valda modeller sparas bara i webbläsaren (högst 4)
    const JMF = {
      lista() { try { return JSON.parse(localStorage.getItem("jp_jamfor") || "[]").filter(k => MODELLER[k]); } catch (e) { return this._m || []; } },
      spara(l) { this._m = l; try { localStorage.setItem("jp_jamfor", JSON.stringify(l)); } catch (e) {} },
      har(k) { return this.lista().includes(k); },
      vaxla(k) { let l = this.lista(); if (l.includes(k)) l = l.filter(x => x !== k); else { if (l.length >= 4) return false; l.push(k); } this.spara(l); return true; }
    };
    function jmfFalt() {
      let f = document.getElementById("jmffalt");
      const l = JMF.lista();
      if (!l.length || SIDA === "jamforbilar") { if (f) f.remove(); return; }
      if (!f) { f = document.createElement("div"); f.id = "jmffalt"; f.className = "jmffalt"; document.body.appendChild(f); }
      f.innerHTML = `<span><b>${l.length}</b> ${l.length === 1 ? "bil vald" : "bilar valda"}<small>${l.map(k => esc(MODELLER[k][0].mnamn)).join(", ")}</small></span>
        <button type="button" class="lanklik" id="jmfrensa">Rensa</button><a class="cta" href="jamfor-bilar.html">${l.length > 1 ? "Jämför sida vid sida →" : "Välj en bil till →"}</a>`;
      document.getElementById("jmfrensa").onclick = () => { JMF.spara([]); jmfFalt(); document.querySelectorAll("[data-jmf]").forEach(uppdJmfKnapp); };
    }
    function uppdJmfKnapp(b) {
      const pa = JMF.har(b.dataset.jmf);
      b.classList.toggle("vald", pa); b.setAttribute("aria-pressed", pa);
      b.textContent = pa ? "✓ Vald för jämförelse" : "＋ Jämför med andra bilar";
    }
    document.addEventListener("click", e => {
      const b = e.target.closest("button[data-jmf]"); if (!b) return;
      if (!JMF.vaxla(b.dataset.jmf)) { b.textContent = "Högst 4 bilar – ta bort en först"; return; }
      uppdJmfKnapp(b); jmfFalt();
    });
    // Lägsta faktiska månadskostnad per modell (insats och avgifter utslagna på 36 mån, bara erbjudanden med känd körsträcka)
    function modellSammanfattning(k) {
      const g = MODELLER[k] || [];
      const rader = g.map(bil => { const m = bil.manad + bil.adm + (bil.forsakring || 0), total = m * 36 + bil.start + bil.forhojd; return { ...bil, m, total, eff: Math.round(total / 36), krmil: bil.milokand ? null : total / (bil.mil * 3) }; });
      const kanda = rader.filter(r => !r.milokand);
      const bast = [...(kanda.length ? kanda : rader)].sort((a, b) => a.eff - b.eff)[0];
      return { rader, bast, antal: rader.length, saljare: new Set(rader.map(r => r.kalla.split(/ \(|,/)[0])).size };
    }

    // Hjälpfunktioner: 20865 -> "20 865 kr", 0.384 -> "38 %"
    const kr = n => n.toLocaleString("sv-SE") + " kr";
    const pct = x => Math.round(x * 100) + " %";

    // Betyget för ett erbjudande, utifrån andelen av nypriset.
    function betyg(andel) {
      if (andel == null) return null;
      if (andel < 0.40) return { klass: "mb", text: "Mycket bra" };
      if (andel < 0.45) return { klass: "b",  text: "Bra" };
      if (andel < 0.55) return { klass: "ok", text: "OK" };
      return { klass: "d", text: "Dyrt" };
    }

    // Räkna ut månadspriset för den körsträcka man valt.
    // Returnerar null om tillägget inte är känt.
    function manadFor(bil, valdMil) {
      const ingar = bil.mil || 1000;               // okänt? anta 1 000 mil
      let pris = null;
      if (valdMil <= ingar) pris = bil.manad;      // ingår redan
      else if (bil.mer && bil.mer[valdMil] != null) pris = bil.manad + bil.mer[valdMil];
      return pris == null ? null : pris + bil.adm; // lägg på ev. admin-avgift
    }

    // Huvudfunktionen: körs varje gång man ändrar ett filter.
    function rita() {
      const text = sok ? sok.value.trim().toLowerCase() : "";
      const valdMil = mil ? Number(mil.value) : 1000;
      const forsMan = forsakring ? Number(forsakring.value) || 0 : 0;

      // 1) Räkna fram pris och andel för varje bil
      let rader = BILAR.map(bil => {
        const m = manadFor(bil, valdMil);
        const leasing = m == null ? null : m * 36 + bil.start + bil.forhojd;   // allt du betalar till leasingbolaget
        const total = leasing == null ? null : leasing + (bil.forsakring ?? forsMan) * 36;   // vissa märken har obligatorisk försäkring
        const andel = leasing != null && bil.nypris ? leasing / bil.nypris : null;
        return { ...bil, m, total, andel, eff: leasing == null ? null : Math.round(leasing / 36) + (bil.forsakring || 0), idx: BILAR.indexOf(bil) };
      });

      // 1b) Topp 5 överst: bästa erbjudandet per populär modell (räknas på alla bilar, oberoende av filtren)
      { const tp = document.getElementById("topp"); if (tp && !tp.children.length) { try { ritaTopp(); } catch (err) {} } }
      if (!lista) return;

      // 2) Filtrera
      const tak = maxpris ? Number(maxpris.value) || 0 : 0;
      const radie = radieSel ? Number(radieSel.value) || 0 : 0;
      rader = rader.filter(b =>
        (!drivmedel || drivmedel.value === "alla" || b.drivmedel === drivmedel.value) &&
        (SIDMARKE ? b.marke === SIDMARKE : (!markeSel || markeSel.value === "alla" || b.marke === markeSel.value)) &&
        (!tak || (b.eff != null && !b.milokand && b.eff <= tak)) &&
        (!FORVAL.kaross || b.kaross === FORVAL.kaross) &&
        (!FORVAL.lan || !b.lokal || b.lan.includes(FORVAL.lan)) &&
        (SIDA !== "kampanjer" || (b.andel != null && b.andel < 0.45)) &&
        (!radie || !MINPLATS || !b.orter || avstand(b) <= radie) &&
        (!tillvalIn || tillvalIn.value === "alla" || (tillvalIn.value === "bygg" ? b.tillval === "alla" : b.tillval !== "alla")) &&
        (b.marke + " " + b.mnamn + " " + b.modell).toLowerCase().includes(text)
      );

      // 3) Sortera (bilar där något värde saknas hamnar sist)
      const big = Number.MAX_SAFE_INTEGER;
      const s = sortera ? sortera.value : "andel";
      if (s === "andel") rader.sort((a, b) => (a.andel ?? big) - (b.andel ?? big));
      if (s === "total") rader.sort((a, b) => (a.total ?? big) - (b.total ?? big));
      if (s === "manad") rader.sort((a, b) => (a.m ?? big) - (b.m ?? big));
      if (s === "marke") rader.sort((a, b) => (a.marke + a.modell).localeCompare(b.marke + b.modell, "sv"));

      // 3b) Ren jämförelse: ett kort per modell, med modellens billigaste erbjudande (som matchar filtren) som "från"-pris
      const grupper = {};
      rader.forEach(r => (grupper[r.mkey] = grupper[r.mkey] || []).push(r));
      const kmp = (a, b) => s === "andel" ? (a.andel ?? big) - (b.andel ?? big) : s === "total" ? (a.total ?? big) - (b.total ?? big)
        : s === "marke" ? (a.marke + a.mnamn).localeCompare(b.marke + b.mnamn, "sv") : (a.m ?? big) - (b.m ?? big);
      const modellRader = Object.values(grupper).map(g => {
        const kg = g.filter(x => !x.milokand);
        const bill = [...(kg.length ? kg : g)].sort((a, b) => (a.total ?? big) - (b.total ?? big) || (a.m ?? big) - (b.m ?? big))[0];
        return { ...bill, antal: g.length, handlare: new Set(g.map(x => x.kalla.split(/ \(|,/)[0])).size, maxm: Math.max(...g.map(x => x.m ?? 0)) };
      }).sort(kmp);

      // 4) Sammanfattningen överst
      const minst = (lista, falt) => lista.filter(r => r[falt] != null).sort((a, b) => a[falt] - b[falt])[0];
      const bast = minst(rader, "andel");
      const billigast = minst(rader.filter(r => !r.milokand), "total") || minst(rader, "total");
      const billigastEl = minst(rader.filter(r => r.drivmedel === "El"), "total");
      const namn = b => b ? b.marke + " " + b.modell : "";
      if (summary) summary.innerHTML = `
        <div class="stat"><small>Lägst faktisk kostnad</small><b>${billigast ? kr(Math.round(billigast.total / 36)) + "/mån" : "–"}</b><small>${namn(billigast)}</small></div>
        <div class="stat"><small>Bäst pris mot nypris</small><b>${bast ? pct(bast.andel) + " av nypriset" : "–"}</b><small>${namn(bast)}</small></div>
        <div class="stat"><small>Billigaste elbil totalt</small><b>${billigastEl ? kr(billigastEl.total) : "–"}</b><small>${namn(billigastEl)}</small></div>
        <div class="stat"><small>Modeller · erbjudanden</small><b>${modellRader.length} · ${rader.length}</b></div>`;

      // 5) Bygg ett kort per bil
      if (visaMer) {
        const kvar = modellRader.length - antalVisas;
        visaMer.hidden = kvar <= 0;
        visaMer.textContent = `Visa fler modeller (${kvar} till)`;
      }
      lista.innerHTML = modellRader.slice(0, antalVisas).map((b, i) => {
        const bt = betyg(b.andel);
        const visaRank = s !== "marke" && (s === "andel" ? b.andel != null : b.total != null);
        const flera = b.antal > 1, handl = esc(b.kalla.split(/ \(|,/)[0]);
        const huvudlank = flera ? b.msida : ut(b.url), ny = flera ? "" : ` target="_blank" rel="${rel(b.url)}"`;
        return `
        <article class="car">
          <a class="piclink" href="${huvudlank}"${ny}>${b.andel != null && b.andel < .45 ? `<span class="kortbadge">🔥 Kampanjpris</span>` : ""}${b.drivmedel === "El" ? `<span class="elbadge">⚡<b>100% EL</b></span>` : ""}${b.foto ? `<img class="pic" src="${bildUrl(b, "", 600)}" alt="${b.marke} ${b.mnamn}" loading="lazy">` : `<div class="pic ingen"><b>${esc(b.marke)} ${esc(b.mnamn)}</b><small>Bild kommer</small></div>`}</a>
          <div>
            <div class="brand">${visaRank ? `<span class="rank">#${i + 1}</span>` : ""}${b.marke}</div>
            <h3><a href="${b.msida}" style="color:inherit;text-decoration:none">${esc(b.marke)} ${esc(b.mnamn)}</a></h3>
            <p class="kortvariant">Billigast: ${esc(b.modell)} · ${handl}</p>
          </div>
          <div class="price">
            ${b.m != null
              ? `<small class="fran">${flera ? "Från" : "Pris"}</small><div class="month">${kr(b.m)}/mån<sup class="fn"><a href="#villkor">1</a></sup></div>${b.forhojd || b.start || b.forsakring ? `<div class="effpris">= ${kr(b.eff)}/mån med ${[b.forhojd && "insats", b.start && "avgifter", b.forsakring && "obligatorisk försäkring"].filter(Boolean).join(" och ")} inräknat</div>` : ""}<div class="total">${kr(b.total)} totalt på 36 mån${flera && b.maxm > b.m ? ` · upp till ${kr(b.maxm)}/mån` : ""}</div>`
              : `<div class="month">${kr(b.manad)}/mån</div><div class="total">vid ${b.mil || "?"} mil/år · tillägg för ${valdMil} mil: fråga handlaren</div>`}
            <div class="kortpiller"><span class="antalerb">${b.antal} ${b.antal === 1 ? "erbjudande" : "erbjudanden"}${b.handlare > 1 ? ` · ${b.handlare} säljare` : ""}</span><span>36 mån</span><span>${b.milokand ? "Körsträcka: fråga handlaren" : (b.m != null ? valdMil : b.mil).toLocaleString("sv-SE") + " mil/år"}</span></div>
            ${flera
              ? `<a class="cta" href="${b.msida}">Jämför ${b.antal} erbjudanden →</a><a class="ext" href="${ut(b.url)}" target="_blank" rel="${rel(b.url)}">Till billigaste erbjudandet ↗</a>`
              : `<a class="cta" href="${ut(b.url)}" target="_blank" rel="${rel(b.url)}">Till erbjudandet ↗</a><a class="ext" href="${b.msida}">Om ${esc(b.mnamn)} →</a>`}${arAff(b.url) ? `<small class="annons">Annonslänk</small>` : ""}
            <button type="button" class="jmfval ${JMF.har(b.mkey) ? "vald" : ""}" data-jmf="${b.mkey}" aria-pressed="${JMF.har(b.mkey)}">${JMF.har(b.mkey) ? "✓ Vald för jämförelse" : "＋ Jämför med andra bilar"}</button>
          </div>
          <div class="tags">
            ${bt ? `<span class="betyg ${bt.klass}">${bt.text} · ${pct(b.andel)} av nypris</span>` : ""}
            <span class="tag ${b.drivmedel === "El" ? "el" : ""}">${b.drivmedel}</span>

            ${platstagg(b)}
            ${b.forhojd ? `<span class="tag warn">${kr(b.forhojd)} vid start</span>` : ""}
          </div>
          <details class="mer"><summary>Avgifter, villkor och källa</summary>
          <div class="tags">
            <span class="tag">36 mån · ${b.mil.toLocaleString("sv-SE")} mil/år ingår</span>
            ${b.forhojd ? `<span class="tag warn">Engångsbelopp vid start: ${kr(b.forhojd)}</span>` : ""}
            ${b.start || b.adm ? `<span class="tag warn">Avgifter: ${kr(b.start)} start${b.adm ? " + " + b.adm + " kr/mån" : ""}</span>` : ""}
            <span class="tag">${b.service === null ? "Service: se villkor" : b.service ? "Service ingår" : "Service ingår inte"}</span>
            <span class="tag ${b.typ === "Märket" ? "" : "warn"}">${b.typ === "Märket" ? "Märkets eget pris" : "Pris från återförsäljare"}</span>
            ${b.cfg && KONFIG[b.cfg] ? `<span class="tag el">Alla tillval med pris</span>` : ""}
          </div>
          ${b.not ? `<div class="source"><b>Obs:</b> ${b.not}</div>` : ""}
          ${b.utr && b.utr.length ? `<details class="utr"><summary>Utrustning som ingår (${b.utr.length})</summary><ul>${b.utr.map(x => `<li>${x}</li>`).join("")}</ul></details>` : ""}
          <div class="source">Nypris ${b.nypris ? kr(b.nypris) : "saknas"} · ${b.kalla} · villkor kontrollerade ${KONTROLL}</div>
          </details>
        </article>`;
      }).join("") || "<p>Inga bilar matchar din sökning.</p>";
    }

    // Bildkällor: en rad per foto. Licenserna kräver att fotografen nämns,
    // men det räcker att det görs samlat här i stället för på varje kort.
    // Foton som frilagts och lagts på studiobakgrund (bearbetade enligt licensen)
    const FRILAGDA = new Set(["a3", "a3sedan", "a5", "a5avant", "aygox", "bayon", "bmw120", "bz4x", "chr", "cla", "clasb", "corollacross", "corollats", "cupraleon", "ec40", "eclass", "elroq", "enyaq", "enyaqc", "epiq", "ev2", "ev3", "ev4", "ex30", "ex40", "ex60", "fabia", "glb", "glc", "golfsc", "i20", "ibiza", "id3", "id4", "id7", "id7t", "juke", "karoq", "kodiaq", "kona", "leon", "mazda6e", "mg4", "micra", "octaviac", "p2008", "p3008", "p5008", "pol4", "q6", "qashqai", "r5", "rav4", "raval", "sandero", "seal6", "superb", "tavascan", "terramar", "yaris", "yariscross"]);
    if (document.getElementById("kallor")) document.getElementById("kallor").innerHTML = Object.keys(FOTON).map(k => {
      const f = FOTON[k], lic = f.lic || "CC BY-SA 4.0";
      const bil = BILAR.find(b => b.foto === k);
      return `<li>${bil ? bil.marke + " " + bil.modell : k}: <a href="${C + f.fil}" target="_blank" rel="noopener">${f.av}</a>, Wikimedia Commons, <a href="${LICENSER[lic]}" target="_blank" rel="noopener">${lic}</a>, ${FRILAGDA.has(k) ? "frilagd och bearbetad" : "beskuren"}</li>`;
    }).join("");

    /* ================================================================
       KONFIGURATORN – kunden väljer avtal, tillval och skickar beställningen.
       Steg: 1 Avtal → 2 Utrustning → 3 Dina uppgifter → 4 Sammanfattning
       För bilar som finns i KONFIG (konfig.js) har vi märkets alla tillval
       med exakta priser. För övriga bilar skriver kunden sina önskemål och
       handlaren lämnar pris i avtalet.
       ================================================================ */
    // NÄR SIDAN GÅR LIVE: Jämföra Privatleasing skickar beställningen åt kunden.
    // BESTALLNING_EPOST = Jämföra Privatleasings egen adress (får en kopia av varje beställning).
    // Beställningen går till bestall.php, som skickar den till BESTALLNING_EPOST (eller direkt till handlaren om bilen har fältet handlare
    // och handlaren finns i listan HANDLARE i bestall.php – mottagare bestäms bara på servern).
    // Tom adress = sidan är inte live än, kunden kopierar beställningen själv.
    const BESTALLNING_EPOST = "bestallning@jamforprivatleasing.se";
    // Beställningar skickas av bestall.php på Strato – bara på den riktiga sidan (inte i förhandsvisningen)
    const LIVE = /(^|\.)jamforprivatleasing\.se$/.test(location.hostname);
    const SIDAN_OPPNAD = Date.now();
    const konf = document.getElementById("konf");
    // Stegen byggs per bil: Översikt → (Version) → (Färg) → (Hjul) → Tillval → Dina uppgifter → Sammanfattning
    function byggSteg(bil, cfg) {
      const S = [{ t: "Översikt", typ: "ov", rub: "Översikt och avtal" }];
      if (cfg) {
        const d = { ver: [], farg: [], hjul: [], tv: [] };
        cfg.G.forEach((g, gi) => {
          if (/drivlina|utrustningsnivå|motor/i.test(g.g)) { if (g.v.length > 1) d.ver.push(gi); }
          else if (/färg|lack/i.test(g.g)) d.farg.push(gi);
          else if (/hjul|fälg|däck/i.test(g.g)) d.hjul.push(gi);
          else d.tv.push(gi);
        });
        if (d.ver.length) S.push({ t: "Version", typ: "g", gi: d.ver, rub: "Modellversion och motor" });
        if (d.farg.length) S.push({ t: "Färg", typ: "g", gi: d.farg, rub: "Välj färg", farg: true });
        if (d.hjul.length) S.push({ t: "Hjul", typ: "g", gi: d.hjul, rub: "Välj hjul" });
        S.push({ t: "Tillval", typ: "g", gi: d.tv, rub: "Välj tillval", onsk: true });
      } else S.push({ t: "Tillval", typ: "tv", rub: "Tillval och önskemål" });
      S.push({ t: "Dina uppgifter", typ: "kund", rub: "Dina uppgifter" }, { t: "Sammanfattning", typ: "sum", rub: "Sammanfattning" });
      return S;
    }
    const STEGTEXT = { ov: "Det här ingår, och hur långt du kör per år.", g: "Priset uppdateras direkt när du väljer.", tv: "Välj tillval – priset uppdateras direkt.", kund: "Vi skickar beställningen till handlaren åt dig.", sum: "Kontrollera din beställning innan du skickar den." };
    // Förvalda val: det märket har förvalt (s) eller som ingår (i)
    function standardVal(cfg) {
      const val = {};
      if (cfg) cfg.G.forEach((g, gi) => {
        val[gi] = g.v.map((v, vi) => (v.s || v.i) ? vi : -1).filter(vi => vi >= 0);
        if (!g.m && val[gi].length > 1) val[gi] = [val[gi][0]];
        if (!g.m && !g.o && !val[gi].length) val[gi] = [0];
      });
      return val;
    }
    const sparNyckel = bil => "jp_bygg_" + slug(bil.marke + "-" + bil.modell);
    function lasSparad(bil) { try { return JSON.parse(localStorage.getItem(sparNyckel(bil)) || "null"); } catch (e) { return null; } }
    // Ikon för ett tillval utifrån namnet (egna symboler, inga märkesbilder)
    function tvIkon(n) {
      const I = [[/dragkrok/i, "🪝"], [/kamera|360/i, "📷"], [/fälg|hjul|däck/i, "🛞"], [/vinter|dubb/i, "❄️"], [/värm|klimat|ac\b/i, "🌡️"], [/ljud|högtal|harman|bose|bang|audio/i, "🔊"],
        [/ljus|led|matrix|strålkast/i, "💡"], [/säte|stol|läder|klädsel/i, "💺"], [/tak|panorama|glas/i, "☀️"], [/ruta|tonad|mörkton/i, "🕶️"], [/assist|parker|fil|radar|säkerhet|pilot/i, "🛡️"],
        [/navi|skärm|display|head.?up|infotain/i, "🖥️"], [/ladd|kabel|värmepump|batteri/i, "🔌"], [/service|care|garanti/i, "🔧"], [/paket|pack|edition|line/i, "📦"], [/hyra|leasingavgift/i, "💳"]];
      for (const [r, i] of I) if (r.test(n)) return i;
      return "✚";
    }
    function fargTyp(v) {
      const n = v.n.toLowerCase();
      if (/pärl|pearl|mica|crystal/.test(n)) return "Pärleffekt";
      if (/matt|exclusive|special|individual/.test(n)) return "Specialfärger";
      if (/metall/.test(n)) return "Metallic";
      return Object.values(v.p).some(x => x > 0) ? "Metallic" : "Solid";
    }
    // Vägen med bilen som kör längre ju fler mil du väljer
    const VAGBIL = `<svg viewBox="0 0 120 44" aria-hidden="true"><path d="M8 30c0-5 3-7 8-8l14-3 16-10c3-2 6-3 10-3h22c5 0 9 2 12 5l9 9 10 2c5 1 7 4 7 8v4c0 2-1 3-3 3H11c-2 0-3-1-3-3z" fill="#4C6178"/><path d="M50 11h14v9H36zm18 0h14c3 0 5 1 7 3l6 6H68z" fill="#C9D6E3"/><circle cx="31" cy="36" r="7.5" fill="#1B2431"/><circle cx="31" cy="36" r="3.4" fill="#AEB8C7"/><circle cx="93" cy="36" r="7.5" fill="#1B2431"/><circle cx="93" cy="36" r="3.4" fill="#AEB8C7"/></svg>`;
    function vagHtml(mv, diffs) {
      const i = Math.max(0, mv.indexOf(K.mil)), n = mv.length;
      const pos = n > 1 ? i / (n - 1) * 100 : 0;
      return `<div class="kvag"><div class="vagbana"><div class="vagbil" id="vagbil" style="left:calc(${pos}% * .8)">${VAGBIL}</div></div>
        ${n > 1 ? `<input type="range" id="kmilr" min="0" max="${n - 1}" step="1" value="${i}" aria-label="Körsträcka per år">` : ""}
        <div class="vagetiketter" style="grid-template-columns:repeat(${n},1fr)">${mv.map((m, j) => `<button type="button" data-mil="${j}" class="${j === i ? "vald" : ""}"><span>${m.toLocaleString("sv-SE")} mil/år</span><b>${diffs[j] ? plus(diffs[j]) : "+0 kr/mån"}</b></button>`).join("")}</div></div>`;
    }
    const RUBRIK = [["Välj ditt avtal", "Avtalstid och hur långt du kör per år."], ["Utrustning och tillval", "Välj det du vill ha – priset uppdateras direkt."], ["Dina uppgifter", "Vi skickar beställningen till handlaren åt dig."], ["Sammanfattning", "Kontrollera din beställning innan du skickar den."]];
    // Ungefärlig färg för färgprov utifrån färgens namn
    function farg(namn) {
      const n = namn.toLowerCase(), F = [
        [/pärlemor|pearl|crystal white|glacier|snö|arctic|polar|vit|white|blanc/, "#F4F4F2"], [/svart|black|noir|midnight|obsidian|onyx|nero/, "#16181B"],
        [/silver|platin|moon|ice|metal grey/, "#BFC4CA"], [/mörkgrå|grafit|graphite|dark grey|manganese|thunder|antracit|titan/, "#4A4F56"],
        [/grå|grey|gray|gris|stone|cement|asfalt|vapour|sand/, "#8C9299"], [/mörkblå|navy|denim|night blue|marin|deep blue|blue night/, "#1F2D4D"],
        [/blå|blue|bleu|azur|aqua|turkos|teal|petrol/, "#2F5D9E"], [/röd|red|rosso|rouge|ruby|crimson|flame|karmin/, "#A32222"],
        [/grön|green|forest|olive|jade|mint|khaki/, "#3F6B4C"], [/gul|yellow|gold|guld/, "#D6A520"], [/orange|copper|koppar|brons|bronze/, "#C56A2D"],
        [/brun|brown|beige|champagne|cappuccino/, "#8A6A4F"], [/lila|purple|violet/, "#5B3E7A"]];
      for (const [r, c] of F) if (r.test(n)) return c;
      return null;
    }
    function konfBild() {
      const { bil } = K, r = berakna();
      const fg = K.cfg ? K.cfg.G.findIndex(g => /färg|lack/i.test(g.g)) : -1;
      const vf = fg >= 0 && (K.val[fg] || []).length ? K.cfg.G[fg].v[K.val[fg][0]].n : "";
      const c = vf && farg(vf);
      document.getElementById("konfBild").innerHTML = `
        ${bil.foto ? `<img src="${bildUrl(bil, vf, 900)}" alt="${esc(bil.marke + " " + bil.modell)}">` : `<div class="kingen"><div><b>Helt ny modell</b><br><small>Fri bild finns ännu inte</small></div></div>`}
        <div class="kvnamn">${esc(bil.marke)} ${esc(bil.modell)}</div>
        <div class="kvkalla">Erbjudande från ${esc(bil.kalla)}</div>
        <div class="kchips"><span>36 månader</span><span>${K.mil.toLocaleString("sv-SE")} mil/år</span><span>0 kr kontantinsats</span>${r.nypris ? `<span>Nypris ${kr(r.nypris)}</span>` : ""}</div>
        <div class="kbildnot">${arRenderad(bil) ? "Bilden visar din bil i vald färg." : "Exempelbild av modellen. Din bil levereras ny, i den färg och med den utrustning du väljer här."}</div>
        ${vf ? `<div class="kvfarg">${c ? `<span class="sw" style="background:${c}"></span>` : ""}Vald färg: ${esc(vf)}</div>` : ""}`;
    }
    let K = null;   // { bil, cfg, steg, mil, val: {gruppIndex: [valIndex, ...]}, onskemal, kund: {...} }

    const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const plus = n => (n > 0 ? "+" : "") + kr(n) + "/mån";

    // Vilka körsträckor kan väljas för bilen?
    function milVal(bil, cfg) {
      if (cfg) return Object.keys(cfg.bas).map(Number).sort((a, b) => a - b);
      const lista = [bil.mil];
      if (bil.mer) Object.keys(bil.mer).map(Number).forEach(m => { if (m > bil.mil) lista.push(m); });
      return lista.sort((a, b) => a - b);
    }

    function oppnaKonf(bil) {
      stat("konf", bil);
      const cfg = bil.cfg ? KONFIG[bil.cfg] : null;
      const valdMil = mil ? Number(mil.value) : 1000;
      const mv = milVal(bil, cfg);
      const val = standardVal(cfg);
      K = { bil, cfg, S: byggSteg(bil, cfg), steg: 0, oppnad: Date.now(), mil: mv.includes(valdMil) ? valdMil : mv[0], val, tv: [], onskemal: "",
            kund: { namn: "", epost: "", tel: "", postnr: (MINPLATS && MINPLATS.postnr) || "", leverans: "Så snart som möjligt", samtycke: false, lokalok: false } };
      document.getElementById("konfTitel").textContent = bil.marke + " " + bil.modell;
      ritaKonf();
      konf.showModal();
    }

    // Räkna fram priset för det kunden har valt just nu
    function berakna() {
      const { bil, cfg, mil: m } = K;
      let manad, nypris = bil.nypris, forhojd = bil.forhojd, okand = false;
      const rader = [];
      if (cfg) {
        manad = cfg.bas[m];
        nypris = cfg.nypris ?? bil.nypris;
        cfg.G.forEach((g, gi) => (K.val[gi] || []).forEach(vi => {
          const v = g.v[vi], p = v.p[m] || 0;
          manad += p;
          if (/drivlina/i.test(g.g)) { if (v.t && cfg.nypris) nypris = nypris - cfg.nypris + v.t; }
          else if (v.t) nypris += v.t;
          if (/förhöjd/i.test(g.g)) forhojd = /10[ .]?000/.test(v.n) ? 10000 : 0;
          rader.push({ grupp: g.g, namn: v.n, pris: p, ingar: !!v.i });
        }));
      } else {
        manad = m <= bil.mil ? bil.manad : bil.manad + (bil.mer?.[m] ?? 0);
        (K.tv || []).forEach(i => { const t = bil.tv[i]; manad += t.p; rader.push({ grupp: "Tillval", namn: t.n, pris: t.p }); });
        if (K.onskemal.trim()) okand = true;
      }
      const adm = bil.adm || 0, fors = bil.forsakring || 0;
      const total = (manad + adm + fors) * 36 + bil.start + forhojd;
      const leasing = (manad + adm) * 36 + bil.start + forhojd;
      return { manad, adm, fors, forhojd, start: bil.start, total, nypris, andel: nypris ? leasing / nypris : null, rader, okand };
    }


    // Rutan "Ingår i priset" i steg 2
    function ingarRuta(bil) {
      const alltid = [`Privatleasing 36 mån, ${bil.mil.toLocaleString("sv-SE")} mil/år`, bil.service === true ? "Service ingår" : null].filter(Boolean);
      const lista = (bil.utr || []).concat(alltid);
      const not = bil.utr && bil.utr.length ? (bil.utrnot ? `<small>${esc(bil.utrnot)}</small>` : "")
        : `<small>${esc(bil.utrnot || (bil.cfg ? "Märket listar inte grundutrustningen här, se deras sida. Motor och utrustningsnivå väljer du nedan." : (bil.typ === "Märket" ? "Märket" : "Handlaren") + " har inte publicerat utrustningslistan för just den här bilen. Den står i avtalet, så du ser den innan du signerar."))} <a href="${ut(bil.url)}" target="_blank" rel="${rel(bil.url)}">Se sidan ↗</a></small>`;
      return `<div class="kgrupp"><h4>Utrustning som ingår</h4><ul class="kutr">${lista.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${not}</div>`;
    }
    // Checklistan "Det här ingår" (som Carplus faktasida)
    function checklista(bil) {
      const ja = ["Fast månadskostnad i 36 månader", "0 kr i kontantinsats", "Ny bil med nybilsgaranti"];
      const obs = [];
      if (bil.service === true) ja.push("Service ingår"); else if (bil.service === false) obs.push("Service ingår inte");
      if (bil.forsakring) obs.push(`Försäkring krävs: ${kr(bil.forsakring)}/mån (räknas in i priset)`);
      if (!bil.start) ja.push("Ingen uppläggningsavgift"); else obs.push(`Uppläggningsavgift ${kr(bil.start)}`);
      if (!bil.adm) ja.push("Ingen aviavgift"); else obs.push(`Aviavgift ${bil.adm} kr/mån (räknas in i priset)`);
      if (bil.forhojd) obs.push(`Förhöjd första hyra ${kr(bil.forhojd)}`);
      return `<ul class="kcheck">${ja.map(x => `<li>${esc(x)}</li>`).join("")}${obs.map(x => `<li class="obs">${esc(x)}</li>`).join("")}</ul>`;
    }
    function ritaKonf() {
      const { bil, cfg, steg, S } = K, st = S[steg];
      const r = berakna();
      document.getElementById("konfSteg").innerHTML = S.map((x, i) => `<button type="button" data-steg="${i}" class="${i === steg ? "akt" : i < steg ? "klar" : ""}" ${i < steg ? "" : "tabindex=-1"} ${i === steg ? 'aria-current="step"' : ""}><i>${i < steg ? "✓" : i + 1}</i><span>${x.t}</span></button>`).join("");
      const antal = st.typ === "g" ? st.gi.reduce((a, gi) => a + cfg.G[gi].v.length, 0) : st.typ === "tv" ? (bil.tv || []).length : 0;
      let h = K.skickad ? "" : `<p class="kstegnr">Steg ${steg + 1} av ${S.length}</p><h3>${st.rub}${antal > 1 ? ` <b class="kantal">(${antal} st)</b>` : ""}</h3><p class="kunder">${STEGTEXT[st.typ]}</p>`;
      if (st.typ === "g" || st.typ === "tv") {
        const sparad = lasSparad(bil);
        h += `<div class="kverktyg"><button type="button" data-k="aterstall">↺ Återställ till standard</button><button type="button" data-k="spara">♡ Spara byggd bil</button>${sparad ? `<button type="button" data-k="ladda">⤓ Ladda sparad bil</button>` : ""}</div>`;
      }
      if (st.typ === "ov") {
        const mv = milVal(bil, cfg);
        const diffs = mv.map(m => cfg ? cfg.bas[m] - cfg.bas[mv[0]] : (m <= bil.mil ? 0 : bil.mer[m]));
        h += `${bil.andel != null && bil.andel < .45 ? `<div class="kkampanj">🔥 Kampanjpris – ${pct(bil.andel)} av nypriset på 36 månader</div>` : ""}`;
        h += `<div class="kgrupp"><h4>Det här ingår</h4>${checklista(bil)}</div>`;
        h += `<div class="kgrupp"><h4>Välj körsträcka</h4>${vagHtml(mv, diffs)}` + (mv.length === 1 ? `<small>Fler mil går ofta att välja mot en högre månadskostnad. Skriv det under önskemål, så räknar handlaren på det.</small>` : "") + `</div>`;
        h += `<div class="kgrupp"><h4>Avtal</h4><div class="kseg"><label><input type="radio" checked disabled><b>36 mån</b><small>Avtalstid</small></label><label><input type="radio" checked disabled><b>0 kr</b><small>Kontantinsats</small></label></div></div>`;
        h += ingarRuta(bil);
        h += `<div class="kinfo"><b>Villkor:</b> ${esc(bil.not || "se erbjudandet")}${bil.start ? `. Uppläggningsavgift ${kr(bil.start)}` : ""}${bil.adm ? `, aviavgift ${bil.adm} kr/mån` : ""}.</div>`;
      }
      if (st.typ === "g") {
        h += st.gi.map(gi => {
          const g = cfg.G[gi], typ = g.m ? "checkbox" : "radio", vals = K.val[gi] || [];
          const prisTxt = v => { const p = v.p[K.mil] || 0; return v.i ? "Ingår" : p ? plus(p) : "+0 kr/mån"; };
          const rubrik = st.gi.length > 1 || st.farg ? "" : "";
          if (/färg|lack/i.test(g.g)) {
            const grp = {};
            g.v.forEach((v, vi) => (grp[fargTyp(v)] = grp[fargTyp(v)] || []).push(vi));
            const vald = vals.length ? g.v[vals[0]] : null;
            return `<div class="kgrupp kfarger">` + ["Solid", "Metallic", "Pärleffekt", "Specialfärger"].filter(t => grp[t]).map(t => `<h4>${t}</h4><div class="kswatch">` + grp[t].map(vi => {
              const v = g.v[vi], c = farg(v.n);
              return `<label class="ksw" title="${esc(v.n)}"><input type="radio" name="g${gi}" value="${vi}" ${vals.includes(vi) ? "checked" : ""}><i style="${c ? `background:${c}` : ""}" class="${c ? "" : "okand"}"></i><span class="sr">${esc(v.n)}</span></label>`;
            }).join("") + `</div>`).join("") + `<div class="kvalbox" data-g="${gi}">${vald ? `<b>${esc(vald.n)}</b><span>${prisTxt(vald)}</span>` : "<b>Välj en färg</b>"}</div></div>`;
          }
          if (g.m || /tillval|paket|care/i.test(g.g)) {
            return `<div class="kgrupp"><h4>${esc(g.g)}</h4><div class="tvgrid">` + g.v.map((v, vi) => `<label class="tvkort"><input type="${typ}" name="g${gi}" value="${vi}" ${vals.includes(vi) ? "checked" : ""} ${v.i ? "disabled" : ""}><span class="tvikon">${tvIkon(v.n + " " + g.g)}</span><b>${esc(v.n)}</b>${v.d && v.d !== v.n ? `<small>${esc(v.d.length > 150 ? v.d.slice(0, 147) + "…" : v.d)}</small>` : "<small></small>"}<span class="tvpris">${prisTxt(v)}</span><span class="tvknapp"></span></label>`).join("") + `</div></div>`;
          }
          const ingen = (!g.m && g.o) ? `<label class="kval"><input type="radio" name="g${gi}" value="-1" ${!vals.length ? "checked" : ""}><span>Inget ${esc(g.g.toLowerCase())}</span><span class="kp">+0 kr/mån</span></label>` : "";
          return `<div class="kgrupp"><h4>${esc(g.g)}</h4>${ingen}` + g.v.map((v, vi) => `<label class="kval"><input type="radio" name="g${gi}" value="${vi}" ${vals.includes(vi) ? "checked" : ""} ${v.i ? "disabled" : ""}><span><span class="namnrad">${esc(v.n)}${v.s ? ` <em class="kstd">Standard</em>` : ""}${v.d ? `<small>${esc(v.d)}</small>` : ""}</span></span><span class="kp ${v.i ? "ingar" : ""}">${prisTxt(v)}</span></label>`).join("") + `</div>`;
        }).join("");
        if (st.onsk) h += `<div class="kgrupp"><h4>Övriga önskemål eller bortval</h4><div class="kform"><textarea class="hel" id="konsk" rows="3" placeholder="T.ex. leverans före ett visst datum eller utrustning du inte vill ha">${esc(K.onskemal)}</textarea></div></div>`;
      }
      if (st.typ === "tv") {
        if (bil.tv && bil.tv.length) h += `<div class="kgrupp"><h4>Tillval</h4><div class="tvgrid">` + bil.tv.map((t, i) => `<label class="tvkort"><input type="checkbox" name="ktv" value="${i}" ${K.tv.includes(i) ? "checked" : ""}><span class="tvikon">${tvIkon(t.n)}</span><b>${esc(t.n)}</b><small></small><span class="tvpris">${plus(t.p)}</span><span class="tvknapp"></span></label>`).join("") + `</div></div>`;
        h += `<div class="kinfo">${bil.tv && bil.tv.length ? "Fler tillval än ovan" : `Den här ${bil.typ === "Märket" ? "tillverkaren" : "handlaren"} har inte publicerat priser för tillval, men du`} kan önska färg, vinterhjul, dragkrok eller paket nedan. Handlaren lägger in det med pris i avtalet, och du ser det innan du signerar.</div>`;
        h += `<div class="kgrupp"><h4>Önskad utrustning, tillval och bortval</h4><div class="kform"><textarea class="hel" id="konsk" rows="5" placeholder="T.ex. metalliclack i blått, dubbade vinterhjul, dragkrok">${esc(K.onskemal)}</textarea></div></div>`;
      }
      if (st.typ === "kund") {
        const k = K.kund;
        h += `<div class="kform" style="margin-top:12px">
          <div><label for="kn">Namn</label><input id="kn" autocomplete="name" value="${esc(k.namn)}"></div>
          <div><label for="ke">E-post</label><input id="ke" type="email" autocomplete="email" value="${esc(k.epost)}"></div>
          <div><label for="kt">Telefon</label><input id="kt" type="tel" autocomplete="tel" value="${esc(k.tel)}"></div>
          <div><label for="kpn">Postnummer (för närmaste handlare)</label><input id="kpn" inputmode="numeric" autocomplete="postal-code" value="${esc(k.postnr)}"></div>
          <div class="hel"><label for="kl">När vill du ha bilen?</label><select id="kl">${["Så snart som möjligt", "Inom 3 månader", "Inom 6 månader", "Jag är flexibel"].map(o => `<option ${o === k.leverans ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          ${bil.lokal ? `<label class="hel ksamtycke klokal"><input type="checkbox" id="klok" ${k.lokalok ? "checked" : ""}><span><b>Lokalt erbjudande:</b> jag förstår att bilen hämtas och lämnas tillbaka hos ${esc(bil.kalla.split(/ \(| via /)[0])}${bil.orttext ? " (" + esc(bil.orttext) + ")" : ""}, om handlaren inte erbjuder leverans.</span></label>` : ""}
          <label class="hel ksamtycke"><input type="checkbox" id="ks" ${k.samtycke ? "checked" : ""}><span>Jag godkänner att Jämföra Privatleasing skickar mina uppgifter och min beställning till handlaren, så att de kan skicka mitt leasingavtal. Uppgifterna används inte till något annat (<a href="integritetspolicy.html" target="_blank">integritetspolicy</a>).</span></label>
        </div><div class="kinfo">Du behöver inte lämna personnummer här. Kreditprövning och signering görs med BankID hos leasingbolaget.</div>`;
      }
      if (st.typ === "sum") {
        const k = K.kund, rad = (t, v) => v === "" ? `<tr><td colspan="2" style="text-align:left;font-weight:400">${t}</td></tr>` : `<tr><td>${t}</td><td>${v}</td></tr>`;
        const utr = r.rader.filter(x => x.pris || x.ingar || !/drivlina|färg/i.test(x.grupp)).map(x => rad(`${esc(x.grupp)}: ${esc(x.namn)}`, x.ingar ? "Ingår" : plus(x.pris)))
          .concat(r.rader.filter(x => /drivlina|färg/i.test(x.grupp) && !x.pris).map(x => rad(`${esc(x.grupp)}: ${esc(x.namn)}`, "Ingår i priset")));
        h += `<div class="kkvitto">
          <section><h5>Bil och avtal</h5><table class="ktabell">
            ${rad(`<b>${esc(bil.marke)} ${esc(bil.modell)}</b>`, "")}
            ${rad("Privatleasing", "36 månader")}${rad("Körsträcka", K.mil.toLocaleString("sv-SE") + " mil/år")}${rad("Grundpris", kr(cfg ? cfg.bas[K.mil] : r.manad) + "/mån")}
            ${rad("Erbjudande från", esc(bil.kalla))}</table></section>
          ${utr.length || K.onskemal.trim() ? `<section><h5>Din utrustning</h5><table class="ktabell">${utr.join("")}${K.onskemal.trim() ? rad(`Önskemål: ${esc(K.onskemal)}`, cfg ? "" : "Pris från handlaren") : ""}</table></section>` : ""}
          <section><h5>Levereras till</h5><table class="ktabell">${rad(esc(k.namn), "")}${rad(esc(k.epost) + " · " + esc(k.tel), "")}${rad("Postnummer " + esc(k.postnr) + " · " + esc(k.leverans), "")}</table></section>
          <section class="ktot"><table class="ktabell">
            ${r.adm ? rad("Aviavgift", r.adm + " kr/mån") : ""}${r.fors ? rad("Obligatorisk försäkring", r.fors + " kr/mån") : ""}
            ${r.forhojd ? rad("Första förhöjd hyra", kr(r.forhojd)) : ""}${r.start ? rad("Uppläggningsavgift", kr(r.start)) : ""}
            ${rad("Totalt på 36 månader", kr(r.total))}
            ${r.nypris ? rad("Bilens nypris med dina val", `${kr(r.nypris)} (du betalar ${pct(r.andel)})`) : ""}
            <tr class="stor"><td>Per månad</td><td>${kr(r.manad + r.adm + r.fors)}</td></tr></table></section>
        </div>
        <div class="ktrygg"><div><b>Inte bindande</b>Inget gäller förrän du signerat avtalet.</div><div><b>Signera med BankID</b>Handlaren skickar avtalet till dig.</div><div><b>Helt gratis</b>Jämföra Privatleasing kostar inget för dig.</div></div>
        ${r.okand ? `<div class="kinfo">Priset för dina önskemål står i avtalet från handlaren.</div>` : ""}
        <div id="kskicka"></div>`;
      }
      document.getElementById("konfBody").innerHTML = h;
      konfBild();
      document.getElementById("konfBild").classList.toggle("kompakt", !(st.typ === "ov" || st.farg));
      document.getElementById("konfBild").classList.toggle("fargsteg", !!st.farg);
      document.getElementById("konfSum").innerHTML = sumHtml(r);
      document.getElementById("konfBak").style.visibility = steg ? "visible" : "hidden";
      document.getElementById("konfNasta").textContent = st.typ === "sum" ? (innerWidth < 600 ? "Skicka" : "Skicka beställningen") : (innerWidth < 600 ? "Nästa →" : "Nästa: " + S[steg + 1].t + " →");
      document.getElementById("konfPanel").scrollTop = 0;
      konf.querySelector(".kgrid").scrollTop = 0;
    }

    // Fältet längst ned: bilen, totalt och per månad (som Audis konfigurator)
    function sumHtml(r) {
      const { bil, cfg } = K;
      const vg = cfg ? cfg.G.findIndex(g => /drivlina|utrustningsnivå/i.test(g.g)) : -1;
      const ver = vg >= 0 && (K.val[vg] || []).length ? cfg.G[vg].v[K.val[vg][0]].n : `${K.mil.toLocaleString("sv-SE")} mil/år · 36 mån`;
      return `<div class="ksumbil"><b>${esc(bil.marke)} ${esc(bil.modell)}</b><small>${esc(ver)}</small></div>
        <div class="ksumtal"><span><small>Totalt 36 mån</small><b>${kr(r.total)}</b></span><span class="ksummanad"><small>Per månad</small><b>${kr(r.manad + r.adm + r.fors)}</b>${r.okand ? `<small>+ önskemål</small>` : ""}</span></div>`;
    }
    function uppdLive() {
      const r = berakna();
      konfBild();
      document.getElementById("konfSum").innerHTML = sumHtml(r);
      konf.querySelectorAll(".kvalbox[data-g]").forEach(box => {
        const gi = Number(box.dataset.g), g = K.cfg.G[gi], v = (K.val[gi] || []).length ? g.v[K.val[gi][0]] : null, p = v ? (v.p[K.mil] || 0) : 0;
        box.innerHTML = v ? `<b>${esc(v.n)}</b><span>${v.i ? "Ingår" : p ? plus(p) : "+0 kr/mån"}</span>` : "<b>Välj en färg</b>";
      });
      const vb = document.getElementById("vagbil"), rr = document.getElementById("kmilr");
      if (vb && rr) {
        const n = Number(rr.max) || 1, i = Number(rr.value);
        vb.style.left = `calc(${i / n * 100}% * .8)`;
        konf.querySelectorAll(".vagetiketter button").forEach((b, j) => b.classList.toggle("vald", j === i));
      }
    }

    // Läs av det kunden har fyllt i på aktuellt steg
    function lasKonf() {
      const q = id => document.getElementById(id);
      const typ = K.S[K.steg].typ;
      if (typ === "ov") { const v = q("kmilr"); if (v) K.mil = milVal(K.bil, K.cfg)[Number(v.value)]; }
      if (typ === "g" || typ === "tv") {
        if (K.cfg) K.cfg.G.forEach((g, gi) => {
          const inp = [...konf.querySelectorAll(`input[name="g${gi}"]`)];
          if (inp.length) K.val[gi] = inp.filter(i => i.checked && i.value !== "-1").map(i => Number(i.value));
        });
        if (q("konsk")) K.onskemal = q("konsk").value;
        if (!K.cfg) K.tv = [...konf.querySelectorAll('input[name="ktv"]')].filter(i => i.checked).map(i => Number(i.value));
      }
      if (typ === "kund") Object.assign(K.kund, { namn: q("kn").value.trim(), epost: q("ke").value.trim(), tel: q("kt").value.trim(), postnr: q("kpn").value.trim(), leverans: q("kl").value, samtycke: q("ks").checked, lokalok: q("klok") ? q("klok").checked : true });
    }

    function bestallningText() {
      const { bil, kund } = K, r = berakna();
      return [
        "BESTÄLLNING AV PRIVATLEASING – via Jämföra Privatleasing",
        "",
        `Bil: ${bil.marke} ${bil.modell}`,
        `Erbjudande: ${bil.kalla} – ${bil.url}`,
        `Avtal: privatleasing 36 månader, ${K.mil.toLocaleString("sv-SE")} mil/år`,
        ...r.rader.map(x => `${x.grupp}: ${x.namn}${x.ingar ? " (ingår)" : x.pris ? ` (+${x.pris} kr/mån)` : ""}`),
        K.onskemal.trim() ? `Önskemål/bortval: ${K.onskemal.trim()}` : null,
        "",
        `Pris enligt erbjudandet (kontrollerat ${KONTROLL}): ${kr(r.manad)}/mån${r.adm ? ` + aviavgift ${r.adm} kr/mån` : ""}${r.fors ? ` + försäkring ${r.fors} kr/mån` : ""}`,
        r.forhojd ? `Första förhöjd hyra: ${kr(r.forhojd)}` : null,
        r.start ? `Uppläggningsavgift: ${kr(r.start)}` : null,
        `Totalt 36 mån: ${kr(r.total)}`,
        "",
        `Kund: ${kund.namn}`, `E-post: ${kund.epost}`, `Telefon: ${kund.tel}`, `Postnummer: ${kund.postnr}`, bil.lokal ? `Lokalt erbjudande – kunden har bekräftat att bilen hämtas hos ${bil.kalla}${bil.orttext ? " (" + bil.orttext + ")" : ""}` : `Märkets erbjudande – hela Sverige, välj handlare nära kundens postnummer`, `Önskad leverans: ${kund.leverans}`,
        "",
        "Kunden vill få leasingavtalet skickat för signering med BankID.",
      ].filter(rad => rad !== null).join("\n");
    }

    function visaKopiera(ruta, text, rubrik) {
      ruta.innerHTML = `<div class="kinfo"><b>${rubrik}</b> Kopiera beställningen och skicka den till handlaren via länken, så får du avtalet att signera.<br><br>
        <button type="button" class="cta" id="kkopiera">Kopiera beställningen</button>
        <a class="ext" href="${ut(K.bil.url)}" target="_blank" rel="${rel(K.bil.url)}">Öppna ${K.bil.typ === "Märket" ? "märkets" : "handlarens"} sida ↗</a>${arAff(K.bil.url) ? ` <small class="annons">Annonslänk</small>` : ""}</div>
        <textarea readonly rows="8" style="width:100%;box-sizing:border-box;margin-top:8px;font:13px/1.4 monospace;border:1px solid var(--line);border-radius:8px;padding:8px">${esc(text)}</textarea>`;
      document.getElementById("kkopiera").onclick = async e => {
        try { await navigator.clipboard.writeText(text); e.target.textContent = "Kopierat ✓"; }
        catch (err) { ruta.querySelector("textarea").select(); e.target.textContent = "Markerad – kopiera med Ctrl/Cmd+C"; }
      };
    }

    async function skicka() {
      if (K.skickad) return;
      const text = bestallningText(), r = berakna(), { bil, kund } = K;
      const ruta = document.getElementById("kskicka"), knapp = document.getElementById("konfNasta");
      if (!LIVE) { visaKopiera(ruta, text, "Beställningen är klar."); return; }
      knapp.disabled = true; knapp.textContent = "Skickar…";
      try {
        const svar = await fetch("bestall.php", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ typ: "bestallning", bil: `${bil.marke} ${bil.modell}`, namn: kund.namn, epost: kund.epost, tel: kund.tel,
            samtycke: kund.samtycke, text, handlare: bil.handlare || "", oppnad: K.oppnad, webbplats: "" }),
        });
        const data = await svar.json().catch(() => ({}));
        if (!svar.ok || String(data.success) === "false") throw new Error(data.message || svar.status);
        K.skickad = true;
        document.getElementById("konfBody").innerHTML = `<div class="kklar"><div class="bock">✓</div><h3>Tack, ${esc(kund.namn.split(" ")[0])}! Beställningen är skickad.</h3><p>Vi har skickat din beställning av ${esc(bil.marke)} ${esc(bil.modell)} till handlaren. En bekräftelse har gått till ${esc(kund.epost)}.</p><div class="kinfo" style="text-align:left"><b>Nästa steg:</b> Handlaren kontaktar dig och skickar avtalet. Du godkänner det med BankID. Inget är bindande förrän du har signerat.</div></div>`;
        document.getElementById("konfBak").style.visibility = "hidden";
        knapp.textContent = "Skickad ✓"; stat("bestall", K.bil);
      } catch (err) {
        knapp.disabled = false; knapp.textContent = "Försök igen";
        visaKopiera(ruta, text, "Beställningen kunde inte skickas just nu.");
      }
    }

    document.getElementById("konfNasta").onclick = () => {
      lasKonf();
      if (K.S[K.steg].typ === "kund") {
        const k = K.kund, fel = [];
        if (!k.namn) fel.push("namn");
        if (!/^\S+@\S+\.\S+$/.test(k.epost)) fel.push("en giltig e-post");
        if (k.tel.replace(/\D/g, "").length < 7) fel.push("telefon");
        if (!/^\d{3}\s?\d{2}$/.test(k.postnr)) fel.push("postnummer (5 siffror)");
        if (K.bil.lokal && !k.lokalok) fel.push("att du förstår var bilen hämtas");
        if (!k.samtycke) fel.push("ditt godkännande");
        if (fel.length) { alertRuta("Fyll i " + fel.join(", ") + "."); return; }
      }
      if (K.S[K.steg].typ === "sum") { skicka(); return; }
      K.steg++; ritaKonf();
    };
    function alertRuta(t) {
      let f = konf.querySelector(".kfel");
      if (!f) { f = document.createElement("div"); f.className = "kfel"; document.getElementById("konfBody").appendChild(f); }
      f.textContent = t; f.scrollIntoView({ block: "nearest" });
    }
    document.getElementById("konfBak").onclick = () => { lasKonf(); K.steg--; ritaKonf(); };
    document.getElementById("konfSteg").onclick = e => { const b = e.target.closest("button.klar"); if (!b || K.skickad) return; lasKonf(); K.steg = Number(b.dataset.steg); ritaKonf(); };
    document.getElementById("konfStang").onclick = () => konf.close();
    konf.addEventListener("click", e => { if (e.target === konf) konf.close(); });
    // Uppdatera priset direkt när kunden klickar i ett val
    konf.addEventListener("change", () => { const t = K.S[K.steg].typ; lasKonf(); if (t !== "kund" && t !== "sum") uppdLive(); });
    konf.addEventListener("input", e => { if (e.target.id === "kmilr") { lasKonf(); uppdLive(); } });
    // Knappar i konfiguratorn: körsträcka, återställ, spara och ladda byggd bil
    document.getElementById("konfBody").addEventListener("click", e => {
      const mb = e.target.closest("button[data-mil]");
      if (mb) { const rr = document.getElementById("kmilr"); if (rr) { rr.value = mb.dataset.mil; lasKonf(); uppdLive(); } return; }
      const b = e.target.closest("button[data-k]"); if (!b) return;
      lasKonf();
      if (b.dataset.k === "aterstall") { K.val = standardVal(K.cfg); K.tv = []; K.onskemal = ""; ritaKonf(); }
      if (b.dataset.k === "spara") {
        try { localStorage.setItem(sparNyckel(K.bil), JSON.stringify({ mil: K.mil, val: K.val, tv: K.tv, onskemal: K.onskemal })); b.textContent = "✓ Sparad i din webbläsare"; }
        catch (err) { b.textContent = "Kunde inte spara här"; }
      }
      if (b.dataset.k === "ladda") { const sp = lasSparad(K.bil); if (sp) { Object.assign(K, { mil: sp.mil ?? K.mil, val: sp.val || K.val, tv: sp.tv || [], onskemal: sp.onskemal || "" }); ritaKonf(); } }
    });
    if (lista) lista.addEventListener("click", e => { const b = e.target.closest("button[data-bil]"); if (b) oppnaKonf(BILAR[Number(b.dataset.bil)]); });


    // Sveriges mest privatleasade bilar 2026 (VW Finans jan–maj, Carplus kv1, Mobility Sweden jan–aug)
    const TOPP = [
      { namn: "Volvo EX40", k: "volvo-ex40" }, { namn: "Volvo EX30", k: "volvo-ex30" }, { namn: "Volkswagen Tiguan", k: "volkswagen-tiguan" },
      { namn: "Tesla Model Y", k: "tesla-model-y" }, { namn: "Volvo XC60", k: "volvo-xc60" },
    ];
    // Visar det billigaste erbjudandet (faktisk kostnad, känd körsträcka) på varje modell och hur många erbjudanden modellsidan har.
    // Beror inte på filter eller sparade val, och bilderna laddas direkt – korten ska alltid synas.
    function ritaTopp() {
      const el = document.getElementById("topp"); if (!el) return;
      el.innerHTML = TOPP.map((t, i) => {
        if (!MODELLER[t.k]) return "";
        const s = modellSammanfattning(t.k), b = s.bast, antal = s.antal;
        const bt = b.nypris ? betyg((b.total - (b.forsakring || 0) * 36) / b.nypris) : null;
        const version = b.modell.replace(new RegExp("^" + b.mnamn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i"), "");
        return `<article class="tkort">
          <a class="tbild" href="${b.msida}">${b.foto ? `<img src="${bildUrl(b, "", 600)}" alt="${t.namn}" width="480" height="300" decoding="async"${i < 2 ? ' fetchpriority="high"' : ""}>` : ""}<span class="tplats">#${i + 1} mest leasade</span></a>
          <div class="tinner">
            <div class="thuvud">
              <div><div class="tnamn">${t.namn}</div><div class="tversion">${esc(version) || "&nbsp;"}</div></div>
              <div class="tfran">Från<div class="tpris">${kr(b.m).replace(" kr", "")}:-<small>/mån</small><sup class="fn"><a href="#villkor">1</a></sup></div></div>
            </div>
            <div class="tchips"><span>36 månader</span><span>${b.milokand ? "Körsträcka: fråga handlaren" : b.mil.toLocaleString("sv-SE") + " mil/år"}</span>${b.forhojd ? `<span>${kr(b.forhojd)} vid start</span>` : ""}</div>
            <div class="ttotal">${kr(b.total)} totalt · ${/\bvia\b/.test(b.kalla) ? "" : "hos "}${esc(b.kalla.split(/ \(|,/)[0])}${antal > 1 ? ` · billigast av ${antal}` : ""}</div>
            <div class="tfot">${bt ? `<span class="betyg ${bt.klass}">${bt.text} · ${pct((b.total - (b.forsakring || 0) * 36) / b.nypris)}</span>` : "<span></span>"}<a class="cta" href="${b.msida}">${antal > 1 ? "Jämför " + antal + " →" : "Till erbjudandet →"}</a></div>
          </div>
        </article>`;
      }).join("");
    }
    if (document.getElementById("topp")) document.getElementById("topp").addEventListener("click", e => { const b = e.target.closest("button[data-bil]"); if (b) oppnaKonf(BILAR[Number(b.dataset.bil)]); });
    if (document.getElementById("trust")) document.getElementById("trust").innerHTML = `<span>${BILAR.length} erbjudanden på ${Object.keys(MODELLER).length} modeller</span><span>Kontrollerat ${KONTROLL}</span><span>Bara riktig privatleasing</span><span>Inga betalda placeringar</span>`;
    if (document.getElementById("fotforetag")) document.getElementById("fotforetag").innerHTML = [FORETAG.namn + " (enskild firma)", FORETAG.orgnr && "Org.nr " + FORETAG.orgnr, FORETAG.epost].filter(Boolean).map(esc).join("<br>");
    // ---------- Jämför handlare: alla erbjudanden på en modell, billigast först ----------
    const jamfor = document.getElementById("jamfor");
    let jmfRegion = "Alla", jmfMil = 0, jmfFors = 0, jmfVisa = 20;
    try { jmfFors = Number(localStorage.getItem("jp_fors")) || 0; } catch (e) {}
    const MAN = ["jan", "feb", "mars", "apr", "maj", "juni", "juli", "aug", "sep", "okt", "nov", "dec"];
    const datumKort = d => { const [, m, dag] = d.split("-"); return Number(dag) + " " + MAN[Number(m) - 1]; };
    // Prishistorik: lägsta faktiska månadskostnad per dag (prishistorik.js, fylls på av den dagliga kontrollen)
    function histHtml(k) {
      const h = (typeof PRISHIST !== "undefined" && PRISHIST[k]) || [];
      if (h.length < 2) return "";
      const nu = h[h.length - 1], forr = h[h.length - 2], forst = h[0], lagst = Math.min(...h.map(x => x[1])), hogst = Math.max(...h.map(x => x[1]));
      let andr = [...h].reverse().find(x => x[1] !== nu[1]);
      const diff = andr ? nu[1] - andr[1] : 0;
      const w = 220, hh = 44, n = h.length, sx = i => 4 + i * (w - 8) / Math.max(1, n - 1), sy = v => hogst === lagst ? hh / 2 : 6 + (hogst - v) * (hh - 12) / (hogst - lagst);
      const linje = h.map((x, i) => (i ? "L" : "M") + sx(i).toFixed(1) + " " + sy(x[1]).toFixed(1)).join(" ");
      return `<section class="jmfhist"><div><b>Lägsta pris över tid</b>
        <p>${diff ? `<span class="${diff < 0 ? "ned" : "upp"}">${diff < 0 ? "↓ " + kr(-diff) + " lägre" : "↑ " + kr(diff) + " högre"}</span> än ${datumKort(andr[0])}. ` : `Oförändrat sedan ${datumKort(forst[0])}. `}Lägst ${kr(lagst)}/mån, högst ${kr(hogst)}/mån sedan vi började mäta ${datumKort(forst[0])}.</p></div>
        <svg viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}" role="img" aria-label="Kurva över lägsta pris per dag"><path d="${linje}" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${sx(n - 1).toFixed(1)}" cy="${sy(nu[1]).toFixed(1)}" r="3.5" fill="currentColor"/></svg></section>`;
    }
    function ritaJamfor() {
      const mk = document.body.dataset.modell, grund = MODELLER[mk] || [];
      if (!grund.length) { jamfor.innerHTML = `<p>Just nu finns inga erbjudanden på den här modellen. <a href="alla-bilar.html">Se alla bilar →</a></p>`; return; }
      // Körsträckor som går att välja: de som minst ett erbjudande har pris för
      const milval = [...new Set(grund.filter(b => !b.milokand).flatMap(b => [b.mil, ...(b.milharledd ? [] : Object.keys(b.mer || {}).map(Number))]))].sort((a, b) => a - b);
      if (!milval.includes(jmfMil)) jmfMil = 0;
      const alla = grund.map(bil => {
        const vald = jmfMil || bil.mil;
        const pm = bil.milokand ? (jmfMil ? null : bil.manad + bil.adm) : (bil.milharledd && vald > bil.mil ? null : manadFor(bil, vald));   // härledd körsträcka: vi lånar inte märkets tillägg för fler mil   // null = säljaren har inget pris för den körsträckan
        const fors = bil.forsakring || jmfFors;
        const m = pm == null ? null : pm + (bil.forsakring || 0);
        const total = m == null ? null : m * 36 + bil.start + bil.forhojd;
        const medfors = total == null ? null : total + (bil.forsakring ? 0 : jmfFors * 36);
        const ingar = bil.milokand ? null : Math.max(bil.mil, vald);
        return { ...bil, m, total, medfors, ingar, eff: medfors == null ? null : medfors / 36, krmil: total == null || bil.milokand ? null : medfors / (ingar * 3),
          andel: total != null && bil.nypris && !jmfMil ? (total - (bil.forsakring || 0) * 36) / bil.nypris : null, avst: avstand(bil) };
      });
      const kanda = alla.filter(r => !r.milokand && r.eff != null);
      const b0 = alla[0], lagst = kanda.length ? Math.min(...kanda.map(r => r.eff)) : null;
      const lan = {}; alla.forEach(r => r.lan.forEach(l => lan[l] = (lan[l] || 0) + 1));
      const lankn = Object.keys(lan).sort((a, b) => (a === "Hela Sverige" ? -1 : b === "Hela Sverige" ? 1 : a.localeCompare(b, "sv")));
      if (jmfRegion !== "Alla" && !lan[jmfRegion]) jmfRegion = "Alla";
      const sortSel = document.getElementById("jmfsort"), s = sortSel ? sortSel.value : "manad";
      // Väljer man ett län visas även erbjudanden som gäller i hela landet – de går att hämta där också
      let rader = alla.filter(r => jmfRegion === "Alla" || r.lan.includes(jmfRegion) || (jmfRegion !== "Hela Sverige" && r.lan[0] === "Hela Sverige"));
      const big = Number.MAX_SAFE_INTEGER, e = r => r.eff ?? big;
      rader.sort((a, b) => s === "krmil" ? (a.krmil ?? big) - (b.krmil ?? big) : s === "total" ? (a.medfors ?? big) - (b.medfors ?? big) : s === "nara" ? (a.avst ?? (a.lokal ? big : -1)) - (b.avst ?? (b.lokal ? big : -1)) || e(a) - e(b) : e(a) - e(b) || (a.milokand ? 1 : 0) - (b.milokand ? 1 : 0) || (a.m ?? big) - (b.m ?? big));
      const tal = n => n.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const milTxt = n => n.toLocaleString("sv-SE") + " mil/år";
      const bast = kanda.length ? [...kanda].sort((a, b) => a.eff - b.eff)[0] : null;
      jamfor.innerHTML = `
        <h2 class="jmfrub">${alla.length} ${alla.length === 1 ? "erbjudande" : "erbjudanden"} på ${esc(b0.mnamn)}</h2>
        <div class="jmfdin">
          ${milval.length > 1 ? `<div><label>Hur långt kör du per år?</label><div class="chips" id="jmfmil"><button type="button" data-mil="0" class="${!jmfMil ? "vald" : ""}">Som i erbjudandet</button>${milval.map(v => `<button type="button" data-mil="${v}" class="${jmfMil === v ? "vald" : ""}">${milTxt(v)}</button>`).join("")}</div></div>` : ""}
          <div><label for="jmffors">Din bilförsäkring, kr/mån <small>(valfritt – räknas in där den inte redan ingår)</small></label><input id="jmffors" type="number" inputmode="numeric" min="0" step="50" value="${jmfFors || ""}" placeholder="t.ex. 600"></div>
        </div>
        <div class="jmfkontroll">
          <select id="jmfsort" aria-label="Sortera erbjudandena">
            <option value="manad">Lägsta faktiska månadskostnad</option><option value="total">Lägsta totalkostnad</option><option value="krmil">Lägsta pris per mil</option>${MINPLATS ? `<option value="nara">Närmast mig</option>` : ""}
          </select>
          ${lankn.length > 1 ? `<div class="jmfregion"><span>Region:</span><button type="button" data-lan="Alla" class="${jmfRegion === "Alla" ? "vald" : ""}">Alla</button>${lankn.map(l => `<button type="button" data-lan="${esc(l)}" class="${jmfRegion === l ? "vald" : ""}">${esc(l)} <i>${lan[l]}</i></button>`).join("")}</div>` : ""}
        </div>
        ${jmfRegion !== "Alla" && jmfRegion !== "Hela Sverige" && rader.some(r => r.lan[0] === "Hela Sverige") ? `<p class="jmfnot">Erbjudanden som gäller i hela Sverige visas också – de hämtas hos närmaste märkeshandlare.</p>` : ""}
        <div class="jmflista">${rader.slice(0, jmfVisa).map(r => {
          const billigast = lagst != null && r.eff === lagst && !r.milokand, handlare = esc(r.kalla.split(/ \(|,/)[0]);
          const plats = !r.lokal ? "Hela Sverige – hämtas hos närmaste märkeshandlare" : r.orter ? r.orter.slice(0, 3).join(", ") + (r.orter.length > 3 ? " m.fl." : "") + (r.lan.length === 1 && !r.orter.includes(r.lan[0]) ? ", " + r.lan[0] : "") : "Lokal handlare – fråga var bilen hämtas";
          const bt = betyg(r.andel);
          const extra = r.forhojd || r.start || r.adm || r.forsakring || (jmfFors && r.total != null);
          const milrad = r.milokand ? `<b class="jmfokand">Körsträcka: fråga handlaren</b>` : milTxt(r.ingar) + (r.milharledd ? " (som märkets kampanj)" : "") + (jmfMil && r.ingar > jmfMil ? ` – mer än du behöver` : "");
          return `<article class="jmfkort ${billigast ? "bast" : ""}">
            <div class="jmftopp">
              <span class="jmfbadge ${billigast ? "bast" : ""}">${billigast ? "Billigast" : r.typ === "Märket" ? "Märkets pris" : "Handlare"}</span>
              <div class="jmfpris">${r.m == null ? `<b class="jmfsaknas">Pris saknas</b><span>för ${milTxt(jmfMil)} – fråga säljaren</span>` : `<b>${kr(r.m)}</b><small>/mån</small><span>${r.krmil == null ? "kr/mil: –" : tal(r.krmil) + " kr/mil"}</span>${r.forhojd ? `<span class="jmfins">+ ${kr(r.forhojd)} vid start</span>` : ""}`}</div>
            </div>
            <h3>${esc(r.marke)} ${esc(r.modell)}</h3>
            <p class="jmfhandlare">${handlare}</p>
            <p class="jmfplats">📍 ${esc(plats)}${r.avst != null ? ` · ${tillMil(r.avst)} mil från dig` : ""}</p>
            <p class="jmfinfo">36 mån · ${milrad} · ${esc(r.drivmedel)}</p>
            ${r.total != null && extra ? `<p class="jmfeff"><b>${kr(Math.round(r.eff))}/mån</b> i faktisk kostnad – ${[r.forhojd && "insats", (r.start || r.adm) && "avgifter", (r.forsakring || jmfFors) && "försäkring"].filter(Boolean).join(", ").replace(/, ([^,]*)$/, " och $1")} inräknat</p>` : ""}
            <div class="jmfchips">
              <span class="${r.service ? "ja" : r.service === false ? "nej" : ""}">${r.service ? "✓ Service ingår" : r.service === false ? "✗ Service ingår inte" : "Service: fråga säljaren"}</span>
              <span class="${r.forsakring ? "ja" : ""}">${r.forsakring ? "✓ Försäkring ingår" : "Försäkring tillkommer"}</span>
              ${r.forhojd ? `<span class="nej">${kr(r.forhojd)} vid start</span>` : `<span class="ja">✓ 0 kr vid start</span>`}
              ${bt ? `<span class="betyg ${bt.klass}">${bt.text} · ${pct(r.andel)} av nypris</span>` : ""}
            </div>
            <details class="jmfmerinfo"><summary>Hela kostnaden och villkor</summary>
              <table>
                <tr><td>Månadshyra${jmfMil && !r.milokand && r.m != null && r.ingar === jmfMil && jmfMil > r.mil ? ` (${milTxt(jmfMil)})` : ""}</td><td>${r.m == null ? "–" : kr(r.m - r.adm - (r.forsakring || 0)) + " × 36"}</td></tr>
                ${r.adm ? `<tr><td>Avi-/administrationsavgift</td><td>${kr(r.adm)} × 36</td></tr>` : ""}
                ${r.forsakring ? `<tr><td>Obligatorisk försäkring</td><td>${kr(r.forsakring)} × 36</td></tr>` : ""}
                ${r.start ? `<tr><td>Uppläggningsavgift</td><td>${kr(r.start)}</td></tr>` : ""}
                ${r.forhojd ? `<tr><td>Insats / förhöjd första hyra</td><td>${kr(r.forhojd)}</td></tr>` : ""}
                ${!r.forsakring && jmfFors && r.total != null ? `<tr><td>Din försäkring</td><td>${kr(jmfFors)} × 36</td></tr>` : ""}
                <tr class="sum"><td>Totalt på 36 månader</td><td>${r.medfors == null ? "–" : kr(r.medfors)}</td></tr>
                ${r.nypris ? `<tr><td>Bilens nypris</td><td>${kr(r.nypris)}</td></tr>` : ""}
              </table>
              ${r.mer && !r.milokand && !r.milharledd ? `<p>Fler mil: ${Object.entries(r.mer).map(([k, v]) => `${milTxt(Number(k))} +${kr(v)}/mån`).join(" · ")}</p>` : ""}
              ${r.not ? `<p><b>Obs:</b> ${r.not}</p>` : ""}
              <p class="jmftillk">Tillkommer normalt: ${r.forsakring ? "" : "helförsäkring, "}vinterhjul, fordonsskatt (om inget annat står), drivmedel/el och eventuella övermil. Kontrollera alltid hos säljaren.</p>
              ${r.nypris && r.total != null ? `<p><a href="rakna.html?pris=${r.nypris}&leasing=${r.m}&start=${r.start + r.forhojd}&bil=${encodeURIComponent(r.marke + " " + r.mnamn)}#kopa">Räkna: leasa eller köpa den här bilen? →</a></p>` : ""}
            </details>
            <div class="jmfknappar">
              <a class="cta" href="${ut(r.url)}" target="_blank" rel="${rel(r.url)}">Till erbjudandet →</a>${arAff(r.url) ? `<small class="annons">Annonslänk</small>` : ""}
            </div>
          </article>`;
        }).join("") || "<p>Inga erbjudanden i den regionen.</p>"}</div>
        ${rader.length > jmfVisa ? `<button type="button" class="visamer" id="jmfmer">Visa fler erbjudanden (${rader.length - jmfVisa} till)</button>` : ""}
        <p class="jmffot">${rader.some(r => r.milokand) ? "Står körsträckan inte i handlarens annons visar vi den inte och räknar inget pris per mil – fråga handlaren. Sådana erbjudanden kan inte bli märkta Billigast. " : ""}Priserna gäller 36 månader. Avi- och uppläggningsavgifter är inräknade i totalkostnad och kr/mil. Kontrollerat ${KONTROLL}.</p>
        ${histHtml(mk)}
        <div class="jmfverktyg"><button type="button" class="jmfval ${JMF.har(mk) ? "vald" : ""}" data-jmf="${mk}" aria-pressed="${JMF.har(mk)}">${JMF.har(mk) ? "✓ Vald för jämförelse" : "＋ Jämför med andra bilar"}</button><a href="rakna.html${bast ? `?leasing=${bast.m}&start=${bast.start + bast.forhojd}&ingar=${bast.ingar}&bil=${encodeURIComponent(b0.marke + " " + b0.mnamn)}` : ""}">Räkna på hela kostnaden →</a></div>`;
      document.getElementById("jmfsort").value = s;
    }
    if (jamfor) {
      ritaJamfor();
      jamfor.addEventListener("change", e => {
        if (e.target.id === "jmfsort") ritaJamfor();
        if (e.target.id === "jmffors") { jmfFors = Math.max(0, Number(e.target.value) || 0); try { localStorage.setItem("jp_fors", String(jmfFors)); } catch (err) {} ritaJamfor(); }
      });
      jamfor.addEventListener("click", e => {
        const l = e.target.closest("button[data-lan]"); if (l) { jmfRegion = l.dataset.lan; jmfVisa = 20; ritaJamfor(); return; }
        if (e.target.id === "jmfmer") { jmfVisa += 20; ritaJamfor(); return; }
        const m = e.target.closest("#jmfmil button[data-mil]"); if (m) { jmfMil = Number(m.dataset.mil); ritaJamfor(); }
      });
      const bild = document.getElementById("jmfbild"), b0 = (MODELLER[document.body.dataset.modell] || [])[0];
      if (bild && b0 && b0.foto) bild.innerHTML = `<img src="${bildUrl(b0, "", 900)}" alt="${esc(b0.marke)} ${esc(b0.mnamn)}" width="960" height="600">`;
    }

    // ---------- Jämför bilar sida vid sida (jamfor-bilar.html) ----------
    const sidavid = document.getElementById("sidavid");
    function ritaSidavid() {
      const q = new URLSearchParams(location.search).get("m");
      if (q) JMF.spara(q.split(",").filter(k => MODELLER[k]).slice(0, 4));
      const l = JMF.lista(), tal = n => n.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const alla = Object.keys(MODELLER).sort((a, b) => (MODELLER[a][0].marke + MODELLER[a][0].mnamn).localeCompare(MODELLER[b][0].marke + MODELLER[b][0].mnamn, "sv"));
      const valj = l.length < 4 ? `<div class="svvalj"><label for="svny">Lägg till bil</label><select id="svny"><option value="">Välj modell…</option>${alla.filter(k => !l.includes(k)).map(k => `<option value="${k}">${esc(MODELLER[k][0].marke)} ${esc(MODELLER[k][0].mnamn)}</option>`).join("")}</select></div>` : "";
      if (!l.length) { sidavid.innerHTML = `<p class="svtom">Du har inte valt några bilar än. Välj två till fyra modeller här, eller tryck på <b>＋ Jämför med andra bilar</b> på ett bilkort.</p>${valj}`; return; }
      const d = l.map(k => ({ k, ...modellSammanfattning(k) }));
      const minst = f => Math.min(...d.map(f).filter(v => v != null));
      const lEff = minst(x => x.bast.eff), lKrmil = minst(x => x.bast.krmil), lStart = minst(x => x.bast.forhojd + x.bast.start);
      const rad = (rub, f, bastF) => `<tr><th scope="row">${rub}</th>${d.map(x => { const v = f(x); return `<td class="${bastF && bastF(x) && d.length > 1 ? "bast" : ""}">${v}</td>`; }).join("")}</tr>`;
      sidavid.innerHTML = `
        <div class="svrull"><table class="svtab">
          <thead><tr><td></td>${d.map(x => `<th scope="col"><a href="${x.bast.msida}">${x.bast.foto ? `<img src="${bildUrl(x.bast, "", 600)}" alt="" loading="lazy">` : ""}<span>${esc(x.bast.marke)}</span><b>${esc(x.bast.mnamn)}</b></a><button type="button" class="lanklik" data-bort="${x.k}">Ta bort</button></th>`).join("")}</tr></thead>
          <tbody>
            ${rad("Faktisk kostnad per månad", x => `<b>${kr(x.bast.eff)}</b>`, x => x.bast.eff === lEff)}
            ${rad("Månadshyra", x => kr(x.bast.m))}
            ${rad("Betalas vid start", x => kr(x.bast.forhojd + x.bast.start), x => x.bast.forhojd + x.bast.start === lStart)}
            ${rad("Totalt på 36 månader", x => kr(x.bast.total), x => x.bast.eff === lEff)}
            ${rad("Körsträcka som ingår", x => x.bast.milokand ? "Fråga handlaren" : x.bast.mil.toLocaleString("sv-SE") + " mil/år")}
            ${rad("Pris per mil", x => x.bast.krmil == null ? "–" : tal(x.bast.krmil) + " kr", x => x.bast.krmil != null && x.bast.krmil === lKrmil)}
            ${rad("Drivmedel", x => esc(x.bast.drivmedel))}
            ${rad("Karosstyp", x => esc(x.bast.kaross || "–"))}
            ${rad("Service", x => x.bast.service ? "Ingår" : x.bast.service === false ? "Ingår inte" : "Fråga säljaren")}
            ${rad("Försäkring", x => x.bast.forsakring ? "Ingår" : "Tillkommer")}
            ${rad("Nypris", x => x.bast.nypris ? kr(x.bast.nypris) : "–")}
            ${rad("Billigaste säljare", x => esc(x.bast.kalla.split(/ \(|,/)[0]))}
            ${rad("Erbjudanden hos oss", x => `${x.antal} st från ${x.saljare} ${x.saljare === 1 ? "säljare" : "säljare"}`)}
            ${rad("", x => `<a class="cta" href="${x.bast.msida}">Se ${x.antal > 1 ? "alla " + x.antal : "erbjudandet"} →</a>`)}
          </tbody></table></div>
        <p class="jmffot">Vi jämför det billigaste erbjudandet med känd körsträcka på varje modell. Faktisk kostnad = allt du betalar till säljaren på 36 månader (hyra, insats och avgifter) delat på 36. Grönt = bäst i raden. Kontrollerat ${KONTROLL}.</p>
        ${valj}
        <p class="svdela"><button type="button" class="lanklik" id="svlank">Kopiera länk till jämförelsen</button></p>`;
    }
    if (sidavid) {
      ritaSidavid();
      sidavid.addEventListener("change", e => { if (e.target.id === "svny" && e.target.value) { JMF.vaxla(e.target.value); history.replaceState(null, "", location.pathname); ritaSidavid(); } });
      sidavid.addEventListener("click", e => {
        const b = e.target.closest("button[data-bort]"); if (b) { JMF.vaxla(b.dataset.bort); history.replaceState(null, "", location.pathname); ritaSidavid(); return; }
        if (e.target.id === "svlank") { const u = location.origin + location.pathname + "?m=" + JMF.lista().join(","); (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => e.target.textContent = "✓ Länken är kopierad", () => { history.replaceState(null, "", "?m=" + JMF.lista().join(",")); e.target.textContent = "Länken står nu i adressfältet"; }); }
      });
    }

    // ---------- Räkna (rakna.html): hela kostnaden + leasa eller köpa ----------
    const rakna = document.getElementById("rakna");
    if (rakna) {
      const q = new URLSearchParams(location.search), v = id => Math.max(0, Number(document.getElementById(id).value) || 0), satt = (id, x) => { if (x != null && x !== "" && document.getElementById(id)) document.getElementById(id).value = x; };
      satt("rLeasing", q.get("leasing")); satt("rStart", q.get("start")); satt("rIngar", q.get("ingar")); satt("kLeasing", q.get("leasing")); satt("kStart", q.get("start")); satt("kPris", q.get("pris"));
      if (q.get("bil")) document.querySelectorAll(".raknabil").forEach(x => x.textContent = "Förifyllt med " + q.get("bil") + ". ");
      const r1 = () => {
        const man = v("rLeasing"), start = v("rStart"), fors = v("rFors"), hjul = v("rHjul"), skatt = v("rSkatt"), ingar = v("rIngar"), kor = v("rKor"), over = v("rOver");
        if (!man) { document.getElementById("rSvar").innerHTML = "<p>Fyll i månadshyran, så räknar vi.</p>"; return; }
        const overmil = Math.max(0, kor - ingar) * 3, overkost = overmil * over;
        const tot = man * 36 + start + fors * 36 + hjul + skatt * 3 + overkost, mil = (kor || ingar) * 3;
        document.getElementById("rSvar").innerHTML = `<div class="rstor"><small>Faktisk kostnad</small><b>${kr(Math.round(tot / 36))}/mån</b><span>${kr(Math.round(tot))} på 36 månader${mil ? " · " + (tot / mil).toLocaleString("sv-SE", { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + " kr/mil" : ""}</span></div>
          <table><tr><td>Månadshyra × 36</td><td>${kr(man * 36)}</td></tr><tr><td>Vid start (insats och avgifter)</td><td>${kr(start)}</td></tr><tr><td>Försäkring × 36</td><td>${kr(fors * 36)}</td></tr><tr><td>Vinterhjul</td><td>${kr(hjul)}</td></tr><tr><td>Fordonsskatt × 3 år</td><td>${kr(skatt * 3)}</td></tr><tr><td>Övermil (${overmil.toLocaleString("sv-SE")} mil)</td><td>${kr(overkost)}</td></tr></table>
          ${overmil && !over ? `<p class="rvarn">Du kör ${overmil.toLocaleString("sv-SE")} mil mer än avtalet tillåter på tre år. Fyll i säljarens pris per övermil – eller välj en högre körsträcka från början, det är oftast billigare.</p>` : ""}
          <p class="rnot">Drivmedel eller el, parkering, tvätt och eventuella skador vid återlämning ingår inte i beräkningen.</p>`;
      };
      const r2 = () => {
        const pris = v("kPris"), insats = Math.min(v("kInsats"), pris), ranta = v("kRanta") / 100, rest = v("kRest") / 100, serv = v("kService"), man = v("kLeasing"), start = v("kStart");
        if (!pris || !man) { document.getElementById("kSvar").innerHTML = "<p>Fyll i bilens pris och leasingens månadshyra, så jämför vi.</p>"; return; }
        const lan = pris - insats, rantekost = lan * ranta / 12 * 37 / 2, vardem = pris * (1 - rest);
        const kopa = vardem + rantekost + serv * 3, leasa = man * 36 + start, diff = kopa - leasa;
        document.getElementById("kSvar").innerHTML = `<div class="rtva"><div class="${diff > 0 ? "vinn" : ""}"><small>Leasa i 3 år</small><b>${kr(Math.round(leasa))}</b><span>${kr(Math.round(leasa / 36))}/mån</span></div><div class="${diff < 0 ? "vinn" : ""}"><small>Köpa och sälja efter 3 år</small><b>${kr(Math.round(kopa))}</b><span>${kr(Math.round(kopa / 36))}/mån</span></div></div>
          <p class="rslut">${Math.abs(diff) < 1000 ? "Det går ungefär jämnt ut." : diff > 0 ? `<b>Leasing blir ${kr(Math.round(diff))} billigare</b> med dina siffror.` : `<b>Köp blir ${kr(Math.round(-diff))} billigare</b> med dina siffror.`}</p>
          <table><tr><td>Värdeminskning (${Math.round((1 - rest) * 100)} % av priset)</td><td>${kr(Math.round(vardem))}</td></tr><tr><td>Ränta på lånet (${kr(lan)}, rak amortering 36 mån)</td><td>${kr(Math.round(rantekost))}</td></tr><tr><td>Service × 3 år</td><td>${kr(serv * 3)}</td></tr></table>
          <p class="rnot">Försäkring, skatt, däck och drivmedel kostar ungefär lika mycket i båda fallen och är därför inte med. Restvärdet är den stora osäkerheten: ingen vet vad bilen är värd om tre år. Prova gärna ett lägre restvärde och se hur svaret ändras – den risken slipper du när du leasar.</p>`;
      };
      rakna.addEventListener("input", () => { r1(); r2(); });
      r1(); r2();
    }

    // Kör rita() när något ändras, och en gång direkt när sidan laddas.
    [sok, drivmedel, mil, forsakring, sortera, markeSel, maxpris].filter(Boolean)
      .forEach(el => el.addEventListener("input", () => { antalVisas = STEGVIS; rita(); }));
    if (visaMer) visaMer.onclick = () => { antalVisas += STEGVIS; rita(); };

    // "Nära dig": postnummer eller webbläsarens plats (bara efter kundens godkännande)
    const postIn = document.getElementById("postnr"), platsKnapp = document.getElementById("minPlats"), platsText = document.getElementById("plattext");
    function visaPlats() {
      if (!platsText) return;
      if (postIn && MINPLATS && MINPLATS.postnr) postIn.value = MINPLATS.postnr;
      platsText.innerHTML = MINPLATS
        ? `Visar avstånd från <b>${esc(MINPLATS.text)}</b>. <button type="button" class="lanklik" id="glomPlats">Ta bort plats</button>`
        : "Valfritt. Ange postnummer eller använd din plats, så visar vi hur långt det är till lokala erbjudanden. Platsen stannar i din webbläsare och skickas inte till oss.";
      const g = document.getElementById("glomPlats");
      if (g) g.onclick = () => { sparaPlats(null); if (postIn) postIn.value = ""; visaPlats(); antalVisas = STEGVIS; rita(); };
    }
    if (postIn) postIn.addEventListener("input", () => {
      const d = postIn.value.replace(/\D/g, "");
      if (d.length === 5 && POSTNR[d.slice(0, 2)]) { sparaPlats({ pos: POSTNR[d.slice(0, 2)], text: "postnummer " + d.slice(0, 3) + " " + d.slice(3), postnr: d.slice(0, 3) + " " + d.slice(3) }); visaPlats(); antalVisas = STEGVIS; rita(); }
      else if (d.length === 5 && platsText) platsText.textContent = "Vi känner inte igen det postnumret.";
    });
    if (platsKnapp) platsKnapp.onclick = () => {
      if (!navigator.geolocation || !window.isSecureContext) { platsText.textContent = "Din webbläsare kan inte dela plats här. Skriv ditt postnummer i stället."; return; }
      platsText.textContent = "Din webbläsare frågar om du vill dela din plats…";
      navigator.geolocation.getCurrentPosition(
        p => { sparaPlats({ pos: [p.coords.latitude, p.coords.longitude], text: "din plats" }); visaPlats(); antalVisas = STEGVIS; rita(); },
        () => { platsText.textContent = "Du delade inte din plats. Skriv ditt postnummer i stället."; },
        { maximumAge: 600000, timeout: 10000 });
    };
    if (radieSel) radieSel.addEventListener("input", () => { antalVisas = STEGVIS; rita(); });
    visaPlats();

    // Snabbval för drivmedel (knappar i stället för rullista)
    const chips = document.getElementById("drivchips");
    if (chips && drivmedel) chips.addEventListener("click", e => {
      const b = e.target.closest("button[data-v]"); if (!b) return;
      chips.querySelectorAll("button").forEach(x => x.classList.toggle("vald", x === b));
      drivmedel.value = b.dataset.v; antalVisas = STEGVIS; rita();
    });

    // Snabbval för tillval: alla / bygg din bil / färdiga erbjudanden
    const tvChips = document.getElementById("tillvalchips");
    if (tvChips && tillvalIn) {
      const pool = BILAR.filter(b => !SIDMARKE || b.marke === SIDMARKE);
      const antal = { alla: pool.length, bygg: pool.filter(b => b.tillval === "alla").length };
      antal.fardig = antal.alla - antal.bygg;
      tvChips.querySelectorAll("button").forEach(x => { const n = antal[x.dataset.v]; x.querySelector("small").textContent = n; if (!n && x.dataset.v !== "alla") x.hidden = true; });
      tvChips.addEventListener("click", e => {
        const b = e.target.closest("button[data-v]"); if (!b) return;
        tvChips.querySelectorAll("button").forEach(x => x.classList.toggle("vald", x === b));
        tillvalIn.value = b.dataset.v; antalVisas = STEGVIS; rita();
      });
    }

    // Fyll märkeslistan och läs ?marke= från adressen
    if (markeSel) {
      const marken = [...new Set(BILAR.map(b => b.marke))].sort((a, b) => a.localeCompare(b, "sv"));
      markeSel.innerHTML = `<option value="alla">Alla märken</option>` + marken.map(m => `<option>${m}</option>`).join("");
    }
    // Lista med alla märken (länkar till märkessidorna)
    const markeLankar = document.getElementById("markelankar");
    if (markeLankar) {
      const antal = {}; BILAR.forEach(b => antal[b.marke] = (antal[b.marke] || 0) + 1);
      markeLankar.innerHTML = Object.keys(antal).sort((a, b) => a.localeCompare(b, "sv"))
        .filter(m => m !== SIDMARKE)
        .map(m => `<a href="privatleasing-${slug(m)}.html"><b>${m}</b><small>${antal[m]} ${antal[m] === 1 ? "bil" : "bilar"}</small></a>`).join("");
    }
    // Antal bilar i rubriker som har data-antal
    document.querySelectorAll("[data-antal]").forEach(el => {
      el.textContent = SIDMARKE ? BILAR.filter(b => b.marke === SIDMARKE).length : BILAR.length;
    });
    // Förval från kategorisidan eller adressen
    if (lista) {
      if (FORVAL.q && sok) sok.value = FORVAL.q;
      if (FORVAL.driv && drivmedel) { drivmedel.value = FORVAL.driv; if (chips) chips.querySelectorAll("button").forEach(x => x.classList.toggle("vald", x.dataset.v === FORVAL.driv)); }
      if (FORVAL.tak && maxpris) { if (![...maxpris.options].some(o => Number(o.value) === FORVAL.tak)) maxpris.add(new Option(kr(FORVAL.tak), FORVAL.tak)); maxpris.value = FORVAL.tak; }
      if (FORVAL.sort && sortera) sortera.value = FORVAL.sort;
    }
    rita();
    jmfFalt();
    // Sök direkt från startsidan
    const startSok = document.getElementById("startsok");
    if (startSok) {
      const dl = document.getElementById("modellforslag");
      if (dl) dl.innerHTML = Object.values(MODELLER).map(g => `<option value="${esc(g[0].marke + " " + g[0].mnamn)}">`).join("");
      startSok.addEventListener("submit", e => {
        e.preventDefault();
        const t = startSok.q.value.trim(); if (!t) { location.href = "alla-bilar.html"; return; }
        const k = Object.keys(MODELLER).find(k => (MODELLER[k][0].marke + " " + MODELLER[k][0].mnamn).toLowerCase() === t.toLowerCase());
        location.href = k ? MODELLER[k][0].msida : "alla-bilar.html?q=" + encodeURIComponent(t);
      });
    }
    // Siffror i löptext: <span data-tal="modeller|erbjudanden|saljare|kontroll">
    const _tal = { modeller: Object.keys(MODELLER).length, erbjudanden: BILAR.length, saljare: new Set(BILAR.map(b => b.kalla.split(/ \(|,/)[0])).size, kontroll: KONTROLL };
    document.querySelectorAll("[data-tal]").forEach(el => { if (_tal[el.dataset.tal] != null) el.textContent = _tal[el.dataset.tal]; });
  
    // "Visa fler frågor"
    if (document.getElementById("visaFler")) document.getElementById("visaFler").onclick = e => { document.getElementById("fragor").classList.add("visaalla"); e.target.remove(); };

    // "Hittar du inte din bil?" – intresseförfrågan som skickas till Jämföra Privatleasing
    if (document.getElementById("ejbilForm")) document.getElementById("ejbilForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target, d = Object.fromEntries(new FormData(f)), svar = document.getElementById("ejbilSvar");
      const fel = [];
      if (!d.bil.trim()) fel.push("vilken bil");
      if (!d.namn.trim()) fel.push("namn");
      if (!/^\S+@\S+\.\S+$/.test(d.epost)) fel.push("en giltig e-post");
      if (!d.ok) fel.push("ditt godkännande");
      if (fel.length) { svar.textContent = "Fyll i " + fel.join(", ") + "."; return; }
      const text = `INTRESSEFÖRFRÅGAN via Jämföra Privatleasing\nBil: ${d.bil}\nBudget: ${d.budget || "–"}\nMil/år: ${d.mil || "–"}\nNamn: ${d.namn}\nE-post: ${d.epost}\nTelefon: ${d.tel || "–"}`;
      if (!LIVE) { svar.innerHTML = "<b>Tack!</b> Formuläret skickas på den riktiga sidan, jamforprivatleasing.se."; return; }
      const knapp = f.querySelector("button"); knapp.disabled = true; knapp.textContent = "Skickar…";
      try {
        const r = await fetch("bestall.php", { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ typ: "intresse", bil: d.bil, namn: d.namn, epost: d.epost, tel: d.tel, samtycke: !!d.ok, text, oppnad: SIDAN_OPPNAD, webbplats: "" }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) === "false") throw 0;
        f.reset(); svar.innerHTML = "<b>Tack!</b> Vi hör av oss när vi hittar ett bra erbjudande.";
      } catch { svar.textContent = "Det gick inte att skicka just nu. Försök igen om en stund."; }
      knapp.disabled = false; knapp.textContent = "Bli kontaktad";
    });
  