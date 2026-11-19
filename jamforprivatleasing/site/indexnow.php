<?php
// Skickar alla adresser i sitemap.xml till IndexNow (Bing, DuckDuckGo, Ecosia, Yandex m.fl.) – gratis snabbindexering.
// Öppna https://jamforprivatleasing.se/indexnow.php?k=addd4b77d576202b9419a55f efter varje uppladdning.
if (!isset($_GET['k']) || !hash_equals('addd4b77d576202b9419a55f', $_GET['k'])) { http_response_code(404); exit; }
header('Content-Type: text/plain; charset=utf-8');
$xml = @file_get_contents(__DIR__ . '/sitemap.xml');
if (!$xml) { echo "Hittar inte sitemap.xml"; exit; }
preg_match_all('#<loc>([^<]+)</loc>#', $xml, $m);
$urls = array_values(array_unique($m[1]));
$data = json_encode([
  'host' => 'jamforprivatleasing.se',
  'key' => '57ef8e3003528ddc515d27fd5530262d',
  'keyLocation' => 'https://jamforprivatleasing.se/57ef8e3003528ddc515d27fd5530262d.txt',
  'urlList' => array_slice($urls, 0, 10000)
]);
$ctx = stream_context_create(['http' => [
  'method' => 'POST',
  'header' => "Content-Type: application/json; charset=utf-8\r\n",
  'content' => $data, 'timeout' => 30, 'ignore_errors' => true
]]);
$ok = false;
echo "Skickar " . count($urls) . " adresser.\n\n";
foreach (['https://api.indexnow.org/indexnow', 'https://www.bing.com/indexnow', 'https://yandex.com/indexnow'] as $mal) {
  $http_response_header = null;
  $svar = @file_get_contents($mal, false, $ctx);
  $kod = isset($http_response_header[0]) ? $http_response_header[0] : 'inget svar';
  echo "$mal\n  $kod\n  " . substr(trim(strip_tags((string)$svar)), 0, 300) . "\n\n";
  if (strpos($kod, ' 200') !== false || strpos($kod, ' 202') !== false) $ok = true;
}
echo $ok ? "Klart – sökmotorerna har fått listan.\n" : "Något gick fel – visa den här texten för Claude.\n";
