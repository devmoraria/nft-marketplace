import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/features/auth/AuthPage'
import { authSearch } from '@/features/auth/schemas'

function SignupRoute() {
  const { redirect } = Route.useSearch()
  return <AuthPage mode="signup" redirect={redirect} />
}

export const Route = createFileRoute('/signup')({ validateSearch: authSearch, component: SignupRoute })
