<?php
// Jämföra Privatleasing – konto (Mina sidor). Inga lösenord: man loggar in med en länk som mejlas.
//  POST a=lank   {epost}            -> mejlar en inloggningslänk (gäller 20 minuter, en gång)
//  GET  a=in&t=  (länken i mejlet)  -> sida med knappen "Logga in" (så att e-postprogram som förhandsgranskar länkar inte förbrukar den)
//  POST a=in     {t}                -> loggar in: sätter kakan jp_sess och skickar vidare till Mina sidor
//  GET  a=jag                       -> {inloggad, epost, namn, telefon, sparade, kontakter}
//  POST a=uppgifter {namn, telefon} · a=spara {mkey, av} · a=sparalista {mkeys} · a=kontakt {...} · a=ut · a=radera
// Allt sparas i data/konto/ (mappen är stängd för besökare). Inget av detta finns i det publika GitHub-repot förutom den här koden.
header('X-Robots-Tag: noindex');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
const FRAN = 'kontakt@jamforprivatleasing.se';
const SAJT = 'https://jamforprivatleasing.se/';
const LANK_MINUTER = 20;
const SESSION_DAGAR = 180;
const INAKTIV_DAGAR = 730;        // konton som inte använts på två år raderas
const MAX_KONTAKTER = 200;
const MAX_SPARADE = 100;

// Mappen får ett slumpat namn första gången (extra skydd om .htaccess någon gång inte skulle gälla)
$mapp = (glob(__DIR__ . '/data/konto-*', GLOB_ONLYDIR) ?: [null])[0] ?? (__DIR__ . '/data/konto-' . bin2hex(random_bytes(12)));
if (!is_dir($mapp . '/anv')) { @mkdir($mapp . '/anv', 0750, true); }
foreach ([__DIR__ . '/data', $mapp] as $m) if (!file_exists($m . '/.htaccess')) @file_put_contents($m . '/.htaccess', "Require all denied\nDeny from all\n");
$hemlig_fil = $mapp . '/hemlig.txt';
if (!file_exists($hemlig_fil)) @file_put_contents($hemlig_fil, bin2hex(random_bytes(32)));
define('HEMLIG', trim((string)@file_get_contents($hemlig_fil)));

function svar($d, $kod = 200) { http_response_code($kod); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
function mejl($till, $amne, $text) {
  $h = ['From: =?UTF-8?B?' . base64_encode('Jämföra Privatleasing') . '?= <' . FRAN . '>', 'Reply-To: ' . FRAN, 'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', 'Auto-Submitted: auto-generated'];
  if (getenv('JP_TEST')) { file_put_contents(getenv('JP_TEST'), "TILL: $till\nÄMNE: $amne\n$text\n-----\n", FILE_APPEND); return true; }
  return @mail($till, '=?UTF-8?B?' . base64_encode($amne) . '?=', $text, implode("\r\n", $h), '-f' . FRAN);
}
function med_fil($fil, $fn, $tom = []) {      // läser JSON, låter $fn ändra och skriver tillbaka under lås
  $fp = @fopen($fil, 'c+'); if (!$fp) svar(['ok' => false, 'fel' => 'Det gick inte att spara just nu.'], 500);
  flock($fp, LOCK_EX);
  $d = json_decode(stream_get_contents($fp) ?: '', true); if (!is_array($d)) $d = $tom;
  $r = $fn($d);
  ftruncate($fp, 0); rewind($fp); fwrite($fp, json_encode($d, JSON_UNESCAPED_UNICODE)); fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  return $r;
}
function anv_id($epost) { return substr(hash_hmac('sha256', strtolower(trim($epost)), HEMLIG), 0, 32); }
function anv_fil($id) { return $GLOBALS['mapp'] . '/anv/' . preg_replace('/[^a-f0-9]/', '', $id) . '.json'; }
function ren($s, $max) { $s = trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', (string)$s)); return mb_substr($s, 0, $max); }
function ip_hash() { return substr(hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? '', HEMLIG), 0, 16); }
function https() { return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'); }
function satt_kaka($varde, $sek) {
  setcookie('jp_sess', $varde, ['expires' => $sek ? time() + $sek : time() - 3600, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax']);
}
function sida($rubrik, $html) {
  header('Content-Type: text/html; charset=utf-8');
  echo '<!DOCTYPE html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>'
     . htmlspecialchars($rubrik) . ' – Jämföra Privatleasing</title>'
     . '<style>body{font-family:system-ui,sans-serif;background:#0B1522;color:#E6EDF5;margin:0;padding:40px 20px;line-height:1.55}main{max-width:520px;margin:auto;background:#12202F;border-radius:16px;padding:28px}'
     . 'h1{margin:0 0 10px;font-size:24px}a{color:#8FE3DA}button{font:inherit;font-weight:800;font-size:17px;width:100%;padding:15px;border:0;border-radius:12px;background:#2EC4B6;color:#08202B;cursor:pointer;margin-top:12px}</style></head>'
     . '<body><main><h1>' . htmlspecialchars($rubrik) . '</h1>' . $html . '<p style="margin-top:22px"><a href="' . SAJT . '">Till Jämföra Privatleasing →</a></p></main></body></html>';
  exit;
}
// Inloggad användare utifrån kakan, eller null
function session() {
  $t = preg_replace('/[^a-f0-9]/', '', $_COOKIE['jp_sess'] ?? ''); if (strlen($t) !== 64) return null;
  $h = hash('sha256', $t); $s = null;
  med_fil($GLOBALS['mapp'] . '/sessioner.json', function (&$d) use ($h, &$s) {
    if (isset($d[$h]) && $d[$h]['ut'] > time()) { $s = $d[$h]; if ($s['ut'] - time() < 86400 * (SESSION_DAGAR - 30)) $d[$h]['ut'] = time() + 86400 * SESSION_DAGAR; }
  });
  if (!$s || !file_exists(anv_fil($s['id']))) return null;
  return ['id' => $s['id'], 'h' => $h];
}
function las_anv($id) { $d = json_decode((string)@file_get_contents(anv_fil($id)), true); return is_array($d) ? $d : null; }
function andra_anv($id, $fn) { return med_fil(anv_fil($id), function (&$d) use ($fn) { $d['senast'] = time(); return $fn($d); }); }
function stada() {   // rensar gamla länkar, sessioner och inaktiva konton (körs ibland)
  $nu = time();
  med_fil($GLOBALS['mapp'] . '/lankar.json', function (&$d) use ($nu) { foreach ($d as $k => $x) if (($x['ut'] ?? 0) < $nu) unset($d[$k]); });
  med_fil($GLOBALS['mapp'] . '/sessioner.json', function (&$d) use ($nu) { foreach ($d as $k => $x) if (($x['ut'] ?? 0) < $nu) unset($d[$k]); });
  foreach (glob($GLOBALS['mapp'] . '/anv/*.json') ?: [] as $f) { $a = json_decode((string)@file_get_contents($f), true); if (is_array($a) && ($a['senast'] ?? 0) < $nu - 86400 * INAKTIV_DAGAR) @unlink($f); }
}

$a = $_GET['a'] ?? $_POST['a'] ?? '';
$metod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$in = [];
if ($metod === 'POST') {
  $in = json_decode(file_get_contents('php://input') ?: '', true); if (!is_array($in)) $in = $_POST;
  $a = $in['a'] ?? $a;
  // Skydd mot förfalskade anrop från andra sajter: alla POST utom inloggningsknappen måste ha vårt eget huvud
  if ($a !== 'in' && ($_SERVER['HTTP_X_JP'] ?? '') !== '1') svar(['ok' => false, 'fel' => 'Ogiltigt anrop.'], 403);
}

// ---------- Mejla en inloggningslänk ----------
if ($a === 'lank' && $metod === 'POST') {
  $epost = strtolower(ren($in['epost'] ?? '', 120));
  if (!filter_var($epost, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $epost)) svar(['ok' => false, 'fel' => 'Skriv en giltig e-postadress.'], 400);
  if (mt_rand(1, 50) === 1) stada();
  $ip = ip_hash(); $nu = time();
  $tok = bin2hex(random_bytes(32));
  $ok = med_fil($mapp . '/lankar.json', function (&$d) use ($epost, $ip, $nu, $tok) {
    $perAdress = 0; $perIp = 0; $alla = 0;
    foreach ($d as $x) { if ($x['skapad'] > $nu - 900 && $x['epost'] === $epost) $perAdress++; if ($x['skapad'] > $nu - 3600) { $alla++; if ($x['ip'] === $ip) $perIp++; } }
    if ($perAdress >= 3 || $perIp >= 10 || $alla >= 300) return false;
    $d[hash('sha256', $tok)] = ['epost' => $epost, 'ip' => $ip, 'skapad' => $nu, 'ut' => $nu + 60 * LANK_MINUTER];
    return true;
  });
  if (!$ok) svar(['ok' => false, 'fel' => 'Du har bett om flera länkar på kort tid. Vänta en kvart och försök igen.'], 429);
  $lank = SAJT . 'konto.php?a=in&t=' . $tok;
  mejl($epost, 'Logga in på Jämföra Privatleasing',
    "Hej!\n\nTryck på länken för att logga in på Mina sidor:\n$lank\n\nLänken gäller i " . LANK_MINUTER . " minuter och kan bara användas en gång. "
    . "Finns det inget konto för den här adressen skapas ett när du loggar in.\n\nHar du inte bett om det här kan du strunta i mejlet – inget händer då.\n\nJämföra Privatleasing\n" . SAJT);
  svar(['ok' => true]);
}

// ---------- Länken i mejlet: visa en knapp ----------
if ($a === 'in' && $metod === 'GET') {
  $t = preg_replace('/[^a-f0-9]/', '', $_GET['t'] ?? '');
  sida('Logga in', '<p>Tryck på knappen för att logga in på Mina sidor.</p><form method="post" action="konto.php"><input type="hidden" name="a" value="in"><input type="hidden" name="t" value="' . htmlspecialchars($t) . '"><button type="submit">Logga in</button></form>');
}
// ---------- Logga in ----------
if ($a === 'in' && $metod === 'POST') {
  $t = preg_replace('/[^a-f0-9]/', '', $in['t'] ?? ''); $nu = time();
  $l = strlen($t) === 64 ? med_fil($mapp . '/lankar.json', function (&$d) use ($t, $nu) {
    $h = hash('sha256', $t); $x = $d[$h] ?? null; unset($d[$h]);
    return ($x && $x['ut'] >= $nu) ? $x : null;
  }) : null;
  if (!$l) sida('Länken gäller inte längre', '<p>Inloggningslänken har redan använts eller hunnit bli för gammal. <a href="' . SAJT . 'mina-sidor.html">Be om en ny länk</a>.</p>');
  $id = anv_id($l['epost']);
  med_fil(anv_fil($id), function (&$d) use ($l, $nu) {
    $d += ['epost' => $l['epost'], 'skapad' => $nu, 'namn' => '', 'telefon' => '', 'sparade' => [], 'kontakter' => []];
    $d['senast'] = $nu;
  });
  $s = bin2hex(random_bytes(32));
  med_fil($mapp . '/sessioner.json', function (&$d) use ($s, $id, $nu) { $d[hash('sha256', $s)] = ['id' => $id, 'skapad' => $nu, 'ut' => $nu + 86400 * SESSION_DAGAR]; });
  satt_kaka($s, 86400 * SESSION_DAGAR);
  header('Location: ' . (getenv('JP_TEST') ? 'mina-sidor.html' : SAJT . 'mina-sidor.html') . '?inloggad=1', true, 303);
  exit;
}

// ---------- Allt nedan kräver inloggning ----------
$s = session();
if ($a === 'jag') {
  if (!$s) svar(['inloggad' => false]);
  $u = las_anv($s['id']);
  svar(['inloggad' => true, 'epost' => $u['epost'], 'namn' => $u['namn'] ?? '', 'telefon' => $u['telefon'] ?? '', 'sparade' => $u['sparade'] ?? [], 'kontakter' => array_reverse($u['kontakter'] ?? [])]);
}
if ($metod !== 'POST') svar(['ok' => false, 'fel' => 'Okänt anrop.'], 400);
if (!$s) svar(['ok' => false, 'inloggad' => false, 'fel' => 'Du är inte inloggad.'], 401);

if ($a === 'uppgifter') {
  $namn = ren($in['namn'] ?? '', 80); $tel = preg_replace('/[^\d+\- ]/', '', ren($in['telefon'] ?? '', 20));
  andra_anv($s['id'], function (&$d) use ($namn, $tel) { $d['namn'] = $namn; $d['telefon'] = $tel; });
  svar(['ok' => true]);
}
if ($a === 'spara') {           // spara eller ta bort en modell
  $mk = preg_replace('/[^a-z0-9-]/', '', strtolower($in['mkey'] ?? '')); $pa = !empty($in['pa']);
  if ($mk === '' || strlen($mk) > 80) svar(['ok' => false], 400);
  $l = andra_anv($s['id'], function (&$d) use ($mk, $pa) {
    $d['sparade'] = array_values(array_filter($d['sparade'] ?? [], fn($x) => $x !== $mk));
    if ($pa) array_unshift($d['sparade'], $mk);
    $d['sparade'] = array_slice($d['sparade'], 0, MAX_SPARADE); return $d['sparade'];
  });
  svar(['ok' => true, 'sparade' => $l]);
}
if ($a === 'sparalista') {      // slår ihop bilar som sparats i webbläsaren innan man loggade in
  $nya = array_slice(array_filter(array_map(fn($x) => preg_replace('/[^a-z0-9-]/', '', strtolower((string)$x)), (array)($in['mkeys'] ?? [])), fn($x) => $x !== '' && strlen($x) <= 80), 0, MAX_SPARADE);
  $l = andra_anv($s['id'], function (&$d) use ($nya) { $d['sparade'] = array_slice(array_values(array_unique(array_merge($d['sparade'] ?? [], $nya))), 0, MAX_SPARADE); return $d['sparade']; });
  svar(['ok' => true, 'sparade' => $l]);
}
if ($a === 'kontakt') {         // anteckning i kontakthistoriken (själva samtalet/mejlet/sms:et går från besökarens egen telefon eller e-post)
  $k = ['t' => time(), 'mkey' => preg_replace('/[^a-z0-9-]/', '', strtolower($in['mkey'] ?? '')), 'bil' => ren($in['bil'] ?? '', 120), 'saljare' => ren($in['saljare'] ?? '', 120),
        'satt' => in_array($in['satt'] ?? '', ['ring', 'sms', 'mejl', 'annons'], true) ? $in['satt'] : 'annons', 'pris' => (int)($in['pris'] ?? 0),
        'url' => preg_match('#^https://#', $in['url'] ?? '') ? ren($in['url'], 400) : ''];
  andra_anv($s['id'], function (&$d) use ($k) { $d['kontakter'][] = $k; $d['kontakter'] = array_slice($d['kontakter'], -MAX_KONTAKTER); });
  svar(['ok' => true]);
}
if ($a === 'ut') {
  med_fil($mapp . '/sessioner.json', function (&$d) use ($s) { unset($d[$s['h']]); });
  satt_kaka('', 0); svar(['ok' => true]);
}
if ($a === 'radera') {          // raderar kontot och alla inloggningar direkt
  @unlink(anv_fil($s['id']));
  med_fil($mapp . '/sessioner.json', function (&$d) use ($s) { foreach ($d as $k => $x) if ($x['id'] === $s['id']) unset($d[$k]); });
  satt_kaka('', 0); svar(['ok' => true]);
}
svar(['ok' => false, 'fel' => 'Okänt anrop.'], 400);
