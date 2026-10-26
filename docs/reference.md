# Detailed reference

English | [中文](reference.zh.md)

For installation and everyday use, start with the [README](../README.md). This page keeps the architecture, advanced configuration, troubleshooting and development notes.

## Architecture

The plugin registers the `searxng` provider into `ctx.web`. Each search starts with `GET {baseURL}/search?format=json`. The new direct Search/Fetch API retry options require independent explicit opt-ins. The default fetch route is `searxng-http`, using the target host's public HTTP provider. Legacy `allowOfficialFallback` still requires public `web.searchWithProvider`.

```
┌─────────────┐   web search   ┌──────────────┐   JSON API   ┌────────────────┐
│  dsh agent  │ ─────────────▶ │ ctx.web seam │ ───────────▶ │ your SearXNG   │
│  (LLM)      │ ◀───────────── │  (searxng    │ ◀─────────── │ instance       │
└─────────────┘  sources only  │  provider)   │   results[]  └───────┬────────┘
                               └──────────────┘                      │ aggregates
                                                          ┌──────────▼──────────┐
                                                          │ Google / Bing / DDG │
                                                          │ selected engines    │
                                                          └─────────────────────┘
```

SearXNG returns no generated answer, so results carry **sources only** — the agent reads the pages itself with `fetch` when it needs content. Each result maps to a citeable source:

| SearXNG field | dsh source field | Notes |
|---|---|---|
| `url` | `url` | entries without one are dropped |
| `title` | `title` | omitted when blank |
| `content` | `snippet` | the engine's excerpt |
| `publishedDate` | `publishedAt` | when the engine provides it |

The provider initially maps `truncated` to `false`; DSH's Web service applies `maxResults` and can set the final result's flag to `true`. No generated `content` answer is attached because SearXNG supplies sources rather than an answer.

## Security

- 🔒 **Credential-free by default** — local search needs no key. Optional instance credentials use DSH's credential store and never appear in ordinary settings or card responses.
- ⛔ **Redirects fail closed** — HTTP redirects raise `WEB_PROVIDER_ERROR`, so queries and optional credentials never follow a redirect target.
- 🏠 **Self-host friendly** — loopback (`http://localhost:8080`), private IPs, and subpath mounts (`http://host/searxng`) all work; `/search` is appended correctly.
- 💬 **Actionable errors** — 401 points to authentication; 403 can mean denied access or disabled JSON output. Neither status alone proves a key expired.

Credentials are bound to the instance endpoint (including its mount path) and header name. Managed local mode never sends saved external credentials, and official fallback receives no instance headers. Use HTTPS for remote instances.

## Configuration

### Requirements

- DeepSeek Harness with standard base/Web bundles and the public `ctx.web` service. The minimum remains **0.2.1-alpha.2**; see [host compatibility](host-compatibility.md) for the newer `0.2.1-rc.3` testing feedback. DSH peers declare `>=0.2.1-alpha.2 <0.3.0`; earlier releases are not supported. Client development dependencies are pinned to the same release train.
- Local management needs GitHub and PyPI access from the DSH backend. Dependencies are cached in the profile's `searxng/` directory for subsequent launches. Existing-instance mode needs a running service with **JSON output enabled**.
- The host's Node.js runtime must satisfy `^22.19 || >=24`; source development requires the same range.

### Optional: deploy an external SearXNG instance

Install and start [Docker](https://docs.docker.com/get-started/get-docker/) first. The following is a macOS/Linux shell example; Windows users can run it in WSL with Docker integration configured, or adapt it to native PowerShell syntax. Alternatively, follow the [official SearXNG container deployment guide](https://docs.searxng.org/admin/installation-docker.html) or connect to an existing remote instance.

```sh
mkdir -p searxng && cd searxng
cat > settings.yml <<'EOF'
use_default_settings: true
server:
  secret_key: "change-me-to-a-long-random-string"
search:
  formats:
    - html
    - json   # ← required by this plugin
EOF
docker run -d --name searxng -p 8080:8080 \
  -v "$PWD/settings.yml:/etc/searxng/settings.yml" \
  searxng/searxng
```

This section is for Existing instance mode; default local management needs none of these commands. `-d` runs the container in the background without an automatic restart policy in this example. External containers remain operator-managed; the plugin never starts or stops them. Managed local services follow the plugin/DSH lifecycle.

If host port `8080` is occupied, use `-p 8088:8080` and enter `http://localhost:8088` in the card; the right-hand side remains the container port. A directly launched source instance instead needs a `server.port` change and a service restart; see [configuration notes](configuration.md#searxng-service-and-ports).

Verify JSON is enabled:

```sh
curl "http://localhost:8080/search?q=test&format=json"
```

### Operating systems and validation coverage

Local setup selects macOS, Windows and Linux glibc x64/arm64 bootstrap tools and uses public DSH subprocess APIs. The three-system workflow checks setup and lifecycle; real upstream searches and the full Web card are checked locally on macOS arm64. See [this release's validation record](validation-2026-10-25-0.5.0.md) for exact commits, commands, CI results and uncovered cases. Historical CI runs do not certify this release. A complete CPU architecture and Linux distribution matrix is not covered.

| DSH host platform | SearXNG deployment options | Validation scope |
|---|---|---|
| macOS | Managed local service or existing local/remote instance | Local Web card and real search; CI status in release evidence |
| Windows | Managed local service or existing local/remote instance | CI setup and lifecycle; full Web card not locally verified |
| Linux | Managed local service (glibc) or existing local/remote instance | CI setup and lifecycle; full Web card not locally verified |

DSH version compatibility is separate: the minimum remains **unpatched 0.2.1-alpha.2**. Version 0.5.0 is verified against that exact baseline; the rc.2 candidate is not revalidated for this release. See the [current release evidence](validation-2026-10-25-0.5.0.md). The peer range `>=0.2.1-alpha.2 <0.3.0` is not a guarantee for every version.

Future updates follow the [host compatibility and release testing policy](host-compatibility.md): preserve the minimum host, validate recommended/candidate versions, and record packed-artifact, real-host and settings-page evidence. The current minimum and recommended host are both `0.2.1-alpha.2`.

The endpoint must be reachable from the **DSH backend**. `localhost` means the backend's host or container; a browser on another computer does not make that computer the backend's `localhost`. A remote instance does not require every user to start SearXNG locally. For connection errors, check that the service is running and JSON is enabled, then check the card's endpoint.

### Install options

**From GitHub (tracks latest main):**

```sh
dsh plugin --profile <name> add https://github.com/Chaos-Paradox/dsh-search-proxy
```

**Pin the v0.5.0 release (recommended for reproducibility):**

```sh
dsh plugin --profile <name> add https://github.com/Chaos-Paradox/dsh-search-proxy#v0.5.0
```

**Tarball URL (no Git required; useful on Windows without Git):**

```sh
dsh plugin --profile <name> add https://codeload.github.com/Chaos-Paradox/dsh-search-proxy/tar.gz/refs/tags/v0.5.0
```

GitHub-address installs need Git on the DSH machine. If Git is unavailable, use a tarball address instead. On Windows, you can also install Git with `winget install --id Git.Git -e`, then fully restart DSH. Update the version in the URL when upgrading.

This reference describes plugin **0.5.0**, with credential-free managed local search by default. See [release notes and the installable tarball](https://github.com/Chaos-Paradox/dsh-search-proxy/releases/tag/v0.5.0), or all versions on the [Releases page](https://github.com/Chaos-Paradox/dsh-search-proxy/releases). Fully restart the DSH backend and refresh after upgrading. Existing external instances and usable older caches remain usable.

**From a local clone or tarball:** the same command takes an absolute path, e.g. `dsh plugin --profile <name> add /path/to/dsh-search-proxy`. No build step needed — `lib/` is committed.

The bundle registers SearXNG and overlays the complete `web.config` with `searchProvider: searxng` and `fetchProvider: searxng-http`. DSH replaces config objects instead of merging fields. Profile/home/CLI overrides retain higher priority; custom fetch providers in earlier layers need a later complete Web config. Installation itself writes no user-layer route. Explicitly confirming **Restore plugin routes** saves a user selection that disable/removal will retain; see [manual handling](official-fallback.md). Verify the import:

```sh
dsh plugin --profile <name> list        # dsh-search-proxy should appear

# disable the whole bundle — expose the remaining route, keep saved settings
dsh plugin --profile <name> disable dsh-search-proxy

# remove — expose the remaining route, keep saved settings
dsh plugin --profile <name> remove dsh-search-proxy
```

### 1. Point it at your instance

**Option A — GUI (recommended):** choose a service mode, engines and result language, then save. Local mode supplies its endpoint automatically. Port changes restart the local service; engine/language changes do not. Existing-instance mode accepts your own endpoint.

The engine list groups common candidates by purpose: web, news, research, and technology/reference. It is not a live inventory of your instance; chosen names must exist and be enabled there. No selection uses the instance defaults. Other engine names and language codes remain available through the custom options, and existing custom values are preserved when editing a list selection.

**Option B — environment variable** before launching dsh:

```sh
export SEARXNG_BASE_URL="http://localhost:8080"
```

| Field | GUI label | Env fallback | Description |
|---|---|---|---|
| `mode` | Service mode | — | `auto` preserves existing endpoints, otherwise manages locally; `local` forces local; `external` uses an existing service. |
| `managedPort` | Local port | — | Default `0` selects a free port; occupied explicit ports fail visibly. |
| `baseURL` | Instance endpoint | `SEARXNG_BASE_URL` | External instance base; managed local mode uses its effective endpoint. |
| `engines` | Engines / 引擎限制 | — | Grouped multi-select list; stored as comma-separated names, e.g. `bing,duckduckgo`. Custom names are supported. |
| `language` | Language / 结果语言 | — | Dropdown for common languages plus a custom-code option, e.g. `zh-CN`, `en`, `ja`. |
| `authEnabled` | Send an authentication header | — | Default false. Only applies to an existing instance; managed local mode always omits credentials. |
| `authHeaderName` | Authentication header name | — | Default `X-API-Key`; custom authentication headers such as `Authorization` are supported. |

For a protected instance, open the card's **Instance authentication (optional)** section, enable it, and enter the header name and complete value supplied by the operator (for example `Authorization` with `Bearer <token>`). Save once, then use Test search. The value is write-only and stored through DSH credentials, not `cordis.patch.yml`. Leaving the value blank keeps the saved credential; changing the endpoint/mount or header name requires a credential for that target. Disabling authentication or resetting settings stops sending it while retaining the saved value. **Remove saved credential** deletes the value for the current target; save or discard pending edits first. Upstream engine API keys remain SearXNG `settings.yml` configuration. This plugin does not deploy authentication, billing or quota management on the server. See [configuration notes](configuration.md#optional-instance-authentication).

![Optional instance authentication on the English 0.3.1 card](auth-card.en.jpg)

*Actual 0.3.1 card in an isolated DSH test profile. The local fixture requires a custom header; the saved value is not displayed.*

Search reports unavailable while preparing, stopped or failed, or when external mode has no endpoint. The card exposes status, retry and logs. Test search only calls SearXNG, never official fallback.

### 2. Optional official fallback

Version 0.4.1 has two independent, default-off paid switches: one Search API attempt after a failed SearXNG search, and one Fetch API attempt after an eligible local failure. Explicitly save each permission; legacy settings do not enable the new API paths. Cancellation and local safety refusals never trigger a paid retry. Successful fallback results disclose fees, and official fetch may still fail or return a verification page.

Public host credentials and the active rc.2 Web API configuration are reused. No host patch, private registry access or temporary route switching is required. For these retries keep `searxng` / `searxng-http`; the rc.2 built-in API switch overrides both routes. The top route/cost panel offers **Restore plugin routes** with a two-route review and manual steps. Saved fallback permissions stay unchanged; higher-priority refusals include instructions. See [official API fallback](official-fallback.md).

### 3. Disable, uninstall and retained settings

Disable the **entire dsh-search-proxy bundle**, using its installed-bundle switch or `dsh plugin --profile <name> disable dsh-search-proxy`; enable uses the corresponding `enable` command. With HMR, route changes apply live; without HMR, restart. Removal uses `dsh plugin --profile <name> remove dsh-search-proxy` (stop a running profile first for CLI removal). The remaining bundle/profile/home/CLI layers determine the restored route, including a custom earlier provider or later manual override. Re-enabling appends the bundle and may change precedence relative to other bundles.

**Disabling only the `web-search-searxng` provider row does not restore routing.** Its bundle still selects `searxng`, so searches fail visibly with `WEB_PROVIDER_CONFIGURED_MISSING`; they do not silently use paid search. Enable that row again, or disable the whole bundle.

Version 0.3.0 retires `configEffects`, the activation journal gate and the companion host patch. Installation no longer writes route ownership to the profile; removal no longer rolls back card settings or arbitrary pre-install field values. Endpoint, engines, language and fallback choices saved by the user stay in the profile for reinstallation. Read [upgrade notes](configuration.md#upgrading-from-020) if an earlier patched installation left a journal or explicit SearXNG route.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Install fails with `ERR_PNPM_GIT_RESOLVE_FAILED` / `git ls-remote failed` | Git is unavailable on the DSH machine; GitHub-address installs need it | Install Git and fully restart DSH, or install the tarball URL / a local tarball instead |
| `SearXNG error (HTTP 401)` | Instance requires authentication or rejected the credential | Check the card's authentication header name/value and the instance operator's instructions |
| `SearXNG error (HTTP 403)` | Access denied, or `search.formats` lacks `json` | Check permissions/authentication; enable JSON in the instance if needed |
| `instance authentication is not ready` | No saved credential for the current endpoint/header, invalid configuration, or unavailable credential service | Save a valid credential for this target, or disable authentication for an unprotected instance |
| Search fails with provider unavailable (`WEB_PROVIDER_CONFIGURED_UNAVAILABLE`) | Local service is preparing/stopped/failed, or external mode has no endpoint | Check card status and retry; configure an address for external mode |
| Local startup reports address/port in use | An explicitly configured local port is occupied | Set Local port to `0` and save, or choose a free fixed port; the plugin does not remap an explicit choice |
| First setup fails during download or dependency installation | The DSH backend cannot reach the download/package services, or setup timed out | Read the card's diagnostic log, restore GitHub/PyPI access and retry |
| Local service reports another owner for this profile | Another DSH process is using the same profile's managed runtime | Stop the other profile process, then retry; do not run two owners for one profile |
| Search went to another provider | A later bundle or higher-priority profile/home/CLI config | Check `--dump-config` and your overrides |
| `search request failed` / ECONNREFUSED | Instance down or wrong port | For managed mode, check card status and start/retry; for external mode, check its service and endpoint (e.g. `docker ps` for a container) |
| A search result opens with a ⚠️ fallback notice | An extended host supports official fallback and SearXNG just failed once | Check the instance; disable the fallback on the card to return to strict mode |
| `WEB_PROVIDER_ERROR` mentioning a redirect | A proxy in front of SearXNG redirects | Point `baseURL` at the final address; redirects fail closed by design |
| Empty `sources` | Engines returned nothing usable (or all entries lacked URLs) | Loosen `engines`, check the instance in a browser |

## Development

```sh
pnpm install        # dependencies come from npm (@deepseek-ai/* 0.2.1-alpha.2 train)
pnpm run build      # tsdown (host + browser bundles) + tsc (browser declarations)
pnpm test           # vitest: provider behavior, redirect policy, proxy egress, card form
pnpm run typecheck  # tsc --noEmit
DSH_SOURCE_ROOT=/path/to/deepseek-harness pnpm run test:host  # after build; unpatched built host
SEARXNG_BASE_URL=http://localhost:8080 pnpm run test:e2e    # opt-in real instance
pnpm run test:managed  # first-use approval, clean setup, real search, cached remount and cleanup (network required)
```

```
src/
  index.ts      plugin entry: config schema, env fallback, provider registration
  provider.ts   SearxngSearchProvider: JSON API call, result mapping, error policy
  fallback.ts   opt-in official fallback: per-request degrade, bilingual notice, host log
  types.ts      SearXNG response types
  client/       browser bundle: the Plugins-page card (React)
tests/          vitest suites incl. redirect & egress policy
```

`lib/` is committed on purpose: installing from a git URL gives the consumer the built artifacts without a build step. **Rebuild and recommit `lib/` whenever `src/` changes.**

Known gap: the card's apply-level registration test lives upstream for now — the published `@deepseek-ai/dsh-client-test-runtime` references source files its npm package does not ship, so this repo keeps local stand-ins (`tests/helpers.ts`) for the two helpers the remaining card specs use.

## Known Limitations

- The minimum supported host remains unpatched DSH 0.2.1-alpha.2. Exact candidate host, packed-artifact and settings-page coverage is recorded separately for each build.
- The route is a bundle default, not an enforced activation condition. Later configuration may select another provider while SearXNG is still registered.
- Overlays replace the entire Web config. Include both `searchProvider` and your desired `fetchProvider` in a custom override; a partial override can remove the explicit search route and cause ambiguity.
- Bundle disable/removal restores composition, not a historical snapshot. User settings remain. Individual provider-row disable fails search until the row or bundle configuration changes.
