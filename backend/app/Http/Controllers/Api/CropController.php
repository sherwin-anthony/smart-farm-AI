<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use Illuminate\Http\Request;


class CropController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        return response()->json(Crop::all());

    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $crop = Crop::create($request->all());
        return response()->json($crop, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $crop = Crop::findOrFail($id);
        return response()->json($crop);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $crop = Crop::findOrFail($id);
        $crop->update($request->all());
        return response()->json($crop);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
         $crop = Crop::findOrFail($id);
        $crop->delete();
        return response()->json(null, 204);
    }
}
