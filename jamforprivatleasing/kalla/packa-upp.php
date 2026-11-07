<?php
// Jämföra Privatleasing – packar upp zip-filen i samma mapp och raderar sig själv efteråt.
header('Content-Type: text/html; charset=utf-8');
$dir = __DIR__;
// Tar den nyaste zip-filen i mappen (mobilen döper ibland om den till t.ex. "jamforprivatleasing (1).zip")
$alla = glob($dir . '/*.zip') ?: [];
usort($alla, function($a, $b) { return filemtime($b) - filemtime($a); });
$zip = $alla ? $alla[0] : $dir . '/jamforprivatleasing.zip';

function svar($rubrik, $text, $ok) {
  $farg = $ok ? '#1a7f37' : '#b42318';
  echo "<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'>"
     . "<body style='font-family:system-ui,sans-serif;max-width:560px;margin:40px auto;padding:0 20px;line-height:1.5'>"
     . "<h1 style='color:$farg'>$rubrik</h1><p>$text</p></body>";
  exit;
}

if (!file_exists($zip)) {
  svar('Hittar inte zip-filen', 'Ladda upp <b>zip-filen</b> i samma mapp som den här filen och ladda om sidan.', false);
}

$antal = 0;
if (class_exists('ZipArchive')) {
  $z = new ZipArchive();
  if ($z->open($zip) !== true) svar('Kunde inte öppna zip-filen', 'Ladda upp zip-filen igen och försök på nytt.', false);
  // Skydd: tillåt bara vanliga sökvägar inuti mappen
  for ($i = 0; $i < $z->numFiles; $i++) {
    $namn = $z->getNameIndex($i);
    if (strpos($namn, '..') !== false || substr($namn, 0, 1) === '/') svar('Ogiltig fil i zip', htmlspecialchars($namn), false);
  }
  if (!$z->extractTo($dir)) svar('Uppackningen misslyckades', 'Servern kunde inte skriva filerna. Kontrollera att mappen inte är skrivskyddad.', false);
  $antal = $z->numFiles;
  $z->close();
} elseif (class_exists('PharData')) {
  try {
    $p = new PharData($zip);
    $p->extractTo($dir, null, true);
    $antal = iterator_count(new RecursiveIteratorIterator($p));
  } catch (Exception $e) {
    svar('Uppackningen misslyckades', htmlspecialchars($e->getMessage()), false);
  }
} else {
  svar('Servern saknar zip-stöd', 'Skicka en skärmdump av den här sidan till Claude.', false);
}

foreach ($alla as $f) @unlink($f);
@unlink(__FILE__);

svar('Klart! ✅', "$antal filer är uppackade. Zip-filen och det här skriptet är borttagna.<br><br><a href='./'>Öppna sidan →</a>", true);
