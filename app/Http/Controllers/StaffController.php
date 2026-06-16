<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class StaffController extends Controller
{
    /**
     * Display a listing of Staff users (HR and Finance).
     */
    public function index(Request $request)
    {
        $query = User::whereIn('role', ['hr', 'finance']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('employee_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $staffUsers = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('staff/index', [
            'staffUsers' => $staffUsers,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new Staff user.
     */
    public function create()
    {
        return Inertia::render('staff/create');
    }

    /**
     * Store a newly created Staff user in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_number' => 'required|string|unique:users,employee_number',
            'department' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'status' => 'required|in:active,inactive',
            'role' => 'required|in:hr,finance',
        ]);

        User::create([
            'employee_number' => $validated['employee_number'],
            'department' => $validated['department'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'],
            'role' => $validated['role'],
        ]);

        return redirect()->route('staff.index')->with('success', 'Staff user created successfully.');
    }

    /**
     * Display the specified Staff user.
     */
    public function show(User $staff)
    {
        if (!in_array($staff->role, ['hr', 'finance'])) {
            abort(404);
        }

        return Inertia::render('staff/show', [
            'staffUser' => $staff,
        ]);
    }

    /**
     * Show the form for editing the specified Staff user.
     */
    public function edit(User $staff)
    {
        if (!in_array($staff->role, ['hr', 'finance'])) {
            abort(404);
        }

        return Inertia::render('staff/edit', [
            'staffUser' => $staff,
        ]);
    }

    /**
     * Update the specified Staff user in storage.
     */
    public function update(Request $request, User $staff)
    {
        if (!in_array($staff->role, ['hr', 'finance'])) {
            abort(404);
        }

        $validated = $request->validate([
            'employee_number' => 'required|string|unique:users,employee_number,' . $staff->id,
            'department' => 'required|string|max:255',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $staff->id,
            'status' => 'required|in:active,inactive',
            'role' => 'required|in:hr,finance',
            'password' => 'nullable|string|min:6|confirmed',
        ]);

        $updateData = [
            'employee_number' => $validated['employee_number'],
            'department' => $validated['department'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'status' => $validated['status'],
            'role' => $validated['role'],
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $staff->update($updateData);

        return redirect()->route('staff.index')->with('success', 'Staff user updated successfully.');
    }

    /**
     * Remove the specified Staff user from storage.
     */
    public function destroy(User $staff)
    {
        if (!in_array($staff->role, ['hr', 'finance'])) {
            abort(404);
        }

        $staff->delete();

        return redirect()->route('staff.index')->with('success', 'Staff user deleted successfully.');
    }
}
