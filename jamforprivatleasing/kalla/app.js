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
    const KONTROLL = "11 nov 2026"; // uppdateras vid varje daglig kontroll
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
    const BWORT = {};
    // --- BWORT SLUT ---
    // En handlarannons från Bilweb. Kort form för att hålla filen liten:
    // BW(märke, modellnamn, variant, bild, drivmedel, kr/mån, mil/år (0 = står inte i annonsen), säljare, ort, sökväg hos Bilweb, annonsens datum, insats, karosstyp)
    function BW(marke, mnamn, modell, foto, drivmedel, manad, mil, saljare, ort, vag, dat, forhojd, kaross) {
      const o = BWORT[ort] || [];
      const noter = [`Annons hos ${saljare}, uppdaterad ${dat}`];
      if (!mil) noter.push("Körsträckan framgår inte av annonsen – fråga handlaren");
      if (forhojd) noter.push(`Priset förutsätter ${forhojd.toLocaleString("sv-SE")} kr i insats/förhöjd första hyra`);
      return B(marke, modell, foto, drivmedel, manad, mil || 1000, null, { mnamn, kaross: kaross || "", kalla: saljare + " (via Bilweb)", url: "https://bilweb.se/" + vag,
        ort, ortpos: o[0] || null, ortlan: o[1] || "", service: null, not: noter.join(". "), tillval: "inga", bilweb: true, annonsdatum: dat, forhojd: forhojd || 0, milokand: !mil });
    }

    // En lagerbil hos Hedin Automotive med Hedins egna privatleasinguppgifter (pris, avgifter, körsträcka):
    // HD(märke, modellnamn, variant, bild, drivmedel, kr/mån, mil/år, uppläggning, avi/mån, ort, [lat, lon], id/slug, service ingår (1/0), karosstyp)
    function HD(marke, mnamn, modell, foto, drivmedel, manad, mil, start, adm, ort, pos, vag, service, kaross) {
      return B(marke, modell, foto, drivmedel, manad, mil, null, { mnamn, kaross: kaross || "", kalla: "Hedin Automotive " + ort, url: "https://hedinautomotive.se/bilar/kop-bil/" + vag,
        start, adm, ort, ortpos: pos || null, ortlan: "", service: service ? true : null, not: "Lagerbil hos Hedin Automotive " + ort + ". Skatt, vinterhjul och försäkring tillkommer", tillval: "inga", hedin: true });
    }

    const BILAR = [
      // --- HEDIN START ---
      // --- HEDIN SLUT ---
      // --- BILWEB START: handlarnas egna annonser från Bilweb (genereras av verktyg/gen_bilweb.py – ändra inte för hand) ---
      B("Audi", "A3 Sedan 35", "a3sedan", "Bensin", 2895, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-a3-sedan-35-tfsi-s-tronic-proline-privatleasing-2027-halvkombi-435298", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 20 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "A3 Sportback 35", "a3", "Bensin", 2795, 1000, null, {"kalla": "Börjessons Bil i Ängelholm AB (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-a3-sportback-35-tfsi-150-hk-s-tronic-privatleasing-2027-halvkombi-454393", "ort": "Ängelholm", "ortpos": [55.8, 13.4], "ortlan": "Skåne", "service": null, "not": "Annons hos Börjessons Bil i Ängelholm AB, uppdaterad 4 nov", "tillval": "inga", "bilweb": true}),
      B("Audi", "A3 Sportback 35", "a3", "Bensin", 2795, 1000, null, {"kalla": "Din Bil / Audi Gävle (via Bilweb)", "url": "https://bilweb.se/gavleborgs-lan/audi-a3-sportback-35-tfsi-s-tronic-privatleasing-2027-halvkombi-437494", "ort": "Gävle", "ortpos": [60.67, 17.14], "ortlan": "Gävleborg", "service": null, "not": "Annons hos Din Bil / Audi Gävle, uppdaterad 21 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Audi", "A3 Sportback 35", "a3", "Bensin", 2795, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-a3-sportback-35-tfsi-s-tronic-proline-privatleasing-2027-halvkombi-415950", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "A5 E-HYBRID", "a5", "Laddhybrid", 4395, 1000, null, {"kalla": "Toveks Bil Varberg (via Bilweb)", "url": "https://bilweb.se/hallands-lan/audi-a5-e-hybrid-privatleasing-kampanj-2027-sportkupe-461977", "ort": "Åskloster", "ortpos": [56.9, 12.7], "ortlan": "Halland", "service": null, "not": "Annons hos Toveks Bil Varberg, uppdaterad 11 nov", "tillval": "inga", "bilweb": true}),
      B("Audi", "A5 Sedan e-hybrid", "a5", "Laddhybrid", 4395, 1000, null, {"kalla": "Din Bil / Audi Göteborg (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/audi-a5-sedan-e-hybrid-quattro-299hk-privatleasing-4395kr-man-2027-sportkupe-421779", "ort": "Mölndal", "ortpos": [57.66, 12.01], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Audi Göteborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "A5 Sedan e-hybrid", "a5", "Laddhybrid", 4595, 1000, null, {"kalla": "Din Bil / Audi Södertälje (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/audi-a5-sedan-e-hybrid-quattro-proline-299hk-privatleasing-2027-sportkupe-441887", "ort": "Södertälje", "ortpos": [59.2, 17.63], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Audi Södertälje, uppdaterad 24 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Audi", "A5", "a5", "Laddhybrid", 4595, 1000, null, {"kalla": "Toveks Bil Varberg (via Bilweb)", "url": "https://bilweb.se/hallands-lan/audi-a5-privatleasing-4-595kr-man-2027-sportkupe-408373", "ort": "Åskloster", "ortpos": [56.9, 12.7], "ortlan": "Halland", "service": null, "not": "Annons hos Toveks Bil Varberg, uppdaterad 6 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Audi", "A5", "a5", "Laddhybrid", 4795, 1000, null, {"kalla": "Bilia Haninge Audi (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/audi-a5-privatleasing-4795kr-man-2027-sportkupe-426672", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Audi, uppdaterad 13 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4395, 1000, null, {"kalla": "Din Bil / Audi Södertälje (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/audi-a5-avant-e-hybrid-quattro-proline-299hk-privatleasing-2027-sportkupe-441886", "ort": "Södertälje", "ortpos": [59.2, 17.63], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Audi Södertälje, uppdaterad 24 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Audi", "A5 Avant laddhybrid", "a5avant", "Laddhybrid", 4395, 1000, null, {"kalla": "Din Bil / Audi Gävle (via Bilweb)", "url": "https://bilweb.se/gavleborgs-lan/audi-a5-avant-laddhybrid-quattro-s-tronic-299hk-privatleasing-2027-sportkupe-437492", "ort": "Gävle", "ortpos": [60.67, 17.14], "ortlan": "Gävleborg", "service": null, "not": "Annons hos Din Bil / Audi Gävle, uppdaterad 21 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Audi", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4395, 1000, null, {"kalla": "Din Bil / Audi Göteborg (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/audi-a5-avant-e-hybrid-quattro-299hk-privatleasing-4395kr-man-2027-sportkupe-421777", "ort": "Mölndal", "ortpos": [57.66, 12.01], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Audi Göteborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 4395, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-a5-avant-e-hybrid-q-s-tr-proline-299-hk-privatleasing-2027-sportkupe-415993", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "A5 Avant Quattro", "a5avant", "Laddhybrid", 4995, 1000, null, {"kalla": "Börjessons Karlskrona (via Bilweb)", "url": "https://bilweb.se/blekinge-lan/audi-a5-avant-quattro-laddhybrid-299hk-106km-privatleasing-2026-sportkupe-421414", "ort": "Karlskrona", "ortpos": [56.16, 15.59], "ortlan": "Blekinge", "service": null, "not": "Annons hos Börjessons Karlskrona, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "A5 Avant e-hybrid", "a5avant", "Laddhybrid", 5095, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-a5-avant-e-hybrid-q-s-tronic-s-line-privatleasing-2027-sportkupe-415961", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q4 e-tron SUV Proline", "q4", "El", 4995, 1000, null, {"kalla": "Din Bil / Audi Göteborg (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/audi-q4-e-tron-suv-proline-performance-privatleasing-2027-crossover-421781", "ort": "Mölndal", "ortpos": [57.66, 12.01], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Audi Göteborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q4 e-tron Proline Performance", "q4", "El", 4995, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-q4-e-tron-proline-performance-edition-privatleasing-2027-crossover-415968", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q4 e-tron E-tron 286hk", "q4", "El", 5345, 1000, null, {"kalla": "Börjessons Karlskrona (via Bilweb)", "url": "https://bilweb.se/blekinge-lan/audi-q4-e-tron-e-tron-286hk-proline-performance-privatleasing-2027-crossover-421495", "ort": "Karlskrona", "ortpos": [56.16, 15.59], "ortlan": "Blekinge", "service": null, "not": "Annons hos Börjessons Karlskrona, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Audi", "Q4 e-tron Sportback Performance", "q4", "El", 5395, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-q4-e-tron-sportback-performance-proline-privatleasing-2027-crossover-461726", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 11 nov", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q6 e-tron Proline 185 KW", "q6", "El", 6395, 1000, null, {"kalla": "Din Bil / Audi Gävle (via Bilweb)", "url": "https://bilweb.se/gavleborgs-lan/audi-q6-e-tron-proline-185-kw-privatleasing-2027-suv-440904", "ort": "Gävle", "ortpos": [60.67, 17.14], "ortlan": "Gävleborg", "service": null, "not": "Annons hos Din Bil / Audi Gävle, uppdaterad 23 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Audi", "Q6 e-tron SUV e-tron", "q6", "El", 6395, 1000, null, {"kalla": "Din Bil / Audi Hammarby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/audi-q6-e-tron-suv-e-tron-185-00-kw-proline-privatleasing-2027-suv-427164", "ort": "Stockholm", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Audi Hammarby, uppdaterad 13 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q6 e-tron e-tron Proline", "q6", "El", 6395, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-q6-e-tron-e-tron-proline-privatleasing-2027-suv-415942", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q6 e-tron Proline 185 Kw", "q6", "El", 6395, 1000, null, {"kalla": "Din Bil / Audi Hudiksvall (via Bilweb)", "url": "https://bilweb.se/gavleborgs-lan/audi-q6-e-tron-proline-185-kw-privatleasing-2027-suv-412895", "ort": "Hudiksvall", "ortpos": [61.0, 16.8], "ortlan": "Gävleborg", "service": null, "not": "Annons hos Din Bil / Audi Hudiksvall, uppdaterad 9 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q6 e-tron e-tron Sportback", "q6", "El", 6795, 1000, null, {"kalla": "Din Bil / Audi Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/audi-q6-e-tron-e-tron-sportback-proline-privatleasing-2027-suv-415944", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Audi Helsingborg, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Audi", "Q6 e-tron SUV e-tron", "q6", "El", 6995, 1000, null, {"kalla": "Din Bil / Audi Hammarby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/audi-q6-e-tron-suv-e-tron-performan-225-00-kw-proline-privatleasing-2027-suv-427163", "ort": "Stockholm", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Audi Hammarby, uppdaterad 13 okt", "tillval": "inga", "bilweb": true}),
      B("BMW", "120", "bmw120", "Bensin", 3795, 1000, null, {"kalla": "Förenade Bil i Ängelholm (via Bilweb)", "url": "https://bilweb.se/skane-lan/bmw-120-privatleasing-fran-3-795-kr-man-2026-halvkombi-418628", "ort": "Ängelholm", "ortpos": [55.8, 13.4], "ortlan": "Skåne", "service": null, "not": "Annons hos Förenade Bil i Ängelholm, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("BYD", "Seal 6 Comfort", "seal6", "Laddhybrid", 4869, 1000, null, {"kalla": "Hedin Automotive Akalla (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/byd-seal-6-comfort-privatleasing-4869kr-man-2025-halvkombi-429942", "ort": "Kista", "ortpos": [59.4, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Hedin Automotive Akalla, uppdaterad 15 okt", "tillval": "inga", "bilweb": true}),
      B("Cupra", "Born 58kWh 190hk", "born", "El", 3945, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/cupra-born-58kwh-190hk-privatleasing-nya-2027-halvkombi-424405", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 12 okt. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000}),
      B("Cupra", "Formentor eTSI 150hk", "formentor", "Bensin", 2845, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/cupra-formentor-etsi-150hk-dsg-tribe-edition-privatleasing-2026-suv-424403", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 12 okt. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000}),
      B("Cupra", "Formentor eTSI 150hk", "formentor", "Bensin", 2845, 1000, null, {"kalla": "Atteviks Bil AB - Jönköping (via Bilweb)", "url": "https://bilweb.se/jonkopings-lan/cupra-formentor-etsi-150hk-dsg-tribe-edition-privatleasing-2026-suv-411819", "ort": "Jönköping", "ortpos": [57.78, 14.16], "ortlan": "Jönköping", "service": null, "not": "Annons hos Atteviks Bil AB - Jönköping, uppdaterad 8 okt. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000}),
      B("Cupra", "Formentor eTSI150hk", "formentor", "Bensin", 3649, 1000, null, {"kalla": "CUPRA Haninge Bilia (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/cupra-formentor-etsi150hk-privatleasing-inkl-edgepaket-2027-suv-414251", "ort": "Österhaninge", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos CUPRA Haninge Bilia, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Cupra", "Formentor eTSI 150hk", "formentor", "Bensin", 3795, 1000, null, {"kalla": "CUPRA Haninge Bilia (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/cupra-formentor-etsi-150hk-b-w-privatleasing-2026-suv-428774", "ort": "Österhaninge", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos CUPRA Haninge Bilia, uppdaterad 14 okt", "tillval": "inga", "bilweb": true}),
      B("Cupra", "Leon 1.5 E-HYBRID", "leon", "Laddhybrid", 4595, 1000, null, {"kalla": "CUPRA Haninge Bilia (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/cupra-leon-1-5-e-hybrid-204-dsg-privatleasing-lagerbil-2026-suv-414248", "ort": "Österhaninge", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos CUPRA Haninge Bilia, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Cupra", "Leon Sportstourer eTSI", "cupraleon", "Bensin", 3445, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/cupra-leon-sportstourer-etsi-150hk-privatleasing-2026-suv-424400", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 12 okt. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000}),
      B("Cupra", "Raval Plus 37 kWh", "raval", "El", 3145, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/cupra-raval-plus-37-kwh-135hk-privatleasing-2026-halvkombi-424399", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 12 okt. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000}),
      B("Cupra", "Raval Endurance 52 kWh", "raval", "El", 3345, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/cupra-raval-endurance-52-kwh-210hk-privatleasing-2026-halvkombi-424401", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 12 okt. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000}),
      B("Cupra", "Raval Endurance 52kWh", "raval", "El", 4250, 1000, null, {"kalla": "Aftén Bil CUPRA Nybil Upplands Väsby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/cupra-raval-endurance-52kwh-privatleaisng-ink-vinterhjul-2027-halvkombi-457621", "ort": "Upplands Väsby", "ortpos": [59.52, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil CUPRA Nybil Upplands Väsby, uppdaterad 6 nov", "tillval": "inga", "bilweb": true}),
      B("Cupra", "Raval VZ 52kWh", "raval", "El", 4395, 1000, null, {"kalla": "Frontbilar AB (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/cupra-raval-vz-52kwh-225hk-privatleasing-2027-halvkombi-412259", "ort": "Hisings Kärra", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Frontbilar AB, uppdaterad 8 okt. Priset förutsätter 10 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 10000}),
      B("Cupra", "Terramar 150 eTSI", "terramar", "Bensin", 2995, 1000, null, {"kalla": "Frontbilar AB (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/cupra-terramar-150-etsi-privatleasing-bast-i-sverige-erbjudande-2026-suv-413690", "ort": "Hisings Kärra", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Frontbilar AB, uppdaterad 9 okt. Priset förutsätter 10 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 10000}),
      B("Cupra", "Terramar 1.5 eTSI", "terramar", "Bensin", 3595, 1000, null, {"kalla": "CUPRA Haninge Bilia (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/cupra-terramar-1-5-etsi-150hk-privatleasing-inkl-edgepaket-2026-suv-414250", "ort": "Österhaninge", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos CUPRA Haninge Bilia, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Hyundai", "Kona Hybrid Automat", "kona", "Hybrid", 2703, 1000, null, {"kalla": "RA Motor AB - Uppsala Nya bilar (via Bilweb)", "url": "https://bilweb.se/uppsala-lan/hyundai-kona-hybrid-automat-essential-privatleasing-med-fast-hyra-2026-suv-460372", "ort": "Uppsala", "ortpos": [59.86, 17.64], "ortlan": "Uppsala", "service": null, "not": "Annons hos RA Motor AB - Uppsala Nya bilar, uppdaterad 9 nov. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Hyundai", "Tucson Hybrid 2WD", "tucson", "Hybrid", 2903, 1000, null, {"kalla": "RA Motor AB - Uppsala Nya bilar (via Bilweb)", "url": "https://bilweb.se/uppsala-lan/hyundai-tucson-hybrid-2wd-essential-privatleasing-med-fast-hyra-2027-suv-460373", "ort": "Uppsala", "ortpos": [59.86, 17.64], "ortlan": "Uppsala", "service": null, "not": "Annons hos RA Motor AB - Uppsala Nya bilar, uppdaterad 9 nov. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Hyundai", "Tucson Plug-in-Hybrid 2WD", "tucson", "Laddhybrid", 3103, 1000, null, {"kalla": "RA Motor AB - Uppsala Nya bilar (via Bilweb)", "url": "https://bilweb.se/uppsala-lan/hyundai-tucson-plug-in-hybrid-2wd-essential-privatleasing-fast-hyra-2027-suv-460366", "ort": "Uppsala", "ortpos": [59.86, 17.64], "ortlan": "Uppsala", "service": null, "not": "Annons hos RA Motor AB - Uppsala Nya bilar, uppdaterad 9 nov. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Hyundai", "i20 1.0T Automat", "i20", "Bensin", 2995, 1000, null, {"kalla": "RA Motor AB - Uppsala Nya bilar (via Bilweb)", "url": "https://bilweb.se/uppsala-lan/hyundai-i20-1-0t-automat-advanced-privatleasing-2027-halvkombi-402719", "ort": "Uppsala", "ortpos": [59.86, 17.64], "ortlan": "Uppsala", "service": null, "not": "Annons hos RA Motor AB - Uppsala Nya bilar, uppdaterad 1 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Kia", "EV2 Standard Range", "ev2", "El", 3495, 1000, null, {"kalla": "Aftén Bil KIA Nybil Barkarby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-ev2-standard-range-privatleasing-kampanj-snabb-leverans-2027-suv-441734", "ort": "Järfälla", "ortpos": [59.43, 17.83], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Barkarby, uppdaterad 24 okt", "tillval": "inga", "bilweb": true}),
      B("Kia", "EV2 Plus Standard Range", "ev2", "El", 3695, 1000, null, {"kalla": "Wafab Bil AB, Arvika (via Bilweb)", "url": "https://bilweb.se/varmlands-lan/kia-ev2-plus-standard-range-42-2-kwh-privatleasing-2027-suv-402753", "ort": "Arvika", "ortpos": [59.38, 13.5], "ortlan": "Värmland", "service": null, "not": "Annons hos Wafab Bil AB, Arvika, uppdaterad 1 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Kia", "EV3 Long Range 81.4 kWh", "ev3", "El", 3900, 1000, null, {"kalla": "Aftén Bil KIA Nybil Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-ev3-long-range-81-4-kwh-privatleasing-kampanj-3900kr-2027-suv-410364", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Bromma, uppdaterad 7 okt. Priset förutsätter 20 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 20000}),
      B("Kia", "EV3 Long Range 81.4 kWh", "ev3", "El", 4495, 1000, null, {"kalla": "Aftén Bil KIA Nybil Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-ev3-long-range-81-4-kwh-privatleasing-4495kr-2027-suv-439042", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Bromma, uppdaterad 22 okt", "tillval": "inga", "bilweb": true}),
      B("Kia", "EV3 Plus AWD", "ev3", "El", 4943, 1000, null, {"kalla": "Aftén Bil KIA Nybil Barkarby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-ev3-plus-awd-long-range-265hk-privatleasing-kampanj-2027-suv-432897", "ort": "Järfälla", "ortpos": [59.43, 17.83], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Barkarby, uppdaterad 17 okt", "tillval": "inga", "bilweb": true}),
      B("Kia", "EV3 GT-Line AWD", "ev3", "El", 5795, 1000, null, {"kalla": "Aftén Bil KIA Nybil Barkarby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-ev3-gt-line-awd-265hk-privatleasing-tillfallig-kampanj-2027-suv-432898", "ort": "Järfälla", "ortpos": [59.43, 17.83], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Barkarby, uppdaterad 17 okt", "tillval": "inga", "bilweb": true}),
      B("Kia", "EV3 Plus AWD", "ev3", "El", 5395, 1000, null, {"kalla": "Aftén Bil KIA Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-ev3-plus-awd-long-range-privatleasing-2027-suv-432501", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Åkersberga, uppdaterad 16 okt. Priset förutsätter 20 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 20000}),
      B("Kia", "EV3 GT-Line AWD", "ev3", "El", 5795, 1000, null, {"kalla": "Aftén Bil KIA Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-ev3-gt-line-awd-long-range-privatleasing-2027-suv-432502", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Åkersberga, uppdaterad 16 okt. Priset förutsätter 20 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 20000}),
      B("Kia", "K4 SW ACTION", "k4sw", "Bensin", 2996, 1000, null, {"kalla": "Aftén Bil KIA Nybil Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-k4-sw-action-115hk-privatleasing-2996kr-man-2026-kombi-412708", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Bromma, uppdaterad 9 okt. Priset förutsätter 20 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 20000}),
      B("Kia", "K4 Action Mildhybrid", "k4sw", "Hybrid", 3296, 1000, null, {"kalla": "Aftén Bil KIA Nybil Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-k4-action-mildhybrid-automat-privatleasing-3296kr-man-2026-kombi-412707", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Bromma, uppdaterad 9 okt. Priset förutsätter 20 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 20000}),
      B("Kia", "K4 SW Action", "k4sw", "Bensin", 3895, 1000, null, {"kalla": "Aftén Bil KIA Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-k4-sw-action-1-0-t-gdi-mildhybrid-automat-privatleasing-2026-kombi-442440", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Åkersberga, uppdaterad 26 okt", "tillval": "inga", "bilweb": true}),
      B("Kia", "Sportage PHEV GT-LINE", "sportage", "Laddhybrid", 5595, 1000, null, {"kalla": "Aftén Bil KIA Nybil Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-sportage-phev-gt-line-privatleasing-inkl-d-krok-dackhotell-2027-suv-457517", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Bromma, uppdaterad 6 nov", "tillval": "inga", "bilweb": true}),
      B("Kia", "Sportage PHEV GT-Line", "sportage", "Laddhybrid", 5595, 1000, null, {"kalla": "Aftén Bil KIA Nybil Barkarby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-sportage-phev-gt-line-pano-privatleasing-2027-suv-409927", "ort": "Järfälla", "ortpos": [59.43, 17.83], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Barkarby, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Kia", "Stonic Action 100hk", "stonic", "Bensin", 3295, 1000, null, {"kalla": "Aftén Bil KIA Nybil Barkarby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/kia-stonic-action-100hk-my26-privatleasing-kampanj-2026-suv-401528", "ort": "Järfälla", "ortpos": [59.43, 17.83], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil KIA Nybil Barkarby, uppdaterad 1 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Nissan", "Juke DIG-T 114 hk", "juke", "Bensin", 2995, 1000, null, {"kalla": "Bilia Haninge - Volvo (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/nissan-juke-dig-t-114-hk-at-acenta-privatleasing-kampanj-2025-suv-417086", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Volvo, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Nissan", "Qashqai Acenta MHEV", "qashqai", "Hybrid", 2995, 1000, null, {"kalla": "Bilia Haninge - Volvo (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/nissan-qashqai-acenta-mhev-privatleasing-superkampanj-2025-suv-417081", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Volvo, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Nissan", "Qashqai Acenta Mhev", "qashqai", "Bensin", 2995, 1000, null, {"kalla": "RA Motor AB - Kungsängen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/nissan-qashqai-acenta-mhev-privatleasing-kampanj-2026-suv-405160", "ort": "Kungsängen", "ortpos": [59.48, 17.75], "ortlan": "Stockholm", "service": null, "not": "Annons hos RA Motor AB - Kungsängen, uppdaterad 3 okt", "tillval": "inga", "bilweb": true}),
      B("Nissan", "Qashqai", "qashqai", "Hybrid", 2995, 1000, null, {"kalla": "Landrins Bil Västerås Hälla (via Bilweb)", "url": "https://bilweb.se/vastmanlands-lan/nissan-qashqai-privatleasing-mildhybrid-xtronic-aut-2wd-acenta-2026-suv-402822", "ort": "Västerås", "ortpos": [59.61, 16.55], "ortlan": "Västmanland", "service": null, "not": "Annons hos Landrins Bil Västerås Hälla, uppdaterad 1 okt", "tillval": "inga", "bilweb": true}),
      B("Nissan", "Qashqai Acenta E-Power", "qashqai", "Hybrid", 3995, 1000, null, {"kalla": "RA Motor AB - Kungsängen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/nissan-qashqai-acenta-e-power-privatleasing-kampanj-2026-suv-405161", "ort": "Kungsängen", "ortpos": [59.48, 17.75], "ortlan": "Stockholm", "service": null, "not": "Annons hos RA Motor AB - Kungsängen, uppdaterad 3 okt", "tillval": "inga", "bilweb": true}),
      B("Nissan", "Qashqai", "qashqai", "Hybrid", 3995, 1000, null, {"kalla": "Landrins Bil Västerås Hälla (via Bilweb)", "url": "https://bilweb.se/vastmanlands-lan/nissan-qashqai-privatleasing-epower-acenta-base-2026-suv-402821", "ort": "Västerås", "ortpos": [59.61, 16.55], "ortlan": "Västmanland", "service": null, "not": "Annons hos Landrins Bil Västerås Hälla, uppdaterad 1 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Helsingborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-446329", "ort": "Helsingborg", "ortpos": [56.05, 12.69], "ortlan": "Skåne", "service": null, "not": "Annons hos J BIL Helsingborg, uppdaterad 28 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Tagene (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-445839", "ort": "Hisings Kärra", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos J BIL Tagene, uppdaterad 28 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Lund (via Bilweb)", "url": "https://bilweb.se/skane-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-432307", "ort": "Lund", "ortpos": [55.7, 13.19], "ortlan": "Skåne", "service": null, "not": "Annons hos J BIL Lund, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Falkenberg (via Bilweb)", "url": "https://bilweb.se/hallands-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-432102", "ort": "Falkenberg", "ortpos": [56.9, 12.7], "ortlan": "Halland", "service": null, "not": "Annons hos J BIL Falkenberg, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Kristianstad (via Bilweb)", "url": "https://bilweb.se/skane-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-432068", "ort": "Kristianstad", "ortpos": [56.03, 14.16], "ortlan": "Skåne", "service": null, "not": "Annons hos J BIL Kristianstad, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Haninge (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-431209", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos J BIL Haninge, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Väsby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-431195", "ort": "Upplands Väsby", "ortpos": [59.52, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos J BIL Väsby, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "2008 Allure Hybrid", "p2008", "Hybrid", 2799, 1000, null, {"kalla": "J BIL Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/peugeot-2008-allure-hybrid-145hk-aut-privatleasing-ink-vinterhjul-2026-suv-431181", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos J BIL Täby, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Peugeot", "3008 GT HYBRID", "p3008", "Hybrid", 3973, 1000, null, {"kalla": "Eksjö Bilaffär AB (via Bilweb)", "url": "https://bilweb.se/jonkopings-lan/peugeot-3008-gt-hybrid-privatleasing-panoramaglastak-focal-hifi-2026-suv-428811", "ort": "Eksjö", "ortpos": [57.78, 14.16], "ortlan": "Jönköping", "service": null, "not": "Annons hos Eksjö Bilaffär AB, uppdaterad 14 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Polestar", "4 Coupé Dual", "pol4", "El", 7295, 1000, null, {"kalla": "Volvo Car Hisings Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/polestar-4-coupe-dual-motor-privatleasing-7-295-kr-man-2027-suv-456660", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Volvo Car Hisings Backa, uppdaterad 5 nov. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Polestar", "4 Dual motor", "pol4", "El", 7295, 1500, null, {"kalla": "Volvo Car Kista (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/polestar-4-dual-motor-privatleasing-fran-7295kr-manad-2027-suv-444279", "ort": "Sollentuna", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Kista, uppdaterad 27 okt", "tillval": "inga", "bilweb": true}),
      B("Polestar", "4 Business edition", "pol4", "El", 9208, 1500, null, {"kalla": "Volvo Car Kista (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/polestar-4-business-edition-privatleasing-fran-6995-kr-manad-2027-suv-459585", "ort": "Sollentuna", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Kista, uppdaterad 7 nov", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Elroq Selection 60", "elroq", "El", 3995, 1000, null, {"kalla": "Börjessons Bil i Alingsås (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/skoda-elroq-selection-60-explore-edition-privatleasing-3995-man-2027-suv-426151", "ort": "Alingsås", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Börjessons Bil i Alingsås, uppdaterad 13 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Elroq 60", "elroq", "El", 3995, 1000, null, {"kalla": "Din Bil / Skoda Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-elroq-60-privatleasing-2027-suv-418904", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Täby, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Elroq 85x", "elroq", "El", 5395, 1000, null, {"kalla": "Din Bil / Skoda Sätra (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-elroq-85x-fr-5-395kr-man-privatleasing-dragkrok-4x4-2027-suv-421998", "ort": "Skärholmen", "ortpos": [59.28, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Sätra, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Enyaq 85 Selection", "enyaq", "El", 4995, 1000, null, {"kalla": "Din Bil / Skoda Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-85-selection-4-995-manad-privatleasing-2027-suv-436473", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Bromma, uppdaterad 20 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Enyaq 85 Solid", "enyaq", "El", 4995, 1000, null, {"kalla": "Din Bil / Skoda Sätra (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-85-solid-edition-privatleasing-fr-4-995kr-man-2027-suv-421993", "ort": "Skärholmen", "ortpos": [59.28, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Sätra, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Skoda", "Enyaq 85", "enyaq", "El", 4995, 1000, null, {"kalla": "Din Bil / Skoda Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-85-privatleasing-2027-suv-418914", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Täby, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Enyaq 85 Backkamera", "enyaq", "El", 4995, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/skoda-enyaq-85-backkamera-drag-navigation-privatleasing-2027-suv-410072", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Enyaq Sportline 85X", "enyaq", "El", 5625, 1000, null, {"kalla": "Din Bil / Skoda Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-sportline-85x-5-625-man-privatleasing-2027-suv-461666", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Bromma, uppdaterad 11 nov. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Skoda", "Enyaq 85x Sportline", "enyaq", "El", 5970, 1000, null, {"kalla": "Din Bil / Skoda Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-85x-sportline-privatleasing-2027-suv-418936", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Täby, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Enyaq Coupé RS", "enyaqc", "El", 5495, 1000, null, {"kalla": "Din Bil / Skoda Bromma (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-coupe-rs-340-hk-hostkampanj-5-495-man-privatleasing-2027-suv-461663", "ort": "Bromma", "ortpos": [59.34, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Bromma, uppdaterad 11 nov. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Skoda", "Enyaq Coupe RS", "enyaqc", "El", 5495, 1000, null, {"kalla": "Din Bil / Skoda Sätra (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-coupe-rs-coupe-rs-hostkampanj-5-495-man-privatleasing-2027-suv-422005", "ort": "Skärholmen", "ortpos": [59.28, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Sätra, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Enyaq Coupe RS", "enyaqc", "El", 5995, 1000, null, {"kalla": "Din Bil / Skoda Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-enyaq-coupe-rs-coupe-rs-fran-5-995kr-man-privatleasing-2027-suv-418933", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Täby, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Epiq 35 ESSENCE", "epiq", "El", 2795, 1000, null, {"kalla": "Börjessons Bil i Alingsås (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/skoda-epiq-35-essence-privatleasing-fran-2-795-kr-man-2027-suv-433149", "ort": "Alingsås", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Börjessons Bil i Alingsås, uppdaterad 17 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Skoda", "Epiq 55 ESSENCE", "epiq", "El", 3295, 1000, null, {"kalla": "Börjessons Bil i Alingsås (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/skoda-epiq-55-essence-privatleasing-fran-3-295-kr-man-2027-suv-433148", "ort": "Alingsås", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Börjessons Bil i Alingsås, uppdaterad 17 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Skoda", "Epiq", "epiq", "El", 3295, 1000, null, {"kalla": "Din Bil / Skoda Sätra (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-epiq-fr-3-295-man-privatleasing-55-essence-211hk-2027-suv-421982", "ort": "Skärholmen", "ortpos": [59.28, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Sätra, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Epiq 55 Essence", "epiq", "El", 3295, 1000, null, {"kalla": "Din Bil / Skoda Bredden (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-epiq-55-essence-privatleasing-3-295-2027-suv-420315", "ort": "Upplands Väsby", "ortpos": [59.52, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Bredden, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Skoda", "Epiq 55 Essence", "epiq", "El", 3295, 1000, null, {"kalla": "Din Bil / Skoda Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-epiq-55-essence-privatleasing-2027-suv-418927", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Täby, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Epiq 55 Essence", "epiq", "El", 3295, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/skoda-epiq-55-essence-privatleasing-2027-suv-410074", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Kodiaq Selection Laddhybrid", "kodiaq", "Laddhybrid", 5280, 1000, null, {"kalla": "Din Bil / Skoda Sätra (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-kodiaq-selection-laddhybrid-privatleasing-fran-5280kr-man-2027-suv-448251", "ort": "Skärholmen", "ortpos": [59.28, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Sätra, uppdaterad 29 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Peaq 90", "peaq", "El", 6945, 1000, null, {"kalla": "Din Bil / Skoda Sätra (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-peaq-90-privatleasing-5-eller-7-sits-2027-suv-421985", "ort": "Skärholmen", "ortpos": [59.28, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Sätra, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Peaq 90", "peaq", "El", 6949, 1000, null, {"kalla": "Din Bil / Skoda Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-peaq-90-privatleasing-2027-suv-418919", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Täby, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Peaq 90X 4X4", "peaq", "Bensin", 7095, 1000, null, {"kalla": "CUPRA Nacka Bilia (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-peaq-90x-4x4-privatleasing-7095-hos-bilia-nacka-2027-suv-460987", "ort": "Nacka", "ortpos": [59.31, 18.16], "ortlan": "Stockholm", "service": null, "not": "Annons hos CUPRA Nacka Bilia, uppdaterad 9 nov. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Skoda", "Peaq 90X", "peaq", "El", 7395, 1000, null, {"kalla": "Din Bil / Skoda Sätra (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-peaq-90x-privatleasing-finns-som-7-sits-4x4-2027-suv-422019", "ort": "Skärholmen", "ortpos": [59.28, 17.91], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Sätra, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Skoda", "Superb Combi Selection", "superb", "Hybrid", 4995, 1000, null, {"kalla": "Din Bil / Skoda Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/skoda-superb-combi-selection-iv-privatleasing-2027-kombi-418945", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Skoda Täby, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "Aygo X", "aygox", "Bensin", 2995, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-aygo-x-privatleasing-fast-ranta-2025-halvkombi-418720", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "C-HR Nya HEV", "chr", "Bensin", 3595, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-c-hr-nya-hev-privatleasing-fast-ranta-2025-suv-418718", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "Corolla Cross 1,8 Active", "corollacross", "Hybrid", 4595, 1500, null, {"kalla": "Bilia Eskilstuna - Toyota (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/toyota-corolla-cross-1-8-active-privatleasing-fast-ranta-2025-crossover-421636", "ort": "Eskilstuna", "ortpos": [59.37, 16.51], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Eskilstuna - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "Corolla Cross Hybrid", "corollacross", "Hybrid", 4595, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-corolla-cross-hybrid-privatleasing-fast-ranta-2025-crossover-418719", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "Corolla Cross Hybrid Active", "corollacross", "Hybrid", 4595, 1000, null, {"kalla": "Bilia Kungens Kurva - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-corolla-cross-hybrid-active-privatleasing-2026-crossover-415900", "ort": "Kungens Kurva", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Kungens Kurva - Toyota, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Toyota", "Corolla 1.8 TS", "corollats", "Hybrid", 3395, 1000, null, {"kalla": "Bilia Lund - Toyota (via Bilweb)", "url": "https://bilweb.se/skane-lan/toyota-corolla-1-8-ts-hybrid-active-privatleasing-2026-kombi-421347", "ort": "Lund", "ortpos": [55.7, 13.19], "ortlan": "Skåne", "service": null, "not": "Annons hos Bilia Lund - Toyota, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Toyota", "Corolla Touring Hybrid", "corollats", "Hybrid", 3395, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-corolla-touring-hybrid-privatleasing-fast-ranta-2025-kombi-418722", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "RAV4 Hybrid", "rav4", "Hybrid", 5995, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-rav4-hybrid-privatleasing-fast-ranta-2025-suv-418708", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "RAV4 Hybrid AWD-i", "rav4", "Hybrid", 5995, 1000, null, {"kalla": "Bilia Kungens Kurva - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-rav4-hybrid-awd-i-privatleasing-2026-suv-415906", "ort": "Kungens Kurva", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Kungens Kurva - Toyota, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Toyota", "RAV4 Laddhybrid", "rav4", "Laddhybrid", 6795, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-rav4-laddhybrid-privatleasing-fast-ranta-2025-suv-418714", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "RAV4 Plug-in Hybrid", "rav4", "Laddhybrid", 7195, 1000, null, {"kalla": "Bilia Kungens Kurva - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-rav4-plug-in-hybrid-active-privatleasing-2026-suv-415892", "ort": "Kungens Kurva", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Kungens Kurva - Toyota, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Toyota", "RAV4 2.5 Laddhybrid", "rav4", "Laddhybrid", 7295, 1000, null, {"kalla": "Bilia Eskilstuna - Toyota (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/toyota-rav4-2-5-laddhybrid-active-privatleasing-fast-ranta-2025-suv-421648", "ort": "Eskilstuna", "ortpos": [59.37, 16.51], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Eskilstuna - Toyota, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Toyota", "Yaris Hybrid", "yaris", "Hybrid", 2995, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-yaris-hybrid-privatleasing-fast-ranta-2025-halvkombi-418713", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "Yaris 1.5 HSD", "yaris", "Hybrid", 3595, 1000, null, {"kalla": "Bilia Eskilstuna - Toyota (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/toyota-yaris-1-5-hsd-life-privatleasing-fast-ranta-2025-halvkombi-421663", "ort": "Eskilstuna", "ortpos": [59.37, 16.51], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Eskilstuna - Toyota, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Toyota", "Yaris Cross", "yariscross", "Bensin", 3195, 1000, null, {"kalla": "Bilia Trelleborg - Toyota (via Bilweb)", "url": "https://bilweb.se/skane-lan/toyota-yaris-cross-kampanj-privatleasing-2025-crossover-421667", "ort": "Trelleborg", "ortpos": [55.8, 13.4], "ortlan": "Skåne", "service": null, "not": "Annons hos Bilia Trelleborg - Toyota, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Toyota", "Yaris Cross 1.5 Hybrid", "yariscross", "Hybrid", 3195, 1500, null, {"kalla": "Europeiska Motor - Rissne (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-yaris-cross-1-5-hybrid-active-privatleasing-2025-crossover-419691", "ort": "Sundbyberg", "ortpos": [59.36, 17.97], "ortlan": "Stockholm", "service": null, "not": "Annons hos Europeiska Motor - Rissne, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "Yaris Cross Hybrid", "yariscross", "Hybrid", 3195, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-yaris-cross-hybrid-privatleasing-fast-ranta-2025-crossover-418721", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "bZ4X", "bz4x", "El", 5895, 1500, null, {"kalla": "Bilia Haninge - Toyota (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/toyota-bz4x-privatleasing-fast-ranta-2025-suv-418711", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Toyota", "bZ4X Active 2WD", "bz4x", "El", 5995, 1500, null, {"kalla": "Bilia Eskilstuna - Toyota (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/toyota-bz4x-active-2wd-100-el-privatleasing-fast-ranta-2025-suv-421664", "ort": "Eskilstuna", "ortpos": [59.37, 16.51], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Eskilstuna - Toyota, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Golf", "golf", "Bensin", 2895, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-golf-privatleasing-kampanj-2027-halvkombi-409512", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Golf I Life", "golf", "Bensin", 3495, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-golf-i-life-edition-etsi-150-dsg-privatleasing-2027-halvkombi-415248", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Golf Edition eTSI", "golf", "Bensin", 3575, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-golf-edition-etsi-dsg-privatleasing-2027-kombi-409487", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Golf I eTSI", "golf", "Bensin", 3695, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-golf-i-etsi-dsg-150-hk-privatleasing-omgaende-leverans-2026-halvkombi-418033", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Golf I Sportscombi", "golfsc", "Bensin", 3995, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-golf-i-sportscombi-etsi-150hk-dsg-edition-privatleasing-2027-kombi-407372", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 5 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.3 Neo Life", "id3", "El", 3895, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-3-neo-life-58-kwh-privatleasing-2027-halvkombi-417824", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.3 Neo Neo", "id3", "El", 3995, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-3-neo-neo-trend-privatleasing-fr-3995-2027-halvkombi-415359", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.3 Trend", "id3", "El", 3995, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-id-3-trend-kampanj-privatleasing-2027-halvkombi-413889", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 9 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.3 Neo NEO", "id3", "El", 4150, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-3-neo-neo-life-privatleasing-fr-4-150-kr-man-kampanj-2027-halvkombi-427571", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 14 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.3 Neo Life", "id3", "El", 4195, 1000, null, {"kalla": "Din Bil / Volkswagen Trelleborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/volkswagen-id-3-neo-life-58kwh-492km-rackvidd-privatleasing-fr-4195-2027-halvkombi-433726", "ort": "Trelleborg", "ortpos": [55.8, 13.4], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Volkswagen Trelleborg, uppdaterad 19 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.3 Neo Neo", "id3", "El", 4195, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-3-neo-neo-life-58-kwh-privatleasing-2027-halvkombi-417827", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.3 Neo Neo", "id3", "El", 4195, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-3-neo-neo-life-privatleasing-fr-4195-2027-halvkombi-415354", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.4 GTX SWE", "id4", "El", 5195, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-4-gtx-swe-edition-privatleasing-2027-suv-432584", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.4 GTX", "id4", "El", 5045, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-4-gtx-kampanj-privatleasing-2027-suv-439058", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000, "milokand": true}),
      B("Volkswagen", "ID.4 GTX SWE", "id4", "El", 5495, 1000, null, {"kalla": "Atteviks Bil AB - Jönköping (via Bilweb)", "url": "https://bilweb.se/jonkopings-lan/volkswagen-id-4-gtx-swe-edition-4motion-privatleasing-2027-suv-443687", "ort": "Jönköping", "ortpos": [57.78, 14.16], "ortlan": "Jönköping", "service": null, "not": "Annons hos Atteviks Bil AB - Jönköping, uppdaterad 26 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.4 GTX", "id4", "El", 5495, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-4-gtx-kampanj-privatleasing-2027-suv-439059", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.4 GTX GTX", "id4", "El", 5495, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-4-gtx-gtx-privatleasing-fran-5495-run-out-kampanj-2027-suv-432667", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 16 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.4 GTX GTX", "id4", "El", 5990, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-4-gtx-gtx-run-out-kampanj-privatleasing-4595kr-man-drag-ingar-2027-suv-433271", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 18 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Pro S", "id7", "El", 6495, 1000, null, {"kalla": "Din Bil / Volkswagen Trelleborg (via Bilweb)", "url": "https://bilweb.se/skane-lan/volkswagen-id-7-pro-s-swe-edition-86kwh-286hk-privatleasing-fr-6495-2027-sedan-433727", "ort": "Trelleborg", "ortpos": [55.8, 13.4], "ortlan": "Skåne", "service": null, "not": "Annons hos Din Bil / Volkswagen Trelleborg, uppdaterad 19 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Pro S", "id7", "El", 6495, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-7-pro-s-privatleasing-2027-sedan-415311", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Pro S", "id7", "El", 6495, 1000, null, {"kalla": "Bilkompani Kalmar (via Bilweb)", "url": "https://bilweb.se/kalmar-lan/volkswagen-id-7-pro-s-swe-edition-86kwh-286hk-677km-privatleasing-2027-sedan-404107", "ort": "Kalmar", "ortpos": [56.66, 16.36], "ortlan": "Kalmar", "service": null, "not": "Annons hos Bilkompani Kalmar, uppdaterad 2 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 PRO S", "id7", "El", 6495, 1000, null, {"kalla": "Toveks Bil i Skee (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-7-pro-s-privatleasing-6495kr-man-inkl-service-2027-sedan-400256", "ort": "Skee", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Toveks Bil i Skee, uppdaterad 30 sep", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7", "id7", "El", 7995, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-7-kampanj-privatleasing-2027-sedan-439057", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.7 GTX Edition", "id7", "El", 7995, 1000, null, {"kalla": "Bilkompani Kalmar (via Bilweb)", "url": "https://bilweb.se/kalmar-lan/volkswagen-id-7-gtx-edition-4m-86kwh-286hk-597km-privatleasing-2027-sedan-404105", "ort": "Kalmar", "ortpos": [56.66, 16.36], "ortlan": "Kalmar", "service": null, "not": "Annons hos Bilkompani Kalmar, uppdaterad 2 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Tourer PRO", "id7t", "El", 5295, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-7-tourer-pro-s-swe-edition-privatleasing-2027-sedan-417776", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Tourer PRO", "id7t", "El", 6495, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-7-tourer-pro-s-swe-edition-privatleasing-2027-sedan-417873", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Tourer Pro", "id7t", "El", 6495, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-7-tourer-pro-s-edition-privatleasing-2027-sedan-415312", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Tourer Pro", "id7t", "El", 6495, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-id-7-tourer-pro-s-swe-edition-privatleasing-2027-sedan-407375", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 5 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Tourer GTX", "id7t", "El", 7995, 1000, null, {"kalla": "Din Bil / Volkswagen Smista (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-7-tourer-gtx-privatleasing-fr-7540-man-ink-serviceavtal-2027-sedan-434857", "ort": "Segeltorp", "ortpos": [59.28, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Volkswagen Smista, uppdaterad 19 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.7 Tourer GTX", "id7t", "El", 7995, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-7-tourer-gtx-privatleasing-2027-sedan-415310", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID.7 GTX Tourer", "id7t", "El", 7995, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-id-7-gtx-tourer-privatleasing-kampanj-fr-7-995kr-man-2027-sedan-407377", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 5 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID.7 Tourer GTX", "id7t", "El", 7995, 1000, null, {"kalla": "Bilkompani Kalmar (via Bilweb)", "url": "https://bilweb.se/kalmar-lan/volkswagen-id-7-tourer-gtx-edition-4m-86kwh-340hk-597km-privatleasing-2027-sedan-404104", "ort": "Kalmar", "ortpos": [56.66, 16.36], "ortlan": "Kalmar", "service": null, "not": "Annons hos Bilkompani Kalmar, uppdaterad 2 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Cross Trend Privtaleasing", "idcross", "El", 2545, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-cross-trend-privtaleasing-2027-suv-439056", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 22 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Cross Trend 37 kWh", "idcross", "El", 2995, 1000, null, {"kalla": "Din Bil / Volkswagen Täby (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-cross-trend-37-kwh-batteri-privatleasing-fr-2995-kr-man-2027-suv-442873", "ort": "Täby", "ortpos": [59.44, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Volkswagen Täby, uppdaterad 26 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Cross Trend Privtaleasing", "idcross", "El", 2995, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-cross-trend-privtaleasing-2027-suv-439055", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 22 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Cross", "idcross", "El", 2995, 1000, null, {"kalla": "Toveks Bil i Skee (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-cross-privatleasing-fran-2995-kr-manaden-2027-suv-439004", "ort": "Skee", "ortpos": [57.9, 12.6], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Toveks Bil i Skee, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Cross Trend 37kWh", "idcross", "El", 2995, 1000, null, {"kalla": "Atteviks Bil AB - Jönköping (via Bilweb)", "url": "https://bilweb.se/jonkopings-lan/volkswagen-id-cross-trend-37kwh-privatleasing-2027-suv-436465", "ort": "Jönköping", "ortpos": [57.78, 14.16], "ortlan": "Jönköping", "service": null, "not": "Annons hos Atteviks Bil AB - Jönköping, uppdaterad 20 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Cross Trend 37 kWh", "idcross", "El", 2995, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-id-cross-trend-37-kwh-116hk-privatleasing-fr-2995kr-man-2027-suv-436405", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 20 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Cross Trend", "idcross", "El", 2995, 1000, null, {"kalla": "AB Norrbil (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-cross-trend-privatleasing-fran-2995kr-man-2027-suv-435313", "ort": "Norrtälje", "ortpos": [59.76, 18.7], "ortlan": "Stockholm", "service": null, "not": "Annons hos AB Norrbil, uppdaterad 20 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Cross Life 52kWh", "idcross", "El", 3695, 1000, null, {"kalla": "Atteviks Bil AB - Jönköping (via Bilweb)", "url": "https://bilweb.se/jonkopings-lan/volkswagen-id-cross-life-52kwh-211hk-privatleasing-2027-suv-457352", "ort": "Jönköping", "ortpos": [57.78, 14.16], "ortlan": "Jönköping", "service": null, "not": "Annons hos Atteviks Bil AB - Jönköping, uppdaterad 5 nov", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Polo Life 37kWh", "idpolo", "El", 3495, 1000, null, {"kalla": "Atteviks Bil AB - Jönköping (via Bilweb)", "url": "https://bilweb.se/jonkopings-lan/volkswagen-id-polo-life-37kwh-privatleasing-2027-halvkombi-434689", "ort": "Jönköping", "ortpos": [57.78, 14.16], "ortlan": "Jönköping", "service": null, "not": "Annons hos Atteviks Bil AB - Jönköping, uppdaterad 19 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Polo Life", "idpolo", "El", 3495, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-id-polo-life-privatleasing-fr-3495kr-man-2027-halvkombi-425294", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 12 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Polo Life", "idpolo", "El", 3495, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-polo-life-privatleasing-2027-halvkombi-415309", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Polo", "idpolo", "El", 3495, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-id-polo-kampanj-privatleasing-2027-halvkombi-413886", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 9 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Polo", "idpolo", "El", 3495, 1000, null, {"kalla": "Toveks Bil Varberg (via Bilweb)", "url": "https://bilweb.se/hallands-lan/volkswagen-id-polo-fr-3495-kr-man-privatleasing-erbjudande-2027-halvkombi-402607", "ort": "Åskloster", "ortpos": [56.9, 12.7], "ortlan": "Halland", "service": null, "not": "Annons hos Toveks Bil Varberg, uppdaterad 1 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Polo GTI 52kwh", "idpolo", "El", 5095, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-polo-gti-52kwh-privatleasing-fr-5095-kr-man-kampanj-2027-halvkombi-455455", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 4 nov", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Tiguan Life 58kWh", "idtiguan", "El", 5545, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-tiguan-life-58kwh-kampanj-privatleasing-2027-suv-439046", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000, "milokand": true}),
      B("Volkswagen", "ID. Tiguan LIFE 58 KWH", "idtiguan", "El", 5995, 1000, null, {"kalla": "Din Bil / Volkswagen Gävle (via Bilweb)", "url": "https://bilweb.se/gavleborgs-lan/volkswagen-id-tiguan-life-58-kwh-privatleasing-2027-suv-439317", "ort": "Gävle", "ortpos": [60.67, 17.14], "ortlan": "Gävleborg", "service": null, "not": "Annons hos Din Bil / Volkswagen Gävle, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Tiguan Life 58 kWh", "idtiguan", "El", 5995, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-id-tiguan-life-58-kwh-kampanj-privatleasing-2027-suv-439053", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Tiguan LIFE 77 KWH", "idtiguan", "El", 6295, 1000, null, {"kalla": "Din Bil / Volkswagen Gävle (via Bilweb)", "url": "https://bilweb.se/gavleborgs-lan/volkswagen-id-tiguan-life-77-kwh-privatleasing-2027-suv-439318", "ort": "Gävle", "ortpos": [60.67, 17.14], "ortlan": "Gävleborg", "service": null, "not": "Annons hos Din Bil / Volkswagen Gävle, uppdaterad 22 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "ID. Tiguan Life 77kWh", "idtiguan", "El", 6295, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-id-tiguan-life-77kwh-286-hk-privatleasing-2027-suv-434375", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 19 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "Tiguan ID Life", "idtiguan", "El", 6295, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-tiguan-id-life-286hk-privatleasing-6295kr-man-2027-suv-434938", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 20 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "ID. Tiguan Life 4M", "idtiguan", "El", 6595, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-id-tiguan-life-4m-77kwh-299hk-privatleasing-2027-suv-432664", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 16 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tiguan ID. Life", "idtiguan", "El", 6595, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-tiguan-id-life-4motion-77-kwh-299-hk-privatleasing-2027-suv-434374", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 19 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "Passat R-Line SWE", "passat", "Laddhybrid", 4299, 1000, null, {"kalla": "Din Bil / Volkswagen Kista (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-passat-r-line-swe-edition-ehybrid-privatleasing-kampanj-2027-kombi-404416", "ort": "Kista", "ortpos": [59.4, 17.94], "ortlan": "Stockholm", "service": null, "not": "Annons hos Din Bil / Volkswagen Kista, uppdaterad 2 okt. Körsträckan framgår inte av annonsen – fråga handlaren. Priset förutsätter 4 299 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 4299, "milokand": true}),
      B("Volkswagen", "Passat R-Line SWE", "passat", "Laddhybrid", 4495, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-passat-r-line-swe-edition-bilia-kampanj-privatleasing-2027-kombi-424460", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 12 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Passat eHybrid 272hk", "passat", "Laddhybrid", 4595, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-passat-ehybrid-272hk-r-line-privatleasing-fr-4595kr-2027-kombi-460027", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 9 nov", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Passat eHybrid 272hk", "passat", "El", 4595, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-passat-ehybrid-272hk-r-line-privatleasing-fr-4595kr-2027-kombi-455458", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 4 nov", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Passat Business eHybrid", "passat", "Laddhybrid", 4995, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-passat-business-ehybrid-272hk-privatleasing-fr-4995-kr-man-2027-kombi-427201", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 13 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Passat eHybrid R-Line", "passat", "Laddhybrid", 5295, 1000, null, {"kalla": "Atteviks Bil AB - Växjö (via Bilweb)", "url": "https://bilweb.se/kronobergs-lan/volkswagen-passat-ehybrid-r-line-swe-edition-privatleasing-2027-kombi-407376", "ort": "Växjö", "ortpos": [56.88, 14.81], "ortlan": "Kronoberg", "service": null, "not": "Annons hos Atteviks Bil AB - Växjö, uppdaterad 5 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Polo", "polo", "Bensin", 2499, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-polo-bilia-kampanj-privatleasing-2027-halvkombi-424463", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 12 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Polo", "polo", "Bensin", 2499, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-polo-kampanj-privatleasing-2027-halvkombi-409515", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Polo", "polo", "Bensin", 2574, 1000, null, {"kalla": "AB Norrbil (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-polo-privatleasing-fran-2574kr-man-2027-halvkombi-435311", "ort": "Norrtälje", "ortpos": [59.76, 18.7], "ortlan": "Stockholm", "service": null, "not": "Annons hos AB Norrbil, uppdaterad 20 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Polo Life SWE", "polo", "Bensin", 2595, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-polo-life-swe-edition-1-0-tsi-115-hk-dsg-privatleasing-2027-halvkombi-417927", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volkswagen", "Polo SUPERDEAL* SWE", "polo", "Bensin", 2695, 1000, null, {"kalla": "Aftén Bil VW Nybil Arlandastad (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-polo-superdeal-swe-edition-privatleasing-fr-2-395-kr-man-2027-halvkombi-437417", "ort": "Arlandastad", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Arlandastad, uppdaterad 21 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "T-Roc", "troc", "Bensin", 2895, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-t-roc-kampanj-privatleasing-2027-suv-409506", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "T-Roc NYA eTSi", "troc", "Bensin", 3095, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-t-roc-nya-etsi-privatleasing-fr-3095kr-erbjudande-2027-suv-450765", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 2 nov", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "T-Roc NYA", "troc", "Bensin", 2995, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-t-roc-nya-privatleasing-2026-suv-417793", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt. Priset förutsätter 10 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 10000}),
      B("Volkswagen", "T-Roc NYA eTSI", "troc", "Bensin", 3295, 1000, null, {"kalla": "Börjessons Karlskrona (via Bilweb)", "url": "https://bilweb.se/blekinge-lan/volkswagen-t-roc-nya-etsi-150hk-dsg-privatleasing-2026-suv-421420", "ort": "Karlskrona", "ortpos": [56.16, 15.59], "ortlan": "Blekinge", "service": null, "not": "Annons hos Börjessons Karlskrona, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "T-Roc NYA", "troc", "Bensin", 3295, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-t-roc-nya-privatleasing-0kr-kontantinsats-2027-suv-417796", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Taigo DEAL", "taigo", "Bensin", 2649, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-taigo-deal-privatleasing-fr-2-649-kr-man-lagerbil-2027-suv-406693", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 5 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Taigo", "taigo", "Bensin", 2695, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-taigo-bilia-kampanj-privatleasing-2027-suv-424459", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 12 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Taigo", "taigo", "Bensin", 2695, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-taigo-kampanj-privatleasing-2027-suv-409514", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 7 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Taigo R-line Edition", "taigo", "Bensin", 2995, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-taigo-r-line-edition-privatleasing-0kr-kontant-2026-suv-417801", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Taigo TSI 115", "taigo", "Bensin", 2622, 1000, null, {"kalla": "AB Norrbil (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-taigo-tsi-115-dsg-privatleasing-15000kr-insats-2027-halvkombi-409381", "ort": "Norrtälje", "ortpos": [59.76, 18.7], "ortlan": "Stockholm", "service": null, "not": "Annons hos AB Norrbil, uppdaterad 7 okt. Priset förutsätter 15 000 kr i insats/förhöjd första hyra", "tillval": "inga", "bilweb": true, "forhojd": 15000}),
      B("Volkswagen", "Taigo R-Line Black", "taigo", "Bensin", 3195, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-taigo-r-line-black-edition-116-hk-7-vxl-dsg-privatleasing-2026-suv-418054", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Taigo R-Line Edition", "taigo", "Bensin", 3295, 1000, null, {"kalla": "Din Bil / Volkswagen Sisjön (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-taigo-r-line-edition-116-hk-dsg-privatleasing-2027-suv-429574", "ort": "Askim", "ortpos": [57.63, 11.94], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Sisjön, uppdaterad 15 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron 1.5 TSI", "tayron", "Bensin", 3495, 1000, null, {"kalla": "Aftén Bil VW Nybil Åkersberga (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-tayron-1-5-tsi-edition-privatleasing-fr-3-195kr-man-2027-suv-460602", "ort": "Åkersberga", "ortpos": [59.48, 18.3], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Åkersberga, uppdaterad 9 nov", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron Life Edition", "tayron", "Bensin", 3495, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-tayron-life-edition-kampanj-privatleasing-2027-suv-444978", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 27 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron", "tayron", "Bensin", 3495, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-tayron-bilia-kampanj-privatleasing-2027-suv-424472", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 12 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron eTSI 150Hk", "tayron", "Bensin", 3795, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-tayron-etsi-150hk-7-sits-dsg-privatleasing-2027-suv-418062", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron", "tayron", "Bensin", 3895, 1000, null, {"kalla": "Aftén Bil VW Nybil Arlandastad (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-tayron-privatleasing-fr-3-495-kr-man-hostkampanj-2027-suv-428096", "ort": "Arlandastad", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Aftén Bil VW Nybil Arlandastad, uppdaterad 14 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron Life eTSI", "tayron", "Bensin", 3995, 1000, null, {"kalla": "AB Norrbil (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-tayron-life-etsi-150-dsg-7-sits-privatleasing-fr-3995kr-man-2027-suv-435314", "ort": "Norrtälje", "ortpos": [59.76, 18.7], "ortlan": "Stockholm", "service": null, "not": "Annons hos AB Norrbil, uppdaterad 20 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron R-line SWE", "tayron", "Hybrid", 4595, 1000, null, {"kalla": "Bilia Haninge Volkswagen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volkswagen-tayron-r-line-swe-edition-kampanj-privatleasing-2027-suv-444979", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge Volkswagen, uppdaterad 27 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tayron R-line SWE", "tayron", "Hybrid", 4595, 1000, null, {"kalla": "Bilia Nyköping Volkswagen (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volkswagen-tayron-r-line-swe-edition-bilia-kampanj-privatleasing-2027-suv-424469", "ort": "Nyköping", "ortpos": [58.75, 17.01], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Nyköping Volkswagen, uppdaterad 12 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tiguan", "tiguan", "Bensin", 2949, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-tiguan-superkampanj-privatleasing-2027-suv-417800", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volkswagen", "Tiguan eTSI 150hk", "tiguan", "Bensin", 3195, 1000, null, {"kalla": "Din Bil / Volkswagen Backa (via Bilweb)", "url": "https://bilweb.se/vastra-gotalands-lan/volkswagen-tiguan-etsi-150hk-privatleasing-2027-suv-417829", "ort": "Hisings Backa", "ortpos": [57.75, 11.93], "ortlan": "Västra Götaland", "service": null, "not": "Annons hos Din Bil / Volkswagen Backa, uppdaterad 10 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volvo", "EX30", "ex30", "El", 3790, 1000, null, {"kalla": "Volvo Car Enköping (via Bilweb)", "url": "https://bilweb.se/uppsala-lan/volvo-ex30-privatleasing-3790-man-2027-suv-449896", "ort": "Enköping", "ortpos": [59.64, 17.08], "ortlan": "Uppsala", "service": null, "not": "Annons hos Volvo Car Enköping, uppdaterad 30 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volvo", "EX30 P5 RWD", "ex30", "El", 3790, 1000, null, {"kalla": "Volvo Car Hammarby Sjöstad (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volvo-ex30-p5-rwd-plus-privatleasing-3790kr-man-2027-suv-446353", "ort": "Stockholm", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Hammarby Sjöstad, uppdaterad 28 okt", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX30 P5 LONG RANGE", "ex30", "El", 3890, 1000, null, {"kalla": "Volvo Car Kungsängen (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volvo-ex30-p5-long-range-plus-privatleasing-fr-3890kr-man-2027-suv-455543", "ort": "Kungsängen", "ortpos": [59.48, 17.75], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Kungsängen, uppdaterad 4 nov", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX30", "ex30", "El", 3890, 1000, null, {"kalla": "Volvo Car Enköping (via Bilweb)", "url": "https://bilweb.se/uppsala-lan/volvo-ex30-privatleasing-3890-man-2027-suv-449897", "ort": "Enköping", "ortpos": [59.64, 17.08], "ortlan": "Uppsala", "service": null, "not": "Annons hos Volvo Car Enköping, uppdaterad 30 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volvo", "EX30 P5 RWD", "ex30", "El", 3890, 1000, null, {"kalla": "Volvo Car Hammarby Sjöstad (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volvo-ex30-p5-rwd-long-range-plus-privatleasing-3890kr-man-2027-suv-446354", "ort": "Stockholm", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Hammarby Sjöstad, uppdaterad 28 okt", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX30 Single Motor", "ex30", "El", 3895, 1000, null, {"kalla": "Bilia Västerås - Volvo (via Bilweb)", "url": "https://bilweb.se/vastmanlands-lan/volvo-ex30-single-motor-plus-privatleasing-fr-3895-man-2026-suv-421033", "ort": "Västerås", "ortpos": [59.61, 16.55], "ortlan": "Västmanland", "service": null, "not": "Annons hos Bilia Västerås - Volvo, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX30 P5 Plus", "ex30", "El", 3895, 1000, null, {"kalla": "Bilia Eskilstuna - Volvo (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volvo-ex30-p5-plus-privatleasing-fr-4095-man-2026-suv-420393", "ort": "Eskilstuna", "ortpos": [59.37, 16.51], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Eskilstuna - Volvo, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX30 Ext. Range", "ex30", "El", 3995, 1000, null, {"kalla": "Bilia Västerås - Volvo (via Bilweb)", "url": "https://bilweb.se/vastmanlands-lan/volvo-ex30-ext-range-plus-privatleasing-fr-3995-man-2026-suv-421028", "ort": "Västerås", "ortpos": [59.61, 16.55], "ortlan": "Västmanland", "service": null, "not": "Annons hos Bilia Västerås - Volvo, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX40 SM Extended Range", "ex40", "El", 4995, 1000, null, {"kalla": "Bilia Eskilstuna - Volvo (via Bilweb)", "url": "https://bilweb.se/sodermanlands-lan/volvo-ex40-sm-extended-range-plus-se-privatleasing-fr-4995-man-2026-suv-420395", "ort": "Eskilstuna", "ortpos": [59.37, 16.51], "ortlan": "Södermanland", "service": null, "not": "Annons hos Bilia Eskilstuna - Volvo, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX40 Single M", "ex40", "El", 4995, 1000, null, {"kalla": "Bilia Haninge - Volvo (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volvo-ex40-single-m-ext-plus-se-privatleasing-2027-suv-417057", "ort": "Handen", "ortpos": [59.17, 18.14], "ortlan": "Stockholm", "service": null, "not": "Annons hos Bilia Haninge - Volvo, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
      B("Volvo", "EX60 P10 AWD", "ex60", "El", 10462, 1000, null, {"kalla": "Volvo Car Hammarby Sjöstad (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volvo-ex60-p10-awd-plus-privatleasing-10462kr-man-2027-suv-437881", "ort": "Stockholm", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Hammarby Sjöstad, uppdaterad 21 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volvo", "EX60 P10 AWD", "ex60", "El", 12001, 1000, null, {"kalla": "Volvo Car Hammarby Sjöstad (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volvo-ex60-p10-awd-ultra-privatleasing-12001kr-man-2027-suv-437882", "ort": "Stockholm", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Hammarby Sjöstad, uppdaterad 21 okt. Körsträckan framgår inte av annonsen – fråga handlaren", "tillval": "inga", "bilweb": true, "milokand": true}),
      B("Volvo", "XC60", "xc60", "Bensin", 8990, 1000, null, {"kalla": "Volvo Car Hammarby Sjöstad (via Bilweb)", "url": "https://bilweb.se/stockholms-lan/volvo-xc60-helgerbjudande-privatleasing-fran-8-990-kr-man-2026-suv-399272", "ort": "Stockholm", "ortpos": [59.33, 18.07], "ortlan": "Stockholm", "service": null, "not": "Annons hos Volvo Car Hammarby Sjöstad, uppdaterad 29 sep", "tillval": "inga", "bilweb": true}),
      B("Volvo", "XC90", "xc90", "Laddhybrid", 10990, 1500, null, {"kalla": "Volvo Car Enköping (via Bilweb)", "url": "https://bilweb.se/uppsala-lan/volvo-xc90-privatleasing-10990-ink-vinterhjul-plus-dragkrok-2026-suv-418038", "ort": "Enköping", "ortpos": [59.64, 17.08], "ortlan": "Uppsala", "service": null, "not": "Annons hos Volvo Car Enköping, uppdaterad 10 okt", "tillval": "inga", "bilweb": true}),
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
    const LANEXTRA = {};   // län för orter som kommer från annonser (fylls nedan)
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
    const MODELLNAMN = {"a3":"A3 Sportback","a3sedan":"A3 Sedan","a5":"A5","a5avant":"A5 Avant","aygox":"Aygo X","bayon":"Bayon","bmw120":"1-serie","born":"Born","bz4x":"bZ4X","bz4xt":"bZ4X Touring","chr":"C-HR","cla":"CLA","clasb":"CLA Shooting Brake","corollacross":"Corolla Cross","corollats":"Corolla Touring Sports","cupraleon":"Leon Sportstourer","ec40":"EC40","eclass":"E-Klass","elroq":"Elroq","enyaq":"Enyaq","enyaqc":"Enyaq Coupé","epiq":"Epiq","ev2":"EV2","ev3":"EV3","ev4":"EV4","ev5":"EV5","ex30":"EX30","ex30cc":"EX30 Cross Country","ex40":"EX40","ex60":"EX60","fabia":"Fabia","formentor":"Formentor","glb":"GLB","glc":"GLC","golf":"Golf","golfsc":"Golf Sportscombi","i20":"i20","ibiza":"Ibiza","id3":"ID.3","id4":"ID.4","id7":"ID.7","id7t":"ID.7 Tourer","idcross":"ID.Cross","idpolo":"ID.Polo","idtiguan":"ID.Tiguan","ix2":"iX2","juke":"Juke","k4sw":"K4 Sportswagon","kamiq":"Kamiq","karoq":"Karoq","kodiaq":"Kodiaq","kona":"Kona","leon":"Leon","m3":"Model 3","mazda6e":"6e","mg4":"MG4","micra":"Micra","my":"Model Y","octaviac":"Octavia Combi","p2008":"2008","p3008":"3008","p5008":"5008","passat":"Passat","pe2008":"e-2008","peaq":"Peaq","picanto":"Picanto","pol4":"4","polo":"Polo","q4":"Q4 e-tron","q6":"Q6 e-tron","qashqai":"Qashqai","r5":"5 E-Tech","rav4":"RAV4","raval":"Raval","sandero":"Sandero","seal6":"Seal 6","seltos":"Seltos","sorento":"Sorento","sportage":"Sportage","stonic":"Stonic","superb":"Superb Combi","taigo":"Taigo","tavascan":"Tavascan","tayron":"Tayron","terramar":"Terramar","tiguan":"Tiguan","troc":"T-Roc","tucson":"Tucson","v60":"V60","xc60":"XC60","xc90":"XC90","yaris":"Yaris","yariscross":"Yaris Cross"};
    // Karosstyp per modell (nyckel = bildnamnet). Används av kategorisidorna (SUV, kombi, småbil).
    const KAROSS = {};
    const _kar = (typ, lista) => lista.split(" ").forEach(k => KAROSS[k] = typ);
    _kar("SUV", "bayon bz4x bz4xt chr corollacross ec40 elroq enyaq enyaqc epiq ev2 ev3 ev5 ex30 ex30cc ex40 ex60 formentor glb glc id4 idcross idtiguan ix2 juke kamiq karoq kodiaq kona my p2008 p3008 p5008 pe2008 peaq pol4 q4 q6 qashqai rav4 seltos sorento sportage stonic taigo tavascan tayron terramar tiguan troc tucson xc60 xc90 yariscross");
    _kar("Kombi", "a5avant clasb corollats cupraleon golfsc id7t k4sw octaviac passat superb v60");
    _kar("Småbil", "aygox fabia i20 ibiza idpolo micra picanto polo r5 raval sandero yaris");
    _kar("Halvkombi/sedan", "a3 a3sedan a5 bmw120 born cla eclass ev4 golf id3 id7 leon m3 mazda6e mg4 seal6");
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
    const FORVAL = { driv: _qs.get("driv") || _bd.driv || "", tak: Number(_qs.get("max") || _bd.tak) || 0, kaross: _qs.get("kaross") || _bd.kaross || "", sort: _qs.get("sort") || _bd.sort || "", q: _qs.get("q") || "" };

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
      if (document.getElementById("topp")) ritaTopp(rader);
      if (!lista) return;

      // 2) Filtrera
      const tak = maxpris ? Number(maxpris.value) || 0 : 0;
      const radie = radieSel ? Number(radieSel.value) || 0 : 0;
      rader = rader.filter(b =>
        (!drivmedel || drivmedel.value === "alla" || b.drivmedel === drivmedel.value) &&
        (SIDMARKE ? b.marke === SIDMARKE : (!markeSel || markeSel.value === "alla" || b.marke === markeSel.value)) &&
        (!tak || (b.eff != null && !b.milokand && b.eff <= tak)) &&
        (!FORVAL.kaross || b.kaross === FORVAL.kaross) &&
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
      const billigast = minst(rader, "total");
      const billigastEl = minst(rader.filter(r => r.drivmedel === "El"), "total");
      const namn = b => b ? b.marke + " " + b.modell : "";
      if (summary) summary.innerHTML = `
        <div class="stat"><small>Bästa erbjudande</small><b>${bast ? pct(bast.andel) + " av nypriset" : "–"}</b><small>${namn(bast)}</small></div>
        <div class="stat"><small>Billigast totalt</small><b>${billigast ? kr(billigast.total) : "–"}</b><small>${namn(billigast)}</small></div>
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
            ${bt ? `<span class="betyg ${bt.klass}">${bt.text} · ${pct(b.andel)} av nypris</span>` : `<span class="tag">Andel av nypris: –</span>`}
            <span class="tag ${b.drivmedel === "El" ? "el" : ""}">${b.drivmedel}</span>
            ${b.tillval === "alla" ? `<span class="tag bygg">🛠 Välj alla tillval</span>` : b.tillval === "vissa" ? `<span class="tag">Några tillval</span>` : `<span class="tag">Färdig bil</span>`}
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
      { namn: "Volvo EX40", match: b => b.marke === "Volvo" && /^EX40/.test(b.modell) },
      { namn: "Volvo EX30", match: b => b.marke === "Volvo" && /^EX30/.test(b.modell) },
      { namn: "Volkswagen Tiguan", match: b => b.marke === "Volkswagen" && /^Tiguan/.test(b.modell) },
      { namn: "Tesla Model Y", match: b => b.marke === "Tesla" && /^Model Y/.test(b.modell) },
      { namn: "Volvo XC60", match: b => b.marke === "Volvo" && /^XC60/.test(b.modell) },
    ];
    function ritaTopp(rader) {
      document.getElementById("topp").innerHTML = TOPP.map((t, i) => {
        const alla = rader.filter(t.match).filter(r => r.andel != null);
        const b = alla.sort((x, y) => x.andel - y.andel)[0];
        if (!b) return "";
        const bt = betyg(b.andel);
        return `<article class="tkort">
          <div class="tbild">${b.foto ? `<img src="${bildUrl(b, "", 600)}" alt="${t.namn}" loading="lazy">` : ""}<span class="tplats">#${i + 1} mest leasade</span></div>
          <div class="tinner">
            <div class="thuvud">
              <div><div class="tnamn">${t.namn}</div><div class="tversion">${b.modell.replace(/^(EX40|EX30|Tiguan|Model Y|XC60) ?/, "") || "&nbsp;"}</div></div>
              <div class="tfran">Från<div class="tpris">${kr(b.m).replace(" kr", "")}:-<small>/mån</small><sup class="fn"><a href="#villkor">1</a></sup></div></div>
            </div>
            <div class="tchips"><span>36 månader</span><span>${b.mil.toLocaleString("sv-SE")} mil/år</span>${b.forhojd ? `<span>${kr(b.forhojd)} första hyra</span>` : ""}</div>
            <div class="ttotal">${kr(b.total)} totalt · ${/\bvia\b/.test(b.kalla) ? "" : "via "}${b.kalla.split(/ \(|,/)[0]}${alla.length > 1 ? ` · bäst av ${alla.length}` : ""}</div>
            <div class="tfot">${bt ? `<span class="betyg ${bt.klass}">${bt.text} · ${pct(b.andel)}</span>` : "<span></span>"}<a class="cta" href="${b.msida}">Jämför${alla.length > 1 ? " " + alla.length : ""} →</a></div>
          </div>
        </article>`;
      }).join("");
    }
    if (document.getElementById("topp")) document.getElementById("topp").addEventListener("click", e => { const b = e.target.closest("button[data-bil]"); if (b) oppnaKonf(BILAR[Number(b.dataset.bil)]); });
    if (document.getElementById("trust")) document.getElementById("trust").innerHTML = `<span>${BILAR.length} erbjudanden på ${Object.keys(MODELLER).length} modeller</span><span>Kontrollerat ${KONTROLL}</span><span>Bara riktig privatleasing</span><span>Inga betalda placeringar</span>`;
    if (document.getElementById("fotforetag")) document.getElementById("fotforetag").innerHTML = [FORETAG.namn + " (enskild firma)", FORETAG.orgnr && "Org.nr " + FORETAG.orgnr, FORETAG.epost].filter(Boolean).map(esc).join("<br>");
    // ---------- Jämför handlare: alla erbjudanden på en modell, billigast först ----------
    const jamfor = document.getElementById("jamfor");
    let jmfRegion = "Alla", jmfMil = 0, jmfFors = 0;
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
      rader.sort((a, b) => s === "krmil" ? (a.krmil ?? big) - (b.krmil ?? big) : s === "total" ? (a.medfors ?? big) - (b.medfors ?? big) : s === "nara" ? (a.avst ?? (a.lokal ? big : -1)) - (b.avst ?? (b.lokal ? big : -1)) || e(a) - e(b) : e(a) - e(b) || (a.m ?? big) - (b.m ?? big));
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
        <div class="jmflista">${rader.map(r => {
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
        const l = e.target.closest("button[data-lan]"); if (l) { jmfRegion = l.dataset.lan; ritaJamfor(); return; }
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
  