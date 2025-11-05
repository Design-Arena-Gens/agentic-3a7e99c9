"use client";

import { useEffect, useMemo, useState } from "react";

type Flight = {
  price: number;
  currency: string;
  deepLink: string;
  airlines: string[];
  route: Array<{
    airline: string;
    flightNo: string;
    from: string;
    to: string;
    departureUtc: string;
    arrivalUtc: string;
  }>;
  durationHours: number;
  numStops: number;
};

function formatDateInput(date: string) {
  // Expects YYYY-MM-DD
  return date;
}

function toNice(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Page() {
  const [origin, setOrigin] = useState("MAN");
  const [destination, setDestination] = useState("LIS");
  const [depart, setDepart] = useState("2025-12-18");
  const [ret, setRet] = useState("2025-12-31");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Flight[]>([]);

  const query = useMemo(() => ({ origin, destination, depart, ret }), [origin, destination, depart, ret]);

  async function search() {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const params = new URLSearchParams({
        origin,
        destination,
        depart,
        ret,
      });
      const res = await fetch(`/api/search?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      setResults(data.results as Flight[]);
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // auto search on first load
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 980, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 28, margin: '8px 0 16px' }}>Manchester ? Lisbon flight deals</h1>
      <div style={{ background: '#0f172a', border: '1px solid #1f2a44', borderRadius: 12, padding: 16, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', alignItems: 'end' }}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#93a4bf', marginBottom: 6 }}>From</label>
          <input value={origin} onChange={e => setOrigin(e.target.value.toUpperCase())} placeholder="MAN" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #33415f', background: '#0b1220', color: '#e6eaf2' }} />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={{ display: 'block', fontSize: 12, color: '#93a4bf', marginBottom: 6 }}>To</label>
          <input value={destination} onChange={e => setDestination(e.target.value.toUpperCase())} placeholder="LIS" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #33415f', background: '#0b1220', color: '#e6eaf2' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#93a4bf', marginBottom: 6 }}>Depart</label>
          <input type="date" value={formatDateInput(depart)} onChange={e => setDepart(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #33415f', background: '#0b1220', color: '#e6eaf2' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#93a4bf', marginBottom: 6 }}>Return</label>
          <input type="date" value={formatDateInput(ret)} onChange={e => setRet(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #33415f', background: '#0b1220', color: '#e6eaf2' }} />
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <button onClick={search} disabled={loading} style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #425072', background: loading ? '#1a2540' : '#1d2a4d', color: '#e6eaf2', cursor: 'pointer', width: '100%', fontWeight: 600 }}>
            {loading ? 'Searching?' : 'Find cheapest flights'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: '#3b1d1d', border: '1px solid #6b2d2d' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {results.map((f, idx) => (
          <a key={idx} href={f.deepLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#0f172a', border: '1px solid #1f2a44', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, color: '#93a4bf', marginBottom: 6 }}>
                  {f.numStops === 0 ? 'Nonstop' : `${f.numStops} stop${f.numStops > 1 ? 's' : ''}`} ? {f.durationHours.toFixed(1)}h ? {f.airlines.join(', ')}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {f.route.map((r, i) => (
                    <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: '#0b1220', border: '1px solid #33415f' }}>
                      <strong>{r.from}?{r.to}</strong> {toNice(r.departureUtc)} ? {toNice(r.arrivalUtc)} ({r.airline}{r.flightNo ? ` ${r.flightNo}` : ''})
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right', alignSelf: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{f.currency} {f.price.toFixed(0)}</div>
                <div style={{ fontSize: 12, color: '#93a4bf' }}>Book on provider</div>
              </div>
            </div>
          </a>
        ))}
        {!loading && results.length === 0 && !error && (
          <div style={{ color: '#93a4bf' }}>No results found. Try adjusting dates or airports.</div>
        )}
      </div>
    </main>
  );
}
