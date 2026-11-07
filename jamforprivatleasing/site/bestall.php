<?php
// Jämföra Privatleasing – tar emot beställningar och intresseförfrågningar från sidan och skickar dem som e-post.
// Mottagare bestäms ALLTID här på servern (aldrig av webbläsaren), så skriptet kan inte användas för att skicka spam till andra.
// Inga uppgifter sparas på servern – de finns bara i e-posten.
header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

const TILL = 'bestallning@jamforprivatleasing.se';
const FRAN = 'bestallning@jamforprivatleasing.se';
const MAX_PER_TIMME = 40;          // skydd mot missbruk (räknas för hela sidan, inga IP-adresser sparas)
// Handlare som får beställningen direkt (kopia går alltid till TILL). Nyckel = handlar-id som sidan skickar.
const HANDLARE = [
  // 'rejmes' => 'privatleasing@rejmes.se',
];

function svar($ok, $fel = '') { echo json_encode(['success' => $ok, 'message' => $fel]); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); svar(false, 'Fel metod'); }
$d = json_decode(file_get_contents('php://input'), true);
if (!is_array($d)) svar(false, 'Ogiltig data');

// Fällor för robotar: ett dolt fält som ska vara tomt, och formuläret ska ha varit öppet en stund
if (!empty($d['webbplats'])) svar(true);
if (isset($d['oppnad']) && (time() * 1000 - (int)$d['oppnad']) < 4000) svar(false, 'För snabbt – försök igen');

// Begränsa antal per timme
$dir = __DIR__ . '/data';
if (!is_dir($dir)) { mkdir($dir, 0755, true); file_put_contents("$dir/.htaccess", "Require all denied\n"); }
$rf = "$dir/bestall-" . date('YmdH') . '.txt';
$antal = (int)@file_get_contents($rf);
if ($antal >= MAX_PER_TIMME) svar(false, 'Många beställningar just nu – försök igen om en stund');
file_put_contents($rf, $antal + 1, LOCK_EX);
foreach (glob("$dir/bestall-*.txt") as $g) if (filemtime($g) < time() - 7200) @unlink($g);

$ren = fn($s, $max = 300) => trim(mb_substr(str_replace(["\r", "\0"], '', (string)$s), 0, $max));
$enrad = fn($s, $max = 200) => preg_replace('/[\r\n]+/', ' ', $ren($s, $max));
$typ = $d['typ'] ?? 'bestallning';
$namn = $enrad($d['namn'] ?? '', 100);
$epost = filter_var($enrad($d['epost'] ?? '', 150), FILTER_VALIDATE_EMAIL);
$tel = $enrad($d['tel'] ?? '', 40);
if (!$namn || !$epost) svar(false, 'Namn och giltig e-post krävs');
if (empty($d['samtycke'])) svar(false, 'Godkännande saknas');

$bil = $enrad($d['bil'] ?? '', 150);
$text = $ren($d['text'] ?? '', 6000);
$amne = $typ === 'intresse' ? "Intresseförfrågan: $bil – $namn" : "Ny beställning: $bil – $namn";

function skicka_mejl($till, $amne, $text, $svaraTill, $kopia = '') {
  $h = [
    'From: =?UTF-8?B?' . base64_encode('Jämföra Privatleasing') . '?= <' . FRAN . '>',
    'Reply-To: ' . $svaraTill,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
  ];
  if ($kopia) $h[] = 'Cc: ' . $kopia;
  return mail($till, '=?UTF-8?B?' . base64_encode($amne) . '?=', $text, implode("\r\n", $h), '-f' . FRAN);
}

$handlare = HANDLARE[$d['handlare'] ?? ''] ?? '';
$till = $handlare ?: TILL;
$kopia = $handlare ? TILL : '';
$intern = $text . "\n\n---\nSkickat via jamforprivatleasing.se " . date('Y-m-d H:i') . "\nKunden har godkänt att uppgifterna skickas till handlaren.";
if (!skicka_mejl($till, $amne, $intern, $epost, $kopia)) svar(false, 'E-posten kunde inte skickas');

// Bekräftelse till kunden (fast text + kundens egen beställning)
if ($typ === 'intresse') {
  $bekr = "Hej $namn!\n\nTack för din förfrågan till Jämföra Privatleasing. Vi hör av oss när vi hittar ett bra erbjudande på $bil.\n\nVänliga hälsningar\nJämföra Privatleasing\nhttps://jamforprivatleasing.se";
} else {
  $bekr = "Hej $namn!\n\nTack för din beställning via Jämföra Privatleasing. Vi har skickat den till handlaren, som skickar leasingavtalet till dig. Du godkänner det med BankID – inget är bindande förrän du har signerat.\n\nDin beställning:\n\n$text\n\nFrågor? Svara på det här mejlet.\n\nVänliga hälsningar\nJämföra Privatleasing\nhttps://jamforprivatleasing.se";
}
skicka_mejl($epost, $typ === 'intresse' ? 'Tack för din förfrågan' : "Din beställning: $bil", $bekr, TILL);
svar(true);
