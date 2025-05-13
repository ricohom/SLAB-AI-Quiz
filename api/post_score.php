<?php
require 'db.php';
$req=json_decode(file_get_contents('php://input'),true);
$stmt=$pdo->prepare("UPDATE users SET points=? WHERE id=?");
$stmt->execute([$req['points'],$req['id']]);
echo json_encode(["ok"=>true]);