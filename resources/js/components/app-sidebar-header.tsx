import { Breadcrumbs } from '@/components/breadcrumbs';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { url } = usePage();
    const currentPath = url.split('?')[0];

    const hiddenPaths = [
        '/',
        '/dashboard',
        '/employees',
        '/payroll',
        '/payslips',
        '/thirteenth-month-pay',
        '/reports',
        '/hr',
        '/settings',
        '/departments',
        '/leave-types',
        '/premium-setup',
        '/deduction-settings',
        '/sss-brackets',
        '/tax-brackets',
        '/calendar',
        '/schedule',
        '/custom-deduction-types',
    ];

    // Hide back button only on index/archive pages, NOT on detail pages
    const shouldHideBackButton = hiddenPaths.includes(currentPath);

    const handleBack = () => {
        // Special case for Employee View: Escape tab history stack and go to index
        if (/^\/employees\/\d+$/.test(currentPath)) {
            router.visit('/employees');
            return;
        }

        // Special case for Archive pages: Go back to parent index
        if (currentPath.endsWith('/archive')) {
            const parentPath = currentPath.replace('/archive', '');
            router.visit(parentPath);
            return;
        }
        
        window.history.back();
    };

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                {!shouldHideBackButton && (
                    <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                )}
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
