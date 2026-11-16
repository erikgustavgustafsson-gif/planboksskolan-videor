# Snabbt bildflöde (nya bilbilder på ~15 min i stället för timmar)
1. `val.tsv`: en rad per kandidat – `nyckel|filnamn på Commons|fotograf|licens` (2–3 kandidater per modell; A/B/M = Alexander Migl / Alexander-93 / M 93).
   Sök kandidater med `sok_sandbox.py` i Higgsfield-sandlådan (sekunder) eller `sok_lokalt.py` här (Commons stryper API:t, ~30 s/fråga).
2. `python3 hamta.py` – hämtar alla kandidater parallellt (adressen räknas ut ur filnamnet, inget API).
3. `node frilagg.mjs 0 2 <namn…>` och `node frilagg.mjs 1 2 <namn…>` samtidigt – frilägger (12 s/bild, två processer).
4. `python3 valj.py ['{"nyckel": kandidatnr}']` – poängsätter, väljer bästa per modell, gör studiobild + översiktsblad `blad*.jpg`. Titta på bladen; tvinga annan kandidat vid bakifrånbild.
5. `python3 lagg_in.py '{"nyckel":"Märke|Modell"}'` – kopierar bilden, lägger till FOTON (fotograf/licens), FOTOALIAS och FRILAGDA i kalla/app.js. Kör sedan build.py.
Hämta alltid originalet (inte en beskuren bild) – bilar som skär bildkanten ger dålig friläggning.

**Sedan 16 nov är bilbilderna genomskinliga.** `lagg_in.py` sparar bilen frilagd (utan bakgrund och skugga) i `-480.webp`/`-960.webp` via `genomskinlig.py`, med samma storlek och placering för alla bilar. Sidan ritar själv bakgrunden ("scenen") och markskuggan i rätt färg för ljust och mörkt läge. `build.py` skapar bara WebP från jpg om WebP saknas.
Ska en befintlig bild göras om: frilägg den (`node frilagg.mjs …`) och kör `python3 -c "import genomskinlig; genomskinlig.gor('nyckel', 'ut/nyckel_0.png')"`.
