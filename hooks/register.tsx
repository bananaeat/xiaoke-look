import type { EngineInterface, Register } from 'claude-code'

import { DEFAULT_LOOK, DEFAULT_VEIL, LOOKS, faceShift, findLook, lookArgs, type Look } from './looks'
import { SLOT_NAMES, autoLookId, formatOffset, localMoment, parseOffset, slotOf } from './schedule'

// Xiaoke looks: one illustrated scene per look, switched with /xiaoke and
// remembered across sessions in this mod's store. The stored look `auto`
// follows the time of day and the season.
const LOOK_KEY = 'look'
const AUTO = 'auto'
const AUTO_WORDS = ['auto', '自动', '随时间', '时间']
const LIST_WORDS = ['list', 'ls', '列表', '全部', '所有']
// Minutes east of UTC, when the person set it; else the runtime's own offset.
const TZ_KEY = 'tz'
const CHECK_MS = 10 * 60_000
// The side panels, in CSS px: the app draws them opaque over the backdrop and
// does not tell a mod whether they are open, so the person says. The picture
// moves so the face sits in the gap between the transcript and the panel.
const RIGHT_KEY = 'inset'
const RIGHT_WIDTH = 320
const RIGHT_WORDS = ['右栏', '侧栏', 'panel', 'inset', 'right']
const LEFT_KEY = 'left'
const LEFT_WIDTH = 300
const LEFT_WORDS = ['左栏', 'sidebar', 'left']
// The session rail, the column the app can show at the conversation's right
// edge: 17.5rem wide and 6px in from that edge, with the transcript centred in
// the room left of it. The app does not tell a mod whether it shows either, so
// the person says, once (the app remembers it too). It takes room on the
// right as the right panel does, beside it.
const RAIL_KEY = 'rail'
const RAIL_WIDTH = 286
const RAIL_WORDS = ['会话栏', '信息栏', 'rail']
const ON_WORDS = ['开', '打开', 'on', 'show']
const OFF_WORDS = ['关', '关闭', '收起', 'off', 'hide']
// How solid the veil over the picture behind the conversation is, 0 to 1.
const VEIL_KEY = 'veil'
const VEIL_WORDS = ['透明', '遮罩', '透明度', 'glass', 'veil']
const MOVER = '<g class="mv">'

type Get = (key: string) => Promise<unknown>

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

async function rightWidth(get: Get): Promise<number> {
  return asNumber(await get(RIGHT_KEY)) ?? 0
}

async function leftWidth(get: Get): Promise<number> {
  return asNumber(await get(LEFT_KEY)) ?? LEFT_WIDTH
}

async function railShown(get: Get): Promise<boolean> {
  return (await get(RAIL_KEY)) === true
}

// All the room the right side takes: the panel, and the rail beside it.
async function rightTaken(get: Get): Promise<number> {
  return (await rightWidth(get)) + ((await railShown(get)) ? RAIL_WIDTH : 0)
}

async function veilOf(get: Get): Promise<number> {
  return asNumber(await get(VEIL_KEY)) ?? DEFAULT_VEIL
}

async function offsetOf(get: Get, now: number): Promise<number> {
  return asNumber(await get(TZ_KEY)) ?? -new Date(now).getTimezoneOffset()
}

type Choice = { look: Look; isAuto: boolean }

async function chosen(get: Get, now: number): Promise<Choice> {
  const stored = await get(LOOK_KEY)

  if (stored === AUTO) {
    const moment = localMoment(now, await offsetOf(get, now))
    const id = autoLookId(moment, id => LOOKS[id] !== undefined)

    return { look: LOOKS[id] ?? LOOKS[DEFAULT_LOOK]!, isAuto: true }
  }
  const look = findLook(typeof stored === 'string' ? stored : DEFAULT_LOOK) ?? LOOKS[DEFAULT_LOOK]!

  return { look, isAuto: false }
}

async function clockLine(get: Get, now: number): Promise<string> {
  const offset = await offsetOf(get, now)
  const m = localMoment(now, offset)
  const hhmm = `${String(m.hour).padStart(2, '0')}:${String(m.minute).padStart(2, '0')}`
  const set = asNumber(await get(TZ_KEY)) === undefined ? '' : '，手动设的'

  return `现在是 ${m.month} 月 ${m.date} 日 ${hhmm}（${formatOffset(offset)}${set}），算作${SLOT_NAMES[slotOf(m.hour)]}`
}

const AUTO_RULES = [
  '自动模式：清晨 5–9 点睡衣早餐，白天 9–16 点轮换（窗边读书、咖啡店、雨天，隔天换成当季：春樱花、秋红叶、冬初雪），',
  '黄昏 16–19 点放学，夜晚 19–23 点台灯夜读（夏天隔天烟花祭，12 月 20 日到 1 月 6 日圣诞），深夜轮换敲代码和侦探。',
].join('')

type Settings = { left: number; right: number; rail: boolean; veil: number }

async function settings(get: Get): Promise<Settings> {
  return { left: await leftWidth(get), right: await rightWidth(get), rail: await railShown(get), veil: await veilOf(get) }
}

function settingLines(s: Settings): string[] {
  const px = (v: number) => (v > 0 ? `${v}px` : '关')

  return [
    `左栏 ${px(s.left)}，右栏 ${px(s.right)}：小克的脸会挪到消息栏和侧栏之间的空隙里（/xiaoke 左栏 或 右栏 开关，后面加数字设宽度）`,
    `会话栏（对话右边那一列）${s.rail ? `开，让出 ${RAIL_WIDTH}px` : '关'}（/xiaoke 会话栏 开 或 关）`,
    `消息栏遮罩 ${Math.round(s.veil * 100)}%（/xiaoke 透明 在全透明和默认之间切换，/xiaoke 透明 20 设成 20%）`,
  ]
}

function listText(choice: Choice, s: Settings, clock: string, withAliases = false): string {
  const rows = Object.values(LOOKS).map(look => {
    const mark = look.id === choice.look.id ? '●' : '○'
    const row = `${mark} ${look.id.padEnd(10)} ${look.title}（${look.mode === 'dark' ? '深色' : '浅色'}）`

    return withAliases ? `${row}  也可以叫：${look.aliases.join('、')}` : row
  })

  return [
    '小克主题：',
    ...rows,
    '',
    choice.isAuto ? `● auto       随时间自动换。${clock}` : '○ auto       随时间自动换（/xiaoke auto）',
    '',
    '用 /xiaoke <名字> 切换，例如 /xiaoke night 或 /xiaoke 樱花；/xiaoke list 连别名一起列出',
    ...settingLines(s),
    '时区不对的话：/xiaoke 时区 +0（/xiaoke 时区 自动 改回跟随系统）',
  ].join('\n')
}

// A width word's argument: none toggles between off and the usual width.
function widthFrom(amount: string | undefined, current: number, usual: number): number | string {
  if (amount === undefined) {
    return current > 0 ? 0 : usual
  }
  const px = Number(amount)

  if (!Number.isFinite(px) || px < 0 || px > 1200) {
    return `「${amount}」不是 0 到 1200 之间的像素数。`
  }

  return Math.round(px)
}

// The look on screen, so the timer only redraws when the slot changes.
let shown: string | undefined

async function show($: EngineInterface, look: Look) {
  const veil = asNumber(await $.store.get(VEIL_KEY)) ?? DEFAULT_VEIL
  const set = await $.theme.set(lookArgs(look, veil))
  shown = look.id

  return set
}

// /xiaoke demo: every look in turn, for a recording; nothing is stored. A
// one-second ticker started at session.start advances it, since a timer
// started inside the command would end with that command.
const DEMO_WORDS = ['demo', '轮播', '演示']
const DEMO_SECONDS = 6
let demo: { ids: string[]; index: number; nextAt: number; stepMs: number } | undefined

export const register: Register = on => {

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'xiaoke',
      description: '切换小克主题：/xiaoke auto 随时间自动换，/xiaoke <名字> 固定一套，/xiaoke list 列出全部，/xiaoke 透明 让消息栏透明',
    })
    const get: Get = key => $.store.get(key)
    const { look } = await chosen(get, await $.clock.now())

    if (look.unpainted !== undefined) {
      $.ui.toast(look.unpainted)
    }
    const set = await show($, look)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }
    $.clock.every(CHECK_MS, async () => {
      if (demo !== undefined) {
        return
      }
      const choice = await chosen(get, await $.clock.now())

      if (choice.isAuto && choice.look.id !== shown) {
        await show($, choice.look)
      }
    })
    $.clock.every(1000, async () => {
      if (demo === undefined) {
        return
      }
      const now = await $.clock.now()

      if (now < demo.nextAt) {
        return
      }
      demo.index += 1
      const id = demo.ids[demo.index]

      if (id === undefined) {
        demo = undefined
        await show($, (await chosen(get, now)).look)

        return
      }
      demo.nextAt = now + demo.stepMs
      await show($, LOOKS[id]!)
    })

    return next(e)
  })

  on('command.run', { command: 'xiaoke' }, async ($, e) => {
    const get: Get = key => $.store.get(key)
    const now = await $.clock.now()
    const current = await chosen(get, now)
    const s = await settings(get)
    const [word = '', amount] = e.args.trim().split(/\s+/)
    const key = word.toLowerCase()

    if (DEMO_WORDS.includes(key)) {
      if (demo !== undefined) {
        demo = undefined
        await show($, current.look)

        return { text: '轮播停了，回到「' + current.look.title + '」。' }
      }
      const seconds = amount === undefined ? DEMO_SECONDS : Number(amount)

      if (!Number.isFinite(seconds) || seconds < 2 || seconds > 60) {
        return { text: `「${amount}」不是 2 到 60 之间的秒数。` }
      }
      const ids = Object.keys(LOOKS)
      demo = { ids, index: 0, nextAt: now + seconds * 1000, stepMs: seconds * 1000 }
      await show($, LOOKS[ids[0]!]!)

      return { text: `开始轮播 ${ids.length} 套，每套 ${seconds} 秒，播完回到「${current.look.title}」。再输一次 /xiaoke demo 停止。` }
    }
    if (word === '' || LIST_WORDS.includes(key)) {
      return { text: listText(current, s, await clockLine(get, now), word !== '') }
    }
    if (RAIL_WORDS.includes(key)) {
      const said = amount?.toLowerCase()
      const shown =
        said === undefined ? !s.rail : ON_WORDS.includes(said) ? true : OFF_WORDS.includes(said) ? false : undefined

      if (shown === undefined) {
        return { text: `「${amount}」不是开或关：/xiaoke 会话栏 开、/xiaoke 会话栏 关，不带字是开关。` }
      }
      await $.store.set(RAIL_KEY, shown)
      // As for the widths below: draw the backdrop again with the new layout.
      $.ui.invalidate('ui.render')

      return {
        text: shown
          ? `按会话栏开着来摆小克的脸，给它让出 ${RAIL_WIDTH}px；收起了就输 /xiaoke 会话栏 关。`
          : '按会话栏收起来摆小克的脸；开着的话输 /xiaoke 会话栏 开。',
      }
    }
    if (RIGHT_WORDS.includes(key) || LEFT_WORDS.includes(key)) {
      const isRight = RIGHT_WORDS.includes(key)
      const width = widthFrom(amount, isRight ? s.right : s.left, isRight ? RIGHT_WIDTH : LEFT_WIDTH)

      if (typeof width === 'string') {
        return { text: width }
      }
      await $.store.set(isRight ? RIGHT_KEY : LEFT_KEY, width)
      // The theme is unchanged, so setting it again draws nothing new: ask the
      // backdrop to draw again with the new layout.
      $.ui.invalidate('ui.render')
      const side = isRight ? '右' : '左'

      return {
        text: width > 0 ? `按${side}侧栏 ${width}px 宽来摆小克的脸。` : `按${side}侧栏收起来摆小克的脸。`,
      }
    }
    if (VEIL_WORDS.includes(key)) {
      let veil = s.veil > 0 ? 0 : DEFAULT_VEIL

      if (amount !== undefined) {
        const percent = Number(amount.replace(/%$/, ''))

        if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
          return { text: `「${amount}」不是 0 到 100 之间的百分比。` }
        }
        veil = Math.round(percent) / 100
      }
      await $.store.set(VEIL_KEY, veil)
      await show($, current.look)

      return {
        text: veil === 0
          ? '消息栏现在全透明，没有遮罩也没有模糊。字看不清的话：/xiaoke 透明 20'
          : `消息栏遮罩 ${Math.round(veil * 100)}%（默认 ${Math.round(DEFAULT_VEIL * 100)}%）。`,
      }
    }
    if (key === '时区' || key === 'tz') {
      if (amount === undefined) {
        return { text: `${await clockLine(get, now)}。\n用 /xiaoke 时区 +0 固定成某个时区，/xiaoke 时区 自动 跟随系统。` }
      }
      if (amount === '自动' || amount.toLowerCase() === 'auto') {
        await $.store.set(TZ_KEY, null)
      } else {
        const offset = parseOffset(amount)

        if (offset === undefined) {
          return { text: `「${amount}」不是时区，写成 +0、-5 或 +5:30 这样。` }
        }
        await $.store.set(TZ_KEY, offset)
      }
      const after = await chosen(get, now)

      if (after.isAuto && after.look.id !== shown) {
        await show($, after.look)
      }

      return { text: `${await clockLine(get, now)}。` }
    }
    if (AUTO_WORDS.includes(key)) {
      await $.store.set(LOOK_KEY, AUTO)
      const { look } = await chosen(get, now)
      const set = await show($, look)
      const head = `${await clockLine(get, now)}，换成「${look.title}」。`

      if (!set.isDrawn) {
        return { text: `${head}\n已记住自动模式，但这里不显示主题：${set.reason}` }
      }

      return { text: `${head}\n${AUTO_RULES}\n会话开着时每 10 分钟看一次钟。` }
    }
    const look = findLook(word)

    if (look === undefined) {
      return { text: `没有叫「${word}」的主题。\n\n${listText(current, s, await clockLine(get, now))}` }
    }
    await $.store.set(LOOK_KEY, look.id)
    const set = await show($, look)

    if (!set.isDrawn) {
      return { text: `已记住「${look.title}」，但这里不显示主题：${set.reason}` }
    }

    return { text: `已换成「${look.title}」，之后新开的会话也会用它。想让它随时间变：/xiaoke auto` }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    const look = LOOKS[e.props.scene]

    if (look === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    // Phones have no side panels: the picture stays pinned to its edge there.
    const get: Get = key => $.store.get(key)
    const source =
      e.surface === 'desktop'
        ? look.scene.replace(
            MOVER,
            `<g class="mv" style="transform:${faceShift(look, { left: await leftWidth(get), right: await rightTaken(get) })}">`,
          )
        : look.scene

    return <Svg source={source} alt={look.alt} isInteractive />
  })
}
