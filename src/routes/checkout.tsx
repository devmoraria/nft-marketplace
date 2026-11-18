import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CheckoutPage } from '@/features/checkout/CheckoutPage'

export const Route = createFileRoute('/checkout')({
  validateSearch: z.object({ coupon: z.string().optional() }),
  component: Page,
})

function Page() {
  const { coupon } = Route.useSearch()
  return <CheckoutPage coupon={coupon} />
}
