<?php
// Jämföra Privatleasing – prisbevakning och nyhetsbrev.
//  POST epost, mkey, namn, pris[, nyhetsbrev]  -> sparar en obekräftad bevakning och mejlar en bekräftelselänk (dubbel opt-in)
//  GET  ?b=<kod>   -> bekräftar bevakningen        GET ?a=<kod> -> avslutar den och raderar e-postadressen
//  GET  ?kor=1     -> högst en gång per dygn: jämför dagens lägsta pris (prishistorik.js) med bevakningarna och mejlar vid prissänkning
// Adresserna sparas i data/bevakning.json (mappen är stängd för besökare) och används bara till detta.
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');
const FRAN = 'kontakt@jamforprivatleasing.se';
const SAJT = 'https://jamforprivatleasing.se/';
const MAX_PER_TIMME = 60;      // nya bevakningar per timme för hela sidan (skydd mot missbruk)
const MAX_PER_ADRESS = 10;     // bevakningar per e-postadress

$mapp = __DIR__ . '/data';
if (!is_dir($mapp)) { @mkdir($mapp, 0750, true); @file_put_contents($mapp . '/.htaccess', "Require all denied\nDeny from all\n"); }
$fil = $mapp . '/bevakning.json';

function mejl($till, $amne, $text) {
  $h = ['From: =?UTF-8?B?' . base64_encode('Jämföra Privatleasing') . '?= <' . FRAN . '>', 'Reply-To: ' . FRAN, 'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', 'List-Unsubscribe: <' . SAJT . 'bevaka.php?a=' . ($GLOBALS['avkod'] ?? '') . '>'];
  if (getenv('JP_TEST')) { file_put_contents(getenv('JP_TEST'), "TILL: $till\nÄMNE: $amne\n$text\n-----\n", FILE_APPEND); return true; }
  return @mail($till, '=?UTF-8?B?' . base64_encode($amne) . '?=', $text, implode("\r\n", $h), '-f' . FRAN);
}
function med_data($fil, $fn) {      // läser, låter $fn ändra och skriver tillbaka under lås
  $fp = fopen($fil, 'c+'); if (!$fp) return null;
  flock($fp, LOCK_EX);
  $d = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
  $d += ['bev' => [], 'timme' => [], 'kord' => ''];
  $svar = $fn($d);
  ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($d, JSON_UNESCAPED_UNICODE)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  return $svar;
}
function kr($n) { return number_format($n, 0, ',', ' ') . ' kr'; }
function sida($rubrik, $text) {
  header('Content-Type: text/html; charset=utf-8');
  echo '<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>' . htmlspecialchars($rubrik) . ' | Jämföra Privatleasing</title>'
     . '<style>body{font-family:system-ui,sans-serif;background:#0B1522;color:#E6EDF5;margin:0;padding:40px 20px;line-height:1.55}main{max-width:520px;margin:auto;background:#12202F;border-radius:16px;padding:28px}h1{font-size:24px;margin:0 0 10px}a{color:#8FE3DA}</style></head>'
     . '<body><main><h1>' . htmlspecialchars($rubrik) . '</h1><p>' . $text . '</p><p><a href="' . SAJT . '">Till Jämföra Privatleasing →</a></p></main></body></html>';
  exit;
}
function priser() {                // lägsta faktiska månadskostnad per modell i dag, ur prishistorik.js
  $s = @file_get_contents(__DIR__ . '/prishistorik.js'); if (!$s) return [];
  $a = strpos($s, '{'); $b = strrpos($s, '}'); if ($a === false || $b === false) return [];
  $d = json_decode(substr($s, $a, $b - $a + 1), true) ?: []; $ut = [];
  foreach ($d as $k => $h) { $sist = end($h); if ($sist) $ut[$k] = (int)$sist[1]; }
  return $ut;
}

// ---------- Bekräfta ----------
if (isset($_GET['b'])) {
  $kod = preg_replace('/[^a-f0-9]/', '', $_GET['b']);
  $b = med_data($fil, function (&$d) use ($kod) { foreach ($d['bev'] as &$x) if ($kod !== '' && hash_equals($x['kod'], $kod)) { $x['ok'] = time(); return $x; } return null; });
  if (!$b) sida('Länken gäller inte längre', 'Bevakningen hittades inte. Den kan redan vara avslutad, eller så har länken hunnit bli för gammal. Du kan starta en ny bevakning på bilens sida.');
  sida('Bevakningen är igång', 'Vi mejlar dig när det billigaste erbjudandet på <b>' . htmlspecialchars($b['namn']) . '</b> blir lägre än ' . kr($b['pris']) . '/mån. Du kan avsluta när du vill via länken i varje mejl.');
}
// ---------- Avsluta ----------
if (isset($_GET['a'])) {
  $kod = preg_replace('/[^a-f0-9]/', '', $_GET['a']);
  $n = med_data($fil, function (&$d) use ($kod) {
    $epost = null; foreach ($d['bev'] as $x) if ($kod !== '' && hash_equals($x['av'], $kod)) $epost = $x['epost'];
    if ($epost === null) return 0;
    $fore = count($d['bev']); $alla = isset($_GET['alla']);
    $d['bev'] = array_values(array_filter($d['bev'], fn($x) => $alla ? $x['epost'] !== $epost : !hash_equals($x['av'], $kod)));
    return $fore - count($d['bev']);
  });
  sida($n ? 'Bevakningen är avslutad' : 'Redan avslutad', $n ? 'Vi har tagit bort bevakningen och mejlar dig inte mer om den. Finns inga andra bevakningar kvar är din e-postadress raderad hos oss.' : 'Den här bevakningen finns inte kvar hos oss.');
}
// ---------- Daglig körning ----------
if (isset($_GET['kor'])) {
  header('Content-Type: application/json');
  $pris = priser(); $idag = date('Y-m-d'); $skicka = [];
  med_data($fil, function (&$d) use ($pris, $idag, &$skicka) {
    if ($d['kord'] === $idag || !$pris) return;
    $d['kord'] = $idag; $nu = time();
    // städa: obekräftade efter 7 dagar, bekräftade efter 12 månader
    $d['bev'] = array_values(array_filter($d['bev'], fn($x) => $x['ok'] ? $nu - $x['ok'] < 365 * 86400 : $nu - $x['t'] < 7 * 86400));
    foreach ($d['bev'] as &$x) {
      if (!$x['ok'] || !isset($pris[$x['mkey']])) continue;
      $p = $pris[$x['mkey']];
      if ($p < $x['pris']) { $skicka[] = [$x, $p]; $x['pris'] = $p; }
      elseif ($p > $x['pris'] && !empty($x['folj'])) $x['pris'] = $x['pris'];   // priset gick upp: behåll kundens nivå, mejla bara när det blir lägre än den
    }
  });
  foreach ($skicka as [$x, $p]) {
    $GLOBALS['avkod'] = $x['av'];
    mejl($x['epost'], 'Prissänkning: ' . $x['namn'] . ' nu från ' . kr($p) . '/mån',
      "Hej!\n\nDet billigaste erbjudandet på {$x['namn']} har blivit lägre: nu från " . kr($p) . "/mån i faktisk kostnad (förut " . kr($x['pris']) . "/mån), med insats och avgifter inräknade.\n\n"
      . "Se alla erbjudanden: " . SAJT . "privatleasing-{$x['mkey']}.html\n\nPriser ändras ofta – kontrollera alltid priset hos säljaren.\n\n"
      . "Avsluta den här bevakningen: " . SAJT . "bevaka.php?a={$x['av']}\nAvsluta alla dina bevakningar: " . SAJT . "bevaka.php?a={$x['av']}&alla=1\n\nJämföra Privatleasing");
  }
  echo json_encode(['ok' => true, 'mejl' => count($skicka)]); exit;
}
// ---------- Ny bevakning ----------
header('Content-Type: application/json; charset=utf-8');
function svar($ok, $text) { echo json_encode(['success' => $ok, 'message' => $text], JSON_UNESCAPED_UNICODE); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') svar(false, 'Fel anrop.');
if (($_POST['webbplats'] ?? '') !== '') svar(true, 'Tack!');                                 // dolt fält som bara robotar fyller i
$epost = strtolower(trim($_POST['epost'] ?? ''));
$mkey = preg_replace('/[^a-z0-9\-]/', '', $_POST['mkey'] ?? '');
if (!filter_var($epost, FILTER_VALIDATE_EMAIL) || strlen($epost) > 120 || preg_match('/[\r\n,;]/', $epost)) svar(false, 'Skriv en giltig e-postadress.');
if (($_POST['samtycke'] ?? '') !== '1') svar(false, 'Kryssa i att du vill ha mejl om prisändringar.');
$pris = priser();
if ($mkey === '' || !isset($pris[$mkey])) svar(false, 'Bilen hittades inte. Ladda om sidan och försök igen.');
$namn = mb_substr(preg_replace('/[^\p{L}\p{N} \-\.\+]/u', '', $_POST['namn'] ?? $mkey), 0, 60);
$nyhet = ($_POST['nyhetsbrev'] ?? '') === '1';
$ny = ['epost' => $epost, 'mkey' => $mkey, 'namn' => $namn, 'pris' => $pris[$mkey], 'nyhet' => $nyhet, 'kod' => bin2hex(random_bytes(16)), 'av' => bin2hex(random_bytes(16)), 't' => time(), 'ok' => 0];
$res = med_data($fil, function (&$d) use ($ny) {
  $h = date('Y-m-d H'); $d['timme'] = [$h => ($d['timme'][$h] ?? 0) + 1];
  if ($d['timme'][$h] > MAX_PER_TIMME) return 'full';
  $egna = array_filter($d['bev'], fn($x) => $x['epost'] === $ny['epost']);
  foreach ($egna as $x) if ($x['mkey'] === $ny['mkey']) return $x['ok'] ? 'finns' : 'vantar';
  if (count($egna) >= MAX_PER_ADRESS) return 'max';
  $d['bev'][] = $ny; return 'ny';
});
if ($res === 'full') svar(false, 'Många bevakar just nu. Försök igen om en stund.');
if ($res === 'max') svar(false, 'Du har redan ' . MAX_PER_ADRESS . ' bevakningar. Avsluta någon via länken i ett av våra mejl.');
if ($res === 'ny') {
  $GLOBALS['avkod'] = $ny['av'];
  mejl($epost, 'Bekräfta din prisbevakning av ' . $namn,
    "Hej!\n\nNågon – förhoppningsvis du – vill bevaka priset på $namn hos Jämföra Privatleasing. Just nu kostar det billigaste erbjudandet " . kr($ny['pris']) . "/mån i faktisk kostnad.\n\n"
    . "Bekräfta bevakningen här:\n" . SAJT . "bevaka.php?b={$ny['kod']}\n\nVar det inte du? Då behöver du inte göra något – adressen raderas automatiskt inom 7 dagar.\n\nJämföra Privatleasing");
}
// Samma svar oavsett om adressen redan fanns, så att ingen kan ta reda på vem som bevakar vad
svar(true, 'Nästan klart! Vi har skickat ett mejl till dig – tryck på länken i det för att starta bevakningen.');
