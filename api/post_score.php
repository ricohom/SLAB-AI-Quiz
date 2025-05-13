<?php
require 'db.php';
$d=json_decode(file_get_contents('php://input'),true);
$delta = (int)$d['delta'];
$id    = (int)$d['id'];
$pdo->prepare("UPDATE users SET points = GREATEST(points + ?, 0) WHERE id = ?")
    ->execute([$delta,$id]);
echo json_encode(["ok"=>true]);