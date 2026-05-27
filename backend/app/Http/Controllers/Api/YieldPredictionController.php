<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\YieldPrediction;
use App\Services\Yield\YieldPredictionService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class YieldPredictionController extends Controller
{
    private const STATUS_OPTIONS = [
        'predicted',
        'updated',
        'harvested',
        'cancelled',
    ];

    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (! $farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    private function query(Farm $farm)
    {
        return YieldPrediction::with(['crop.plot', 'plot'])
            ->where('farm_id', $farm->id);
    }

    private function resolveCrop(Farm $farm, int $cropId): Crop
    {
        $crop = Crop::query()->forFarm($farm)->with('plot')->find($cropId);

        if (! $crop) {
            abort(422, 'Selected crop does not belong to your farm.');
        }

        return $crop;
    }

    private function resolvePlot(Farm $farm, ?int $plotId): ?Plot
    {
        if ($plotId === null) {
            return null;
        }

        $plot = Plot::where('farm_id', $farm->id)->find($plotId);

        if (! $plot) {
            abort(422, 'Selected plot does not belong to your farm.');
        }

        return $plot;
    }

    public function index(Request $request)
    {
        $farm = $this->currentFarm($request);
        $query = $this->query($farm);

        if ($request->filled('crop_id')) {
            $crop = $this->resolveCrop($farm, (int) $request->integer('crop_id'));
            $query->where('crop_id', $crop->id);
        }

        if ($request->filled('status')) {
            $query->where('prediction_status', $request->string('status')->toString());
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request, YieldPredictionService $service)
    {
        $farm = $this->currentFarm($request);

        $data = $request->validate([
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'plot_id' => ['nullable', 'integer', 'exists:plots,id'],
            'crop_type' => ['nullable', 'string', 'max:255'],
            'farm_size_hectares' => ['nullable', 'numeric', 'min:0.01'],
            'days_planted' => ['nullable', 'integer', 'min:0'],
            'predicted_yield_kg' => ['nullable', 'numeric', 'min:0'],
            'confidence_score' => ['nullable', 'numeric', 'between:0,100'],
            'prediction_status' => ['nullable', Rule::in(self::STATUS_OPTIONS)],
            'predicted_on' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $crop = $this->resolveCrop($farm, (int) $data['crop_id']);
        $plot = $this->resolvePlot($farm, isset($data['plot_id']) ? (int) $data['plot_id'] : $crop->plot_id);

        if ($plot && (int) $plot->id !== (int) $crop->plot_id) {
            abort(422, 'Selected crop does not belong to the selected plot.');
        }

        $prediction = $service->predictForCrop(
            $crop,
            isset($data['farm_size_hectares']) ? (float) $data['farm_size_hectares'] : null,
            isset($data['days_planted']) ? (int) $data['days_planted'] : null,
        );

        $record = YieldPrediction::create([
            'farm_id' => $farm->id,
            'plot_id' => $crop->plot_id,
            'crop_id' => $crop->id,
            'farm_size_hectares' => $prediction['farm_size_hectares'],
            'days_planted' => $prediction['days_planted'],
            'predicted_yield_kg' => $data['predicted_yield_kg'] ?? $prediction['predicted_yield_kg'],
            'actual_yield_kg' => null,
            'confidence_score' => $data['confidence_score'] ?? $prediction['confidence_score'],
            'model_name' => $prediction['model_name'],
            'prediction_status' => $data['prediction_status'] ?? 'predicted',
            'predicted_on' => $data['predicted_on'] ?? now()->toDateString(),
            'harvested_on' => null,
            'notes' => $data['notes'] ?? $prediction['notes'],
            'input_payload' => array_merge($prediction['input_payload'], [
                'manual_predicted_yield_kg' => $data['predicted_yield_kg'] ?? null,
                'manual_confidence_score' => $data['confidence_score'] ?? null,
            ]),
        ])->load(['crop.plot', 'plot']);

        return response()->json($record, 201);
    }

    public function show(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);

        return response()->json($this->query($farm)->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $record = $this->query($farm)->findOrFail($id);

        $data = $request->validate([
            'predicted_yield_kg' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'actual_yield_kg' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'confidence_score' => ['sometimes', 'nullable', 'numeric', 'between:0,100'],
            'prediction_status' => ['sometimes', Rule::in(self::STATUS_OPTIONS)],
            'predicted_on' => ['sometimes', 'nullable', 'date'],
            'harvested_on' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        if (array_key_exists('actual_yield_kg', $data) && $data['actual_yield_kg'] !== null) {
            $data['prediction_status'] = $data['prediction_status'] ?? 'harvested';
            $data['harvested_on'] = $data['harvested_on'] ?? now()->toDateString();
        } elseif (! array_key_exists('prediction_status', $data)) {
            $data['prediction_status'] = 'updated';
        }

        $record->update($data);

        return response()->json($record->load(['crop.plot', 'plot']));
    }

    public function recordActual(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $record = $this->query($farm)->findOrFail($id);

        $data = $request->validate([
            'actual_yield_kg' => ['required', 'numeric', 'min:0'],
            'harvested_on' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        $record->update([
            'actual_yield_kg' => $data['actual_yield_kg'],
            'harvested_on' => $data['harvested_on'] ?? now()->toDateString(),
            'prediction_status' => 'harvested',
            'notes' => $data['notes'] ?? $record->notes,
        ]);

        return response()->json($record->load(['crop.plot', 'plot']));
    }

    public function destroy(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $record = $this->query($farm)->findOrFail($id);
        $record->delete();

        return response()->json(null, 204);
    }
}
