import { getRouteApi } from '@tanstack/react-router'
import { AuthPage } from './AuthPage'

const loginRoute = getRouteApi('/login')
const signupRoute = getRouteApi('/signup')

export function LoginPage() {
  const { redirect } = loginRoute.useSearch()
  return <AuthPage mode="login" redirect={redirect} />
}

export function SignupPage() {
  const { redirect } = signupRoute.useSearch()
  return <AuthPage mode="signup" redirect={redirect} />
}
