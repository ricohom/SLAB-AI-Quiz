<?php
require 'db.php';

$d = json_decode(file_get_contents('php://input'), true);

$stmt = $pdo->prepare(
    "SELECT id,
            points,
            correct,
            wrong
       FROM users
      WHERE username = ? AND password = ?"
);
$stmt->execute([$d['username'], $d['password']]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user) {
    echo json_encode($user);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Login fehlgeschlagen"]);
}