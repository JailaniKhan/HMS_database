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
    AlertTriangle,
    Shield,
    Lock,
} from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { type NavItem } from '@/types';
import { ReactNode, useMemo, useCallback } from 'react';

interface HospitalLayoutProps {
    header?: ReactNode;
    children: ReactNode;
}

function usePermissionChecker() {
    const page = usePage();
    
    // Get auth directly from Inertia props - available during SSR
    const auth = page.props.auth;
    const user = auth?.user;
    
    // More robust authentication check
    const isAuthenticated = !!(user && user.id);
    
    const hasPermission = useCallback((permission: string): boolean => {
        // If user is not authenticated, deny all permission checks
        if (!isAuthenticated) {
            return false;
        }
        
        const userPermissions = user?.permissions || [];
        const userRole = user?.role;
        
        // Super Admin bypass - check for various formats
        if (userRole === 'Super Admin' || 
            userRole === 'super admin' || 
            userRole?.toLowerCase() === 'super admin' ||
            userRole === 'super-admin') {
            return true;
        }
        
        // Also check if user has isSuperAdmin flag (snake_case from PHP)
        if (user?.is_super_admin === true) {
            return true;
        }
        
        return userPermissions.includes(permission);
    }, [user, isAuthenticated]);

    return { hasPermission, isAuthenticated, user };
}

const footerNavItems: NavItem[] = [

];

export default function HospitalLayout({ header, children }: HospitalLayoutProps) {
    const { hasPermission, isAuthenticated } = usePermissionChecker();
    
    const filteredNavItems = useMemo(() => {
        const allNavItems: (NavItem & { permission?: string })[] = [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Patients',
                href: '/patients',
                icon: Users,
            },
            {
                title: 'Doctors',
                href: '/doctors',
                icon: User,
            },
            {
                title: 'Reception',
                href: '/appointments/dashboard',
                icon: Calendar,
                items: [
                    {
                        title: 'Dashboard',
                        href: '/appointments/dashboard',
                        icon: LayoutGrid,
                    },
                    {
                        title: 'Reception',
                        href: '/appointments',
                        icon: Calendar,
                    },
                    {
                        title: 'Department Services',
                        href: '/departments/services',
                        icon: Package,
                    },
                ],
            },
            {
                title: 'Departments',
                href: '/departments',
                icon: Building,
            },
            // {
            //     title: 'Billing',
            //     href: '/billing',
            //     icon: Building,
            //     items: [
            //         {
            //             title: 'Dashboard',
            //             href: '/billing/parts/dashboard',
            //             icon: LayoutGrid,
            //         },
            //         {
            //             title: 'Create Bill',
            //             href: '/billing',
            //             icon: FileText,
            //         },
            //         {
            //             title: 'Bill Parts',
            //             href: '/billing/parts',
            //             icon: List,
            //         },
            //         {
            //             title: 'Payments',
            //             href: '/payments',
            //             icon: FileText,
            //         },
            //         {
            //             title: 'Reports',
            //             href: '/reports/billing',
            //             icon: FileBarChart,
            //         },
            //     ],
            // },
            {
                title: 'Pharmacy',
                href: '/pharmacy',
                icon: Pill,
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
                title: 'RBAC',
                href: '/admin/rbac',
                icon: Shield,
                items: [
                    {
                        title: 'Dashboard',
                        href: '/admin/rbac',
                        icon: LayoutGrid,
                    },
                    {
                        title: 'User Management',
                        href: '/admin',
                        icon: Users,
                    },
                  
                    {
                        title: 'Permissions',
                        href: '/admin/permissions',
                        icon: Lock,
                    },
                    {
                        title: 'User Assignments',
                        href: '/admin/rbac/user-assignments',
                        icon: Users,
                    },
                    {
                        title: 'Audit Logs',
                        href: '/admin/rbac/audit-logs',
                        icon: FileText,
                    },
                ],
            },
             {
                title: 'Reports',
                href: '/reports',
                icon: FileBarChart,
            },
            {
                title: 'Settings',
                href: '/settings',
                icon: Settings,
            },
        ];
        
        // If user is not authenticated, show all navigation items
        // If user is authenticated, filter by permissions
        if (!isAuthenticated) {
            return allNavItems;
        }
        
        return allNavItems.filter(item => {
            if (!item.permission) {
                return true; // Always show items without specific permission requirement
            }
            return hasPermission(item.permission);
        });
    }, [hasPermission, isAuthenticated]);
    
    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
                <SidebarHeader className="border-b border-sidebar-border/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors">
                                <div className="flex items-center gap-2 py-2">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-sidebar-foreground">HMS</span>
                                        <span className="text-xs text-muted-foreground">Hospital Management</span>
                                    </div>
                                </div>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent className="px-2 flex-1 overflow-y-auto">
                    {filteredNavItems.length > 0 ? (
                        <NavMain items={filteredNavItems} />
                    ) : (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                            No navigation items available
                        </div>
                    )}
                </SidebarContent>

                <SidebarFooter className="border-t border-sidebar-border/50 p-2">
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
            <SidebarInset className="bg-background">
                <header className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger />
                        {header}
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </AppShell>
    );
}
