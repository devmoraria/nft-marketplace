import { createFileRoute } from '@tanstack/react-router'
import { LoginPage } from '@/features/auth/AuthRoutes'
import { authSearch } from '@/features/auth/schemas'

export const Route = createFileRoute('/login')({ validateSearch: authSearch, component: LoginPage })
