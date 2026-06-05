'use client';

import { useState } from 'react';
import styles from './ClaimActions.module.css';

interface Props {
  claimId: string;
}

type State = 'idle' | 'loading' | 'approved' | 'rejected' | 'error';

export default function ClaimActions({ claimId }: Props) {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
  const ADMIN_JWT = process.env.NEXT_PUBLIC_ADMIN_JWT ?? '';

  async function handleAction(action: 'approve' | 'reject') {
    setState('loading');
    try {
      const res = await fetch(`${API_URL}/claims/${claimId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_JWT}`,
        },
      });
      if (res.ok) {
        setState(action === 'approve' ? 'approved' : 'rejected');
      } else {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body?.message ?? `HTTP ${res.status}`);
        setState('error');
      }
    } catch (err) {
      setErrorMsg(String(err));
      setState('error');
    }
  }

  if (state === 'approved') {
    return <span className={`${styles.result} ${styles.resultOk}`}>Approved</span>;
  }
  if (state === 'rejected') {
    return <span className={`${styles.result} ${styles.resultErr}`}>Rejected</span>;
  }
  if (state === 'error') {
    return (
      <span className={`${styles.result} ${styles.resultErr}`} title={errorMsg}>
        Error
      </span>
    );
  }

  return (
    <div className={styles.actions}>
      <button
        className={styles.approveBtn}
        disabled={state === 'loading'}
        onClick={() => handleAction('approve')}
      >
        Approve
      </button>
      <button
        className={styles.rejectBtn}
        disabled={state === 'loading'}
        onClick={() => handleAction('reject')}
      >
        Reject
      </button>
    </div>
  );
}
