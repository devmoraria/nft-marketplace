import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/account/AccountPages'
export const Route = createFileRoute('/carteiras')({ component: WalletsPage })
