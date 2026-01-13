import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/layouts/HospitalLayout';

interface TrendData {
    date: string;
    day_name: string;
    appointments: number;
    new_patients: number;
}

interface WeeklyTrendProps {
    trend: TrendData[];
}

const WeeklyTrend = ({ trend }: WeeklyTrendProps) => {
    // Calculate max values for scaling the chart
    const maxAppointments = Math.max(...trend.map(item => item.appointments), 1);
    const maxNewPatients = Math.max(...trend.map(item => item.new_patients), 1);
    
    return (
        <Layout>
            <Head title="Weekly Patient Trend" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-6">Weekly Patient Trend</h1>
                            
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold mb-4">Appointments vs New Patients (Last 7 Days)</h2>
                                
                                {/* Chart visualization */}
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {trend.map((day, index) => (
                                        <div key={index} className="flex flex-col items-center">
                                            <div className="text-xs mb-1">{day.day_name}</div>
                                            <div className="flex flex-col items-center w-full">
                                                <div 
                                                    className="w-6 bg-blue-500 rounded-t mb-1"
                                                    style={{ height: `${(day.appointments / maxAppointments) * 60}px` }}
                                                ></div>
                                                <div 
                                                    className="w-6 bg-green-500 rounded-t"
                                                    style={{ height: `${(day.new_patients / maxNewPatients) * 60}px` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs mt-1">{day.appointments}/{day.new_patients}</div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="flex justify-center space-x-4 mb-4">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-blue-500 mr-2"></div>
                                        <span className="text-sm">Appointments</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-green-500 mr-2"></div>
                                        <span className="text-sm">New Patients</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Patients</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {trend.map((day, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">{day.date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{day.day_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{day.appointments}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{day.new_patients}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WeeklyTrend;