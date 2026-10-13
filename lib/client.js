window.__ModuleLoader__.load({
	id: "dsh-web-search-searxng",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/locales.ts
		/** English copy. */
		const en = {
			title: "SearXNG search",
			description: "Set up the self-hosted SearXNG search provider.",
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
			serviceTestResult: "Search succeeded; sources returned",
			serviceLogs: "Activity log",
			setupUv: "Downloading setup tool",
			setupSource: "Downloading SearXNG",
			setupPython: "Preparing Python",
			setupDependencies: "Installing dependencies",
			serviceNeedsSetup: "Awaiting first-use approval",
			servicePrepare: "Prepare and start",
			setupSummary: "First use downloads uv, standalone Python, SearXNG and its dependencies.",
			setupScope: "Downloaded programs run as your current user. Files stay in this profile; system Python and PATH are unchanged. A reusable cache starts automatically next time.",
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
			fallbackLabel: "Allow official fallback (may incur search fees)",
			fallbackHint: "Default off. DSH 0.2.1-alpha.2 has no official fallback API: enabling this option cannot start an official search, and failures report that limitation. A host with public searchWithProvider support can reuse its registered official provider after a failure; fees may apply. Cancellation never starts fallback.",
			routeHint: "This bundle selects SearXNG unless a later bundle, profile, home or CLI config overrides it. Disable the entire dsh-web-search-searxng bundle to restore the remaining route. Disabling only its provider row leaves the SearXNG route selected and searches fail. Saved instance settings are retained.",
			resetAll: "Reset all to defaults",
			currentVersion: "Installed version",
			checkUpdate: "Check for updates",
			checkingUpdate: "Checking…",
			updateAvailable: "New version available:",
			updateReleases: "Release notes",
			updateHowTo: "To update: run dsh plugin --profile <name> update dsh-web-search-searxng (or uninstall and reinstall from the Plugins page), then restart.",
			updateLatest: "You are on the latest version.",
			updateFailed: "Could not reach the GitHub releases page right now; please try again later."
		};
		/** Simplified Chinese copy. */
		const zh = {
			title: "SearXNG 搜索",
			description: "设置自托管的 SearXNG 搜索提供方。",
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
			serviceTestResult: "搜索成功，返回来源数",
			serviceLogs: "运行记录",
			setupUv: "正在下载安装工具",
			setupSource: "正在下载 SearXNG",
			setupPython: "正在准备 Python",
			setupDependencies: "正在安装依赖",
			serviceNeedsSetup: "等待首次准备确认",
			servicePrepare: "准备并启动",
			setupSummary: "首次使用将下载 uv、独立 Python、SearXNG 和所需依赖。",
			setupScope: "下载的程序以当前用户权限运行，文件保存在此 profile，不修改系统 Python 或 PATH。已有可用缓存时，下次自动启动。",
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
			fallbackLabel: "允许官方备用（可能产生搜索费用）",
			fallbackHint: "默认关闭。DSH 0.2.1-alpha.2 没有官方备用接口：勾选后也不会发起官方搜索，失败时会明确提示此限制。支持公开 searchWithProvider 的宿主可在失败后复用已注册的官方提供方，可能产生费用。取消请求不会启动备用。",
			routeHint: "此 bundle 默认选择 SearXNG，后续 bundle、profile、home 或 CLI 配置可覆盖路由。请禁用整个 dsh-web-search-searxng bundle 来恢复其余配置决定的路由；仅禁用提供方行会留下 SearXNG 路由并导致搜索失败。已保存的实例设置会保留。",
			resetAll: "全部恢复默认",
			currentVersion: "当前版本",
			checkUpdate: "检查更新",
			checkingUpdate: "正在检查…",
			updateAvailable: "发现新版本：",
			updateReleases: "发布说明",
			updateHowTo: "更新方式：运行 dsh plugin --profile <名称> update dsh-web-search-searxng（或在插件页卸载后重装），然后重启。",
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
				style: {
					border: 0,
					padding: 0,
					margin: 0,
					minWidth: 0
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("legend", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginBottom: 8
						},
						children: [props.t(props.label), props.state.overridden && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tag, {
							tone: "neutral",
							children: props.t("overridden")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
							variant: "outline",
							size: "sm",
							disabled: props.disabled,
							onClick: props.onReset,
							children: props.t("reset")
						})] })]
					}),
					props.children,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						id: `searxng-${props.label}-hint`,
						style: {
							fontSize: 12,
							opacity: .7
						},
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
					ENGINE_GROUPS.map((group) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						role: "group",
						"aria-label": props.t(group.label),
						style: { marginBottom: 12 },
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							style: {
								margin: "0 0 6px",
								fontSize: 12,
								opacity: .7
							},
							children: props.t(group.label)
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							style: {
								display: "grid",
								gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
								gap: "6px 16px",
								listStyle: "none",
								margin: 0,
								padding: 0
							},
							children: group.engines.map(([name, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: selected.includes(name),
									disabled: props.disabled,
									onChange: (event) => toggle(name, event.currentTarget.checked)
								}), label]
							}) }, name))
						})]
					}, group.label)),
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
		* @module dsh-web-search-searxng/client/update-check
		*/
		/**
		* This package's own version. Bump with package.json (the provider's
		* USER_AGENT follows the same rule).
		*/
		const CURRENT_VERSION = "0.3.2";
		/** GitHub repository hosting the plugin's releases. */
		const REPO = "Chaos-Paradox/dsh-web-search-searxng";
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
				return compareVersions(tag, "0.3.2") > 0 ? {
					kind: "newer",
					latest: tag.replace(/^v/i, "")
				} : { kind: "latest" };
			} catch {
				return { kind: "unknown" };
			}
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
		function ServicePanel({ call, t, writable }) {
			const [status, setStatus] = (0, react.useState)({
				phase: "idle",
				endpoint: "",
				message: "",
				logs: ""
			});
			const [error, setError] = (0, react.useState)("");
			const [pollError, setPollError] = (0, react.useState)("");
			const [report, setReport] = (0, react.useState)();
			const [testStartedAt, setTestStartedAt] = (0, react.useState)(0);
			const [cancelled, setCancelled] = (0, react.useState)(false);
			const [pending, setPending] = (0, react.useState)();
			const [recordOpen, setRecordOpen] = (0, react.useState)(false);
			const [reportOpen, setReportOpen] = (0, react.useState)(false);
			const [confirmCleanup, setConfirmCleanup] = (0, react.useState)(false);
			const [copyState, setCopyState] = (0, react.useState)("idle");
			const lifetime = (0, react.useRef)(void 0);
			const testController = (0, react.useRef)(void 0);
			(0, react.useEffect)(() => {
				if (!call) return;
				const controller = new AbortController();
				lifetime.current = controller;
				setPending(void 0);
				let timer;
				const poll = async () => {
					try {
						const next = await call("status", AbortSignal.any([controller.signal, AbortSignal.timeout(1e4)]));
						if (!controller.signal.aborted && typeof next !== "number" && "phase" in next) {
							setStatus(next);
							setPollError("");
						}
					} catch (e) {
						if (!controller.signal.aborted) setPollError(String(e));
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
			}, [call]);
			const action = async (method) => {
				const controller = lifetime.current;
				if (!call || !controller) return;
				setPending(method);
				setError("");
				setCopyState("idle");
				if (method === "prepare" || method === "restart") setRecordOpen(true);
				const operation = new AbortController();
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
					if (typeof next !== "number" && "phase" in next) setStatus(next);
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
			const stage = Object.hasOwn(stages, status.message) ? t(stages[status.message]) : status.message;
			const activityText = (status.activities ?? []).map((event) => event.time + " " + t(activityLabels[event.kind]) + " " + event.subject + "\n" + event.detail).join("\n\n");
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				"aria-label": t("serviceTitle"),
				style: { marginBottom: 20 },
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						role: "status",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
							t("serviceTitle"),
							": ",
							t(labels[status.phase])
						] }), stage ? " · " + stage : ""]
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
						style: {
							padding: 12,
							marginBottom: 12,
							background: "var(--dsw-alias-bg-layer-2)",
							borderRadius: 8
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("setupSummary") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: secondary,
								children: t("setupScope")
							}),
							status.setup && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
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
							components
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							gap: 8,
							flexWrap: "wrap",
							margin: "12px 0"
						},
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
						children: currentReport.outcome === "failed" ? t("testFailed") : currentReport.outcome === "empty" ? t("testEmpty") : t("serviceTestResult") + ": " + currentReport.sourceCount
					}),
					(error || pollError) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						role: "alert",
						children: error || pollError
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
						open: recordOpen,
						onToggle: (event) => setRecordOpen(event.currentTarget.open),
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("serviceLogs") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: secondary,
								children: t("activitySession")
							}),
							(status.activities ?? []).length ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ol", {
								style: {
									...secondary,
									paddingLeft: 20
								},
								children: status.activities.map((event, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
									style: { margin: "10px 0" },
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("time", { children: new Date(event.time).toLocaleTimeString() }),
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
											children: event.detail
										})
									]
								}, event.time + index))
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: secondary,
								children: t("activityEmpty")
							}),
							status.logs && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("diagnosticOutput") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("pre", {
								style: {
									...secondary,
									whiteSpace: "pre-wrap",
									overflowWrap: "anywhere",
									maxHeight: 240,
									overflow: "auto"
								},
								children: status.logs
							})] }),
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
			});
		}
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
			const fallbackAllowed = state.allowOfficialFallback.text === "true";
			const disabled = !state.available || !state.writable || state.saving;
			const fields = [
				state.mode,
				state.managedPort,
				state.baseURL,
				state.engines,
				state.language,
				state.authEnabled,
				state.authHeaderName,
				state.allowOfficialFallback
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
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "searxng-settings",
				style: {
					fontSize: "var(--dsh-content-font-size, 14px)",
					lineHeight: 1.5
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("style", { children: ".searxng-settings p{margin:8px 0}.searxng-settings summary{font-size:var(--dsh-content-font-size-secondary,13px);cursor:pointer}.searxng-settings select{font:inherit;padding:4px 6px}.searxng-settings details{margin:10px 0}" }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(ServicePanel, {
						call: props.serviceCall,
						t,
						writable: state.available && state.writable
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.SettingsForm, {
						labels: formLabels(t),
						state,
						onSave: props.save,
						onDiscard: props.discard,
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
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("modeHint") }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: {
									display: "flex",
									alignItems: "center",
									gap: 8
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: fallbackAllowed,
									disabled,
									onChange: (event) => props.edit("allowOfficialFallback", String(event.currentTarget.checked)),
									"aria-describedby": "searxng-fallback-hint"
								}), t("fallbackLabel")]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("summary", { children: t("serviceBehavior") }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									id: "searxng-fallback-hint",
									children: t("fallbackHint")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("routeHint") })
							] }),
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
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: t("authDefaultHint") }),
							!local && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
								disabled: disabled || state.authBusy,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("legend", { children: t("authTitle") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
										style: {
											display: "flex",
											alignItems: "center",
											gap: 8
										},
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: state.authEnabled.text === "true",
											onChange: (event) => props.edit("authEnabled", String(event.currentTarget.checked)),
											"aria-describedby": "searxng-auth-hint"
										}), t("authEnabled")]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
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
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(EngineChoiceField, {
								t,
								state: state.engines,
								disabled,
								onEdit: (text) => props.edit("engines", text),
								onReset: () => props.resetField("engines")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(LanguageChoiceField, {
								t,
								state: state.language,
								disabled,
								onEdit: (text) => props.edit("language", text),
								onReset: () => props.resetField("language")
							}),
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
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8,
							flexWrap: "wrap",
							marginTop: 12
						},
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
					settingsSwitchField("allowOfficialFallback")
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
					allowOfficialFallback: this.form.field("allowOfficialFallback")
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
		/** Validate the diagnostic response without admitting executable source links. */
		function parseSearchTestReport(value) {
			if (typeof value !== "object" || value === null) throw new Error("Invalid search test response");
			const report = value;
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
					async serviceCall(method, signal) {
						const result = await connection.rpc.call("/api", `searxngRuntime/${method}`, { args: {} }, signal);
						if (!result.ok) throw new Error(result.error.message);
						if (method === "test") {
							if (!Number.isInteger(result.value) || typeof result.value !== "number" || result.value < 0) throw new Error("Invalid search test response");
							return result.value;
						}
						if (method === "testReport") return parseSearchTestReport(result.value);
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