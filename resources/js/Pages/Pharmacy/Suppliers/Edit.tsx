import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Heading from '@/components/heading';
import { ArrowLeft } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import type { Supplier } from '@/types/pharmacy';

interface SupplierEditProps {
    supplier: Supplier;
}

export default function SupplierEdit({ supplier }: SupplierEditProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.put(`/pharmacy/suppliers/${supplier.id}`, formData);
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title={`Edit ${supplier.name}`} />

                <div className="flex items-center gap-4">
                    <Link href="/pharmacy/suppliers">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div>
                        <Heading title="Edit Supplier" />
                        <p className="text-muted-foreground mt-1">
                            Update supplier information
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Supplier Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">
                                        Supplier Name *
                                    </label>
                                    <Input
                                        id="name"
                                        name="name"
                                        required
                                        defaultValue={supplier.name}
                                        placeholder="Enter supplier name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="contact_person" className="text-sm font-medium">
                                        Contact Person
                                    </label>
                                    <Input
                                        id="contact_person"
                                        name="contact_person"
                                        defaultValue={supplier.contact_person || ''}
                                        placeholder="Enter contact person name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email
                                    </label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={supplier.email || ''}
                                        placeholder="Enter email address"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="phone" className="text-sm font-medium">
                                        Phone
                                    </label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        defaultValue={supplier.phone || ''}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="address" className="text-sm font-medium">
                                    Address
                                </label>
                                <Textarea
                                    id="address"
                                    name="address"
                                    defaultValue={supplier.address || ''}
                                    placeholder="Enter full address"
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="notes" className="text-sm font-medium">
                                    Notes
                                </label>
                                <Textarea
                                    id="notes"
                                    name="notes"
                                    defaultValue={supplier.notes || ''}
                                    placeholder="Enter any additional notes"
                                    rows={3}
                                />
                            </div>

                            <div className="flex justify-end gap-4">
                                <Link href="/pharmacy/suppliers">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" className="bg-primary hover:bg-primary/90">
                                    Update Supplier
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
