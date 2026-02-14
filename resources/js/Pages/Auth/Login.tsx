import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Loader2, Shield, AlertCircle, Building2, Stethoscope, Heart } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword?: boolean;
}

interface FormData {
    username: string;
    password: string;
    remember: boolean;
}

interface FormErrors {
    username?: string;
    password?: string;
    general?: string;
    [key: string]: string | undefined;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, clearErrors } = useForm<FormData>({
        username: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);

    // Memoize form errors to avoid direct setState in effect
    const computedFormErrors = useMemo<FormErrors>(() => {
        const newErrors: FormErrors = {};
        
        if (errors.username) newErrors.username = errors.username;
        if (errors.password) newErrors.password = errors.password;
        if (status) newErrors.general = status;

        return newErrors;
    }, [errors, status]);

    useEffect(() => {
        setFormErrors(computedFormErrors);
    }, [computedFormErrors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        setFormErrors({});

        post(route('login'), {
            onFinish: () => {
                // Focus first field with error
                if (errors.username && usernameRef.current) {
                    usernameRef.current.focus();
                } else if (errors.password && passwordRef.current) {
                    passwordRef.current.focus();
                }
            },
        });
    };

    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setData(field, value);
        
        // Clear field-specific error when user starts typing
        if (formErrors[field as string]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
            clearErrors(field);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            <Head title="Login - Hospital Management System" />
            
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob sm:w-96 sm:h-96"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000 sm:w-96 sm:h-96"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000 sm:w-96 sm:h-96"></div>
            </div>

            {/* Floating icons */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 left-10 opacity-10 animate-pulse hidden sm:block">
                    <Heart className="h-12 w-12 text-red-500" />
                </div>
                <div className="absolute top-1/3 right-20 opacity-10 animate-pulse hidden sm:block">
                    <Stethoscope className="h-10 w-10 text-blue-500" />
                </div>
                <div className="absolute bottom-40 left-1/4 opacity-10 animate-pulse hidden sm:block">
                    <Building2 className="h-14 w-14 text-indigo-500" />
                </div>
            </div>

            {/* Main card - Perfectly centered */}
            <div className="w-full max-w-md mx-auto relative z-10">
                <Card className="backdrop-blur-xl bg-white/90 border border-white/20 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-3xl w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5"></div>
                    
                    <CardHeader className="text-center pb-4 sm:pb-6 relative pt-6 sm:pt-8">
                        {/* Logo section - Centered */}
                        <div className="flex justify-center mb-4 sm:mb-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                                <div className="relative bg-white p-3 sm:p-4 rounded-2xl border border-white/50 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                                    <img 
                                        src="/Logo.png" 
                                        alt="Hospital Logo" 
                                        className="h-16 w-16 sm:h-20 sm:w-20 object-contain transition-transform duration-300 group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const parent = e.currentTarget.parentElement;
                                            if (parent) {
                                                const fallback = document.createElement('div');
                                                fallback.className = 'bg-gradient-to-br from-blue-600 to-indigo-600 p-3 sm:p-4 rounded-2xl flex items-center justify-center';
                                                fallback.innerHTML = `<svg class="h-10 w-10 sm:h-12 sm:w-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9v-2h2v2zm0-4H9V7h2v4zm4 4h-2v-2h2v2zm0-4h-2V7h2v4z"/></svg>`;
                                                parent.appendChild(fallback);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Title and description - Centered */}
                        <div className="space-y-2 sm:space-y-3 text-center mx-auto px-4">
                            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Welcome Back
                            </CardTitle>
                            <CardDescription className="text-gray-600 text-sm sm:text-base">
                                Sign in to access your hospital management dashboard
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="px-4 sm:px-8 pb-4 sm:pb-6 relative">
                        {/* Error alert - Centered */}
                        {(formErrors.general || Object.keys(errors).length > 0) && (
                            <Alert variant="destructive" className="mb-6 animate-in slide-in-from-top-2 duration-300 text-center">
                                <AlertCircle className="h-5 w-5 mx-auto" />
                                <AlertDescription className="text-center">
                                    {formErrors.general || 'Invalid credentials. Please try again.'}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Login form - Centered */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Username field - Centered */}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 mx-auto w-fit">
                                    <Mail className="h-4 w-4" />
                                    Username
                                </Label>
                                <div className="relative">
                                    <Input
                                        ref={usernameRef}
                                        id="username"
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => handleInputChange('username', e.target.value)}
                                        className={`pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 ${
                                            formErrors.username || errors.username
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                                : 'border-gray-200 focus:border-blue-500'
                                        }`}
                                        placeholder="Enter your username"
                                        autoComplete="username"
                                        disabled={processing}
                                        required
                                    />
                                    <Mail className={`absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 ${
                                        formErrors.username || errors.username ? 'text-red-500' : 'text-gray-400'
                                    }`} />
                                    
                                    {(formErrors.username || errors.username) && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                                            <AlertCircle className="h-4 w-4" />
                                            {formErrors.username || errors.username}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Password field - Centered */}
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-2 mx-auto w-fit">
                                    <Lock className="h-4 w-4" />
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        ref={passwordRef}
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={data.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        className={`pl-10 sm:pl-11 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border-2 transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 ${
                                            formErrors.password || errors.password
                                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                                                : 'border-gray-200 focus:border-blue-500'
                                        }`}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        disabled={processing}
                                        required
                                    />
                                    <Lock className={`absolute left-3 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 ${
                                        formErrors.password || errors.password ? 'text-red-500' : 'text-gray-400'
                                    }`} />
                                    
                                    <button
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        className="absolute right-3 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:text-blue-500"
                                        disabled={processing}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                                        ) : (
                                            <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                                        )}
                                    </button>
                                    
                                    {(formErrors.password || errors.password) && (
                                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                                            <AlertCircle className="h-4 w-4" />
                                            {formErrors.password || errors.password}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Remember me and forgot password - Centered */}
                            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4 sm:gap-0">
                                <div className="flex items-center space-x-2 sm:space-x-3 mx-auto sm:mx-0">
                                    <Checkbox
                                        id="remember"
                                        checked={data.remember}
                                        onCheckedChange={(checked) => handleInputChange('remember', checked as boolean)}
                                        className="border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 h-4 w-4 sm:h-5 sm:w-5"
                                        disabled={processing}
                                    />
                                    <Label 
                                        htmlFor="remember" 
                                        className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                        Remember me
                                    </Label>
                                </div>
                                
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:underline mx-auto sm:mx-0"
                                    >
                                        Forgot password?
                                    </Link>
                                )}
                            </div>

                            {/* Submit button - Centered */}
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-500/30 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg mx-auto"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="mr-3 h-5 w-5" />
                                        Sign In Securely
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="px-4 sm:px-8 pb-6 sm:pb-8 pt-4 relative">
                        <div className="text-center text-xs text-gray-500 space-y-3 w-full">
                            <div className="flex items-center justify-center gap-2 text-gray-400 mx-auto">
                                <Shield className="h-3 w-3" />
                                <span>Your security is our priority</span>
                            </div>
                            <p className="pt-2 border-t border-gray-200/50 mx-auto max-w-xs">
                                Need assistance? Contact IT Support at{' '}
                                <a 
                                    href="mailto:support@hospital.com" 
                                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                >
                                    support@hospital.com
                                </a>
                            </p>
                        </div>
                    </CardFooter>
                </Card>
            </div>

            {/* Custom styles */}
            <style>
                {`
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                `}
            </style>
        </div>
    );
}
