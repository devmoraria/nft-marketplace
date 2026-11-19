import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/account/AccountPages'
export const Route = createFileRoute('/perfil')({ component: ProfilePage })
