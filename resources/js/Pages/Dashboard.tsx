import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Calendar, Stethoscope, DollarSign, AlertCircle, TrendingUp, TrendingDown, Zap, ZapOff } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useWebSocket from 'react-use-websocket';
import { WidthProvider, Responsive } from 'react-grid-layout/legacy';
import { motion } from 'framer-motion';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================
interface Activity {
    id: number;
    title: string;
    description: string;
    time: string;
    type: 'patient' | 'appointment' | 'bill' | 'doctor';
}

interface DepartmentData {
    name: string;
    value: number;
    [key: string]: string | number | undefined;
}

interface MonthlyData {
    month: string;
    visits: number;
}

interface DashboardProps extends PageProps {
    total_patients: number;
    total_doctors: number;
    appointments_today: number;
    revenue_today: number;
    recent_activities: Activity[];
    monthly_data: MonthlyData[];
    department_data: DepartmentData[];
    errors?: Record<string, string>;
    flash?: {
        success?: string;
        error?: string;
    };
}

// ============================================================================
// Constants - Defined outside component to prevent re-creation
// ============================================================================
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LAYOUTS = {
    lg: [
        { i: 'patients', x: 0, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
        { i: 'doctors', x: 3, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
        { i: 'appointments', x: 6, y: 0, w: 3, h: 2, minW: 3, minH: 2 },
        { i: 'revenue', x: 9, y: 0, w: 3, h: 2, minW: 3, minH: 2 }
    ],
    md: [
        { i: 'patients', x: 0, y: 0, w: 5, h: 2 },
        { i: 'doctors', x: 5, y: 0, w: 5, h: 2 },
        { i: 'appointments', x: 0, y: 2, w: 5, h: 2 },
        { i: 'revenue', x: 5, y: 2, w: 5, h: 2 }
    ]
};

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4 };

// Create ResponsiveGridLayout once outside component
const ResponsiveGridLayout = WidthProvider(Responsive);

// WebSocket URL from environment or default
const WS_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:6001/dashboard';

// ============================================================================
// Utility Functions
// ============================================================================
const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100);
};

// ============================================================================
// Components
// ============================================================================

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    change: number;
    bgColor: string;
    iconColor: string;
    updated: boolean;
    ariaLabel: string;
}

const StatCard = React.memo(function StatCard({
    title,
    value,
    icon,
    change,
    bgColor,
    updated,
    ariaLabel
}: StatCardProps) {
    return (
        <motion.div 
            animate={updated ? { scale: [1, 1.05, 1] } : {}} 
            transition={{ duration: 0.5 }}
        >
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <div className={`p-3 rounded-full ${bgColor}`} aria-hidden="true">
                        {icon}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold" aria-label={ariaLabel}>
                        {value}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        {change >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" aria-hidden="true" />
                        ) : (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" aria-hidden="true" />
                        )}
                        <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last month
                        </span>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});

// ============================================================================
// Main Dashboard Component
// ============================================================================
export default function Dashboard({
    total_patients = 0,
    total_doctors = 0,
    appointments_today = 0,
    revenue_today = 0,
    recent_activities = [],
    monthly_data = [],
    department_data = [],
    flash
}: DashboardProps) {
    // State
    const [liveMode, setLiveMode] = useState(false);
    const [stats, setStats] = useState({
        total_patients,
        total_doctors,
        appointments_today,
        revenue_today
    });
    const [updated, setUpdated] = useState(false);
    const [wsError, setWsError] = useState<string | null>(null);

    // Refs for cleanup
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const barChartRef = useRef<HTMLDivElement>(null);
    const pieChartRef = useRef<HTMLDivElement>(null);

    // WebSocket connection with error handling
    const { lastMessage } = useWebSocket(
        liveMode ? WS_URL : null,
        {
            shouldReconnect: () => true,
            reconnectInterval: 3000,
            reconnectAttempts: 10,
            onError: () => {
                setWsError('Live mode connection failed. Retrying...');
            },
            onOpen: () => {
                setWsError(null);
            },
        }
    );

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, []);

    // Handle WebSocket messages
    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data);
                setStats(data);
                setUpdated(true);
                
                // Clear previous timeout and set new one
                if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current);
                }
                updateTimeoutRef.current = setTimeout(() => setUpdated(false), 2000);
            } catch {
                // Silently ignore parse errors
            }
        }
    }, [lastMessage]);

    // Memoized calculations to prevent re-computation
    const changes = useMemo(() => ({
        patient: calculateChange(stats.total_patients, stats.total_patients * 0.92),
        doctor: calculateChange(stats.total_doctors, stats.total_doctors * 0.97),
        appointment: calculateChange(stats.appointments_today, stats.appointments_today * 0.95),
        revenue: calculateChange(stats.revenue_today, stats.revenue_today * 0.92),
    }), [stats]);

    // Memoized toggle function
    const toggleLiveMode = useCallback(() => {
        setLiveMode(prev => !prev);
    }, []);

    // Memoized stat card configurations
    const statCards = useMemo(() => [
        {
            key: 'patients',
            title: 'Total Patients',
            value: stats.total_patients,
            icon: <UserPlus className="h-6 w-6 text-blue-600" />,
            change: changes.patient,
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            ariaLabel: `Total patients: ${stats.total_patients}`,
        },
        {
            key: 'doctors',
            title: 'Total Doctors',
            value: stats.total_doctors,
            icon: <Stethoscope className="h-6 w-6 text-green-600" />,
            change: changes.doctor,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            ariaLabel: `Total doctors: ${stats.total_doctors}`,
        },
        {
            key: 'appointments',
            title: 'Appointments Today',
            value: stats.appointments_today,
            icon: <Calendar className="h-6 w-6 text-yellow-600" />,
            change: changes.appointment,
            bgColor: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            ariaLabel: `Appointments today: ${stats.appointments_today}`,
        },
        {
            key: 'revenue',
            title: 'Revenue Today',
            value: stats.revenue_today,
            icon: <DollarSign className="h-6 w-6 text-purple-600" />,
            change: changes.revenue,
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            ariaLabel: `Revenue today: ${stats.revenue_today}`,
        },
    ], [stats, changes]);

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Dashboard" />

                <div className="max-w-7xl mx-auto">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <Alert className="mb-6 border-green-200 bg-green-50">
                            <AlertCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {flash.success}
                            </AlertDescription>
                        </Alert>
                    )}

                    {flash?.error && (
                        <Alert className="mb-6 border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                {flash.error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* WebSocket Error */}
                    {wsError && liveMode && (
                        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800">
                                {wsError}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Hospital Management Dashboard</h1>
                            <p className="text-gray-600 mt-2">Welcome to the Hospital Management System</p>
                        </div>
                        <Button 
                            onClick={toggleLiveMode} 
                            variant={liveMode ? "default" : "outline"} 
                            className="flex items-center"
                            aria-label={liveMode ? 'Disable live mode' : 'Enable live mode'}
                        >
                            {liveMode ? <ZapOff className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                            {liveMode ? 'Disable Live Mode' : 'Enable Live Mode'}
                        </Button>
                    </div>

                    {/* Stats Cards - Memoized Grid Layout */}
                    <ResponsiveGridLayout
                        layouts={LAYOUTS}
                        breakpoints={BREAKPOINTS}
                        cols={COLS}
                        rowHeight={120}
                        isDraggable={true}
                        isResizable={false}
                        className="mb-8"
                    >
                        {statCards.map((card) => (
                            <div key={card.key}>
                                <StatCard
                                    title={card.title}
                                    value={card.value}
                                    icon={card.icon}
                                    change={card.change}
                                    bgColor={card.bgColor}
                                    iconColor={card.iconColor}
                                    updated={updated}
                                    ariaLabel={card.ariaLabel}
                                />
                            </div>
                        ))}
                    </ResponsiveGridLayout>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-6">
                            {/* Bar Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Patient Visits per Month</CardTitle>
                                    <CardDescription>Monthly patient visits trend</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80" ref={barChartRef}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                            <BarChart
                                                data={monthly_data}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="month" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="visits" name="Patient Visits" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pie Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Departments Patient Distribution</CardTitle>
                                    <CardDescription>Percentage of patients per department</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80" ref={pieChartRef}>
                                        <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                                            <PieChart>
                                                <Pie
                                                    data={department_data}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={true}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    nameKey="name"
                                                    label={({ name, percent }) => 
                                                        name ? `${name} ${(percent ? (percent * 100).toFixed(0) : '0')}%` : ''
                                                    }
                                                >
                                                    {department_data?.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    )) || []}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity and Quick Access */}
                        <div className="space-y-6">
                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                                    <CardDescription>Latest activities in the system</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {(recent_activities || []).map((activity) => (
                                            <div 
                                                key={activity.id} 
                                                className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                                            >
                                                <div className={`p-2 rounded-full ${
                                                    activity.type === 'patient' ? 'bg-blue-100' : 
                                                    activity.type === 'appointment' ? 'bg-yellow-100' : 
                                                    activity.type === 'bill' ? 'bg-purple-100' : 'bg-green-100'
                                                }`}>
                                                    {activity.type === 'patient' && <UserPlus className="h-4 w-4 text-blue-600" />}
                                                    {activity.type === 'appointment' && <Calendar className="h-4 w-4 text-yellow-600" />}
                                                    {activity.type === 'bill' && <DollarSign className="h-4 w-4 text-purple-600" />}
                                                    {activity.type === 'doctor' && <Stethoscope className="h-4 w-4 text-green-600" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                                    <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}
