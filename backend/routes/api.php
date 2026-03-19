<?php

use App\Http\Controllers\Api\CropController;
use Illuminate\Support\Facades\Route;

Route::get('crops', [CropController::class, 'index']);
Route::post('crops', [CropController::class, 'store']);
Route::get('crops/{id}', [CropController::class, 'show']);
Route::put('crops/{id}', [CropController::class, 'update']);
Route::delete('crops/{id}', [CropController::class, 'destroy']);
