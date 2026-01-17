import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';

interface User {
    id: number;
    name: string;
    username: string;
    role: string;
}

interface EditUserProps extends PageProps {
    user: User;
    roles: string[];
}

export default function UserEdit({ user, roles }: EditUserProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        router.put(`/admin/users/${user.id}`, {
            name: formData.get('name') as string,
            username: formData.get('username') as string,
            password: formData.get('password') as string,
            password_confirmation: formData.get('password_confirmation') as string,
            role: formData.get('role') as string,
        });
    };

    return (
        <HospitalLayout header="Edit User">
            <Head title={`Edit User - ${user.name}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                    <a href="/admin/users">
                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </a>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Edit User</CardTitle>
                        <CardDescription>
                            Modify user details and role assignment
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input 
                                        id="name" 
                                        name="name" 
                                        defaultValue={user.name}
                                        placeholder="Enter full name" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="username">Username</Label>
                                    <Input 
                                        id="username" 
                                        name="username" 
                                        defaultValue={user.username}
                                        placeholder="Enter username" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="password">New Password (optional)</Label>
                                    <Input 
                                        id="password" 
                                        name="password" 
                                        type="password" 
                                        placeholder="Enter new password (leave blank to keep current)" 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="password_confirmation">Confirm New Password</Label>
                                    <Input 
                                        id="password_confirmation" 
                                        name="password_confirmation" 
                                        type="password" 
                                        placeholder="Confirm new password" 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="role">Role</Label>
                                    <Select name="role" required defaultValue={user.role}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {roles.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Assign an appropriate role to this user
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4">
                                <a href="/admin/users">
                                    <Button type="button" className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                                        Cancel
                                    </Button>
                                </a>
                                <Button type="submit" className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                                    <Save className="mr-2 h-4 w-4" />
                                    Update User
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}