<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
        $farm = $request->user()->farms()->latest()->first();

        if (!$farm) {
            return response()->json([
                'message' => 'No farm found for this user.',
            ], 404);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
        ]);

        $farm->update($data);

        return response()->json($farm);
    }
}
