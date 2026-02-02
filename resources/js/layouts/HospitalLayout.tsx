import { AppShell } from '@/components/app-shell';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {
    Users,
    Calendar,
    FileText,
    Pill,
    FlaskConical,
    LayoutGrid,
    Settings,
    User,
    FileBarChart,
    Building,
    Package,
    ClipboardList,
    Truck,
    AlertTriangle,
} from 'lucide-react';
import {  usePage } from '@inertiajs/react';
import { type NavItem } from '@/types';
import { ReactNode } from 'react';

interface HospitalLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

function usePermissionChecker() {
    try {
        const page = usePage();
        const user = page.props.auth?.user;
        const userPermissions = user?.permissions || [];
        const userRole = user?.role;

        const hasPermission = (permission: string): boolean => {
            // Super Admin bypass
            if (userRole === 'Super Admin') return true;
            return userPermissions.includes(permission);
        };

        return { hasPermission };
    } catch (error) {
        console.error('Error in usePage:', error);
        return { hasPermission: () => false };
    }
}

function useFilteredNavItems() {
    const { hasPermission } = usePermissionChecker();
    
    const allNavItems: (NavItem & { permission?: string })[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            permission: 'view-dashboard',
        },
        {
            title: 'Reports',
            href: '/reports',
            icon: FileBarChart,
            permission: 'view-reports',
        },
        {
            title: 'Patients',
            href: '/patients',
            icon: Users,
            permission: 'view-patients',
        },
        {
            title: 'Doctors',
            href: '/doctors',
            icon: User,
            permission: 'view-doctors',
        },
        {
            title: 'Appointments',
            href: '/appointments',
            icon: Calendar,
            permission: 'view-appointments',
        },
        {
            title: 'Billing',
            href: '/billing',
            icon: FileText,
            permission: 'view-billing',
        },
        {
            title: 'Pharmacy',
            href: '/pharmacy',
            icon: Pill,
            permission: 'view-pharmacy',
            items: [
                {
                    title: 'Dashboard',
                    href: '/pharmacy',
                    icon: LayoutGrid,
                },
                {
                    title: 'Medicines',
                    href: '/pharmacy/medicines',
                    icon: Pill,
                },
                {
                    title: 'Sales',
                    href: '/pharmacy/sales',
                    icon: FileText,
                },
                {
                    title: 'Stock',
                    href: '/pharmacy/stock',
                    icon: Package,
                },
                {
                    title: 'Purchase Orders',
                    href: '/pharmacy/purchase-orders',
                    icon: ClipboardList,
                },
                {
                    title: 'Suppliers',
                    href: '/pharmacy/suppliers',
                    icon: Truck,
                },
                {
                    title: 'Alerts',
                    href: '/pharmacy/alerts',
                    icon: AlertTriangle,
                },
                {
                    title: 'Reports',
                    href: '/pharmacy/reports',
                    icon: FileBarChart,
                },
            ],
        },
        {
            title: 'Laboratory',
            href: '/laboratory',
            icon: FlaskConical,
            permission: 'view-laboratory',
            items: [
                {
                    title: 'Dashboard',
                    href: '/laboratory',
                    icon: FlaskConical,
                },
                {
                    title: 'Lab Tests',
                    href: '/laboratory/lab-tests',
                    icon: FlaskConical,
                },
                {
                    title: 'Test Requests',
                    href: '/laboratory/lab-test-requests',
                    icon: FlaskConical,
                },
                {
                    title: 'Results',
                    href: '/laboratory/lab-test-results',
                    icon: FlaskConical,
                },
            ],
        },
        {
            title: 'Departments',
            href: '/departments',
            icon: Building,
            permission: 'view-departments',
        },

        {
            title: 'User Management',
            href: '/admin',
            icon: Users,
            permission: 'view-users',
        },
        {
            title: 'Settings',
            href: '/settings',
            icon: Settings,
            permission: 'view-settings',
        },
    ];
    
    return allNavItems.filter(item => {
        if (!item.permission) {
            return true; // Always show items without specific permission requirement
        }
        return hasPermission(item.permission);
    });
}

const footerNavItems: NavItem[] = [

];

export default function HospitalLayout({ header, children }: HospitalLayoutProps) {
    const filteredNavItems = useFilteredNavItems();
    
    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
                <SidebarHeader className="border-b border-sidebar-border/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors">
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-sidebar-foreground">HMS</span>
                                        <span className="text-xs text-muted-foreground">Hospital Management</span>
                                    </div>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent className="px-2">
                    <NavMain items={filteredNavItems} />
                </SidebarContent>

                <SidebarFooter className="border-t border-sidebar-border/50 p-2">
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="bg-gradient-to-br from-background via-background to-muted/20">
                <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-6 shadow-sm">
                    <SidebarTrigger className="-ml-1 hover:bg-accent transition-colors" />
                    {header && (
                        <div className="flex items-center gap-3">
                            <div className="h-6 w-[2px] bg-primary/30 rounded-full" />
                            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                {header}
                            </h2>
                        </div>
                    )}
                </header>
                <div className="flex-1 overflow-auto p-6 animate-fade-in">
                    <div className="mx-auto max-w-7xl space-y-6">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </AppShell>
    );
}
