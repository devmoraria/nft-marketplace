import { setupWorker } from 'msw/browser'
import { installControls } from './controls'
import { handlers } from './handlers'
import { realtimeHandlers } from './realtime'

export const worker = setupWorker(...handlers, ...realtimeHandlers)
installControls()
