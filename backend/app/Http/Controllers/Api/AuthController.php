<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

// Purpose: handle authentication and first-time registration.
// Routing:
// POST /api/register -> register
// POST /api/login    -> login
// POST /api/logout   -> logout
// GET  /api/user     -> user
class AuthController extends Controller
{
    // Purpose: register a new user and create their first farm.
    // Route: POST /api/register
    public function register(Request $request)
    {
        $data = $request->validate([
            'owner_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'farm_name' => ['required', 'string', 'max:255'],
            'location' => ['required', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $data['owner_name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        Farm::create([
            'user_id' => $user->id,
            'name' => $data['farm_name'],
            'owner_name' => $data['owner_name'],
            'location' => $data['location'],
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user,
        ], 201);
    }

    // Purpose: authenticate an existing user.
    // Route: POST /api/login
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Invalid login credentials.',
            ], 422);
        }

        $request->session()->regenerate();

        return response()->json([
            'message' => 'Login successful.',
            'user' => $request->user(),
        ]);
    }

    // Purpose: return the authenticated user.
    // Route: GET /api/user
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    // Purpose: update the authenticated user's account details.
    // Route: PUT /api/user
    public function updateUser(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    // Purpose: log out the current user.
    // Route: POST /api/logout
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}
