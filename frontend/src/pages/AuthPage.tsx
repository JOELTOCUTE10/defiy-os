import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const AuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, register, } = useAuth();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isRegister) {
        await register(email, password);
        showToast('Account created successfully! Welcome to Defiy OS.', 'success');
      } else {
        await login(email, password);
        showToast('Welcome back!', 'success');
      }
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please check your credentials.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-darkbg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-brand-accent/10 dark:bg-brand-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-brand-accent text-white shadow-xl shadow-brand-500/30 mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Defiy OS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your AI Personal Life Coach & Executive Assistant
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 sm:p-8 backdrop-blur-xl border border-slate-200/80 dark:border-darkborder shadow-xl">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200 dark:border-darkborder">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isRegister ? 'Create an Account' : 'Welcome Back'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="pl-10"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                  className="pl-10"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={loading}
              className="mt-6 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{isRegister ? 'Get Started' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-6">
            By signing in, you agree to Defiy OS Privacy Guidelines & Terms.
          </p>
        </Card>
      </div>
    </div>
  );
};
