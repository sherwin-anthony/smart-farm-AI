<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\YieldPrediction;
use App\Services\Yield\YieldPredictionService;
use Illuminate\Http\Request;

class YieldPredictionController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (!$farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    public function index(Request $request)
    {
        $farm = $this->currentFarm($request);

        return YieldPrediction::with('crop.plot')
            ->where('farm_id', $farm->id)
            ->latest()
            ->get();
    }

    public function store(Request $request, YieldPredictionService $service)
    {
        $farm = $this->currentFarm($request);

        $data = $request->validate([
            'crop_id' => ['nullable', 'integer', 'exists:crops,id'],
            'crop_type' => ['required', 'string', 'max:255'],
            'farm_size_hectares' => ['required', 'numeric', 'min:0.01'],
            'days_planted' => ['required', 'integer', 'min:0'],
        ]);

        if (!empty($data['crop_id'])) {
            // A prediction can reference a crop only when that crop belongs to the authenticated farm.
            Crop::query()->forFarm($farm)->findOrFail($data['crop_id']);
        }

        $prediction = $service->predict(
            $data['crop_type'],
            (float) $data['farm_size_hectares'],
            (int) $data['days_planted'],
        );

        $record = YieldPrediction::create([
            'farm_id' => $farm->id,
            'crop_id' => $data['crop_id'] ?? null,
            'farm_size_hectares' => $data['farm_size_hectares'],
            'days_planted' => $data['days_planted'],
            'predicted_yield_kg' => $prediction['predicted_yield_kg'],
            'confidence_score' => $prediction['confidence_score'],
            'model_name' => $prediction['model_name'],
            'notes' => $prediction['notes'],
            'input_payload' => $data,
        ])->load('crop.plot');

        return response()->json($record, 201);
    }
}
