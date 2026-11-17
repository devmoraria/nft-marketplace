export interface CouponRecord { code: string; percent: number; expiresAt: string }

export function buildCoupons(): CouponRecord[] {
  return [
    { code: 'WELCOME10', percent: 10, expiresAt: '2099-12-31T23:59:59.000Z' }, // válido
    { code: 'EXPIRED20', percent: 20, expiresAt: '2026-01-01T00:00:00.000Z' }, // expirado
  ]
}
