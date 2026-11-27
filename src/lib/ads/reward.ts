// Adapter foundation only. No SDK or ad request is installed by this module.
export type RewardCallbacks = {
  type: "reward"; name: string;
  beforeReward: (showAd: () => void) => void;
  adViewed: () => void;
  adDismissed: () => void;
  adBreakDone: () => void;
};
export function requestOptionalReward(adBreak: (callbacks: RewardCallbacks) => void, options: {
  name: string; offer: (accept: () => void) => void; grant: () => void; finish: () => void;
}) {
  let accepted = false, settled = false, offered = false;
  const finish = (earned: boolean) => {
    if (settled) return;
    settled = true;
    try { if (earned && accepted) options.grant(); }
    finally { options.finish(); }
  };
  try {
    adBreak({ type: "reward", name: options.name,
      beforeReward: (showAd) => {
        if (settled || offered) return;
        offered = true;
        options.offer(() => {
          if (settled || accepted) return;
          accepted = true;
          try { showAd(); } catch { finish(false); }
        });
      },
      adViewed: () => finish(true),
      adDismissed: () => finish(false),
      adBreakDone: () => finish(false),
    });
  } catch { finish(false); }
  return { cancel: () => finish(false) };
}
