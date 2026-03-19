<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\YieldPrediction;
use App\Services\Yield\YieldPredictionService;
use Illuminate\Http\Request;

class YieldPredictionController extends Controller
{
    public function index()
    {
        return YieldPrediction::latest()->get();
    }

    public function store(Request $request, YieldPredictionService $service)
    {
        $data = $request->validate([
            'farm_id' => ['nullable', 'exists:farms,id'],
            'crop_id' => ['nullable', 'exists:crops,id'],
            'crop_type' => ['required', 'string', 'max:255'],
            'farm_size_hectares' => ['required', 'numeric', 'min:0.01'],
            'days_planted' => ['required', 'integer', 'min:0'],
        ]);

        $prediction = $service->predict(
            $data['crop_type'],
            (float) $data['farm_size_hectares'],
            (int) $data['days_planted'],
        );

        $record = YieldPrediction::create([
            'farm_id' => $data['farm_id'] ?? null,
            'crop_id' => $data['crop_id'] ?? null,
            'farm_size_hectares' => $data['farm_size_hectares'],
            'days_planted' => $data['days_planted'],
            'predicted_yield_kg' => $prediction['predicted_yield_kg'],
            'confidence_score' => $prediction['confidence_score'],
            'model_name' => $prediction['model_name'],
            'notes' => $prediction['notes'],
            'input_payload' => $data,
        ]);

        return response()->json($record, 201);
    }
}
