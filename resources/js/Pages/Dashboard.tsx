import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Calendar, Stethoscope, DollarSign } from 'lucide-react';
import { Link } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
}

export default function Dashboard(props: DashboardProps) {
    const { 
        total_patients, 
        total_doctors, 
        appointments_today, 
        revenue_today, 
        recent_activities, 
        monthly_data, 
        department_data 
    } = props;

    // Define colors for the pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Dashboard" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Hospital Management Dashboard</h1>
                        <p className="text-gray-600 mt-2">Welcome to the Hospital Management System</p>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                                <div className="p-3 rounded-full bg-blue-100">
                                    <UserPlus className="h-6 w-6 text-blue-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{total_patients}</div>
                                <p className="text-xs text-gray-500">+12% from last month</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                                <div className="p-3 rounded-full bg-green-100">
                                    <Stethoscope className="h-6 w-6 text-green-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{total_doctors}</div>
                                <p className="text-xs text-gray-500">+3% from last month</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Appointments Today</CardTitle>
                                <div className="p-3 rounded-full bg-yellow-100">
                                    <Calendar className="h-6 w-6 text-yellow-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{appointments_today}</div>
                                <p className="text-xs text-gray-500">+5% from yesterday</p>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
                                <div className="p-3 rounded-full bg-purple-100">
                                    <DollarSign className="h-6 w-6 text-purple-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${revenue_today}</div>
                                <p className="text-xs text-gray-500">+8% from yesterday</p>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Charts Section */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Patient Visits per Month</CardTitle>
                                    <CardDescription>Monthly patient visits trend</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
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
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
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