p="index.html"; s=open(p,encoding="utf-8").read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:60],s.count(a)); s=s.replace(a,b)

ALLA = "    .allarubrik { font-size: clamp(24px"
rep(ALLA, """    /* Vad ingår – expanderbara rader (inspirerat av märkenas egna leasingsidor) */
    section.ingar { padding: 56px 0 8px; }
    .ingar .wrap { padding: 0 16px; }
    .ingar h2, .ejbil h2 { font-size: clamp(24px, 3.4vw, 32px); margin: 0 0 6px; letter-spacing: -.5px; }
    .ingar .ingress { color: var(--muted); margin: 0 0 22px; max-width: 640px; }
    .ingargrid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 40px; }
    .ingargrid details { border-top: 1px solid var(--line); }
    .ingargrid details:last-child, .ingargrid details:nth-last-child(2) { border-bottom: 1px solid var(--line); }
    .ingargrid summary { list-style: none; cursor: pointer; display: grid; grid-template-columns: 40px 1fr 20px; gap: 14px; align-items: center; padding: 16px 0; }
    .ingargrid summary::-webkit-details-marker { display: none; }
    .ingargrid summary::after { content: "›"; font-size: 22px; color: var(--muted); transition: transform .2s; justify-self: end; }
    .ingargrid details[open] summary::after { transform: rotate(90deg); }
    .ikon { width: 40px; height: 40px; border-radius: 50%; background: var(--mint); display: grid; place-items: center; }
    .ikon svg { width: 20px; height: 20px; stroke: var(--navy); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .ingargrid summary b { display: block; font-size: 16px; }
    .ingargrid summary small { color: var(--muted); font-size: 13px; }
    .ingargrid details p { margin: 0 0 16px 54px; color: var(--muted); font-size: 14px; }
    .tagg { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; margin-left: 6px; vertical-align: 2px; }
    .tagg.ja { background: #DFF5EC; color: #11734B; } .tagg.oft { background: #FFF4D6; color: #8A5A00; } .tagg.nej { background: #FBE3E2; color: #A23431; }
    /* Hittar du inte din bil? */
    section.ejbil { background: var(--mint); padding: 32px 24px; margin: 40px 0 0; display: grid; grid-template-columns: 1fr 1.3fr; gap: 32px; align-items: start; }
    .ejbil p { color: var(--muted); margin: 0; }
    .ejbilform { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .ejbilform input, .ejbilform select { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid var(--line); border-radius: 8px; font: inherit; background: #fff; color: var(--text); }
    .ejbilform .hel { grid-column: 1 / -1; }
    .ejbilform label.hel { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; color: var(--muted); }
    .ejbilform label.hel input { width: auto; margin-top: 3px; }
    .ejbilform button { grid-column: 1 / -1; justify-self: start; background: var(--navy); color: #fff; border: 0; padding: 12px 22px; border-radius: 8px; cursor: pointer; font: inherit; font-weight: 800; }
    #ejbilSvar { grid-column: 1 / -1; font-size: 14px; }
    /* Villkor i finstil */
    .villkor { font-size: 12px; color: var(--muted); margin: 28px 0 0; line-height: 1.55; }
    .villkor b { color: var(--text); }
    sup.fn a { color: var(--muted); text-decoration: none; font-size: 10px; margin-left: 1px; }
    #fragor details.dold { display: none; }
    #fragor.visaalla details.dold { display: block; }
    #visaFler { margin-top: 12px; background: none; border: 1px solid var(--line); padding: 9px 16px; border-radius: 99px; cursor: pointer; font: inherit; font-weight: 600; color: var(--navy); }
    @media (max-width: 760px) {
      .ingargrid { grid-template-columns: 1fr; }
      .ingargrid details:nth-last-child(2) { border-bottom: 0; }
      section.ejbil { grid-template-columns: 1fr; padding: 24px 16px; }
      .ejbilform { grid-template-columns: 1fr; }
    }

""" + ALLA)

I={'nyckel':'<path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
'skiftnyckel':'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z"/>',
'skold':'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
'bil':'<path d="M5 17h14M3 13l2-6h14l2 6v4H3z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>',
'mil':'<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4v6l4 2"/>',
'sno':'<path d="M12 2v20M4.9 4.9l14.2 14.2M2 12h20M4.9 19.1L19.1 4.9"/>',
'kr':'<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.5"/>',
'skatt':'<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>'}
def rad(ik,rub,tagg,kort,text):
    t={'ja':'Ingår','oft':'Ingår ofta','nej':'Tillkommer'}[tagg]
    return f'<details><summary><span class="ikon"><svg viewBox="0 0 24 24" aria-hidden="true">{I[ik]}</svg></span><span><b>{rub}<span class="tagg {tagg}">{t}</span></b><small>{kort}</small></span></summary><p>{text}</p></details>'
rader="\n        ".join([
 rad('bil','Ny bil utan kontantinsats','ja','Du betalar en fast månadskostnad.','Privatleasing kräver ingen kontantinsats. Vissa kampanjer bygger på en förhöjd första hyra – den räknar vi alltid in i totalkostnaden och visar tydligt.'),
 rad('nyckel','Inget restvärde att oroa sig för','ja','Du lämnar tillbaka bilen efter 36 månader.','Leasingbolaget tar risken för bilens värdeminskning, så länge bilen sköts enligt avtalet. Vill du fortsätta tecknar du ett nytt avtal och får en ny bil.'),
 rad('skiftnyckel','Service','oft','Ingår hos de flesta märken.','Hos de flesta märken ingår service enligt serviceprogrammet. Där service inte ingår står det i erbjudandet. Slitdelar som däck och torkarblad ingår oftast inte.'),
 rad('skold','Garanti och vägassistans','ja','Bilen är ny och har nybilsgaranti.','En ny bil har nybilsgaranti, och elbilar har dessutom batterigaranti. De flesta märken har även vägassistans som hjälper dig vid stopp eller olycka.'),
 rad('mil','Körsträcka','ja','Vanligen 1 000–1 500 mil per år.','Antalet mil per år står i varje erbjudande. Kör du mer kan du ofta välja fler mil mot ett tillägg. Mil utöver avtalet (övermil) betalar du när bilen lämnas tillbaka.'),
 rad('kr','Försäkring','nej','Bilen måste vara försäkrad.','Leasingbolaget kräver att bilen är försäkrad, vanligen med hel- eller halvförsäkring enligt avtalet. Hos några märken är en viss försäkring obligatorisk – då räknar vi in den i priset.'),
 rad('skatt','Fordonsskatt','nej','Betalas utöver hyran hos de flesta.','Fordonsskatten faktureras oftast utöver månadshyran. Elbilar har låg fordonsskatt. Om skatten ingår står det i erbjudandet.'),
 rad('sno','Vinterhjul','oft','Kan läggas till som tillval.','Vinterhjul ingår sällan i grundpriset men finns ofta som tillval. Väljer du dem i vår konfigurator ser du det nya priset direkt.'),
])
rep('  <main class="wrap" style="padding: 0 16px;" id="alla">', f'''  <!-- Vad ingår i privatleasing? -->
  <section class="ingar" id="vad-ingar">
    <div class="wrap">
      <h2>Vad ingår i privatleasing?</h2>
      <p class="ingress">Det här brukar ingå i månadskostnaden – och det här tillkommer. Exakt vad som gäller för varje bil står i erbjudandet.</p>
      <div class="ingargrid">
        {rader}
      </div>
    </div>
  </section>

  <main class="wrap" style="padding: 0 16px;" id="alla">''')

rep('    <section class="infokort">', '''    <p class="villkor" id="villkor"><sup>1</sup> <b>Så läser du priserna:</b> Privatleasing i 36 månader utan kontantinsats, med den körsträcka som står i erbjudandet. Månadspriset inkluderar avi- och adminavgift och eventuell obligatorisk försäkring. Totalkostnaden inkluderar dessutom uppläggningsavgift och eventuell förhöjd första hyra. Fordonsskatt, din egen försäkring, övermil och onormalt slitage tillkommer. Många erbjudanden har rörlig ränta, så månadskostnaden kan ändras under avtalstiden. Erbjudandena gäller ofta ett begränsat antal bilar. Priserna kontrolleras varje dag mot märkenas och handlarnas egna sidor, men det är alltid handlarens avtal som gäller. Bilderna är vägledande.</p>

    <section class="ejbil" id="hittar-inte">
      <div>
        <h2>Hittar du inte din bil?</h2>
        <p>Berätta vilken bil du letar efter, så hör vi av oss när vi hittar ett bra erbjudande. Det är gratis och inte bindande.</p>
      </div>
      <form class="ejbilform" id="ejbilForm" novalidate>
        <input class="hel" name="bil" placeholder="Vilken bil? T.ex. Volvo XC40 eller valfri elbil">
        <select name="budget" aria-label="Max per månad"><option value="">Max per månad</option><option>Under 3 000 kr</option><option>3 000–4 000 kr</option><option>4 000–5 000 kr</option><option>5 000–7 000 kr</option><option>Över 7 000 kr</option></select>
        <select name="mil" aria-label="Mil per år"><option value="">Mil per år</option><option>1 000</option><option>1 500</option><option>2 000</option><option>Mer än 2 000</option></select>
        <input name="namn" placeholder="Namn" autocomplete="name">
        <input name="epost" type="email" placeholder="E-post" autocomplete="email">
        <input class="hel" name="tel" type="tel" placeholder="Telefon (valfritt)" autocomplete="tel">
        <label class="hel"><input type="checkbox" name="ok"> Jag godkänner att Leasingkollen sparar mina uppgifter för att kontakta mig om erbjudanden på bilen jag letar efter (<a href="integritetspolicy.html">integritetspolicy</a>).</label>
        <button type="submit">Bli kontaktad</button>
        <div id="ejbilSvar" aria-live="polite"></div>
      </form>
    </section>

    <section class="infokort">''')

nyfaq = '''      <details class="dold"><summary>Vad kostar övermil?</summary><p>Kör du fler mil än avtalet tillåter betalar du för övermilen när bilen lämnas tillbaka. Priset per mil står i avtalet och skiljer sig mellan märken. Märker du att du kör mer kan du ofta ändra körsträckan under avtalstiden – det blir oftast billigare än att betala övermil i efterhand.</p></details>
      <details class="dold"><summary>Kan månadskostnaden ändras?</summary><p>Ja, om avtalet har rörlig ränta. Då följer månadskostnaden marknadsräntan (ofta Stibor), både uppåt och nedåt. Det står i erbjudandet och avtalet om räntan är rörlig eller fast.</p></details>
      <details class="dold"><summary>Vilken försäkring krävs?</summary><p>Leasingbolaget kräver att bilen är försäkrad under hela perioden, vanligen med hel- eller halvförsäkring. Du väljer oftast själv försäkringsbolag. Hos några märken ingår en obligatorisk försäkring – den räknar vi in i månadspriset.</p></details>
      <details class="dold"><summary>Vad händer när avtalet tar slut?</summary><p>Du lämnar tillbaka bilen till handlaren. Den besiktigas, och övermil eller skador utöver normalt slitage debiteras. Vill du fortsätta leasa tecknar du ett nytt avtal på en ny bil.</p></details>
      <details class="dold"><summary>Kan jag provköra bilen först?</summary><p>Ja. Kontakta handlaren som har erbjudandet och boka en provkörning innan du skickar din beställning. Länken till erbjudandet finns på varje bil.</p></details>
      <details class="dold"><summary>Kan jag leasa en begagnad bil?</summary><p>Vissa handlare erbjuder privatleasing av begagnade bilar lokalt. Vi jämför i dag bara nya bilar. Fyll gärna i "Hittar du inte din bil?" så hör vi av oss.</p></details>
      <button type="button" id="visaFler">Visa fler frågor</button>
'''
i=s.index('<summary>Var kommer bilderna ifrån?</summary>'); j=s.index('</details>',i)+len('</details>\n')
s=s[:j]+nyfaq+s[j:]

rep('<div class="month">${kr(b.m)}/mån</div>','<div class="month">${kr(b.m)}/mån<sup class="fn"><a href="#villkor">1</a></sup></div>')
rep('<small>/mån</small></div></div>','<small>/mån</small><sup class="fn"><a href="#villkor">1</a></sup></div></div>')
rep('<a href="#sa-funkar-det">Så funkar det</a>','<a href="#sa-funkar-det">Så funkar det</a><a href="#vad-ingar">Vad ingår?</a>')

js = r'''
    // "Visa fler frågor"
    document.getElementById("visaFler").onclick = e => { document.getElementById("fragor").classList.add("visaalla"); e.target.remove(); };

    // "Hittar du inte din bil?" – intresseförfrågan som skickas till Leasingkollen
    document.getElementById("ejbilForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = e.target, d = Object.fromEntries(new FormData(f)), svar = document.getElementById("ejbilSvar");
      const fel = [];
      if (!d.bil.trim()) fel.push("vilken bil");
      if (!d.namn.trim()) fel.push("namn");
      if (!/^\S+@\S+\.\S+$/.test(d.epost)) fel.push("en giltig e-post");
      if (!d.ok) fel.push("ditt godkännande");
      if (fel.length) { svar.textContent = "Fyll i " + fel.join(", ") + "."; return; }
      const text = `INTRESSEFÖRFRÅGAN via Leasingkollen\nBil: ${d.bil}\nBudget: ${d.budget || "–"}\nMil/år: ${d.mil || "–"}\nNamn: ${d.namn}\nE-post: ${d.epost}\nTelefon: ${d.tel || "–"}`;
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
'''
k=s.rindex("</script>")
s=s[:k]+js+"  "+s[k:]
open(p,"w",encoding="utf-8").write(s)
print("ok")
