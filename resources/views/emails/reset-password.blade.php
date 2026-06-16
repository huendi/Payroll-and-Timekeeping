<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.5;
            color: #09090b;
            background-color: #fafafa;
        }
        .container {
            max-width: 480px;
            margin: 32px auto;
            padding: 0 16px;
        }
        .email-wrapper {
            background-color: #ffffff;
            border-radius: 8px;
            border: 1px solid #e4e4e7;
            overflow: hidden;
        }
        .header {
            padding: 40px 32px;
            text-align: center;
            border-bottom: 1px solid #e4e4e7;
        }
        .logo-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .logo-container img {
            height: 32px;
            width: auto;
        }
        .header h1 {
            color: #09090b;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 4px;
        }
        .header p {
            color: #71717a;
            font-size: 13px;
        }
        .content {
            padding: 40px 32px;
        }
        .greeting {
            font-size: 15px;
            color: #09090b;
            margin-bottom: 16px;
            font-weight: 500;
        }
        .message {
            font-size: 14px;
            color: #52525b;
            margin-bottom: 28px;
            line-height: 1.6;
        }
        .button-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .button {
            display: inline-block;
            padding: 10px 32px;
            background-color: #09090b;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s ease;
            border: 1px solid #09090b;
        }
        .button:visited {
            color: #ffffff !important;
        }
        .button:hover {
            background-color: #27272a;
            border-color: #27272a;
        }
        .security-note {
            background-color: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
            padding: 12px 14px;
            font-size: 13px;
            color: #52525b;
            line-height: 1.5;
            margin: 24px 0;
        }
        .security-note strong {
            color: #09090b;
        }
        .link-section {
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e4e4e7;
        }
        .link-label {
            font-size: 12px;
            color: #71717a;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-weight: 500;
        }
        .link-text {
            font-size: 12px;
            color: #52525b;
            word-break: break-all;
            background-color: #fafafa;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid #e4e4e7;
        }
        .link-text a {
            color: #09090b;
            text-decoration: none;
        }
        .footer {
            background-color: #fafafa;
            padding: 20px 32px;
            text-align: center;
            border-top: 1px solid #e4e4e7;
            font-size: 12px;
            color: #71717a;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-wrapper">
            <!-- Header -->
            <div class="header">
                <h1>Password Reset</h1>
                <p>Reset your account password</p>
            </div>

            <!-- Content -->
            <div class="content">
                <div class="greeting">
                    Hello {{ $user->first_name ?? $user->name }},
                </div>

                <div class="message">
                    We received a request to reset your password. Click the button below to create a new password.
                </div>

                <div class="button-wrapper">
                    <a href="{{ $url }}" class="button">Reset Password</a>
                </div>

                <div class="security-note">
                    <strong>Security:</strong> This link expires in 60 minutes. If you didn't request this, you can safely ignore this email.
                </div>

                <div class="link-section">
                    <div class="link-label">Or copy this link:</div>
                    <div class="link-text">
                        <a href="{{ $url }}">{{ $url }}</a>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; {{ date('Y') }} Payroll System</p>
            </div>
        </div>
    </div>
</body>
</html>
