window.__ModuleLoader__.load({
	id: "dsh-search-proxy",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/proxy-locales.ts
		const proxyEn = {
			proxyTitle: "DSH process proxy (optional risk)",
			proxyBadge: "Optional · security risk",
			proxyPortGuide: "Saved settings are filled in below for viewing and editing. On first use, enter the host and HTTP / Mixed port from Clash, then turn on the switch. Do not use the SearXNG service port or a SOCKS-only port.",
			proxyHostHint: "For Clash on the DSH machine, enter 127.0.0.1. This is the proxy address, not the website being searched.",
			proxyPortHint: "Use the HTTP / Mixed port shown in Clash. A normal Mixed listener uses HTTP here; select HTTPS only if the proxy listener itself uses TLS.",
			proxyHint: "Off until first approved. Your proxy configuration and acknowledgement are remembered for this profile. An enabled proxy is restored when the plugin or DSH restarts.",
			proxyDocs: "Risk document (中文)",
			proxyDocsEn: "Risk document (English)",
			proxyOff: "Plugin proxy is off.",
			proxyActive: "Plugin proxy policy is installed. Connectivity has not been verified.",
			proxyInherited: "An existing host or plugin proxy takes priority. This panel will not replace or remove it.",
			proxyUnavailable: "The host proxy API is unavailable. Search remains available. After updating this plugin, fully restart the DSH backend and refresh the page.",
			proxySessionTitle: "Scope and removal",
			proxySession: "Configuration and acknowledgement are saved in DSH credential storage for this profile, never in .env. Disabling or unloading the plugin restores the previous process policy; re-enabling it restores your enabled proxy without another prompt. Turning this proxy switch off keeps it off across restarts and retains the configuration. Forget removes the saved configuration and acknowledgement. Removal may interrupt requests; existing child processes retain environment copies and are not restarted by this switch.",
			proxyToggle: "Enable DSH process proxy",
			proxyDialogTitle: "Review risks before enabling the proxy",
			proxyDialogHint: "The proxy is still off. Open the risk statement, then tick the acknowledgement to enable it.",
			proxyReadStatement: "View risk statement",
			proxyStatementTitle: "Proxy risk statement",
			proxyStatementRisk: "Destination trust: web fetch delegates DNS and destination selection to the proxy. A domain may reach private services unless the proxy restricts the final destination. Private IP literals remain blocked by DSH; HTTPS does not eliminate the domain-based risk.",
			proxyStatementScope: "Process scope: this may affect web fetch, model calls, official search, HTTP MCP and other consumers of the same DSH HTTP transport. Use a trusted proxy. Do not run competing plugins that replace the process proxy.",
			proxyStatementPrivacy: "Privacy: the proxy can observe destination metadata and read plaintext HTTP. TLS certificate verification stays enabled. Do not disable verification or import unknown certificates for this feature.",
			proxyStatementLimits: "This proxy switch does not validate connectivity or private-network restrictions, install a proxy server, or enable direct or paid fallback. Separate search/fetch switches control official retries. An existing startup proxy is not replaced. Concurrent third-party takeover is unsupported; fully restart DSH if cleanup fails.",
			proxyReadFirst: "Open “View risk statement” before ticking the acknowledgement.",
			proxyAck: "I have read the risk statement, understand the process-wide impact and private-network risk, and agree to remember this proxy and automatically restore it when the plugin or DSH restarts.",
			proxyApply: "Acknowledge risks and enable proxy",
			proxyRemove: "Turn off proxy and restore previous policy",
			proxyRemembered: "Saved proxy settings are filled in below and can be edited. Turning it on with unchanged settings reuses your acknowledgement; changed settings require confirmation.",
			proxyUpdate: "Update proxy configuration",
			proxyUpdateHint: "These edits have not been applied. Updating first turns off the current proxy, then asks you to confirm the changed settings. Cancelling keeps it off and retains the previous saved configuration.",
			proxyForget: "Turn off and forget proxy configuration",
			proxyCancel: "Cancel, keep proxy off",
			proxyClose: "Close risk notice",
			proxyHost: "Proxy host",
			proxyPort: "Clash HTTP / Mixed port",
			proxyProtocol: "Proxy protocol",
			proxyBypass: "Additional direct hosts (optional)",
			proxyBypassHint: "Comma-separated exact hosts or domain suffixes; no URLs, CIDR or wildcard. Loopback is always direct. Existing NO_PROXY entries are preserved.",
			proxyConfigRequired: "Enter a proxy host and a valid port before opening the switch. Copy the HTTP / Mixed port from your proxy app.",
			proxyError: "Proxy operation or automatic restoration failed. Check that the proxy and DSH credential storage are available, then retry. A new configuration or changed risk statement requires acknowledgement. If cleanup failed, fully restart DSH. Underlying errors are not displayed."
		};
		const proxyZh = {
			proxyTitle: "DSH 进程代理（可选风险项）",
			proxyBadge: "可选 · 安全风险",
			proxyPortGuide: "已保存的配置会自动回填，可在下方查看和修改。首次使用时填写 Clash 设置中的代理主机及 HTTP / Mixed 端口，再打开开关。不要填写 SearXNG 服务端口或仅支持 SOCKS 的端口。",
			proxyHostHint: "Clash 与 DSH 在同一台机器时填 127.0.0.1。这里是代理地址，不是待搜索的网站。",
			proxyPortHint: "使用 Clash 设置中显示的 HTTP / Mixed 端口。普通 Mixed 监听选择 HTTP；仅代理监听本身使用 TLS 时才选 HTTPS。",
			proxyHint: "首次确认前保持关闭。代理配置和风险确认按当前 profile 保存；已开启时，重新启用插件或重启 DSH 会自动恢复。",
			proxyDocs: "风险文档（中文）",
			proxyDocsEn: "风险文档（English）",
			proxyOff: "插件代理已关闭。",
			proxyActive: "插件代理策略已安装，尚未验证连通性。",
			proxyInherited: "已有宿主或插件代理优先，本面板不会替换或删除它。",
			proxyUnavailable: "宿主代理接口不可用，搜索仍可使用。若刚更新插件，请完整重启 DSH 后端并刷新页面。",
			proxySessionTitle: "影响范围与移除方式",
			proxySession: "配置和风险确认按 profile 保存在 DSH 凭据存储中，不写 .env。停用或卸载插件会恢复原进程策略；再次启用时自动恢复已开启的代理，无需重复提示。主动关闭本开关后，重启仍保持关闭，并保留配置供下次使用。「清除代理记忆」同时删除配置和确认。移除可能中断请求；已启动子进程保留其环境副本，本开关不会重启它们。",
			proxyToggle: "启用 DSH 进程代理",
			proxyDialogTitle: "开启代理前，请确认风险",
			proxyDialogHint: "代理尚未开启。请先点击查看风险声明，再勾选确认后启用。",
			proxyReadStatement: "查看风险声明",
			proxyStatementTitle: "代理风险声明",
			proxyStatementRisk: "目的地信任：网页抓取的 DNS 与目标选择会交给代理。若代理未限制最终目标，域名可能触达内网服务。DSH 仍拦截私网 IP 字面量，但 HTTPS 不能消除通过域名访问内网的风险。",
			proxyStatementScope: "进程影响：可能影响网页抓取、模型调用、官方搜索、HTTP MCP 及使用同一 DSH HTTP 通道的功能。请使用可信代理，不要同时运行其他接管进程代理的插件。",
			proxyStatementPrivacy: "隐私边界：代理可以观察目标信息，明文 HTTP 内容可被读取。TLS 证书校验保持开启；不要为此功能关闭校验或导入来源不明的证书。",
			proxyStatementLimits: "本代理开关不验证连通性或内网限制，不安装代理服务器，也不启用直连或付费备用；官方搜索／抓取重试由独立开关控制。已有启动代理不被替换。不支持第三方同时接管代理，清理异常时应完整重启 DSH。",
			proxyReadFirst: "请先点击「查看风险声明」，再勾选确认。",
			proxyAck: "我已阅读风险声明，理解进程级影响及内网访问风险，同意保存此代理，并在重新启用插件或重启 DSH 时自动恢复。",
			proxyApply: "确认风险并启用代理",
			proxyRemove: "关闭代理并恢复原策略",
			proxyRemembered: "已保存的代理配置已回填，可直接查看和修改。配置未改动时再次开启无需重复确认；修改后需重新确认。",
			proxyUpdate: "更新代理配置",
			proxyUpdateHint: "修改尚未生效。更新时会先关闭当前代理，再确认新配置；取消后保持关闭，并保留原来保存的配置。",
			proxyForget: "关闭并清除代理记忆",
			proxyCancel: "取消，不开启代理",
			proxyClose: "关闭风险提示",
			proxyHost: "代理主机",
			proxyPort: "Clash HTTP / Mixed 端口",
			proxyProtocol: "代理协议",
			proxyBypass: "额外直连主机（可选）",
			proxyBypassHint: "用逗号分隔主机或域名后缀，不接受 URL、CIDR 或通配符。回环始终直连；保留已有 NO_PROXY。",
			proxyConfigRequired: "请先填写代理主机和有效端口，再打开开关。端口从代理软件的 HTTP / Mixed 设置复制。",
			proxyError: "代理操作或自动恢复失败。请检查代理和 DSH 凭据存储后重试；新配置或风险声明变更时需要确认。若清理异常，请完整重启 DSH。错误提示不回显底层异常。"
		};
		//#endregion
		//#region src/client/locales.ts
		/** English copy. */
		const en = {
			...proxyEn,
			title: "DSH Search & Proxy",
			description: "Self-hosted SearXNG search and an optional DSH process proxy. Keep official search if you prefer.",
			connectionTitle: "Connection",
			preferencesTitle: "Search preferences",
			optionsTitle: "Advanced options",
			routingSearch: "Configured search route",
			routingFetch: "Configured fetch route",
			routingAutomatic: "Automatic selection",
			routingBypassed: "Search is routed to another provider. A ready SearXNG service or successful Test search does not mean the agent is using it. Check the Web search settings and your profile overrides.",
			routingOfficial: "The selected DeepSeek API route may incur per-request fees. The rc.2 API switch changes both routes; switching it off selects the built-in routes and does not restore a previous SearXNG selection.",
			routingTitle: "Agent Web routes and costs",
			routingPaid: "Official paid path selected or permitted",
			routingUnknown: "Cost status unconfirmed",
			routingLocal: "Known official paid paths are off",
			routingStale: "Route refresh failed. Previous route information is no longer current; cost status is unconfirmed.",
			routingUnconfirmed: "The host does not expose a confirmed explicit selection here. Automatic selection, missing data or an environment candidate cannot establish whether paid providers may run.",
			routingUnknownProvider: "Unconfirmed",
			routingDirectApi: "Direct official API: requests may incur per-request fees without a local failure. Plugin fallback switches do not control this route.",
			routingMessages: "Official Messages search: model tokens and official tool requests may incur fees. Plugin fallback switches do not control this route.",
			routingHttp: "Host local HTTP fetch. The plugin’s official Fetch API fallback does not participate.",
			routingFallbackOn: "Plugin primary route, then at most one paid official API retry on eligible failure. Saved fallback permission is ON.",
			routingLegacyOn: "Legacy official search fallback is ON; execution requires the host capability and may incur fees.",
			routingFallbackOff: "Plugin primary route. Saved official fallback permissions for this operation are OFF.",
			routingOther: "Another provider is selected. This plugin cannot determine its fees; its own fallback switches do not control it.",
			routingPermissionUnknown: "Plugin route is configured, but saved fallback permissions could not be verified. Cost status is unconfirmed.",
			routingSourceConfig: "Source: live host configuration",
			routingSourceEnv: "Source: environment candidate; the host’s captured value is not exposed",
			routingSourceAuto: "Source: host automatic selection; selected provider is not exposed",
			routingSourceUnknown: "Source: unavailable or not yet verified",
			routingSavedPermissions: "Saved plugin API fallback permissions",
			routingOn: "ON",
			routingOff: "OFF",
			routingRestoreHint: "To use plugin fallback, explicitly select searxng / searxng-http. Turning the rc.2 built-in API switch off selects deepseek-official / http and does not restore these routes.",
			routingTestOnly: "Test search below checks the SearXNG instance only; it does not verify the agent’s selected route or billing.",
			routingScope: "Snapshot for this profile’s host Web service, not a billing receipt or spending block. Model tokens, instance fees and separate tools are outside this display.",
			routingRefresh: "Refresh routes",
			routingCheckedAt: "Last checked",
			routeRestoreButton: "Restore plugin routes",
			routeRestoreConfirmTitle: "Confirm both route changes",
			routeRestoreConfirm: "Restore search and fetch",
			routeRestoreCancel: "Cancel",
			routeRestorePending: "Restoring…",
			routeRestoreKeepPermissions: "Only the two route selections will change. Saved official fallback permissions stay as they are; an enabled fallback may still incur fees after failure. This action makes no test or API request.",
			routeRestoreSuccess: "Both routes were saved and verified. Use the latest route display above for current status.",
			routeRestoreChanged: "Routes or saved fallback permissions changed. Refresh, then review and confirm again.",
			routeRestoreBlocked: "A higher-priority home patch or launch overlay blocks restoration. Have the configuration owner remove the web.searchProvider / web.fetchProvider override there, or set searxng / searxng-http, then restart DSH and recheck.",
			routeRestoreReadOnly: "This configuration is read-only. Ask its owner to restore the routes using the manual steps below.",
			routeRestoreUnavailable: "The host does not expose an available configuration editor here. Use the manual steps below.",
			routeRestoreFailed: "Restoration could not be confirmed. Refresh to inspect the current routes; use the manual steps if needed. Success has not been assumed.",
			routeRestoreDraft: "Save or discard other pending form edits before restoring routes.",
			routeRestoreManual: "Manual restoration steps",
			routeRestoreManualSteps: "In this profile’s cordis.patch.yml, update the two fields in its existing web entry as shown below. Preserve other fields and entries. Save, restart the DSH backend and refresh this panel. Saving the built-in Web API switch again can replace these selections.",
			logReadyHint: "DSH_SEARXNG_READY reports the local SearXNG port. Readiness also requires a valid /config response; use Test search to check results.",
			logGitHint: "Git metadata: the pinned source archive has no .git directory. Version and branch lookup errors do not prevent search.",
			logTorHint: "ahmia / torch: these onion engines require Tor and are unavailable in the default managed configuration. Other engines can still run.",
			logLimiterHint: "limiter.toml: no local override file exists, so upstream defaults apply. Managed local service has rate limiting disabled.",
			logForwardedHint: "Forwarded headers: direct local requests have no reverse-proxy client IP headers. This warning alone does not indicate a failed search.",
			logHelp: "Startup log reference",
			modeLabel: "Service mode",
			modeAuto: "Automatic",
			modeLocal: "Managed local service",
			modeExternal: "Existing instance",
			modeHint: "Save to apply. Automatic keeps an existing address; otherwise it selects local management.",
			advanced: "Advanced settings",
			managedPort: "Local port",
			managedPortHint: "0 automatically selects an available port. A specific occupied port reports an error. Saving a change restarts the local service.",
			serviceTitle: "Search service",
			serviceIdle: "Waiting",
			servicePreparing: "Preparing first-use runtime",
			serviceStarting: "Starting",
			serviceReady: "Ready",
			serviceStopped: "Stopped",
			serviceFailed: "Failed",
			serviceExternal: "Using existing instance",
			activeEndpoint: "Active endpoint",
			serviceHint: "Local service follows DSH. Existing instances are managed by their operator.",
			serviceRestart: "Start / retry / restart",
			serviceStop: "Stop",
			serviceTest: "Test search",
			serviceTestResult: "SearXNG instance test succeeded; sources returned",
			serviceLogs: "Activity log",
			setupUv: "Downloading setup tool",
			setupSource: "Downloading SearXNG",
			setupPython: "Preparing Python",
			setupDependencies: "Installing dependencies",
			serviceNeedsSetup: "Awaiting first-use approval",
			servicePrepare: "Prepare and start",
			setupSummary: "First use downloads uv, standalone Python, SearXNG and its dependencies.",
			setupScope: "Downloaded programs run as your current user. Files stay in this profile; system Python and PATH are unchanged. A reusable cache starts automatically next time.",
			setupNetworkAdvice: "If GitHub or PyPI access is unreliable on your network, turn on the DSH process proxy below before preparing, or select Existing instance mode instead.",
			setupNetworkFailure: "The download failed — this usually means GitHub or PyPI is unreachable from the DSH backend. Turn on the DSH process proxy below and retry, or switch to Existing instance mode.",
			precheckButton: "Check download network",
			precheckRunning: "Checking…",
			precheckHint: "Probes the four download endpoints from the DSH backend with the current proxy state. Any HTTP answer below 500 counts as reachable; failures usually mean a blocked or unstable connection.",
			precheckOk: "reachable",
			precheckFailed: "unreachable",
			setupDirectory: "Runtime directory",
			setupComponents: "Downloads and verification",
			verifyHash: "Pinned SHA-256",
			verifyTool: "Managed by uv",
			verifyPackages: "Installed from package index; no plugin-wide hash lock",
			runtimeDetails: "Runtime and cleanup",
			runtimeCleanup: "Clean runtime",
			cleanupHint: "Stop ends the process and keeps downloaded files. Cleaning removes this plugin’s Python, source and cache; preferences and credentials remain. Uninstalling the plugin retains this runtime directory.",
			cleanupConfirm: "Delete local runtime and cache",
			cleanupCancel: "Cancel",
			activityEmpty: "No activity yet.",
			activitySession: "This DSH run · paths and credentials redacted",
			activityRetention: "Recent records survive restarts. Two files, up to 128 KiB each (256 KiB total), rotate automatically. This view shows the latest 100 summaries; process output below is from the current run.",
			logStorageUsage: "Saved log size",
			logStorageFailed: "Log storage is unavailable. Recent in-memory records remain viewable; search is unaffected.",
			clearSavedLogs: "Clear retained records",
			activityDownload: "Download",
			activityVerify: "Checksum verified",
			activityExtract: "Extract",
			activityCommand: "Execute",
			activityCache: "Reuse cache",
			activityConfigure: "Configure",
			activityReady: "Service ready",
			activityStop: "Process stopped",
			activityCleanup: "Runtime cleaned",
			activityTest: "Test query",
			activityError: "Failed",
			copyLog: "Copy activity log",
			copiedLog: "Copied",
			copyFailed: "Could not copy; select the log text instead.",
			diagnosticOutput: "Process output",
			testReportTitle: "Last search test",
			testRunning: "Testing…",
			testCancel: "Cancel test",
			testHistorical: "Historical report: the service has stopped, restarted or changed endpoint. Test again to check its current state.",
			stopStart: "Starting the service",
			stopService: "Service stop requested",
			stopConfiguration: "Applying changed service settings",
			stopPrepare: "Preparation requested from settings",
			stopRestart: "Restart requested from settings",
			stopOperator: "Stop requested from settings",
			stopExternal: "Switched to an external instance",
			stopCleanup: "Runtime cleanup requested",
			stopPlugin: "Plugin lifecycle ended",
			stopDependency: "DSH subprocess service was removed or replaced",
			stopStartupFailure: "Cleaning up after startup failure",
			stopRecovery: "Cleaning up after an unexpected exit before automatic recovery",
			stopRecoveryFailure: "Cleaning up after automatic recovery failed",
			testHint: "Sends one “SearXNG” query using saved engines, language and optional authentication. This contacts upstream engines; it does not test every engine or use official fallback.",
			testEmpty: "Request completed, but no usable sources returned.",
			testFailed: "Search test failed",
			testElapsed: "Elapsed",
			testRequest: "Query and endpoint",
			testHttp: "HTTP response",
			testFormat: "Response format",
			testAuth: "Request uses instance authentication",
			testFallback: "Official fallback used",
			testYes: "Yes",
			testNo: "No",
			testUnavailable: "No response",
			testSourceCount: "Usable sources",
			testConfiguration: "Check the saved endpoint and local service state.",
			testAuthentication: "Check the saved authentication header, permissions and JSON access.",
			testConnection: "Could not connect. Check that the instance is running and the address/port, network and certificate are correct.",
			testHttpFailure: "The instance returned an HTTP error.",
			testResponse: "The response could not be read as search JSON.",
			testCancelled: "Test cancelled.",
			serviceBehavior: "Routing and official fallback details",
			baseUrl: "Instance endpoint",
			baseUrlHint: "Existing-instance mode uses this address, or SEARXNG_BASE_URL when blank. Automatic mode prepares a local service when neither is set.",
			authTitle: "Instance authentication (optional)",
			authEnabled: "Send an authentication header to this instance",
			authDefaultHint: "No API key is needed by default. The managed local service uses no instance authentication.",
			authHint: "Enable only when your existing instance or its gateway requires a credential. This authenticates access to the instance; upstream engine API keys are configured in SearXNG. The plugin does not create a gateway or manage quotas.",
			authHeaderName: "Authentication header name",
			authHeaderNameHint: "Use the name supplied by the instance operator, for example X-API-Key or Authorization. Blank uses X-API-Key.",
			authHeaderInvalid: "Enter a valid authentication header name, such as X-API-Key or Authorization. Request routing and JSON headers cannot be replaced.",
			authHeaderValue: "Authentication header value",
			authHeaderValueHint: "Enter the complete value, for example your token or Bearer followed by a space and your token. Saved values are never displayed; leave blank to keep the saved value. Credentials are bound to this endpoint and header name. Use HTTPS for remote services.",
			authConfigured: "Saved for this instance",
			authNotConfigured: "No saved value",
			authUnavailable: "Enter a valid instance endpoint and header name first. If they are set, the DSH credential service may be unavailable or read-only.",
			authClear: "Remove saved credential",
			authClearFailed: "Could not remove the saved credential. Please try again.",
			engines: "Engines",
			enginesHint: "Choose multiple engines. These are common candidates, not a live list from your instance; names must exist and be enabled in your SearXNG configuration.",
			enginesDefault: "No restriction: use the instance’s default engines.",
			enginesSelected: "Search only the selected engines.",
			enginesWeb: "Web · websites and general information",
			enginesNews: "News · reporting and current events",
			enginesScience: "Research · papers and preprints",
			enginesKnowledge: "Technology and reference · repositories, Q&A and encyclopedias",
			enginesCustom: "Other engines (custom names)",
			enginesCustomNames: "Custom engine names",
			enginesCustomHint: "Use the exact names from your instance, separated by commas. List selections are preserved.",
			enginesCustomSelected: "Also selected",
			language: "Result language",
			languageHint: "Choose a preferred result language; instance default inherits your deployment configuration. Other languages can use a custom code.",
			languageDefault: "Instance default",
			languageAll: "All languages",
			languageZhCN: "Simplified Chinese (zh-CN)",
			languageZhTW: "Traditional Chinese (zh-TW)",
			languageEn: "English (en)",
			languageJa: "Japanese (ja)",
			languageKo: "Korean (ko)",
			languageFr: "French (fr)",
			languageDe: "German (de)",
			languageEs: "Spanish (es)",
			languageRu: "Russian (ru)",
			languageCustom: "Other language (custom code)",
			languageCustomCode: "Custom language code",
			overridden: "Overridden",
			reset: "Reset to default",
			readOnly: "This deployment stores settings read-only.",
			unavailable: "This plugin is not loaded, so it cannot be configured right now.",
			save: "Save",
			saving: "Saving…",
			saveFailed: "The deployment did not accept these values; they were left for you to correct.",
			invalidValue: "Enter text, or leave blank to use the default.",
			fallbackLabel: "Allow one paid official Search API retry after a SearXNG failure",
			fallbackHint: "Default off, including upgrades from the legacy fallback option. Save to allow one direct DeepSeek Search API request after a failed SearXNG search. Uses the shared DeepSeek key/account and, on rc.2, its Web API settings. Does not require the built-in API switch or an auxiliary model request. Cancellation never starts fallback; results disclose the paid retry.",
			fetchFallbackLabel: "Allow one paid official Fetch API retry after a local fetch failure",
			fetchFallbackHint: "Default off. Applies when the fetch route is searxng-http. Eligible transport errors, HTTP 403/408/429/5xx and recognized verification pages may trigger one official attempt. Cancellation and local URL, network-safety, redirect or size refusals do not. Official fetch may also fail or return verification pages; it is not a guarantee against anti-bot protection.",
			routeHint: "This bundle selects SearXNG unless a later bundle, profile, home or CLI config overrides it. Disable the entire dsh-search-proxy bundle to restore the remaining route. Disabling only its provider row leaves the SearXNG route selected and searches fail. Saved instance settings are retained.",
			resetAll: "Reset all to defaults",
			currentVersion: "Installed version",
			checkUpdate: "Check for updates",
			checkingUpdate: "Checking…",
			updateAvailable: "New version available:",
			updateReleases: "Release notes",
			updateHowTo: "To update: run dsh plugin --profile <name> update dsh-search-proxy (or uninstall and reinstall from the Plugins page), then restart.",
			updateLatest: "You are on the latest version.",
			updateFailed: "Could not reach the GitHub releases page right now; please try again later."
		};
		/** Simplified Chinese copy. */
		const zh = {
			...proxyZh,
			title: "DSH 搜索与代理",
			description: "自托管 SearXNG 搜索与可选 DSH 进程代理；也可保留官方搜索。",
			connectionTitle: "连接设置",
			preferencesTitle: "搜索偏好",
			optionsTitle: "高级选项",
			routingSearch: "当前配置的搜索路由",
			routingFetch: "当前配置的抓取路由",
			routingAutomatic: "自动选择",
			routingBypassed: "搜索当前指向其他提供方。SearXNG 服务可用或「测试搜索」成功，不代表智能体正在使用它。请检查「网页搜索」设置和 profile 的路由覆盖。",
			routingOfficial: "当前选中的 DeepSeek API 路由可能按请求收费。rc.2 的新版 API 开关会同时修改这两条路由；关闭时选择内置路由，不会恢复先前的 SearXNG 选择。",
			routingTitle: "智能体 Web 路由与费用",
			routingPaid: "存在官方付费路径",
			routingUnknown: "费用状态未确认",
			routingLocal: "未启用已知官方付费路径",
			routingStale: "路由刷新失败，之前的路由信息已失效；当前费用状态未确认。",
			routingUnconfirmed: "宿主未在此提供可确认的显式选择。自动选择、数据缺失或环境变量候选均不能证明是否会使用付费提供方。",
			routingUnknownProvider: "未确认",
			routingDirectApi: "直接走官方 API：无需本地失败，调用就可能按次收费。插件的备用开关不控制此路由。",
			routingMessages: "官方 Messages 搜索：可能产生模型 token 和官方工具调用费用。插件的备用开关不控制此路由。",
			routingHttp: "宿主本地 HTTP 抓取；插件的官方 Fetch API 备用不参与调用。",
			routingFallbackOn: "优先使用插件主路径，指定失败后允许一次付费官方 API 重试。已保存的备用许可为开启。",
			routingLegacyOn: "旧版官方搜索备用已开启；能否执行取决于宿主能力，执行时可能产生费用。",
			routingFallbackOff: "使用插件主路径；此操作已保存的官方备用许可均为关闭。",
			routingOther: "当前选择其他提供方，费用无法由本插件确定；插件备用开关不控制它。",
			routingPermissionUnknown: "已配置插件路由，但无法核对已保存的备用许可；费用状态未确认。",
			routingSourceConfig: "来源：宿主实时配置",
			routingSourceEnv: "来源：环境变量候选，宿主保存的值未公开",
			routingSourceAuto: "来源：宿主自动选择，选中的提供方未公开",
			routingSourceUnknown: "来源：不可读取或尚未核对",
			routingSavedPermissions: "已保存的插件 API 备用许可",
			routingOn: "开启",
			routingOff: "关闭",
			routingRestoreHint: "使用插件备用需显式选择 searxng / searxng-http。关闭 rc.2 内置 API 开关会选择 deepseek-official / http，不会恢复这两条插件路由。",
			routingTestOnly: "下方「测试搜索」只验证 SearXNG 实例，不能证明智能体正在使用它，也不验证账单。",
			routingScope: "这是当前 profile 的宿主 Web 配置快照，不是账单或扣费拦截。模型 token、自有实例及独立工具费用不在此显示范围内。",
			routingRefresh: "刷新路由状态",
			routingCheckedAt: "最近核对",
			routeRestoreButton: "恢复插件路由",
			routeRestoreConfirmTitle: "确认修改以下两条路由",
			routeRestoreConfirm: "确认恢复搜索与抓取",
			routeRestoreCancel: "取消",
			routeRestorePending: "正在恢复…",
			routeRestoreKeepPermissions: "仅修改两条路由选择，现有官方备用许可保持原样；已经开启的备用在失败后仍可能产生费用。本操作不发起测试或 API 请求。",
			routeRestoreSuccess: "两条路由已保存并核对。当前状态以上方最新路由显示为准。",
			routeRestoreChanged: "路由或已保存的备用许可已变化，请刷新后重新查看并确认。",
			routeRestoreBlocked: "更高优先级的 home 配置或启动覆盖阻止了恢复。请配置维护者在对应位置清除 web.searchProvider / web.fetchProvider 覆盖，或改为 searxng / searxng-http，再重启 DSH 并核对。",
			routeRestoreReadOnly: "当前配置只读，请配置维护者按下方手动步骤恢复路由。",
			routeRestoreUnavailable: "宿主在此未提供可用的配置编辑能力，请使用下方手动恢复步骤。",
			routeRestoreFailed: "未能确认恢复成功。请刷新核对当前路由，必要时使用手动步骤；此处不会假定已经恢复。",
			routeRestoreDraft: "请先保存或放弃表单中其他尚未保存的修改，再恢复路由。",
			routeRestoreManual: "手动恢复步骤",
			routeRestoreManualSteps: "在当前 profile 的 cordis.patch.yml 中，修改已有 web 条目的下列两个字段，保留其他字段与条目。保存后重启 DSH 后端，再刷新本面板核对。以后再次保存内置 Web API 开关，仍可能覆盖这两条选择。",
			logReadyHint: "DSH_SEARXNG_READY 是本地 SearXNG 端口通知。插件还需确认 /config 响应才标为可用；实际结果请用「测试搜索」验证。",
			logGitHint: "Git 元数据：固定源码压缩包不含 .git，读取版本与分支时会报错，不妨碍搜索运行。",
			logTorHint: "ahmia / torch：这两个洋葱网络引擎需要 Tor，默认托管配置中不可用；其他引擎仍可运行。",
			logLimiterHint: "limiter.toml：缺少本地覆盖文件时使用上游默认值；本地托管服务已关闭限流。",
			logForwardedHint: "转发请求头：本地直连没有反向代理提供的客户端 IP 头。单凭此提示不能认定搜索失败。",
			logHelp: "启动日志说明",
			modeLabel: "服务模式",
			modeAuto: "自动选择",
			modeLocal: "本地自动托管",
			modeExternal: "连接已有实例",
			modeHint: "保存后生效。自动选择沿用已有地址；没有地址时选择本地托管。",
			advanced: "高级设置",
			managedPort: "本地端口",
			managedPortHint: "0 表示自动选择空闲端口。指定的端口被占用时会报错；保存端口修改会自动重启本地服务。",
			serviceTitle: "搜索服务",
			serviceIdle: "等待中",
			servicePreparing: "首次准备运行环境",
			serviceStarting: "正在启动",
			serviceReady: "可用",
			serviceStopped: "已停止",
			serviceFailed: "失败",
			serviceExternal: "使用已有实例",
			activeEndpoint: "当前地址",
			serviceHint: "本地服务随 DSH 运行；已有实例由部署者独立管理。",
			serviceRestart: "启动 / 重试 / 重启",
			serviceStop: "停止",
			serviceTest: "测试搜索",
			serviceTestResult: "SearXNG 实例测试成功，返回来源数",
			serviceLogs: "运行记录",
			setupUv: "正在下载安装工具",
			setupSource: "正在下载 SearXNG",
			setupPython: "正在准备 Python",
			setupDependencies: "正在安装依赖",
			serviceNeedsSetup: "等待首次准备确认",
			servicePrepare: "准备并启动",
			setupSummary: "首次使用将下载 uv、独立 Python、SearXNG 和所需依赖。",
			setupScope: "下载的程序以当前用户权限运行，文件保存在此 profile，不修改系统 Python 或 PATH。已有可用缓存时，下次自动启动。",
			setupNetworkAdvice: "如果你的网络访问 GitHub / PyPI 不稳定，建议先在下方开启「DSH 进程代理」再准备，或改用「连接已有实例」模式。",
			setupNetworkFailure: "下载失败，通常是 DSH 后端无法访问 GitHub / PyPI。可在下方开启「DSH 进程代理」后点击「启动 / 重试 / 重启」重试，或改用「连接已有实例」模式。",
			precheckButton: "检查下载网络",
			precheckRunning: "正在检查…",
			precheckHint: "按当前代理状态从 DSH 后端探测四个下载来源；收到 500 以下的任意 HTTP 应答即为可通，失败通常意味着连接被阻断或不稳定。",
			precheckOk: "可通",
			precheckFailed: "不可通",
			setupDirectory: "运行环境目录",
			setupComponents: "下载内容与校验方式",
			verifyHash: "固定 SHA-256 校验",
			verifyTool: "由 uv 管理下载",
			verifyPackages: "从包索引安装；插件未统一锁定全部依赖哈希",
			runtimeDetails: "运行环境与清理",
			runtimeCleanup: "清理运行环境",
			cleanupHint: "停止只结束进程，保留下载文件。清理删除本插件的 Python、源码与缓存，保留设置和凭据。卸载插件会保留此运行环境目录。",
			cleanupConfirm: "删除本地运行环境与缓存",
			cleanupCancel: "取消",
			activityEmpty: "尚无运行记录。",
			activitySession: "本次 DSH 运行 · 已隐藏本机路径和凭据",
			activityRetention: "最近记录跨重启保留。两份文件各最多 128 KiB，合计最多 256 KiB，超出自动轮转；此处展示最近 100 条摘要，下方进程输出属于当前运行。",
			logStorageUsage: "已保存日志大小",
			logStorageFailed: "日志存储暂不可用，仍可查看最近的内存记录，不影响搜索。",
			clearSavedLogs: "清除保留记录",
			activityDownload: "下载",
			activityVerify: "校验通过",
			activityExtract: "解压",
			activityCommand: "执行",
			activityCache: "复用缓存",
			activityConfigure: "配置",
			activityReady: "服务可用",
			activityStop: "进程已停止",
			activityCleanup: "运行环境已清理",
			activityTest: "测试查询",
			activityError: "失败",
			copyLog: "复制运行记录",
			copiedLog: "已复制",
			copyFailed: "未能复制，请选择日志文本复制。",
			diagnosticOutput: "进程输出",
			testReportTitle: "最近测试报告",
			testRunning: "测试中…",
			testCancel: "取消测试",
			testHistorical: "历史报告：服务已停止、重启或切换地址。请重新测试以确认当前状态。",
			stopStart: "启动服务前清理",
			stopService: "收到服务停止请求",
			stopConfiguration: "应用已变更的服务设置",
			stopPrepare: "设置页发起准备请求",
			stopRestart: "设置页发起重启请求",
			stopOperator: "设置页发起停止请求",
			stopExternal: "切换至外部实例",
			stopCleanup: "清理运行环境",
			stopPlugin: "插件生命周期结束",
			stopDependency: "DSH 子进程服务被移除或替换",
			stopStartupFailure: "启动失败后清理",
			stopRecovery: "异常退出后清理，准备自动恢复",
			stopRecoveryFailure: "自动恢复失败后清理",
			testHint: "按已保存的引擎、语言与可选鉴权查询一次“SearXNG”，会访问上游搜索引擎；不逐个测试全部引擎，不调用官方备用。",
			testEmpty: "请求已完成，但没有返回可用来源。",
			testFailed: "测试搜索失败",
			testElapsed: "耗时",
			testRequest: "查询与地址",
			testHttp: "HTTP 响应",
			testFormat: "响应格式",
			testAuth: "请求使用实例鉴权",
			testFallback: "已调用官方备用",
			testYes: "是",
			testNo: "否",
			testUnavailable: "未收到响应",
			testSourceCount: "可用来源数",
			testConfiguration: "请检查已保存的实例地址与本地服务状态。",
			testAuthentication: "请检查已保存的鉴权请求头、访问权限与 JSON 接口。",
			testConnection: "无法连接。请检查实例是否运行，以及地址、端口、网络和证书。",
			testHttpFailure: "实例返回了 HTTP 错误。",
			testResponse: "响应无法作为搜索 JSON 读取。",
			testCancelled: "测试已取消。",
			serviceBehavior: "路由与官方备用说明",
			baseUrl: "实例地址",
			baseUrlHint: "已有实例模式使用此地址，留空则使用 SEARXNG_BASE_URL；自动选择模式下，两者都未设置时自动准备本地服务。",
			authTitle: "实例鉴权（可选）",
			authEnabled: "向此实例发送鉴权请求头",
			authDefaultHint: "默认无需 API Key，本地自动托管服务不使用实例鉴权。",
			authHint: "仅当已有实例或其网关要求访问凭证时开启。此凭证用于访问实例；上游搜索引擎的 API Key 仍在 SearXNG 中配置。插件不会建立网关或管理调用额度。",
			authHeaderName: "鉴权请求头名称",
			authHeaderNameHint: "按实例提供方的要求填写，例如 X-API-Key 或 Authorization；留空使用 X-API-Key。",
			authHeaderInvalid: "请填有效的鉴权请求头名称，例如 X-API-Key 或 Authorization；不能覆盖请求路由及 JSON 格式请求头。",
			authHeaderValue: "鉴权请求头值",
			authHeaderValueHint: "填写完整值，例如令牌，或 Bearer 加空格再加令牌。保存的值不会回显，留空保留已有值。凭据绑定此实例地址和请求头名称，远端服务应使用 HTTPS。",
			authConfigured: "已为此实例保存",
			authNotConfigured: "未保存凭据",
			authUnavailable: "请先填写有效的实例地址和请求头名称；若已填写，可能是 DSH 凭据服务不可用或只读。",
			authClear: "移除已保存凭据",
			authClearFailed: "未能移除已保存凭据，请重试。",
			engines: "引擎",
			enginesHint: "可多选。这里是常用候选，并非实例的实时清单；引擎名须在你的 SearXNG 配置中存在且已启用。",
			enginesDefault: "未限制引擎：使用实例默认配置。",
			enginesSelected: "仅搜索勾选的引擎。",
			enginesWeb: "通用网页 · 网站与综合资料",
			enginesNews: "新闻资讯 · 报道与近期事件",
			enginesScience: "学术研究 · 论文与预印本",
			enginesKnowledge: "技术与百科 · 代码仓库、问答与百科资料",
			enginesCustom: "其他引擎（自定义名称）",
			enginesCustomNames: "自定义引擎名称",
			enginesCustomHint: "填写实例中的准确名称，多个名称用逗号分隔；列表中勾选的引擎会保留。",
			enginesCustomSelected: "另外已选择",
			language: "结果语言",
			languageHint: "选择偏好的结果语言；「实例默认」沿用部署配置，其他语言可填写自定义代码。",
			languageDefault: "实例默认",
			languageAll: "不限语言",
			languageZhCN: "简体中文（zh-CN）",
			languageZhTW: "繁体中文（zh-TW）",
			languageEn: "英语（en）",
			languageJa: "日语（ja）",
			languageKo: "韩语（ko）",
			languageFr: "法语（fr）",
			languageDe: "德语（de）",
			languageEs: "西班牙语（es）",
			languageRu: "俄语（ru）",
			languageCustom: "其他语言（自定义代码）",
			languageCustomCode: "自定义语言代码",
			overridden: "已覆盖",
			reset: "恢复默认",
			readOnly: "本部署的设置为只读。",
			unavailable: "该插件当前未加载，暂时无法配置。",
			save: "保存",
			saving: "保存中…",
			saveFailed: "本部署没有接受这些值，已保留供你修改。",
			invalidValue: "请填文本；留空表示使用默认值。",
			fallbackLabel: "允许 SearXNG 失败后付费调用官方 Search API 重试一次",
			fallbackHint: "默认关闭，旧版备用勾选不会自动开启此新选项。保存后，SearXNG 搜索失败才允许直接请求一次 DeepSeek Search API。复用宿主的 DeepSeek 密钥／账号，rc.2 同时沿用其 Web API 设置。无需打开宿主的新版 API 总开关，也不发起额外模型请求。取消不触发备用，结果会披露本次付费重试。",
			fetchFallbackLabel: "允许本地抓取失败后付费调用官方 Fetch API 重试一次",
			fetchFallbackHint: "默认关闭，在抓取路由为 searxng-http 时生效。传输错误、HTTP 403/408/429/5xx 和识别出的验证页可触发一次官方尝试；取消、URL／网络安全／重定向／大小限制拒绝不会触发。官方也可能失败或返回验证页，不保证解决反爬。",
			routeHint: "此 bundle 默认选择 SearXNG，后续 bundle、profile、home 或 CLI 配置可覆盖路由。请禁用整个 dsh-search-proxy bundle 来恢复其余配置决定的路由；仅禁用提供方行会留下 SearXNG 路由并导致搜索失败。已保存的实例设置会保留。",
			resetAll: "全部恢复默认",
			currentVersion: "当前版本",
			checkUpdate: "检查更新",
			checkingUpdate: "正在检查…",
			updateAvailable: "发现新版本：",
			updateReleases: "发布说明",
			updateHowTo: "更新方式：运行 dsh plugin --profile <名称> update dsh-search-proxy（或在插件页卸载后重装），然后重启。",
			updateLatest: "已是最新版本。",
			updateFailed: "暂时无法访问 GitHub 发布页，请稍后再试。"
		};
		/**
		* The form frame's copy, read from this page's dictionary.
		* @param t - the page's locale reader.
		* @returns the labels the shared settings form renders.
		*/
		function formLabels(t) {
			return {
				unavailable: t("unavailable"),
				readOnly: t("readOnly"),
				saveFailed: t("saveFailed"),
				save: t("save"),
				saving: t("saving")
			};
		}
		//#endregion
		//#region src/client/SearchChoiceFields.tsx
		/** List controls over the existing staged engine and language string fields. */
		/** Common names from https://docs.searxng.org/user/configured_engines.html; instance configuration determines availability. */
		const ENGINE_GROUPS = [
			{
				label: "enginesWeb",
				engines: [
					["google", "Google"],
					["google cse", "Google CSE"],
					["bing", "Bing"],
					["duckduckgo", "DuckDuckGo"],
					["brave", "Brave"],
					["yahoo", "Yahoo"]
				]
			},
			{
				label: "enginesNews",
				engines: [["google news", "Google News"], ["bing news", "Bing News"]]
			},
			{
				label: "enginesScience",
				engines: [
					["google scholar", "Google Scholar"],
					["arxiv", "arXiv"],
					["semantic scholar", "Semantic Scholar"]
				]
			},
			{
				label: "enginesKnowledge",
				engines: [
					["github", "GitHub"],
					["stackoverflow", "Stack Overflow"],
					["wikipedia", "Wikipedia"]
				]
			}
		];
		const ENGINE_NAMES = new Set(ENGINE_GROUPS.flatMap((group) => group.engines.map(([name]) => name)));
		const LANGUAGES = [
			["", "languageDefault"],
			["all", "languageAll"],
			["zh-CN", "languageZhCN"],
			["zh-TW", "languageZhTW"],
			["en", "languageEn"],
			["ja", "languageJa"],
			["ko", "languageKo"],
			["fr", "languageFr"],
			["de", "languageDe"],
			["es", "languageEs"],
			["ru", "languageRu"]
		];
		const LANGUAGE_CODES = new Set(LANGUAGES.map(([code]) => code));
		const CUSTOM_LANGUAGE = "__custom_language__";
		/** Preserve custom engine names, including names containing spaces, when editing a selection. */
		function engineNames(text) {
			return [...new Set(text.split(",").map((name) => name.trim()).filter(Boolean))];
		}
		function ChoiceField(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
				disabled: props.disabled,
				"aria-label": props.t(props.label),
				"aria-describedby": `searxng-${props.label}-hint`,
				className: "sx-choice",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("legend", { children: [props.t(props.label), props.state.overridden && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
						tone: "neutral",
						children: props.t("overridden")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						size: "sm",
						disabled: props.disabled,
						onClick: props.onReset,
						children: props.t("reset")
					})] })] }),
					props.children,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						id: `searxng-${props.label}-hint`,
						className: "sx-muted",
						children: props.t(props.state.invalid ? "invalidValue" : props.hint)
					})
				]
			});
		}
		/** Engine checkboxes grouped by search purpose; custom selections survive every list edit. */
		function EngineChoiceField(props) {
			const [customDraft, setCustomDraft] = (0, react.useState)(null);
			const selected = engineNames(props.state.text);
			const custom = selected.filter((name) => !ENGINE_NAMES.has(name));
			const toggle = (name, checked) => {
				props.onEdit((checked ? [...selected, name] : selected.filter((value) => value !== name)).join(","));
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ChoiceField, {
				...props,
				label: "engines",
				hint: "enginesHint",
				onReset: () => {
					setCustomDraft(null);
					props.onReset();
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: {
							marginTop: 0,
							fontSize: 12
						},
						children: props.t(selected.length ? "enginesSelected" : "enginesDefault")
					}),
					ENGINE_GROUPS.map((group, index) => {
						const content = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							role: "group",
							"aria-label": props.t(group.label),
							className: "sx-engine-group",
							children: [index === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "sx-muted",
								children: props.t(group.label)
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
								className: "sx-engine-grid",
								children: group.engines.map(([name, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: selected.includes(name),
									disabled: props.disabled,
									onChange: (event) => toggle(name, event.currentTarget.checked)
								}), label] }) }, name))
							})]
						}, group.label);
						return index === 0 ? content : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
							open: group.engines.some(([name]) => selected.includes(name)) || void 0,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: props.t(group.label) }), content]
						}, group.label);
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: props.t("enginesCustom") }),
						custom.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							style: {
								listStyle: "none",
								padding: 0
							},
							children: custom.map((name) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: true,
									disabled: props.disabled,
									onChange: (event) => toggle(name, event.currentTarget.checked)
								}), name]
							}) }, name))
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
							htmlFor: "searxng-custom-engines",
							children: props.t("enginesCustomNames")
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
							id: "searxng-custom-engines",
							value: customDraft?.selection === props.state.text ? customDraft.input : custom.join(","),
							disabled: props.disabled,
							onChange: (event) => {
								const input = event.currentTarget.value;
								const selection = engineNames([...selected.filter((name) => ENGINE_NAMES.has(name)), input].join(",")).join(",");
								setCustomDraft({
									input,
									selection
								});
								props.onEdit(selection);
							},
							"aria-describedby": "searxng-custom-engines-hint"
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							id: "searxng-custom-engines-hint",
							style: {
								fontSize: 12,
								opacity: .7
							},
							children: props.t("enginesCustomHint")
						})
					] }),
					custom.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						style: { fontSize: 12 },
						children: [
							props.t("enginesCustomSelected"),
							": ",
							custom.join(", ")
						]
					})
				]
			});
		}
		/** Language dropdown with a custom-code escape hatch for existing or uncommon languages. */
		function LanguageChoiceField(props) {
			const [customMode, setCustomMode] = (0, react.useState)(false);
			const custom = customMode || !LANGUAGE_CODES.has(props.state.text);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(ChoiceField, {
				...props,
				label: "language",
				hint: "languageHint",
				onReset: () => {
					setCustomMode(false);
					props.onReset();
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
					"aria-label": props.t("language"),
					disabled: props.disabled,
					value: custom ? CUSTOM_LANGUAGE : props.state.text,
					"aria-describedby": "searxng-language-hint",
					"aria-invalid": props.state.invalid || void 0,
					style: {
						width: "100%",
						padding: 8,
						borderRadius: 8,
						font: "inherit",
						color: "inherit",
						background: "var(--dsw-alias-bg-base)",
						border: "1px solid var(--dsw-alias-border-l2)"
					},
					onChange: (event) => {
						const value = event.currentTarget.value;
						setCustomMode(value === CUSTOM_LANGUAGE);
						if (value !== CUSTOM_LANGUAGE) props.onEdit(value);
					},
					children: [LANGUAGES.map(([code, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: code,
						children: props.t(label)
					}, code)), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
						value: CUSTOM_LANGUAGE,
						children: props.t("languageCustom")
					})]
				}), custom && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
					htmlFor: "searxng-custom-language",
					children: props.t("languageCustomCode")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Input, {
					id: "searxng-custom-language",
					value: props.state.text,
					disabled: props.disabled,
					onChange: (event) => props.onEdit(event.currentTarget.value)
				})] })]
			});
		}
		//#endregion
		//#region src/client/update-check.ts
		/**
		* Latest-release lookup behind the settings card's "check for updates" button.
		* The lookup fires only on an explicit click — the card renders and idles
		* without any network traffic, matching the provider's privacy posture.
		* @module dsh-search-proxy/client/update-check
		*/
		/**
		* This package's own version. Bump with package.json (the provider's
		* USER_AGENT follows the same rule).
		*/
		const CURRENT_VERSION = "0.5.0";
		/** GitHub repository hosting the plugin's releases. */
		const REPO = "Chaos-Paradox/dsh-search-proxy";
		/** Releases page the card links to for notes and manual updates. */
		const RELEASES_URL = `https://github.com/${REPO}/releases`;
		/** The latest release's lookup endpoint; api.github.com allows cross-origin reads. */
		const LATEST_RELEASE_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
		/**
		* Compare two dotted numeric versions, ignoring a leading v.
		* @param a - one version, e.g. `v0.2.0` or `0.2.0`.
		* @param b - the other version.
		* @returns positive when `a` is newer, negative when older, zero when equal.
		*/
		function compareVersions(a, b) {
			const pa = a.replace(/^v/i, "").split(".");
			const pb = b.replace(/^v/i, "").split(".");
			for (let index = 0; index < Math.max(pa.length, pb.length); index += 1) {
				const na = Number.parseInt(pa[index] ?? "0", 10) || 0;
				const nb = Number.parseInt(pb[index] ?? "0", 10) || 0;
				if (na !== nb) return na - nb;
			}
			return 0;
		}
		/**
		* Ask GitHub for the latest release and compare it with the installed version.
		* Every failure — offline, rate-limited, no releases, a malformed body — folds
		* into `unknown` rather than throwing: the card only ever renders a hint.
		* @param fetchImpl - the fetch to use, injectable for tests.
		* @returns the comparison outcome.
		*/
		async function checkLatestRelease(fetchImpl = fetch) {
			try {
				const response = await fetchImpl(LATEST_RELEASE_URL, { headers: { accept: "application/vnd.github+json" } });
				if (!response.ok) return { kind: "unknown" };
				const body = await response.json();
				const tag = typeof body.tag_name === "string" ? body.tag_name : "";
				if (tag.length === 0) return { kind: "unknown" };
				return compareVersions(tag, "0.5.0") > 0 ? {
					kind: "newer",
					latest: tag.replace(/^v/i, "")
				} : { kind: "latest" };
			} catch {
				return { kind: "unknown" };
			}
		}
		//#endregion
		//#region src/client/RoutingPanel.tsx
		/** Cost disclosure and an explicit, verified operator route restoration. */
		function describe(routing, operation) {
			const id = operation === "search" ? routing?.searchProvider : routing?.fetchProvider;
			if ((operation === "search" ? routing?.searchSource : routing?.fetchSource) !== "configuration" || !id) return {
				risk: "unknown",
				detail: "routingUnconfirmed"
			};
			if (id === (operation === "search" ? "deepseek-search-api" : "deepseek-fetch-api")) return {
				risk: "paid",
				detail: "routingDirectApi"
			};
			if (operation === "search" && id === "deepseek-official") return {
				risk: "paid",
				detail: "routingMessages"
			};
			if (operation === "fetch" && id === "http") return {
				risk: "local",
				detail: "routingHttp"
			};
			if (id === (operation === "search" ? "searxng" : "searxng-http")) {
				if (!routing?.fallback) return {
					risk: "unknown",
					detail: "routingPermissionUnknown"
				};
				if (operation === "search" && routing.fallback.searchApi || operation === "fetch" && routing.fallback.fetchApi) return {
					risk: "paid",
					detail: "routingFallbackOn"
				};
				if (operation === "search" && routing.fallback.legacySearch) return {
					risk: "paid",
					detail: "routingLegacyOn"
				};
				return {
					risk: "local",
					detail: "routingFallbackOff"
				};
			}
			return {
				risk: "unknown",
				detail: "routingOther"
			};
		}
		function RoutingPanel({ routing, fresh, checkedAt, failed, refresh, canRefresh, routeRestore, restore, writable = false, draft = false, t }) {
			const [confirmation, setConfirmation] = (0, react.useState)();
			const [restoring, setRestoring] = (0, react.useState)(false);
			const [outcome, setOutcome] = (0, react.useState)();
			const mounted = (0, react.useRef)(true);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			const current = fresh ? routing : void 0;
			const search = describe(current, "search"), fetch = describe(current, "fetch");
			const risk = [search.risk, fetch.risk].includes("paid") ? "paid" : [search.risk, fetch.risk].includes("unknown") ? "unknown" : "local";
			const sourceLabels = {
				configuration: "routingSourceConfig",
				environment: "routingSourceEnv",
				automatic: "routingSourceAuto",
				unavailable: "routingSourceUnknown"
			};
			const bypassed = current && (current.searchProvider && current.searchProvider !== "searxng" || current.fetchProvider && current.fetchProvider !== "searxng-http");
			const restored = current?.searchSource === "configuration" && current.fetchSource === "configuration" && current.searchProvider === "searxng" && current.fetchProvider === "searxng-http";
			const canRestore = !!current && !!restore && writable && !draft && routeRestore?.capability === "available" && !restoring;
			const changed = confirmation && (!fresh || confirmation.revision !== routeRestore?.revision);
			const outcomeKeys = {
				restored: "routeRestoreSuccess",
				changed: "routeRestoreChanged",
				blocked: "routeRestoreBlocked",
				"read-only": "routeRestoreReadOnly",
				unavailable: "routeRestoreUnavailable",
				failed: "routeRestoreFailed"
			};
			const apply = async () => {
				if (!confirmation || !canRestore || changed || !restore) return;
				setRestoring(true);
				setOutcome(void 0);
				try {
					const result = await restore(confirmation.revision, AbortSignal.timeout(45e3));
					if (mounted.current) setOutcome(result.outcome);
				} catch {
					if (mounted.current) setOutcome("failed");
				} finally {
					if (mounted.current) {
						setRestoring(false);
						setConfirmation(void 0);
						refresh();
					}
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				"aria-label": t("routingTitle"),
				className: "sx-card sx-routing",
				"data-risk": risk,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-header",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("routingTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
							className: "sx-route-risk",
							children: t(risk === "paid" ? "routingPaid" : risk === "unknown" ? "routingUnknown" : "routingLocal")
						})]
					}),
					failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: t("routingStale")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dl", {
						className: "sx-route-list",
						children: ["search", "fetch"].map((operation) => {
							const id = operation === "search" ? current?.searchProvider : current?.fetchProvider;
							const source = operation === "search" ? current?.searchSource : current?.fetchSource;
							const detail = operation === "search" ? search : fetch;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								"data-risk": detail.risk,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t(operation === "search" ? "routingSearch" : "routingFetch") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", { children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: id ?? t("routingUnknownProvider") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "sx-muted",
										children: t(sourceLabels[source ?? "unavailable"])
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t(detail.detail) })
								] })]
							}, operation);
						})
					}),
					current?.fallback && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "sx-muted",
						children: [
							t("routingSavedPermissions"),
							": ",
							t("routingSearch"),
							" ",
							t(current.fallback.searchApi ? "routingOn" : "routingOff"),
							" · ",
							t("routingFetch"),
							" ",
							t(current.fallback.fetchApi ? "routingOn" : "routingOff"),
							current.fallback.legacySearch && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [" · ", t("routingLegacyOn")] })
						]
					}),
					bypassed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routingRestoreHint") }),
					!restored && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-note",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: !canRestore || !!confirmation,
								onClick: () => {
									if (canRestore && routeRestore && current) {
										setOutcome(void 0);
										setConfirmation({
											revision: routeRestore.revision,
											routing: current
										});
									}
								},
								children: t("routeRestoreButton")
							}),
							draft ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeRestoreDraft") }) : !writable || routeRestore?.capability === "read-only" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeRestoreReadOnly") }) : (!restore || routeRestore?.capability !== "available") && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeRestoreUnavailable") }),
							confirmation && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								role: "group",
								"aria-label": t("routeRestoreConfirmTitle"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t("routeRestoreConfirmTitle") }) }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
										t("routingSearch"),
										": ",
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("code", { children: [confirmation.routing.searchProvider ?? t("routingUnknownProvider"), " → searxng"] })
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
										t("routingFetch"),
										": ",
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("code", { children: [confirmation.routing.fetchProvider ?? t("routingUnknownProvider"), " → searxng-http"] })
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeRestoreKeepPermissions") }),
									changed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										role: "alert",
										children: t("routeRestoreChanged")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "sx-actions",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											disabled: !canRestore || !!changed,
											onClick: () => {
												apply();
											},
											children: t(restoring ? "routeRestorePending" : "routeRestoreConfirm")
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											disabled: restoring,
											onClick: () => setConfirmation(void 0),
											children: t("routeRestoreCancel")
										})]
									})
								]
							})
						]
					}),
					outcome && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: outcome === "restored" ? "status" : "alert",
						children: t(outcomeKeys[outcome])
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("routeRestoreManual") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeRestoreManualSteps") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
							style: {
								whiteSpace: "pre-wrap",
								overflowWrap: "anywhere",
								fontSize: 13
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: "- id: web\n  config:\n    searchProvider: searxng\n    fetchProvider: searxng-http" })
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeRestoreBlocked") }),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeRestoreKeepPermissions") })
					] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: t("routingTestOnly")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: t("routingScope")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-actions",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: !canRefresh,
							onClick: refresh,
							children: t("routingRefresh")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "sx-muted",
							children: fresh && checkedAt ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								t("routingCheckedAt"),
								": ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", {
									dateTime: new Date(checkedAt).toISOString(),
									children: new Date(checkedAt).toLocaleTimeString()
								})
							] }) : t("routingUnknown")
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/ServicePanel.tsx
		/** Live operator status, first-use disclosure, bounded activity and a real search report. */
		const labels = {
			idle: "serviceIdle",
			"needs-setup": "serviceNeedsSetup",
			preparing: "servicePreparing",
			starting: "serviceStarting",
			ready: "serviceReady",
			stopped: "serviceStopped",
			failed: "serviceFailed",
			external: "serviceExternal"
		};
		const stages = {
			uv: "setupUv",
			source: "setupSource",
			python: "setupPython",
			dependencies: "setupDependencies"
		};
		const activityLabels = {
			download: "activityDownload",
			verify: "activityVerify",
			extract: "activityExtract",
			command: "activityCommand",
			cache: "activityCache",
			configure: "activityConfigure",
			ready: "activityReady",
			stop: "activityStop",
			cleanup: "activityCleanup",
			test: "activityTest",
			error: "activityError"
		};
		const stopReasons = {
			"service-start": "stopStart",
			"service-stop": "stopService",
			"configuration-change": "stopConfiguration",
			"operator-prepare": "stopPrepare",
			"operator-restart": "stopRestart",
			"operator-stop": "stopOperator",
			"external-mode": "stopExternal",
			"runtime-cleanup": "stopCleanup",
			"plugin-disposed": "stopPlugin",
			"subprocess-service-disposed": "stopDependency",
			"startup-failed": "stopStartupFailure",
			"unexpected-exit-recovery": "stopRecovery",
			"recovery-failed": "stopRecoveryFailure"
		};
		function reportIsCurrent(report, status) {
			if (!["ready", "external"].includes(status.phase) || report.instanceId !== status.instanceId) return false;
			try {
				const endpoint = new URL("search", status.endpoint.endsWith("/") ? status.endpoint : `${status.endpoint}/`);
				return report.endpoint === `${endpoint.origin}${endpoint.pathname}`;
			} catch {
				return false;
			}
		}
		const failureLabels = {
			configuration: "testConfiguration",
			authentication: "testAuthentication",
			connection: "testConnection",
			http: "testHttpFailure",
			response: "testResponse",
			cancelled: "testCancelled"
		};
		const verificationLabels = {
			sha256: "verifyHash",
			"tool-managed": "verifyTool",
			"package-index": "verifyPackages"
		};
		const secondary = {
			fontSize: "var(--dsh-content-font-size-secondary, 13px)",
			color: "var(--dsw-alias-label-secondary)",
			lineHeight: 1.5
		};
		function ServicePanel({ call, restoreRoutesCall, draft = false, t, writable }) {
			const [status, setStatus] = (0, react.useState)({
				phase: "idle",
				endpoint: "",
				message: "",
				logs: ""
			});
			const [error, setError] = (0, react.useState)("");
			const [pollError, setPollError] = (0, react.useState)("");
			const [routingFresh, setRoutingFresh] = (0, react.useState)(false);
			const [routingCheckedAt, setRoutingCheckedAt] = (0, react.useState)(0);
			const [refreshRevision, setRefreshRevision] = (0, react.useState)(0);
			const statusRevision = (0, react.useRef)(0);
			const routingCall = (0, react.useRef)(void 0);
			const [report, setReport] = (0, react.useState)();
			const [testStartedAt, setTestStartedAt] = (0, react.useState)(0);
			const [cancelled, setCancelled] = (0, react.useState)(false);
			const [pending, setPending] = (0, react.useState)();
			const [precheck, setPrecheck] = (0, react.useState)();
			const [recordOpen, setRecordOpen] = (0, react.useState)(false);
			const [reportOpen, setReportOpen] = (0, react.useState)(false);
			const [confirmCleanup, setConfirmCleanup] = (0, react.useState)(false);
			const [copyState, setCopyState] = (0, react.useState)("idle");
			const lifetime = (0, react.useRef)(void 0);
			const testController = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => {
				setRoutingFresh(false);
				if (!call) return;
				const controller = new AbortController();
				lifetime.current = controller;
				setPending(void 0);
				let timer;
				const poll = async () => {
					const revision = ++statusRevision.current;
					try {
						const next = await call("status", AbortSignal.any([controller.signal, AbortSignal.timeout(1e4)]));
						if (typeof next === "number" || !("phase" in next)) throw new Error("Invalid service status");
						if (!controller.signal.aborted && revision === statusRevision.current) {
							routingCall.current = call;
							setStatus(next);
							setPollError("");
							setRoutingFresh(true);
							setRoutingCheckedAt(Date.now());
						}
					} catch (e) {
						if (!controller.signal.aborted && revision === statusRevision.current) {
							setPollError(String(e));
							setRoutingFresh(false);
						}
					}
					if (!controller.signal.aborted) timer = setTimeout(() => {
						poll();
					}, 1500);
				};
				poll();
				return () => {
					controller.abort();
					clearTimeout(timer);
				};
			}, [call, refreshRevision]);
			(0, react.useEffect)(() => {
				const refresh = () => {
					if (document.visibilityState !== "hidden") {
						setRoutingFresh(false);
						setRefreshRevision((value) => value + 1);
					}
				};
				window.addEventListener("focus", refresh);
				document.addEventListener("visibilitychange", refresh);
				return () => {
					window.removeEventListener("focus", refresh);
					document.removeEventListener("visibilitychange", refresh);
				};
			}, []);
			const action = async (method) => {
				const controller = lifetime.current;
				if (!call || !controller) return;
				setPending(method);
				setError("");
				setCopyState("idle");
				if (method === "prepare" || method === "restart") setRecordOpen(true);
				const operation = new AbortController();
				const revision = ++statusRevision.current;
				if (method === "testReport") {
					testController.current = operation;
					setReportOpen(true);
					setReport(void 0);
					setTestStartedAt(Date.now());
					setCancelled(false);
				}
				try {
					const next = await call(method, AbortSignal.any([
						controller.signal,
						operation.signal,
						AbortSignal.timeout(45e3)
					]));
					if (controller.signal.aborted) return;
					if (operation.signal.aborted) {
						setError(t("testCancelled"));
						return;
					}
					if (typeof next !== "number" && "phase" in next) {
						if (revision === statusRevision.current) {
							routingCall.current = call;
							setStatus(next);
							setRoutingFresh(true);
							setRoutingCheckedAt(Date.now());
							setPollError("");
						}
					} else if (typeof next !== "number" && "targets" in next) setPrecheck(next);
					else if (typeof next !== "number") setReport(next);
				} catch (e) {
					if (!controller.signal.aborted) setError(operation.signal.aborted ? t("testCancelled") : String(e));
				} finally {
					if (!controller.signal.aborted) {
						setPending(void 0);
						testController.current = void 0;
					}
				}
			};
			const busy = pending !== void 0;
			const testing = pending === "testReport";
			const currentReport = testing || cancelled ? void 0 : report ?? (status.testReport && Date.parse(status.testReport.time) >= testStartedAt ? status.testReport : void 0);
			const historicalReport = currentReport && !reportIsCurrent(currentReport, status);
			const stage = Object.hasOwn(stages, status.message) ? t(stages[status.message]) : status.message;
			const eventDetail = (event) => event.kind === "stop" && Object.hasOwn(stopReasons, event.detail) ? t(stopReasons[event.detail]) + ` (${event.detail})` : event.detail;
			const activityText = (status.activities ?? []).map((event) => event.time + " " + t(activityLabels[event.kind]) + " " + event.subject + "\n" + eventDetail(event)).join("\n\n");
			const components = status.setup && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("setupComponents") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
				style: {
					...secondary,
					overflowWrap: "anywhere"
				},
				children: status.setup.components.map((component) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
					component.name,
					" ",
					component.version,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}),
					component.source,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}),
					t(verificationLabels[component.verification])
				] }, component.name))
			})] });
			const logHints = [
				[/DSH_SEARXNG_READY/, "logReadyHint"],
				[/Error while getting (?:the version|the git URL & branch)/, "logGitHint"],
				[/(?:ahmia|torch): can't register engine/, "logTorHint"],
				[/missing config file:.*limiter\.toml/, "logLimiterHint"],
				[/X-Forwarded-For nor X-Real-IP header is set/, "logForwardedHint"]
			];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(RoutingPanel, {
				routing: status.routing,
				fresh: routingFresh && routingCall.current === call,
				checkedAt: routingCheckedAt,
				failed: !!pollError,
				routeRestore: status.routeRestore,
				restore: restoreRoutesCall,
				writable,
				draft,
				canRefresh: !!call,
				refresh: () => {
					setRoutingFresh(false);
					setRefreshRevision((value) => value + 1);
				},
				t
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				"aria-label": t("serviceTitle"),
				className: "sx-card",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-header",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("serviceTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							role: "status",
							className: "sx-badge",
							"data-phase": status.phase,
							children: t(labels[status.phase])
						})]
					}),
					stage && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: stage
					}),
					status.phase === "failed" && status.setupFailure === "network" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-note",
						children: t("setupNetworkFailure")
					}),
					status.endpoint && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						style: secondary,
						children: [
							t("activeEndpoint"),
							": ",
							status.endpoint
						]
					}),
					status.phase === "needs-setup" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-note",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("setupSummary") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: secondary,
								children: t("setupScope")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: secondary,
								children: t("setupNetworkAdvice")
							}),
							components
						]
					}),
					["needs-setup", "failed"].includes(status.phase) && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: { margin: "8px 0" },
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: !call || busy,
							onClick: () => {
								action("precheck");
							},
							children: t(pending === "precheck" ? "precheckRunning" : "precheckButton")
						}), precheck && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							style: {
								...secondary,
								marginTop: 8
							},
							children: t("precheckHint")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							style: {
								...secondary,
								margin: "4px 0",
								paddingLeft: 20
							},
							children: precheck.targets.map((target) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: t(target.ok ? "precheckOk" : "precheckFailed") }),
								" · ",
								target.name,
								" · ",
								target.detail,
								" · ",
								target.elapsedMs,
								" ms"
							] }, target.name))
						})] })]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-actions",
						children: [
							status.phase !== "external" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: !call || busy || !writable || status.phase === "idle",
								onClick: () => {
									action(status.phase === "needs-setup" ? "prepare" : "restart");
								},
								children: t(status.phase === "needs-setup" ? "servicePrepare" : "serviceRestart")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: !call || busy || !writable || [
									"idle",
									"needs-setup",
									"stopped"
								].includes(status.phase),
								onClick: () => {
									action("stop");
								},
								children: t("serviceStop")
							})] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: !call || busy || !status.endpoint,
								onClick: () => {
									action("testReport");
								},
								children: t(testing ? "testRunning" : "serviceTest")
							}),
							testing && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: cancelled,
								onClick: () => {
									setCancelled(true);
									testController.current?.abort();
								},
								children: t("testCancel")
							})
						]
					}),
					currentReport && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						children: historicalReport ? t("testHistorical") : currentReport.outcome === "failed" ? t("testFailed") : currentReport.outcome === "empty" ? t("testEmpty") : t("serviceTestResult") + ": " + currentReport.sourceCount
					}),
					(error || pollError) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: error || pollError
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-diagnostics",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								open: recordOpen,
								onToggle: (event) => setRecordOpen(event.currentTarget.open),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("serviceLogs") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: secondary,
										children: t(status.logStorage ? "activityRetention" : "activitySession")
									}),
									status.logStorage && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
										style: secondary,
										children: [
											t("logStorageUsage"),
											": ",
											Math.ceil(status.logStorage.bytes / 1024),
											" / ",
											Math.ceil(status.logStorage.maxBytes / 1024),
											" KiB"
										]
									}), status.logStorage.failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										role: "status",
										style: secondary,
										children: t("logStorageFailed")
									})] }),
									(status.activities ?? []).length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
										style: {
											...secondary,
											paddingLeft: 20
										},
										children: status.activities.map((event, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
											style: { margin: "10px 0" },
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", { children: new Date(event.time).toLocaleString() }),
												" · ",
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
													t(activityLabels[event.kind]),
													" ",
													event.subject
												] }),
												event.detail && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
													style: {
														whiteSpace: "pre-wrap",
														overflowWrap: "anywhere",
														margin: "4px 0",
														font: "inherit"
													},
													children: eventDetail(event)
												})
											]
										}, event.time + index))
									}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: secondary,
										children: t("activityEmpty")
									}),
									status.logs && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("diagnosticOutput") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
											className: "sx-log-hints",
											children: logHints.filter(([pattern]) => pattern.test(status.logs)).map(([, key]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: t(key) }, key))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: "sx-muted",
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
												href: "https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/managed-runtime.zh.md#启动日志怎么看",
												target: "_blank",
												rel: "noreferrer",
												children: t("logHelp")
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
											style: {
												...secondary,
												whiteSpace: "pre-wrap",
												overflowWrap: "anywhere",
												maxHeight: 240,
												overflow: "auto",
												padding: 12,
												borderRadius: 8,
												background: "var(--sx-soft)"
											},
											children: status.logs
										})
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: !activityText && !status.logs,
										onClick: () => {
											navigator.clipboard?.writeText(activityText + "\n\n" + status.logs).then(() => setCopyState("copied"), () => setCopyState("failed"));
											if (!navigator.clipboard) setCopyState("failed");
										},
										children: t(copyState === "copied" ? "copiedLog" : "copyLog")
									}),
									status.logStorage && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: !call || busy || !writable,
										onClick: () => {
											action("clearLogs");
										},
										children: t("clearSavedLogs")
									}),
									copyState === "failed" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: secondary,
										children: t("copyFailed")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								open: reportOpen,
								onToggle: (event) => setReportOpen(event.currentTarget.open),
								style: { marginTop: 10 },
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("testReportTitle") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: secondary,
										children: t("testHint")
									}),
									testing && !cancelled && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										role: "status",
										children: t("testRunning")
									}),
									currentReport && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dl", {
											style: {
												...secondary,
												display: "grid",
												gridTemplateColumns: "minmax(0, 130px) minmax(0, 1fr)",
												gap: "6px 16px"
											},
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("testRequest") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
													style: {
														marginLeft: 0,
														overflowWrap: "anywhere"
													},
													children: [
														currentReport.query,
														" · ",
														currentReport.endpoint || t("testUnavailable")
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("testHttp") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
													style: { marginLeft: 0 },
													children: currentReport.httpStatus ?? t("testUnavailable")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("testFormat") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
													style: { marginLeft: 0 },
													children: currentReport.responseFormat === "json" ? "JSON" : t("testUnavailable")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dt", { children: [
													t("engines"),
													" / ",
													t("language")
												] }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
													style: { marginLeft: 0 },
													children: [
														currentReport.engines || t("enginesDefault"),
														" / ",
														currentReport.language || t("languageDefault")
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("testSourceCount") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dd", {
													style: { marginLeft: 0 },
													children: currentReport.sourceCount
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("dt", { children: t("testElapsed") }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
													style: { marginLeft: 0 },
													children: [
														currentReport.elapsedMs,
														" ms · ",
														new Date(currentReport.time).toLocaleTimeString()
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dt", { children: [
													t("testAuth"),
													" / ",
													t("testFallback")
												] }),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("dd", {
													style: { marginLeft: 0 },
													children: [
														t(currentReport.authUsed ? "testYes" : "testNo"),
														" / ",
														t("testNo")
													]
												})
											]
										}),
										currentReport.failureStage && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
											role: "alert",
											children: [t(failureLabels[currentReport.failureStage]), currentReport.message ? " (" + currentReport.message + ")" : ""]
										}),
										currentReport.sources.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", { children: currentReport.sources.map((source) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
											href: source.url,
											target: "_blank",
											rel: "noreferrer",
											children: source.title || source.url
										}) }, source.url)) })
									] })
								]
							}),
							status.setup && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
								style: { marginTop: 10 },
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("runtimeDetails") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: secondary,
										children: t("serviceHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
										style: {
											...secondary,
											overflowWrap: "anywhere"
										},
										children: [
											t("setupDirectory"),
											": ",
											status.setup.directory
										]
									}),
									status.phase !== "needs-setup" && components,
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										style: secondary,
										children: t("cleanupHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: !call || busy || !writable || ["preparing", "starting"].includes(status.phase),
										onClick: () => setConfirmCleanup(true),
										children: t("runtimeCleanup")
									}),
									confirmCleanup && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										role: "group",
										"aria-label": t("runtimeCleanup"),
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("cleanupHint") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												disabled: busy || !writable,
												onClick: () => {
													setConfirmCleanup(false);
													setRecordOpen(true);
													action("cleanup");
												},
												children: t("cleanupConfirm")
											}),
											" ",
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
												variant: "outline",
												size: "sm",
												onClick: () => setConfirmCleanup(false),
												children: t("cleanupCancel")
											})
										]
									})
								]
							})
						]
					})
				]
			})] });
		}
		//#endregion
		//#region src/proxy-types.ts
		/** Client-safe proxy contract. Only operator settings reads expose saved configuration. */
		const PROXY_RISK_REVISION = "2026-10-19-v3";
		const PROXY_RISK_URL = "https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.zh.md";
		const PROXY_RISK_URL_EN = "https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.md";
		function parseProxyResponse(value) {
			if (!value || typeof value !== "object" || Reflect.get(value, "riskRevision") !== "2026-10-19-v3") throw new Error("Invalid proxy response");
			const state = Reflect.get(value, "state");
			if ([
				"off",
				"active",
				"inherited",
				"unavailable"
			].includes(state)) {
				const remembered = Reflect.get(value, "remembered"), restoreFailed = Reflect.get(value, "restoreFailed");
				if (remembered !== void 0 && typeof remembered !== "boolean" || restoreFailed !== void 0 && typeof restoreFailed !== "boolean") throw new Error("Invalid proxy status");
				const configuration = Reflect.get(value, "configuration");
				let parsed;
				if (configuration !== void 0) {
					if (!configuration || typeof configuration !== "object") throw new Error("Invalid proxy configuration");
					const protocol = Reflect.get(configuration, "protocol"), host = Reflect.get(configuration, "host");
					const port = Reflect.get(configuration, "port"), noProxy = Reflect.get(configuration, "noProxy");
					if (!["http", "https"].includes(protocol) || typeof host !== "string" || !host || typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535 || typeof noProxy !== "string") throw new Error("Invalid proxy configuration");
					parsed = {
						protocol,
						host,
						port,
						noProxy
					};
				}
				return {
					state,
					riskRevision: PROXY_RISK_REVISION,
					...remembered !== void 0 ? { remembered } : {},
					...restoreFailed !== void 0 ? { restoreFailed } : {},
					...parsed ? { configuration: parsed } : {}
				};
			}
			const step = Reflect.get(value, "step"), token = Reflect.get(value, "token");
			if (![
				"notice",
				"statement",
				"approved"
			].includes(step) || typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid proxy approval");
			return {
				step,
				token,
				riskRevision: PROXY_RISK_REVISION
			};
		}
		//#endregion
		//#region src/client/ProxyPanel.tsx
		/** Visible connection fields; the switch requests consent before any proxy is installed. */
		function ProxyPanel({ call, t, writable }) {
			const [status, setStatus] = (0, react.useState)("unavailable");
			const [approval, setApproval] = (0, react.useState)();
			const [ack, setAck] = (0, react.useState)(false);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failed, setFailed] = (0, react.useState)(false);
			const [invalid, setInvalid] = (0, react.useState)(false);
			const [remembered, setRemembered] = (0, react.useState)(false);
			const [savedConfiguration, setSavedConfiguration] = (0, react.useState)();
			const [host, setHost] = (0, react.useState)(""), [port, setPort] = (0, react.useState)(""), [noProxy, setNoProxy] = (0, react.useState)("");
			const [protocol, setProtocol] = (0, react.useState)("http");
			const mounted = (0, react.useRef)(false), working = (0, react.useRef)(false), edited = (0, react.useRef)(false);
			const fillFields = (configuration) => {
				setHost(configuration?.host ?? "");
				setPort(configuration ? String(configuration.port) : "");
				setNoProxy(configuration?.noProxy ?? "");
				setProtocol(configuration?.protocol ?? "http");
				setInvalid(false);
				edited.current = false;
			};
			const receiveSettings = (result) => {
				if (!("state" in result)) throw new Error("Invalid proxy settings");
				setStatus(result.state);
				setRemembered(result.remembered === true);
				setSavedConfiguration(result.configuration);
				if (!edited.current && !working.current) fillFields(result.configuration);
				if (result.restoreFailed) setFailed(true);
			};
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				let current = true;
				call?.("proxyDescribe", {}).then((result) => {
					if (current) receiveSettings(result);
				}, () => {
					if (current) setFailed(true);
				});
				return () => {
					current = false;
				};
			}, [call]);
			const receiveStatus = (result) => {
				if (!("state" in result)) throw new Error("Invalid proxy state");
				setStatus(result.state);
				setApproval(void 0);
				setAck(false);
				setRemembered(result.remembered === true);
			};
			const operation = async (run) => {
				if (!call || working.current || !writable) return;
				working.current = true;
				setBusy(true);
				setFailed(false);
				try {
					await run();
				} catch {
					if (mounted.current) {
						setFailed(true);
						setApproval(void 0);
						setAck(false);
						try {
							const result = await call("proxyDescribe", {});
							if (mounted.current) receiveSettings(result);
						} catch {}
					}
				} finally {
					working.current = false;
					if (mounted.current) setBusy(false);
				}
			};
			const valid = !!host.trim() && /^\d+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535;
			const locked = !call || !writable || busy;
			const changed = !savedConfiguration || protocol !== savedConfiguration.protocol || host !== savedConfiguration.host || Number(port) !== savedConfiguration.port || noProxy !== savedConfiguration.noProxy;
			const requestApproval = (replace = false) => {
				if (!valid) {
					setInvalid(true);
					return;
				}
				operation(async () => {
					if (replace) {
						const result = await call("proxyRemove", {});
						if (mounted.current) receiveStatus(result);
					}
					const next = await call("proxyBegin", {});
					if (!("step" in next) || next.step !== "notice") throw new Error("Invalid proxy consent");
					if (mounted.current) {
						setApproval(next);
						setAck(false);
						setInvalid(false);
					}
				});
			};
			const requestEnable = () => {
				if (remembered && savedConfiguration && !changed) operation(async () => {
					const result = await call("proxyResume", {});
					if (mounted.current) receiveStatus(result);
				});
				else requestApproval();
			};
			const readStatement = () => {
				if (approval?.step !== "notice") return;
				operation(async () => {
					const next = await call("proxyConfirm", {
						token: approval.token,
						step: "notice",
						revision: approval.riskRevision,
						accepted: false
					});
					if (!("step" in next) || next.step !== "statement") throw new Error("Invalid proxy statement");
					if (mounted.current) {
						setApproval(next);
						setAck(false);
					}
				});
			};
			const enable = () => {
				if (!ack || !valid || approval?.step !== "statement") return;
				operation(async () => {
					const grant = await call("proxyConfirm", {
						token: approval.token,
						step: "statement",
						revision: approval.riskRevision,
						accepted: true
					});
					if (!("step" in grant) || grant.step !== "approved") throw new Error("Invalid proxy acknowledgement");
					const configuration = {
						protocol,
						host,
						port: Number(port),
						noProxy
					};
					const result = await call("proxyApply", {
						token: grant.token,
						configuration
					});
					if (mounted.current) {
						receiveStatus(result);
						setSavedConfiguration(configuration);
						fillFields(configuration);
					}
				});
			};
			const remove = () => {
				operation(async () => {
					const result = await call("proxyRemove", {});
					if (mounted.current) receiveStatus(result);
				});
			};
			const forget = () => {
				operation(async () => {
					const result = await call("proxyForget", {});
					if (mounted.current) {
						receiveStatus(result);
						setSavedConfiguration(void 0);
						fillFields();
					}
				});
			};
			const statusKey = {
				off: "proxyOff",
				active: "proxyActive",
				inherited: "proxyInherited",
				unavailable: "proxyUnavailable"
			}[status];
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				"aria-label": t("proxyTitle"),
				className: "sx-card sx-risk",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-header",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("proxyTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "sx-risk-label",
							children: t("proxyBadge")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: t("proxyHint")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-header",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("proxyToggle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Switch, {
							label: t("proxyToggle"),
							checked: status === "active",
							disabled: locked || !["off", "active"].includes(status) || !!approval,
							onChange: (next) => next ? requestEnable() : remove()
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "status",
						className: "sx-muted",
						children: t(statusKey)
					}),
					remembered && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: t("proxyRemembered")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: t("proxyPortGuide")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("fieldset", {
						className: "sx-plain-fieldset",
						disabled: locked || !["off", "active"].includes(status) || !!approval,
						onChange: () => {
							edited.current = true;
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "sx-proxy-grid",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "sx-field sx-wide",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										htmlFor: "session-proxy-protocol",
										children: t("proxyProtocol")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
										id: "session-proxy-protocol",
										value: protocol,
										onChange: (event) => setProtocol(event.currentTarget.value),
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "http",
											children: "HTTP"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
											value: "https",
											children: "HTTPS"
										})]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "sx-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										htmlFor: "session-proxy-host",
										children: t("proxyHost")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "sx-input",
										id: "session-proxy-host",
										autoComplete: "off",
										"aria-describedby": "session-proxy-host-hint",
										"aria-invalid": invalid && !host.trim() || void 0,
										value: host,
										onChange: (event) => setHost(event.currentTarget.value)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "sx-field",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										htmlFor: "session-proxy-port",
										children: t("proxyPort")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "sx-input",
										id: "session-proxy-port",
										type: "number",
										min: 1,
										max: 65535,
										autoComplete: "off",
										"aria-describedby": "session-proxy-port-hint",
										"aria-invalid": invalid && !valid || void 0,
										value: port,
										onChange: (event) => setPort(event.currentTarget.value)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "sx-muted sx-wide",
									id: "session-proxy-host-hint",
									children: t("proxyHostHint")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "sx-muted sx-wide",
									id: "session-proxy-port-hint",
									children: t("proxyPortHint")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "sx-field sx-wide",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
										htmlFor: "session-proxy-bypass",
										children: t("proxyBypass")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "sx-input",
										id: "session-proxy-bypass",
										autoComplete: "off",
										"aria-describedby": "session-proxy-bypass-hint",
										value: noProxy,
										onChange: (event) => setNoProxy(event.currentTarget.value)
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: "sx-muted sx-wide",
									id: "session-proxy-bypass-hint",
									children: t("proxyBypassHint")
								})
							]
						})
					})] }),
					status === "active" && changed && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: t("proxyUpdateHint")
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "sx-actions",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "primary",
							size: "sm",
							disabled: locked || !!approval,
							onClick: () => requestApproval(true),
							children: t("proxyUpdate")
						})
					})] }),
					invalid && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: t("proxyConfigRequired")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "sx-muted",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								href: PROXY_RISK_URL,
								target: "_blank",
								rel: "noreferrer",
								children: t("proxyDocs")
							}),
							" · ",
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
								href: PROXY_RISK_URL_EN,
								target: "_blank",
								rel: "noreferrer",
								children: t("proxyDocsEn")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("proxySessionTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "sx-muted",
						children: t("proxySession")
					})] }),
					status === "active" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "sx-actions",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: locked,
							onClick: remove,
							children: t("proxyRemove")
						})
					}),
					remembered && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "sx-actions",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: locked,
							onClick: forget,
							children: t("proxyForget")
						})
					}),
					failed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: t("proxyError")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
						open: !!approval,
						onClose: () => {
							if (!locked) remove();
						},
						title: t("proxyDialogTitle"),
						closeLabel: t("proxyClose"),
						className: "searxng-proxy-dialog",
						contentClassName: "searxng-proxy-dialog-content",
						footer: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "searxng-settings",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "sx-actions",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "outline",
									size: "sm",
									disabled: locked,
									onClick: remove,
									children: t("proxyCancel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									variant: "primary",
									size: "sm",
									disabled: locked || !ack || approval?.step !== "statement" || !valid,
									onClick: enable,
									children: t("proxyApply")
								})]
							})
						}),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "searxng-settings",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "sx-card sx-risk",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("proxyDialogHint") }),
									approval?.step === "notice" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
										className: "sx-actions",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											disabled: locked,
											onClick: readStatement,
											children: t("proxyReadStatement")
										})
									}),
									approval?.step === "statement" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
										"aria-label": t("proxyStatementTitle"),
										className: "sx-statement",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("proxyStatementTitle") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("proxyStatementRisk") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("proxyStatementScope") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("proxyStatementPrivacy") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("proxySession") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("proxyStatementLimits") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", { children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
													href: "https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.zh.md",
													target: "_blank",
													rel: "noreferrer",
													children: t("proxyDocs")
												}),
												" · ",
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
													href: "https://github.com/Chaos-Paradox/dsh-search-proxy/blob/main/docs/proxy-risk.md",
													target: "_blank",
													rel: "noreferrer",
													children: t("proxyDocsEn")
												})
											] })
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "sx-check",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: ack,
											disabled: locked || approval?.step !== "statement",
											onChange: (event) => setAck(event.currentTarget.checked)
										}), t("proxyAck")]
									}),
									approval?.step === "notice" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "sx-muted",
										children: t("proxyReadFirst")
									})
								]
							})
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/settings-styles.ts
		/** Scoped styles: host theme tokens, compact sections and a distinct opt-in risk area. */
		const settingsStyles = `
.searxng-settings{--sx-border:var(--dsw-alias-border-l2,#dfe3e8);--sx-muted:var(--dsw-alias-label-secondary,#68717d);--sx-bg:var(--dsw-alias-bg-base,#fff);--sx-soft:var(--dsw-alias-bg-layer-2,#f6f7f9);font-size:var(--dsh-content-font-size,14px);line-height:1.6;display:flex;flex-direction:column;gap:20px;max-width:840px;margin:0 auto}
.searxng-settings *{box-sizing:border-box}
.searxng-settings p{margin:0}
.searxng-settings h3{font-size:15px;font-weight:650;line-height:1.5;margin:0}
.searxng-settings input[type=checkbox]{accent-color:var(--dsw-alias-brand-primary,#4d6bfe);flex-shrink:0;width:15px;height:15px;margin:0}
.searxng-settings select,.searxng-settings .sx-input{font:inherit;color:inherit;background:var(--sx-bg);border:1px solid var(--sx-border);border-radius:8px;padding:9px 11px;min-height:40px;width:100%;min-width:0}
.searxng-settings select:focus-visible,.searxng-settings .sx-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:2px}
.searxng-settings .sx-card{border:1px solid var(--sx-border);border-radius:12px;padding:18px 20px;display:flex;flex-direction:column;gap:14px}
.searxng-settings .sx-card+.sx-card{margin-top:16px}
.searxng-settings .sx-card>button{align-self:flex-start}
.searxng-settings .sx-header,.searxng-settings .sx-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.searxng-settings .sx-actions{justify-content:flex-start}
.searxng-settings .sx-muted{color:var(--sx-muted);font-size:13px}
.searxng-settings .sx-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:3px 9px;border-radius:6px;background:var(--sx-soft);color:var(--sx-muted)}
.searxng-settings .sx-badge[data-phase=ready]{color:#16804a;background:color-mix(in srgb,#16804a 10%,var(--sx-bg))}
.searxng-settings .sx-badge[data-phase=failed]{color:#c93535;background:color-mix(in srgb,#c93535 9%,var(--sx-bg))}
.searxng-settings .sx-badge:before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
.searxng-settings details{margin:0;min-width:0}
.searxng-settings summary{font-size:13px;font-weight:500;cursor:pointer;color:var(--sx-muted);padding:3px 0}
.searxng-settings details[open]>summary{margin-bottom:10px}
.searxng-settings details>p+*,.searxng-settings details>fieldset+*,.searxng-settings details>div+*,.searxng-settings details>button+*{margin-top:10px}
.searxng-settings .sx-diagnostics{border-top:1px solid var(--sx-border);padding-top:12px;display:grid;gap:8px}
.searxng-settings .sx-note{background:var(--sx-soft);padding:12px 14px;border-radius:8px;display:grid;gap:6px}
.searxng-settings .sx-routing{border-left-width:3px}
.searxng-settings .sx-routing[data-risk=paid]{border-left-color:light-dark(#b42318,#ff9b94)}
.searxng-settings .sx-routing[data-risk=unknown]{border-left-color:light-dark(#936000,#edc472)}
.searxng-settings .sx-route-risk{font-size:12px}
.searxng-settings .sx-routing[data-risk=paid] .sx-route-risk{color:light-dark(#b42318,#ff9b94)}
.searxng-settings .sx-route-list{margin:0;display:grid;gap:14px}
.searxng-settings .sx-route-list>div{border-top:1px solid var(--sx-border);padding-top:12px;display:grid;grid-template-columns:80px minmax(0,1fr);gap:12px}
.searxng-settings .sx-route-list dt{font-size:13px;font-weight:600}
.searxng-settings .sx-route-list dd{margin:0;display:grid;gap:5px;font-size:13px;overflow-wrap:anywhere}
.searxng-settings .sx-route-list code{font-size:13px;font-weight:600}
.searxng-settings .sx-field{display:grid;gap:7px;min-width:0}
.searxng-settings .sx-field>label{font-weight:500;font-size:13px}
.searxng-settings .sx-check{display:flex;align-items:flex-start;gap:9px;font-size:13px}
.searxng-settings .sx-check>input{margin-top:3px}
.searxng-settings .sx-plain-fieldset{border:0;margin:0;padding:0;min-width:0;display:grid;gap:12px}
.searxng-settings .sx-plain-fieldset>legend{margin-bottom:10px;font-size:13px;font-weight:600}
.searxng-settings .sx-choice{border:0;padding:0;margin:0;min-width:0}
.searxng-settings .sx-choice>legend{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;font-weight:600}
.searxng-settings .sx-choice>p,.searxng-settings .sx-choice>details{margin-top:8px}
.searxng-settings .sx-engine-group{margin-top:14px}
.searxng-settings .sx-engine-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px 8px;list-style:none;padding:0;margin:6px 0 0}
.searxng-settings .sx-engine-grid label{display:flex;align-items:center;gap:8px;border:1px solid var(--sx-border);border-radius:7px;padding:7px 9px;font-size:13px;cursor:pointer;min-height:36px}
.searxng-settings .sx-engine-grid label:has(input:checked){border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 55%,var(--sx-border));background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 6%,var(--sx-bg))}
.searxng-settings .sx-engine-grid label:has(input:disabled){cursor:default;opacity:.65}
.searxng-settings .sx-version{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--sx-muted);padding:0 2px}
.searxng-settings .sx-risk{--sx-danger:light-dark(#b42318,#ff9b94);border:1px solid color-mix(in srgb,var(--sx-danger) 45%,var(--sx-border));border-left:3px solid var(--sx-danger);background:color-mix(in srgb,var(--sx-danger) 4%,var(--sx-bg));margin-top:6px}
.searxng-settings .sx-risk h3,.searxng-settings .sx-risk-label,.searxng-settings .sx-risk a{color:var(--sx-danger)}
.searxng-settings .sx-risk-label{font-size:11px;font-weight:650;border:1px solid color-mix(in srgb,var(--sx-danger) 30%,transparent);border-radius:5px;padding:2px 7px;white-space:nowrap}
.searxng-settings .sx-risk .sx-actions>button{color:var(--sx-danger);border-color:color-mix(in srgb,var(--sx-danger) 35%,var(--sx-border))}
.searxng-settings .sx-risk .sx-note{background:color-mix(in srgb,var(--sx-danger) 5%,var(--sx-bg))}
.searxng-settings .sx-risk .sx-check{border:1px solid color-mix(in srgb,var(--sx-danger) 25%,var(--sx-border));border-radius:8px;padding:12px}
.searxng-settings .sx-risk input[type=checkbox]{accent-color:var(--sx-danger)}
.searxng-settings .sx-proxy-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(110px,1fr);gap:14px}
.searxng-settings .sx-proxy-grid .sx-wide{grid-column:1/-1}
.searxng-settings .sx-statement{display:grid;gap:12px;font-size:13px}
.searxng-settings .sx-input[aria-invalid=true]{border-color:light-dark(#b42318,#ff9b94)}
.searxng-proxy-dialog{width:min(680px,100%);max-height:100%;font-size:14px}
.searxng-proxy-dialog-content{overflow-y:auto;min-height:0}
.searxng-proxy-dialog h2{color:light-dark(#b42318,#ff9b94)}
.searxng-proxy-dialog .searxng-settings{width:100%}
.searxng-settings .sx-log-hints{font-size:12px;color:var(--sx-muted);padding-left:18px;margin:10px 0}
.searxng-settings .sx-log-hints li+li{margin-top:6px}
@media(max-width:540px){.searxng-settings .sx-card{padding:15px}.searxng-settings .sx-proxy-grid{grid-template-columns:1fr}.searxng-settings .sx-engine-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
		//#endregion
		//#region src/client/SearxngSearchCard.tsx
		/**
		* Render the SearXNG search provider's one-liner or its settings form, as the Plugins page asks.
		* The fallback checkbox is staged with the other fields and takes effect on save.
		* Update checks run only on click.
		* @param props - the view asked for, locale copy, the form snapshot, and its actions.
		* @returns the one-liner, or the form.
		*/
		function SearxngSearchCard(props) {
			const { t } = props;
			const state = props.useSearxngSearchCard((snapshot) => snapshot);
			const [update, setUpdate] = (0, react.useState)({ checking: false });
			if (props.view === "summary") return t("description");
			const fallbackAllowed = state.allowOfficialApiFallback.text === "true";
			const disabled = !state.available || !state.writable || state.saving;
			const fields = [
				state.mode,
				state.managedPort,
				state.baseURL,
				state.engines,
				state.language,
				state.authEnabled,
				state.authHeaderName,
				state.allowOfficialFallback,
				state.allowOfficialApiFallback,
				state.allowOfficialFetchFallback
			];
			const local = state.mode.text === "local" || state.mode.text === "auto" && !state.baseURL.text.trim() && !state.authEndpoint;
			const anyOverridden = fields.some((field) => field.overridden);
			const resetAll = () => {
				props.resetField("mode");
				props.resetField("managedPort");
				props.resetField("baseURL");
				props.resetField("engines");
				props.resetField("language");
				props.resetField("authEnabled");
				props.resetField("authHeaderName");
				props.edit("authHeaderValue", "");
				props.resetField("allowOfficialFallback");
				props.resetField("allowOfficialApiFallback");
				props.resetField("allowOfficialFetchFallback");
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "searxng-settings",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: settingsStyles }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServicePanel, {
						call: props.serviceCall,
						restoreRoutesCall: props.restoreRoutesCall,
						draft: state.dirty || state.saving || state.authBusy,
						t,
						writable: state.available && state.writable
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.SettingsForm, {
						labels: formLabels(t),
						state,
						onSave: props.save,
						onDiscard: props.discard,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "sx-card",
								"aria-label": t("connectionTitle"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("connectionTitle") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "sx-field",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
												htmlFor: "searxng-mode",
												children: t("modeLabel")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
												id: "searxng-mode",
												value: state.mode.text,
												disabled,
												onChange: (e) => props.edit("mode", e.currentTarget.value),
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "auto",
														children: t("modeAuto")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "local",
														children: t("modeLocal")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
														value: "external",
														children: t("modeExternal")
													})
												]
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
												className: "sx-muted",
												children: t("modeHint")
											})
										]
									}),
									!local && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
										id: "plugin-config-web-search-searxng-endpoint",
										label: t("baseUrl"),
										hint: t("baseUrlHint"),
										overriddenLabel: t("overridden"),
										resetLabel: t("reset"),
										invalidLabel: t("invalidValue"),
										disabled,
										...state.baseURL,
										onEdit: (text) => props.edit("baseURL", text),
										onReset: () => props.resetField("baseURL")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "sx-muted",
										children: t("authDefaultHint")
									}),
									!local && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
										open: state.authEnabled.text === "true" || void 0,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("authTitle") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
											className: "sx-plain-fieldset",
											disabled: disabled || state.authBusy,
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													className: "sx-check",
													children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: state.authEnabled.text === "true",
														onChange: (event) => props.edit("authEnabled", String(event.currentTarget.checked)),
														"aria-describedby": "searxng-auth-hint"
													}), t("authEnabled")]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: "sx-muted",
													id: "searxng-auth-hint",
													children: t("authHint")
												}),
												state.authEnabled.text === "true" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
														id: "searxng-auth-header-name",
														label: t("authHeaderName"),
														hint: t("authHeaderNameHint"),
														overriddenLabel: t("overridden"),
														resetLabel: t("reset"),
														invalidLabel: t("authHeaderInvalid"),
														disabled,
														...state.authHeaderName,
														onEdit: (text) => props.edit("authHeaderName", text),
														onReset: () => props.resetField("authHeaderName")
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsSecretField, {
														id: "searxng-auth-header-value",
														label: t("authHeaderValue"),
														hint: t("authHeaderValueHint"),
														text: state.authHeaderValue.text,
														configured: state.authConfigured,
														stateLabel: t(state.authConfigured ? "authConfigured" : "authNotConfigured"),
														disabled: disabled || !state.authWritable,
														onEdit: (text) => props.edit("authHeaderValue", text)
													}),
													!state.authWritable && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("authUnavailable") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
														variant: "outline",
														size: "sm",
														disabled: disabled || state.dirty || !state.authWritable || !state.authConfigured,
														onClick: props.clearAuth,
														children: t("authClear")
													}),
													state.authFailed && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
														role: "alert",
														children: t("authClearFailed")
													})
												] })
											]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "sx-card",
								"aria-label": t("preferencesTitle"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("preferencesTitle") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LanguageChoiceField, {
										t,
										state: state.language,
										disabled,
										onEdit: (text) => props.edit("language", text),
										onReset: () => props.resetField("language")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(EngineChoiceField, {
										t,
										state: state.engines,
										disabled,
										onEdit: (text) => props.edit("engines", text),
										onReset: () => props.resetField("engines")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
								className: "sx-card",
								"aria-label": t("optionsTitle"),
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", { children: t("optionsTitle") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "sx-check",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: fallbackAllowed,
											disabled,
											onChange: (event) => props.edit("allowOfficialApiFallback", String(event.currentTarget.checked)),
											"aria-describedby": "searxng-fallback-hint"
										}), t("fallbackLabel")]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										className: "sx-check",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: state.allowOfficialFetchFallback.text === "true",
											disabled,
											onChange: (event) => props.edit("allowOfficialFetchFallback", String(event.currentTarget.checked)),
											"aria-describedby": "searxng-fetch-fallback-hint"
										}), t("fetchFallbackLabel")]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "sx-muted",
										id: "searxng-fetch-fallback-hint",
										children: t("fetchFallbackHint")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("serviceBehavior") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: "sx-muted",
											id: "searxng-fallback-hint",
											children: t("fallbackHint")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: "sx-muted",
											children: t("routeHint")
										})
									] }),
									local && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("advanced") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.SettingsValueField, {
										id: "searxng-managed-port",
										label: t("managedPort"),
										hint: t("managedPortHint"),
										overriddenLabel: t("overridden"),
										resetLabel: t("reset"),
										invalidLabel: t("invalidValue"),
										disabled,
										...state.managedPort,
										onEdit: (text) => props.edit("managedPort", text),
										onReset: () => props.resetField("managedPort")
									})] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
										variant: "outline",
										size: "sm",
										disabled: disabled || !anyOverridden,
										onClick: resetAll,
										children: t("resetAll")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "sx-version",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("currentVersion"),
								": v",
								CURRENT_VERSION
							] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								variant: "outline",
								size: "sm",
								disabled: update.checking,
								onClick: () => {
									setUpdate({ checking: true });
									checkLatestRelease().then((result) => setUpdate({
										checking: false,
										result
									}));
								},
								children: update.checking ? t("checkingUpdate") : t("checkUpdate")
							}),
							update.result?.kind === "newer" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								t("updateAvailable"),
								" v",
								update.result.latest,
								" · ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
									href: RELEASES_URL,
									target: "_blank",
									rel: "noreferrer",
									children: t("updateReleases")
								}),
								" · ",
								t("updateHowTo")
							] }),
							update.result?.kind === "latest" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("updateLatest") }),
							update.result?.kind === "unknown" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("updateFailed") })
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ProxyPanel, {
						call: props.proxyCall,
						t,
						writable: state.available && state.writable
					})
				]
			});
		}
		//#endregion
		//#region src/auth-types.ts
		const DEFAULT_AUTH_HEADER = "X-API-Key";
		const HEADER_NAME = /^[!#$%&'*+.^_`|~0-9A-Za-z-]{1,128}$/;
		const RESERVED_HEADERS = /* @__PURE__ */ new Set([
			"accept",
			"user-agent",
			"host",
			"connection",
			"content-length",
			"transfer-encoding",
			"proxy-authorization",
			"proxy-connection",
			"upgrade",
			"te",
			"trailer",
			"expect",
			"accept-encoding"
		]);
		/** Authentication must not override request routing, framing, or the JSON contract. */
		function validAuthHeaderName(name) {
			return HEADER_NAME.test(name) && !RESERVED_HEADERS.has(name.toLowerCase());
		}
		function parseInstanceAuthStatus(value) {
			if (typeof value !== "object" || value === null || typeof Reflect.get(value, "endpoint") !== "string" || typeof Reflect.get(value, "configured") !== "boolean" || typeof Reflect.get(value, "writable") !== "boolean") throw new Error("Invalid instance authentication response");
			return {
				endpoint: Reflect.get(value, "endpoint"),
				configured: Reflect.get(value, "configured"),
				writable: Reflect.get(value, "writable")
			};
		}
		//#endregion
		//#region src/client/searxng-search-card-controller.ts
		/**
		* Namespace of the SearXNG search provider. Spelled here rather than
		* imported: a client package must not depend on a Host package.
		*/
		const SEARXNG_SEARCH_NS = "web-search-searxng";
		/**
		* The official-fallback switch, staged as hidden text but stored as a
		* boolean. Both positions write an explicit value so an inherited `true`
		* cannot prevent the user from disabling paid fallback.
		* @param field - field name inside the namespace section.
		* @returns the field's conversion spec.
		*/
		function settingsSwitchField(field) {
			return {
				field,
				format: (value) => value === true ? "true" : "false",
				parse: (text) => ({
					kind: "set",
					value: text === "true"
				})
			};
		}
		/** Bridges the `web-search-searxng` scope onto the page. */
		var SearxngSearchCardController = class {
			scope;
			auth;
			form;
			store;
			unsubscribe;
			authStatus = {
				endpoint: "",
				configured: false,
				writable: false
			};
			authBusy = false;
			authFailed = false;
			revision = 0;
			disposed = false;
			/**
			* @param scope - the bound settings scope for the `web-search-searxng` namespace.
			*/
			constructor(scope, auth) {
				this.scope = scope;
				this.auth = auth;
				this.form = new _deepseek_ai_dsh_client_ui_primitives.SettingsFormModel(scope, [
					{
						field: "mode",
						format: (value) => typeof value === "string" ? value : "auto",
						parse: (text) => [
							"auto",
							"local",
							"external"
						].includes(text) ? {
							kind: "set",
							value: text
						} : void 0
					},
					{
						field: "managedPort",
						format: (value) => typeof value === "number" ? String(value) : "0",
						parse: (text) => /^\d+$/.test(text) && Number(text) <= 65535 ? {
							kind: "set",
							value: Number(text)
						} : void 0
					},
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("baseURL"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("engines"),
					(0, _deepseek_ai_dsh_client_ui_primitives.settingsTextField)("language"),
					settingsSwitchField("authEnabled"),
					{
						field: "authHeaderName",
						format: (value) => typeof value === "string" && value.trim() ? value : DEFAULT_AUTH_HEADER,
						parse: (text) => !text.trim() ? { kind: "clear" } : validAuthHeaderName(text.trim()) ? {
							kind: "set",
							value: text.trim()
						} : void 0
					},
					settingsSwitchField("allowOfficialFallback"),
					settingsSwitchField("allowOfficialApiFallback"),
					settingsSwitchField("allowOfficialFetchFallback")
				], [{
					field: "authHeaderValue",
					write: (value) => this.writeAuth(value)
				}]);
				this.store = this.form.bind(() => this.projection());
				this.unsubscribe = scope.subscribe(() => {
					this.refreshAuth();
				});
				this.refreshAuth();
			}
			projection() {
				return {
					...this.form.shell(),
					mode: this.form.field("mode"),
					managedPort: this.form.field("managedPort"),
					baseURL: this.form.field("baseURL"),
					engines: this.form.field("engines"),
					language: this.form.field("language"),
					authEnabled: this.form.field("authEnabled"),
					authHeaderName: this.form.field("authHeaderName"),
					authHeaderValue: this.form.field("authHeaderValue"),
					authConfigured: this.authStatus.configured,
					authWritable: this.authStatus.writable,
					authEndpoint: this.authStatus.endpoint,
					authBusy: this.authBusy,
					authFailed: this.authFailed,
					allowOfficialFallback: this.form.field("allowOfficialFallback"),
					allowOfficialApiFallback: this.form.field("allowOfficialApiFallback"),
					allowOfficialFetchFallback: this.form.field("allowOfficialFetchFallback")
				};
			}
			/**
			* Build the face the page's slot registration injects.
			* @returns the page's snapshot and its form actions.
			*/
			inject() {
				const actions = this.form.actions();
				return {
					hooks: { searxngSearchCard: this.store },
					...actions,
					edit: (field, text) => {
						actions.edit(field, text);
						if (field === "baseURL" || field === "authHeaderName") this.refreshAuth();
					},
					resetField: (field) => {
						actions.resetField(field);
						if (field === "baseURL" || field === "authHeaderName") this.refreshAuth();
					},
					discard: () => {
						actions.discard();
						this.refreshAuth();
					},
					clearAuth: () => {
						this.clearAuth();
					}
				};
			}
			target() {
				return {
					baseURL: this.form.field("baseURL").text,
					headerName: this.form.field("authHeaderName").text
				};
			}
			async refreshAuth() {
				if (!this.auth || this.scope.getSnapshot().status !== "ready" || this.disposed) return;
				const revision = ++this.revision;
				this.authStatus = {
					endpoint: "",
					configured: false,
					writable: false
				};
				this.store.set(this.projection());
				try {
					const status = await this.auth.describe(this.target());
					if (this.disposed || revision !== this.revision) return;
					this.authStatus = status;
				} catch {
					if (this.disposed || revision !== this.revision) return;
				}
				this.store.set(this.projection());
			}
			async writeAuth(value) {
				if (!this.auth) return false;
				const revision = ++this.revision;
				const status = await this.auth.set(this.target(), value);
				if (!this.disposed && revision === this.revision) this.authStatus = status;
				return status.configured;
			}
			async clearAuth() {
				if (!this.auth || this.authBusy || this.form.shell().dirty || !this.authStatus.writable) return;
				this.authBusy = true;
				this.authFailed = false;
				const revision = ++this.revision;
				this.store.set(this.projection());
				try {
					const status = await this.auth.clear(this.target());
					if (revision === this.revision) this.authStatus = status;
				} catch {
					this.authFailed = true;
				} finally {
					this.authBusy = false;
					if (!this.disposed) this.store.set(this.projection());
				}
			}
			/** Release configuration subscriptions. */
			dispose() {
				this.disposed = true;
				this.unsubscribe();
				this.form.dispose();
			}
		};
		//#endregion
		//#region src/runtime-types.ts
		function parseRouteRestoreResult(value) {
			if (!value || typeof value !== "object" || ![
				"restored",
				"changed",
				"blocked",
				"read-only",
				"unavailable",
				"failed"
			].includes(Reflect.get(value, "outcome"))) throw new Error("Invalid route restoration result");
			const routing = Reflect.get(value, "routing");
			if (!routing) throw new Error("Invalid route restoration snapshot");
			parseServiceStatus({
				phase: "idle",
				endpoint: "",
				message: "",
				logs: "",
				routing
			});
			return value;
		}
		/** Validate the precheck snapshot received over the authenticated Connection carrier. */
		function parsePrecheckReport(value) {
			if (typeof value !== "object" || value === null || typeof Reflect.get(value, "time") !== "string") throw new Error("Invalid download precheck response");
			const targets = Reflect.get(value, "targets");
			if (!Array.isArray(targets) || targets.length < 1 || targets.length > 8) throw new Error("Invalid download precheck response");
			for (const target of targets) {
				if (typeof target !== "object" || target === null) throw new Error("Invalid download precheck target");
				const name = Reflect.get(target, "name"), url = Reflect.get(target, "url"), detail = Reflect.get(target, "detail");
				if (typeof name !== "string" || !name || name.length > 100 || typeof url !== "string" || !url.startsWith("https://") || url.length > 300 || typeof Reflect.get(target, "ok") !== "boolean" || typeof detail !== "string" || detail.length > 200 || !Number.isInteger(Reflect.get(target, "elapsedMs")) || Reflect.get(target, "elapsedMs") < 0) throw new Error("Invalid download precheck target");
			}
			return value;
		}
		/** Validate the diagnostic response without admitting executable source links. */
		function parseSearchTestReport(value) {
			if (typeof value !== "object" || value === null) throw new Error("Invalid search test response");
			const report = value;
			validateInstanceId(report.instanceId);
			for (const key of [
				"time",
				"query",
				"endpoint",
				"engines",
				"language",
				"message"
			]) if (typeof report[key] !== "string" || report[key].length > 4e3) throw new Error("Invalid search test text");
			if (![
				"success",
				"empty",
				"failed"
			].includes(report.outcome) || ![
				null,
				"configuration",
				"authentication",
				"connection",
				"http",
				"response",
				"cancelled"
			].includes(report.failureStage) || ![
				"json",
				"invalid",
				"unavailable"
			].includes(report.responseFormat) || typeof report.authUsed !== "boolean" || report.officialFallbackUsed !== false || !Number.isInteger(report.elapsedMs) || report.elapsedMs < 0 || !Number.isInteger(report.sourceCount) || report.sourceCount < 0 || report.httpStatus !== null && (!Number.isInteger(report.httpStatus) || report.httpStatus < 100 || report.httpStatus > 599) || !Array.isArray(report.sources) || report.sources.length > 3) throw new Error("Invalid search test response");
			for (const source of report.sources) if (typeof source !== "object" || source === null || typeof source.url !== "string" || !URL.canParse(source.url) || !["http:", "https:"].includes(new URL(source.url).protocol) || new URL(source.url).username || new URL(source.url).password || source.title !== void 0 && typeof source.title !== "string") throw new Error("Invalid search test source");
			return report;
		}
		/** Validate a response received over the authenticated Connection carrier. */
		function parseServiceStatus(value) {
			if (typeof value !== "object" || value === null) throw new Error("Invalid service response");
			const phase = Reflect.get(value, "phase");
			if (![
				"idle",
				"needs-setup",
				"preparing",
				"starting",
				"ready",
				"stopped",
				"failed",
				"external"
			].includes(phase)) throw new Error("Invalid service phase");
			for (const key of [
				"endpoint",
				"message",
				"logs"
			]) if (typeof Reflect.get(value, key) !== "string") throw new Error(`Invalid service ${key}`);
			const status = value;
			if (status.routeRestore !== void 0 && (!status.routeRestore || typeof status.routeRestore !== "object" || ![
				"available",
				"read-only",
				"unavailable"
			].includes(status.routeRestore.capability) || typeof status.routeRestore.revision !== "string" || !/^[a-f0-9]{64}$/.test(status.routeRestore.revision))) throw new Error("Invalid route restoration capability");
			if (status.routing !== void 0) {
				if (!status.routing || typeof status.routing !== "object") throw new Error("Invalid routing status");
				for (const provider of [status.routing.searchProvider, status.routing.fetchProvider]) if (provider !== null && (typeof provider !== "string" || !/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(provider))) throw new Error("Invalid routing provider");
				for (const source of [status.routing.searchSource, status.routing.fetchSource]) if (source !== void 0 && ![
					"configuration",
					"environment",
					"automatic",
					"unavailable"
				].includes(source)) throw new Error("Invalid routing source");
				if (status.routing.fallback !== void 0 && (!status.routing.fallback || typeof status.routing.fallback !== "object" || [
					"searchApi",
					"fetchApi",
					"legacySearch"
				].some((key) => typeof Reflect.get(status.routing.fallback, key) !== "boolean"))) throw new Error("Invalid routing permissions");
			}
			validateInstanceId(status.instanceId);
			if (status.setupFailure !== void 0 && status.setupFailure !== "network") throw new Error("Invalid setup failure class");
			if (status.logStorage !== void 0) {
				const storage = status.logStorage;
				if (!storage || typeof storage !== "object" || typeof storage.failed !== "boolean" || !Number.isInteger(storage.bytes) || !Number.isInteger(storage.maxBytes) || storage.bytes < 0 || storage.maxBytes < 1 || storage.bytes > storage.maxBytes) throw new Error("Invalid runtime log storage");
			}
			if (status.setup !== void 0) {
				if (typeof status.setup !== "object" || status.setup === null || typeof status.setup.directory !== "string" || typeof status.setup.cached !== "boolean" || !Array.isArray(status.setup.components) || status.setup.components.length > 8) throw new Error("Invalid runtime disclosure");
				for (const component of status.setup.components) if (typeof component !== "object" || component === null || [
					"name",
					"version",
					"source"
				].some((key) => typeof Reflect.get(component, key) !== "string") || ![
					"sha256",
					"tool-managed",
					"package-index"
				].includes(component.verification)) throw new Error("Invalid runtime component");
			}
			if (status.activities !== void 0) {
				if (!Array.isArray(status.activities) || status.activities.length > 100) throw new Error("Invalid runtime activity");
				for (const activity of status.activities) if (typeof activity !== "object" || activity === null || [
					"time",
					"subject",
					"detail"
				].some((key) => typeof Reflect.get(activity, key) !== "string") || ![
					"download",
					"verify",
					"extract",
					"command",
					"cache",
					"configure",
					"ready",
					"stop",
					"cleanup",
					"test",
					"error"
				].includes(activity.kind)) throw new Error("Invalid runtime activity");
			}
			if (status.testReport !== void 0) parseSearchTestReport(status.testReport);
			return value;
		}
		function validateInstanceId(value) {
			if (value !== void 0 && (typeof value !== "string" || !/^[a-f0-9]{32}$/.test(value))) throw new Error("Invalid managed instance identity");
		}
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin. */
		const NS = "settings.webSearchSearxng";
		/** Required services (cordis fiber inject). */
		const inject = [
			"slots",
			"locale",
			"configForms",
			"connection"
		];
		/**
		* Mount the SearXNG search settings page while the Host serves its namespace.
		* @param ctx - the browser plugin context.
		*/
		function apply(ctx) {
			const connection = ctx.get("connection");
			const t = ctx.locale.bind(NS);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-settings-web-search-searxng: dictionaries");
			const authCall = async (method, target, value) => {
				const result = await connection.rpc.call("/api", `searxngRuntime/${method}`, { args: {
					target,
					...value === void 0 ? {} : { value }
				} });
				if (!result.ok) throw new Error("Instance authentication settings could not be updated");
				return parseInstanceAuthStatus(result.value);
			};
			const card = new SearxngSearchCardController(ctx.configForms.get(SEARXNG_SEARCH_NS), {
				describe: (target) => authCall("authDescribe", target),
				set: (target, value) => authCall("authSet", target, value),
				clear: (target) => authCall("authClear", target)
			});
			ctx.effect(() => () => {
				card.dispose();
			}, "ui-settings-web-search-searxng: form subscription");
			ctx.effect(() => ctx.configForms.whileServed([SEARXNG_SEARCH_NS], () => ctx.slots.inject("plugins.item", () => ctx.slots.register({
				name: "plugins.item",
				id: "web-search-searxng",
				order: 41,
				label: () => t("title"),
				locale: NS,
				inject: () => ({
					...card.inject(),
					async restoreRoutesCall(expectedRevision, signal) {
						const result = await connection.rpc.call("/api", "searxngRuntime/restoreRoutes", { args: { expectedRevision } }, signal);
						if (!result.ok) throw new Error("Route restoration could not be confirmed");
						return parseRouteRestoreResult(result.value);
					},
					async proxyCall(method, args) {
						const result = await connection.rpc.call("/api", `searxngRuntime/${method}`, { args });
						if (!result.ok) throw new Error("Proxy operation failed");
						return parseProxyResponse(result.value);
					},
					async serviceCall(method, signal) {
						const result = await connection.rpc.call("/api", `searxngRuntime/${method}`, { args: {} }, signal);
						if (!result.ok) throw new Error(result.error.message);
						if (method === "test") {
							if (!Number.isInteger(result.value) || typeof result.value !== "number" || result.value < 0) throw new Error("Invalid search test response");
							return result.value;
						}
						if (method === "testReport") return parseSearchTestReport(result.value);
						if (method === "precheck") return parsePrecheckReport(result.value);
						return parseServiceStatus(result.value);
					}
				})
			}, SearxngSearchCard))), "ui-settings-web-search-searxng: page");
		}
		//#endregion
		exports.NS = NS;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map