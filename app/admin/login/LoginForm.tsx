'use client';

/**
 * Keraunous Tech Store — Admin Login & MFA State Machine
 *
 * Steps:
 * 1. Password verification (rate-limited, generic error messages)
 * 2. MFA code verification (AAL2 TOTP challenge)
 * 3. Forced MFA enrollment on first login (QR code, manual secret, recovery codes)
 */

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  loginAction,
  verifyMfaAction,
  startMfaEnrollAction,
  confirmMfaEnrollAction,
  type MfaEnrollResult,
} from '@/modules/auth/actions';

type LoginStep = 'password' | 'mfa_verify' | 'mfa_enroll' | 'recovery_confirmed';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/admin/dashboard';
  const initialMfa = searchParams.get('mfa') === '1';
  const initialError = searchParams.get('error');

  const [step, setStep] = useState<LoginStep>(initialMfa ? 'mfa_verify' : 'password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [enrollData, setEnrollData] = useState<MfaEnrollResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    initialError === 'unauthorized' ? 'Access denied. Administrator privileges required.' : null,
  );
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [confirmedSavedCodes, setConfirmedSavedCodes] = useState(false);

  // --- Step 1: Password Login ---
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await loginAction({ email, password });
      if (!res.ok) {
        setErrorMsg(res.error.message);
        setIsLoading(false);
        return;
      }

      if (res.data.step === 'mfa_required') {
        setFactorId(res.data.factorId);
        setStep('mfa_verify');
      } else if (res.data.step === 'mfa_enroll_required') {
        // Trigger enrollment initialization
        const enrollRes = await startMfaEnrollAction();
        if (enrollRes.ok) {
          setEnrollData(enrollRes.data);
          setFactorId(enrollRes.data.factorId);
          setStep('mfa_enroll');
        } else {
          setErrorMsg(enrollRes.error.message);
        }
      } else if (res.data.step === 'authenticated') {
        router.push(nextPath);
      }
    } catch {
      setErrorMsg('An unexpected connection error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: MFA Verification ---
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await verifyMfaAction(factorId, mfaCode);
      if (!res.ok) {
        setErrorMsg(res.error.message);
        setIsLoading(false);
        return;
      }
      router.push(nextPath);
    } catch {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 3: MFA Enrollment Confirm ---
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedSavedCodes) {
      setErrorMsg('Please confirm that you have saved your recovery codes.');
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await confirmMfaEnrollAction(factorId, mfaCode);
      if (!res.ok) {
        setErrorMsg(res.error.message);
        setIsLoading(false);
        return;
      }
      router.push(nextPath);
    } catch {
      setErrorMsg('Failed to verify MFA enrollment code.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'codes') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-border-default rounded-xl shadow-lg p-6 sm:p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-orange/10 flex items-center justify-center text-accent-orange mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Keraunous Admin Portal
        </h1>
        <p className="text-sm text-text-muted mt-1">
          {step === 'password' && 'Enter your administrative credentials'}
          {step === 'mfa_verify' && 'Two-Factor Authentication Required'}
          {step === 'mfa_enroll' && 'Setup Two-Factor Authentication'}
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 animate-fadeIn"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: PASSWORD FORM */}
      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@keraunous.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      )}

      {/* STEP 2: MFA VERIFICATION */}
      {step === 'mfa_verify' && (
        <form onSubmit={handleMfaSubmit} className="space-y-4">
          <div className="p-3 bg-neutral-50 rounded-lg text-xs text-text-muted leading-relaxed">
            Enter the 6-digit security code generated by your authenticator app
            (Google Authenticator, 1Password, or iCloud Keychain).
          </div>

          <div>
            <label
              htmlFor="mfaCode"
              className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
            >
              6-Digit Authenticator Code
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <Input
                id="mfaCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="pl-9 tracking-widest text-base font-mono"
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || mfaCode.length !== 6}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Validating Code...
              </>
            ) : (
              'Verify & Access Admin'
            )}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep('password');
              setMfaCode('');
              setErrorMsg(null);
            }}
            className="w-full text-center text-xs text-text-muted hover:text-text-primary transition-colors mt-2"
          >
            ← Back to password sign-in
          </button>
        </form>
      )}

      {/* STEP 3: MFA ENROLLMENT (FIRST TIME LOGIN) */}
      {step === 'mfa_enroll' && enrollData && (
        <form onSubmit={handleEnrollSubmit} className="space-y-5">
          <div className="text-xs text-text-secondary bg-blue-50/70 border border-blue-200 p-3 rounded-lg leading-relaxed">
            <strong>Mandatory Two-Factor Setup:</strong> Scan this QR code with your authenticator app to enable MFA for your administrative account.
          </div>

          {/* QR Code display */}
          <div className="flex flex-col items-center justify-center p-4 bg-neutral-50 rounded-lg border border-border-default">
            {enrollData.qrCode ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enrollData.qrCode}
                alt="TOTP QR Code"
                className="w-44 h-44 rounded-md shadow-sm bg-white p-2"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <QrCode className="w-6 h-6" /> Scan using Authenticator App
              </div>
            )}

            {/* Manual Secret Key */}
            <div className="mt-3 w-full">
              <span className="block text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1 text-center">
                Or enter key manually:
              </span>
              <div className="flex items-center gap-1.5 bg-white border border-border-default rounded px-2.5 py-1.5">
                <code className="text-xs font-mono select-all truncate flex-1 text-center">
                  {enrollData.secret}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(enrollData.secret, 'secret')}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors"
                  title="Copy secret key"
                >
                  {copiedSecret ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Recovery Codes Section */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900">
                Backup Recovery Codes
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(enrollData.recoveryCodes.join('\n'), 'codes')
                }
                className="text-xs font-medium text-amber-800 hover:text-amber-950 flex items-center gap-1"
              >
                {copiedCodes ? (
                  <>
                    <Check className="w-3 h-3 text-green-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy All
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-neutral-800 bg-white/80 p-2 rounded border border-amber-200/50">
              {enrollData.recoveryCodes.map((code) => (
                <span key={code} className="text-center py-0.5 bg-neutral-50 rounded">
                  {code}
                </span>
              ))}
            </div>
            <label className="flex items-start gap-2 mt-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedSavedCodes}
                onChange={(e) => setConfirmedSavedCodes(e.target.checked)}
                className="mt-0.5 rounded border-amber-300 text-accent-orange focus:ring-accent-orange"
              />
              <span className="text-[11px] text-amber-900 leading-tight">
                I have securely saved these backup recovery codes.
              </span>
            </label>
          </div>

          {/* Confirm Code Input */}
          <div>
            <label
              htmlFor="enrollCode"
              className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1.5"
            >
              Enter Code from App to Confirm
            </label>
            <Input
              id="enrollCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="123456"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              className="tracking-widest font-mono text-center text-base"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading || mfaCode.length !== 6 || !confirmedSavedCodes}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Completing Setup...
              </>
            ) : (
              'Activate 2FA & Access Admin'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
