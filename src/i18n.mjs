/**
 * Small bilingual (zh-CN / en) message catalog for the launcher CLI.
 * Language resolution: --lang flag > DSH_LAUNCHER_LANG env > system locale.
 */
const MESSAGES = {
  en: {
    'cli.usage': 'Usage: dsh-launcher <command> [options]\nRun "dsh-launcher help" for the full command reference.',
    'cli.help': `DeepSeek Harness Launcher — one-click start for the dsh web UI.

Usage: dsh-launcher <command> [options]

Commands:
  start       Detect the harness, start "dsh web" if needed, open the browser
  stop        Stop the dsh web instance previously started by this launcher
  status      Show whether the web UI is running (--json for machine output)
  install     Create the "DeepSeek Harness" desktop shortcut (black whale icon)
  uninstall   Remove the desktop shortcut
  doctor      Diagnose the environment: node, harness, port, shortcut, icon
  config      Show config; config get/set/reset manage ~/.dsh-launcher/config.json
  version     Print the launcher version
  help        Show this help

Options:
  --port <n>       Port for dsh web (default 3080); also passed to "dsh web"
  --url <url>      Web UI URL (default http://127.0.0.1:<port>)
  --timeout <sec>  Startup wait timeout (default 90)
  --no-browser     Start without opening the browser
  --restart        Restart the running instance (instead of just opening the browser)
  --cwd <dir>      Harness checkout directory hint (auto-detected otherwise)
  --command <cmd>  Run an explicit command instead of auto-detection
  --lang zh|en     Message language (default: auto)
  --force          install: overwrite an existing shortcut
  --json           status: print JSON

Environment:
  DSH_LAUNCHER_HARNESS   checkout dir hint (same as --cwd)
  DSH_LAUNCHER_PORT      port (same as --port)
  DSH_LAUNCHER_URL       web UI URL
  DSH_LAUNCHER_TIMEOUT   startup timeout seconds
  DSH_LAUNCHER_NO_BROWSER=1  never open the browser
  DSH_LAUNCHER_LANG      zh|en message language
  DSH_LAUNCHER_HOME      state dir override (default ~/.dsh-launcher)`,
    'cli.unknownCommand': 'Unknown command: {command}. Run "dsh-launcher help".',
    'cli.unknownFlag': 'Unknown option: {flag}. Run "dsh-launcher help".',
    'cli.missingValue': 'Option {flag} requires a value.',
    'cli.version': 'deepseek-harness-launcher v{version}',

    'detect.using': 'Harness runner: {kind} ({hint})',
    'detect.notFound': `DeepSeek Harness (dsh) was not found.

Install it first, then run the launcher again:
  npm package:   npx @deepseek-ai/dsh web
  or from source:
    git clone https://github.com/deepseek-ai/deepseek-harness.git
    cd deepseek-harness && pnpm install && pnpm run build

If the harness lives in a non-standard location, point the launcher at it:
  dsh-launcher config set harness.cwd "D:/path/to/deepseek-harness"`,

    'server.already': 'The web UI is already serving at {url}.',
    'server.portBusy': 'Port {port} is in use by another application. Change it with --port or stop the other process.',
    'server.starting': 'Starting: {command}\nLog file: {log}',
    'server.needsBuild': 'Warning: apps/web/dist is missing in the checkout; run "pnpm run build" there first if startup fails.',
    'server.ready': 'Web UI ready at {url} after {seconds}s.',
    'server.browserOpened': 'Browser opened: {url}',
    'server.browserFailed': 'Could not open the browser automatically; open {url} manually.',
    'server.exited': 'dsh exited during startup (code {code}). See {log} for details.',
    'server.timeout': 'dsh did not respond within {seconds}s. See {log} for details.',
    'server.noPid': 'No pid file found; nothing started by this launcher to stop.',
    'server.stopped': 'DeepSeek Harness web instance stopped (pid {pid}).',
    'server.restarting': 'Restarting the running instance (pid {pid})...',
    'server.restartSkipped': 'Already running at {url} but not started by this launcher; restart skipped, opening the browser only.',
    'server.stillServing': 'Note: {url} is still responding; that instance was not started by this launcher. Stop it manually if needed.',
    'server.notRunning': 'Not running: {url}',
    'server.logTail': 'Last log lines from {log}:',

    'status.running': 'RUNNING  {url}  (pid {pid}, started by this launcher)',
    'status.runningNoPid': 'RUNNING  {url}  (not started by this launcher)',
    'status.stalePid': 'STOPPED  {url}  (stale pid file {pid})',
    'status.stopped': 'STOPPED  {url}',
    'status.log': 'Log file: {log}',
    'status.home': 'Launcher home: {home}',

    'shortcut.installing': 'Creating desktop shortcut "{name}"...',
    'shortcut.installed': 'Shortcut "{name}" created on the Desktop (icon: black whale). Double-click it to start DeepSeek Harness.',
    'shortcut.already': 'Shortcut "{name}" already exists. Re-run with --force to overwrite.',
    'shortcut.uninstalled': 'Shortcut "{name}" removed from the Desktop.',
    'shortcut.missing': 'Shortcut "{name}" was not found on the Desktop.',
    'shortcut.unsupported': 'Desktop shortcut creation is only supported on Windows, macOS and Linux.',
    'shortcut.linuxFiles': 'Linux desktop entry installed:\n  {desktop}\n  {applications}\nIcon: {icon}',
    'shortcut.macInstalled': 'macOS app installed: {app}\nDesktop link: {alias}',
    'shortcut.vbsWritten': 'Silent launcher written: {path}',

    'doctor.node': 'node             {version}',
    'doctor.platform': 'platform         {platform}',
    'doctor.root': 'launcher root    {root}',
    'doctor.home': 'launcher home    {home}',
    'doctor.dshPath': 'dsh on PATH      {path}',
    'doctor.dshNone': 'dsh on PATH      not found',
    'doctor.checkout': 'harness checkout {path}',
    'doctor.checkoutNone': 'harness checkout not found',
    'doctor.portServing': 'web UI           serving at {url}',
    'doctor.portFree': 'web UI           not running ({url})',
    'doctor.pid': 'pid file         {pid}',
    'doctor.pidNone': 'pid file         none',
    'doctor.shortcut': 'desktop shortcut {path}',
    'doctor.shortcutNone': 'desktop shortcut not installed (run "dsh-launcher install")',
    'doctor.icon': 'icon             {path}',
    'doctor.iconNone': 'icon             MISSING: assets/deepseek-whale-black.ico',
    'doctor.ok': 'Everything looks good.',
    'doctor.configFile': 'config file      {path}',
    'doctor.configNone': 'config file      none (defaults)',

    'config.file': 'Config file: {path}',
    'config.fileMissing': 'No config file yet; defaults are in use: {path}',
    'config.saved': 'Config saved: {path}',
    'config.setDone': '{key} = {value}',
    'config.getResult': '{key} = {value}',
    'config.resetDone': 'Config reset (file removed): {path}',
    'config.badRoot': 'Config keys must start with "harness." (e.g. harness.port, harness.cwd).',
    'config.invalidJson': 'Config file is invalid JSON: {path}\n{error}',
    'config.showHint': 'Manage with: dsh-launcher config get/set/reset <harness.key>',
  },
  zh: {
    'cli.usage': '用法: dsh-launcher <命令> [选项]\n运行 "dsh-launcher help" 查看完整命令说明。',
    'cli.help': `DeepSeek Harness Launcher — 一键启动 dsh Web 界面。

用法: dsh-launcher <命令> [选项]

命令:
  start       检测 harness，必要时启动 "dsh web"，并自动打开浏览器
  stop        停止由本启动器启动的 dsh web 实例
  status      查看 Web 界面运行状态（--json 输出机器可读格式）
  install     创建 "DeepSeek Harness" 桌面快捷方式（黑色小鲸鱼图标）
  uninstall   删除桌面快捷方式
  doctor      环境诊断：node、harness、端口、快捷方式、图标
  config      显示配置；config get/set/reset 管理 ~/.dsh-launcher/config.json
  version     打印启动器版本
  help        显示本帮助

选项:
  --port <n>       dsh web 端口（默认 3080），同时传给 "dsh web"
  --url <url>      Web 界面地址（默认 http://127.0.0.1:<port>）
  --timeout <sec>  启动等待超时（默认 90 秒）
  --no-browser     启动但不自动打开浏览器
  --restart        重启运行中的实例（而不是仅打开浏览器）
  --cwd <dir>      harness 源码目录提示（默认自动检测）
  --command <cmd>  使用指定命令启动（跳过自动检测）
  --lang zh|en     提示语言（默认自动）
  --force          install：覆盖已有快捷方式
  --json           status：输出 JSON

环境变量:
  DSH_LAUNCHER_HARNESS   源码目录提示（同 --cwd）
  DSH_LAUNCHER_PORT      端口（同 --port）
  DSH_LAUNCHER_URL       Web 界面地址
  DSH_LAUNCHER_TIMEOUT   启动等待超时秒数
  DSH_LAUNCHER_NO_BROWSER=1  永不自动打开浏览器
  DSH_LAUNCHER_LANG      zh|en 提示语言
  DSH_LAUNCHER_HOME      状态目录覆盖（默认 ~/.dsh-launcher）`,
    'cli.unknownCommand': '未知命令: {command}。运行 "dsh-launcher help"。',
    'cli.unknownFlag': '未知选项: {flag}。运行 "dsh-launcher help"。',
    'cli.missingValue': '选项 {flag} 缺少值。',
    'cli.version': 'deepseek-harness-launcher v{version}',

    'detect.using': '启动方式: {kind} ({hint})',
    'detect.notFound': `未找到 DeepSeek Harness（dsh）。

请先安装 harness，再重新运行启动器:
  npm 包方式:    npx @deepseek-ai/dsh web
  或源码方式:
    git clone https://github.com/deepseek-ai/deepseek-harness.git
    cd deepseek-harness && pnpm install && pnpm run build

如果 harness 在非标准位置，请指定目录:
  dsh-launcher config set harness.cwd "D:/path/to/deepseek-harness"`,

    'server.already': 'Web 界面已在运行: {url}。',
    'server.portBusy': '端口 {port} 已被其他程序占用。可用 --port 换端口，或先停止占用端口的程序。',
    'server.starting': '正在启动: {command}\n日志文件: {log}',
    'server.needsBuild': '警告: 源码目录缺少 apps/web/dist，如启动失败请先在其中运行 "pnpm run build"。',
    'server.ready': 'Web 界面已就绪: {url}（用时 {seconds} 秒）。',
    'server.browserOpened': '已打开浏览器: {url}',
    'server.browserFailed': '自动打开浏览器失败，请手动访问 {url}。',
    'server.exited': 'dsh 在启动过程中退出（退出码 {code}）。详见 {log}。',
    'server.timeout': 'dsh 在 {seconds} 秒内未响应。详见 {log}。',
    'server.noPid': '未找到 pid 文件，本启动器没有已启动的实例可停止。',
    'server.stopped': 'DeepSeek Harness Web 实例已停止（pid {pid}）。',
    'server.restarting': '正在重启运行中的实例（pid {pid}）...',
    'server.restartSkipped': '{url} 已在运行但不是本启动器启动的，已跳过重启（仅打开浏览器）。',
    'server.stillServing': '注意: {url} 仍在响应，该实例不是本启动器启动的，如需停止请手动处理。',
    'server.notRunning': '未运行: {url}',
    'server.logTail': '{log} 最近几行日志:',

    'status.running': '运行中  {url}  （pid {pid}，由本启动器启动）',
    'status.runningNoPid': '运行中  {url}  （不是由本启动器启动）',
    'status.stalePid': '已停止  {url}  （存在过期的 pid 文件 {pid}）',
    'status.stopped': '已停止  {url}',
    'status.log': '日志文件: {log}',
    'status.home': '启动器目录: {home}',

    'shortcut.installing': '正在创建桌面快捷方式 "{name}"...',
    'shortcut.installed': '快捷方式 "{name}" 已创建到桌面（图标: 黑色小鲸鱼）。双击即可启动 DeepSeek Harness。',
    'shortcut.already': '快捷方式 "{name}" 已存在。加 --force 可覆盖。',
    'shortcut.uninstalled': '已从桌面删除快捷方式 "{name}"。',
    'shortcut.missing': '桌面上未找到快捷方式 "{name}"。',
    'shortcut.unsupported': '桌面快捷方式仅支持 Windows、macOS 和 Linux。',
    'shortcut.linuxFiles': 'Linux 桌面入口已安装:\n  {desktop}\n  {applications}\n图标: {icon}',
    'shortcut.macInstalled': 'macOS 应用已安装: {app}\n桌面链接: {alias}',
    'shortcut.vbsWritten': '静默启动脚本已写入: {path}',

    'doctor.node': 'node              {version}',
    'doctor.platform': '操作系统          {platform}',
    'doctor.root': '启动器目录        {root}',
    'doctor.home': '启动器数据目录    {home}',
    'doctor.dshPath': 'PATH 中的 dsh     {path}',
    'doctor.dshNone': 'PATH 中的 dsh     未找到',
    'doctor.checkout': 'harness 源码目录  {path}',
    'doctor.checkoutNone': 'harness 源码目录  未找到',
    'doctor.portServing': 'Web 界面          正在运行 {url}',
    'doctor.portFree': 'Web 界面          未运行（{url}）',
    'doctor.pid': 'pid 文件          {pid}',
    'doctor.pidNone': 'pid 文件          无',
    'doctor.shortcut': '桌面快捷方式      {path}',
    'doctor.shortcutNone': '桌面快捷方式      未安装（运行 "dsh-launcher install"）',
    'doctor.icon': '图标              {path}',
    'doctor.iconNone': '图标              缺失: assets/deepseek-whale-black.ico',
    'doctor.ok': '一切正常。',
    'doctor.configFile': '配置文件          {path}',
    'doctor.configNone': '配置文件          无（使用默认值）',

    'config.file': '配置文件: {path}',
    'config.fileMissing': '还没有配置文件，当前使用默认值: {path}',
    'config.saved': '配置已保存: {path}',
    'config.setDone': '{key} = {value}',
    'config.getResult': '{key} = {value}',
    'config.resetDone': '配置已重置（文件已删除）: {path}',
    'config.badRoot': '配置键必须以 "harness." 开头（例如 harness.port、harness.cwd）。',
    'config.invalidJson': '配置文件不是合法 JSON: {path}\n{error}',
    'config.showHint': '管理配置: dsh-launcher config get/set/reset <harness.键名>',
  },
};

/** Resolve the display language: explicit flag > env var > system locale. */
export function detectLang() {
  const env = process.env.DSH_LAUNCHER_LANG ?? '';
  if (/^zh/i.test(env)) return 'zh';
  if (/^en/i.test(env)) return 'en';
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    if (locale.toLowerCase().startsWith('zh')) return 'zh';
  } catch {
    /* fall through */
  }
  return 'en';
}

/** Build a translator function for the requested language. */
export function makeT(lang) {
  const resolved = lang === 'auto' ? detectLang() : MESSAGES[lang] ? lang : detectLang();
  const dict = MESSAGES[resolved];
  return (key, vars) => {
    let text = dict[key] ?? MESSAGES.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  };
}
