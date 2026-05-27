<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Services\Crops\CropTaskGenerator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

// Purpose: CRUD for crop records that belong to the authenticated user's farm through plots.
// Routing: /api/crops -> index/store/show/update/destroy
class CropController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (!$farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    private function cropQuery(Farm $farm): Builder
    {
        // Scope every crop query through the authenticated farm's plots.
        return Crop::with('plot')->forFarm($farm);
    }

    private function resolveFarmPlot(Farm $farm, int $plotId): Plot
    {
        // Ensure crops can only be attached to plots that belong to the authenticated farm.
        $plot = Plot::where('farm_id', $farm->id)->find($plotId);

        if (!$plot) {
            abort(422, 'Selected plot does not belong to your farm.');
        }

        return $plot;
    }

    private function storeRules(): array
    {
        // Keep the create rules aligned with the locked crop workflow from the active crop contract.
        return [
            'plot_id' => ['required', 'integer', 'exists:plots,id'],
            'name' => ['required', 'string', 'max:255'],
            'variety' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(Crop::STATUS_OPTIONS)],
            'growth_stage' => ['nullable', Rule::in(Crop::GROWTH_STAGE_OPTIONS)],
            'planted_on' => ['nullable', 'date'],
            'expected_harvest_on' => ['nullable', 'date'],
            'actual_harvest_on' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }

    private function updateRules(): array
    {
        // Allow partial edits while still enforcing the same locked crop vocabulary.
        return [
            'plot_id' => ['sometimes', 'required', 'integer', 'exists:plots,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'variety' => ['sometimes', 'nullable', 'string', 'max:255'],
            'type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'nullable', Rule::in(Crop::STATUS_OPTIONS)],
            'growth_stage' => ['sometimes', 'nullable', Rule::in(Crop::GROWTH_STAGE_OPTIONS)],
            'planted_on' => ['sometimes', 'nullable', 'date'],
            'expected_harvest_on' => ['sometimes', 'nullable', 'date'],
            'actual_harvest_on' => ['sometimes', 'nullable', 'date'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }

    // Route: GET /api/crops
    public function index(Request $request)
    {
        $farm = $this->currentFarm($request);

        return response()->json(
            $this->cropQuery($farm)->latest()->get()
        );
    }

    // Route: POST /api/crops
    public function store(Request $request, CropTaskGenerator $taskGenerator)
    {
        $farm = $this->currentFarm($request);
        $data = $request->validate($this->storeRules());

        $this->resolveFarmPlot($farm, (int) $data['plot_id']);

        // Apply predictable lifecycle defaults so new crops start in a stable workflow state.
        $crop = Crop::create([
            'plot_id' => $data['plot_id'],
            'name' => $data['name'],
            'variety' => $data['variety'] ?? null,
            'type' => $data['type'] ?? null,
            'status' => $data['status'] ?? 'planned',
            'growth_stage' => $data['growth_stage'] ?? 'seed',
            'planted_on' => $data['planted_on'] ?? null,
            'expected_harvest_on' => $data['expected_harvest_on'] ?? null,
            'actual_harvest_on' => $data['actual_harvest_on'] ?? null,
            'notes' => $data['notes'] ?? null,
        ])->load('plot');

        // New crops immediately receive starter tasks so the workspace shows what needs attention next.
        $taskGenerator->generateForNewCrop($crop);

        return response()->json($crop, 201);
    }

    // Route: GET /api/crops/{crop}
    public function show(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $crop = $this->cropQuery($farm)->findOrFail($id);

        return response()->json($crop);
    }

    // Route: PUT /api/crops/{crop}
    public function update(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $crop = $this->cropQuery($farm)->findOrFail($id);
        $data = $request->validate($this->updateRules());

        if (array_key_exists('plot_id', $data)) {
            $this->resolveFarmPlot($farm, (int) $data['plot_id']);
        }

        $crop->update($data);

        return response()->json($crop->load('plot'));
    }

    // Route: DELETE /api/crops/{crop}
    public function destroy(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $crop = $this->cropQuery($farm)->findOrFail($id);
        $crop->delete();

        return response()->json(null, 204);
    }
}
