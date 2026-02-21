<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app(\App\Http\Controllers\WalletController::class);
$response = $controller->realtime();
// If it's a JsonResponse, get data
if (method_exists($response, 'getData')) {
    $data = $response->getData(true);
    echo json_encode($data, JSON_PRETTY_PRINT);
} else {
    echo (string) $response;
}
