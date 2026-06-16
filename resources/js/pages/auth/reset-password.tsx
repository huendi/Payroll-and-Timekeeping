import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { update } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface ResetPasswordProps {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50">
            <Head title="Reset password" />

            {/* Misty Background Effects */}
            <div className="absolute -top-[10%] -left-[10%] h-[50%] w-[50%] rounded-full bg-blue-100/80 blur-[100px]" />
            <div className="absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full bg-sky-100/80 blur-[100px]" />
            <div className="absolute top-[20%] right-[20%] h-[30%] w-[30%] rounded-full bg-indigo-50/60 blur-[80px]" />

            {/* Logo - Top Left Corner */}
            <div className="absolute top-6 left-6 opacity-90 sm:top-10 sm:left-10">
                <img
                    src="/technologo.png"
                    alt="Techno Logo"
                    className="h-14 w-auto object-contain"
                />
            </div>

            {/* Logos - Top Right Corner */}
            <div className="absolute top-6 right-6 flex items-center gap-4 opacity-90 sm:top-10 sm:right-10">
                <img
                    src="/rw.png"
                    alt="RW Logo"
                    className="h-14 w-auto object-contain"
                />
                <div className="h-10 w-px bg-slate-200" />
                <img
                    src="/cvsulogo.png"
                    alt="CVSU Logo"
                    className="h-14 w-auto object-contain"
                />
            </div>

            {/* Main Container */}
            <div className="relative z-10 w-full max-w-[320px] px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Reset password
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Please enter your new password below
                    </p>
                </div>

                <Form
                    {...update.form()}
                    transform={(data) => ({ ...data, token, email })}
                    resetOnSuccess={['password', 'password_confirmation']}
                >
                    {({ processing, errors }) => (
                        <div className="grid gap-4">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="email"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    className="h-9 border-slate-200 bg-white/80 px-3 text-sm shadow-sm transition-all hover:bg-white focus:border-blue-500 focus:ring-blue-500"
                                    readOnly
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="password"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Password
                                </Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    placeholder="••••••••"
                                    className="h-9 border-slate-200 bg-white/80 px-3 text-sm shadow-sm transition-all hover:bg-white focus:border-blue-500 focus:ring-blue-500"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="password_confirmation"
                                    className="text-xs font-medium text-slate-600"
                                >
                                    Confirm Password
                                </Label>
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                    className="h-9 border-slate-200 bg-white/80 px-3 text-sm shadow-sm transition-all hover:bg-white focus:border-blue-500 focus:ring-blue-500"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-9 w-full bg-slate-900 text-sm font-medium text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 active:scale-[0.98]"
                                disabled={processing}
                                data-test="reset-password-button"
                            >
                                {processing && (
                                    <LoaderCircle className="mr-2 h-3 w-3 animate-spin" />
                                )}
                                Reset password
                            </Button>
                        </div>
                    )}
                </Form>
            </div>
        </div>
    );
}
