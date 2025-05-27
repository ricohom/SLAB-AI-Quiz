<?php
require 'db.php';
$d = json_decode(file_get_contents('php://input'), true);
$id = (int)$d['id'];

$pdo->prepare("UPDATE users
               SET games_played = games_played + 1
               WHERE id = ?")
    ->execute([$id]);

echo json_encode(["ok"=>true]);