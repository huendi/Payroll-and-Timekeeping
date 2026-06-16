import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;
    const [sidebarOpen, setSidebarOpen] = useState(isOpen);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        // Check if desktop on mount
        const checkDesktop = () => {
            const desktop = window.innerWidth >= 1024;
            setIsDesktop(desktop);
            // Force open on desktop, respect preference on mobile
            setSidebarOpen(desktop ? true : isOpen);
        };

        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, [isOpen]);

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarProvider defaultOpen={sidebarOpen}>{children}</SidebarProvider>
    );
}
