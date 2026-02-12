import { Head, useForm, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, ArrowLeft, Save, User, KeyRound, CheckCircle, AlertCircle, Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    username: string;
    role: string;
    isSuperAdmin: boolean;
}

interface EditUserProps extends PageProps {
    user: User;
    roles: string[];
}

export default function UserEdit({ user, roles }: EditUserProps) {
    const { data, setData, processing, errors, reset } = useForm({
        name: user.name,
        username: user.username,
        password: '',
        password_confirmation: '',
        role: user.role,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [usernameMessage, setUsernameMessage] = useState('');

    const displayUsernameStatus = data.username !== user.username && data.username.length >= 3 ? usernameStatus : 'idle';
    const displayUsernameMessage = data.username !== user.username && data.username.length >= 3 ? usernameMessage : '';

    // Calculate password strength during render
    const getPasswordStrength = (password: string) => {
        if (!password) return { strength: 0, label: '', color: 'bg-gray-200' };
        
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;

        let label = '';
        let color = 'bg-gray-200';

        if (strength <= 25) {
            label = 'Weak';
            color = 'bg-red-500';
        } else if (strength <= 50) {
            label = 'Fair';
            color = 'bg-yellow-500';
        } else if (strength <= 75) {
            label = 'Good';
            color = 'bg-blue-500';
        } else {
            label = 'Strong';
            color = 'bg-green-500';
        }

        return { strength, label, color };
    };

    const { strength: passwordStrength, label: strengthLabel, color: strengthColor } = getPasswordStrength(data.password);

    // Debounced username check
    useEffect(() => {
        if (data.username === user.username || data.username.length < 3) return;

        const timer = setTimeout(async () => {
            setUsernameStatus('checking');
            try {
                const response = await axios.get(`/admin/users/check-username?username=${data.username}`);
                if (response.data.available) {
                    setUsernameStatus('available');
                    setUsernameMessage('Username is available');
                } else {
                    setUsernameStatus('taken');
                    setUsernameMessage('Username is already taken');
                }
            } catch (error) {
                console.error('Error checking username:', error);
                setUsernameStatus('idle');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [data.username]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use router.visit with explicit POST method and _method spoofing
        router.visit(`/admin/users/${user.id}`, {
            method: 'post',
            data: {
                ...data,
                _method: 'PUT',
            },
            preserveScroll: true,
            onSuccess: () => reset('password', 'password_confirmation'),
            onError: (errors) => {
                console.error('Update failed:', errors);
            },
        });
    };

    return (
        <HospitalLayout header="Edit User">
            <Head title={`Edit User - ${user.name}`} />
            
            <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit User</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Modify user details and role assignment for {user.name}.
                        </p>
                    </div>
                    <Link href="/admin/users">
                        <Button variant="outline" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card className="shadow-sm border-gray-200 overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                                <CardTitle className="text-xl">User Information</CardTitle>
                                <CardDescription>Update the details for this account.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input 
                                                    id="name" 
                                                    value={data.name}
                                                    onChange={e => setData('name', e.target.value)}
                                                    className={cn("pl-10", errors.name && "border-red-500")}
                                                    placeholder="e.g. John Doe" 
                                                    required 
                                                />
                                            </div>
                                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Username</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input 
                                                    id="username" 
                                                    value={data.username}
                                                    onChange={e => setData('username', e.target.value)}
                                                    className={cn(
                                                        "pl-10 pr-10", 
                                                        errors.username && "border-red-500",
                                                        displayUsernameStatus === 'available' && "border-green-500",
                                                        displayUsernameStatus === 'taken' && "border-red-500"
                                                    )}
                                                    placeholder="e.g. johndoe123" 
                                                    required 
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {displayUsernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                                    {displayUsernameStatus === 'available' && <CheckCircle className="h-4 w-4 text-green-500" />}
                                                    {displayUsernameStatus === 'taken' && <AlertCircle className="h-4 w-4 text-red-500" />}
                                                </div>
                                            </div>
                                            {displayUsernameMessage && (
                                                <p className={cn(
                                                    "text-xs mt-1 font-medium",
                                                    displayUsernameStatus === 'available' ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {displayUsernameMessage}
                                                </p>
                                            )}
                                            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">New Password</Label>
                                                <div className="relative">
                                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input 
                                                        id="password" 
                                                        type={showPassword ? "text" : "password"}
                                                        value={data.password}
                                                        onChange={e => setData('password', e.target.value)}
                                                        className={cn("pl-10 pr-10", errors.password && "border-red-500")}
                                                        placeholder="•••••••• (leave blank to keep current)" 
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                
                                                {/* Password Strength Indicator */}
                                                {data.password && (
                                                    <div className="mt-2 space-y-1.5">
                                                        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-gray-500">
                                                            <span>Strength: <span className={cn(
                                                                strengthLabel === 'Strong' ? "text-green-600" : 
                                                                strengthLabel === 'Good' ? "text-blue-600" : 
                                                                strengthLabel === 'Fair' ? "text-yellow-600" : "text-red-600"
                                                            )}>{strengthLabel}</span></span>
                                                            <span>{passwordStrength}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={cn("h-full transition-all duration-300", strengthColor)}
                                                                style={{ width: `${passwordStrength}%` }}
                                                            />
                                                        </div>
                                                        <ul className="text-[10px] text-gray-500 grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                                                            <li className={cn("flex items-center gap-1", data.password.length >= 8 ? "text-green-600" : "text-gray-400")}>
                                                                <div className={cn("w-1 h-1 rounded-full", data.password.length >= 8 ? "bg-green-600" : "bg-gray-400")} />
                                                                8+ characters
                                                            </li>
                                                            <li className={cn("flex items-center gap-1", /[A-Z]/.test(data.password) ? "text-green-600" : "text-gray-400")}>
                                                                <div className={cn("w-1 h-1 rounded-full", /[A-Z]/.test(data.password) ? "bg-green-600" : "bg-gray-400")} />
                                                                Upper case
                                                            </li>
                                                            <li className={cn("flex items-center gap-1", /[0-9]/.test(data.password) ? "text-green-600" : "text-gray-400")}>
                                                                <div className={cn("w-1 h-1 rounded-full", /[0-9]/.test(data.password) ? "bg-green-600" : "bg-gray-400")} />
                                                                Number
                                                            </li>
                                                            <li className={cn("flex items-center gap-1", /[^A-Za-z0-9]/.test(data.password) ? "text-green-600" : "text-gray-400")}>
                                                                <div className={cn("w-1 h-1 rounded-full", /[^A-Za-z0-9]/.test(data.password) ? "bg-green-600" : "bg-gray-400")} />
                                                                Special char
                                                            </li>
                                                        </ul>
                                                    </div>
                                                )}
                                                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label htmlFor="password_confirmation" className="text-sm font-semibold text-gray-700">Confirm New Password</Label>
                                                <div className="relative">
                                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input 
                                                        id="password_confirmation" 
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={data.password_confirmation}
                                                        onChange={e => setData('password_confirmation', e.target.value)}
                                                        className={cn("pl-10 pr-10", errors.password_confirmation && "border-red-500")}
                                                        placeholder="••••••••" 
                                                    />
                                                    <button 
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                                {errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Access Role</Label>
                                            <Select 
                                                value={data.role} 
                                                onValueChange={value => setData('role', value)}
                                                required
                                            >
                                                <SelectTrigger className={cn(errors.role && "border-red-500")}>
                                                    <SelectValue placeholder="Assign a role to this user" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {role}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                This determines the user's permissions and access level in the system.
                                            </p>
                                            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-8">
                                        <Link href="/admin/users">
                                            <Button type="button" variant="ghost" className="text-gray-600 hover:bg-gray-100">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button 
                                            type="submit" 
                                            disabled={processing || displayUsernameStatus === 'taken'}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 transition-all duration-200"
                                        >
                                            {processing ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Update Account
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="shadow-sm border-blue-100 bg-blue-50/30">
                            <CardHeader>
                                <div className="p-2 bg-blue-100 rounded-lg w-fit mb-3">
                                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                                </div>
                                <CardTitle className="text-lg">Security Guide</CardTitle>
                                <CardDescription>Best practices for account management.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm space-y-3 text-gray-600">
                                <div className="flex gap-2">
                                    <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /></div>
                                    <p>Leave password fields blank to keep the current password.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /></div>
                                    <p>When changing password, ensure it meets security requirements.</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="mt-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /></div>
                                    <p>Changing username requires verification of availability.</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                            <ShieldAlert className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-xs font-medium">
                                Administrative accounts have significant system access. Ensure roles are assigned carefully according to the principle of least privilege.
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}