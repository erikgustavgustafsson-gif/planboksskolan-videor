// Hämtar alla privatleasing-modeller med tillval och priser från VW Finans
// märkessidor (Volkswagen, Škoda, Cupra, Audi). Körs i Higgsfield-sandlådan:
//   NODE_PATH=$(npm root -g) node hamta_vwfs.js            -> lista.json
//   NODE_PATH=$(npm root -g) node hamta_vwfs.js del0.json  -> prod/*.json
// Sidorna hämtar sin data från https://nosp-api.vwfs-se-nosp.vwfs.io/api/...
// (category = modellistan, product/<slug> = alla tillval och priser per körsträcka).
const { chromium } = require('playwright'); const fs = require('fs');
const SAJTER = { volkswagen: 'privatleasing.volkswagen.se', skoda: 'privatleasing.skoda.se', cupraofficial: 'privatleasing.cupraofficial.se', audi: 'privatleasing.audi.se' };
(async () => {
  const b = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  async function fanga(url, del) {
    const ctx = await b.newContext({ locale: 'sv-SE' }); const pg = await ctx.newPage(); let got = null;
    pg.on('response', async r => { if (r.url().includes(del)) { try { got = await r.text(); } catch (e) {} } });
    try { await pg.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); for (let i = 0; i < 24 && !got; i++) await pg.waitForTimeout(500); } catch (e) {}
    await ctx.close(); return got;
  }
  if (!process.argv[2]) {
    const L = [];
    for (const [site, host] of Object.entries(SAJTER)) {
      const t = await fanga('https://' + host + '/valjmodell', '/api/category');
      if (!t) { console.log('INGEN LISTA', site); continue; }
      for (const c of JSON.parse(t)) for (const s of (c.subCategories || [])) if (s.linkUrl) L.push([site, 'https://' + host + s.linkUrl, s.title]);
    }
    fs.writeFileSync('lista.json', JSON.stringify(L));
    for (let i = 0; i < 3; i++) fs.writeFileSync('del' + i + '.json', JSON.stringify(L.filter((_, j) => j % 3 === i)));
    console.log(L.length, 'modeller');
  } else {
    fs.mkdirSync('prod', { recursive: true });
    for (const [site, url, title] of JSON.parse(fs.readFileSync(process.argv[2]))) {
      const slug = url.split('/tillval/')[1], ut = 'prod/' + site + '__' + slug + '.json';
      if (fs.existsSync(ut)) continue;
      const t = await fanga(url, '/api/product/');
      if (t) { fs.writeFileSync(ut, JSON.stringify({ site, url, title, data: JSON.parse(t) })); console.log('OK', slug); } else console.log('INGEN', slug);
    }
  }
  await b.close(); console.log('KLAR');
})();
