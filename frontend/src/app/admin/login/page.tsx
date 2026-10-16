'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useFeedback } from '@/context/FeedbackContext';
import { Card, CardContent } from '@/components/ui/Card';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin } = useFeedback();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fillDemoCredentials = () => {
    setEmail('admin@civicconnect.gov.in');
    setPassword('DemoAdmin@2026');
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both administrative email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = loginAdmin(password);
      if (success) {
        router.push('/admin/dashboard');
      } else {
        setError('Invalid credentials. For the prototype, use password "DemoAdmin@2026" or click "Fill Demo Credentials".');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 py-12 bg-gradient-to-b from-[#F2F7F4]/50 via-[#FBFBF9] to-[#FBFBF9]">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#46664F] text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Administrative Access
          </h1>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            CivicConnect Analytics & Departmental Quality Intelligence Portal
          </p>
        </div>

        {/* Prototype Warning Banner */}
        <div className="p-3.5 rounded-xl bg-[#FEF8EB] border border-[#FDE68A] text-xs text-[#92400E] flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Demonstration Mode Notice</p>
            <p className="text-[11px] text-[#B45309] mt-0.5 leading-relaxed">
              This is a prototype authentication interface. Browser local state simulates an authorized state nodal officer session. Do not enter confidential passwords.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-stone-200/90 shadow-sm bg-white">
          <CardContent className="p-6 sm:p-8 space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Official Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nodal.officer@kerala.gov.in"
                    className="w-full rounded-xl border border-stone-300 pl-9 pr-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#46664F] focus:border-transparent bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Access Passphrase
                  </label>
                  <span className="text-[10px] text-stone-400">Demo: DemoAdmin@2026</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-stone-300 pl-9 pr-10 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#46664F] focus:border-transparent bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#46664F] text-white hover:bg-[#38523F] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Enter Administrative Suite</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Credentials Autofill */}
            <div className="pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={fillDemoCredentials}
                className="w-full py-2 px-3 rounded-lg border border-dashed border-[#CADACF] bg-[#F2F7F4] hover:bg-[#E2EDE5] text-[#2C4032] text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#46664F]" />
                <span>Fill 1-Click Demo Credentials</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Back to Citizen Portal */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Citizen Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
