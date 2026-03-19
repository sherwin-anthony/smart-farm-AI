<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    public function index()
    {
        return response()->json(Farm::latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'size_hectares' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $farm = Farm::create($data);

        return response()->json($farm, 201);
    }

    public function show(string $id)
    {
        return response()->json(Farm::findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $farm = Farm::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'owner_name' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'size_hectares' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $farm->update($data);

        return response()->json($farm);
    }

    public function destroy(string $id)
    {
        $farm = Farm::findOrFail($id);
        $farm->delete();

        return response()->json(null, 204);
    }
}
