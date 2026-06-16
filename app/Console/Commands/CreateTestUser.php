<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateTestUser extends Command
{
    protected $signature = 'user:create-test {email?}';
    protected $description = 'Create or update a test user with a hashed password';

    public function handle()
    {
        $email = $this->argument('email') ?? 'ishmaelcascabel@gmail.com';
        $password = 'password123';

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Test User',
                'first_name' => 'Test',
                'password' => Hash::make($password),
                'email_verified_at' => now(),
            ]
        );

        $this->info("✓ Test user created/updated: {$email}");
        $this->info("✓ Password: {$password}");
        $this->info("✓ You can now test password reset with this account");

        return 0;
    }
}
