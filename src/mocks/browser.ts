import { setupWorker } from 'msw/browser'
import { installControls } from './controls'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
installControls()
