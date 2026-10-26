# Host compatibility and release testing policy

English | [中文](host-compatibility.zh.md)

This policy applies to future plugin updates. Preserve supported host behavior and obtain reproducible evidence before expanding support. `AGENTS.md` and the pull request template reference this policy.

## Version roles

| Role | Current target | Change rule |
|---|---|---|
| Minimum supported | Unpatched DSH `0.2.1-alpha.2` | Keep regression coverage. Raising the minimum requires an explicit compatibility break and migration notes; do not silently raise it in a patch release. |
| Recommended | Also `0.2.1-alpha.2` | Promote a newer version only after real-host, packed-artifact and Web-card validation. |
| Newer-version feedback | DSH `0.2.1-rc.3`, reported working by the maintainer on 2026-10-26; not promoted to recommended | See the feedback and evidence scope below. A formal matrix expansion still requires the exact build and validation record. |
| Upstream development branch | Outside the support promise | Optional observation, pinned to the tested commit. Failures identify future changes, not permission to loosen peers or block a passing baseline release. |

Run one target when minimum and recommended are identical. Keep both after they diverge. Record failed candidates and decide whether to repair or defer support; do not describe known failures as compatible.

The fixed baseline is [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), tag [`dsh-v0.2.1-alpha.2`](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.2), commit `d743267388641bc76f17c45ce8b4c231aed1d32c`. Use standard base/Web bundles, without host patches or compatibility exemptions.

Current DSH peers declare `>=0.2.1-alpha.2 <0.3.0`, and development dependencies use the `0.2.1-alpha.2` train. This is an installation declaration, not proof that every version in the range was tested. Independently versioned packages such as `@deepseek-ai/cordis` follow their own release versions. Consult `package.json` and evidence for the actual build.

### DSH 0.2.1-rc.3 feedback (2026-10-26)

The maintainer confirmed that the current plugin works in DSH `0.2.1-rc.3`. The README lists that version based on this report. The conversation did not include the exact host build commit, OS/architecture, command logs or itemized coverage, so this is maintainer testing feedback, not a claim that this documentation update reran the full host composition and release acceptance checks.

The minimum, recommended host, peer declarations and existing release evidence retain their current status. Consider promoting `rc.3` after adding a reproducible validation record under this policy. This report does not establish coverage for other versions or every platform.

## Required checks

Code, dependency, build, bundle and installation changes must pass existing CI. Changes to Web interfaces, settings, client injection/RPC, credentials, subprocesses, cleanup, configuration precedence, routing or fallback also require real-host composition regression before merging. Every release requires the full release checks below, even without expanding the host range.

Documentation-only changes need consistent links, versions, commands and support statements, not repeated runtime downloads or upstream searches.

| Layer | Coverage | Execution and current tools |
|---|---|---|
| Plugin regression | Types, provider, cancellation/redirects, authentication, card/controller and build | Run `typecheck`, `test`, `build`. Existing CI covers Linux, macOS and Windows on Node 24. |
| Real-host composition | Bundles, actual configuration layers/settings/credentials, routing, enable/disable/removal and result limits | Run `test:host` for minimum/recommended hosts before merging interface changes and before every release. |
| Managed lifecycle | Empty-cache setup, HTTP readiness, cached restart, stop/disposal | Existing three-OS CI runs `test:managed` with `SEARXNG_SMOKE_SEARCH=0`. It uses development dependencies' public subprocess provider, so it does not replace full host validation. |
| Release package and Web card | Actual tarball installation, standard Web-profile boot, rendering, save/search/service actions | Validate clean profiles on minimum/recommended hosts for every release. Record the full Web flow on at least one OS and state other platform coverage. |
| Real upstream search | Actual self-hosted/external search sources | Complete at least one connected validation before release with `test:e2e` or default `test:managed`. Diagnose engine outages/rate limits separately from host compatibility. |

Node support starts at `22.19`, while current CI runs Node 24 only. Add a Linux + Node `22.19.0` type/unit/build job as a follow-up, retaining Node 24 for three-OS managed lifecycle checks. Do not claim that additional CI combination passed before it exists.

## Reproducible local commands

Prepare a clean, fixed and built host. First-time macOS/Linux shell example; Windows uses equivalent paths and environment syntax:

```sh
git clone --depth 1 --branch dsh-v0.2.1-alpha.2 https://github.com/deepseek-ai/deepseek-harness.git /tmp/dsh-host-0.2.1-alpha.2
git -C /tmp/dsh-host-0.2.1-alpha.2 rev-parse HEAD
git -C /tmp/dsh-host-0.2.1-alpha.2 status --short
pnpm --dir /tmp/dsh-host-0.2.1-alpha.2 install --frozen-lockfile
pnpm --dir /tmp/dsh-host-0.2.1-alpha.2 run build
```

Check the baseline commit and use the host's declared `packageManager`. Reuse a matching built checkout when available. In this plugin directory, use its pnpm requirements:

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm test
pnpm run build
DSH_SOURCE_ROOT=/tmp/dsh-host-0.2.1-alpha.2 pnpm run test:host
SEARXNG_SMOKE_SEARCH=0 pnpm run test:managed
mkdir -p /tmp/searxng-release-check
pnpm pack --pack-destination /tmp/searxng-release-check
```

Use a suitable deployment for real upstream search:

```sh
pnpm run test:managed
SEARXNG_BASE_URL=http://127.0.0.1:8080 pnpm run test:e2e
```

The external instance must already run with JSON enabled; the second command does not start it. Real searches require network access. A CI lifecycle pass with `SEARXNG_SMOKE_SEARCH=0` is not a real-search pass.

## Packed-artifact and Web acceptance

Install the actual generated tarball by absolute path in disposable standard Web profiles on each target host. Record the commands and tarball checksum. Do not reuse a development symlink or a user's real profile. Resolve plugin peers normally through the target host, without borrowing baseline dependencies from the development checkout.

1. Install, enable and boot: no missing interface/injection errors; SearXNG is the default route, while higher-priority user configuration remains effective.
2. Managed mode: ready card and automatic port; engine/language saves affect the next search; port changes restart; stopping/exiting closes the owned endpoint.
3. External mode: keyless search works; a protected local test endpoint rejects missing/wrong credentials and accepts the correct custom header. Secrets stay outside ordinary configuration/read responses. Endpoint/path/header changes do not reuse another target's credential; managed mode and official fallback do not receive instance credentials.
4. Disable, re-enable and remove: routes resolve from remaining layers, settings are retained as designed, and no owned service remains.
5. Failure/cancellation: actionable errors and no default paid request. Test optional fallback against the target's public capabilities; report missing capabilities instead of patching private host implementation.

## Adding a host version

1. Read upstream release notes for `ctx.web`, settings, credentials, subprocesses, client injection, RPC and bundle changes. Record an exact version/tag/commit.
2. Install the same plugin tarball into an isolated candidate host/profile. Do not alter the baseline or user configuration. Add separate type/build validation using candidate dependencies when needed; do not mix release trains to bypass peer failures.
3. Extend composition tests into a version matrix. `tests/host-composition.mjs` defaults to exact baseline `0.2.1-alpha.2`, accepts a pinned candidate runtime through environment variables, and asserts absence of `searchWithProvider` on audited targets. Check exact versions and capability expectations while preserving baseline cases. Deleting assertions, skipping failures or relabeling versions is not a repair.
4. Validate baseline and candidate composition, release installation, Web card and affected lifecycle behavior. New optional capabilities need both candidate success and old-host capability-absence coverage.
5. After passing, update version roles here, README/configuration notes and necessary peers, with a new validation record. Otherwise document unsupported or limited behavior.

## CI follow-up and current boundary

`.github/workflows/test.yml` currently automates plugin and managed-service checks, **not full `test:host` or tarball Web-profile acceptance**. The latter are maintainer merge/release checks until automated.

Recommended next step: an independent Linux + Node 24 real-host job with exact minimum/recommended versions and commits. Checkout/build each unpatched host, run composition against plugin artifacts, and retain a separate tarball installation step. Cache keys include OS, Node, exact host commit and lockfile. Web interaction may remain manual release acceptance until reliably automated.

Keep optional upstream-development observation separate from required jobs, with visible, documented failures. Required supported-host jobs must not use `continue-on-error`. This policy creates no schedule or automatic support expansion.

## Release evidence

Create `docs/validation-YYYY-MM-DD-<plugin-version>.md` for each release:

```text
Plugin version/commit; tarball path and SHA-256:
Exact host version/tag/commit; unpatched status:
OS/architecture, Node and pnpm:
Types/unit/build: commands, results, logs or CI links
Real composition: commands and results
Tarball installation/Web card: profile, steps, results
Managed lifecycle and real search: separate results
Official fallback capability and behavior:
Skipped, failed and uncovered checks with reasons:
```

Evidence belongs to a specific plugin build and host combination. Historical records do not automatically certify a new release. Untested architectures, distributions, older hosts or new candidates must remain explicitly unverified.
