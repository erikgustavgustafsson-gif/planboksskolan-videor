// Läser bildatan ur app.js (utan webbläsare) och skriver den som JSON. Används av build.py och prishistorik.py.
// node dump.js [sökväg till app.js]
const fs = require("fs");
const src = fs.readFileSync(process.argv[2] || __dirname + "/app.js", "utf8");
const a = src.indexOf("const KONTROLL"), slutMark = "// Postnummer -> ungefärlig plats";
let b = src.indexOf(slutMark); if (b < 0) b = src.indexOf("const POSTNR");
if (a < 0 || b < 0) { console.error("Hittar inte datadelen i app.js"); process.exit(1); }
const slug = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const kod = src.slice(a, b) + `
;return { KONTROLL, BILAR, MODELLNAMN: typeof MODELLNAMN !== "undefined" ? MODELLNAMN : {} };`;
const d = new Function("slug", "KONFIG", kod)(slug, {});
const ut = d.BILAR.map(x => {
  const m = x.manad + (x.adm || 0) + (x.forsakring || 0);
  const total = m * 36 + (x.start || 0) + (x.forhojd || 0);
  const mnamn = x.mnamn || d.MODELLNAMN[x.foto] || x.modell.split(" ")[0];
  return { marke: x.marke, modell: x.modell, foto: x.foto, drivmedel: x.drivmedel, manad: x.manad, mil: x.mil, nypris: x.nypris,
    start: x.start || 0, adm: x.adm || 0, forhojd: x.forhojd || 0, forsakring: x.forsakring || 0, service: x.service, typ: x.typ,
    lan: x.lan || [], kaross: x.kaross || "", kalla: x.kalla, url: x.url, ort: x.orttext || x.ort || "", lokal: x.typ !== "Märket", milokand: !!x.milokand, milharledd: !!x.milharledd,
    bilweb: !!x.bilweb, mnamn, mkey: slug(x.marke + " " + mnamn), m, total, eff: Math.round(total / 36) };
});
process.stdout.write(JSON.stringify({ kontroll: d.KONTROLL, bilar: ut }));
