# Managed local runtime

English | [中文](managed-runtime.zh.md)

Version 0.4.1 keeps `auto` selection: use an existing `baseURL` or `SEARXNG_BASE_URL`, otherwise select local management. `local` forces local management and `external` connects to an existing instance. A missing or incomplete local cache waits for **Prepare and start**. Before approval, mounting, searching, restarting or changing settings performs no bootstrap downloads or subprocess setup. Released 0.3.0/0.3.1 started preparation automatically; their usable caches still start automatically in 0.4.1.

The first-use summary lists downloads, sources, verification and the runtime directory. Programs execute as the current user; a separate directory is not a permissions sandbox. No Docker, system Python, Git or terminal command is required. Approval permits preparation retries during this DSH run. After a fresh launch with an incomplete cache, or after cleanup, review and approve again. A new pinned runtime without a usable cache also requires approval.

## Settings and use

Choose engines and result language and save; these preferences apply to the next request without restarting. The advanced local port defaults to `0`, allowing the OS to allocate an available port atomically at bind time. There is no fixed 8080 dependency or manual port-opening step. An occupied explicit port fails visibly without stopping its owner or falling back to another port. Set Local port back to `0` and save to restore automatic allocation. Saving a port change stops the old managed process, starts a new one, and updates the effective connection address without overwriting the external endpoint setting. A later launch may receive a different automatic port; the plugin follows it without manual endpoint edits.

For an installation that already has a saved `http://localhost:8080` endpoint, `auto` continues using that external instance. Select Managed local service (`local`) to switch to plugin ownership, leaving Local port at `0`. The old external service remains independently managed.

The card shows first-use waiting, preparation, startup, readiness, stopped and failed states. **Activity log** keeps the last 100 actions during this DSH run: download sources, verified hashes, extraction, actual subprocess argv, configuration, readiness and stop/cleanup. **Process output** is separately expandable and bounded. Commands run as argument arrays; no interactive shell is exposed. Logs exclude environments and authentication headers, and redact known secrets, URL credentials and machine home/runtime paths. Copying includes the redacted record, not the separately displayed absolute runtime directory. This is not a permanent cross-session audit trail.

**Test search** makes one real `SearXNG` JSON query with saved engines, language and optional instance authentication. It contacts upstream search engines, not an LLM; it does not test every engine or use official fallback. The report includes the target search endpoint, HTTP status, JSON interpretation, elapsed time, usable source count and up to three HTTP(S) source links. Connection, authentication, HTTP, response and cancellation failures are distinguished without arbitrary exception text or credential values. Zero sources means the request completed without usable results, not demonstrated search quality. Unpatched DSH 0.2.1-alpha.2 cannot perform official fallback.

**Stop** ends this plugin's process and retains downloads. **Clean runtime** requires a separate confirmation, stops owned work, obtains the profile lock and removes only recognized generated contents in `searxng/`: versioned runtime directories, managed Python, uv cache, generated settings/secret and the server script. It rejects a symlinked runtime root or another live owner's lock. Other files, ordinary profile preferences and credential storage remain. Next preparation needs approval again. **Uninstall plugin** removes the package but retains the runtime directory; clean first to remove downloads too. No external instance is stopped or cleaned.

## Reading startup logs

**Process output** retains upstream log levels. An `ERROR` line alone does not mean the whole service exited. Check the card's **Ready** state, then run **Test search** and inspect HTTP, JSON and source count. Readiness proves connectivity, not availability of every upstream engine.

| Output | Meaning and action |
|---|---|
| `DSH_SEARXNG_READY {"port": …}` | The service script reports its bound SearXNG port; the manager also checks `/config`. This is not your Clash proxy port. |
| Git version / URL / branch lookup errors | The verified pinned source archive has no `.git`. Upstream uses fallback metadata. Search can run; installing Git or running `git init` is unnecessary. |
| `ahmia` / `torch: can't register engine` | These onion engines require Tor and are not registered without it. Default management has no Tor configuration. Other engines can run; an HTTP / Mixed proxy does not automatically enable Tor engines. |
| Missing `limiter.toml` | This optional local override is absent, so upstream defaults apply. Client IP detection initializes even when rate limiting is off. Managed configuration sets `server.limiter: false`. |
| Missing `X-Forwarded-For` / `X-Real-IP` | Direct loopback requests do not pass through a reverse proxy. Upstream can still use WSGI `REMOTE_ADDR`. This alone does not indicate search failure. A public reverse-proxy deployment must configure its own trust boundary correctly. |

The plugin retains raw output and adds explanatory hints. It does not forge forwarding headers, open network listeners or relax TLS checks to hide these messages. If the card fails, HTTP errors occur or no results arrive, keep the test report and redacted activity log to investigate process exit, upstream throttling, engine settings and networking. The display combines stdout and stderr; its order is not a strict cross-stream timeline.

Pinned sources: [version metadata](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/version.py), [engine registration](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/engines/__init__.py), [limiter initialization](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/limiter.py), [client IP handling](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/botdetection/trusted_proxies.py).

## Runtime and lifecycle

The profile's `searxng/` directory stores isolated Python, source, virtual environment, caches, a generated random secret and generated settings. System Python and PATH are unchanged. The six uv 0.13.0 platform archives and SearXNG revision `f4822b3fc46726bb259d14c6332b702c76b98f82` are checked against pinned SHA-256 hashes before extraction. Python 3.12.12 is managed and downloaded by uv. Python dependencies are installed through PyPI, with Waitress pinned to 3.0.2. Bootstrap and source versions are fixed per plugin release. Failed setup has no ready marker and can be retried; version directories remain reusable by earlier plugin releases.

The service binds only the DSH backend's `127.0.0.1`, using Waitress and a prebound socket. Search gets an endpoint only after checking the actual port and `/config` response. Public `ctx.subprocess` handles own processes. A profile file lock prevents duplicate owners. Unexpected exit triggers at most two automatic restarts. Configurable limits are `restartLimit` (0–10), `setupTimeoutMs` (default 600000) and `startupTimeoutMs` (default 120000). Failures remain visible for manual retry.

The service follows the enabled plugin and stays running between searches. Closing a browser tab does not stop the DSH backend or its service. Stop, switching to external mode, disabling the plugin or normal DSH backend shutdown awaits owned subprocess exit and releases the lock while retaining caches and preferences. DSH restart starts it again. No system startup service is registered. External mode never starts, stops or modifies the existing instance. Forced host termination relies on the DSH subprocess provider's cleanup, with stale-lock recovery; identical behavior for every OS termination mechanism is not guaranteed.

Cached launches avoid reinstalling the runtime; public web searches still require the selected upstream engines to be reachable over the network.

On Windows, setup applies a narrow compatibility patch after verifying the pinned source archive: the Valkey adapter treats Unix-only `pwd` account metadata as optional and uses an account-independent connection-error log. The patch validates the expected source before writing, and the ready marker includes its compatibility version. POSIX source behavior is unchanged. This is a plugin-maintained patch, not an upstream claim of Windows support.

## Platforms and validation

Bootstrap selection covers macOS/Windows/Linux glibc x64 and arm64. Unsupported systems report an error and can use an external instance. Local validation covers macOS arm64, unpatched DSH 0.2.1-alpha.2, clean downloads, real search, the full Web card, cached restart, stop and plugin teardown. On 2026-10-10, [GitHub Actions passed on Windows, macOS and Linux](https://github.com/Chaos-Paradox/dsh-web-search-searxng/actions/runs/38034853680), including unit tests, builds, clean service preparation, cached restart and cleanup. CI readiness tests do not depend on upstream engine results. A complete architecture/distribution matrix is not covered; Python and dependency availability on untested systems still needs validation. The declared DSH peer range is not a guarantee for every host version; only 0.2.1-alpha.2 was exercised.

After build, `pnpm run test:managed` uses shipped JS to prepare a real service in an empty temporary directory and checks sources, cached restart and cleanup, then deletes test data. `SEARXNG_SMOKE_SEARCH=0` limits the smoke to setup and lifecycle. See the repository's [validation notes](https://github.com/Chaos-Paradox/dsh-web-search-searxng/blob/main/docs/validation-managed-2026-10-10.md) for detailed results.

Upstreams: [uv Python management](https://docs.astral.sh/uv/guides/install-python/), [SearXNG source](https://github.com/searxng/searxng/tree/f4822b3fc46726bb259d14c6332b702c76b98f82), [Waitress](https://docs.pylonsproject.org/projects/waitress/en/latest/). Upstream licenses apply; downloaded SearXNG source retains its license file.
