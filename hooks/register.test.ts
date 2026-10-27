import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const BAND = {
  plugin: 'prompt-enhancer',
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 0 },
    view: {},
  },
} as const

const USAGE = {
  input_tokens: 0,
  output_tokens: 0,
  cache_read_input_tokens: 0,
  cache_creation_input_tokens: 0,
}

// A prompt as the person's own Enter raises it.
const typed = (text: string) =>
  ({ text, wait: false, origin: { kind: 'composer' } }) as const

type Stage = { draft: string; hasBox?: boolean; reply?: string }

// Stands for the engine: a prompt box, a model that answers `reply` or not at all, and the prompts sent.
// A call on `$` (read, fork, complete) is answered `{ value }`; an event (fill, submit) with its result.
const stage = (on: On, { draft, hasBox = true, reply }: Stage) => {
  const seen = { box: draft, asks: 0, sent: [] as string[] }

  on('prompt.read', () => ({
    value: { text: seen.box, cursor: seen.box.length },
  }))
  on('prompt.fill', (_$, e) => {
    if (!hasBox) {
      return { isFilled: false }
    }

    seen.box = e.mode === 'append' ? seen.box + e.text : e.text

    return { isFilled: true }
  })
  on('model.fork', () => {
    seen.asks += 1

    return reply === undefined
      ? { value: { isAnswered: false, reason: 'nothing-to-fork' } as const }
      : { value: { isAnswered: true, text: reply, usage: USAGE } as const }
  })
  on('model.complete', () => {
    seen.asks += 1

    return {
      value: { isAnswered: false, reason: 'empty-reply', usage: USAGE } as const,
    }
  })
  on('prompt.submit', (_$, e) => {
    seen.sent.push(e.text)

    return { text: e.text }
  })

  return seen
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`the box takes the enhanced prompt and Undo puts the draft back (${surface})`, async ($, on) => {
    const seen = stage(on, { draft: 'fix the bug', reply: 'Fix the login bug.' })
    const ui = await $.ui.mount({ ...BAND, surface })

    // Idle, the band is the button alone.
    expect(await ui.find({ type: 'Svg' })).toBe(undefined)

    await ui.press({ key: 'enhance' })
    expect(seen.box).toBe('Fix the login bug.')
    // The drawings are the desktop's; the terminal has no Svg to draw them with.
    expect((await ui.find({ type: 'Svg' })) !== undefined).toBe(
      surface === 'desktop',
    )
    expect(await ui.find({ key: 'send' })).toBeDefined()

    await ui.press({ key: 'undo' })
    expect(seen.box).toBe('fix the bug')
    expect(await ui.find({ key: 'enhance' })).toBeDefined()
    await ui.unmount()
  })
}

test('Send submits the box as the person left it, and empties it', async ($, on) => {
  const seen = stage(on, { draft: 'fix the bug', reply: 'Fix the login bug.' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  await ui.press({ key: 'enhance' })
  seen.box = 'Fix the login bug, please.'
  await ui.press({ key: 'send' })

  expect(seen.sent).toEqual(['Fix the login bug, please.'])
  expect(seen.box).toBe('')
  await ui.unmount()
})

test('an empty box asks the model nothing', async ($, on) => {
  const seen = stage(on, { draft: '  ', reply: 'Fix the login bug.' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  await ui.press({ key: 'enhance' })

  expect(seen.asks).toBe(0)
  expect(seen.box).toBe('  ')
  expect(await ui.find({ key: 'enhance' })).toBeDefined()
  await ui.unmount()
})

test('a failure says so and leaves the draft in the box', async ($, on) => {
  const seen = stage(on, { draft: 'fix the bug' })
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })

  await ui.press({ key: 'enhance' })

  expect(seen.box).toBe('fix the bug')
  expect(
    await ui.find({ type: 'Text', text: /Could not enhance/ }),
  ).toBeDefined()

  await ui.press({ key: 'dismiss' })
  expect(await ui.find({ key: 'enhance' })).toBeDefined()
  await ui.unmount()
})

test('with no prompt box, the band takes the draft and shows the result', async ($, on) => {
  const seen = stage(on, { draft: '', hasBox: false, reply: 'Fix the login bug.' })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await ui.press({ key: 'enhance' })
  await ui.input({ key: 'draft', text: 'fix the bug' })
  expect(
    await ui.find({ type: 'Text', text: 'Fix the login bug.' }),
  ).toBeDefined()

  await ui.press({ key: 'send' })
  expect(seen.sent).toEqual(['Fix the login bug.'])
  await ui.unmount()
})

test('a prompt sent with the prefix is held back and comes back enhanced', async ($, on) => {
  const seen = stage(on, { draft: '', reply: 'Fix the login bug.' })
  const ui = await $.ui.mount({ ...BAND, surface: 'desktop' })

  await $.prompt.submit(typed('e: fix the bug'))
  expect(await ui.find({ key: 'send' })).toBeDefined()
  expect(seen.sent).toEqual([])
  expect(seen.box).toBe('Fix the login bug.')

  await ui.press({ key: 'undo' })
  expect(seen.box).toBe('fix the bug')
  await ui.unmount()
})

test('a prompt without the prefix is sent as typed', async ($, on) => {
  const seen = stage(on, { draft: '', reply: 'Fix the login bug.' })

  await $.prompt.submit(typed('use e: as a prefix'))

  expect(seen.sent).toEqual(['use e: as a prefix'])
  expect(seen.asks).toBe(0)
})
