<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use Illuminate\Http\Request;

// Purpose: return and update the authenticated user's farm.
// Routing:
// GET /api/farm -> show
// PUT /api/farm -> update
class CurrentFarmController extends Controller
{
    // Purpose: return the logged-in user's farm.
    // Route: GET /api/farm
    public function show(Request $request)
    {
        $farm = $request->user()->farms()->latest()->first();

        if (!$farm) {
            return response()->json([
                'message' => 'No farm found for this user.',
            ], 404);
        }

        return response()->json($farm);
    }

    // Purpose: update the logged-in user's farm profile.
    // Route: PUT /api/farm
    public function update(Request $request)
    {
        $data = $request->validate([
            'location' => ['nullable', 'string', 'max:255'],
            'size_hectares' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $farm = $request->user()->farms()->latest()->first();

        if (!$farm) {
            $farm = new Farm([
                'user_id' => $request->user()->id,
            ]);
        }

        $farm->fill([
            'name' => "{$request->user()->name}'s Farm",
            'owner_name' => $request->user()->name,
            'location' => $data['location'] ?? null,
            'size_hectares' => $data['size_hectares'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        $farm->user()->associate($request->user());
        $farm->save();

        return response()->json($farm);
    }
}
