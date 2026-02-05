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
    List,
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
    
    // Debug logging in development
    if (import.meta.env.DEV) {
        console.log('Auth debug:', { 
            authExists: !!auth, 
            userExists: !!user, 
            userId: user?.id,
            userName: user?.name,
            userRole: user?.role,
            permissions: user?.permissions,
            isAuthenticated 
        });
    }
    
    const hasPermission = useCallback((permission: string): boolean => {
        // If user is not authenticated, deny all permission checks
        if (!isAuthenticated) {
            return false;
        }
        
        const userPermissions = user?.permissions || [];
        const userRole = user?.role;
        
        // Super Admin bypass
        if (userRole === 'Super Admin') return true;
        return userPermissions.includes(permission);
    }, [user, isAuthenticated]);

    return { hasPermission, isAuthenticated, user };
}

const footerNavItems: NavItem[] = [

];

export default function HospitalLayout({ header, children }: HospitalLayoutProps) {
    const page = usePage();
    const { hasPermission, isAuthenticated, user } = usePermissionChecker();
    
    // Debug logging in development
    if (import.meta.env.DEV) {
        console.log('HospitalLayout debug:', { 
            pagePropsKeys: Object.keys(page.props),
            authPropExists: 'auth' in page.props,
            isAuthenticated,
            userExists: !!user,
            userId: user?.id,
            userRole: user?.role
        });
    }
    
    const filteredNavItems = useMemo(() => {
        const allNavItems: (NavItem & { permission?: string })[] = [
            {
                title: 'Dashboard',
                href: '/dashboard',
                icon: LayoutGrid,
            },
            {
                title: 'Reports',
                href: '/reports',
                icon: FileBarChart,
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
                title: 'Appointments',
                href: '/appointments',
                icon: Calendar,
            },
            {
                title: 'Billing',
                href: '/billing',
                icon: Building,
                items: [
                    {
                        title: 'Dashboard',
                        href: '/billing/parts/dashboard',
                        icon: LayoutGrid,
                    },
                    {
                        title: 'All Bills',
                        href: '/billing',
                        icon: FileText,
                    },
                    {
                        title: 'Bill Parts',
                        href: '/billing/parts',
                        icon: List,
                    },
                    {
                        title: 'Payments',
                        href: '/payments',
                        icon: FileText,
                    },
                    {
                        title: 'Insurance Claims',
                        href: '/insurance/claims',
                        icon: FileText,
                    },
                    {
                        title: 'Insurance Providers',
                        href: '/insurance/providers',
                        icon: FileText,
                    },
                    {
                        title: 'Patient Insurance',
                        href: '/billing/patient-insurance',
                        icon: FileText,
                    },
                    {
                        title: 'Reports',
                        href: '/reports/billing',
                        icon: FileBarChart,
                    },
                ],
            },
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
            },

            {
                title: 'User Management',
                href: '/admin',
                icon: Users,
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
