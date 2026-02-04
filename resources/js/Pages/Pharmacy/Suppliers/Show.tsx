import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Truck,
    Mail,
    Phone,
    MapPin,
    Edit,
    Calendar,
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import type { Supplier } from '@/types/pharmacy';

interface SupplierShowProps {
    supplier: Supplier;
}

export default function SupplierShow({ supplier }: SupplierShowProps) {
    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title={supplier.name} />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/pharmacy/suppliers">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <Heading title={supplier.name} />
                            <p className="text-muted-foreground mt-1">
                                Supplier Details
                            </p>
                        </div>
                    </div>

                    <Link href={`/pharmacy/suppliers/${supplier.id}/edit`}>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Supplier
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Supplier Name</p>
                                <p className="text-lg font-medium">{supplier.name}</p>
                            </div>

                            {supplier.contact_person && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Contact Person</p>
                                    <p className="text-lg font-medium">{supplier.contact_person}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-sm text-muted-foreground">Created At</p>
                                <p className="text-lg font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(supplier.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {supplier.email ? (
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <a href={`mailto:${supplier.email}`} className="text-lg font-medium text-blue-600 hover:underline flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        {supplier.email}
                                    </a>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-muted-foreground">Email</p>
                                    <p className="text-lg font-medium text-muted-foreground">-</p>
                                </div>
                            )}

                            {supplier.phone ? (
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <a href={`tel:${supplier.phone}`} className="text-lg font-medium text-blue-600 hover:underline flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        {supplier.phone}
                                    </a>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="text-lg font-medium text-muted-foreground">-</p>
                                </div>
                            )}

                            {supplier.address && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Address</p>
                                    <p className="text-lg font-medium flex items-start gap-2">
                                        <MapPin className="h-4 w-4 mt-1" />
                                        {supplier.address}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {supplier.notes && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{supplier.notes}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </HospitalLayout>
    );
}
