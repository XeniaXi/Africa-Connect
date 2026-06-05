const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

// Next.js augments the fetch API with a `next` option for caching/revalidation.
// We type it here to avoid TS errors in strict mode.
interface NextFetchInit extends RequestInit {
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface Business {
  id: string;
  displayName: string;
  category: string;
  city: string;
  state: string;
  trustScore: number;
  verificationLevel: number;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  claimedByUserId?: string | null;
  description?: string;
}

export async function searchBusinesses(params: {
  intent?: string;
  category?: string;
  city?: string;
  limit?: number;
}): Promise<Business[]> {
  try {
    const options: NextFetchInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      next: { revalidate: 30 },
    };
    const res = await fetch(`${API_URL}/search`, options as RequestInit);
    if (!res.ok) return [];
    const data = await res.json();
    // API may return { data: [...] } or just [...]
    return Array.isArray(data) ? data : (data.data ?? []);
  } catch {
    return [];
  }
}

export async function getBusiness(id: string): Promise<Business | null> {
  try {
    const options: NextFetchInit = { next: { revalidate: 60 } };
    const res = await fetch(`${API_URL}/businesses/${id}`, options as RequestInit);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data ?? data;
  } catch {
    return null;
  }
}
