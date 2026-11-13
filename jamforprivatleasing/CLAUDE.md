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
0. **Handlarnas erbjudanden (VARJE natt – annonser löper ut).** Tre block i kalla/app.js genereras och byts ut helt varje natt – ändra dem aldrig för hand: `// --- BILWEB START … SLUT ---`, `// --- BWORT START … SLUT ---` och `// --- HEDIN START … SLUT ---`. Gör så här i Higgsfield-sandlådan (`mcp__Higgsfield__sandbox_exec`), i `/home/user`:
   - Hämta skripten från repot med curl, låsta till senaste commit-SHA (rå `main` är cachad): `verktyg/skord_bilweb2.py`, `verktyg/skord_hedin.py`, `verktyg/gen_bilweb2.py`, `verktyg/gen_hedin.py`, `verktyg/slugmap.json` och `kalla/app.js`. Lägg de två gen-skripten i samma mapp.
   - `rm -f bw2.json; python3 skord_bilweb2.py bw2.json` med `background:true` (ca 10 min, hämtar ALLA privatleasingannonser på Bilweb, ~2 700 st). Kör om samma kommando utan `rm` om det avbryts – det fortsätter där det slutade. Polla med `sleep` högst 55 s.
   - `python3 skord_hedin.py hedin.json` med `background:true` (ca 5 min, Hedin Automotives nya lagerbilar med privatleasingpris).
   - `python3 gen_bilweb2.py bw2.json app.js <dagens datum ÅÅÅÅ-MM-DD> slugmap.json` och sedan `python3 gen_hedin.py hedin.json app.js`. Kör `node --check app.js`.
   - För ut de tre blocken: gzip → gråskale-PNG (4 byte längd big-endian + data, bredd 512) → `image_paths` → avkoda lokalt med PIL och sätt in blocken i kalla/app.js. (Base64 i kommandot nekas.)
   - **Rimlighetskontroll före publicering:** Bilweb ska ge minst 1 000 rader och Hedin minst 500. Blir det färre har en källa ändrats – behåll då gårdagens block för den källan och skriv det i rapporten.
   - Reglerna sitter i gen-skripten och får inte mjukas upp: bara nya bilar, 36 mån, annons högst 180 dagar, priset måste vara leasingpriset (Bilwebs "Billån"-kalkyl är inte det), körsträcka gissas aldrig, samma säljare + variant + pris = ett erbjudande.
   - Nya modeller utan bild visas med namnruta. Lägg bara till bild om du har sett bilden och den visar exakt rätt modell och generation; registrera den då i `FOTON` (fotograf + licens), `MODELLNAMN`, `KAROSS` och `FOTOALIAS` i kalla/app.js.
   - Samma bil under två namn hos säljarna? Lägg namnet i `MODELLALIAS` i kalla/app.js.
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

## Nya delar (12 nov 2026) – rör inte logiken, bara datan
- `kalla/build.py` läser all data ur app.js via `kalla/dump.js` (Node). `kalla/marken.json` och `site/prishistorik.js` skapas automatiskt – ändra dem aldrig för hand.
- `kalla/prishistorik.json` fylls på vid varje bygge med lägsta faktiska månadskostnad per modell för datumet i `const KONTROLL`. **Uppdatera därför alltid KONTROLL före bygget, och committa prishistorik.json.** Radera aldrig filen.
- Nya sidor byggs automatiskt: kategorisidor (`privatleasing-elbil/-laddhybrid/-hybrid/-bensin/-suv/-kombi/-smabil/-under-3000/-under-4000.html`, `billigaste-privatleasing.html`), `jamfor-bilar.html`, `rakna.html`, `sa-jamfor-vi.html`. Sidtitlarna får aktuell månad automatiskt.
- Ny modell: lägg också till bildnyckeln i rätt rad i `KAROSS` (SUV, Kombi, Småbil, Halvkombi/sedan) i kalla/app.js.
- "Faktisk månadskostnad" = (hyra + avgifter + obligatorisk försäkring) × 36 + uppläggning + insats, delat på 36. Det är den som rangordnar. Ändra inte det.
- Efter bygget: publicera alla ändrade filer i `site/` (även nya html-sidor och `prishistorik.js`) och pusha zip till `strato-paket`.

## Hastighet (12 nov 2026)
- build.py skapar WebP-bilder (`bilder/<namn>-480.webp` och `-960.webp`) av varje jpg, och sätter `?v=<version>` på js/css. Kräver Pillow. Publicera även nya .webp-filer.
- build.py slår ihop all kod till `site/paket.js` (en fil i stället för fem). Sidorna laddar bara den – publicera alltid `paket.js` tillsammans med html-filerna.
- `site/.htaccess` slår på komprimering och lång cache för js/css/bilder – ändra den inte. `konfig.js` laddas inte längre.

## Kakor och mätning (13 nov 2026)
- `site/samtycke.js` innehåller kakrutan och Eriks ID:n (objektet `SPARNING`; Google Analytics `G-LX38W0PK9Q` är påslaget, övriga tomma = avstängda). **Ändra aldrig ID:na och skriv aldrig över filen.** Inget får laddas från andra företag utanför den filen – allt sådant kräver besökarens samtycke.
- Slås fler tjänster på (Ads, Meta, TikTok, AdSense) måste integritetspolicyn uppdateras samtidigt. Prisbevakningen (bevaka.php) ligger kvar på grenen `kakor-senare`.
- Nya bilbilder: använd det snabba flödet i `verktyg/bildflode/LASMIG.md`.

## Regler
- Topp 5 (`const TOPP`) = Sveriges mest privatleasade modeller. Kontrollera statistiken en gång i månaden.
- Mercedes-Benz.se och tesla.com blockerar automatiska webbläsare – kontrollera via WebSearch och återförsäljare.
- Peugeot via Ayvens har obligatorisk försäkring 395 kr/mån (fältet `forsakring`).
- Ändra aldrig beräkningsmetoden (andel av nypris på 36 mån; <40 % Mycket bra, <45 % Bra, <55 % OK, annars Dyrt) utan att användaren bett om det.
- Ändra inte design, logotyp, sidstruktur eller texter – bara data. Ta inte bort bildkällorna.
- `site/statistik.php` (användarens privata statistiksida med hemlig nyckel) ligger medvetet inte i repot, som är publikt. Lägg aldrig in den.
