<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AI\FarmingAssistantService;
use Illuminate\Http\Request;

class AssistantController extends Controller
{
    public function chat(Request $request, FarmingAssistantService $assistant)
    {
        $data = $request->validate([
            'message' => ['required', 'string'],
            'farm_id' => ['nullable', 'exists:farms,id'],
        ]);

        $response = $assistant->reply($data['message'], [
            'farm_id' => $data['farm_id'] ?? null,
        ]);

        return response()->json($response);
    }
}
