import InputError from '@/components/input-error';
import { TermsModal } from '@/components/terms-modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { Form, Head, Link } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50">
            <Head title="Log in" />

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

            {/* Main Login Container */}
            <div className="relative z-10 w-full max-w-[320px] px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Please enter your details to sign in
                    </p>
                </div>

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-4"
                >
                    {({ processing, errors }) => (
                        <>
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
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="name@example.com"
                                        className="h-9 border-slate-200 bg-white/80 px-3 text-sm shadow-sm transition-all hover:bg-white focus:border-blue-500 focus:ring-blue-500"
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
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            name="password"
                                            required
                                            tabIndex={2}
                                            autoComplete="current-password"
                                            placeholder="••••••••"
                                            className="h-9 border-slate-200 bg-white/80 px-3 text-sm shadow-sm transition-all hover:bg-white focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="remember"
                                            name="remember"
                                            tabIndex={3}
                                            className="border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                                        />
                                        <Label
                                            htmlFor="remember"
                                            className="text-xs font-medium text-slate-600"
                                        >
                                            Remember me
                                        </Label>
                                    </div>
                                    {canResetPassword && (
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-2 h-9 w-full bg-slate-900 text-sm font-medium text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 active:scale-[0.98]"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && (
                                        <Spinner className="mr-2 h-3 w-3" />
                                    )}
                                    Sign in
                                </Button>
                            </div>
                        </>
                    )}
                </Form>

                {status && (
                    <div className="mt-6 rounded-md bg-green-50 p-3 text-center text-xs font-medium text-green-600 ring-1 ring-green-500/10">
                        {status}
                    </div>
                )}

                <div className="mt-8 text-center">
                    <TermsModal
                        trigger={
                            <button className="text-xs text-slate-400 hover:text-slate-600 hover:underline">
                                Terms and Conditions
                            </button>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
