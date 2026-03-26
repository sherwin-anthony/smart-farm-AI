<?php

use App\Http\Controllers\Api\AssistantController;
use App\Http\Controllers\Api\CropController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\FarmController;
use App\Http\Controllers\Api\PlotController;
use App\Http\Controllers\Api\RecommendationController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\WeatherController;
use App\Http\Controllers\Api\YieldPredictionController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CurrentFarmController;

use Illuminate\Support\Facades\Route;

// Farm structure.
Route::apiResource('farms', FarmController::class);

// Crop monitoring.
Route::apiResource('crops', CropController::class);

// Smart task scheduler.
Route::apiResource('tasks', TaskController::class);

// Dashboard analytics.
Route::get('dashboard/overview', [DashboardController::class, 'overview']);

// Weather and recommendations.
Route::get('weather/forecast', [WeatherController::class, 'index']);
Route::post('weather/sync', [WeatherController::class, 'sync']);
Route::get('recommendations', [RecommendationController::class, 'index']);

// Yield prediction.
Route::get('yield-predictions', [YieldPredictionController::class, 'index']);
Route::post('yield-predictions', [YieldPredictionController::class, 'store']);

// AI assistant chat.
Route::post('assistant/chat', [AssistantController::class, 'chat']);

// Authentication + current user/farm session routes.
// These stay under /api/... but also need web middleware for session support.
Route::middleware('web')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('user', [AuthController::class, 'user']);
        Route::put('user', [AuthController::class, 'updateUser']);

        Route::get('farm', [CurrentFarmController::class, 'show']);
        Route::put('farm', [CurrentFarmController::class, 'update']);

        // Plot records are private and always belong to the authenticated farm.
        Route::apiResource('plots', PlotController::class);
    });
});
