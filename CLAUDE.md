# Plånboksskolan – daglig video (instruktioner för Claude)

TikTok-kontot **@planboksskolan** ("Skolan du aldrig fick om pengar – ny lektion varje dag") publicerar en kort video om svensk privatekonomi varje dag, helt automatiskt. Det här repot innehåller videomallen, alla färdiga videor och en logg över publicerade ämnen.

## Fasta uppgifter
- **Metricool brandId:** `7817087` (tidszon Europe/Stockholm, TikTok-konto planboksskolan)
- **ElevenLabs-röst:** `voice_id 6eknYWL7D5Z4nRkDy15t`, modell `eleven_v4`, `generations_count: 1`
- **Publika filer:** `https://raw.githubusercontent.com/erikgustavgustafsson-gif/planboksskolan-videor/main/<sökväg>`

## Arbetsgång för en daglig körning
0. **Kö först:** om `klara/ko.json` innehåller videor, publicera den första i stället för att göra en ny (hoppa direkt till steg 8 och använd dess `file`, `cover`, `title`, `caption`). Ta sedan bort den ur `ko.json`, flytta filerna till `videor/` och `omslag/`, logga i `publicerat.md`, commit och push. En video med `publish_before` som annars skulle missas går före de andra.
1. **Läs `publicerat.md`** så att ämnet inte upprepas (inte samma ämne de senaste 30 dagarna).
2. **Hitta dagens ämne.** Sök på webben efter vad som är aktuellt inom svensk privatekonomi just nu: nya regler och datum, räntebesked, skatter, ISK, sparkonton, bedrägerier, konsumenttips, säsong (lön den 25:e, jul, deklaration osv.). Det som fungerar bäst på svensk finans-TikTok:
   - något som ändras/försvinner med ett datum ("Har du X? Snart …")
   - en konkret räkneexempel-siffra
   - "visste du"-tips, tvärtom-påståenden ("Sluta spara det som blir över")
3. **Faktakolla varje siffra** mot minst en tillförlitlig källa (myndighet, bank, Riksbanken, Skatteverket, Konsumentverket, större medier). Hittar du ingen säker källa: välj ett annat ämne eller ta bort siffran. Gissa aldrig belopp, räntor eller datum. Inga råd om enskilda aktier.
4. **Skriv specen** `specs/<YYYY-MM-DD>_<slug>.json` enligt `mall/exempel_spec.json`:
   - 5 scener: `hook` → 2–3 av (`cards`, `statement`, `number`) → `cta`. Bakgrunden växlar automatiskt.
   - All `say`-text tillsammans **300–360 tecken** (≈ 25–29 s). Siffror skrivs med ord i `say` ("tiotusen kronor") men med siffror i bild.
   - **Kroken** (första meningen) ska vara skarp från första ordet: ett påstående, en fråga tittaren känner igen sig i, eller en siffra. Aldrig "Om du …" eller vaga "förmodligen".
   - Texter i bild: korta (max ~22 tecken per rad i `big`/`highlight`, ~28 i `lines`).
   - Fyll i `title` (krävs av TikTok), `caption` (kort text + fråga till tittarna + högst 5 hashtags inkl. #plånboksskolan), `pinned_comment`, `sources` (URL:er) och `cover`.
   - Avsluta `cta`-scenens `say` med "…och följ Plånboksskolan." när det ryms.
5. **Röst:** skapa ett ElevenLabs-flow "Plånboksskolan – <titel>", kör `creative_generate_speech` med alla `say`-stycken separerade av en tom rad, vänta ~25 s, hämta `full_res_url` med `creative_get_generations` och ladda ner med curl till `/tmp/voice.mp3`. Generera inte om i onödan (kostar credits) – högst en gång om rösten blir längre än 29,5 s, då med kortare manus.
6. **Rendera:** `python3 mall/engine.py specs/<fil>.json /tmp/voice.mp3 /tmp/out` (kräver Pillow, numpy, ffmpeg och typsnittet Inter Display; installera vid behov). Titta på 3 bildrutor (krok, mitten, slut) med ffmpeg + Read och rätta text som går utanför bild.
7. **Spara i repot:** kopiera `<slug>.mp4` till `videor/` och `<slug>.jpg` till `omslag/`, lägg till en rad i `publicerat.md` (datum | titel | ämne | källor), commit och push till `main`. Kontrollera att rå-länken till videon svarar 200.
8. **Publicera via Metricool:** `getBestTimeToPostByNetwork` (tiktok, dagens datum) → välj den bästa timmen som ligger minst 20 minuter fram i tiden (finns ingen i dag: om 20 minuter). `createScheduledPost` med `providers: [{"network":"tiktok"}]`, `media: [<rå-länk mp4>]`, `videoThumbnailUrl: <rå-länk jpg>`, `text: caption`, `tiktokData: {title, privacyOption: "PUBLIC_TO_EVERYONE", isAigc: true, autoAddMusic: false}`, `autoPublish: true`.
9. **Rapportera** kort till användaren (på svenska): titel, publiceringstid, källor, och den fästa kommentaren att lägga in.

## Stil
Navy (#16213A) och mint, gul text (#F7C548) med mörk kontur, logga "PLÅNBOKSSKOLAN" överst. Allt detta sköts av `mall/engine.py` och `mall/render.py` – ändra inte färgerna.
