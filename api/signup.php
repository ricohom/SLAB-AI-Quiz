<?php
require 'db.php';
$req = json_decode(file_get_contents('php://input'), true);
if(!$req){http_response_code(400);exit;}

try{
  $stmt=$pdo->prepare("INSERT INTO users (username,password) VALUES (?,?)");
  $stmt->execute([$req['username'],$req['password']]);
  echo json_encode(["ok"=>true]);
}catch(PDOException $e){
  http_response_code(409);
  echo json_encode(["error"=>"Username vergeben"]);
}