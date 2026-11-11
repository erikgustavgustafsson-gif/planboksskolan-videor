# Jämföra Privatleasing (jamforprivatleasing.se) – daglig kontroll (instruktioner för Claude)

Sidan hette tidigare Leasingkollen. **Använd aldrig namnet Leasingkollen eller leasingkollen.se** – sidan heter Jämföra Privatleasing och domänen är https://jamforprivatleasing.se. Den jämför privatleasing av nya bilar i Sverige. Användaren vill att **all info är korrekt och alltid uppdaterad**.

## Filer (flera sidor – inte en enda index.html)
- `kalla/app.js` – **all bildata och logik**: listan `BILAR` (`B(marke, modell, foto, drivmedel, manad, mil, nypris, extra)`), `UTRUSTNING`, bildkällor i `FOTON`, `FRILAGDA`, orter i `ORTREGLER`, `const KONTROLL`, `const TOPP`, konfiguratorn.
- `kalla/stil.css` – all stil. `kalla/build.py` – bygger alla sidor till `site/` (startsida, kampanjer, alla bilar, 20 märkessidor, guide, frågor, sitemap). `kalla/marken.json` – texter för märkessidorna. `kalla/original-index.html` – mall som build.py läser.
- `site/` – den färdiga sidan (det som publiceras och laddas upp till Strato). `site/konfig.js` – tillval per bil, genereras av `verktyg/gen_vwfs.py` (+ Toyota-delen, se nedan). Övriga filer i `site/` (foretag.js, affiliate.js, bildkalla.js, stat.php, statistik.php, info-sidor, bilder/) redigeras direkt där.
- **Redigera aldrig `site/app.js`, `site/stil.css` eller de byggda html-sidorna för hand** – ändra i `kalla/` och kör `python3 kalla/build.py` (kopierar app.js och stil.css till site/).

## Fasta uppgifter
- **Artifact-slug:** `2fa9c5ce-98e8-4c58-a44e-b49d99f229e2` (förhandsvisning). Publicera med `mcp__claude-artifacts__publish_files` i patch-läge och bara de filer som ändrats, med servad sökväg = sökväg under `site/` (t.ex. `app.js`, `index.html`, `privatleasing-volvo.html`, `konfig.js`, `sitemap.xml`, `bilder/x.jpg`). Hämta `base_version` med `get_artifact` precis innan.
- **Publicera aldrig en ensam index.html med all data i** – det var den gamla Leasingkollen-sidan och den skriver över den nya startsidan.
- Riktiga sidan ligger hos Strato (mappen `leasingkollen` i webbutrymmet). Användaren laddar upp själv från mobilen: en zip av `site/` + `kalla/packa-upp.php`. Den dagliga körningen kan inte ladda upp till Strato – skriv i rapporten om priser ändrats så att användaren vet att en ny zip behövs.

## Daglig körning
1a. **Volkswagen, Škoda, Cupra och Audi (VW Finans):** kör verktygen i Higgsfield-sandlådan. Kopiera `verktyg/hamta_vwfs.js` och `verktyg/gen_vwfs.py` dit, kör `NODE_PATH=$(npm root -g) node hamta_vwfs.js` (skapar `lista.json` och `del0-2.json`), sedan de tre delarna parallellt i bakgrunden (`node hamta_vwfs.js del0.json` osv., ca 5 min). Kör `python3 gen_vwfs.py prod app.js konfig.js` på kopior av `kalla/app.js` och `site/konfig.js` i sandlådan (skriptet ersätter allt mellan `// --- VWFS START` och `// --- VWFS SLUT ---` i app.js). Behåll Toyota-delen (`Object.assign(KONFIG, …)` sist i konfig.js) om skriptet skriver över den. För tillbaka filerna genom att packa dem (`tar czf`), lägga bytes i en gråskale-PNG (4 byte längd + data, bredd 512) och returnera den med `image_paths`; packa upp lokalt med PIL. Skriver skriptet "BILD SAKNAS" behövs en bild (steg 4).
1b. **Toyota:** easyprivatleasing.toyota.se/konfiguration/grupp/<slug> (slugs: cb, de, bz, c-hr, ra, ax, ya, yb, corolla-ts, corolla-hb, cx). Klicka "Välj" och fånga svaret från `/api/builder`. Lägg in under `Object.assign(KONFIG, …)` sist i `site/konfig.js`. Avgifter: 695 kr + 59 kr/mån, 1 500 mil/år ingår.
1c. **Kia:** kia.com/se/nya-bilar/<modell>/upptack/ hämtar `kia.live.afonso.se/api/model/<kod>` med rek. pris, privatleasingpris per körsträcka (`manadshyra36<totala mil>`) och utrustning (`features`).
1d. **Hedin:** bilens sida har `#__NEXT_DATA__` med `car.car_equipment`, `car_retail_price` (nypris) och `car_private_leasing_option` (pris, start_fee, invoice_fee).
1e. **Utrustning:** varje bil ska ha `utr` och vid behov `tv` (tillval med kr/mån). Saknar källan en lista: skriv `utrnot` med varför, gissa aldrig.
0. **Handlarnas annonser från Bilweb (VARJE natt – annonser löper ut):** allt mellan `// --- BILWEB START` och `// --- BILWEB SLUT ---` i kalla/app.js genereras och ska bytas ut helt varje natt. Ändra aldrig de raderna för hand.
   a. Pusha först eventuella ändringar i kalla/app.js. I Higgsfield-sandlådan (`mcp__Higgsfield__sandbox_exec`), hämta filerna via commit-SHA (rå-länkar mot `main` cachas i flera minuter): `SHA=$(curl -s https://api.github.com/repos/erikgustavgustafsson-gif/planboksskolan-videor/commits/main | grep -m1 '"sha"' | cut -d'"' -f4)`, sedan `curl -sf https://raw.githubusercontent.com/erikgustavgustafsson-gif/planboksskolan-videor/$SHA/jamforprivatleasing/<sökväg>` för `verktyg/skord_bilweb.py`, `verktyg/gen_bilweb.py` och `kalla/app.js`. Skicka aldrig filer som base64 i kommandot (sandlådan nekar det).
   b. Gör modellistan: `python3 -c` som läser `const MODELLNAMN` och alla `B(...)`-rader utan `"bilweb": true` ur app.js → `[{"marke","mnamn"}]` (unika). Kör `rm -f bw.json; python3 skord_bilweb.py modeller.json bw.json` med `background:true` (ca 20 min, max 15 min per körning – kör igen, den fortsätter där den slutade). Polla med `sleep 55` (längre väntan ger Bad Gateway).
   c. `python3 gen_bilweb.py bw.json app.js <dagens datum ÅÅÅÅ-MM-DD>`. Regler i skriptet: bara nya bilar, annons uppdaterad senast 45 dagar sedan, 36 mån, pris vid 0 kr insats annars insatsen som `forhojd`, inga premie-/företagspriser, max 2 per säljare och modell, max 8 per modell.
   d. För tillbaka blocket: `sed -n '/BILWEB START/,/BILWEB SLUT/p' app.js | gzip -9 > block.gz`, lägg bytes i en gråskale-PNG (4 byte längd big-endian + data, bredd 512, PIL `Image.frombytes('L', …)`) och returnera den med `image_paths`. Bilden sparas lokalt under `/tmp/claude-tool-results/…png` (sökvägen står i svaret) – läs den med PIL, packa upp och ersätt blocket i kalla/app.js.
   e. Rimlighetskolla: inga priser under 1 500 eller över 20 000 kr/mån utan anledning, inga dubbletter av samma säljare och pris. Rapportera antal modeller med 1, 2–4 och 5+ erbjudanden.
1. **Kontrollera varje övrigt erbjudande** i `BILAR` (kalla/app.js) via dess `url`. Använd WebFetch, WebSearch eller Higgsfield-sandlådan (`mcp__Higgsfield__sandbox_exec`, Playwright via `NODE_PATH=$(npm root -g)`). Starta en ny webbläsare per URL.
   - Stämmer månadspris, 36 mån, mil/år, förhöjd första hyra, uppläggnings- och aviavgift?
   - Har kampanjen gått ut? Leta upp det nya priset; finns det inget, ta bort bilen.
   - Når du inte en sida: leta i andra källor (återförsäljare, Hedin, Leasabil, Bilmånsson, Wayke, bilweb.se, märkets pressrum). Gissa aldrig.
   - **Lokala erbjudanden:** är `kalla` en ny handlare/ort, lägg till orten i `ORT` och en regel i `ORTREGLER` i app.js (annars visas "fråga var bilen hämtas").
2. **Nypris** ska alltid finnas. Källor: märkets prislista/konfigurator → pressmeddelande → Skatteverkets nybilspriser → motortidningar.
3. **Nya modeller:** VW, Kia, Volvo, Škoda, Mercedes-Benz och Tesla ska ha alla modeller som erbjuds med privatleasing.
4. **Bilder:** nya bilar behöver en bild av bilen ny, snett framifrån, 960×600 jpg i `site/bilder/`. Endast Wikimedia Commons-foton med CC BY / CC BY-SA / CC0 (aldrig pressbilder, aldrig retuscherade märkesbilder). Fotograf, fil och licens i `FOTON`.
5. **Uppdatera `const KONTROLL`** i kalla/app.js (t.ex. "8 nov 2026").
6. **Bygg och testa:** `python3 kalla/build.py`, `node --check site/app.js`, öppna `site/index.html`, `site/alla-bilar.html` och en märkessida i Playwright (desktop + mobil, inga JS-fel, öppna konfiguratorn för en bil) och titta på en skärmbild.
7. **Publicera** ändrade filer från `site/` till artifact-sluggen ovan, commit och push till `main`.
8. **Rapportera** kort på svenska bara vad som ändrats. Om priser ändrats: skriv att en ny zip till Strato behövs. Om inget ändrats: en rad.

## Ren jämförelsesajt (från 11 nov 2026)
- Sidan tar inte emot beställningar. Alla knappar leder till handlarens eller märkets erbjudande. Konfiguratorn och bestall.php finns kvar men används inte – koppla inte in dem igen utan att användaren ber om det.
- Listorna visar ett kort per modell med billigaste faktiska pris (insats utslagen på 36 mån). Modellsidan listar alla erbjudanden, billigast överst.

## Jämför handlare (modellsidor)
- Varje modell har en egen sida `privatleasing-<märke>-<modell>.html` som listar alla erbjudanden på modellen, billigast först. Bilar hör till samma modell när de har samma `foto`-nyckel; modellens namn står i `MODELLNAMN` i kalla/app.js.
- **Lägg gärna till fler handlares erbjudanden på modeller som redan finns** (samma `foto`-nyckel, `kalla` = handlarens namn och ort, `url` till handlarens sida) – det är det som gör jämförelsen värdefull. Samma krav som alltid: verifierat pris, 36 mån, nypris.
- Ny modell: lägg till `"<foto>": "<Modellnamn>"` i `MODELLNAMN`. Ny ort: lägg till den i `ORT`, `ORTREGLER` och `LAN` (län).
- build.py skapar modellsidorna och sitemap automatiskt. Publicera nya/ändrade modellsidor till artefakten.

## Regler
- Topp 5 (`const TOPP`) = Sveriges mest privatleasade modeller. Kontrollera statistiken en gång i månaden.
- Mercedes-Benz.se och tesla.com blockerar automatiska webbläsare – kontrollera via WebSearch och återförsäljare.
- Peugeot via Ayvens har obligatorisk försäkring 395 kr/mån (fältet `forsakring`).
- Ändra aldrig beräkningsmetoden (andel av nypris på 36 mån; <40 % Mycket bra, <45 % Bra, <55 % OK, annars Dyrt) utan att användaren bett om det.
- Ändra inte design, logotyp, sidstruktur eller texter – bara data. Ta inte bort bildkällorna.
- `site/statistik.php` (användarens privata statistiksida med hemlig nyckel) ligger medvetet inte i repot, som är publikt. Lägg aldrig in den.
