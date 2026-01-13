import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Loader2, Hospital } from 'lucide-react';
import GuestLayout from '@/layouts/GuestLayout';

interface LoginProps {
    status?: string;
    csrf?: {
        token: string;
    };
}

export default function Login({ status }: LoginProps) {
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        // Ensure CSRF token is available before submitting
        const csrfToken = document.head.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        if (csrfToken) {
            // Update axios defaults with the token
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
        }
        
        post(route('login'), {
            onSuccess: () => {
                setIsLoading(false);
            },
            onError: () => {
                setIsLoading(false);
            },
            onFinish: () => {
                setIsLoading(false);
            }
        });
    };

    return (
        <GuestLayout>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Head title="Login" />
                
                <div className="w-full max-w-md">
                    <Card className="shadow-lg">
                        <CardHeader className="space-y-1">
                            <div className="flex justify-center">
                                <div className="bg-blue-600 p-3 rounded-full">
                                    <Hospital className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <CardTitle className="text-2xl text-center">Hospital Management System</CardTitle>
                            <CardDescription className="text-center">
                                Enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                            {status && (
                                <Alert className="mb-4">
                                    <AlertDescription>{status}</AlertDescription>
                                </Alert>
                            )}

                            {(errors.username || errors.password) && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>
                                        {errors.username || errors.password}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form onSubmit={submit}>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Username</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="username"
                                                name="username"
                                                type="text"
                                                placeholder="Enter your username"
                                                value={data.username ?? ''}
                                                onChange={(e) => setData('username', e.target.value)}
                                                className="pl-10"
                                                aria-label="Username"
                                                autoComplete="username"
                                                required
                                            />
                                        </div>
                                        {errors.username && (
                                            <p className="text-sm text-red-600" role="alert">{errors.username}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                value={data.password ?? ''}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="pl-10 pr-10"
                                                aria-label="Password"
                                                autoComplete="current-password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-red-600" role="alert">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="remember"
                                                name="remember"
                                                checked={!!data.remember}
                                                onCheckedChange={(checked) => setData('remember', Boolean(checked))}
                                                aria-label="Remember me"
                                            />
                                            <label
                                                htmlFor="remember"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Remember me
                                            </label>
                                        </div>
                                        
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <Button 
                                        type="submit" 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={processing || isLoading}
                                    >
                                        {processing || isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Signing in...
                                            </>
                                        ) : (
                                            'Sign in'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                        
                        <CardFooter className="flex flex-col">
                            <div className="mt-4 text-center text-xs text-muted-foreground">
                                <p>
                                    By signing in, you agree to our{' '}
                                    <Link href="#" className="underline underline-offset-4 hover:text-primary">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="#" className="underline underline-offset-4 hover:text-primary">
                                        Privacy Policy
                                    </Link>.
                                </p>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </GuestLayout>
    );
}