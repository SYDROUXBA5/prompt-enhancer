export type Enhancer = {
  status: 'idle' | 'working' | 'ready' | 'failed'
  /** The draft as it stood before enhancing, what Undo puts back. */
  original: string
  enhanced: string
  /** Whether the prompt box took the enhanced text; false where the band shows it instead. */
  isInBox: boolean
  error: string
}

declare module 'claude-code' {
  interface PluginState {
    'prompt-enhancer': { view: Enhancer; hasBox: boolean }
  }
}
