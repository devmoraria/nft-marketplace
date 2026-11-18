import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/checkout/OrderPage'

export const Route = createFileRoute('/orders/$orderId')({ component: Page })

function Page() {
  const { orderId } = Route.useParams()
  return <OrderPage orderId={orderId} />
}
