import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/home/HomePage'
import { homeSearch } from '@/features/home/search'

export const Route = createFileRoute('/')({ validateSearch: homeSearch, component: HomePage })
