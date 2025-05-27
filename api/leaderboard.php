<?php
require 'db.php';

$rows = $pdo->query(
  "SELECT 
     username,
     points,
     CASE 
       WHEN correct + wrong > 0 
       THEN ROUND(correct * 100.0 / (correct + wrong)) 
       ELSE 0 
     END AS accuracy,
     games_played
   FROM users
   ORDER BY points DESC
   LIMIT 10"
)->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($rows);