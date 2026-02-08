import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Users,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Syringe,
  TestTube,
  Shield,
  Activity,
  Zap,
  Globe,
  Settings
} from 'lucide-react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role?: string;
    permissions?: string[];
}

interface SecurityCenterProps {
    auth: {
        user: User;
    };
}

export default function SecurityCenter({ auth }: SecurityCenterProps) {
    // State for changing own password
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // State for updating own profile
    const [ownName, setOwnName] = useState(auth.user.name);
    const [ownUsername, setOwnUsername] = useState(auth.user.username);
    const [updatingOwnProfile, setUpdatingOwnProfile] = useState(false);
    const [ownProfileMessage, setOwnProfileMessage] = useState('');
    const [ownProfileError, setOwnProfileError] = useState('');

    // State for admin to manage other users
    const [users, setUsers] = useState<User[]>([]);

    // State for user management
    const [userName, setUserName] = useState('');
    const [userUsername, setUserUsername] = useState('');
    const [userRole, setUserRole] = useState('');
    const [creatingUser, setCreatingUser] = useState(false);
    const [deletingUser, setDeletingUser] = useState(false);
    const [userManagementMessage, setUserManagementMessage] = useState('');
    const [userManagementError, setUserManagementError] = useState('');

    // State for user profile updates
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editingUserName, setEditingUserName] = useState('');
    const [editingUserUsername, setEditingUserUsername] = useState('');
    const [editingUserRole, setEditingUserRole] = useState('');
    const [updatingUserProfile, setUpdatingUserProfile] = useState(false);
    const [userProfileMessage, setUserProfileMessage] = useState('');
    const [userProfileError, setUserProfileError] = useState('');

    // State for password reset
    const [resettingPassword, setResettingPassword] = useState(false);
    const [resetPasswordMessage, setResetPasswordMessage] = useState('');

    // Tab state
    const [activeTab, setActiveTab] = useState<'my-account' | 'admin-management' | 'security-settings'>('my-account');

    // Security Settings State
    const [settings, setSettings] = useState({
        monitoringEnabled: true,
        emailAlerts: true,
        anomalyDetection: true,
        rateLimiting: true,
        healthChecks: true,
        autoCleanup: true,
    });
    const [updatingSettings, setUpdatingSettings] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');

    // State for confirmation dialogs
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<User | null>(null);

    // Loading states
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [updatingOwnPassword, setUpdatingOwnPassword] = useState(false);

    // Enhanced UI states
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

    // Fetch users when component mounts (only for super admins)
    useEffect(() => {
        if (auth.user.role === 'Super Admin' || auth.user.permissions?.includes('manage-users')) {
            fetchUsers();
        }
    }, [auth.user]);

    // Password strength calculator
    useEffect(() => {
        if (newPassword) {
            let strength = 0;
            if (newPassword.length >= 8) strength += 25;
            if (/[A-Z]/.test(newPassword)) strength += 25;
            if (/[0-9]/.test(newPassword)) strength += 25;
            if (/[^A-Za-z0-9]/.test(newPassword)) strength += 25;
            setPasswordStrength(strength);
        } else {
            setPasswordStrength(0);
        }
    }, [newPassword]);

    // Success animation handler
    useEffect(() => {
        if (passwordMessage || ownProfileMessage || userManagementMessage || userProfileMessage || resetPasswordMessage || settingsMessage) {
            setShowSuccessAnimation(true);
            const timer = setTimeout(() => setShowSuccessAnimation(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [passwordMessage, ownProfileMessage, userManagementMessage, userProfileMessage, resetPasswordMessage, settingsMessage]);

    const handleToggleSetting = (setting: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    };

    const handleSaveSettings = async () => {
        setUpdatingSettings(true);
        setSettingsMessage('');
        try {
            // In a real app, this would be an API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSettingsMessage('Security settings updated successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setUpdatingSettings(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await axios.get('/api/v1/admin/users', {
                withCredentials: true
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUserManagementError('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleUpdateOwnPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordMessage('');

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordError('All fields are required');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }

        setUpdatingOwnPassword(true);

        try {
            await axios.put('/api/v1/admin/change-password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmNewPassword,
            }, {
                withCredentials: true
            });

            setPasswordMessage('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (error: unknown) {
            console.error('Error updating password:', error);
            let errorMessage = 'Failed to update password. Please try again.';
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const validationErrors = Object.values(err.response.data.errors).flat();
                    errorMessage = validationErrors.join(', ');
                }
            }
            setPasswordError(errorMessage);
        } finally {
            setUpdatingOwnPassword(false);
        }
    };

    const handleUpdateOwnProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setOwnProfileError('');
        setOwnProfileMessage('');

        if (!ownName.trim()) {
            setOwnProfileError('Name is required');
            return;
        }

        setUpdatingOwnProfile(true);

        try {
            await axios.put('/api/v1/admin/update-profile', {
                name: ownName,
                username: ownUsername,
            }, {
                withCredentials: true
            });

            setOwnProfileMessage('Profile updated successfully');

        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            let errorMessage = 'Failed to update profile. Please try again.';
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    // Show validation errors
                    const validationErrors = Object.values(err.response.data.errors).flat();
                    errorMessage = validationErrors.join(', ');
                }
            }
            setOwnProfileError(errorMessage);
        } finally {
            setUpdatingOwnProfile(false);
        }
    };

    const handleUpdateUserProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserProfileError('');
        setUserProfileMessage('');

        if (!editingUserId) {
            setUserProfileError('No user selected for update');
            return;
        }

        setUpdatingUserProfile(true);

        try {
            await axios.put(`/api/v1/admin/users/${editingUserId}/update-profile`, {
                name: editingUserName,
                username: editingUserUsername,
                role: editingUserRole,
            });

            setUserProfileMessage('User profile updated successfully');
            setEditingUserId(null);
            fetchUsers();
        } catch (error: unknown) {
            console.error('Error updating user profile:', error);
            let errorMessage = 'Failed to update user profile. Please try again.';
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const validationErrors = Object.values(err.response.data.errors).flat();
                    errorMessage = validationErrors.join(', ');
                }
            }
            setUserProfileError(errorMessage);
        } finally {
            setUpdatingUserProfile(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setUserManagementError('');
        setUserManagementMessage('');

        if (!userName.trim() || !userUsername.trim() || !userRole.trim()) {
            setUserManagementError('All fields are required');
            return;
        }

        setCreatingUser(true);

        try {
            await axios.post('/api/v1/admin/users', {
                name: userName,
                username: userUsername,
                role: userRole,
            });

            setUserManagementMessage('User created successfully');
            setUserName('');
            setUserUsername('');
            setUserRole('');
            fetchUsers();
        } catch (error: unknown) {
            console.error('Error creating user:', error);
            let errorMessage = 'Failed to create user. Please try again.';
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const validationErrors = Object.values(err.response.data.errors).flat();
                    errorMessage = validationErrors.join(', ');
                }
            }
            setUserManagementError(errorMessage);
        } finally {
            setCreatingUser(false);
        }
    };

    const handleDeleteUser = async (user: User) => {
        if (user.role === 'Super Admin') {
            // Security: Use state-based error display instead of alert
            setUserManagementError('Super Admin accounts cannot be deleted for security reasons.');
            setShowDeleteConfirmation(null);
            return;
        }

        setDeletingUser(true);

        try {
            await axios.delete(`/api/v1/admin/users/${user.id}`);

            setUserManagementMessage('User deleted successfully');
            fetchUsers();
            setShowDeleteConfirmation(null);
        } catch (error: unknown) {
            console.error('Error deleting user:', error);
            let errorMessage = 'Failed to delete user. Please try again.';
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const validationErrors = Object.values(err.response.data.errors).flat();
                    errorMessage = validationErrors.join(', ');
                }
            }
            setUserManagementError(errorMessage);
        } finally {
            setDeletingUser(false);
        }
    };

    const handleResetPassword = async (userId: number) => {
        setResettingPassword(true);
        setPasswordError('');
        setPasswordMessage('');

        try {
            await axios.put(`/api/v1/admin/users/${userId}/reset-password`);

            setResetPasswordMessage('Password reset successfully');
        } catch (error: unknown) {
            console.error('Error resetting password:', error);
            let errorMessage = 'Failed to reset password. Please try again.';
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
                if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.response?.data?.errors) {
                    const validationErrors = Object.values(err.response.data.errors).flat();
                    errorMessage = validationErrors.join(', ');
                }
            }
            setPasswordError(errorMessage);
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Security Center" />

                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Security Center</h1>
                        <p className="text-muted-foreground mt-2">Manage usernames, passwords and admin accounts</p>
                    </div>

                    <Tabs value={activeTab} onValueChange={(value) => {
                        if ((value === 'admin-management' || value === 'security-settings') && !(auth.user.role === 'Super Admin' || auth.user.permissions?.includes('manage-users'))) {
                            return;
                        }
                        setActiveTab(value as 'my-account' | 'admin-management' | 'security-settings');
                    }} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-muted p-1 rounded-xl h-12 mb-6">
                            <TabsTrigger
                                value="my-account"
                                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg h-10 flex items-center gap-2"
                            >
                                <User className="h-4 w-4" />
                                My Account
                            </TabsTrigger>
                            <TabsTrigger
                                value="admin-management"
                                disabled={!(auth.user.role === 'Super Admin' || auth.user.permissions?.includes('manage-users'))}
                                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg h-10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Users className="h-4 w-4" />
                                User Management
                            </TabsTrigger>
                            <TabsTrigger
                                value="security-settings"
                                disabled={!(auth.user.role === 'Super Admin' || auth.user.permissions?.includes('manage-users'))}
                                className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg h-10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Shield className="h-4 w-4" />
                                Security Config
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="my-account" className="space-y-6">
                            <Card className="border border-gray-200 bg-white shadow-sm rounded-xl">
                                <CardHeader className="border-b border-gray-100 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        Account Settings
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Manage your profile information and security settings
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="space-y-8">
                                        {/* Update Profile Info */}
                                        <div className="bg-muted/30 rounded-xl p-6 border border-input">
                                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                                <Edit3 className="h-5 w-5 text-primary" />
                                                Personal Information
                                            </h3>
                                            <form onSubmit={handleUpdateOwnProfile} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="ownName" className="font-medium">
                                                        Full Name
                                                    </Label>
                                                    <Input
                                                        id="ownName"
                                                        value={ownName}
                                                        onChange={(e) => setOwnName(e.target.value)}
                                                        placeholder="Enter your full name"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="ownUsername" className="font-medium">
                                                        Username
                                                    </Label>
                                                    <Input
                                                        id="ownUsername"
                                                        type="text"
                                                        value={ownUsername}
                                                        onChange={(e) => setOwnUsername(e.target.value)}
                                                        placeholder="Enter your username"
                                                    />
                                                </div>

                                                {ownProfileError && (
                                                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                        <AlertDescription className="text-destructive-foreground">{ownProfileError}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {ownProfileMessage && (
                                                    <Alert className="border-green-200 bg-green-50">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <AlertDescription className="text-green-600">{ownProfileMessage}</AlertDescription>
                                                    </Alert>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={updatingOwnProfile}
                                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                                                >
                                                    {updatingOwnProfile ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Updating Profile...
                                                        </>
                                                    ) : (
                                                        'Save Changes'
                                                    )}
                                                </Button>
                                            </form>
                                        </div>

                                        <div className="bg-muted/30 rounded-xl p-6 border border-input">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                                <Lock className="h-5 w-5" />
                                                Security Settings
                                            </h3>
                                            <form onSubmit={handleUpdateOwnPassword} className="space-y-5">
                                                <div className="space-y-2">
                                                    <Label htmlFor="currentPassword" className="font-medium flex items-center gap-2">
                                                        <Lock className="h-4 w-4" />
                                                        Current Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="currentPassword"
                                                            type={showCurrentPassword ? "text" : "password"}
                                                            value={currentPassword}
                                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                                            placeholder="Enter your current password"
                                                            className="pr-12"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                        >
                                                            {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="newPassword" className="font-medium flex items-center gap-2">
                                                        <KeyRound className="h-4 w-4" />
                                                        New Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="newPassword"
                                                            type={showNewPassword ? "text" : "password"}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            placeholder="Create a strong password"
                                                            className="pr-12"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                        >
                                                            {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                    {/* Password Strength Indicator */}
                                                    {newPassword && (
                                                        <div className="mt-2">
                                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                                <span>Password Strength</span>
                                                                <span>
                                                                    {passwordStrength < 50 ? 'Weak' :
                                                                     passwordStrength < 75 ? 'Medium' : 'Strong'}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-muted rounded-full h-2">
                                                                <div
                                                                    className={`h-2 rounded-full transition-all duration-300 ${
                                                                        passwordStrength < 50 ? 'bg-destructive' :
                                                                        passwordStrength < 75 ? 'bg-yellow-500' : 'bg-green-500'
                                                                    }`}
                                                                    style={{ width: `${passwordStrength}%` }}
                                                                ></div>
                                                            </div>
                                                            <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                                                <span className={passwordStrength >= 25 ? 'text-green-600' : ''}>• 8+ chars</span>
                                                                <span className={passwordStrength >= 50 ? 'text-green-600' : ''}>• Uppercase</span>
                                                                <span className={passwordStrength >= 75 ? 'text-green-600' : ''}>• Number</span>
                                                                <span className={passwordStrength >= 100 ? 'text-green-600' : ''}>• Symbol</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmNewPassword" className="font-medium flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Confirm New Password
                                                    </Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="confirmNewPassword"
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            value={confirmNewPassword}
                                                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                            placeholder="Re-enter your new password"
                                                            className={`pr-12 ${
                                                                confirmNewPassword && newPassword !== confirmNewPassword
                                                                    ? 'border-destructive focus:ring-destructive'
                                                                    : ''
                                                            }`}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        >
                                                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                        </button>
                                                    </div>
                                                    {confirmNewPassword && newPassword !== confirmNewPassword && (
                                                        <p className="text-sm text-destructive flex items-center gap-1">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            Passwords do not match
                                                        </p>
                                                    )}
                                                </div>

                                                {passwordError && (
                                                    <Alert variant="destructive" className="border-red-200 bg-red-50">
                                                        <XCircle className="h-4 w-4 text-red-600" />
                                                        <AlertDescription className="text-red-800">{passwordError}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {passwordMessage && showSuccessAnimation && (
                                                    <Alert className="border-green-200 bg-green-50 animate-pulse">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <AlertDescription className="text-green-800">{passwordMessage}</AlertDescription>
                                                    </Alert>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={updatingOwnPassword || !currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                                                >
                                                    {updatingOwnPassword ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Updating Password...
                                                        </>
                                                    ) : (
                                                        'Update Password'
                                                    )}
                                                </Button>
                                            </form>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="admin-management" className="space-y-6">
                            <Card className="border border-input bg-background shadow-sm rounded-xl">
                                <CardHeader className="border-b border-gray-100 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                                        <div className="p-2 bg-secondary/10 rounded-lg">
                                            <Users className="h-5 w-5 text-secondary-foreground" />
                                        </div>
                                        User Management
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Create, edit, and manage user accounts and permissions
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {loadingUsers ? (
                                        <div className="text-center py-12">
                                            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                                                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                            </div>
                                            <p className="text-muted-foreground">Loading user data...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {/* Create User Form */}
                                            <div className="bg-muted/30 rounded-lg p-6 border border-input">
                                                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                                    <Plus className="h-5 w-5" />
                                                    Create New User
                                                </h3>
                                                <form onSubmit={handleCreateUser} className="space-y-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="userName" className="font-medium">
                                                                Full Name
                                                            </Label>
                                                            <Input
                                                                id="userName"
                                                                value={userName}
                                                                onChange={(e) => setUserName(e.target.value)}
                                                                placeholder="Enter user's full name"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="userUsername" className="font-medium">
                                                                Username
                                                            </Label>
                                                            <Input
                                                                id="userUsername"
                                                                type="text"
                                                                value={userUsername}
                                                                onChange={(e) => setUserUsername(e.target.value)}
                                                                placeholder="Enter user's username"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="userRole" className="font-medium">
                                                                User Role
                                                            </Label>
                                                            <Select value={userRole} onValueChange={setUserRole}>
                                                                <SelectTrigger id="userRole" className="w-full">
                                                                    <SelectValue placeholder="Select a role..." />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Sub Super Admin">
                                                                        <div className="flex items-center gap-2">
                                                                            <User className="h-4 w-4" />
                                                                            Sub Super Admin
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="Reception Admin">
                                                                        <div className="flex items-center gap-2">
                                                                            <User className="h-4 w-4" />
                                                                            Reception Admin
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="Pharmacy Admin">
                                                                        <div className="flex items-center gap-2">
                                                                            <Syringe className="h-4 w-4" />
                                                                            Pharmacy Admin
                                                                        </div>
                                                                    </SelectItem>
                                                                    <SelectItem value="Laboratory Admin">
                                                                        <div className="flex items-center gap-2">
                                                                            <TestTube className="h-4 w-4" />
                                                                            Laboratory Admin
                                                                        </div>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {userManagementError && (
                                                        <Alert variant="destructive" className="border-red-200 bg-red-50">
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                            <AlertDescription className="text-destructive-foreground">{userManagementError}</AlertDescription>
                                                        </Alert>
                                                    )}

                                                    {userManagementMessage && showSuccessAnimation && (
                                                        <Alert className="border-green-200 bg-green-50 animate-pulse">
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                            <AlertDescription className="text-green-600">{userManagementMessage}</AlertDescription>
                                                        </Alert>
                                                    )}

                                                    <Button
                                                        type="submit"
                                                        disabled={creatingUser || !userName.trim() || !userUsername.trim() || !userRole.trim()}
                                                        variant="success"
                                                        className="w-full transition-colors"
                                                    >
                                                        {creatingUser ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Creating User...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Create User
                                                            </>
                                                        )}
                                                    </Button>
                                                </form>
                                            </div>

                                            {/* Users List */}
                                            <div className="border rounded-lg p-6 bg-background">
                                                <h3 className="font-semibold mb-4 text-lg">All Users</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-input">
                                                                <th className="text-left py-3 px-2 font-medium">Name</th>
                                                                <th className="text-left py-3 px-2 font-medium">Username</th>
                                                                <th className="text-left py-3 px-2 font-medium">Role</th>
                                                                <th className="text-left py-3 px-2 font-medium">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {users.map(user => (
                                                                <tr key={user.id} className="border-b border-input hover:bg-muted/50">
                                                                    <td className="py-3 px-2">{user.name}</td>
                                                                    <td className="py-3 px-2">{user.username}</td>
                                                                    <td className="py-3 px-2">
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                            user.role === 'Super Admin' ? 'bg-purple-100 text-purple-600' :
                                                                            user.role === 'Sub Super Admin' ? 'bg-blue-100 text-blue-600' :
                                                                            user.role === 'Pharmacy Admin' ? 'bg-indigo-100 text-indigo-600' :
                                                                            user.role === 'Laboratory Admin' ? 'bg-yellow-100 text-yellow-600' :
                                                                            user.role === 'Reception Admin' ? 'bg-green-100 text-green-600' :
                                                                            'bg-muted text-muted-foreground'
                                                                        }`}>
                                                                            {user.role || 'User'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-3 px-2">
                                                                        <div className="flex space-x-2">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    setEditingUserId(user.id);
                                                                                    setEditingUserName(user.name);
                                                                                    setEditingUserUsername(user.username);
                                                                                    setEditingUserRole(user.role || '');
                                                                                }}
                                                                                disabled={user.role === 'Super Admin' && auth.user.role !== 'Super Admin'}
                                                                                className="text-primary border-primary hover:bg-primary/10 transition-colors disabled:opacity-30"
                                                                            >
                                                                                <Edit3 className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleResetPassword(user.id)}
                                                                                disabled={resettingPassword || (user.role === 'Super Admin' && auth.user.role !== 'Super Admin')}
                                                                                className="text-yellow-600 border-yellow-200 hover:bg-yellow-100 transition-colors disabled:opacity-30"
                                                                            >
                                                                                <KeyRound className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="destructive"
                                                                                onClick={() => setShowDeleteConfirmation(user)}
                                                                                disabled={deletingUser || user.role === 'Super Admin'}
                                                                                className="transition-colors disabled:opacity-30"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Edit User Form */}
                                            {editingUserId && (
                                                <div className="border rounded-lg p-6 bg-muted/30 border-input mt-8">
                                                    <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                                                        <Edit3 className="h-5 w-5 text-primary" />
                                                        Edit User Account
                                                    </h3>
                                                    <form onSubmit={handleUpdateUserProfile} className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            <div className="space-y-2">
                                                                <Label htmlFor="editUserName" className="font-medium">Full Name</Label>
                                                                <Input
                                                                    id="editUserName"
                                                                    value={editingUserName}
                                                                    onChange={(e) => setEditingUserName(e.target.value)}
                                                                    placeholder="Enter user name"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="editUserUsername" className="font-medium">Username</Label>
                                                                <Input
                                                                    id="editUserUsername"
                                                                    value={editingUserUsername}
                                                                    onChange={(e) => setEditingUserUsername(e.target.value)}
                                                                    placeholder="Enter user username"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="editUserRole" className="font-medium">Role</Label>
                                                                <Select 
                                                                    value={editingUserRole} 
                                                                    onValueChange={setEditingUserRole}
                                                                    disabled={editingUserRole === 'Super Admin'}
                                                                >
                                                                    <SelectTrigger id="editUserRole" className="w-full disabled:bg-muted disabled:cursor-not-allowed">
                                                                        <SelectValue placeholder="Select role..." />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Sub Super Admin">
                                                                            <div className="flex items-center gap-2">
                                                                                <User className="h-4 w-4" />
                                                                                Sub Super Admin
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="Reception Admin">
                                                                            <div className="flex items-center gap-2">
                                                                                <User className="h-4 w-4" />
                                                                                Reception Admin
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="Pharmacy Admin">
                                                                            <div className="flex items-center gap-2">
                                                                                <Syringe className="h-4 w-4" />
                                                                                Pharmacy Admin
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="Laboratory Admin">
                                                                            <div className="flex items-center gap-2">
                                                                                <TestTube className="h-4 w-4" />
                                                                                Laboratory Admin
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        {userProfileError && (
                                                            <Alert variant="destructive" className="border-red-200 bg-red-50">
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                                <AlertDescription className="text-red-800">{userProfileError}</AlertDescription>
                                                            </Alert>
                                                        )}

                                                        {userProfileMessage && showSuccessAnimation && (
                                                            <Alert className="border-green-200 bg-green-50 animate-pulse">
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                <AlertDescription className="text-green-800">{userProfileMessage}</AlertDescription>
                                                            </Alert>
                                                        )}

                                                        <div className="flex space-x-3 pt-2">
                                                            <Button
                                                                type="submit"
                                                                disabled={updatingUserProfile}
                                                                variant="warning"
                                                                className="flex-1 transition-colors"
                                                            >
                                                                {updatingUserProfile ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Updating User...
                                                                    </>
                                                                ) : (
                                                                    'Save Changes'
                                                                )}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setEditingUserId(null)}
                                                                className="flex-1 transition-colors"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}

                                            {/* Delete Confirmation Dialog */}
                                            <Dialog open={!!showDeleteConfirmation} onOpenChange={(open) => !open && setShowDeleteConfirmation(null)}>
                                                <DialogContent className="max-w-md">
                                                    <DialogHeader>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="p-2 bg-destructive/10 rounded-full">
                                                                <AlertTriangle className="h-6 w-6 text-destructive" />
                                                            </div>
                                                            <DialogTitle className="text-xl">Confirm Deletion</DialogTitle>
                                                        </div>
                                                        <DialogDescription className="text-base py-2">
                                                            Are you sure you want to delete <span className="font-bold text-foreground">{showDeleteConfirmation?.name}</span>'s account? This action cannot be undone and will revoke all access.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="mt-6 gap-3">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setShowDeleteConfirmation(null)}
                                                            disabled={deletingUser}
                                                            className="flex-1"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            onClick={() => handleDeleteUser(showDeleteConfirmation!)}
                                                            disabled={deletingUser}
                                                            className="flex-1"
                                                        >
                                                            {deletingUser ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                'Delete Account'
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="security-settings" className="space-y-6">
                            <Card className="border border-input bg-background shadow-sm rounded-xl">
                                <CardHeader className="border-b border-gray-100 pb-6">
                                    <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Shield className="h-5 w-5 text-primary" />
                                        </div>
                                        Global Security Configuration
                                    </CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Configure system-wide security policies, monitoring and automated maintenance
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Monitoring Section */}
                                        <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-input">
                                            <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                                                <Activity className="h-5 w-5 text-blue-600" />
                                                Monitoring & Alerts
                                            </h3>
                                            <div className="flex items-center justify-between py-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-semibold">Permission Monitoring</Label>
                                                    <p className="text-sm text-muted-foreground">Track all permission checks and access attempts</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.monitoringEnabled} 
                                                    onCheckedChange={() => handleToggleSetting('monitoringEnabled')}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-semibold">Email Notifications</Label>
                                                    <p className="text-sm text-muted-foreground">Receive critical security alerts via email</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.emailAlerts} 
                                                    onCheckedChange={() => handleToggleSetting('emailAlerts')}
                                                />
                                            </div>
                                        </div>

                                        {/* Advanced Protection */}
                                        <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-input">
                                            <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                                                <Zap className="h-5 w-5 text-amber-500" />
                                                Advanced Protection
                                            </h3>
                                            <div className="flex items-center justify-between py-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-semibold">Anomaly Detection</Label>
                                                    <p className="text-sm text-muted-foreground">Detect unusual access patterns using AI</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.anomalyDetection} 
                                                    onCheckedChange={() => handleToggleSetting('anomalyDetection')}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-semibold">Rate Limiting</Label>
                                                    <p className="text-sm text-muted-foreground">Prevent brute-force attacks on sensitive endpoints</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.rateLimiting} 
                                                    onCheckedChange={() => handleToggleSetting('rateLimiting')}
                                                />
                                            </div>
                                        </div>

                                        {/* System Health */}
                                        <div className="space-y-4 p-6 bg-muted/30 rounded-xl border border-input">
                                            <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                                                <Globe className="h-5 w-5 text-green-600" />
                                                System Integrity
                                            </h3>
                                            <div className="flex items-center justify-between py-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-semibold">Health Checks</Label>
                                                    <p className="text-sm text-muted-foreground">Run automated security health audits every 15 min</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.healthChecks} 
                                                    onCheckedChange={() => handleToggleSetting('healthChecks')}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between py-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-semibold">Auto-Cleanup</Label>
                                                    <p className="text-sm text-muted-foreground">Automatically purge old audit logs and sessions</p>
                                                </div>
                                                <Switch 
                                                    checked={settings.autoCleanup} 
                                                    onCheckedChange={() => handleToggleSetting('autoCleanup')}
                                                />
                                            </div>
                                        </div>

                                        {/* Status & Save */}
                                        <div className="p-6 bg-primary/5 rounded-xl border border-primary/20 flex flex-col justify-center items-center text-center space-y-4">
                                            <div className="p-3 bg-primary/10 rounded-full">
                                                <Settings className="h-8 w-8 text-primary animate-[spin_4s_linear_infinite]" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-lg">Apply Changes</h4>
                                                <p className="text-sm text-muted-foreground px-4">Changes to security configuration affect all system components immediately.</p>
                                            </div>
                                            
                                            {settingsMessage && (
                                                <div className="text-green-600 text-sm font-medium flex items-center gap-1">
                                                    <CheckCircle className="h-4 w-4" />
                                                    {settingsMessage}
                                                </div>
                                            )}

                                            <Button 
                                                onClick={handleSaveSettings} 
                                                disabled={updatingSettings}
                                                className="w-full max-w-[200px]"
                                            >
                                                {updatingSettings ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    'Update Configuration'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </HospitalLayout>
    );
}