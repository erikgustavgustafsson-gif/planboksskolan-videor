<?php
// Jämföra Privatleasing – kontakter och klick per säljare. Öppna: saljarstatistik.php?nyckel=DIN_NYCKEL
// Nyckeln står bara i statistik.php på servern (som inte finns i det publika repot) och läses därifrån.
preg_match("/NYCKEL\s*=\s*'([A-Za-z0-9]+)'/", (string)@file_get_contents(__DIR__ . '/statistik.php'), $_m);
define('NYCKEL', $_m[1] ?? '');
header('X-Robots-Tag: noindex');
if (NYCKEL === '' || !hash_equals(NYCKEL, $_GET['nyckel'] ?? '')) { http_response_code(404); exit('Sidan finns inte.'); }

$manad = preg_match('/^\d{4}-\d{2}$/', $_GET['m'] ?? '') ? $_GET['m'] : date('Y-m');
$fil = __DIR__ . '/data/stat-' . $manad . '.json';
$d = is_file($fil) ? (json_decode(file_get_contents($fil), true) ?: []) : [];
$dagar = $d['dagar'] ?? []; krsort($dagar);
$sum = ['visa' => 0, 'konf' => 0, 'bestall' => 0, 'utlank' => 0];
foreach ($dagar as $v) foreach ($sum as $k => $_) $sum[$k] += $v[$k] ?? 0;
$sidor = $d['sidor'] ?? []; arsort($sidor);
$bestBilar = $d['bilar']['bestall'] ?? []; arsort($bestBilar);
$konfBilar = $d['bilar']['konf'] ?? []; arsort($konfBilar);
$filer = glob(__DIR__ . '/data/stat-*.json') ?: []; rsort($filer);
// Per säljare – sorterat på hur mycket de har fått ut av sajten
$salj = $d['saljare'] ?? [];
$vikt = fn($v) => ($v['kontakt-skickat'] ?? 0) * 10 + ($v['kontakt-ring'] ?? 0) * 5 + ($v['kontakt-mejl'] ?? 0) * 5 + ($v['kontakt-sms'] ?? 0) * 5 + ($v['utlank'] ?? 0) + ($v['kontakt-annons'] ?? 0) + ($v['kontaktruta'] ?? 0);
uasort($salj, fn($a, $b) => $vikt($b) <=> $vikt($a));
$ks = ['kontaktruta' => 0, 'kontakt-skickat' => 0, 'kontakt-ring' => 0, 'mejlsms' => 0];
foreach ($dagar as $v) { $ks['kontaktruta'] += $v['kontaktruta'] ?? 0; $ks['kontakt-skickat'] += $v['kontakt-skickat'] ?? 0; $ks['kontakt-ring'] += $v['kontakt-ring'] ?? 0; $ks['mejlsms'] += ($v['kontakt-mejl'] ?? 0) + ($v['kontakt-sms'] ?? 0); }
$h = fn($t) => htmlspecialchars((string)$t, ENT_QUOTES);
$n = fn($x) => number_format($x, 0, ',', ' ');
?><!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Per säljare – Jämföra Privatleasing</title>
<style>body{font-family:system-ui,sans-serif;margin:0;background:#F5F7FA;color:#0E2A47}header{background:#0E2A47;color:#fff;padding:18px 16px}header b{letter-spacing:.3em}main{max-width:820px;margin:0 auto;padding:16px}
.k{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.k div{background:#fff;border-radius:12px;padding:12px}.k b{display:block;font-size:26px}.k small{color:#5B6478}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;margin:8px 0 22px}td,th{padding:8px 10px;border-bottom:1px solid #E3E7EE;text-align:left;font-size:14px}th{background:#E3F4F1}td.r,th.r{text-align:right}
h2{font-size:18px;margin:22px 0 4px}nav a{margin-right:10px;color:#0E2A47}@media(max-width:600px){.k{grid-template-columns:1fr 1fr}}</style></head><body>
<header><b>JÄMFÖRA</b> PRIVATLEASING · per säljare <?= $h($manad) ?></header><main>
<nav><?php foreach ($filer as $f) { $m = substr(basename($f), 5, 7); echo '<a href="?nyckel=' . $h(NYCKEL) . '&m=' . $h($m) . '">' . $h($m) . '</a>'; } ?></nav>
<p style="margin:10px 0"><a href="statistik.php?nyckel=<?= $h(NYCKEL) ?>">← Till all statistik</a></p><div class="k" style="margin-top:10px"><div><small>Öppnade "Kontakta säljaren"</small><b><?= $n($ks['kontaktruta']) ?></b></div><div><small>Förfrågningar skickade via sajten</small><b><?= $n($ks['kontakt-skickat']) ?></b></div><div><small>Ringde säljaren</small><b><?= $n($ks['kontakt-ring']) ?></b></div><div><small>Mejl eller sms till säljaren</small><b><?= $n($ks['mejlsms']) ?></b></div></div>
<h2>Per säljare</h2><p style="margin:0 0 6px;color:#5B6478;font-size:13px">Det här kan du visa för en handlare: hur många kunder sajten har skickat till dem den här månaden.</p>
<div style="overflow-x:auto"><table><tr><th>Säljare</th><th class="r">Klick till annonsen</th><th class="r">Öppnade kontakt</th><th class="r">Ringde</th><th class="r">Mejl/sms</th><th class="r">Skickade via sajten</th></tr>
<?php foreach (array_slice($salj, 0, 60, true) as $s => $v): ?><tr><td><?= $h($s) ?></td><td class="r"><?= $n(($v['utlank'] ?? 0) + ($v['kontakt-annons'] ?? 0)) ?></td><td class="r"><?= $n($v['kontaktruta'] ?? 0) ?></td><td class="r"><?= $n($v['kontakt-ring'] ?? 0) ?></td><td class="r"><?= $n(($v['kontakt-mejl'] ?? 0) + ($v['kontakt-sms'] ?? 0)) ?></td><td class="r"><?= $n($v['kontakt-skickat'] ?? 0) ?></td></tr><?php endforeach; if (!$salj) echo '<tr><td colspan="6">Inga ännu – räknas från och med att den här versionen lades ut.</td></tr>'; ?></table></div>
<p style="color:#5B6478;font-size:13px">Räknas utan kakor och utan IP-adresser. Sökrobotar räknas inte.</p></main></body></html>
