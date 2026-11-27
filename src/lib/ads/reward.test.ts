import { describe, expect, it, vi } from "vitest";
import { requestOptionalReward, type RewardCallbacks } from "./reward";
function fixture() {
  let callbacks!: RewardCallbacks;
  let accept!: () => void;
  const grant = vi.fn(), finish = vi.fn(), show = vi.fn();
  const request = requestOptionalReward(c => { callbacks = c; }, { name: "practice_hint", offer: a => { accept = a; }, grant, finish });
  callbacks.beforeReward(show);
  return { callbacks, accept, grant, finish, show, request };
}
describe("optional rewarded ad", () => {
  it("only shows after acceptance and grants exactly once after viewing", () => {
    const f = fixture(); expect(f.show).not.toHaveBeenCalled();
    f.accept(); f.accept(); expect(f.show).toHaveBeenCalledTimes(1);
    f.callbacks.adViewed(); f.callbacks.adViewed(); f.callbacks.adBreakDone();
    expect(f.grant).toHaveBeenCalledTimes(1); expect(f.finish).toHaveBeenCalledTimes(1);
  });
  it("never grants without explicit acceptance", () => {
    const f = fixture(); f.callbacks.adViewed(); expect(f.grant).not.toHaveBeenCalled();
  });
  it("never grants a dismissed ad", () => {
    const f = fixture(); f.accept(); f.callbacks.adDismissed(); f.callbacks.adViewed();
    expect(f.grant).not.toHaveBeenCalled();
  });
  it("never grants after cancellation", () => {
    const f = fixture(); f.request.cancel(); f.accept(); f.callbacks.adViewed();
    expect(f.show).not.toHaveBeenCalled(); expect(f.grant).not.toHaveBeenCalled();
  });
  it("finishes without reward when no ad is available", () => {
    const f = fixture(); f.callbacks.adBreakDone(); expect(f.grant).not.toHaveBeenCalled();
    expect(f.finish).toHaveBeenCalledTimes(1);
  });
});
