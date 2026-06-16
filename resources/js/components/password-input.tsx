import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Input } from './ui/input';

interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export default function PasswordInput({ label, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <Input
                type={showPassword ? 'text' : 'password'}
                {...props}
                className="pr-10"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 hover:text-slate-700"
            >
                {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
            </button>
        </div>
    );
}
