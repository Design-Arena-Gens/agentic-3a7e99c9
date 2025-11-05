import { NextResponse } from "next/server";

function toKiwiDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = (url.searchParams.get('origin') || 'MAN').toUpperCase();
  const destination = (url.searchParams.get('destination') || 'LIS').toUpperCase();
  const departIso = url.searchParams.get('depart') || new Date().toISOString().slice(0, 10);
  const returnIso = url.searchParams.get('ret') || new Date(Date.now() + 7*86400000).toISOString().slice(0, 10);

  const dateFrom = toKiwiDate(departIso);
  const dateTo = dateFrom;
  const returnFrom = toKiwiDate(returnIso);
  const returnTo = returnFrom;

  const searchParams = new URLSearchParams({
    partner: 'picky',
    fly_from: origin,
    to: destination,
    dateFrom,
    dateTo,
    return_from: returnFrom,
    return_to: returnTo,
    adults: '1',
    curr: 'GBP',
    sort: 'price',
    limit: '20',
    flight_type: 'round',
    one_for_city: '0',
    one_per_date: '0',
    max_stopovers: '2',
  });

  const endpoint = `https://api.skypicker.com/flights?${searchParams.toString()}`;

  try {
    const res = await fetch(endpoint, { next: { revalidate: 0 }, headers: { 'accept': 'application/json' } });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream error ${res.status}` }, { status: 502 });
    }
    const json = await res.json();
    const results = (json.data || []).map((item: any) => {
      const price = item.price;
      const currency = (json.currency as string) || 'GBP';
      const deepLink = item.deep_link || item.deepLink || item.link || `https://www.kiwi.com/en/search/results/${origin}/${destination}/${departIso}/${returnIso}`;
      const airlines = Array.from(new Set((item.route || []).map((r: any) => r.airline))).filter(Boolean);
      const route = (item.route || []).map((r: any) => ({
        airline: r.airline,
        flightNo: String(r.flight_no || r.flightNo || ''),
        from: r.flyFrom,
        to: r.flyTo,
        departureUtc: new Date((r.utc_departure || r.dTimeUTC) * 1000).toISOString(),
        arrivalUtc: new Date((r.utc_arrival || r.aTimeUTC) * 1000).toISOString(),
      }));
      const numStops = Math.max(0, (item.route?.length || 1) - 1);
      const durationSeconds = item.duration?.total || item.duration || 0;
      const durationHours = Number((durationSeconds / 3600).toFixed(2));
      return { price, currency, deepLink, airlines, route, durationHours, numStops };
    }).sort((a: any, b: any) => a.price - b.price);

    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}
