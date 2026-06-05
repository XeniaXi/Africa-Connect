const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';
const ADMIN_JWT = process.env.ADMIN_JWT ?? '';

function adminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${ADMIN_JWT}`,
  };
}

// ── Businesses ──────────────────────────────────────────────────────────────

export async function getBusinesses(limit = 50): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/businesses?limit=${limit}`, {
      headers: adminHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Handle both array responses and { data: [...] } shapes
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}

export async function getBusiness(id: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_URL}/businesses/${id}`, {
      headers: adminHeaders(),
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Claims ───────────────────────────────────────────────────────────────────

export async function getPendingClaims(): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/admin/claims?status=PENDING`, {
      headers: adminHeaders(),
      next: { revalidate: 30 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}

export async function approveClaim(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/claims/${id}/approve`, {
      method: 'POST',
      headers: adminHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function rejectClaim(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_URL}/claims/${id}/reject`, {
      method: 'POST',
      headers: adminHeaders(),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.message ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// ── Partners ─────────────────────────────────────────────────────────────────

export async function getPartners(): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/admin/partners`, {
      headers: adminHeaders(),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    return [];
  }
}
