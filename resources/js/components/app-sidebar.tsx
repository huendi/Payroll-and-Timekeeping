import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    CalendarClock,
    ChevronRight,
    DollarSign,
    FileText,
    Folder,
    Gift,
    LayoutGrid,
    Settings,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from './app-logo';
import { TermsModal } from './terms-modal';

const settingsItems: NavItem[] = [
    {
        title: 'Calendar Holiday',
        href: '/calendar',
        icon: Calendar,
    },
    {
        title: 'Cut-off Schedule',
        href: '/schedule',
        icon: CalendarClock,
    },
    {
        title: 'Deduction Settings',
        href: '/deduction-settings',
        icon: Settings,
    },
    {
        title: 'Premium Setup',
        href: '/premium-setup',
        icon: DollarSign,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const page = usePage();
    const user = useAuth();
    const {
        pendingApprovalCount,
        pendingPayslipCount,
        payslipsNeedingIncentivesCount,
        rejectedNotArchivedCount,
    } = page.props as any;

    // Build main nav items based on user role
    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
    ];

    // HR Management - Admin only
    if (user?.role === 'admin') {
        mainNavItems.push({
            title: 'Staff Management',
            href: '/staff',
            icon: Users,
        });
    }

    // Common items for both roles
    mainNavItems.push(
        {
            title: 'Employees',
            href: '/employees',
            icon: Users,
        },
    );

    // Finance & Admin items (Payroll, Payslips, etc.)
    if (user?.role === 'admin' || user?.role === 'finance') {
        mainNavItems.push(
            {
                title: 'Payroll',
                href: '/payroll',
                icon: FileText,
                badge:
                    user?.role === 'admin'
                        ? pendingApprovalCount > 0 || pendingPayslipCount > 0
                            ? (pendingApprovalCount || 0) +
                              (pendingPayslipCount || 0)
                            : null
                        : user?.role === 'finance'
                          ? rejectedNotArchivedCount > 0
                              ? rejectedNotArchivedCount
                              : null
                          : null,
            },
            {
                title: 'Payslips',
                href: '/payslips',
                icon: DollarSign,
                badge:
                    user?.role === 'admin' && payslipsNeedingIncentivesCount > 0
                        ? payslipsNeedingIncentivesCount
                        : null,
            },
            {
                title: '13th Month Pay',
                href: '/thirteenth-month-pay',
                icon: Gift,
            },
            {
                title: 'Reports',
                href: '/reports',
                icon: FileText,
            },
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                <SidebarGroup className="mt-2 px-2 py-0">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                onClick={() => setSettingsOpen(!settingsOpen)}
                                className="group relative flex items-center justify-between transition-colors hover:bg-sidebar-accent"
                            >
                                <div className="flex items-center gap-2">
                                    <Settings className="h-4 w-4" />
                                    <span className="font-medium">
                                        Settings
                                    </span>
                                </div>
                                <ChevronRight
                                    className={`h-4 w-4 transition-all duration-300 ease-in-out ${
                                        settingsOpen ? 'rotate-90' : ''
                                    }`}
                                />
                            </SidebarMenuButton>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                    settingsOpen
                                        ? 'max-h-96 opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                <SidebarMenu className="mt-1 ml-4 space-y-0.5 border-l-2 border-sidebar-border pl-3">
                                    {settingsItems.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={page.url.startsWith(
                                                    item.href as string,
                                                )}
                                                tooltip={{
                                                    children: item.title,
                                                }}
                                                className="h-8 text-xs transition-colors hover:bg-sidebar-accent"
                                            >
                                                <Link href={item.href} prefetch>
                                                    {item.icon && (
                                                        <item.icon className="h-3 w-3" />
                                                    )}
                                                    <span className="text-xs">
                                                        {item.title}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </div>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                {/* <NavFooter items={footerNavItems} className="mt-auto" /> */}
                <div className="px-4 py-2">
                    <TermsModal />
                </div>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
