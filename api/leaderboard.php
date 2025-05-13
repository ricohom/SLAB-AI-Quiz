<?php
require 'db.php';
$rows=$pdo->query("SELECT username,points FROM users ORDER BY points DESC LIMIT 10")
          ->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows);