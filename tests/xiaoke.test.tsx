import type { On } from 'claude-code'
import { expect, test } from 'claude-code/testing'

import { LOOKS } from '../hooks/looks'
import { autoLookId, localMoment, parseOffset } from '../hooks/schedule'

type SetCall = { backdrop?: { scene?: string; glass?: { opacity: number; blur: number } } }

// Hooks that stand for the engine: command registry, theme, store.
function engine(on: On, sets: SetCall[], now = Date.parse('2026-11-18T04:00:00Z')) {
  on('clock.now', () => ({ value: now }))
  on('command.register', () => ({ value: { command: 'xiaoke' } }))
  on('theme.set', (_, e) => {
    sets.push(e as SetCall)

    return { value: { isDrawn: true, requestId: 'backdrop' } }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  const kept = new Map<string, unknown>()
  on('store.get', (_, e) => ({ value: kept.get((e as { key: string }).key) }))
  on('store.set', (_, e) => {
    const { key, value } = e as { key: string; value: unknown }
    kept.set(key, value)

    return { value: undefined }
  })

  return kept
}

const typed = (args: string) => ({
  command: 'xiaoke',
  args,
  origin: { kind: 'composer' as const },
  presentation: { isFullscreen: false, columns: 80 },
})

test('starts with the afternoon look, switches and remembers', async ($, on) => {
  const sets: SetCall[] = []
  const kept = engine(on, sets)

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)?.backdrop?.scene).toBe('afternoon')

  const listed = await $.command.run(typed(''))
  expect(listed.text).toContain('● afternoon')
  expect(listed.text).toContain('night')

  const switched = await $.command.run(typed('夜读'))
  expect(switched.text).toContain('夜读·台灯')
  expect(sets.at(-1)?.backdrop?.scene).toBe('night')
  expect(kept.get('look')).toBe('night')

  const unknown = await $.command.run(typed('beach'))
  expect(unknown.text).toContain('没有叫')

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.at(-1)?.backdrop?.scene).toBe('night')
})

const backdrop = (scene: string) =>
  ({
    plugin: 'xiaoke-look',
    component: 'Backdrop',
    requestId: 'backdrop',
    surface: 'desktop',
    props: { scene, plugin: 'xiaoke-look', glass: { blur: 14, opacity: 0.42 } },
  }) as const

test('every look draws its own scene on the desktop', async ($, on) => {
  engine(on, [])
  expect(Object.keys(LOOKS).length).toBe(13)
  for (const look of Object.values(LOOKS)) {
    // A line starting "Desktop won't paint" means the app would drop the palette.
    expect(look.unpainted).toBeUndefined()
    expect(look.scene.length).toBeLessThan(131072)
  }
  for (const scene of Object.keys(LOOKS)) {
    const ui = await $.ui.mount(backdrop(scene))
    const svg = await ui.find({ type: 'Svg' })
    expect(svg).toBeDefined()
    expect(JSON.stringify(svg)).toContain('class=\\"mv\\" style=\\"transform:translateX(calc(')
    await ui.unmount()
  }
})

const at = (iso: string) => Date.parse(iso)

test('auto picks a look by local time of day and season', () => {
  const all = () => true
  const look = (iso: string, offset = 480) => autoLookId(localMoment(at(iso), offset), all)

  // 2026-11-18 is a Wednesday in autumn; times are UTC, the offset is +8.
  expect(look('2026-11-17T23:30:00Z')).toBe('morning') // 07:30
  expect(look('2026-11-18T09:00:00Z')).toBe('dusk') // 17:00
  expect(look('2026-11-18T12:00:00Z')).toBe('night') // 20:00
  expect(['code', 'detective']).toContain(look('2026-11-18T17:00:00Z')) // 01:00
  expect(['autumn', 'afternoon', 'cafe', 'rain']).toContain(look('2026-11-18T04:00:00Z')) // 12:00
  // Christmas Eve evening and a summer evening.
  expect(look('2026-12-24T12:00:00Z')).toBe('holiday')
  expect(['festival', 'night']).toContain(look('2026-07-20T12:00:00Z'))
  // Late night belongs to the evening it began on.
  expect(look('2026-11-18T17:00:00Z')).toBe(look('2026-11-18T15:30:00Z'))
  // A look not drawn yet falls back to the next candidate.
  expect(autoLookId(localMoment(at('2026-11-17T23:30:00Z'), 480), id => id !== 'morning')).toBe('afternoon')
  expect(parseOffset('+8')).toBe(480)
  expect(parseOffset('UTC-5:30')).toBe(-330)
  expect(parseOffset('east')).toBeUndefined()
})

test('/xiaoke auto stores auto and follows the stored time zone', async ($, on) => {
  const sets: SetCall[] = []
  // 2026-11-18 17:00 at UTC+8.
  const kept = engine(on, sets, at('2026-11-18T09:00:00Z'))
  kept.set('tz', 480)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  const auto = await $.command.run(typed('auto'))
  expect(kept.get('look')).toBe('auto')
  expect(auto.text).toContain('17:00')
  expect(auto.text).toContain('黄昏')

  const tz = await $.command.run(typed('时区 +0'))
  expect(kept.get('tz')).toBe(0)
  expect(tz.text).toContain('09:00')

  const listed = await $.command.run(typed(''))
  expect(listed.text).toContain('● auto')

  const all = await $.command.run(typed('list'))
  for (const id of Object.keys(LOOKS)) {
    expect(all.text).toContain(id)
  }
  expect(all.text).toContain('樱花')
})


const styleOf = async ($: { ui: { mount: (input: ReturnType<typeof backdrop>) => Promise<{ find: (q: { type: string }) => Promise<unknown>; unmount: () => Promise<void> }> } }, scene: string) => {
  const ui = await $.ui.mount(backdrop(scene))
  const text = JSON.stringify(await ui.find({ type: 'Svg' }))
  await ui.unmount()

  return text
}

test('the side panels move the face and the veil clears', async ($, on) => {
  const sets: SetCall[] = []
  const kept = engine(on, sets)
  // Setting the same theme again redraws nothing on the desktop: a width asks for a redraw.
  const redraws: string[] = []
  on('ui.invalidate', (_, e) => {
    redraws.push((e as { event: string }).event)

    return { value: undefined }
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  // Defaults: left sidebar open at 300, right panel closed.
  expect(await styleOf($, 'afternoon')).toContain('min(-25vw + 265px, -100px)')
  const right = await $.command.run(typed('右栏'))
  expect(right.text).toContain('320px')
  expect(kept.get('inset')).toBe(320)
  expect(redraws).toEqual(['ui.render'])
  expect(await styleOf($, 'afternoon')).toContain('min(-25vw + 25px, -420px)')

  // holiday is pinned left: its face goes to the left gap.
  const left = await $.command.run(typed('左栏 425'))
  expect(left.text).toContain('425px')
  expect(redraws).toHaveLength(2)
  expect(await styleOf($, 'holiday')).toContain('max(25vw + 48.75px, 525px)')

  const closed = await $.command.run(typed('右栏'))
  expect(closed.text).toContain('收起来')
  expect(kept.get('inset')).toBe(0)
  expect((await $.command.run(typed('右栏 abc'))).text).toContain('不是')
  expect(redraws).toHaveLength(3)

  const clear = await $.command.run(typed('透明'))
  expect(clear.text).toContain('全透明')
  expect(sets.at(-1)?.backdrop?.glass).toEqual(expect.objectContaining({ opacity: 0, blur: 0 }))
  const some = await $.command.run(typed('透明 20'))
  expect(some.text).toContain('20%')
  expect(sets.at(-1)?.backdrop?.glass).toEqual(expect.objectContaining({ opacity: 0.2, blur: 14 }))
  expect((await $.command.run(typed('透明 120'))).text).toContain('不是')
})

test('the session rail takes its room on the right, beside the right panel', async ($, on) => {
  const kept = engine(on, [])
  // Setting the same theme again redraws nothing on the desktop: the rail asks for a redraw.
  const redraws: string[] = []
  on('ui.invalidate', (_, e) => {
    redraws.push((e as { event: string }).event)

    return { value: undefined }
  })
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

  expect((await $.command.run(typed(''))).text).toContain('会话栏（对话右边那一列）关')
  const shown = await $.command.run(typed('会话栏 开'))
  expect(shown.text).toContain('286px')
  expect(kept.get('rail')).toBe(true)
  expect(redraws).toEqual(['ui.render'])
  // afternoon is pinned right: its face stays between the transcript and the rail.
  expect(await styleOf($, 'afternoon')).toContain('min(-25vw + 50.5px, -386px)')
  // holiday is pinned left: the transcript moves left of the rail, and so does the left gap.
  expect(await styleOf($, 'holiday')).toContain('max(25vw + -36.5px, 400px)')
  // With the right panel open too, both take room.
  await $.command.run(typed('右栏 320'))
  expect(await styleOf($, 'afternoon')).toContain('min(-25vw + -189.5px, -706px)')

  expect((await $.command.run(typed('会话栏 也许'))).text).toContain('不是开或关')
  expect(kept.get('rail')).toBe(true)
  // One for the rail, one for the right panel; a refused word draws nothing.
  expect(redraws).toHaveLength(2)
  expect((await $.command.run(typed('rail off'))).text).toContain('收起来')
  expect(kept.get('rail')).toBe(false)
  expect(redraws).toHaveLength(3)
  expect(await styleOf($, 'afternoon')).toContain('min(-25vw + 25px, -420px)')
  // The bare word switches it.
  expect((await $.command.run(typed('会话栏'))).text).toContain('286px')
  expect(kept.get('rail')).toBe(true)
})
