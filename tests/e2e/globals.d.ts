import type { MockControls } from '../../src/mocks/controls'

declare global {
  interface Window {
    __mocks?: MockControls
  }
}

export {}