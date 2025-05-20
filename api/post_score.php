<?php
require 'db.php';

$d = json_decode(file_get_contents('php://input'), true);

$id      = (int)$d['id'];
$delta   = isset($d['delta'])   ? (int)$d['delta']   : 0;
$addCor  = isset($d['correct']) ? (int)$d['correct'] : 0;   // +1 bei richtiger Antwort
$addWr   = isset($d['wrong'])   ? (int)$d['wrong']   : 0;   // +1 bei falscher Antwort

/* Punkte anpassen, aber nie unter 0 fallen; gleichzeitig Correct/Wrong erhöhen */
$pdo->prepare(
  "UPDATE users
     SET points  = GREATEST(points + ?, 0),
         correct = correct + ?,
         wrong   = wrong   + ?
   WHERE id = ?")
   ->execute([$delta, $addCor, $addWr, $id]);

echo json_encode(["ok" => true]);