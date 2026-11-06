# Gör om konfiguratorn (beställningssidan) till en helskärmsvy i stil med bilmärkenas egna
# konfiguratorer: stor bild till vänster, val som kort till höger, stegmätare och prisrad.
import re
p = "index.html"; s = open(p, encoding="utf-8").read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a)); s = s.replace(a, b)

# ---------- 1. Byt ut all CSS för konfiguratorn ----------
a = s.index("    dialog#konf { background")
b = s.index("    .kutr li { break-inside: avoid; padding: 2px 0; }") + len("    .kutr li { break-inside: avoid; padding: 2px 0; }")
CSS = r"""
    /* ===== Beställningssidan (konfiguratorn) – helskärm som hos bilmärkena ===== */
    dialog#konf { color-scheme: light; background: #fff; color: var(--text); border: 0; padding: 0; margin: 0;
      width: 100vw; max-width: 100vw; height: 100vh; height: 100dvh; max-height: none; box-sizing: border-box; }
    dialog#konf[open] { display: flex; flex-direction: column; }
    dialog#konf::backdrop { background: rgba(14, 42, 71, .6); }
    .kh { display: flex; align-items: center; gap: 16px; padding: 0 24px; height: 60px; border-bottom: 1px solid var(--line); flex: none; }
    .klogo { font-weight: 800; font-size: 17px; letter-spacing: -.3px; color: var(--navy); white-space: nowrap; }
    .klogo b { color: var(--yellow); }
    .kh h2 { flex: 1; margin: 0; font-size: 15px; font-weight: 600; color: var(--muted); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .kh button { width: 40px; height: 40px; border-radius: 50%; border: 0; background: #F2F4F7; color: var(--navy); font-size: 22px; line-height: 1; cursor: pointer; flex: none; }
    .kh button:hover { background: var(--line); }

    /* Stegmätare */
    .kprog { display: flex; justify-content: center; gap: 0; padding: 14px 24px; border-bottom: 1px solid var(--line); flex: none; overflow-x: auto; }
    .kprog button { display: flex; align-items: center; gap: 8px; background: none; border: 0; padding: 0; font: inherit; font-size: 13px; color: var(--muted); cursor: default; white-space: nowrap; }
    .kprog button:not(:last-child)::after { content: ""; width: 48px; height: 2px; background: var(--line); margin: 0 12px; border-radius: 2px; }
    .kprog i { font-style: normal; width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--line); display: grid; place-items: center; font-size: 12px; font-weight: 700; box-sizing: border-box; }
    .kprog .akt { color: var(--navy); font-weight: 700; }
    .kprog .akt i { background: var(--navy); border-color: var(--navy); color: #fff; }
    .kprog .klar { color: var(--navy); cursor: pointer; }
    .kprog .klar i { background: var(--yellow); border-color: var(--yellow); color: var(--navy); }
    .kprog .klar::after { background: var(--yellow) !important; }

    /* Två kolumner: bild + val */
    .kgrid { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(380px, 1fr); }
    .kvisual { background: radial-gradient(120% 90% at 50% 40%, #FFFFFF 0%, #EEF2F6 70%, #E3E9F0 100%); display: flex; flex-direction: column; justify-content: center; padding: 32px 48px; overflow: hidden; position: relative; }
    .kvisual img { width: 100%; max-height: 52vh; object-fit: contain; mix-blend-mode: multiply; border-radius: 6px; }
    .kvisual .kingen { aspect-ratio: 16 / 9; display: grid; place-items: center; color: var(--muted); border: 2px dashed #C9D2DE; border-radius: 12px; text-align: center; }
    .kvnamn { margin: 22px 0 4px; font-size: clamp(26px, 3vw, 40px); font-weight: 800; letter-spacing: -1px; line-height: 1.05; color: var(--navy); }
    .kvkalla { color: var(--muted); font-size: 14px; }
    .kchips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
    .kchips span { background: rgba(255,255,255,.85); border: 1px solid var(--line); padding: 6px 12px; border-radius: 99px; font-size: 13px; font-weight: 600; }
    .kvfarg { position: absolute; top: 20px; left: 24px; font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 8px; }

    .kpanel { overflow-y: auto; border-left: 1px solid var(--line); background: #fff; }
    .kb { padding: 28px 32px 40px; max-width: 560px; }
    .kb > h3 { font-size: 24px; letter-spacing: -.5px; margin: 0 0 4px; }
    .kb > .kunder { color: var(--muted); margin: 0 0 20px; font-size: 14px; }
    .kgrupp { margin: 0 0 26px; }
    .kgrupp h4 { margin: 0 0 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--muted); }
    .kgrupp > small, .kgrupp small.knot { display: block; color: var(--muted); font-size: 12px; margin-top: 8px; }

    /* Val som kort */
    .kval { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: center; padding: 14px 16px; border: 1.5px solid var(--line); border-radius: 12px; margin: 0 0 8px; cursor: pointer; transition: border-color .15s, box-shadow .15s; position: relative; }
    .kval:hover { border-color: #AEB8C7; }
    .kval:has(input:checked) { border-color: var(--navy); box-shadow: 0 0 0 1px var(--navy); }
    .kval:has(input:disabled) { cursor: default; background: #FAFBFC; }
    .kval input { position: absolute; opacity: 0; pointer-events: none; }
    .kval > span:first-of-type { font-weight: 600; font-size: 15px; display: flex; align-items: center; gap: 10px; }
    .kval small { display: block; color: var(--muted); font-size: 12px; font-weight: 400; margin-top: 3px; }
    .kval .kp { font-weight: 600; white-space: nowrap; font-size: 14px; color: var(--navy); }
    .kval .kp.ingar { color: #11734B; }
    .kval.ruta > span:first-of-type::before { content: ""; width: 18px; height: 18px; border: 1.5px solid #AEB8C7; border-radius: 5px; flex: none; box-sizing: border-box; }
    .kval.ruta:has(input:checked) > span:first-of-type::before { background: var(--navy) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12l5 5 9-10'/%3E%3C/svg%3E") center / 12px no-repeat; border-color: var(--navy); }
    .kval .namnrad { display: block; }
    .sw { width: 26px; height: 26px; border-radius: 50%; flex: none; box-shadow: inset 0 0 0 1px rgba(0,0,0,.15), 0 1px 2px rgba(0,0,0,.12); }

    /* Körsträcka som knapprad */
    .kseg { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
    .kseg label { border: 1.5px solid var(--line); border-radius: 12px; padding: 12px 10px; text-align: center; cursor: pointer; }
    .kseg label:has(input:checked) { border-color: var(--navy); box-shadow: 0 0 0 1px var(--navy); }
    .kseg label:has(input:disabled) { cursor: default; }
    .kseg input { position: absolute; opacity: 0; pointer-events: none; }
    .kseg b { display: block; font-size: 15px; }
    .kseg small { color: var(--muted); font-size: 12px; }

    /* Formulär */
    .kform { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .kform label { font-size: 13px; font-weight: 600; color: var(--text); display: block; margin-bottom: 6px; }
    .kform input, .kform textarea, .kform select { background: #fff; width: 100%; box-sizing: border-box; padding: 13px 14px; border: 1.5px solid var(--line); border-radius: 10px; font: inherit; color: var(--text); }
    .kform input:focus, .kform textarea:focus, .kform select:focus { outline: none; border-color: var(--navy); }
    .kform .hel { grid-column: 1 / -1; }
    .ksamtycke { display: flex !important; gap: 10px; align-items: flex-start; font-weight: 400 !important; color: var(--muted) !important; font-size: 13px !important; line-height: 1.45; }
    .ksamtycke input { width: 18px !important; height: 18px; margin: 1px 0 0; flex: none; accent-color: var(--navy); }

    /* Sammanfattning */
    .kkvitto { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
    .kkvitto section { padding: 16px 18px; border-top: 1px solid var(--line); }
    .kkvitto section:first-child { border-top: 0; }
    .kkvitto h5 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: var(--muted); }
    .ktabell { width: 100%; border-collapse: collapse; font-size: 14px; }
    .ktabell td { padding: 5px 0; vertical-align: top; }
    .ktabell td:last-child { text-align: right; font-weight: 600; white-space: nowrap; padding-left: 12px; }
    .kkvitto .ktot { background: #F5F7FA; }
    .kkvitto .ktot td { font-size: 15px; }
    .kkvitto .ktot .stor td { font-size: 20px; font-weight: 800; padding-top: 8px; }
    .ktrygg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 18px 0; }
    .ktrygg div { background: #F5F7FA; border-radius: 12px; padding: 12px; font-size: 12px; color: var(--muted); }
    .ktrygg b { display: block; color: var(--navy); font-size: 13px; margin-bottom: 2px; }
    .kinfo { background: var(--mint); border-radius: 12px; padding: 14px 16px; font-size: 14px; margin: 14px 0; }
    .kfel { color: var(--red); font-size: 13px; min-height: 1em; margin-top: 10px; }
    .kklar { text-align: center; padding: 24px 8px; }
    .kklar .bock { width: 64px; height: 64px; border-radius: 50%; background: #DFF5EC; color: #11734B; display: grid; place-items: center; font-size: 32px; margin: 0 auto 14px; }
    .kklar h3 { margin: 0 0 6px; font-size: 22px; }
    .kklar p { color: var(--muted); margin: 0; }

    /* Prisraden längst ner */
    .kfot { flex: none; display: flex; align-items: center; gap: 12px; padding: 14px 24px; border-top: 1px solid var(--line); background: #fff; box-shadow: 0 -6px 20px rgba(14,42,71,.06); }
    .kfot .ksum { flex: 1; min-width: 0; }
    .kfot .ksum b { font-size: 22px; letter-spacing: -.5px; display: block; }
    .kfot .ksum small { color: var(--muted); font-size: 13px; }
    .kfot button { font: inherit; font-weight: 700; cursor: pointer; border: 0; border-radius: 99px; padding: 14px 28px; white-space: nowrap; }
    .kfot .tillbaka { background: none; color: var(--navy); padding: 14px 12px; text-decoration: underline; text-underline-offset: 3px; }
    .kfot .nasta { background: var(--navy); color: #fff; min-width: 180px; }
    .kfot .nasta:hover { background: #163C63; }
    .kfot .nasta:disabled { opacity: .6; cursor: default; }

    .kutr { margin: 0; padding-left: 18px; columns: 2; column-gap: 24px; font-size: 14px; }
    .kutr li { break-inside: avoid; padding: 2px 0; }

    @media (max-width: 900px) {
      .kgrid { display: block; overflow-y: auto; }
      .kpanel { overflow: visible; border-left: 0; }
      .kvisual { padding: 16px 20px 18px; }
      .kvisual img { max-height: 200px; }
      .kvnamn { margin-top: 10px; font-size: 24px; }
      .kchips { margin-top: 10px; } .kchips span { font-size: 12px; padding: 4px 10px; }
      .kvfarg { display: none; }
      .kb { padding: 20px 16px 28px; max-width: none; }
    }
    @media (max-width: 600px) {
      .kh { padding: 0 12px; height: 54px; gap: 10px; } .klogo { font-size: 15px; } .kh h2 { font-size: 13px; text-align: left; }
      .kprog { justify-content: flex-start; padding: 10px 12px; }
      .kprog button { font-size: 12px; } .kprog button:not(:last-child)::after { width: 16px; margin: 0 6px; }
      .kprog button:not(.akt) span { display: none; }
      .kform { grid-template-columns: 1fr; }
      .kutr { columns: 1; }
      .ktrygg { grid-template-columns: 1fr; }
      .kfot { padding: 10px 12px; gap: 6px; }
      .kfot .ksum b { font-size: 18px; } .kfot .ksum small { font-size: 11px; }
      .kfot .nasta { min-width: 0; padding: 13px 18px; font-size: 14px; }
      .kfot .tillbaka { padding: 13px 6px; font-size: 14px; }
    }"""
s = s[:a] + CSS.strip("\n") + s[b:]

# ---------- 2. Ny markup för dialogen ----------
a = s.index('  <dialog id="konf"'); b = s.index("  </dialog>") + len("  </dialog>")
s = s[:a] + '''  <dialog id="konf" aria-labelledby="konfTitel">
    <div class="kh"><span class="klogo">Leasing<b>kollen</b></span><h2 id="konfTitel">Bygg din bil</h2><button type="button" id="konfStang" aria-label="Stäng">×</button></div>
    <nav class="kprog" id="konfSteg" aria-label="Steg"></nav>
    <div class="kgrid">
      <aside class="kvisual" id="konfBild"></aside>
      <div class="kpanel" id="konfPanel"><div class="kb" id="konfBody"></div></div>
    </div>
    <div class="kfot">
      <div class="ksum" id="konfSum"></div>
      <button type="button" class="tillbaka" id="konfBak">Tillbaka</button>
      <button type="button" class="nasta" id="konfNasta">Fortsätt</button>
    </div>
  </dialog>''' + s[b:]

# ---------- 3. JS: hjälpfunktioner för bild och färgprov ----------
rep('    const STEG = ["Avtal", "Utrustning", "Dina uppgifter", "Sammanfattning"];', r'''    const STEG = ["Avtal", "Utrustning", "Dina uppgifter", "Sammanfattning"];
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
        ${vf ? `<div class="kvfarg">${c ? `<span class="sw" style="background:${c}"></span>` : ""}Vald färg: ${esc(vf)}</div>` : ""}
        ${bil.foto ? `<img src="bilder/${bil.foto}.jpg" alt="${esc(bil.marke + " " + bil.modell)}">` : `<div class="kingen"><div><b>Helt ny modell</b><br><small>Fri bild finns ännu inte</small></div></div>`}
        <div class="kvnamn">${esc(bil.marke)} ${esc(bil.modell)}</div>
        <div class="kvkalla">Erbjudande från ${esc(bil.kalla)}</div>
        <div class="kchips"><span>36 månader</span><span>${K.mil.toLocaleString("sv-SE")} mil/år</span><span>0 kr kontantinsats</span>${r.nypris ? `<span>Nypris ${kr(r.nypris)}</span>` : ""}</div>`;
    }''')

# ---------- 4. ritaKonf: ny stegmätare, rubriker, kort och sammanfattning ----------
rep('''      document.getElementById("konfSteg").innerHTML = STEG.map((t, i) => `<span class="${i === steg ? "akt" : ""}">${i + 1}. ${t}</span>`).join("");
      let h = "";''', '''      document.getElementById("konfSteg").innerHTML = STEG.map((t, i) => `<button type="button" data-steg="${i}" class="${i === steg ? "akt" : i < steg ? "klar" : ""}" ${i < steg ? "" : "tabindex=-1"} ${i === steg ? 'aria-current="step"' : ""}><i>${i < steg ? "✓" : i + 1}</i><span>${t}</span></button>`).join("");
      let h = K.skickad ? "" : `<h3>${RUBRIK[steg][0]}</h3><p class="kunder">${RUBRIK[steg][1]}</p>`;''')

# Steg 0: avtal + körsträcka som knapprad
rep('''        h += `<div class="kgrupp"><h4>Avtalstid</h4><label class="kval"><input type="radio" checked disabled><span>36 månader</span><span class="kp">ingår</span></label></div>`;
        h += `<div class="kgrupp"><h4>Körsträcka per år</h4>` + mv.map(m => {
          const diff = cfg ? cfg.bas[m] - cfg.bas[mv[0]] : (m <= bil.mil ? 0 : bil.mer[m]);
          return `<label class="kval"><input type="radio" name="kmil" value="${m}" ${m === K.mil ? "checked" : ""}><span>${m.toLocaleString("sv-SE")} mil/år</span><span class="kp">${diff ? plus(diff) : "ingår"}</span></label>`;
        }).join("") + (mv.length === 1 ? `<small>Fler mil går ofta att välja mot en högre månadskostnad. Skriv det under önskemål i nästa steg, så räknar handlaren på det.</small>` : "") + `</div>`;''',
'''        h += `<div class="kgrupp"><h4>Avtalstid</h4><div class="kseg"><label><input type="radio" checked disabled><b>36 mån</b><small>Ingår i priset</small></label></div></div>`;
        h += `<div class="kgrupp"><h4>Körsträcka per år</h4><div class="kseg">` + mv.map(m => {
          const diff = cfg ? cfg.bas[m] - cfg.bas[mv[0]] : (m <= bil.mil ? 0 : bil.mer[m]);
          return `<label><input type="radio" name="kmil" value="${m}" ${m === K.mil ? "checked" : ""}><b>${m.toLocaleString("sv-SE")} mil</b><small>${diff ? plus(diff) : "Ingår"}</small></label>`;
        }).join("") + `</div>` + (mv.length === 1 ? `<small>Fler mil går ofta att välja mot en högre månadskostnad. Skriv det under önskemål i nästa steg, så räknar handlaren på det.</small>` : "") + `</div>`;
        h += `<div class="kgrupp"><h4>Kontantinsats</h4><div class="kseg"><label><input type="radio" checked disabled><b>0 kr</b><small>Ingen kontantinsats</small></label></div></div>`;''')
rep('''        h += `<div class="kinfo">Villkor: ${esc(bil.not || "se erbjudandet")}''', '''        h += `<div class="kinfo"><b>Villkor:</b> ${esc(bil.not || "se erbjudandet")}''')

# Steg 1: kort, kryssrutor och färgprov
rep('''            const ingen = (!g.m && g.o) ? `<label class="kval"><input type="radio" name="g${gi}" value="-1" ${!(K.val[gi] || []).length ? "checked" : ""}><span>Inget ${esc(g.g.toLowerCase())}</span><span class="kp"></span></label>` : "";''',
'''            const ar_farg = /färg|lack/i.test(g.g), kl = g.m ? "kval ruta" : "kval";
            const ingen = (!g.m && g.o) ? `<label class="kval"><input type="radio" name="g${gi}" value="-1" ${!(K.val[gi] || []).length ? "checked" : ""}><span>Inget ${esc(g.g.toLowerCase())}</span><span class="kp"></span></label>` : "";''')
rep('''              return `<label class="kval"><input type="${typ}" name="g${gi}" value="${vi}" ${vald ? "checked" : ""} ${v.i ? "disabled" : ""}><span>${esc(v.n)}${v.d ? `<small>${esc(v.d)}</small>` : ""}</span><span class="kp">${v.i ? "ingår" : p ? plus(p) : "0 kr"}</span></label>`;''',
'''              const c = ar_farg && farg(v.n);
              return `<label class="${kl}"><input type="${typ}" name="g${gi}" value="${vi}" ${vald ? "checked" : ""} ${v.i ? "disabled" : ""}><span>${c ? `<i class="sw" style="background:${c}"></i>` : ""}<span class="namnrad">${esc(v.n)}${v.d ? `<small>${esc(v.d)}</small>` : ""}</span></span><span class="kp ${v.i || !p ? "ingar" : ""}">${v.i ? "Ingår" : p ? plus(p) : "Ingår i priset"}</span></label>`;''')
rep('''`<label class="kval"><input type="checkbox" name="ktv" value="${i}" ${K.tv.includes(i) ? "checked" : ""}><span>${esc(t.n)}</span><span class="kp">${plus(t.p)}</span></label>`''',
'''`<label class="kval ruta"><input type="checkbox" name="ktv" value="${i}" ${K.tv.includes(i) ? "checked" : ""}><span>${esc(t.n)}</span><span class="kp">${plus(t.p)}</span></label>`''')

# Steg 2: snyggare samtycke
rep('''<label class="hel" style="display:flex;gap:8px;align-items:flex-start;color:var(--text)"><input type="checkbox" id="ks" style="width:auto;margin-top:3px" ${k.samtycke ? "checked" : ""}> Jag godkänner''',
'''<label class="hel ksamtycke"><input type="checkbox" id="ks" ${k.samtycke ? "checked" : ""}><span>Jag godkänner''')
rep('''(<a href="integritetspolicy.html" target="_blank">integritetspolicy</a>).</label>''', '''(<a href="integritetspolicy.html" target="_blank">integritetspolicy</a>).</span></label>''')

# Steg 3: kvitto i sektioner
a = s.index('      if (steg === 3) {\n        h += `<table class="ktabell">')
b = s.index('        <div id="kskicka"></div>`;', a) + len('        <div id="kskicka"></div>`;')
s = s[:a] + r'''      if (steg === 3) {
        const k = K.kund, rad = (t, v) => `<tr><td>${t}</td><td>${v}</td></tr>`;
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
        <div class="ktrygg"><div><b>Inte bindande</b>Inget gäller förrän du signerat avtalet.</div><div><b>Signera med BankID</b>Handlaren skickar avtalet till dig.</div><div><b>Helt gratis</b>Leasingkollen kostar inget för dig.</div></div>
        ${r.okand ? `<div class="kinfo">Priset för dina önskemål står i avtalet från handlaren.</div>` : ""}
        <div id="kskicka"></div>`;''' + s[b:]

# Rendera bild + scrolla panelen + knapptext
rep('''      document.getElementById("konfBody").innerHTML = h;''', '''      document.getElementById("konfBody").innerHTML = h;
      konfBild();''')
rep('''      document.getElementById("konfNasta").textContent = steg === 3 ? "Skicka beställningen" : "Nästa";
      document.getElementById("konfBody").scrollTop = 0;
      konf.scrollTop = 0;''', '''      document.getElementById("konfNasta").textContent = steg === 3 ? "Skicka beställningen" : "Fortsätt";
      document.getElementById("konfPanel").scrollTop = 0;
      konf.querySelector(".kgrid").scrollTop = 0;''')

# Lyckat skick: tydlig bekräftelse
rep('''        ruta.innerHTML = `<div class="kinfo"><b>Tack, vi har skickat din beställning till handlaren!</b> En bekräftelse har gått till ${esc(kund.epost)}. Handlaren skickar avtalet till dig, och du godkänner det med BankID.</div>`;''',
'''        document.getElementById("konfBody").innerHTML = `<div class="kklar"><div class="bock">✓</div><h3>Tack, ${esc(kund.namn.split(" ")[0])}! Beställningen är skickad.</h3><p>Vi har skickat din beställning av ${esc(bil.marke)} ${esc(bil.modell)} till handlaren. En bekräftelse har gått till ${esc(kund.epost)}.</p><div class="kinfo" style="text-align:left"><b>Nästa steg:</b> Handlaren kontaktar dig och skickar avtalet. Du godkänner det med BankID. Inget är bindande förrän du har signerat.</div></div>`;
        document.getElementById("konfBak").style.visibility = "hidden";''')

# Uppdatera bilden/chips när man ändrar val
rep('''if (s <= 1) { const r = berakna();''', '''if (s <= 1) { konfBild(); const r = berakna();''')

# Klick på klara steg i stegmätaren
rep('''    document.getElementById("konfBak").onclick = () => { lasKonf(); K.steg--; ritaKonf(); };''',
'''    document.getElementById("konfBak").onclick = () => { lasKonf(); K.steg--; ritaKonf(); };
    document.getElementById("konfSteg").onclick = e => { const b = e.target.closest("button.klar"); if (!b || K.skickad) return; lasKonf(); K.steg = Number(b.dataset.steg); ritaKonf(); };''')

open(p, "w", encoding="utf-8").write(s)
print("ok")
