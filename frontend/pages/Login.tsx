import React, { useState } from 'react';
import { Button, Input, PaperSheet, Divider } from '../components/ui/LayoutElements';
import * as api from '../services/mockService';
import { useAuth } from '../contexts';
import { Key, Sparkles, Bug, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => Promise<void>;
  initialMode?: 'LOGIN_PASS' | 'REGISTER';
  onModeUsed?: () => void;
}

type AuthMode = 'LOGIN_PASS' | 'LOGIN_OTP' | 'REGISTER' | 'REGISTER_VERIFY_OTP' | 'VERIFY_OTP' | 'RESET_REQUEST' | 'RESET_VERIFY';

const Login: React.FC<LoginProps> = ({ onLogin, initialMode = 'LOGIN_PASS', onModeUsed }) => {
  const { loginAsDemo } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setResetSuccess(false);
    setIsSubmitting(false);
    onModeUsed?.();
  };

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
        if (mode === 'LOGIN_PASS') {
            await api.login(email, password);
            await onLogin(email);
        } else if (mode === 'REGISTER') {
            await api.registerRequestOtp(name, email, password);
            switchMode('REGISTER_VERIFY_OTP');
        } else if (mode === 'REGISTER_VERIFY_OTP') {
            await api.registerVerifyOtp(email, otp);
            await onLogin(email);
        } else if (mode === 'LOGIN_OTP') {
            await api.requestOtp(email);
            switchMode('VERIFY_OTP');
        } else if (mode === 'VERIFY_OTP') {
            await api.verifyOtp(email, otp);
            await onLogin(email);
        } else if (mode === 'RESET_REQUEST') {
            await api.requestResetPassword(email);
            switchMode('RESET_VERIFY');
        } else if (mode === 'RESET_VERIFY') {
            await api.resetPassword(email, otp, newPassword);
            setResetSuccess(true);
            setOtp('');
            setNewPassword('');
            switchMode('LOGIN_PASS');
        }
    } catch (err: any) {
        setError(err.message || 'Something went wrong');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    setError('');
    onModeUsed?.();
    loginAsDemo();
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4 relative transition-colors duration-300">
        <PaperSheet className="max-w-md w-full p-12 rotate-1 z-10 transition-all duration-500 relative">
            <div className="text-center mb-6">
                <h1 className="font-serif text-5xl font-bold text-ink mb-2 tracking-tight">Folio.</h1>
                <p className="font-hand text-xl text-olive rotate-[-2deg]">
                    {mode === 'REGISTER' && 'Join the desk.'}
                    {(mode === 'REGISTER_VERIFY_OTP' || mode === 'VERIFY_OTP') && 'Check your mail.'}
                    {mode === 'LOGIN_PASS' && 'Welcome back.'}
                    {mode === 'LOGIN_OTP' && 'Magic entry.'}
                    {mode === 'RESET_REQUEST' && 'Reset your password.'}
                    {mode === 'RESET_VERIFY' && 'Enter code & new password.'}
                </p>
            </div>

            {resetSuccess && (
                <div className="bg-green-50 text-green-700 p-3 mb-4 text-sm font-mono border border-green-200 text-center animate-in fade-in">
                    Password updated. You can now sign in.
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm font-mono border border-red-200 text-center animate-in fade-in">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                
                {/* Name Input (Register Only) */}
                {mode === 'REGISTER' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2 ml-1">Full Name</label>
                        <Input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Typewriter Tom"
                            required
                        />
                    </div>
                )}

                {/* Email Input (all modes except OTP-only verify) */}
                {mode !== 'VERIFY_OTP' && mode !== 'REGISTER_VERIFY_OTP' && mode !== 'RESET_VERIFY' && (
                    <div>
                        <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2 ml-1">Email Address</label>
                        <Input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@gmail.com"
                            required
                        />
                    </div>
                )}
                {/* Show email read-only when verifying OTP / reset */}
                {(mode === 'VERIFY_OTP' || mode === 'REGISTER_VERIFY_OTP' || mode === 'RESET_VERIFY') && (
                    <div className="text-sm font-mono text-pencil-gray">
                        Code sent to <span className="text-ink font-semibold">{email}</span>
                    </div>
                )}

                {/* Password Input (Login Pass & Register) */}
                {(mode === 'LOGIN_PASS' || mode === 'REGISTER') && (
                    <div className="animate-in fade-in">
                        <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2 ml-1">Password</label>
                        <Input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                )}

                {/* New password (Reset verify only) */}
                {mode === 'RESET_VERIFY' && (
                    <>
                        <div>
                            <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2 ml-1">Verification Code</label>
                            <Input 
                                type="text" 
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="text-center text-2xl tracking-widest font-bold"
                                maxLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2 ml-1">New Password</label>
                            <Input 
                                type="password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                    </>
                )}

                {/* OTP Input (Login OTP & Register verify) */}
                {(mode === 'VERIFY_OTP' || mode === 'REGISTER_VERIFY_OTP') && (
                    <div className="animate-in fade-in">
                        <label className="block font-mono text-xs uppercase tracking-widest text-pencil-gray mb-2 ml-1">Verification Code</label>
                        <Input 
                            type="text" 
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="123456"
                            className="text-center text-3xl tracking-[1em] font-bold"
                            maxLength={6}
                            required
                            autoFocus
                        />
                    </div>
                )}

                <div className="pt-2">
                    <Button 
                        type="submit" 
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 
                         mode === 'REGISTER' ? 'Send verification code' : 
                         mode === 'REGISTER_VERIFY_OTP' ? 'Verify & create account' :
                         mode === 'LOGIN_OTP' ? 'Send Code' : 
                         mode === 'VERIFY_OTP' ? 'Verify & sign in' :
                         mode === 'RESET_REQUEST' ? 'Send reset code' :
                         mode === 'RESET_VERIFY' ? 'Reset password' : 'Sign In'}
                    </Button>
                </div>

                <Divider />

                {/* Toggles */}
                <div className="space-y-3 text-center">
                    {mode === 'LOGIN_PASS' && (
                        <>
                            <button type="button" onClick={() => switchMode('LOGIN_OTP')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                                <Sparkles size={14} /> Log in with Magic Code
                            </button>
                            <button type="button" onClick={() => switchMode('RESET_REQUEST')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                                <Lock size={14} /> Forgot password?
                            </button>
                            <button type="button" onClick={() => switchMode('REGISTER')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                                New here? Create Account
                            </button>
                        </>
                    )}

                    {mode === 'LOGIN_OTP' && (
                        <>
                            <button type="button" onClick={() => switchMode('LOGIN_PASS')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                                <Key size={14} /> Log in with Password
                            </button>
                            <button type="button" onClick={() => switchMode('REGISTER')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                                New here? Create Account
                            </button>
                        </>
                    )}

                    {mode === 'REGISTER' && (
                        <button type="button" onClick={() => switchMode('LOGIN_PASS')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                            Already have a desk? Sign In
                        </button>
                    )}

                    {(mode === 'VERIFY_OTP' || mode === 'REGISTER_VERIFY_OTP') && (
                        <button type="button" onClick={() => switchMode(mode === 'REGISTER_VERIFY_OTP' ? 'REGISTER' : 'LOGIN_OTP')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                            Try different email
                        </button>
                    )}

                    {(mode === 'RESET_REQUEST' || mode === 'RESET_VERIFY') && (
                        <button type="button" onClick={() => switchMode('LOGIN_PASS')} className="flex items-center justify-center gap-2 w-full text-xs font-mono uppercase tracking-widest text-pencil-gray hover:text-terracotta">
                            Back to Sign In
                        </button>
                    )}
                </div>
            </form>

            {/* Quick Demo Login Button - Subtle at bottom right */}
            <button 
                onClick={handleDemoLogin} 
                className="absolute bottom-2 right-4 text-stone-300 hover:text-pencil-gray transition-colors text-xs font-mono flex items-center gap-1"
                title="Quick Demo Login (Admin/Admin)"
            >
                <Bug size={12} /> Demo
            </button>
        </PaperSheet>
    </div>
  );
};

export default Login;