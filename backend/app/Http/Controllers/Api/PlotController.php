<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\Plot;
use Illuminate\Http\Request;

// Purpose: CRUD for plot records that belong to the authenticated user's farm.
// Routing: /api/plots -> index/store/show/update/destroy
class PlotController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (!$farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    // Route: GET /api/plots
    public function index(Request $request)
    {
        $farm = $this->currentFarm($request);

        return response()->json(
            Plot::where('farm_id', $farm->id)->latest()->get()
        );
    }

    // Route: POST /api/plots
    public function store(Request $request)
    {
        $farm = $this->currentFarm($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'area_hectares' => ['nullable', 'numeric', 'min:0'],
            'soil_type' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $plot = Plot::create([
            'farm_id' => $farm->id,
            'name' => $data['name'],
            'area_hectares' => $data['area_hectares'] ?? null,
            'soil_type' => $data['soil_type'] ?? null,
            'status' => $data['status'] ?? 'active',
            'notes' => $data['notes'] ?? null,
        ]);

        return response()->json($plot, 201);
    }

    // Route: GET /api/plots/{plot}
    public function show(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);

        $plot = Plot::where('farm_id', $farm->id)
            ->with('crops')
            ->findOrFail($id);

        return response()->json($plot);
    }

    // Route: PUT /api/plots/{plot}
    public function update(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $plot = Plot::where('farm_id', $farm->id)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'area_hectares' => ['nullable', 'numeric', 'min:0'],
            'soil_type' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $plot->update($data);

        return response()->json($plot);
    }

    // Route: DELETE /api/plots/{plot}
    public function destroy(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $plot = Plot::where('farm_id', $farm->id)->findOrFail($id);
        $plot->delete();

        return response()->json(null, 204);
    }
}
