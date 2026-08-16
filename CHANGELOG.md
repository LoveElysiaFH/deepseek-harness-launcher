# 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

## [1.3.1] - 2025-08-14

### 新增
- 控制台模式可**持久化并联动桌面快捷方式**：`config set harness.console true` 后再
  `install --force`，桌面快捷方式会改为在可见控制台窗口运行 dsh——双击弹控制台、
  **关闭控制台即停止 harness**（改回 `false` 再 `install` 即恢复静默后台）。
  - 新增持久化配置 `harness.console`（默认 false）；`start --console` 仍可单次启用
  - `install` 按配置选择「静默 wscript」或「cmd 控制台」两种快捷方式目标
- 文档：控制台模式章节补充持久化开启方法、配置表新增 `harness.console`（README 中英文）

## [1.3.0] - 2025-08-14

### 新增
- 可选「控制台模式」：`start --console` 让 `dsh web` 在**可见控制台前台运行**，
  实时显示日志；关闭窗口或 `Ctrl+C` 即停止（区别于默认的后台静默运行）。
  - Windows 新增双击入口 `start-console.cmd`
  - `--console` 为一次性开关，不写入配置（避免与静默桌面快捷方式冲突）
- 文档：功能列表、控制台模式章节、开启方法与与后台模式的区别（README 中英文）

## [1.2.0] - 2025-08-14

### 新增
- 可选「重启模式」：配置 `harness.restartOnRerun=true` 或加 `--restart` 后，
  重新启动（含双击桌面图标）会先停掉旧的 `dsh web` 再重新启动。
  - 默认关闭，保持原有「只打开浏览器」行为
  - 只重启由本启动器启动的实例（有 pid 文件）；手动启动的实例会被跳过以保证安全
- 文档：功能列表、配置表、开启方法与风险提示（README 中英文）

## [1.1.1] - 2025-08-14

### 修复
- Windows 静默启动失败时，弹窗现在会显示**真实原因**（此前只显示退出码，
  真正的报错被隐藏）：启动器把致命错误写入 `~/.dsh-launcher/run/last-error.log`，
  `start-silent.vbs` 失败时将其读入弹窗，并附上 web.log 路径。

## [1.1.0] - 2025-08-14

### 新增
- macOS 桌面快捷方式支持：
  - `install` 在 `~/Applications/DeepSeek Harness.app` 生成最小化 `.app`
    （黑色小鲸鱼图标、`LSUIElement` 不残留 Dock 图标），并在桌面放快捷方式；
    双击即启动 harness 并打开浏览器
  - `uninstall` 删除该 `.app` 与桌面链接
- `assets/whale-black.icns`：从权威 ICO 的 PNG 帧无损打包的 Apple 图标容器
  （`npm run icon` 一并生成，含 16/32/48/64/128/256px 各档 chunk）
- `doctor` 的快捷方式路径改为按平台显示（Windows `.lnk` / macOS `.app` / Linux `.desktop`）
- 单元测试：ICNS 结构校验、macOS 应用构建器（Info.plist / 启动脚本）纯函数测试

## [1.0.0] - 2025-08-14

### 新增
- `dsh-launcher` 命令行工具（Node.js ≥ 18.17，零运行时依赖）：
  - `start`：自动检测 DeepSeek Harness（PATH 上的 `dsh` 或源码 checkout），
    必要时后台启动 `dsh web`，等待就绪后自动打开浏览器；
    已在运行则直接打开浏览器，不重复启动
  - `stop`：仅停止由本启动器启动的实例（pid 文件机制，不会误杀手动启动的实例）
  - `status`：运行状态查询（支持 `--json` 机器可读输出）
  - `doctor`：环境诊断（node / dsh / checkout / 端口 / 快捷方式 / 图标）
  - `config`：`get/set/reset` 管理 `~/.dsh-launcher/config.json`
  - `install` / `uninstall`：桌面快捷方式安装与卸载
- Windows 桌面快捷方式「DeepSeek Harness」：
  - 图标为黑色小鲸鱼（`assets/deepseek-whale-black.ico`，含 16–256px 七档尺寸）
  - 静默启动（wscript + start-silent.vbs，无控制台窗口闪烁，失败弹窗提示日志位置）
- Linux 支持：`.desktop` 桌面入口 + hicolor 图标（256px PNG）
- 中英双语提示，按系统语言自动选择（`--lang` / `DSH_LAUNCHER_LANG` 可覆盖）
- 零依赖构建管线：
  - `scripts/prepare-icons.mjs`：校验 ICO 并从权威 ICO 无损提取 256px PNG
  - `scripts/zip.mjs`：纯 Node 实现的 ZIP 打包器（store 模式，构建可复现）
  - `scripts/build.mjs`：产出 `dist/deepseek-harness-launcher-v<版本>.zip` + SHA-256
- CI（ubuntu/windows × node 20/22/24）与 tag 触发的 GitHub Release 自动化
- `node --test` 单元测试：图标完整性、配置优先级、harness 检测、ZIP 结构
