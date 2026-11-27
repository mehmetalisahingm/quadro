import { describe, expect, it } from "vitest";
import { calculateAdMetrics } from "./metrics";
describe("ad metrics", () => {
  it("uses the reported period, not guessed revenue", () => {
    expect(calculateAdMetrics({ earnings: 40, impressions: 2000, requests: 3000, visitors: 500, pageViews: 1000 })).toEqual({ impressionRpm: 20, pageRpm: 40, revenuePerVisitor: .08, impressionsPerVisitor: 4, impressionsPerRequest: 2/3 });
  });
  it("does not misrepresent missing data as zero RPM", () => {
    expect(calculateAdMetrics({ earnings: 0, impressions: 0, requests: 0, visitors: 0, pageViews: 0 }).impressionRpm).toBeNull();
  });
});
