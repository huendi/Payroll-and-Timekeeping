<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestResetPasswordEmail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:reset-password-email {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test sending a password reset email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        try {
            // Generate a password reset token
            $token = Str::random(64);

            // Store the token in the password_resets table
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => hash('sha256', $token),
                    'created_at' => now(),
                ]
            );

            // Send the notification
            $user->notify(new ResetPasswordNotification($token));

            $this->info("✓ Password reset email sent successfully to {$email}");
            $this->info("✓ Check your email inbox for the reset link");
            return 0;
        } catch (\Exception $e) {
            $this->error("✗ Error sending email: " . $e->getMessage());
            $this->error("Exception: " . get_class($e));
            return 1;
        }
    }
}
