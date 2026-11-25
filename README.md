# xiaoke-look · 小克主题

给 Claude 桌面端 Code 标签用的主题 mod：十三套「小克」（Claude 娘）主题，每套是一身衣服、一个处境、一套配色和一张插画。插画贴在窗口一侧，渐变淡出成留白，空白处有很慢的花瓣、星光、雨丝、雪花或烟花。可以固定一套，也可以让它随一天的时段和季节自动换。

A Claude Code mod with thirteen Claude-chan looks for the desktop app's Code tab. Each has its own outfit, palette and illustration, which fades into blank paper. Pick one, or let `/xiaoke auto` follow the time of day and the season.

![xiaoke-look in the Claude desktop app (conversation text blurred)](docs/screenshot.png)

## 主题 / Looks

| 名字 | 主题 | 模式 | 预览 |
| --- | --- | --- | --- |
| `morning` | 清晨·睡衣早餐 | 浅色 | ![](docs/preview_morning.png) |
| `afternoon` | 午后·窗边读书 | 浅色 | ![](docs/preview_afternoon.png) |
| `cafe` | 咖啡店·打工 | 浅色 | ![](docs/preview_cafe.png) |
| `rain` | 雨天·窗边茶 | 浅色 | ![](docs/preview_rain.png) |
| `dusk` | 黄昏·放学 | 浅色 | ![](docs/preview_dusk.png) |
| `night` | 夜读·台灯 | 深色 | ![](docs/preview_night.png) |
| `code` | 深夜·敲代码 | 深色 | ![](docs/preview_code.png) |
| `detective` | 深夜·侦探推理 | 深色 | ![](docs/preview_detective.png) |
| `spring` | 春日·樱花 | 浅色 | ![](docs/preview_spring.png) |
| `festival` | 夏夜·烟花祭 | 深色 | ![](docs/preview_festival.png) |
| `autumn` | 秋日·红叶 | 浅色 | ![](docs/preview_autumn.png) |
| `snow` | 冬日·初雪 | 浅色 | ![](docs/preview_snow.png) |
| `holiday` | 圣诞·新年 | 深色 | ![](docs/preview_holiday.png) |

## 用法 / Usage

| 命令 | 作用 |
| --- | --- |
| `/xiaoke night` | 换成一套主题（也认中文名和别名，如 `/xiaoke 樱花`、`/xiaoke 侦探`） |
| `/xiaoke` | 列出全部主题和当前设置 |
| `/xiaoke list` | 连别名一起列出 |
| `/xiaoke auto` | 随时间自动换（见下） |
| `/xiaoke 左栏 425`、`/xiaoke 右栏 320` | 告诉它左右侧栏有多宽，好把小克的脸摆进空隙；不带数字是开关 |
| `/xiaoke 会话栏 开`、`/xiaoke 会话栏 关` | 对话右边的会话栏（session rail）开没开；不带字是开关 |
| `/xiaoke 透明`、`/xiaoke 透明 20` | 消息栏背后的遮罩：全透明，或设成百分比（默认 42%） |
| `/xiaoke 时区 +0` | 自动模式用的时区，默认跟随系统；`/xiaoke 时区 自动` 改回 |
| `/xiaoke demo`、`/xiaoke demo 8` | 把 13 套轮播一遍（每套 6 秒或给定秒数），播完回到原来那套；再输一次停止。录屏演示用，不改设置 |

选择会被记住，之后新开的会话也用它。默认是 `afternoon`。

Switch with `/xiaoke <name>`, list with `/xiaoke` or `/xiaoke list`. The choice is remembered for later sessions.

**随时间自动换。** `/xiaoke auto` 之后，会话开着时每 10 分钟看一次钟：

- 清晨 5–9 点：睡衣早餐
- 白天 9–16 点：窗边读书、咖啡店、雨天轮换；隔天换成当季的一张（春樱花、秋红叶、冬初雪）
- 黄昏 16–19 点：放学
- 夜晚 19–23 点：台灯夜读；夏天隔天是烟花祭，12 月 20 日到 1 月 6 日是圣诞
- 深夜 23–5 点：敲代码和侦探推理隔天轮换

季节按北半球算。

`/xiaoke auto` follows the time of day and the (northern) season, checking every 10 minutes while a session is open.

**脸摆在空隙里。** 桌面端的侧栏是实心的，消息栏在中间。mod 会按窗口宽度算出消息栏和侧栏之间的空隙，把插画挪过去，让小克的脸落在空隙中间；窗口拉宽拉窄都会跟着变。插画贴哪一侧按画面内容定：手上的动作和道具朝着消息栏，那边隔着遮罩还看得见。mod 看不到侧栏开没开，所以要用 `/xiaoke 左栏` / `/xiaoke 右栏` 告诉它一次宽度（默认左栏 300px 开、右栏关）。对话右边那一列会话栏（session rail，显示 PR、任务这些）也一样：开着的话输一次 `/xiaoke 会话栏 开`，小克会给它让出 286px；收起了输 `/xiaoke 会话栏 关`。

The app draws its side panels opaque and does not tell a mod about them, so tell it their widths once with `/xiaoke left <px>` and `/xiaoke right <px>`; the picture then moves so the face sits in the gap beside the conversation, at any window width. The same goes for the session rail at the conversation's right edge: `/xiaoke rail on` or `/xiaoke rail off`.

每套主题只有一种模式（插画本身是亮的或暗的），会覆盖应用自己的浅色/深色设置。Each look is made for one mode and sets it.

## 安装 / Install

在终端里的 Claude Code 会话输入（At the prompt of a terminal session）:

```
/plugin install xiaoke-look --marketplace bananaeat/xiaoke-look
```

先回答 `y` 添加 marketplace，再选 user scope。装好后，之后新开的会话（包括桌面端 Code 标签的本地会话）都会加载它。

From a shell:

```
claude plugin install xiaoke-look --marketplace bananaeat/xiaoke-look
```

桌面端里 `/plugin` 不能用：点输入框旁的 **+** → Plugins → Add marketplace，填 `bananaeat/xiaoke-look`，再 Add plugin。
In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then Plugins, Add marketplace with `bananaeat/xiaoke-look`, then Add plugin.

需要能显示 mod 主题的 Claude 桌面端（在 Claude Code 2.1.326 上测试过）。终端和编辑器里不显示主题。
Needs a Claude desktop app that draws mod looks (tested with Claude Code 2.1.326); terminals and editors draw no look.

## 说明 / Notes

- **背景是纯矢量。** 桌面端的背景只接受纯矢量 SVG（不能嵌位图，最多 131072 字符），所以每张原画（`illustrations/*.png`，见 [illustrations/](illustrations/)）都被描摹成了 7 万到 12 万字符的平涂色块 SVG。The backdrops are pure vector: each painting was traced into flat-ink paths under the 131,072-character limit.
- 开启"减少动态"时飘落物静止。Particles rest in place under reduced motion.

## 自己重新描摹 / Rebuilding a scene

`tools/` 里是描摹流程（Python 3，需要 numpy、opencv-python、resvg-py）。浅色场景：

```
python tools/trace.py illustrations/rain.png vec.json --scale 1.0 --colors 20 --eps 1.0 --minarea 9 --crop 0,0,1024,1200 --paper "#dce2e9"
python tools/build_scene.py vec.json hooks/scenes/rain.ts --preview preview.svg --fx rain --side left --face 0.54,0.18
python tools/render.py preview.svg preview.png 1600
```

深色场景加 `--dark-thr 0 --line-drop 30 --line-max 70`（只按"比周围暗"来认线稿）。`--face` 是脸的中心占画面宽、高的比例，`--side` 是插画贴哪一边；每个场景现在用的值写在 `hooks/scenes/<名字>.ts` 末尾的 `FACE`、`SIDE` 里。

思路：先把人物剪影整个铺成描线色，再把各色块盖上去，线稿就是色块之间留下的缝；色块会向外扩半个像素来补缝，但不会盖住线稿像素。`tools/prompts/` 是生成原画用的提示词（`outfits/` 里是八套换装的）。

## 致谢与授权 / Credits & license

- Claude 娘的角色设计来自 **ZipZipPipe** 的同人设定。这是粉丝自制作品，与 Anthropic 无关。Character design after ZipZipPipe's fan design of Claude-chan; fan work, not affiliated with Anthropic.
- 代码以 MIT 协议发布（见 `LICENSE`）。插画（`docs/` 里的图、`hooks/scenes/` 里的图形）请仅作非商业用途。Code is MIT; please keep the artwork non-commercial.
- `hooks/make-colors.js` 来自 Claude Code 的 plugin-authoring 工具，用来生成设计系统的配色。
