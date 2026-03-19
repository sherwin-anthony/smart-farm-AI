<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Plot;
use Illuminate\Http\Request;

class PlotController extends Controller
{
    public function index()
    {
        return response()->json(Plot::with('farm')->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'farm_id' => ['required', 'exists:farms,id'],
            'name' => ['required', 'string', 'max:255'],
            'area_hectares' => ['nullable', 'numeric', 'min:0'],
            'soil_type' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $plot = Plot::create($data);

        return response()->json($plot, 201);
    }

    public function show(string $id)
    {
        return response()->json(Plot::with('farm', 'crops')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $plot = Plot::findOrFail($id);

        $data = $request->validate([
            'farm_id' => ['sometimes', 'required', 'exists:farms,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'area_hectares' => ['nullable', 'numeric', 'min:0'],
            'soil_type' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $plot->update($data);

        return response()->json($plot);
    }

    public function destroy(string $id)
    {
        $plot = Plot::findOrFail($id);
        $plot->delete();

        return response()->json(null, 204);
    }
}
