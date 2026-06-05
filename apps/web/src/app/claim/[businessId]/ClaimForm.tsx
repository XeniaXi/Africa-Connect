'use client';

import { useState } from 'react';
import styles from './ClaimForm.module.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

type ClaimMethod = 'phone' | 'email' | 'document';
type ClaimStep = 'choose' | 'contact' | 'otp' | 'done';

interface ClaimFormProps {
  businessId: string;
  businessName: string;
}

export default function ClaimForm({ businessId, businessName }: ClaimFormProps) {
  const [method, setMethod] = useState<ClaimMethod>('phone');
  const [step, setStep] = useState<ClaimStep>('choose');
  const [contactValue, setContactValue] = useState('');
  const [otp, setOtp] = useState('');
  const [claimId, setClaimId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!contactValue.trim()) return;

    setLoading(true);
    setError('');
    try {
      const body: Record<string, string> = {
        businessId,
        claimMethod: method,
      };
      if (method === 'phone') body.phone = contactValue;
      if (method === 'email') body.email = contactValue;

      const res = await fetch(`${API_URL}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      setClaimId(data.id ?? data.claimId ?? '');
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/claims/${claimId}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? `Verification failed (${res.status})`);
      }

      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <div className={styles.form}>
        <div className={styles.successBox}>
          <span className={styles.successIcon}>🎉</span>
          <h2 className={styles.successTitle}>Business claimed!</h2>
          <p className={styles.successDesc}>
            Your profile for <strong>{businessName}</strong> is now managed by you.
            Your trust score will increase as you add more details.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className={styles.form}>
        <h2 className={styles.formTitle}>Enter verification code</h2>
        <p className={styles.formDesc}>
          We sent an OTP to <strong>{contactValue}</strong>.
          Enter the code below to verify your ownership.
        </p>
        <div className={styles.infoBox}>
          OTP sent! Check your {method === 'phone' ? 'phone' : 'email'}.
        </div>
        {error && <div className={styles.errorBox}>{error}</div>}
        <form onSubmit={handleVerifyOtp}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="otp">Verification Code</label>
            <input
              id="otp"
              className={styles.input}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>Claim your business</h2>
      <p className={styles.formDesc}>
        Choose how you want to verify ownership of <strong>{businessName}</strong>.
      </p>

      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Method selector */}
      <div className={styles.methodGroup}>
        {(
          [
            { value: 'phone', icon: '📱', label: 'Phone OTP', sub: 'Receive a code via SMS' },
            { value: 'email', icon: '📧', label: 'Email OTP', sub: 'Receive a code via email' },
            { value: 'document', icon: '📄', label: 'Document Upload', sub: 'Upload business documents' },
          ] as const
        ).map(({ value, icon, label, sub }) => (
          <label
            key={value}
            className={`${styles.methodOption} ${method === value ? styles.methodOptionSelected : ''}`}
          >
            <input
              type="radio"
              name="claimMethod"
              value={value}
              checked={method === value}
              onChange={() => setMethod(value)}
            />
            <span className={styles.methodIcon}>{icon}</span>
            <div>
              <div className={styles.methodLabel}>{label}</div>
              <div className={styles.methodSublabel}>{sub}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Document upload placeholder */}
      {method === 'document' ? (
        <div className={styles.documentBox}>
          <p>
            Document upload coming soon.{' '}
            <br />
            Please contact{' '}
            <a href="mailto:support@connectafrica.io" className={styles.documentLink}>
              support@connectafrica.io
            </a>
            {' '}to proceed manually.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSendOtp}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact">
              {method === 'phone' ? 'Phone Number' : 'Email Address'}
            </label>
            <input
              id="contact"
              className={styles.input}
              type={method === 'phone' ? 'tel' : 'email'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              placeholder={
                method === 'phone'
                  ? '+234 800 000 0000'
                  : 'your@business.com'
              }
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      )}
    </div>
  );
}
