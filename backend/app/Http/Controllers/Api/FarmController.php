<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use Illuminate\Http\Request;

// Purpose: handle all /api/farms requests.
// Routing:
// GET    /api/farms        -> index
// POST   /api/farms        -> store
// GET    /api/farms/{farm} -> show
// PUT    /api/farms/{farm} -> update
// DELETE /api/farms/{farm} -> destroy

class FarmController extends Controller
{
    public function index()
    {
        return response()->json(Farm::latest()->get());
    }


    // Purpose: create one new farm record from the frontend form.
    // Route: POST /api/farms
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


    // Purpose: return one farm with related plots when needed later.
    // Route: GET /api/farms/{farm}
    public function show(string $id)
    {
        return response()->json(Farm::findOrFail($id));
    }


    // Purpose: update one farm record.
    // Route: PUT/PATCH /api/farms/{farm}
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


    // Purpose: delete one farm record.
    // Route: DELETE /api/farms/{farm}
    public function destroy(string $id)
    {
        $farm = Farm::findOrFail($id);
        $farm->delete();

        return response()->json(null, 204);
    }
}
