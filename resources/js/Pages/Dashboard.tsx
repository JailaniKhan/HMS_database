import { Head, Link } from '@inertiajs/react';
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
import { useState, useEffect, useRef } from 'react';

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
    fill?: string;
    payload?: Record<string, unknown>;
    midAngle?: number;
    startAngle?: number;
    endAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    cx?: number;
    cy?: number;
    radius?: number;
    [x: string]: unknown;
}

interface MonthlyData {
    month: string;
    visits: number;
}

interface DashboardProps {
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

export default function Dashboard(props: DashboardProps) {
    const {
        total_patients,
        total_doctors,
        appointments_today,
        revenue_today,
        recent_activities,
        monthly_data,
        department_data,
        flash
    } = props;

    const ResponsiveGridLayout = WidthProvider(Responsive);

    const [liveMode, setLiveMode] = useState(false);
    const [stats, setStats] = useState({
        total_patients,
        total_doctors,
        appointments_today,
        revenue_today
    });
    const [updated, setUpdated] = useState(false);

    const barChartRef = useRef<HTMLDivElement>(null);
    const pieChartRef = useRef<HTMLDivElement>(null);

    const { lastMessage } = useWebSocket(liveMode ? 'ws://localhost:6001/dashboard' : null, { shouldReconnect: () => true });

    useEffect(() => {
        if (lastMessage) {
            const data = JSON.parse(lastMessage.data);
            setStats(data);
            setUpdated(true);
            setTimeout(() => setUpdated(false), 2000);
        }
    }, [lastMessage]);

    useEffect(() => {
        console.log('Bar chart container width:', barChartRef.current?.offsetWidth, 'height:', barChartRef.current?.offsetHeight);
        console.log('Pie chart container width:', pieChartRef.current?.offsetWidth, 'height:', pieChartRef.current?.offsetHeight);
    }, []);

    // Calculate percentage changes (would come from API in real implementation)
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous * 100);
    };

    const patientChange = calculateChange(total_patients, total_patients * 0.92); // Mock calculation
    const doctorChange = calculateChange(total_doctors, total_doctors * 0.97);
    const appointmentChange = calculateChange(appointments_today, appointments_today * 0.95);
    const revenueChange = calculateChange(revenue_today, revenue_today * 0.92);

    // Define colors for the pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    // Layouts for customization
    const layouts = {
        lg: [
            {i: 'patients', x: 0, y: 0, w: 3, h: 2, minW: 3, minH: 2},
            {i: 'doctors', x: 3, y: 0, w: 3, h: 2, minW: 3, minH: 2},
            {i: 'appointments', x: 6, y: 0, w: 3, h: 2, minW: 3, minH: 2},
            {i: 'revenue', x: 9, y: 0, w: 3, h: 2, minW: 3, minH: 2}
        ],
        md: [
            {i: 'patients', x: 0, y: 0, w: 5, h: 2},
            {i: 'doctors', x: 5, y: 0, w: 5, h: 2},
            {i: 'appointments', x: 0, y: 2, w: 5, h: 2},
            {i: 'revenue', x: 5, y: 2, w: 5, h: 2}
        ]
    };

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

                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Hospital Management Dashboard</h1>
                            <p className="text-gray-600 mt-2">Welcome to the Hospital Management System</p>
                        </div>
                        <Button onClick={() => setLiveMode(!liveMode)} variant="outline" className="flex items-center">
                            {liveMode ? <ZapOff className="h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                            {liveMode ? 'Disable Live Mode' : 'Enable Live Mode'}
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <ResponsiveGridLayout layouts={layouts} breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480}} cols={{lg: 12, md: 10, sm: 6, xs: 4}} rowHeight={120} isDraggable={true} isResizable={false} className="mb-8">
                        <div key="patients">
                            <motion.div animate={updated ? {scale: [1, 1.05, 1]} : {}} transition={{duration: 0.5}}>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                                        <div className="p-3 rounded-full bg-blue-100" aria-hidden="true">
                                            <UserPlus className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold" aria-label={`Total patients: ${stats.total_patients}`}>
                                            {stats.total_patients}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            {patientChange >= 0 ? (
                                                <TrendingUp className="h-3 w-3 text-green-500 mr-1" aria-hidden="true" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-500 mr-1" aria-hidden="true" />
                                            )}
                                            <span className={patientChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {patientChange >= 0 ? '+' : ''}{patientChange.toFixed(1)}% from last month
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        <div key="doctors">
                            <motion.div animate={updated ? {scale: [1, 1.05, 1]} : {}} transition={{duration: 0.5}}>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                                        <div className="p-3 rounded-full bg-green-100" aria-hidden="true">
                                            <Stethoscope className="h-6 w-6 text-green-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold" aria-label={`Total doctors: ${stats.total_doctors}`}>
                                            {stats.total_doctors}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            {doctorChange >= 0 ? (
                                                <TrendingUp className="h-3 w-3 text-green-500 mr-1" aria-hidden="true" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-500 mr-1" aria-hidden="true" />
                                            )}
                                            <span className={doctorChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {doctorChange >= 0 ? '+' : ''}{doctorChange.toFixed(1)}% from last month
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        <div key="appointments">
                            <motion.div animate={updated ? {scale: [1, 1.05, 1]} : {}} transition={{duration: 0.5}}>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
                                        <div className="p-3 rounded-full bg-yellow-100" aria-hidden="true">
                                            <Calendar className="h-6 w-6 text-yellow-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold" aria-label={`Appointments today: ${stats.appointments_today}`}>
                                            {stats.appointments_today}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            {appointmentChange >= 0 ? (
                                                <TrendingUp className="h-3 w-3 text-green-500 mr-1" aria-hidden="true" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-500 mr-1" aria-hidden="true" />
                                            )}
                                            <span className={appointmentChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {appointmentChange >= 0 ? '+' : ''}{appointmentChange.toFixed(1)}% from yesterday
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        <div key="revenue">
                            <motion.div animate={updated ? {scale: [1, 1.05, 1]} : {}} transition={{duration: 0.5}}>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
                                        <div className="p-3 rounded-full bg-purple-100" aria-hidden="true">
                                            <DollarSign className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold" aria-label={`Revenue today: ${stats.revenue_today}`}>
                                            ${stats.revenue_today}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 mt-1">
                                            {revenueChange >= 0 ? (
                                                <TrendingUp className="h-3 w-3 text-green-500 mr-1" aria-hidden="true" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-500 mr-1" aria-hidden="true" />
                                            )}
                                            <span className={revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% from yesterday
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </ResponsiveGridLayout>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Charts Section */}
                        <div className="space-y-6">
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
                                                    label={(props) => {
                                                        const { name, percent } = props;
                                                        return name ? `${name} ${(percent ? (percent * 100).toFixed(0) : '0')}%` : '';
                                                    }}
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
                                            <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                                                <div className={`p-2 rounded-full ${activity.type === 'patient' ? 'bg-blue-100' : activity.type === 'appointment' ? 'bg-yellow-100' : activity.type === 'bill' ? 'bg-purple-100' : 'bg-green-100'}`}>
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

                            {/* Quick Access Buttons */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                    <CardDescription>Access important features quickly</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <Link href="/patients/create" className="block">
                                            <Button className="w-full h-14 flex flex-col items-center justify-center">
                                                <UserPlus className="h-5 w-5 mb-1" />
                                                <span className="text-sm">New Patient</span>
                                            </Button>
                                        </Link>
                                        <Link href="/appointments/create" className="block">
                                            <Button className="w-full h-14 flex flex-col items-center justify-center">
                                                <Calendar className="h-5 w-5 mb-1" />
                                                <span className="text-sm">Book Appointment</span>
                                            </Button>
                                        </Link>
                                        <Link href="/doctors/create" className="block">
                                            <Button className="w-full h-14 flex flex-col items-center justify-center">
                                                <Stethoscope className="h-5 w-5 mb-1" />
                                                <span className="text-sm">New Doctor</span>
                                            </Button>
                                        </Link>
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
