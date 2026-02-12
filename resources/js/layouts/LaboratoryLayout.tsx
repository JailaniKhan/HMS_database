import { AppShell } from '@/components/app-shell';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { type NavItem } from '@/types';
import { usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Beaker,
    CheckCircle2,
    ClipboardList,
    Clock,
    FileText,
    FlaskConical,
    LayoutGrid,
    Microscope,
    Plus,
    Zap,
    Activity,
    Droplets,
    AlertCircle,
    Building2,
} from 'lucide-react';
import { ReactNode, useMemo, useCallback } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface LaboratoryLayoutProps {
    header?: ReactNode;
    children: ReactNode;
    showQuickActions?: boolean;
    alerts?: {
        criticalResults?: number;
        statRequests?: number;
        abnormalResults?: number;
        pendingRequests?: number;
    };
}

function usePermissionChecker() {
    const page = usePage();
    const auth = page.props.auth;
    const user = auth?.user;
    const isAuthenticated = !!(user && user.id);

    const hasPermission = useCallback((permission: string): boolean => {
        if (!isAuthenticated) {
            return false;
        }

        const userPermissions = user?.permissions || [];
        const userRole = user?.role;

        if (userRole === 'Super Admin' ||
            userRole === 'super admin' ||
            userRole?.toLowerCase() === 'super admin' ||
            userRole === 'super-admin') {
            return true;
        }

        if (user?.is_super_admin === true) {
            return true;
        }

        return userPermissions.includes(permission);
    }, [user, isAuthenticated]);

    return { hasPermission, isAuthenticated, user };
}

// Laboratory-specific navigation items
const laboratoryNavItems: (NavItem & { permission?: string })[] = [
    {
        title: 'Hospital Dashboard',
        href: '/dashboard',
        icon: Building2,
    },
    {
        title: 'Dashboard',
        href: '/laboratory',
        icon: LayoutGrid,
    },
    {
        title: 'Work Queue',
        href: '/laboratory/lab-test-requests?status=pending',
        icon: ClipboardList,
        items: [
            {
                title: 'Pending',
                href: '/laboratory/lab-test-requests?status=pending',
                icon: Clock,
            },
            {
                title: 'In Progress',
                href: '/laboratory/lab-test-requests?status=in_progress',
                icon: Activity,
            },
            {
                title: 'STAT Requests',
                href: '/laboratory/lab-test-requests?test_type=stat',
                icon: Zap,
            },
            {
                title: 'All Requests',
                href: '/laboratory/lab-test-requests',
                icon: ClipboardList,
            },
        ],
    },
    {
        title: 'Test Requests',
        href: '/laboratory/lab-test-requests',
        icon: ClipboardList,
        items: [
            {
                title: 'All Requests',
                href: '/laboratory/lab-test-requests',
                icon: ClipboardList,
            },
            {
                title: 'New Request',
                href: '/laboratory/lab-test-requests/create',
                icon: Plus,
            },
        ],
    },
    {
        title: 'Test Results',
        href: '/laboratory/lab-test-results',
        icon: FileText,
        items: [
            {
                title: 'All Results',
                href: '/laboratory/lab-test-results',
                icon: FileText,
            },
            {
                title: 'Add Result',
                href: '/laboratory/lab-test-results/create',
                icon: Plus,
            },
            {
                title: 'Critical Results',
                href: '/laboratory/lab-test-results?status=critical',
                icon: AlertTriangle,
            },
            {
                title: 'Abnormal Results',
                href: '/laboratory/lab-test-results?status=abnormal',
                icon: AlertCircle,
            },
        ],
    },
    {
        title: 'Lab Tests',
        href: '/laboratory/lab-tests',
        icon: FlaskConical,
        items: [
            {
                title: 'All Tests',
                href: '/laboratory/lab-tests',
                icon: FlaskConical,
            },
            {
                title: 'Add Test',
                href: '/laboratory/lab-tests/create',
                icon: Plus,
            },
            {
                title: 'Hematology',
                href: '/laboratory/lab-tests?category=hematology',
                icon: Droplets,
            },
            {
                title: 'Biochemistry',
                href: '/laboratory/lab-tests?category=biochemistry',
                icon: Beaker,
            },
            {
                title: 'Microbiology',
                href: '/laboratory/lab-tests?category=microbiology',
                icon: Microscope,
            },
        ],
    },
    {
        title: 'Quality Control',
        href: '/laboratory/quality-control',
        icon: CheckCircle2,
        permission: 'laboratory.quality.view',
    },
    {
        title: 'Reports',
        href: '/laboratory/reports',
        icon: FileText,
        permission: 'laboratory.reports.view',
        items: [
            {
                title: 'Overview',
                href: '/laboratory/reports',
                icon: FileText,
            },
    
        ],
    },
];

// Quick action buttons for laboratory operations
const quickActions = [
    {
        id: 'new-request',
        label: 'New Request',
        href: '/laboratory/lab-test-requests/create',
        icon: ClipboardList,
        color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
        id: 'add-result',
        label: 'Add Result',
        href: '/laboratory/lab-test-results/create',
        icon: FileText,
        color: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
        id: 'view-queue',
        label: 'View Queue',
        href: '/laboratory/lab-test-requests?status=pending',
        icon: Activity,
        color: 'bg-purple-600 hover:bg-purple-700',
    },
];

const footerNavItems: NavItem[] = [];

export default function LaboratoryLayout({
    header,
    children,
    showQuickActions = true,
    alerts = {},
}: LaboratoryLayoutProps) {
    const { hasPermission, isAuthenticated } = usePermissionChecker();

    const filteredNavItems = useMemo(() => {
        if (!isAuthenticated) {
            return laboratoryNavItems;
        }

        return laboratoryNavItems.filter(item => {
            if (!item.permission) {
                return true;
            }
            return hasPermission(item.permission);
        });
    }, [hasPermission, isAuthenticated]);

    // Determine if any critical alerts exist
    const hasCriticalAlerts = (alerts.criticalResults ?? 0) > 0;
    const hasStatRequests = (alerts.statRequests ?? 0) > 0;

    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border">
                <SidebarHeader className="border-b border-sidebar-border/50">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent transition-colors">
                                <Link href="/laboratory" className="flex items-center gap-2 py-2">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                                        <FlaskConical className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-sidebar-foreground">Laboratory</span>
                                        <span className="text-xs text-muted-foreground">Diagnostics Module</span>
                                    </div>
                                </Link>
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
                    {/* Quick Status Summary in Sidebar */}
                    {(hasCriticalAlerts || hasStatRequests) && (
                        <div className="mb-3 space-y-2 px-2">
                            {hasCriticalAlerts && (
                                <Link href="/laboratory/lab-test-results?status=critical">
                                    <div className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
                                        "bg-red-50 hover:bg-red-100 border border-red-200"
                                    )}>
                                        <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                                        <span className="flex-1 text-red-700 font-medium">
                                            {alerts.criticalResults} Critical
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-red-600" />
                                    </div>
                                </Link>
                            )}
                            {hasStatRequests && (
                                <Link href="/laboratory/lab-test-requests?test_type=stat">
                                    <div className={cn(
                                        "flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
                                        "bg-orange-50 hover:bg-orange-100 border border-orange-200"
                                    )}>
                                        <Zap className="h-4 w-4 text-orange-600 animate-pulse" />
                                        <span className="flex-1 text-orange-700 font-medium">
                                            {alerts.statRequests} STAT
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-orange-600" />
                                    </div>
                                </Link>
                            )}
                        </div>
                    )}
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>

            <SidebarInset className="bg-background">
                {/* Critical Alerts Banner */}
                {(hasCriticalAlerts || hasStatRequests) && (
                    <div className="px-6 pt-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            {(alerts.criticalResults ?? 0) > 0 && (
                                <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/5 border-red-500/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-red-700">
                                                    {alerts.criticalResults} Critical Result{alerts.criticalResults !== 1 ? 's' : ''} Requiring Attention
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Immediate physician notification required
                                                </p>
                                            </div>
                                            <Link href="/laboratory/lab-test-results?status=critical">
                                                <Button variant="outline" size="sm" className="border-red-500/30 text-red-700 hover:bg-red-50 shrink-0">
                                                    View
                                                    <ArrowRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {(alerts.statRequests ?? 0) > 0 && (
                                <Card className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 border-orange-500/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center animate-pulse">
                                                <Zap className="h-5 w-5 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-orange-700">
                                                    {alerts.statRequests} STAT Request{alerts.statRequests !== 1 ? 's' : ''} Pending
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Immediate processing required
                                                </p>
                                            </div>
                                            <Link href="/laboratory/lab-test-requests?test_type=stat">
                                                <Button variant="outline" size="sm" className="border-orange-500/30 text-orange-700 hover:bg-orange-50 shrink-0">
                                                    View
                                                    <ArrowRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {/* Header */}
                <header className="flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            {header}
                        </div>

                        {/* Quick Action Buttons */}
                        {showQuickActions && (
                            <div className="hidden md:flex items-center gap-2">
                                {quickActions.map((action) => (
                                    <Link key={action.id} href={action.href}>
                                        <Button
                                            size="sm"
                                            className={cn(
                                                "text-white gap-1.5 transition-all",
                                                action.color
                                            )}
                                        >
                                            <action.icon className="h-4 w-4" />
                                            <span>{action.label}</span>
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pending/Abnormal Stats Bar */}
                    {((alerts.pendingRequests ?? 0) > 0 || (alerts.abnormalResults ?? 0) > 0) && (
                        <div className="px-6 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {(alerts.pendingRequests ?? 0) > 0 && (
                                    <Link href="/laboratory/lab-test-requests?status=pending">
                                        <Badge className="bg-blue-500 hover:bg-blue-600 cursor-pointer">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {alerts.pendingRequests} Pending
                                        </Badge>
                                    </Link>
                                )}
                                {(alerts.abnormalResults ?? 0) > 0 && (
                                    <Link href="/laboratory/lab-test-results?status=abnormal">
                                        <Badge className="bg-amber-500 hover:bg-amber-600 cursor-pointer">
                                            <AlertCircle className="h-3 w-3 mr-1" />
                                            {alerts.abnormalResults} Abnormal
                                        </Badge>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </SidebarInset>
        </AppShell>
    );
}
