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
    const KONTROLL = "6 nov 2026"; // uppdateras vid varje daglig kontroll
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

    const BILAR = [
      B("Volvo", "EX30 Single Motor Plus", "ex30", "El", 3795, 1000, 457000, { typ: "Märket", kalla: "Volvo Nationell Privatleasing (via Nybergs Bil)", url: "https://nybergsbil.se/kampanjer/volvo-ex30" }),
      B("Volvo", "EX30 Cross Country P5 Long Range Plus", "ex30cc", "El", 3990, 1000, 542000, { mer: {1500: 380, 2000: 839}, kalla: "Volvo Car Kungsängen", url: "https://bilweb.se/stockholms-lan/volvo-ex30-cross-country-plus-2027-suv-445689" }),
      B("Volvo", "EX40 Plus Special Edition", "ex40", "El", 4595, 1000, 559900, { kalla: "Rejmes (Volvofinans)", url: "https://rejmes.se/kampanjer/volvo-ex40/", not: "Modellår 2027. Gäller ett begränsat antal bilar", utr: ["Parkeringssensorer", "Backkamera", "Pilot Assist", "Elmanövrerad förarstol med minnesfunktion", "Klimatpaket", "Serviceavtal och Volvo Assistans (36 mån)"] }),
      B("Polestar", "4 coupé Rear Motor Business edition Pilot", "pol4", "El", 7295, 1500, 619000, { kalla: "Polestar-handlare via Wayke", url: "https://www.wayke.se/objekt/01a04238-b8b8-7581-9401-3a65797cbf6f", not: "Leverans senast 31 dec 2026" }),
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
      B("Mercedes-Benz", "GLC 400 4MATIC electric Advanced Edition", "glc", "El", 8895, 1500, 784000, MB),
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
      B("Volvo", "V60 T6 Plug-in Hybrid AWD", "v60", "Laddhybrid", 8210, 1000, 539900, { kalla: "Bilmånsson Ystad via Wayke", url: "https://www.wayke.se/objekt/a82469f4-b54f-48dd-8071-c35e79e7b944", not: "Lagerbil som körts 2 739 mil (demobil)" }),
      B("Volvo", "EX60 P6 Plus", "ex60", "El", 8995, 1000, 689000, { kalla: "Volvo Car Hammarby Sjöstad via Wayke", url: "https://www.wayke.se/objekt/170a712b-5743-4b66-9e23-bb33b98d7edd" }),
      B("Volvo", "XC90 T8 Ultra Dark", "xc90", "Laddhybrid", 11995, 1000, 994000, { kalla: "Volvo Car Hammarby Sjöstad via Wayke", url: "https://www.wayke.se/objekt/31b21382-095f-40b2-af94-28a9d6db1190", not: "Lagerbil" }),
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
      ev2:        { av: M, fil: "Kia_EV2_IMG_8443.jpg" },
      ev3:        { av: M, fil: "Kia_EV3_DSC_9146.jpg" },
      ex30:       { av: A, fil: "Volvo_EX30_1X7A2476.jpg" },
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
      a3sedan:    { av: "M 93", lic: "CC BY-SA 3.0 de", fil: "Audi_A3_Limousine_S_line_(8Y)_%E2%80%93_f_08072024.jpg" },
      a5:         { av: "Alexander Migl", fil: "Audi_A5_B10_DSC_3752.jpg" },
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

    // Hämta elementen från HTML-delen så att vi kan läsa och ändra dem.
    const sok = document.getElementById("sok");
    const drivmedel = document.getElementById("drivmedel");
    const mil = document.getElementById("mil");
    const forsakring = document.getElementById("forsakring");
    const sortera = document.getElementById("sortera");
    const lista = document.getElementById("lista");
    const summary = document.getElementById("summary");

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
      const text = sok.value.trim().toLowerCase();
      const valdMil = Number(mil.value);
      const forsMan = Number(forsakring.value) || 0;

      // 1) Räkna fram pris och andel för varje bil
      let rader = BILAR.map(bil => {
        const m = manadFor(bil, valdMil);
        const leasing = m == null ? null : m * 36 + bil.start + bil.forhojd;   // allt du betalar till leasingbolaget
        const total = leasing == null ? null : leasing + (bil.forsakring ?? forsMan) * 36;   // vissa märken har obligatorisk försäkring
        const andel = leasing != null && bil.nypris ? leasing / bil.nypris : null;
        return { ...bil, m, total, andel, idx: BILAR.indexOf(bil) };
      });

      // 1b) Topp 5 överst: bästa erbjudandet per populär modell (räknas på alla bilar, oberoende av filtren)
      ritaTopp(rader);

      // 2) Filtrera
      rader = rader.filter(b =>
        (drivmedel.value === "alla" || b.drivmedel === drivmedel.value) &&
        (b.marke + " " + b.modell).toLowerCase().includes(text)
      );

      // 3) Sortera (bilar där något värde saknas hamnar sist)
      const big = Number.MAX_SAFE_INTEGER;
      const s = sortera.value;
      if (s === "andel") rader.sort((a, b) => (a.andel ?? big) - (b.andel ?? big));
      if (s === "total") rader.sort((a, b) => (a.total ?? big) - (b.total ?? big));
      if (s === "manad") rader.sort((a, b) => (a.m ?? big) - (b.m ?? big));
      if (s === "marke") rader.sort((a, b) => (a.marke + a.modell).localeCompare(b.marke + b.modell, "sv"));

      // 4) Sammanfattningen överst
      const minst = (lista, falt) => lista.filter(r => r[falt] != null).sort((a, b) => a[falt] - b[falt])[0];
      const bast = minst(rader, "andel");
      const billigast = minst(rader, "total");
      const billigastEl = minst(rader.filter(r => r.drivmedel === "El"), "total");
      const namn = b => b ? b.marke + " " + b.modell : "";
      summary.innerHTML = `
        <div class="stat"><small>Bästa erbjudande</small><b>${bast ? pct(bast.andel) + " av nypriset" : "–"}</b><small>${namn(bast)}</small></div>
        <div class="stat"><small>Billigast totalt</small><b>${billigast ? kr(billigast.total) : "–"}</b><small>${namn(billigast)}</small></div>
        <div class="stat"><small>Billigaste elbil totalt</small><b>${billigastEl ? kr(billigastEl.total) : "–"}</b><small>${namn(billigastEl)}</small></div>
        <div class="stat"><small>Bilar i listan</small><b>${rader.length}</b></div>`;

      // 5) Bygg ett kort per bil
      lista.innerHTML = rader.map((b, i) => {
        const bt = betyg(b.andel);
        const visaRank = s !== "marke" && (s === "andel" ? b.andel != null : b.total != null);
        return `
        <article class="car">
          <a class="piclink" href="${ut(b.url)}" target="_blank" rel="${rel(b.url)}">${b.foto ? `<img class="pic" src="bilder/${b.foto}.jpg" alt="${b.marke} ${b.modell}" loading="lazy">` : `<div class="pic ingen"><b>Helt ny modell</b><small>Fri bild finns ännu inte</small></div>`}</a>
          <div>
            <div class="brand">${visaRank ? `<span class="rank">#${i + 1}</span>` : ""}${b.marke}</div>
            <h3><a href="${ut(b.url)}" target="_blank" rel="${rel(b.url)}" style="color:inherit;text-decoration:none">${b.modell}</a></h3>
          </div>
          <div class="price">
            ${b.m != null
              ? `<div class="month">${kr(b.m)}/mån<sup class="fn"><a href="#villkor">1</a></sup></div><div class="total">${kr(b.total)} totalt på 36 mån</div>`
              : `<div class="month">${kr(b.manad)}/mån</div><div class="total">vid ${b.mil || "?"} mil/år · tillägg för ${valdMil} mil: fråga handlaren</div>`}
            <button type="button" class="cta" data-bil="${b.idx}">Välj tillval & beställ →</button>
            <a class="ext" href="${ut(b.url)}" target="_blank" rel="${rel(b.url)}">Se erbjudandet hos ${b.typ === "Märket" ? "märket" : "handlaren"} ↗</a>${arAff(b.url) ? `<small class="annons">Annonslänk</small>` : ""}
          </div>
          <div class="tags">
            ${bt ? `<span class="betyg ${bt.klass}">${bt.text} · ${pct(b.andel)} av nypris</span>` : `<span class="tag">Andel av nypris: –</span>`}
            <span class="tag ${b.drivmedel === "El" ? "el" : ""}">${b.drivmedel}</span>
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
        </article>`;
      }).join("") || "<p>Inga bilar matchar din sökning.</p>";
    }

    // Bildkällor: en rad per foto. Licenserna kräver att fotografen nämns,
    // men det räcker att det görs samlat här i stället för på varje kort.
    document.getElementById("kallor").innerHTML = Object.keys(FOTON).map(k => {
      const f = FOTON[k], lic = f.lic || "CC BY-SA 4.0";
      const bil = BILAR.find(b => b.foto === k);
      return `<li>${bil ? bil.marke + " " + bil.modell : k}: <a href="${C + f.fil}" target="_blank" rel="noopener">${f.av}</a>, Wikimedia Commons, <a href="${LICENSER[lic]}" target="_blank" rel="noopener">${lic}</a>, beskuren</li>`;
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
    // Har en bil fältet handlarEpost går beställningen direkt till handlaren, med kopia till oss.
    // Saknas handlarEpost går den till oss, och vi skickar den vidare till handlaren.
    // Tom adress = sidan är inte live än, kunden kopierar beställningen själv.
    const BESTALLNING_EPOST = "";
    const konf = document.getElementById("konf");
    const STEG = ["Avtal", "Utrustning", "Dina uppgifter", "Sammanfattning"];
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
        ${bil.foto ? `<img src="bilder/${bil.foto}.jpg" alt="${esc(bil.marke + " " + bil.modell)}">` : `<div class="kingen"><div><b>Helt ny modell</b><br><small>Fri bild finns ännu inte</small></div></div>`}
        <div class="kvnamn">${esc(bil.marke)} ${esc(bil.modell)}</div>
        <div class="kvkalla">Erbjudande från ${esc(bil.kalla)}</div>
        <div class="kchips"><span>36 månader</span><span>${K.mil.toLocaleString("sv-SE")} mil/år</span><span>0 kr kontantinsats</span>${r.nypris ? `<span>Nypris ${kr(r.nypris)}</span>` : ""}</div>
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
      const cfg = bil.cfg ? KONFIG[bil.cfg] : null;
      const valdMil = Number(mil.value);
      const mv = milVal(bil, cfg);
      const val = {};
      if (cfg) cfg.G.forEach((g, gi) => {
        // förvalda val: det märket har förvalt (s) eller som ingår (i)
        val[gi] = g.v.map((v, vi) => (v.s || v.i) ? vi : -1).filter(vi => vi >= 0);
        if (!g.m && val[gi].length > 1) val[gi] = [val[gi][0]];
        if (!g.m && !g.o && !val[gi].length) val[gi] = [0];
      });
      K = { bil, cfg, steg: 0, mil: mv.includes(valdMil) ? valdMil : mv[0], val, tv: [], onskemal: "",
            kund: { namn: "", epost: "", tel: "", postnr: "", leverans: "Så snart som möjligt", samtycke: false } };
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
      return `<div class="kgrupp"><h4>Ingår i priset</h4><ul class="kutr">${lista.map(x => `<li>${esc(x)}</li>`).join("")}</ul>${not}</div>`;
    }
    function ritaKonf() {
      const { bil, cfg, steg } = K;
      const r = berakna();
      document.getElementById("konfSteg").innerHTML = STEG.map((t, i) => `<button type="button" data-steg="${i}" class="${i === steg ? "akt" : i < steg ? "klar" : ""}" ${i < steg ? "" : "tabindex=-1"} ${i === steg ? 'aria-current="step"' : ""}><i>${i < steg ? "✓" : i + 1}</i><span>${t}</span></button>`).join("");
      let h = K.skickad ? "" : `<h3>${RUBRIK[steg][0]}</h3><p class="kunder">${RUBRIK[steg][1]}</p>`;
      if (steg === 0) {
        const mv = milVal(bil, cfg);
        h += `<div class="kgrupp"><h4>Avtalstid</h4><div class="kseg"><label><input type="radio" checked disabled><b>36 mån</b><small>Ingår i priset</small></label></div></div>`;
        h += `<div class="kgrupp"><h4>Körsträcka per år</h4><div class="kseg">` + mv.map(m => {
          const diff = cfg ? cfg.bas[m] - cfg.bas[mv[0]] : (m <= bil.mil ? 0 : bil.mer[m]);
          return `<label><input type="radio" name="kmil" value="${m}" ${m === K.mil ? "checked" : ""}><b>${m.toLocaleString("sv-SE")} mil</b><small>${diff ? plus(diff) : "Ingår"}</small></label>`;
        }).join("") + `</div>` + (mv.length === 1 ? `<small>Fler mil går ofta att välja mot en högre månadskostnad. Skriv det under önskemål i nästa steg, så räknar handlaren på det.</small>` : "") + `</div>`;
        h += `<div class="kgrupp"><h4>Kontantinsats</h4><div class="kseg"><label><input type="radio" checked disabled><b>0 kr</b><small>Ingen kontantinsats</small></label></div></div>`;
        h += `<div class="kinfo"><b>Villkor:</b> ${esc(bil.not || "se erbjudandet")}${bil.start ? `. Uppläggningsavgift ${kr(bil.start)}` : ""}${bil.adm ? `, aviavgift ${bil.adm} kr/mån` : ""}.</div>`;
      }
      if (steg === 1) {
        h += ingarRuta(bil);
        if (cfg) {
          h += cfg.G.map((g, gi) => {
            const typ = g.m ? "checkbox" : "radio";
            const ar_farg = /färg|lack/i.test(g.g), kl = g.m ? "kval ruta" : "kval";
            const ingen = (!g.m && g.o) ? `<label class="kval"><input type="radio" name="g${gi}" value="-1" ${!(K.val[gi] || []).length ? "checked" : ""}><span>Inget ${esc(g.g.toLowerCase())}</span><span class="kp"></span></label>` : "";
            return `<div class="kgrupp"><h4>${esc(g.g)}</h4>${ingen}` + g.v.map((v, vi) => {
              const p = v.p[K.mil] || 0, vald = (K.val[gi] || []).includes(vi);
              const c = ar_farg && farg(v.n);
              return `<label class="${kl}"><input type="${typ}" name="g${gi}" value="${vi}" ${vald ? "checked" : ""} ${v.i ? "disabled" : ""}><span>${c ? `<i class="sw" style="background:${c}"></i>` : ""}<span class="namnrad">${esc(v.n)}${v.d ? `<small>${esc(v.d)}</small>` : ""}</span></span><span class="kp ${v.i || !p ? "ingar" : ""}">${v.i ? "Ingår" : p ? plus(p) : "Ingår i priset"}</span></label>`;
            }).join("") + `</div>`;
          }).join("");
          h += `<div class="kgrupp"><h4>Övriga önskemål eller bortval</h4><div class="kform"><textarea class="hel" id="konsk" rows="3" placeholder="T.ex. leverans före ett visst datum eller utrustning du inte vill ha">${esc(K.onskemal)}</textarea></div></div>`;
        } else {
          if (bil.tv && bil.tv.length) h += `<div class="kgrupp"><h4>Tillval</h4>` + bil.tv.map((t, i) => `<label class="kval ruta"><input type="checkbox" name="ktv" value="${i}" ${K.tv.includes(i) ? "checked" : ""}><span>${esc(t.n)}</span><span class="kp">${plus(t.p)}</span></label>`).join("") + `</div>`;
          h += `<div class="kinfo">${bil.tv && bil.tv.length ? "Fler tillval än ovan" : `Den här ${bil.typ === "Märket" ? "tillverkaren" : "handlaren"} har inte publicerat priser för tillval, men du`} kan önska färg, vinterhjul, dragkrok eller paket nedan. Handlaren lägger in det med pris i avtalet, och du ser det innan du signerar.</div>`;
          h += `<div class="kgrupp"><h4>Önskad utrustning, tillval och bortval</h4><div class="kform"><textarea class="hel" id="konsk" rows="5" placeholder="T.ex. metalliclack i blått, dubbade vinterhjul, dragkrok">${esc(K.onskemal)}</textarea></div></div>`;
        }
      }
      if (steg === 2) {
        const k = K.kund;
        h += `<div class="kform" style="margin-top:12px">
          <div><label for="kn">Namn</label><input id="kn" autocomplete="name" value="${esc(k.namn)}"></div>
          <div><label for="ke">E-post</label><input id="ke" type="email" autocomplete="email" value="${esc(k.epost)}"></div>
          <div><label for="kt">Telefon</label><input id="kt" type="tel" autocomplete="tel" value="${esc(k.tel)}"></div>
          <div><label for="kpn">Postnummer (för närmaste handlare)</label><input id="kpn" inputmode="numeric" autocomplete="postal-code" value="${esc(k.postnr)}"></div>
          <div class="hel"><label for="kl">När vill du ha bilen?</label><select id="kl">${["Så snart som möjligt", "Inom 3 månader", "Inom 6 månader", "Jag är flexibel"].map(o => `<option ${o === k.leverans ? "selected" : ""}>${o}</option>`).join("")}</select></div>
          <label class="hel ksamtycke"><input type="checkbox" id="ks" ${k.samtycke ? "checked" : ""}><span>Jag godkänner att Jämföra Privatleasing skickar mina uppgifter och min beställning till handlaren, så att de kan skicka mitt leasingavtal. Uppgifterna används inte till något annat (<a href="integritetspolicy.html" target="_blank">integritetspolicy</a>).</span></label>
        </div><div class="kinfo">Du behöver inte lämna personnummer här. Kreditprövning och signering görs med BankID hos leasingbolaget.</div>`;
      }
      if (steg === 3) {
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
      document.getElementById("konfBild").classList.toggle("kompakt", steg > 0);
      document.getElementById("konfSum").innerHTML = `<b>${kr(r.manad + r.adm + r.fors)}/mån</b><small>${kr(r.total)} totalt på 36 mån${r.okand ? " + dina önskemål" : ""}</small>`;
      document.getElementById("konfBak").style.visibility = steg ? "visible" : "hidden";
      document.getElementById("konfNasta").textContent = steg === 3 ? (innerWidth < 600 ? "Skicka" : "Skicka beställningen") : "Fortsätt";
      document.getElementById("konfPanel").scrollTop = 0;
      konf.querySelector(".kgrid").scrollTop = 0;
    }

    // Läs av det kunden har fyllt i på aktuellt steg
    function lasKonf() {
      const q = id => document.getElementById(id);
      if (K.steg === 0) { const v = konf.querySelector('input[name="kmil"]:checked'); if (v) K.mil = Number(v.value); }
      if (K.steg === 1) {
        if (K.cfg) K.cfg.G.forEach((g, gi) => {
          K.val[gi] = [...konf.querySelectorAll(`input[name="g${gi}"]`)].filter(i => i.checked && i.value !== "-1").map(i => Number(i.value));
        });
        if (q("konsk")) K.onskemal = q("konsk").value;
        if (!K.cfg) K.tv = [...konf.querySelectorAll('input[name="ktv"]')].filter(i => i.checked).map(i => Number(i.value));
      }
      if (K.steg === 2) Object.assign(K.kund, { namn: q("kn").value.trim(), epost: q("ke").value.trim(), tel: q("kt").value.trim(), postnr: q("kpn").value.trim(), leverans: q("kl").value, samtycke: q("ks").checked });
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
        `Kund: ${kund.namn}`, `E-post: ${kund.epost}`, `Telefon: ${kund.tel}`, `Postnummer: ${kund.postnr}`, `Önskad leverans: ${kund.leverans}`,
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
      if (!BESTALLNING_EPOST) { visaKopiera(ruta, text, "Beställningen är klar."); return; }
      knapp.disabled = true; knapp.textContent = "Skickar…";
      try {
        const till = bil.handlarEpost || BESTALLNING_EPOST;
        const svar = await fetch("https://formsubmit.co/ajax/" + till, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            _subject: `Ny beställning: ${bil.marke} ${bil.modell} – ${kund.namn}`,
            _template: "box", _captcha: "false", _replyto: kund.epost,
            ...(bil.handlarEpost ? { _cc: BESTALLNING_EPOST } : {}),
            _autoresponse: `Tack ${kund.namn}! Jämföra Privatleasing har skickat din beställning av ${bil.marke} ${bil.modell} (${kr(r.manad + r.adm + r.fors)}/mån) till ${bil.kalla.split(/ \(|,/)[0]}. Handlaren skickar avtalet till dig, och du godkänner det med BankID. Inget är bindande förrän du har signerat.\n\n${text}`,
            Bil: `${bil.marke} ${bil.modell}`, Manadspris: `${kr(r.manad + r.adm + r.fors)}/mån`, Totalt_36_man: kr(r.total),
            Namn: kund.namn, Epost: kund.epost, Telefon: kund.tel, Postnummer: kund.postnr, Leverans: kund.leverans,
            Erbjudande: bil.url, Bestallning: text,
          }),
        });
        const data = await svar.json().catch(() => ({}));
        if (!svar.ok || String(data.success) === "false") throw new Error(data.message || svar.status);
        K.skickad = true;
        document.getElementById("konfBody").innerHTML = `<div class="kklar"><div class="bock">✓</div><h3>Tack, ${esc(kund.namn.split(" ")[0])}! Beställningen är skickad.</h3><p>Vi har skickat din beställning av ${esc(bil.marke)} ${esc(bil.modell)} till handlaren. En bekräftelse har gått till ${esc(kund.epost)}.</p><div class="kinfo" style="text-align:left"><b>Nästa steg:</b> Handlaren kontaktar dig och skickar avtalet. Du godkänner det med BankID. Inget är bindande förrän du har signerat.</div></div>`;
        document.getElementById("konfBak").style.visibility = "hidden";
        knapp.textContent = "Skickad ✓";
      } catch (err) {
        knapp.disabled = false; knapp.textContent = "Försök igen";
        visaKopiera(ruta, text, "Beställningen kunde inte skickas just nu.");
      }
    }

    document.getElementById("konfNasta").onclick = () => {
      lasKonf();
      if (K.steg === 2) {
        const k = K.kund, fel = [];
        if (!k.namn) fel.push("namn");
        if (!/^\S+@\S+\.\S+$/.test(k.epost)) fel.push("en giltig e-post");
        if (k.tel.replace(/\D/g, "").length < 7) fel.push("telefon");
        if (!/^\d{3}\s?\d{2}$/.test(k.postnr)) fel.push("postnummer (5 siffror)");
        if (!k.samtycke) fel.push("ditt godkännande");
        if (fel.length) { alertRuta("Fyll i " + fel.join(", ") + "."); return; }
      }
      if (K.steg === 3) { skicka(); return; }
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
    konf.addEventListener("change", () => { const s = K.steg; lasKonf(); if (s <= 1) { konfBild(); const r = berakna(); document.getElementById("konfSum").innerHTML = `<b>${kr(r.manad + r.adm + r.fors)}/mån</b><small>${kr(r.total)} totalt på 36 mån${r.okand ? " + dina önskemål" : ""}</small>`; } });
    lista.addEventListener("click", e => { const b = e.target.closest("button[data-bil]"); if (b) oppnaKonf(BILAR[Number(b.dataset.bil)]); });


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
          <div class="tbild">${b.foto ? `<img src="bilder/${b.foto}.jpg" alt="${t.namn}" loading="lazy">` : ""}<span class="tplats">#${i + 1} mest leasade</span></div>
          <div class="tinner">
            <div class="thuvud">
              <div><div class="tnamn">${t.namn}</div><div class="tversion">${b.modell.replace(/^(EX40|EX30|Tiguan|Model Y|XC60) ?/, "") || "&nbsp;"}</div></div>
              <div class="tfran">Från<div class="tpris">${kr(b.m).replace(" kr", "")}:-<small>/mån</small><sup class="fn"><a href="#villkor">1</a></sup></div></div>
            </div>
            <div class="tchips"><span>36 månader</span><span>${b.mil.toLocaleString("sv-SE")} mil/år</span>${b.forhojd ? `<span>${kr(b.forhojd)} första hyra</span>` : ""}</div>
            <div class="ttotal">${kr(b.total)} totalt · ${/\bvia\b/.test(b.kalla) ? "" : "via "}${b.kalla.split(/ \(|,/)[0]}${alla.length > 1 ? ` · bäst av ${alla.length}` : ""}</div>
            <div class="tfot">${bt ? `<span class="betyg ${bt.klass}">${bt.text} · ${pct(b.andel)}</span>` : "<span></span>"}<button type="button" class="cta" data-bil="${b.idx}">Beställ</button></div>
          </div>
        </article>`;
      }).join("");
    }
    document.getElementById("topp").addEventListener("click", e => { const b = e.target.closest("button[data-bil]"); if (b) oppnaKonf(BILAR[Number(b.dataset.bil)]); });
    document.getElementById("trust").innerHTML = `<span>${BILAR.length} bilar från ${new Set(BILAR.map(b => b.marke)).size} märken</span><span>Priser kontrollerade ${KONTROLL}</span><span>Alla avgifter inräknade</span><span>Beställ med tillval direkt här</span>`;
    document.getElementById("fotforetag").innerHTML = [FORETAG.namn + " (enskild firma)", FORETAG.orgnr && "Org.nr " + FORETAG.orgnr, FORETAG.epost].filter(Boolean).map(esc).join("<br>");
    // Kör rita() när något ändras, och en gång direkt när sidan laddas.
    [sok, drivmedel, mil, forsakring, sortera].forEach(el => el.addEventListener("input", rita));
    rita();
  
    // "Visa fler frågor"
    document.getElementById("visaFler").onclick = e => { document.getElementById("fragor").classList.add("visaalla"); e.target.remove(); };

    // "Hittar du inte din bil?" – intresseförfrågan som skickas till Jämföra Privatleasing
    document.getElementById("ejbilForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target, d = Object.fromEntries(new FormData(f)), svar = document.getElementById("ejbilSvar");
      const fel = [];
      if (!d.bil.trim()) fel.push("vilken bil");
      if (!d.namn.trim()) fel.push("namn");
      if (!/^\S+@\S+\.\S+$/.test(d.epost)) fel.push("en giltig e-post");
      if (!d.ok) fel.push("ditt godkännande");
      if (fel.length) { svar.textContent = "Fyll i " + fel.join(", ") + "."; return; }
      const text = `INTRESSEFÖRFRÅGAN via Jämföra Privatleasing\nBil: ${d.bil}\nBudget: ${d.budget || "–"}\nMil/år: ${d.mil || "–"}\nNamn: ${d.namn}\nE-post: ${d.epost}\nTelefon: ${d.tel || "–"}`;
      if (!BESTALLNING_EPOST) { svar.innerHTML = "<b>Tack!</b> Formuläret kopplas på när sidan är live."; return; }
      const knapp = f.querySelector("button"); knapp.disabled = true; knapp.textContent = "Skickar…";
      try {
        const r = await fetch("https://formsubmit.co/ajax/" + BESTALLNING_EPOST, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ _subject: `Intresseförfrågan: ${d.bil} – ${d.namn}`, _template: "box", _captcha: "false", _replyto: d.epost,
            Bil: d.bil, Budget: d.budget, Mil: d.mil, Namn: d.namn, Epost: d.epost, Telefon: d.tel, Text: text }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || String(j.success) === "false") throw 0;
        f.reset(); svar.innerHTML = "<b>Tack!</b> Vi hör av oss när vi hittar ett bra erbjudande.";
      } catch { svar.textContent = "Det gick inte att skicka just nu. Försök igen om en stund."; }
      knapp.disabled = false; knapp.textContent = "Bli kontaktad";
    });
  