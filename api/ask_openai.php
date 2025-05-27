<?php
/* --------- GEHEIMDATEN ----------------------------------------- */
$openai_key = "KEY";   // Project-Key
$project_id = "ID";                                  // Project-ID
/* ----------------------------------------------------------------*/

/* ------------- Payload aus dem Frontend ------------------------ */
$payload = file_get_contents('php://input');

/* ------------- DEBUG: rohen Payload ins Log -------------------- */
error_log("PAYLOAD: ".$payload);

/* ------------- cURL zu OpenAI ---------------------------------- */
$ch = curl_init("https://api.openai.com/v1/chat/completions");   // <— WICHTIG!  variable $ch existiert jetzt
curl_setopt_array($ch, [
  CURLOPT_POST           => true,
  CURLOPT_POSTFIELDS     => $payload,
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HTTPHEADER     => [
    "Authorization: Bearer {$openai_key}",
    "OpenAI-Project: {$project_id}",
    "Content-Type: application/json",
    "Content-Length: ".strlen($payload)
  ],
  CURLOPT_SSL_VERIFYPEER => true            // bei SSL-Warnung testweise false
]);

$response = curl_exec($ch);

/* ------------- Fehler auf cURL-Ebene --------------------------- */
if ($response === false) {
    http_response_code(500);
    header("Content-Type:text/plain; charset=utf-8");
    echo "cURL-Fehler: ".curl_error($ch);
    exit;
}

/* ------------- HTTP-Code von OpenAI ---------------------------- */
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
http_response_code($httpCode);
header("Content-Type: application/json");
echo $response;

/* ------------- Log bei Nicht-200 ------------------------------- */
if ($httpCode !== 200) {
    error_log("OpenAI $httpCode: $response");
}