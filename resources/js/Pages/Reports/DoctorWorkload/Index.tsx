import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/layouts/HospitalLayout';

interface WorkloadData {
    date: string;
    workload: Array<{
        name: string;
        specialization: string;
        appointment_count: number;
    }>;
}

interface DoctorWorkloadProps {
    workload: WorkloadData;
}

const DoctorWorkload = ({ workload }: DoctorWorkloadProps) => {
    return (
        <Layout>
            <Head title="Doctor Workload View" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            <h1 className="text-2xl font-bold mb-6">Doctor Workload View</h1>
                            
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">Date: {workload.date}</h2>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment Count</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workload Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {workload.workload.map((doctor, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap">{doctor.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{doctor.specialization}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">{doctor.appointment_count}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        doctor.appointment_count > 10 ? 'bg-red-100 text-red-800' :
                                                        doctor.appointment_count > 5 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {doctor.appointment_count > 10 ? 'High' :
                                                         doctor.appointment_count > 5 ? 'Medium' : 'Low'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {workload.workload.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No appointments scheduled for {workload.date}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DoctorWorkload;