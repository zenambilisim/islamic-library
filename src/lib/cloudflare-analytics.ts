const ZONE_ID = (process.env.ZONE_ID ?? '').trim();
const ZONE_TOKEN = (process.env.ZONE_TOKEN ?? '').trim();

const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

const ZONE_DAILY_QUERY = `
  query ZoneDailyTraffic($zoneTag: string!, $since: Date!, $until: Date!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequests1dGroups(
          limit: 31
          orderBy: [date_DESC]
          filter: { date_geq: $since, date_leq: $until }
        ) {
          dimensions {
            date
          }
          sum {
            requests
          }
          uniq {
            uniques
          }
        }
      }
    }
  }
`;

export function isCloudflareAnalyticsConfigured(): boolean {
  return ZONE_ID.length > 0 && ZONE_TOKEN.length > 0;
}

export type TrafficPeriod = {
  requests: number;
  uniques: number;
};

export type TrafficDay = {
  date: string;
  requests: number;
  uniques: number;
};

export type ZoneTrafficAnalytics = {
  today: TrafficPeriod;
  last7Days: TrafficPeriod;
  last30Days: TrafficPeriod;
  daily: TrafficDay[];
};

type DailyGroup = {
  dimensions?: { date?: string | null } | null;
  sum?: { requests?: number | null } | null;
  uniq?: { uniques?: number | null } | null;
};

type GraphQLResponse = {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequests1dGroups?: DailyGroup[] | null;
      }> | null;
    } | null;
  } | null;
  errors?: Array<{ message?: string }> | null;
};

function startOfUtcDay(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function readDaily(groups: DailyGroup[] | null | undefined): TrafficDay[] {
  if (!groups?.length) return [];
  return groups
    .map((g) => ({
      date: g.dimensions?.date ?? '',
      requests: g.sum?.requests ?? 0,
      uniques: g.uniq?.uniques ?? 0,
    }))
    .filter((d) => d.date)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Günlük benzersiz ziyaretçileri toplar; çok günlük aralıkta tekrar eden ziyaretçiler sayılabilir. */
function sumPeriod(days: TrafficDay[], dayCount: number): TrafficPeriod {
  const slice = days.slice(0, dayCount);
  return {
    requests: slice.reduce((acc, d) => acc + d.requests, 0),
    uniques: slice.reduce((acc, d) => acc + d.uniques, 0),
  };
}

export async function fetchZoneTrafficAnalytics(): Promise<ZoneTrafficAnalytics> {
  if (!isCloudflareAnalyticsConfigured()) {
    throw new Error('Cloudflare analytics yapılandırılmamış (ZONE_ID / ZONE_TOKEN).');
  }

  const now = new Date();
  const since30 = startOfUtcDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  const todayStr = toDateString(now);

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ZONE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: ZONE_DAILY_QUERY,
      variables: {
        zoneTag: ZONE_ID,
        since: toDateString(since30),
        until: todayStr,
      },
    }),
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Cloudflare API HTTP ${res.status}`);
  }

  const json = (await res.json()) as GraphQLResponse;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).filter(Boolean).join('; ') || 'GraphQL hatası');
  }

  const groups = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  const daily = readDaily(groups);
  if (!daily.length) {
    throw new Error('Zone verisi alınamadı. ZONE_ID ve token izinlerini kontrol edin.');
  }

  const todayRow = daily.find((d) => d.date === todayStr);
  const today: TrafficPeriod = todayRow ?? { requests: 0, uniques: 0 };

  return {
    today,
    last7Days: sumPeriod(daily, 7),
    last30Days: sumPeriod(daily, 30),
    daily,
  };
}
