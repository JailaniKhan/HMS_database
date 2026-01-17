import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';

interface CreateUserProps extends PageProps {
    roles: string[];
}

export default function UserCreate({ roles }: CreateUserProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        router.post('/admin/users', {
            name: formData.get('name') as string,
            username: formData.get('username') as string,
            password: formData.get('password') as string,
            password_confirmation: formData.get('password_confirmation') as string,
            role: formData.get('role') as string,
        });
    };

    return (
        <HospitalLayout header="Create New User">
            <Head title="Create New User" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
                    <a href="/admin/users">
                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </a>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Create User</CardTitle>
                        <CardDescription>
                            Add a new user to the system with appropriate role and permissions
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
                                        placeholder="Enter full name" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="username">Username</Label>
                                    <Input 
                                        id="username" 
                                        name="username" 
                                        placeholder="Enter username" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input 
                                        id="password" 
                                        name="password" 
                                        type="password" 
                                        placeholder="Enter password" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                                    <Input 
                                        id="password_confirmation" 
                                        name="password_confirmation" 
                                        type="password" 
                                        placeholder="Confirm password" 
                                        required 
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="role">Role</Label>
                                    <Select name="role" required defaultValue="">
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
                                    Create User
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}