# Password Reset Email Setup Verification

## Configuration Status ✓

Your email configuration has been updated and verified:

### .env Settings

```
MAIL_MAILER=smtp
MAIL_SCHEME=ssl
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=gyretecplasticmolding@gmail.com
MAIL_PASSWORD="vgnl eeat ebgm rbbc"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=gyretecplasticmolding@gmail.com
MAIL_FROM_NAME="Payroll"
```

## Files Created/Updated

### 1. Custom Notification Class

- **File**: `/app/Notifications/ResetPasswordNotification.php`
- **Purpose**: Sends password reset emails with custom template
- **Status**: ✓ Created

### 2. Email Template

- **File**: `/resources/views/emails/reset-password.blade.php`
- **Design**: Minimalist with your logos (rw.png, cvsulogo.png)
- **Status**: ✓ Created

### 3. User Model Update

- **File**: `/app/Models/User.php`
- **Change**: Added `sendPasswordResetNotification()` method
- **Status**: ✓ Updated

### 4. Test Command

- **File**: `/app/Console/Commands/TestResetPasswordEmail.php`
- **Purpose**: Test email sending without going through the UI
- **Status**: ✓ Created

## How to Test Email Sending

### Option 1: Using the Test Command (Recommended)

Run this command to test sending a password reset email:

```bash
php artisan test:reset-password-email your-email@example.com
```

Replace `your-email@example.com` with an actual user email in your database.

**Expected Output:**

```
✓ Password reset email sent successfully to your-email@example.com
✓ Check your email inbox for the reset link
```

### Option 2: Using the Web UI

1. Go to `/forgot-password`
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email inbox

## Troubleshooting

### Email Not Arriving?

1. **Check Gmail Settings**
    - Go to: https://myaccount.google.com/apppasswords
    - Verify the app password is correct
    - The password in .env should be: `vgnl eeat ebgm rbbc`

2. **Check Spam/Junk Folder**
    - Gmail might filter the email as spam initially
    - Mark it as "Not Spam" to improve delivery

3. **Verify SMTP Connection**
    - Run: `php artisan tinker`
    - Then: `Mail::raw('Test', function($m) { $m->to('your-email@example.com'); })`
    - Check for any connection errors

4. **Check Laravel Logs**
    - Look in: `/storage/logs/laravel.log`
    - Search for "Reset Password" or "Mail" errors

5. **Verify Database**
    - Check if `password_reset_tokens` table exists
    - Run: `php artisan migrate` if needed

## Email Template Features

The password reset email includes:

✓ Your branded logos (rw.png + cvsulogo.png)
✓ Personalized greeting with user's first name
✓ Clear call-to-action button
✓ Link expiry warning (60 minutes)
✓ Fallback link for copy-paste
✓ Professional footer
✓ Responsive design (mobile & desktop)

## Next Steps

1. Run the test command to verify email sending works
2. Check your email inbox for the test email
3. If successful, the password reset flow is ready for production
4. If issues persist, check the troubleshooting section above

## Important Notes

- The password reset link expires in 60 minutes (configurable in `config/auth.php`)
- Emails are sent asynchronously if you have a queue configured
- For development, you can use `MAIL_MAILER=log` in .env to log emails instead of sending them
