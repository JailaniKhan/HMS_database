import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/layouts/HospitalLayout';

interface StatsData {
    date: string;
    daily_appointments: number;
    new_patients: number;
    appointments_by_status: Record<string, number>;
    total_appointments: number;
    total_patients: number;
}

interface DailyStatsProps {
    stats: StatsData;
}

const DailyStats = ({ stats }: DailyStatsProps) => {
    return (
        <Layout>
            <Head title="Daily Patient Statistics" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-6">Daily Patient Statistics</h1>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-blue-800">Date</h3>
                                    <p className="text-2xl">{stats.date}</p>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-green-800">Daily Appointments</h3>
                                    <p className="text-2xl">{stats.daily_appointments}</p>
                                </div>
                                
                                <div className="bg-yellow-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-yellow-800">New Patients</h3>
                                    <p className="text-2xl">{stats.new_patients}</p>
                                </div>
                                
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold text-purple-800">Total Patients</h3>
                                    <p className="text-2xl">{stats.total_patients}</p>
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">Appointments by Status</h2>
                                <div className="space-y-2">
                                    {Object.entries(stats.appointments_by_status).map(([status, count]) => (
                                        <div key={status} className="flex items-center">
                                            <span className="w-32 capitalize">{status.replace('_', ' ')}</span>
                                            <div className="flex-1 h-6 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${
                                                        status === 'scheduled' ? 'bg-blue-500' : 
                                                        status === 'completed' ? 'bg-green-500' : 
                                                        status === 'cancelled' ? 'bg-red-500' : 
                                                        'bg-gray-500'
                                                    }`}
                                                    style={{ width: `${(count / stats.daily_appointments) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="ml-2 w-8">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-4">Summary</h2>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p>Total Appointments: {stats.total_appointments}</p>
                                    <p>Daily Appointments: {stats.daily_appointments}</p>
                                    <p>New Patients Today: {stats.new_patients}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DailyStats;