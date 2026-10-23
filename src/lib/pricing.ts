/** Family plan prices in USD, shared by the app's plan cards and the public pricing pages. The first kid pays the base price; each additional kid adds perKid. */
export const PLAN_PRICES = {
  monthly: { base: 10, perKid: 5 },
  yearly: { base: 96, perKid: 48 },
};

export function planTotal(cycle: keyof typeof PLAN_PRICES, kids: number): number {
  const p = PLAN_PRICES[cycle];
  return p.base + Math.max(0, kids - 1) * p.perKid;
}
