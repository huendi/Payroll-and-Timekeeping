import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { type SharedData } from '@/types';
import { router, useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProfileEditModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfileEditModal({
    open,
    onOpenChange,
}: ProfileEditModalProps) {
    const { auth } = usePage<SharedData>().props;
    const { data, setData, processing, errors } = useForm({
        avatar: null as File | null,
        password: '',
        password_confirmation: '',
    });
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (open && auth.user.avatar) {
            setImagePreview(auth.user.avatar);
        } else if (!open) {
            setImagePreview(null);
        }
    }, [open, auth.user.avatar]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.avatar && !data.password) {
            toast.error('Please select an image or enter a password');
            return;
        }

        // Use Inertia's post method with proper file handling
        router.post(
            '/profile/update',
            {
                avatar: data.avatar || undefined,
                password: data.password || undefined,
                password_confirmation: data.password_confirmation || undefined,
            },
            {
                forceFormData: true,
                onSuccess: () => {
                    onOpenChange(false);
                    setData({
                        avatar: null,
                        password: '',
                        password_confirmation: '',
                    });
                    setServerErrors({});
                    toast.success('Profile updated successfully');
                    // Reload the page to refresh user data
                    window.location.reload();
                },
                onError: (errors: any) => {
                    console.error('Update errors:', errors);
                    setServerErrors(errors);

                    // Show first error as toast
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') {
                        toast.error(firstError);
                    } else {
                        toast.error('Failed to update profile');
                    }
                },
            },
        );
    };

    console.log(auth.user);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Update your profile image and password
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium">
                            Profile Image
                        </label>

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="flex justify-center">
                                <div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-blue-200 bg-blue-50">
                                    <img
                                        src={
                                            imagePreview.startsWith('data:')
                                                ? imagePreview
                                                : `/${imagePreview}`
                                        }
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {/* File Input */}
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 px-4 py-3 transition-colors hover:bg-blue-50">
                            <Upload className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">
                                {data.avatar ? 'Change Image' : 'Choose Image'}
                            </span>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                disabled={processing}
                                className="hidden"
                            />
                        </label>

                        {data.avatar && (
                            <p className="text-center text-xs text-gray-500">
                                {data.avatar.name}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            New Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Leave blank to keep current password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                disabled={processing}
                                className="pr-10"
                            />
                            {data.password && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={processing}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                        {data.password && data.password.length < 8 && (
                            <p className="text-xs text-amber-600">
                                Password must be at least 8 characters
                            </p>
                        )}
                        {(errors.password || serverErrors.password) && (
                            <p className="text-xs text-red-500">
                                {errors.password || serverErrors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Confirm new password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                disabled={processing}
                                className="pr-10"
                            />
                            {data.password_confirmation && (
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    disabled={processing}
                                >
                                    {showConfirm ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                        {data.password &&
                            data.password_confirmation &&
                            data.password !== data.password_confirmation && (
                                <p className="text-xs text-amber-600">
                                    Passwords do not match
                                </p>
                            )}
                        {(errors.password_confirmation ||
                            serverErrors.password_confirmation) && (
                            <p className="text-xs text-red-500">
                                {errors.password_confirmation ||
                                    serverErrors.password_confirmation}
                            </p>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
