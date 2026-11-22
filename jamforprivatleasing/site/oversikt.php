<?php
// Jämföra Privatleasing – Eriks statistiköversikt. Öppna: oversikt.php?nyckel=DIN_NYCKEL
// Här står bara en SHA-256-kontrollsumma av nyckeln, aldrig själva nyckeln – därför får filen ligga i det publika repot.
const NYCKEL_SHA256 = '25ddbd2af0c08ffac804e2956e18934d17fd91364f07f43e7e3f8e396fde84fe';
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');
$nyckel = (string)($_GET['nyckel'] ?? '');
if ($nyckel === '' || !hash_equals(NYCKEL_SHA256, hash('sha256', $nyckel))) { http_response_code(404); exit('Sidan finns inte.'); }

$manad = preg_match('/^\d{4}-\d{2}$/', $_GET['m'] ?? '') ? $_GET['m'] : date('Y-m');
$fil = __DIR__ . '/data/stat-' . $manad . '.json';
$d = is_file($fil) ? (json_decode(file_get_contents($fil), true) ?: []) : [];
$filer = glob(__DIR__ . '/data/stat-*.json') ?: []; rsort($filer);
$dagar = $d['dagar'] ?? []; krsort($dagar);
$H = ['visa' => 'Sidvisningar', 'utlank' => 'Klick till erbjudanden', 'kontakt-annons' => 'Klick till annonsen', 'kontaktruta' => 'Öppnade kontakt', 'kontakt-ring' => 'Ringde', 'kontakt-sms' => 'Sms', 'kontakt-mejl' => 'Mejl', 'kontakt-skickat' => 'Förfrågan skickad', 'sparad' => 'Sparade bilar'];
$sum = array_fill_keys(array_keys($H), 0);
foreach ($dagar as $v) foreach ($sum as $k => $_) $sum[$k] += $v[$k] ?? 0;
$idag = $dagar[date('Y-m-d')] ?? [];
$sidor = $d['sidor'] ?? []; arsort($sidor);
$bilar = [];
foreach (($d['bilar'] ?? []) as $hand => $lista) foreach ($lista as $b => $x) $bilar[$b] = ($bilar[$b] ?? 0) + $x;
arsort($bilar);
$salj = $d['saljare'] ?? [];
$tot = fn($v) => array_sum(array_map('intval', $v));
uasort($salj, fn($a, $b) => $tot($b) <=> $tot($a));
$h = fn($t) => htmlspecialchars((string)$t, ENT_QUOTES);
$n = fn($x) => number_format((int)$x, 0, ',', ' ');
$q = '?nyckel=' . rawurlencode($nyckel);
$max = max(array_merge([1], array_map(fn($v) => (int)($v['visa'] ?? 0), array_values($dagar))));
?><!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Statistik – Jämföra Privatleasing</title>
<style>body{font-family:system-ui,sans-serif;margin:0;background:#F5F7FA;color:#0E2A47}header{background:#0E2A47;color:#fff;padding:18px 16px}header b{letter-spacing:.3em}main{max-width:820px;margin:0 auto;padding:16px}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.k div{background:#fff;border-radius:12px;padding:12px}.k b{display:block;font-size:26px}.k small{color:#5B6478}.k i{font-style:normal;font-size:12px;color:#5B6478}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin:8px 0 22px}td,th{padding:8px 10px;border-bottom:1px solid #E3E7EE;text-align:left;font-size:14px}th{background:#E3F4F1}td.r,th.r{text-align:right}
.stapel{display:inline-block;height:8px;background:#2BB3A0;border-radius:4px;vertical-align:middle;margin-left:6px}
h2{font-size:18px;margin:22px 0 4px}nav a{margin-right:10px;color:#0E2A47}@media(max-width:600px){.k{grid-template-columns:1fr 1fr}}</style></head><body>
<header><b>JÄMFÖRA</b> PRIVATLEASING · statistik <?= $h($manad) ?></header><main>
<nav><?php foreach ($filer as $f) { $m = substr(basename($f), 5, 7); echo '<a href="' . $q . '&m=' . $h($m) . '">' . $h($m) . '</a>'; } ?></nav>
<div class="k" style="margin-top:12px">
<div><small>Sidvisningar</small><b><?= $n($sum['visa']) ?></b><i>i dag <?= $n($idag['visa'] ?? 0) ?></i></div>
<div><small>Klick till erbjudanden</small><b><?= $n($sum['utlank'] + $sum['kontakt-annons']) ?></b><i>i dag <?= $n(($idag['utlank'] ?? 0) + ($idag['kontakt-annons'] ?? 0)) ?></i></div>
<div><small>Kontakt med säljare</small><b><?= $n($sum['kontakt-ring'] + $sum['kontakt-sms'] + $sum['kontakt-mejl'] + $sum['kontakt-skickat']) ?></b><i>ring, sms, mejl, förfrågan</i></div>
<div><small>Sparade bilar</small><b><?= $n($sum['sparad']) ?></b><i>i dag <?= $n($idag['sparad'] ?? 0) ?></i></div>
</div>
<h2>Per dag</h2>
<div style="overflow-x:auto"><table><tr><th>Dag</th><th class="r">Visningar</th><th class="r">Klick</th><th class="r">Kontakt</th></tr>
<?php foreach ($dagar as $dag => $v): $vis = $v['visa'] ?? 0; ?><tr><td><?= $h($dag) ?></td><td class="r"><?= $n($vis) ?><span class="stapel" style="width:<?= round(60 * $vis / $max) ?>px"></span></td><td class="r"><?= $n(($v['utlank'] ?? 0) + ($v['kontakt-annons'] ?? 0)) ?></td><td class="r"><?= $n(($v['kontakt-ring'] ?? 0) + ($v['kontakt-sms'] ?? 0) + ($v['kontakt-mejl'] ?? 0) + ($v['kontakt-skickat'] ?? 0)) ?></td></tr><?php endforeach; if (!$dagar) echo '<tr><td colspan="4">Inget räknat den här månaden ännu.</td></tr>'; ?></table></div>
<h2>Mest besökta sidor</h2>
<table><tr><th>Sida</th><th class="r">Visningar</th></tr><?php foreach (array_slice($sidor, 0, 25, true) as $s => $x): ?><tr><td><?= $h($s) ?></td><td class="r"><?= $n($x) ?></td></tr><?php endforeach; if (!$sidor) echo '<tr><td colspan="2">–</td></tr>'; ?></table>
<h2>Bilar som fått klick</h2>
<table><tr><th>Bil</th><th class="r">Klick och kontakter</th></tr><?php foreach (array_slice($bilar, 0, 25, true) as $b => $x): ?><tr><td><?= $h($b) ?></td><td class="r"><?= $n($x) ?></td></tr><?php endforeach; if (!$bilar) echo '<tr><td colspan="2">–</td></tr>'; ?></table>
<h2>Per säljare</h2>
<div style="overflow-x:auto"><table><tr><th>Säljare</th><th class="r">Klick</th><th class="r">Öppnade kontakt</th><th class="r">Ringde</th><th class="r">Mejl/sms</th><th class="r">Förfrågan</th></tr>
<?php foreach (array_slice($salj, 0, 60, true) as $s => $v): ?><tr><td><?= $h($s) ?></td><td class="r"><?= $n(($v['utlank'] ?? 0) + ($v['kontakt-annons'] ?? 0)) ?></td><td class="r"><?= $n($v['kontaktruta'] ?? 0) ?></td><td class="r"><?= $n($v['kontakt-ring'] ?? 0) ?></td><td class="r"><?= $n(($v['kontakt-mejl'] ?? 0) + ($v['kontakt-sms'] ?? 0)) ?></td><td class="r"><?= $n($v['kontakt-skickat'] ?? 0) ?></td></tr><?php endforeach; if (!$salj) echo '<tr><td colspan="6">Inga ännu.</td></tr>'; ?></table></div>
<p style="color:#5B6478;font-size:13px">Räknas av sajten själv, utan kakor och utan IP-adresser. Sökrobotar räknas inte. Google Analytics räknar bara besökare som godkänt kakor, så siffrorna där blir lägre.</p></main></body></html>
