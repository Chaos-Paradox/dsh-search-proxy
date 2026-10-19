# DSH process proxy risks

English | [中文](proxy-risk.zh.md) · Consent revision: `2026-10-19-v3`

This process-wide feature is off by default. Enabling it accepts the risks below; it does not certify your proxy. The plugin connects to a proxy you already operate. It does not install a proxy server, discover local settings or ports, or configure destination restrictions for you.

## Switch, risk statement and acknowledgement

Blank host and port fields are visible in the bottom red risk section. For Clash on the DSH machine, enter `127.0.0.1` and the HTTP / Mixed port from Clash settings. A normal Mixed listener uses HTTP here. Only HTTP/HTTPS endpoints without URL credentials are supported; SOCKS, PAC and disabling TLS verification are not supported.

Opening the switch requests activation; routing stays off. In the notice, click View risk statement to expand destination trust, process impact, privacy, removal and limitations inside the UI. Only then is the acknowledgement checkbox enabled. Tick it and click Acknowledge risks and enable proxy to install the policy. Reading and ticking are distinct actions, replacing the previous two-page checkbox flow. The embedded statement works without a remote document loading; this document provides fuller context and references.

The backend issues short-lived, rotating, single-use grants. The final acknowledgement must explicitly accept the current revision. Reading alone never activates routing. Cancel, closing the modal or Escape revokes consent and keeps the proxy off. Unsubmitted fields remain only in page memory and disappear on refresh. The first successful activation saves configuration, enabled preference and accepted revision in profile-bound DSH credential storage. Re-enabling the plugin or restarting DSH restores an enabled proxy without another prompt or endpoint entry. Turning it off and on can reuse the same valid configuration; a new configuration or changed statement requires fresh consent.

An installed policy does not prove proxy connectivity or private-network restrictions. This switch does not restart an existing SearXNG child; its proxy use must be checked separately. After updating, fully restart the DSH backend and refresh the page.

## Destination trust

Direct DSH web fetch validates DNS answers and pins connections to the validated addresses. With an explicit proxy, DNS and destination selection move to the proxy; the same local public-IP checks no longer run. Private IP literals remain blocked, but a hostname may resolve to a private target at the proxy. The proxy or egress gateway must validate and constrain the actual destination after resolution and before connection.

If untrusted content induces the model to fetch such a hostname and the proxy permits the internal destination, internal probing or disclosure may result. Impact depends on reachability, authentication and service controls. Running a proxy yourself does not prove it implements these restrictions; HTTPS does not prevent reaching an unintended destination.

This trust delegation is documented and discussed; neither a design note nor a discussion is a fixed-version advisory. [DSH design](https://github.com/deepseek-ai/deepseek-harness/blob/master/.agents/notes/implemented/architecture/2026-08-27-outbound-proxy-policy.md), [Discussion #9680](https://github.com/deepseek-ai/deepseek-harness/discussions/9680).

## Scope and privacy

The current DSH backend process is affected, including model calls, official search, web fetch, HTTP MCP and some child processes. Loopback remains direct under the host policy. Additional direct hosts are operator-selected; the panel rejects wildcard and CIDR entries and preserves existing NO_PROXY. Bypass rules are routing, not a substitute for destination controls.

Proxy outages, port changes and exit failures can break these requests. The proxy switch itself does not trigger direct or paid fallback; separate, default-off search and fetch switches control official API retries. Ordinary HTTPS tunnels retain certificate verification, but the proxy sees connection metadata; plaintext HTTP content is readable. Trusted interception certificates change the privacy boundary. Do not disable TLS checks or import unknown certificates to enable this feature.

Proxy passwords are not accepted. Hosts and ports remain deployment information: avoid sharing unsanitized recordings, environments or logs. Status responses omit endpoints; errors omit configuration and underlying exception strings.

## Removal and uninstall

The running policy belongs to the current plugin instance. No proxy daemon, system service, system proxy settings, .env, shell settings or ordinary profile configuration are written. Configuration, enabled preference and consent are saved in DSH credential storage under a profile-bound key. Unloading, uninstalling or exit restores the previous process policy and environment and destroys this lease's connection pool; in-flight requests may be interrupted. Re-enabling restores a remembered enabled proxy.

Turning the proxy off saves an off preference across restarts and retains configuration and consent for later reuse. Forget also deletes the saved configuration and consent. Uninstall retains this memory for reinstallation; use Forget before uninstall if it should be deleted. Failed restoration is shown so the user can check their proxy and retry. An existing host proxy always takes priority over automatic restoration.

An existing startup proxy takes priority and is never replaced or removed. If that original proxy remains after uninstall, it is the restored state.

Cleanup covers resources and environment changes owned by this plugin. Already-started children have independent environment copies and may require separate restart; the plugin will not kill unrelated tools, external MCP servers or user services. Its own managed SearXNG service still follows its normal shutdown lifecycle.

The public DSH 0.2.1-alpha.2 API has no transactional rollback for competing proxy installers. Concurrent process-proxy takeover by other plugins is unsupported; fully restart DSH if it occurs. Disabling only a provider row can leave its search route selected; disable the whole bundle and review any manual route overrides.

## Before enabling and before release

Use a trusted, stable endpoint with restrictions for final loopback, private, link-local and metadata destinations, including IPv6 and mappings, on every exit path. In a disposable profile verify public retrieval, models, required MCP, failure behavior and removal. Sensitive networks should enforce restricted egress first. Reading and acknowledgement are not a security test. [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

Published artifacts must exclude entered endpoints, ports, grants and logs. Audit the actual tarball for development paths, environment files, test fixtures and fixed loopback ports in executable artifacts. This feature does not raise the minimum host version; use the release's actual validation record.
