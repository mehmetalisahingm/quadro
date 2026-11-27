export function calculateAdMetrics(input: { earnings: number; impressions: number; requests: number; visitors: number; pageViews: number }) {
  const ratio = (n: number, d: number) => Number.isFinite(n) && Number.isFinite(d) && n >= 0 && d > 0 ? n / d : null;
  const impression = ratio(input.earnings, input.impressions);
  const page = ratio(input.earnings, input.pageViews);
  const fill = ratio(input.impressions, input.requests);
  return { impressionRpm: impression === null ? null : impression * 1000,
    pageRpm: page === null ? null : page * 1000,
    revenuePerVisitor: ratio(input.earnings, input.visitors),
    impressionsPerVisitor: ratio(input.impressions, input.visitors),
    impressionsPerRequest: fill };
}
