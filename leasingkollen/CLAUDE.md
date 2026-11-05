# Leasingkollen – daglig kontroll (instruktioner för Claude)

Leasingkollen är en sida som jämför privatleasing av nya bilar i Sverige. Användaren vill att **all info är korrekt och alltid uppdaterad**. Den här filen beskriver den dagliga kontrollen.

## Fasta uppgifter
- **Artifact-slug:** `2fa9c5ce-98e8-4c58-a44e-b49d99f229e2` (https://claude.ai/artifact/6tNLLDz4meh5Gxs1gaHP9B)
- Publicera med `mcp__claude-artifacts__publish_files` (filen `index.html` och ev. nya `bilder/*.jpg`). Hämta aktuell version med `get_artifact` och använd den som `base_version`.
- All bildata ligger i `index.html` i listan `BILAR` (funktionen `B(marke, modell, foto, drivmedel, manad, mil, nypris, extra)`), bildkällor i `FOTON`, datum för senaste kontroll i `const KONTROLL`.

## Daglig körning
1. **Kontrollera varje erbjudande** i `BILAR` genom att öppna dess `url` (eller märkets/återförsäljarens erbjudandesida). Workspace-nätet är begränsat: använd WebFetch, WebSearch, eller Higgsfield-sandlådan (`mcp__Higgsfield__sandbox_exec`, har internet och Playwright via `NODE_PATH=$(npm root -g)`) för sidor som kräver JavaScript. Starta en ny webbläsare per URL.
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
- Ändra aldrig beräkningsmetoden (andel av nypris på 36 mån; betyg <40 % Mycket bra, <45 % Bra, <55 % OK, annars Dyrt) utan att användaren bett om det.
- Ta inte bort bildkällorna längst ner – licenserna kräver dem.
