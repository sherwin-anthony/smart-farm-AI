<?php

use Illuminate\Support\Facades\Route;

// This is only a simple backend status page.
// Your real frontend will still run on Vite at :5173.
Route::get('/', function () {
    return response()->json([
        'message' => 'Smart Farm backend is running.',
        'api' => 'http://127.0.0.1:8000/api/crops',
        'frontend' => 'http://127.0.0.1:5173',
    ]);
});
