<p align="center">
  <img src="assets/whale-black.png" width="128" height="128" alt="DeepSeek Harness 黑色小鲸鱼图标">
</p>

# DeepSeek Harness Launcher

一键启动 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）Web 界面的启动器。

在**已安装 DeepSeek Harness** 的前提下，它负责：

- 🔍 自动找到你机器上的 harness（PATH 上的 `dsh` 命令，或源码 checkout 目录）
- 🚀 自动启动 `dsh web`（已在运行就直接打开，绝不重复启动）
- 🔄 可选「重启」模式：开启后，重新双击会先停掉旧的 `dsh web` 再重新启动（默认关闭）
- 🖥️ 可选「控制台」模式：在可见窗口实时显示日志，关窗口即停止（默认后台静默运行）
- 🌐 等待 Web 界面就绪后**自动打开浏览器**（默认 `http://127.0.0.1:3080`）
- 🐳 创建桌面快捷方式 **“DeepSeek Harness”**，图标是**黑色小鲸鱼**
  （Windows `.lnk` / macOS `.app` / Linux `.desktop`）
- 🪵 完整日志落盘（`~/.dsh-launcher/run/web.log`），双击桌面图标静默启动、失败弹窗提示

零运行时依赖（纯 Node.js，≥ 18.17），中英双语提示，Windows / Linux / macOS 均可运行。
English: [README.en.md](README.en.md)

## 快速开始

### 1. 获取启动器

从 [Releases](https://github.com/LoveElysiaFH/deepseek-harness-launcher/releases) 下载
`deepseek-harness-launcher-v<版本>.zip`，解压到固定目录（例如 `~/tools/deepseek-harness-launcher`）；
或直接从源码 clone：

```sh
git clone https://github.com/LoveElysiaFH/deepseek-harness-launcher.git
cd deepseek-harness-launcher
```

### 2. 按平台安装桌面快捷方式

进入启动器目录，三平台都是同一个命令：

```sh
node bin\launcher.mjs install
```

各平台生成的快捷方式不同：

| 平台 | 生成结果 | 用法 |
| --- | --- | --- |
| **Windows** | 桌面 `DeepSeek Harness.lnk`（黑色小鲸鱼 `.ico`，wscript 静默启动、无控制台闪烁） | 双击桌面图标 |
| **macOS** | `~/Applications/DeepSeek Harness.app`（黑色小鲸鱼 `.icns`，LSUIElement 无 Dock 残留）+ 桌面快捷方式 | 双击 `.app` 或桌面图标 |
| **Linux** | 桌面与 `~/.local/share/applications` 的 `.desktop` 入口 + hicolor 图标 | 应用菜单或桌面启动 |

> 首次使用建议先运行 `node bin\launcher.mjs doctor` 做一次环境诊断。
> 移动过启动器目录后，重新 `node bin\launcher.mjs install --force` 即可。

### 3. 或直接用命令行（三平台通用）

```sh
node bin\launcher.mjs start    # 启动（或复用）dsh web，并自动打开浏览器
node bin\launcher.mjs stop     # 停止由本启动器启动的实例
node bin\launcher.mjs status   # 查看运行状态
```

## 如何关闭 DeepSeek Harness

启动器把 `dsh web` 放在**后台运行（没有窗口）**，所以关它要用命令，而不是关窗口：

```sh
node bin\launcher.mjs stop
```

- **所有平台**都可用上面的命令；
- **Windows** 也可以直接双击启动器目录里的 `stop.cmd`。

> 注意几点：
> - `stop` 只会关闭**由本启动器启动**的实例，不会误杀其他程序。
> - 如果你是手动在终端里跑 `npx @deepseek-ai/dsh web` 或 `pnpm dsh web` 开起来的，
>   请回到那个终端按 `Ctrl+C` 或直接关掉终端窗口；启动器管不到它。
> - 双击桌面快捷方式只负责「启动」，不会关闭；除非你开启了[重启模式](#重启模式)，
>   那时它才会「先关旧的再开新的」。

## 控制台模式（显示日志窗口）

默认启动器在**后台静默运行** dsh（无窗口）。想看实时日志、或想「关窗口即停止」，
用控制台模式：

```sh
node bin\launcher.mjs start --console
```

- 在终端里运行，dsh 日志会**实时显示**在当前窗口，按 `Ctrl+C` 即停止；
- **Windows 双击**：双击启动器目录里的 `start-console.cmd`，会弹出一个控制台窗口实时显示
  dsh 日志，**关掉这个窗口就停止 DeepSeek Harness**。

> 与后台模式的区别：后台模式关窗口不会停、要用 `stop`；控制台模式关窗口即停。

## 前提条件

| 项目 | 要求 |
| --- | --- |
| Node.js | ≥ 18.17（运行 `node --version` 检查） |
| DeepSeek Harness | 已安装且可用，二选一：<br>• npm 方式：`npx @deepseek-ai/dsh web` 能启动<br>• 源码方式：`git clone https://github.com/deepseek-ai/deepseek-harness.git` 后 `pnpm install && pnpm run build` |

> ## ⚠️ 检测不到 harness？手动指定目录
>
> 启动器按顺序查找：① PATH 上的 `dsh` 命令 → ② 常见位置的 `deepseek-harness*` 源码目录
> （`~` 目录、以及启动器所在位置向上 6 级目录内）。若运行 `doctor` 看到
> **「harness 源码目录 未找到」**，把 harness 所在目录告诉它即可——**任意目录都行**：
>
> ```sh
> node bin\launcher.mjs config set harness.cwd "D:/你的路径/deepseek-harness"   # 永久生效（写入配置）
> node bin\launcher.mjs start --cwd "D:/你的路径/deepseek-harness"              # 仅本次生效
> ```
>
> 也可用环境变量 `DSH_LAUNCHER_HARNESS`（Windows `set`、macOS/Linux `export`）。
> 指定后运行 `node bin\launcher.mjs doctor` 验证，应显示你填的路径。

## 首次安装：从零到双击启动（推荐顺序）

如果你（或使用者）还没装过 harness，请**严格按这个顺序**操作，一步都别漏：

1. **安装 Node.js**（≥ 18.17）：<https://nodejs.org>，装完 `node --version` 验证。

2. **⚠️ 安装 pnpm（源码构建 harness 必需，是最容易漏的一步）**：

   ```sh
   npm install -g pnpm
   pnpm --version   # 能打印版本号才算装好
   ```

   > 没有 pnpm 时，harness 源码无法构建，启动器就会报
   > `DeepSeek Harness failed to start`（退出码 1）。

3. **下载并构建 DeepSeek Harness 源码**：

   ```sh
   git clone https://github.com/deepseek-ai/deepseek-harness.git
   cd deepseek-harness
   pnpm install
   pnpm run build
   ```

   > 构建完成后，harness 目录里应存在 `apps/web/dist/index.html`。
   > 不想从源码构建？也可改用 npm 方式：`npx @deepseek-ai/dsh web` 能正常启动即可跳过本步。

4. **下载本启动器，指定 harness 目录，并安装快捷方式**：

   ```sh
   git clone https://github.com/LoveElysiaFH/deepseek-harness-launcher.git
   cd deepseek-harness-launcher
   node bin\launcher.mjs config set harness.cwd "D:/你的路径/deepseek-harness"   # 指向第 3 步的 harness 目录
   node bin\launcher.mjs install
   ```

5. **双击桌面「DeepSeek Harness」**（黑色小鲸鱼图标）——自动启动 harness 并打开浏览器。

> 验证：`node bin\launcher.mjs doctor` 应显示「harness 源码目录」指向第 3 步的目录，
> 且「Web 界面」为运行中。

## 工作原理

双击桌面快捷方式后，三平台殊途同归——最终都执行 `node bin\launcher.mjs start`：

```
双击桌面快捷方式
  └─ Windows: start-silent.vbs / macOS: .app / Linux: .desktop
      └─ node bin\launcher.mjs start
          ├─ 检测 harness（见下方检测顺序）
          ├─ 端口已在服务？ ──是──▶ 直接打开浏览器，结束
          ├─ 端口被其他程序占用？ ──▶ 报错并提示换端口
          └─ 后台启动 dsh web（输出写入 ~/.dsh-launcher/run/web.log）
              └─ 每 0.5 秒探测直到就绪（默认最多 90 秒）
                  └─ 打开默认浏览器
```

harness 检测顺序（可用 `doctor` 查看结果）：

1. 配置/命令行指定的 `harness.command`
2. PATH 上的 `dsh` 命令
3. 源码 checkout（沿启动器所在目录向上 6 级、`~` 目录中搜索 `deepseek-harness*`）：
   优先直接运行构建产物 `apps/cli/lib/bin.js`，其次 `pnpm dsh web`，再其次 `npx dsh web`

## 命令参考

| 命令 | 说明 |
| --- | --- |
| `start` | 启动（或复用）`dsh web` 并打开浏览器 |
| `stop` | 停止由本启动器启动的实例（只认自己的 pid 文件，不会误杀手动启动的 harness） |
| `status` | 运行状态；加 `--json` 输出机器可读格式 |
| `install` | 创建桌面快捷方式（黑色小鲸鱼图标）；`--force` 覆盖已有快捷方式 |
| `uninstall` | 删除桌面快捷方式 |
| `doctor` | 环境诊断：node / dsh / checkout / 端口 / 快捷方式 / 图标 |
| `config` | 查看配置；`config get/set/reset <harness.键>` 管理配置 |
| `version` | 版本号 |
| `help` | 完整帮助 |

常用选项：`--port <n>`、`--url <url>`、`--timeout <秒>`、`--no-browser`、`--cwd <dir>`、`--command <cmd>`、`--lang zh|en`。

示例：

```sh
node bin\launcher.mjs start --port 3099 --no-browser   # 备用端口启动，不开浏览器
node bin\launcher.mjs status --json                    # 供脚本/监控使用
node bin\launcher.mjs config set harness.cwd "D:/ai/deepseek-harness"
node bin\launcher.mjs config set harness.timeoutSec 120
```

## 配置

配置文件：`~/.dsh-launcher/config.json`（模板见 [config.example.json](config.example.json)）。
优先级：**命令行 > 环境变量 > 配置文件 > 默认值**。

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `harness.command` | `null` | 显式启动命令（字符串或数组），设置后跳过自动检测 |
| `harness.cwd` | `null` | 源码 checkout 目录提示 |
| `harness.env` | `{}` | 传给 dsh 进程的额外环境变量 |
| `harness.args` | `["web"]` | 追加到自动检测出的 dsh 命令后的参数 |
| `harness.port` | `3080` | Web 端口（非 3080 时自动附加 `--port` 给 dsh） |
| `harness.url` | `null` | Web 地址（null = `http://127.0.0.1:<port>`） |
| `harness.timeoutSec` | `90` | 启动等待超时 |
| `harness.openBrowser` | `true` | 启动后是否打开浏览器 |
| `harness.restartOnRerun` | `false` | 已运行时，重新启动是否先停旧再启新（重启模式） |

环境变量：`DSH_LAUNCHER_HARNESS`、`DSH_LAUNCHER_PORT`、`DSH_LAUNCHER_URL`、`DSH_LAUNCHER_TIMEOUT`、`DSH_LAUNCHER_NO_BROWSER=1`、`DSH_LAUNCHER_LANG`、`DSH_LAUNCHER_HOME`。

### 重启模式

默认情况下，`start`（含双击桌面图标）检测到 `dsh web` 已在运行就只打开浏览器、不重启。
若你想**每次双击都重启 harness**，开启重启模式：

```sh
node bin\launcher.mjs config set harness.restartOnRerun true
```

或单次生效：`node bin\launcher.mjs start --restart`。

> ⚠️ 风险提示：重启会**终止当前正在运行的会话**（未保存的对话/任务会丢失），
> 并短暂断开再重连。此外，只有「由本启动器启动的实例」（有 pid 文件）才会被重启；
> 手动用 `npx @deepseek-ai/dsh web` 之类开起来的实例会被**跳过**（只打开浏览器），
> 以保证不误杀你的其他进程。

## 图标

- **权威源**：`assets/deepseek-whale-black.ico` —— 黑色小鲸鱼，含 16/24/32/48/64/128/256px 七档。
  想换图标：直接替换该文件（保持同名、含常用尺寸），然后运行 `npm run icon`。
- `npm run icon` 会校验 ICO 并**无损提取** 256px 帧生成 `assets/whale-black.png`
  （Linux 桌面入口与 README 预览使用），同时把各尺寸帧打包成
  `assets/whale-black.icns`（macOS `.app` 图标），全部由零依赖脚本完成，CI 亦可复现。
- 小鲸鱼图案版权归 DeepSeek 所有，本项目仅将其用于本地快捷方式。

## 项目结构

```
deepseek-harness-launcher/
├── bin/launcher.mjs          CLI 入口
├── src/
│   ├── cli.mjs               命令解析与分发
│   ├── config.mjs            配置加载（文件 + 环境变量 + 命令行）
│   ├── detect.mjs            harness 检测（PATH / checkout）
│   ├── server.mjs            dsh web 的启动/停止/状态/浏览器
│   ├── shortcut.mjs          桌面快捷方式（Windows .lnk / Linux .desktop）
│   ├── paths.mjs             ~/.dsh-launcher 路径
│   └── i18n.mjs              中英双语消息
├── assets/
│   ├── deepseek-whale-black.ico   权威图标（黑色小鲸鱼）
│   └── whale-black.png            256px 提取帧（npm run icon 生成）
├── scripts/
│   ├── prepare-icons.mjs     ICO 校验 + PNG 提取
│   ├── zip.mjs               零依赖 ZIP 打包器
│   └── build.mjs             Release 构建
├── test/                     node --test 单元测试
├── .github/workflows/        CI（多系统多 Node 版本）+ 自动 Release
└── start.cmd / stop.cmd      可见控制台的调试用入口（仅 Windows）
└── start-console.cmd         控制台模式双击入口（实时日志，关窗口即停，仅 Windows）
```

## 常见问题

**双击弹出「DeepSeek Harness failed to start」？**
弹窗里的 **Reason** 就是真实原因。退出码 `1` 常见于：harness 源码未构建
（先 `pnpm install && pnpm run build`）、端口被占、或 `harness.cwd` 指向无效目录；
详情见 `~/.dsh-launcher/run/web.log`。

**双击快捷方式没有反应？**
运行 `node bin\launcher.mjs doctor` 检查 node 与 harness 是否就位；日志在 `~/.dsh-launcher/run/web.log`。

**提示“端口 3080 已被占用”？**
其他程序占用了端口：`start --port 3099` 换端口（会同步传给 `dsh web --port`）。

**提示找不到 harness？**
先确认 `npx @deepseek-ai/dsh web` 可运行；若 harness 在非标准位置，按上文
「⚠️ 检测不到 harness？手动指定目录」用 `harness.cwd` / `--cwd` / `DSH_LAUNCHER_HARNESS` 指定即可。

**移动了启动器目录后快捷方式失效？**
重新运行 `node bin\launcher.mjs install --force`（快捷方式记录的是安装时的绝对路径）。

**如何停止？**
见上文「如何关闭 DeepSeek Harness」：`node bin\launcher.mjs stop`（所有平台），Windows 也可双击 `stop.cmd`。只会停止本启动器启动的实例。

**各平台快捷方式装在哪？**
见上文「快速开始 → 按平台安装桌面快捷方式」表格：Windows 是桌面 `.lnk`，macOS 是
`~/Applications/DeepSeek Harness.app` + 桌面快捷方式，Linux 是 `.desktop` 入口。
卸载均用 `node bin\launcher.mjs uninstall`。

## 维护与贡献

- 零运行时依赖；测试零依赖（`node --test`），`npm test` 全绿即可放心合并
- 版本号遵循语义化版本，变更记录在 [CHANGELOG.md](CHANGELOG.md)
- CI 在 ubuntu/windows × node 20/22/24 六个组合上跑测试与构建
- 欢迎提交 Issue / PR；修改图标流程见上文「图标」一节

## License

[MIT](LICENSE)。小鲸鱼图案版权归 DeepSeek 所有，仅用于本地快捷方式展示。
