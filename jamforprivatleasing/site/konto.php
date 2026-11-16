<?php
// Jämföra Privatleasing – konto (Mina sidor). Inga lösenord: man loggar in med en länk som mejlas.
//  POST a=lank   {epost}            -> mejlar en inloggningslänk (gäller 20 minuter, en gång)
//  GET  a=in&t=  (länken i mejlet)  -> sida med knappen "Logga in" (så att e-postprogram som förhandsgranskar länkar inte förbrukar den)
//  POST a=in     {t}                -> loggar in: sätter kakan jp_sess och skickar vidare till Mina sidor
//  GET  a=jag                       -> {inloggad, epost, namn, telefon, sparade, kontakter}
//  GET  a=med&p=google|facebook    -> skickar till Google/Facebook för inloggning, som skickar tillbaka till konto.php?code=…&state=…
//  GET/POST a=installning&nyckel=   -> sida där ägaren klistrar in nycklarna från Google och Facebook (samma nyckel som statistiksidan)
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

// Inloggning med Google/Facebook: nycklarna ligger i data-mappen (aldrig i GitHub) och läggs in via a=installning
$inl_fil = $mapp . '/inloggning.json';
function inl() { static $c = null; if ($c === null) { $c = json_decode((string)@file_get_contents($GLOBALS['inl_fil']), true); if (!is_array($c)) $c = []; } return $c; }
function metoder() { $c = inl(); return array_values(array_filter(['google', 'facebook'], fn($p) => !empty($c[$p]['id']) && !empty($c[$p]['hemlig']))); }
const RETUR = SAJT . 'konto.php';
function http_anrop($url, $post = null) {   // svar som array (JSON) eller null
  if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15, CURLOPT_HTTPHEADER => ['Accept: application/json']]);
    if ($post !== null) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post)); }
    $r = curl_exec($ch); curl_close($ch);
  } else {
    $o = ['http' => ['timeout' => 15, 'ignore_errors' => true, 'header' => "Accept: application/json\r\n"]];
    if ($post !== null) { $o['http']['method'] = 'POST'; $o['http']['header'] .= "Content-Type: application/x-www-form-urlencoded\r\n"; $o['http']['content'] = http_build_query($post); }
    $r = @file_get_contents($url, false, stream_context_create($o));
  }
  $d = json_decode((string)$r, true); return is_array($d) ? $d : null;
}
function b64url_av($s) { return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4)); }
function b64url($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }

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
  if ($a !== 'in' && $a !== 'installning' && ($_SERVER['HTTP_X_JP'] ?? '') !== '1') svar(['ok' => false, 'fel' => 'Ogiltigt anrop.'], 403);
}

// Skapar kontot vid behov (samma konto oavsett om man loggar in med e-post, Google eller Facebook – det styrs av e-postadressen)
function logga_in($epost, $namn, $satt) {
  $nu = time(); $id = anv_id($epost);
  med_fil(anv_fil($id), function (&$d) use ($epost, $namn, $nu, $satt) {
    $d += ['epost' => strtolower($epost), 'skapad' => $nu, 'namn' => '', 'telefon' => '', 'sparade' => [], 'kontakter' => []];
    if ($d['namn'] === '' && $namn !== '') $d['namn'] = $namn;
    $d['senast'] = $nu; $d['via'] = $satt;
  });
  $s = bin2hex(random_bytes(32));
  med_fil($GLOBALS['mapp'] . '/sessioner.json', function (&$d) use ($s, $id, $nu) { $d[hash('sha256', $s)] = ['id' => $id, 'skapad' => $nu, 'ut' => $nu + 86400 * SESSION_DAGAR]; });
  satt_kaka($s, 86400 * SESSION_DAGAR);
  header('Location: ' . (getenv('JP_TEST') ? 'mina-sidor.html' : SAJT . 'mina-sidor.html') . '?inloggad=1', true, 303);
  exit;
}
function inl_fel($txt) { sida('Inloggningen avbröts', '<p>' . $txt . '</p><p><a href="' . SAJT . 'mina-sidor.html">Försök igen</a> – eller logga in med en länk till din e-post.</p>'); }

// ---------- Inställningar för Google/Facebook (bara ägaren, med statistiknyckeln) ----------
if ($a === 'installning') {
  preg_match("/NYCKEL\s*=\s*'([A-Za-z0-9]+)'/", (string)@file_get_contents(__DIR__ . '/statistik.php'), $m);
  $nyckel = $m[1] ?? '';
  if ($nyckel === '' || !hash_equals($nyckel, (string)($_GET['nyckel'] ?? $in['nyckel'] ?? ''))) { http_response_code(404); exit('Sidan finns inte.'); }
  $c = inl(); $sparat = false;
  if ($metod === 'POST') {
    foreach (['google', 'facebook'] as $p) {
      $id = trim(ren($in[$p . '_id'] ?? '', 200)); $hm = trim(ren($in[$p . '_hemlig'] ?? '', 200));
      if (!empty($in[$p . '_bort'])) { unset($c[$p]); continue; }
      if ($id !== '') $c[$p]['id'] = $id;
      if ($hm !== '') $c[$p]['hemlig'] = $hm;
    }
    file_put_contents($inl_fil, json_encode($c, JSON_PRETTY_PRINT)); $sparat = true;
  }
  $e = fn($s) => htmlspecialchars((string)$s);
  $rad = function ($p, $namn, $idnamn, $hmnamn) use ($c, $e) {
    $har = !empty($c[$p]['id']) && !empty($c[$p]['hemlig']);
    return '<h2 style="font-size:19px;margin:22px 0 6px">' . $namn . ' ' . ($har ? '✅ påslaget' : '⬜ inte påslaget') . '</h2>'
      . '<label>' . $idnamn . '<input name="' . $p . '_id" value="' . $e($c[$p]['id'] ?? '') . '" autocomplete="off"></label>'
      . '<label>' . $hmnamn . ($har ? ' (sparad – lämna tomt för att behålla)' : '') . '<input name="' . $p . '_hemlig" type="password" autocomplete="off"></label>'
      . ($har ? '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="' . $p . '_bort" value="1" style="width:auto"> Stäng av ' . $namn . '</label>' : '');
  };
  sida('Inloggning med Google och Facebook',
    ($sparat ? '<p style="background:#1E4D3A;padding:10px 12px;border-radius:10px">Sparat ✓</p>' : '')
    . '<p>Adress att klistra in hos Google och Facebook (omdirigerings-URI / Valid OAuth Redirect URI):<br><code style="user-select:all;background:#0B1522;padding:4px 6px;border-radius:6px">' . RETUR . '</code></p>'
    . '<form method="post" action="konto.php?a=installning"><input type="hidden" name="a" value="installning"><input type="hidden" name="nyckel" value="' . $e($nyckel) . '">'
    . '<style>label{display:block;margin:8px 0;font-size:14px;color:#B8C6D6}input{display:block;width:100%;box-sizing:border-box;font:inherit;padding:11px;border-radius:10px;border:1px solid #2A3D52;background:#0B1522;color:#fff;margin-top:4px}</style>'
    . $rad('google', 'Google', 'Klient-ID (Client ID)', 'Klienthemlighet (Client secret)')
    . $rad('facebook', 'Facebook', 'Appens ID (App ID)', 'Apphemlighet (App secret)')
    . '<button type="submit">Spara</button></form>'
    . '<p style="font-size:14px;color:#9FB0C3">Nycklarna sparas i den stängda data-mappen på servern, inte i GitHub. Knapparna på Mina sidor visas automatiskt för det som är påslaget.</p>');
}

// ---------- Logga in med Google/Facebook: skicka iväg ----------
if ($a === 'med' && $metod === 'GET') {
  $p = $_GET['p'] ?? ''; $c = inl();
  if (!in_array($p, metoder(), true)) inl_fel('Den inloggningen är inte påslagen.');
  $state = $p . '.' . bin2hex(random_bytes(16)); $verif = b64url(random_bytes(32)); $nonce = bin2hex(random_bytes(12));
  setcookie('jp_oauth', $state . '.' . $verif . '.' . $nonce, ['expires' => time() + 900, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax']);
  if ($p === 'google') {
    $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query(['client_id' => $c['google']['id'], 'redirect_uri' => RETUR, 'response_type' => 'code',
      'scope' => 'openid email profile', 'state' => $state, 'nonce' => $nonce, 'prompt' => 'select_account',
      'code_challenge' => b64url(hash('sha256', $verif, true)), 'code_challenge_method' => 'S256']);
  } else {
    $url = 'https://www.facebook.com/v19.0/dialog/oauth?' . http_build_query(['client_id' => $c['facebook']['id'], 'redirect_uri' => RETUR, 'response_type' => 'code',
      'scope' => 'email,public_profile', 'state' => $state]);
  }
  header('Location: ' . $url, true, 302); exit;
}

// ---------- Tillbaka från Google/Facebook ----------
if ($a === '' && $metod === 'GET' && isset($_GET['state'])) {
  $kaka = explode('.', (string)($_COOKIE['jp_oauth'] ?? ''));
  setcookie('jp_oauth', '', ['expires' => time() - 3600, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax']);
  $state = (string)$_GET['state']; $p = explode('.', $state)[0];
  if (count($kaka) !== 4 || !hash_equals($kaka[0] . '.' . $kaka[1], $state) || !in_array($p, metoder(), true)) inl_fel('Inloggningen hann bli för gammal eller startades i en annan webbläsare.');
  if (isset($_GET['error']) || empty($_GET['code'])) inl_fel('Du avbröt inloggningen.');
  $c = inl()[$p]; $kod = (string)$_GET['code']; $epost = ''; $namn = '';
  if ($p === 'google') {
    $t = http_anrop('https://oauth2.googleapis.com/token', ['code' => $kod, 'client_id' => $c['id'], 'client_secret' => $c['hemlig'], 'redirect_uri' => RETUR,
      'grant_type' => 'authorization_code', 'code_verifier' => $kaka[2]]);
    $delar = explode('.', (string)($t['id_token'] ?? ''));
    $idt = count($delar) === 3 ? json_decode((string)b64url_av($delar[1]), true) : null;   // hämtad direkt från Google över https
    if (!is_array($idt) || ($idt['aud'] ?? '') !== $c['id'] || !in_array($idt['iss'] ?? '', ['https://accounts.google.com', 'accounts.google.com'], true)
        || ($idt['exp'] ?? 0) < time() || ($idt['nonce'] ?? '') !== $kaka[3]) inl_fel('Google kunde inte bekräfta inloggningen.');
    if (empty($idt['email']) || empty($idt['email_verified'])) inl_fel('Ditt Google-konto har ingen bekräftad e-postadress.');
    $epost = $idt['email']; $namn = $idt['name'] ?? '';
  } else {
    $t = http_anrop('https://graph.facebook.com/v19.0/oauth/access_token?' . http_build_query(['client_id' => $c['id'], 'client_secret' => $c['hemlig'], 'redirect_uri' => RETUR, 'code' => $kod]));
    if (empty($t['access_token'])) inl_fel('Facebook kunde inte bekräfta inloggningen.');
    $bevis = hash_hmac('sha256', $t['access_token'], $c['hemlig']);
    $me = http_anrop('https://graph.facebook.com/v19.0/me?' . http_build_query(['fields' => 'id,name,email', 'access_token' => $t['access_token'], 'appsecret_proof' => $bevis]));
    if (empty($me['email'])) inl_fel('Facebook gav oss ingen e-postadress (det händer om ditt Facebook-konto är skapat med telefonnummer). Logga in med en länk till din e-post i stället.');
    $epost = $me['email']; $namn = $me['name'] ?? '';
  }
  $epost = strtolower(ren($epost, 120));
  if (!filter_var($epost, FILTER_VALIDATE_EMAIL)) inl_fel('Vi fick ingen giltig e-postadress.');
  logga_in($epost, ren($namn, 80), $p);
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
  logga_in($l['epost'], '', 'epost');
}

// ---------- Allt nedan kräver inloggning ----------
$s = session();
if ($a === 'jag') {
  if (!$s) svar(['inloggad' => false, 'metoder' => metoder()]);
  $u = las_anv($s['id']);
  svar(['inloggad' => true, 'epost' => $u['epost'], 'namn' => $u['namn'] ?? '', 'telefon' => $u['telefon'] ?? '', 'sparade' => $u['sparade'] ?? [], 'kontakter' => array_reverse($u['kontakter'] ?? [])]);
}
if ($metod !== 'POST') { if ($a === '') { header('Location: ' . SAJT . 'mina-sidor.html', true, 302); exit; } svar(['ok' => false, 'fel' => 'Okänt anrop.'], 400); }
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
