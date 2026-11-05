# Leasingkollen – daglig kontroll (instruktioner för Claude)

Leasingkollen är en sida som jämför privatleasing av nya bilar i Sverige. Användaren vill att **all info är korrekt och alltid uppdaterad**. Den här filen beskriver den dagliga kontrollen.

## Fasta uppgifter
- **Artifact-slug:** `2fa9c5ce-98e8-4c58-a44e-b49d99f229e2` (https://claude.ai/artifact/6tNLLDz4meh5Gxs1gaHP9B)
- Publicera med `mcp__claude-artifacts__publish_files` (filen `index.html` och ev. nya `bilder/*.jpg`). Hämta aktuell version med `get_artifact` och använd den som `base_version`.
- All bildata ligger i `index.html` i listan `BILAR` (funktionen `B(marke, modell, foto, drivmedel, manad, mil, nypris, extra)`), bildkällor i `FOTON`, datum för senaste kontroll i `const KONTROLL`.
- `konfig.js` innehåller alla tillval, färger, drivlinor, vinterhjul och priser per körsträcka för Volkswagen, Škoda, Cupra och Audi. Den genereras automatiskt (se steg 1a) – redigera den aldrig för hand.
- Konfiguratorn ("Välj tillval & beställ") är koden under `KONFIGURATORN` i index.html. Beställningar skickas till `const BESTALLNING_EPOST` (tom = kunden kopierar beställningen och skickar den själv via handlarens sida).

## Daglig körning
1a. **Volkswagen, Škoda, Cupra och Audi (VW Finans):** kör verktygen i Higgsfield-sandlådan. Kopiera `verktyg/hamta_vwfs.js` och `verktyg/gen_vwfs.py` dit, kör `NODE_PATH=$(npm root -g) node hamta_vwfs.js` (skapar `lista.json` och `del0-2.json`), sedan de tre delarna parallellt i bakgrunden (`node hamta_vwfs.js del0.json` osv., ca 5 min). Kör `python3 gen_vwfs.py prod index.html konfig.js` på en kopia av index.html i sandlådan. För tillbaka `index.html` och `konfig.js` till workspace genom att packa dem (`tar czf`), lägga bytes i en gråskale-PNG (4 byte längd + data, bredd 512) och returnera den med `image_paths`; packa upp lokalt med PIL. Skriver skriptet "BILD SAKNAS" behövs en bild (steg 4) och en rad i `FOTO` i gen_vwfs.py.
1b. **Toyota:** easyprivatleasing.toyota.se/konfiguration/grupp/<slug> (slugs: cb, de, bz, c-hr, ra, ax, ya, yb, corolla-ts, corolla-hb, cx). Klicka "Välj" och fånga svaret från `/api/builder` (varianter med prisskillnad, färger, tillval, vinterhjul). Lägg in under `Object.assign(KONFIG, …)` sist i konfig.js. Avgifter: 695 kr + 59 kr/mån, 1 500 mil/år ingår.
1c. **Kia:** kia.com/se/nya-bilar/<modell>/upptack/ hämtar `kia.live.afonso.se/api/model/<kod>` med rek. pris, privatleasingpris per körsträcka (`manadshyra36<totala mil>`) och utrustning (`features`).
1d. **Hedin:** bilens sida har `#__NEXT_DATA__` med `car.car_equipment` (utrustning), `car_retail_price` (nypris = ordinarie pris) och `car_private_leasing_option` (pris, start_fee, invoice_fee).
1e. **Utrustning:** varje bil ska ha `utr` (det som ingår i priset) och vid behov `tv` (tillval med kr/mån) i objektet `UTRUSTNING` i index.html. Saknar källan en lista: skriv `utrnot` med varför, gissa aldrig.
1. **Kontrollera varje övrigt erbjudande** i `BILAR` genom att öppna dess `url` (eller märkets/återförsäljarens erbjudandesida). Workspace-nätet är begränsat: använd WebFetch, WebSearch, eller Higgsfield-sandlådan (`mcp__Higgsfield__sandbox_exec`, har internet och Playwright via `NODE_PATH=$(npm root -g)`) för sidor som kräver JavaScript. Starta en ny webbläsare per URL.
   - Stämmer månadspris, avtalstid (36 mån), mil/år, förhöjd första hyra, uppläggnings- och aviavgift?
   - Har kampanjen gått ut (t.ex. Škoda Epiq t.o.m. 15 dec 2026)? Leta då upp det nya priset; finns det inget, ta bort bilen.
   - Kan du inte nå en sida: leta efter samma uppgift i andra källor (återförsäljare, Hedin, Leasabil `?miltal=1500&avtalslangd=36`, Bilmånsson, Wayke, minbilkoll.se, bilweb.se, märkets pressrum, motortidningar). Gissa aldrig.
2. **Nypris** ska alltid finnas. Källor i ordning: märkets prislista/konfigurator → pressmeddelande → Skatteverkets nybilspriser → motortidningar.
3. **Nya modeller/erbjudanden:** de 5 mest leasade märkena (VW, Kia, Volvo, Škoda, Mercedes-Benz) plus Tesla ska ha alla modeller som erbjuds med privatleasing. Lägg till nya modeller.
4. **Bilder:** nya bilar behöver en bild av bilen ny, snett framifrån, 720×450 jpg i `bilder/`. Endast Wikimedia Commons-foton med CC BY / CC BY-SA / CC0 (aldrig pressbilder). Lägg till fotograf, fil och licens i `FOTON`.
5. **Uppdatera `const KONTROLL`** till dagens datum (t.ex. "6 nov 2026").
6. **Testa** sidan i Playwright (desktop + mobil, inga JS-fel) och titta på en skärmbild.
7. **Publicera** till artifact-sluggen ovan, commit och push till `main`.
8. **Rapportera** kort på svenska bara vad som ändrats (priser, nya/borttagna bilar). Om inget ändrats: en rad.

## Regler
- Mercedes-Benz.se och tesla.com blockerar automatiska webbläsare. Kontrollera dem via WebSearch (märkets sida i sökresultatet) och återförsäljare (Landrins, Veho, Bilia, Hedin).
- Peugeot via Ayvens har obligatorisk försäkring 395 kr/mån (fältet `forsakring`), räkna med den i totalen.
- Ändra aldrig beräkningsmetoden (andel av nypris på 36 mån; betyg <40 % Mycket bra, <45 % Bra, <55 % OK, annars Dyrt) utan att användaren bett om det.
- Ta inte bort bildkällorna längst ner – licenserna kräver dem.
