<?php
// Jämföra Privatleasing – enkel besöksräknare utan kakor.
// Sparar bara antal per dag, sida och händelse. Ingen IP-adress, inga kakor, inga personuppgifter.
header('Cache-Control: no-store');
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|monitor|curl|wget|python|headless/i', $ua)) { http_response_code(204); exit; }

$handelse = $_POST['t'] ?? $_GET['t'] ?? 'visa';
if (!in_array($handelse, ['visa', 'konf', 'bestall', 'utlank'], true)) { http_response_code(204); exit; }
$sida = $_POST['p'] ?? $_GET['p'] ?? '/';
$sida = preg_replace('/[^a-z0-9\-\/\.]/', '', strtolower(substr($sida, 0, 80)));
if ($sida === '' ) $sida = '/';
$bil = substr(preg_replace('/[^\p{L}\p{N} \-\.]/u', '', $_POST['b'] ?? ''), 0, 60);

$mapp = __DIR__ . '/data';
if (!is_dir($mapp)) { @mkdir($mapp, 0750, true); @file_put_contents($mapp . '/.htaccess', "Require all denied\nDeny from all\n"); }
$fil = $mapp . '/stat-' . date('Y-m') . '.json';
$fp = @fopen($fil, 'c+');
if (!$fp) { http_response_code(204); exit; }
flock($fp, LOCK_EX);
$data = json_decode(stream_get_contents($fp) ?: '{}', true) ?: [];
$dag = date('Y-m-d');
$data['dagar'][$dag][$handelse] = ($data['dagar'][$dag][$handelse] ?? 0) + 1;
if ($handelse === 'visa') $data['sidor'][$sida] = ($data['sidor'][$sida] ?? 0) + 1;
if ($bil !== '' && $handelse !== 'visa') $data['bilar'][$handelse][$bil] = ($data['bilar'][$handelse][$bil] ?? 0) + 1;
ftruncate($fp, 0); rewind($fp);
fwrite($fp, json_encode($data, JSON_UNESCAPED_UNICODE));
fflush($fp); flock($fp, LOCK_UN); fclose($fp);
http_response_code(204);
