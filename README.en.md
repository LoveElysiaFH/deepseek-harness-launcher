<p align="center">
  <img src="assets/whale-black.png" width="128" height="128" alt="DeepSeek Harness black whale icon">
</p>

# DeepSeek Harness Launcher

A one-click launcher for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (`dsh`) web UI.

Assuming you already have DeepSeek Harness installed, it:

- 🔍 Locates your harness automatically (`dsh` on PATH, or a source checkout)
- 🚀 Starts `dsh web` if it is not running (never spawns a duplicate)
- 🌐 Waits for the web UI and opens your browser (default `http://127.0.0.1:3080`)
- 🐳 Creates a **“DeepSeek Harness” desktop shortcut with the black whale icon**
  (Windows `.lnk` / macOS `.app` / Linux `.desktop`)
- 🪵 Logs everything to `~/.dsh-launcher/run/web.log`; double-click starts silently, failures pop a message box

Zero runtime dependencies (plain Node.js ≥ 18.17), bilingual (zh/en) output, Windows / Linux / macOS.
中文文档：[README.md](README.md)

## Quick start

### 1. Get the launcher

Download `deepseek-harness-launcher-v<version>.zip` from
[Releases](https://github.com/LoveElysiaFH/deepseek-harness-launcher/releases)
and unzip it somewhere permanent (e.g. `~/tools/deepseek-harness-launcher`), or clone from source:

```sh
git clone https://github.com/LoveElysiaFH/deepseek-harness-launcher.git
cd deepseek-harness-launcher
```

### 2. Install the desktop shortcut for your platform

Inside the launcher directory, the command is the same on every platform:

```sh
node bin\launcher.mjs install
```

What it creates differs per platform:

| Platform | Result | How to use |
| --- | --- | --- |
| **Windows** | Desktop `DeepSeek Harness.lnk` (black whale `.ico`, silent wscript launch, no console flash) | Double-click the desktop icon |
| **macOS** | `~/Applications/DeepSeek Harness.app` (black whale `.icns`, `LSUIElement` so no Dock icon lingers) + a Desktop link | Double-click the `.app` or Desktop icon |
| **Linux** | `.desktop` entry on the Desktop and in `~/.local/share/applications` + hicolor icon | Launch from the app menu or Desktop |

> Run `node bin\launcher.mjs doctor` once to check your environment.
> After moving the launcher folder, re-run `node bin\launcher.mjs install --force`.

### 3. Or just use the CLI (all platforms)

```sh
node bin\launcher.mjs start    # start (or reuse) dsh web and open the browser
node bin\launcher.mjs stop     # stop the instance started by this launcher
node bin\launcher.mjs status   # show the running state
```

## Prerequisites

| Item | Requirement |
| --- | --- |
| Node.js | ≥ 18.17 (`node --version`) |
| DeepSeek Harness | installed and working, either:<br>• npm: `npx @deepseek-ai/dsh web` starts<br>• source: `git clone https://github.com/deepseek-ai/deepseek-harness.git` then `pnpm install && pnpm run build` |

> ## ⚠️ Can't find the harness? Point it at the directory
>
> The launcher looks in order: ① `dsh` on PATH → ② a `deepseek-harness*` source checkout
> in common places (`~` and up to 6 levels above the launcher). If `doctor` reports
> **“harness checkout not found”**, tell it where the harness lives — **any directory works**:
>
> ```sh
> node bin\launcher.mjs config set harness.cwd "D:/your/path/deepseek-harness"   # permanent (config)
> node bin\launcher.mjs start --cwd "D:/your/path/deepseek-harness"              # one-off
> ```
>
> Or set the `DSH_LAUNCHER_HARNESS` environment variable (`set` on Windows, `export` on macOS/Linux).
> Verify with `node bin\launcher.mjs doctor` — it should show the path you gave.

## How it works

On every platform, double-clicking the shortcut funnels into the same command,
`node bin\launcher.mjs start`:

```
double-click desktop shortcut
  └─ Windows: start-silent.vbs / macOS: .app / Linux: .desktop
      └─ node bin\launcher.mjs start
          ├─ detect harness (see order below)
          ├─ already serving? ──yes──▶ open browser, done
          ├─ port taken by something else? ──▶ error with advice
          └─ spawn dsh web in the background (log: ~/.dsh-launcher/run/web.log)
              └─ poll every 0.5 s until ready (default 90 s timeout)
                  └─ open the default browser
```

Detection order (check with `doctor`):

1. `harness.command` from config / `--command`
2. `dsh` on PATH
3. a source checkout (searched in `~` and up to 6 levels above the launcher):
   prefers the built entry `apps/cli/lib/bin.js`, then `pnpm dsh web`, then `npx dsh web`

## Command reference

| Command | Description |
| --- | --- |
| `start` | Start (or reuse) `dsh web` and open the browser |
| `stop` | Stop only the instance started by this launcher (pid-file based) |
| `status` | Running state; `--json` for machine-readable output |
| `install` | Create the desktop shortcut (black whale icon); `--force` overwrites |
| `uninstall` | Remove the desktop shortcut |
| `doctor` | Diagnose node / dsh / checkout / port / shortcut / icon |
| `config` | Show config; `config get/set/reset <harness.key>` manage it |
| `version` | Print the version |
| `help` | Full help |

Common flags: `--port <n>`, `--url <url>`, `--timeout <sec>`, `--no-browser`, `--cwd <dir>`, `--command <cmd>`, `--lang zh|en`.

Examples:

```sh
node bin\launcher.mjs start --port 3099 --no-browser   # alternate port, no browser
node bin\launcher.mjs status --json                    # for scripts / monitoring
node bin\launcher.mjs config set harness.cwd "D:/ai/deepseek-harness"
node bin\launcher.mjs config set harness.timeoutSec 120
```

## Configuration

Config file: `~/.dsh-launcher/config.json` (template: [config.example.json](config.example.json)).
Precedence: **CLI flags > environment variables > config file > defaults**.

| Key | Default | Description |
| --- | --- | --- |
| `harness.command` | `null` | Explicit command (string or array); skips auto-detection |
| `harness.cwd` | `null` | Source checkout directory hint |
| `harness.env` | `{}` | Extra env vars for the dsh process |
| `harness.args` | `["web"]` | Args appended to the detected dsh command |
| `harness.port` | `3080` | Web port (passed to dsh as `--port` when not 3080) |
| `harness.url` | `null` | Web URL (null = `http://127.0.0.1:<port>`) |
| `harness.timeoutSec` | `90` | Startup wait timeout |
| `harness.openBrowser` | `true` | Open the browser after startup |

Environment variables: `DSH_LAUNCHER_HARNESS`, `DSH_LAUNCHER_PORT`, `DSH_LAUNCHER_URL`, `DSH_LAUNCHER_TIMEOUT`, `DSH_LAUNCHER_NO_BROWSER=1`, `DSH_LAUNCHER_LANG`, `DSH_LAUNCHER_HOME`.

## Icon

- Canonical source: `assets/deepseek-whale-black.ico` — the black whale, 16/24/32/48/64/128/256 px.
  To change it, replace the file (same name, common sizes included) and run `npm run icon`.
- `npm run icon` validates the ICO and losslessly extracts the 256 px frame into
  `assets/whale-black.png` (used by the Linux desktop entry and this README), and packs
  the frames into `assets/whale-black.icns` (the macOS `.app` icon).
- The whale mark belongs to DeepSeek; this project uses it only for the local shortcut.

## Build & release

```sh
npm test        # unit tests (node --test, no install step needed)
npm run build   # dist/deepseek-harness-launcher-v<version>.zip + .sha256
```

`npm run build` produces a GitHub-Ready ZIP (with `bin/`, `src/`, `assets/`, `start.cmd`, `stop.cmd`, docs and config template).

### Uploading to GitHub

First time:

```sh
cd deepseek-harness-launcher
git init
git add .
git commit -m "Initial release: dsh web launcher with black whale desktop icon"
git remote add origin https://github.com/LoveElysiaFH/deepseek-harness-launcher.git
git branch -M main
git push -u origin main
```

Every release after that, just tag (CI builds and publishes the Release):

```sh
git tag v1.0.0
git push origin v1.0.0
```

Manual release: run `npm run build` and upload the `.zip` and `.sha256` from `dist/` on the GitHub Release page.

## Project layout

```
deepseek-harness-launcher/
├── bin/launcher.mjs          CLI entry point
├── src/
│   ├── cli.mjs               arg parsing and dispatch
│   ├── config.mjs            config loading (file + env + CLI)
│   ├── detect.mjs            harness detection (PATH / checkout)
│   ├── server.mjs            dsh web start/stop/status/browser
│   ├── shortcut.mjs          desktop shortcut (Windows .lnk / Linux .desktop)
│   ├── paths.mjs             ~/.dsh-launcher paths
│   └── i18n.mjs              zh/en messages
├── assets/
│   ├── deepseek-whale-black.ico   canonical icon (black whale)
│   └── whale-black.png            256 px frame (generated by npm run icon)
├── scripts/
│   ├── prepare-icons.mjs     ICO validation + PNG extraction
│   ├── zip.mjs               dependency-free ZIP writer
│   └── build.mjs             release build
├── test/                     node --test unit tests
├── .github/workflows/        CI (multi-OS, multi-Node) + automated Release
└── start.cmd / stop.cmd      visible-console debugging entry points (Windows only)
```

## FAQ

**Double-clicking does nothing?**
Run `node bin\launcher.mjs doctor`; logs live in `~/.dsh-launcher/run/web.log`.

**“Port 3080 is in use”?**
Something else owns the port: use `start --port 3099` (forwarded to `dsh web --port`).

**Harness not found?**
Confirm `npx @deepseek-ai/dsh web` works. For a non-standard location, see
“⚠️ Can't find the harness? Point it at the directory” above and use
`harness.cwd` / `--cwd` / `DSH_LAUNCHER_HARNESS`.

**Moved the launcher folder and the shortcut broke?**
Re-run `node bin\launcher.mjs install --force` (the shortcut records absolute paths).

**How do I stop it?**
`node bin\launcher.mjs stop` on every platform; on Windows you can also double-click
`stop.cmd`. Only launcher-started instances are stopped.

**Where does each platform put its shortcut?**
See the “Install the desktop shortcut for your platform” table above: Windows = Desktop
`.lnk`, macOS = `~/Applications/DeepSeek Harness.app` + Desktop link, Linux = `.desktop`
entry. Uninstall on any platform with `node bin\launcher.mjs uninstall`.

## Maintaining & contributing

- Zero runtime dependencies; zero-dependency tests (`node --test`) — `npm test` green means safe to merge
- Semantic versioning; changes tracked in [CHANGELOG.md](CHANGELOG.md)
- CI runs tests + build on ubuntu/windows × node 20/22/24
- Issues and PRs welcome; see “Icon” above for the icon change workflow

## License

[MIT](LICENSE). The whale mark belongs to DeepSeek and is used only for the local shortcut.
