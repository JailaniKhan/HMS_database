import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill } from 'lucide-react';
import PharmacyLayout from '@/layouts/PharmacyLayout';

export default function PharmacySalesReportIndex() {
    return (
        <PharmacyLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Pharmacy Sales Reports" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Pharmacy Sales Reports</h1>
                        <p className="text-gray-600 mt-2">View and generate pharmacy sales-related reports</p>
                    </div>
                    
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <div className="flex items-center space-x-3">
                                <div className="bg-purple-100 p-2 rounded-full">
                                    <Pill className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Pharmacy Sales Report</CardTitle>
                                    <CardDescription>Generate pharmacy sales and inventory reports</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-700">This section allows you to generate various pharmacy sales reports including:</p>
                            <ul className="list-disc pl-5 space-y-1 text-gray-600">
                                <li>Sales summaries</li>
                                <li>Top selling medicines</li>
                                <li>Inventory levels</li>
                                <li>Expired medicine reports</li>
                            </ul>
                            <div className="pt-4">
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    Generate Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PharmacyLayout>
    );
}