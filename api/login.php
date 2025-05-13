<?php
require 'db.php';
$req=json_decode(file_get_contents('php://input'),true);
$stmt=$pdo->prepare("SELECT id,points FROM users WHERE username=? AND password=?");
$stmt->execute([$req['username'],$req['password']]);
$user=$stmt->fetch(PDO::FETCH_ASSOC);

if($user){echo json_encode($user);}
else{http_response_code(401);echo json_encode(["error"=>"Login fehlgeschlagen"]);}