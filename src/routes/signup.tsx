import { createFileRoute } from '@tanstack/react-router'
import { SignupPage } from '@/features/auth/AuthRoutes'
import { authSearch } from '@/features/auth/schemas'

export const Route = createFileRoute('/signup')({ validateSearch: authSearch, component: SignupPage })
