import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/features/auth/AuthPage'
import { authSearch } from '@/features/auth/schemas'

function LoginRoute() {
  const { redirect } = Route.useSearch()
  return <AuthPage mode="login" redirect={redirect} />
}

export const Route = createFileRoute('/login')({ validateSearch: authSearch, component: LoginRoute })
