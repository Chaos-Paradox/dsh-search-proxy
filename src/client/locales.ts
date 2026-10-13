/** Locale bundles for the SearXNG search provider's settings page. */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the page renders. */
export type SearxngSearchSettingsLocaleKey =
  | 'title' | 'description'
  | 'modeLabel' | 'modeAuto' | 'modeLocal' | 'modeExternal' | 'modeHint' | 'advanced' | 'managedPort' | 'managedPortHint'
  | 'serviceTitle' | 'serviceIdle' | 'servicePreparing' | 'serviceStarting' | 'serviceReady' | 'serviceStopped' | 'serviceFailed' | 'serviceExternal'
  | 'activeEndpoint' | 'serviceHint' | 'serviceRestart' | 'serviceStop' | 'serviceTest' | 'serviceTestResult' | 'serviceLogs'
  | 'setupUv' | 'setupSource' | 'setupPython' | 'setupDependencies'
  | 'serviceNeedsSetup' | 'servicePrepare' | 'setupSummary' | 'setupScope' | 'setupDirectory' | 'setupComponents'
  | 'verifyHash' | 'verifyTool' | 'verifyPackages' | 'runtimeDetails' | 'runtimeCleanup' | 'cleanupHint' | 'cleanupConfirm' | 'cleanupCancel'
  | 'activityEmpty' | 'activitySession' | 'activityDownload' | 'activityVerify' | 'activityExtract' | 'activityCommand' | 'activityCache' | 'activityConfigure' | 'activityReady' | 'activityStop' | 'activityCleanup' | 'activityTest' | 'activityError'
  | 'copyLog' | 'copiedLog' | 'copyFailed' | 'diagnosticOutput' | 'testReportTitle' | 'testRunning' | 'testCancel' | 'testHint' | 'testEmpty' | 'testFailed' | 'testElapsed' | 'testRequest' | 'testHttp' | 'testFormat' | 'testAuth' | 'testFallback' | 'testYes' | 'testNo' | 'testUnavailable'
  | 'testConfiguration' | 'testAuthentication' | 'testConnection' | 'testHttpFailure' | 'testResponse' | 'testCancelled' | 'serviceBehavior' | 'testSourceCount'
  | 'baseUrl' | 'baseUrlHint' | 'engines' | 'enginesHint' | 'language' | 'languageHint'
  | 'authTitle' | 'authEnabled' | 'authDefaultHint' | 'authHint' | 'authHeaderName' | 'authHeaderNameHint' | 'authHeaderInvalid'
  | 'authHeaderValue' | 'authHeaderValueHint' | 'authConfigured' | 'authNotConfigured' | 'authUnavailable' | 'authClear' | 'authClearFailed'
  | 'enginesDefault' | 'enginesSelected' | 'enginesWeb' | 'enginesNews' | 'enginesScience' | 'enginesKnowledge'
  | 'enginesCustom' | 'enginesCustomNames' | 'enginesCustomHint' | 'enginesCustomSelected'
  | 'languageDefault' | 'languageAll' | 'languageZhCN' | 'languageZhTW' | 'languageEn' | 'languageJa' | 'languageKo'
  | 'languageFr' | 'languageDe' | 'languageEs' | 'languageRu' | 'languageCustom' | 'languageCustomCode'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed' | 'invalidValue'
  | 'fallbackLabel' | 'fallbackHint'
  | 'routeHint' | 'resetAll'
  | 'currentVersion' | 'checkUpdate' | 'checkingUpdate'
  | 'updateAvailable' | 'updateReleases' | 'updateHowTo' | 'updateLatest' | 'updateFailed'

/** English copy. */
export const en: Record<SearxngSearchSettingsLocaleKey, string> = {
  title: 'SearXNG search',
  description: 'Set up the self-hosted SearXNG search provider.',
  modeLabel: 'Service mode', modeAuto: 'Automatic', modeLocal: 'Managed local service', modeExternal: 'Existing instance',
  modeHint: 'Save to apply. Automatic keeps an existing address; otherwise it selects local management.',
  advanced: 'Advanced settings', managedPort: 'Local port', managedPortHint: '0 automatically selects an available port. A specific occupied port reports an error. Saving a change restarts the local service.',
  serviceTitle: 'Search service', serviceIdle: 'Waiting', servicePreparing: 'Preparing first-use runtime', serviceStarting: 'Starting',
  serviceReady: 'Ready', serviceStopped: 'Stopped', serviceFailed: 'Failed', serviceExternal: 'Using existing instance',
  activeEndpoint: 'Active endpoint', serviceHint: 'Local service follows DSH. Existing instances are managed by their operator.',
  serviceRestart: 'Start / retry / restart', serviceStop: 'Stop', serviceTest: 'Test search', serviceTestResult: 'Search succeeded; sources returned', serviceLogs: 'Activity log',
  setupUv: 'Downloading setup tool', setupSource: 'Downloading SearXNG', setupPython: 'Preparing Python', setupDependencies: 'Installing dependencies',
  serviceNeedsSetup: 'Awaiting first-use approval', servicePrepare: 'Prepare and start',
  setupSummary: 'First use downloads uv, standalone Python, SearXNG and its dependencies.',
  setupScope: 'Downloaded programs run as your current user. Files stay in this profile; system Python and PATH are unchanged. A reusable cache starts automatically next time.',
  setupDirectory: 'Runtime directory', setupComponents: 'Downloads and verification',
  verifyHash: 'Pinned SHA-256', verifyTool: 'Managed by uv', verifyPackages: 'Installed from package index; no plugin-wide hash lock',
  runtimeDetails: 'Runtime and cleanup', runtimeCleanup: 'Clean runtime',
  cleanupHint: 'Stop ends the process and keeps downloaded files. Cleaning removes this plugin’s Python, source and cache; preferences and credentials remain. Uninstalling the plugin retains this runtime directory.',
  cleanupConfirm: 'Delete local runtime and cache', cleanupCancel: 'Cancel',
  activityEmpty: 'No activity yet.', activitySession: 'This DSH run · paths and credentials redacted',
  activityDownload: 'Download', activityVerify: 'Checksum verified', activityExtract: 'Extract', activityCommand: 'Execute', activityCache: 'Reuse cache', activityConfigure: 'Configure', activityReady: 'Service ready', activityStop: 'Process stopped', activityCleanup: 'Runtime cleaned', activityTest: 'Test query', activityError: 'Failed',
  copyLog: 'Copy activity log', copiedLog: 'Copied', copyFailed: 'Could not copy; select the log text instead.', diagnosticOutput: 'Process output',
  testReportTitle: 'Last search test', testRunning: 'Testing…', testCancel: 'Cancel test',
  testHint: 'Sends one “SearXNG” query using saved engines, language and optional authentication. This contacts upstream engines; it does not test every engine or use official fallback.',
  testEmpty: 'Request completed, but no usable sources returned.', testFailed: 'Search test failed', testElapsed: 'Elapsed', testRequest: 'Query and endpoint', testHttp: 'HTTP response', testFormat: 'Response format', testAuth: 'Request uses instance authentication', testFallback: 'Official fallback used', testYes: 'Yes', testNo: 'No', testUnavailable: 'No response', testSourceCount: 'Usable sources',
  testConfiguration: 'Check the saved endpoint and local service state.', testAuthentication: 'Check the saved authentication header, permissions and JSON access.', testConnection: 'Could not connect. Check that the instance is running and the address/port, network and certificate are correct.', testHttpFailure: 'The instance returned an HTTP error.', testResponse: 'The response could not be read as search JSON.', testCancelled: 'Test cancelled.', serviceBehavior: 'Routing and official fallback details',
  baseUrl: 'Instance endpoint',
  baseUrlHint: 'Existing-instance mode uses this address, or SEARXNG_BASE_URL when blank. Automatic mode prepares a local service when neither is set.',
  authTitle: 'Instance authentication (optional)',
  authEnabled: 'Send an authentication header to this instance',
  authDefaultHint: 'No API key is needed by default. The managed local service uses no instance authentication.',
  authHint: 'Enable only when your existing instance or its gateway requires a credential. This authenticates access to the instance; upstream engine API keys are configured in SearXNG. The plugin does not create a gateway or manage quotas.',
  authHeaderName: 'Authentication header name',
  authHeaderNameHint: 'Use the name supplied by the instance operator, for example X-API-Key or Authorization. Blank uses X-API-Key.',
  authHeaderInvalid: 'Enter a valid authentication header name, such as X-API-Key or Authorization. Request routing and JSON headers cannot be replaced.',
  authHeaderValue: 'Authentication header value',
  authHeaderValueHint: 'Enter the complete value, for example your token or Bearer followed by a space and your token. Saved values are never displayed; leave blank to keep the saved value. Credentials are bound to this endpoint and header name. Use HTTPS for remote services.',
  authConfigured: 'Saved for this instance', authNotConfigured: 'No saved value',
  authUnavailable: 'Enter a valid instance endpoint and header name first. If they are set, the DSH credential service may be unavailable or read-only.',
  authClear: 'Remove saved credential', authClearFailed: 'Could not remove the saved credential. Please try again.',
  engines: 'Engines',
  enginesHint: 'Choose multiple engines. These are common candidates, not a live list from your instance; names must exist and be enabled in your SearXNG configuration.',
  enginesDefault: 'No restriction: use the instance’s default engines.',
  enginesSelected: 'Search only the selected engines.',
  enginesWeb: 'Web · websites and general information',
  enginesNews: 'News · reporting and current events',
  enginesScience: 'Research · papers and preprints',
  enginesKnowledge: 'Technology and reference · repositories, Q&A and encyclopedias',
  enginesCustom: 'Other engines (custom names)',
  enginesCustomNames: 'Custom engine names',
  enginesCustomHint: 'Use the exact names from your instance, separated by commas. List selections are preserved.',
  enginesCustomSelected: 'Also selected',
  language: 'Result language',
  languageHint: 'Choose a preferred result language; instance default inherits your deployment configuration. Other languages can use a custom code.',
  languageDefault: 'Instance default',
  languageAll: 'All languages',
  languageZhCN: 'Simplified Chinese (zh-CN)',
  languageZhTW: 'Traditional Chinese (zh-TW)',
  languageEn: 'English (en)',
  languageJa: 'Japanese (ja)',
  languageKo: 'Korean (ko)',
  languageFr: 'French (fr)',
  languageDe: 'German (de)',
  languageEs: 'Spanish (es)',
  languageRu: 'Russian (ru)',
  languageCustom: 'Other language (custom code)',
  languageCustomCode: 'Custom language code',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidValue: 'Enter text, or leave blank to use the default.',
  fallbackLabel: 'Allow official fallback (may incur search fees)',
  fallbackHint: 'Default off. DSH 0.2.1-alpha.2 has no official fallback API: enabling this option cannot start an official search, and failures report that limitation. A host with public searchWithProvider support can reuse its registered official provider after a failure; fees may apply. Cancellation never starts fallback.',
  routeHint: 'This bundle selects SearXNG unless a later bundle, profile, home or CLI config overrides it. Disable the entire dsh-web-search-searxng bundle to restore the remaining route. Disabling only its provider row leaves the SearXNG route selected and searches fail. Saved instance settings are retained.',
  resetAll: 'Reset all to defaults',
  currentVersion: 'Installed version',
  checkUpdate: 'Check for updates',
  checkingUpdate: 'Checking…',
  updateAvailable: 'New version available:',
  updateReleases: 'Release notes',
  updateHowTo: 'To update: run dsh plugin --profile <name> update dsh-web-search-searxng (or uninstall and reinstall from the Plugins page), then restart.',
  updateLatest: 'You are on the latest version.',
  updateFailed: 'Could not reach the GitHub releases page right now; please try again later.',
}

/** Simplified Chinese copy. */
export const zh: Record<SearxngSearchSettingsLocaleKey, string> = {
  title: 'SearXNG 搜索',
  description: '设置自托管的 SearXNG 搜索提供方。',
  modeLabel: '服务模式', modeAuto: '自动选择', modeLocal: '本地自动托管', modeExternal: '连接已有实例',
  modeHint: '保存后生效。自动选择沿用已有地址；没有地址时选择本地托管。',
  advanced: '高级设置', managedPort: '本地端口', managedPortHint: '0 表示自动选择空闲端口。指定的端口被占用时会报错；保存端口修改会自动重启本地服务。',
  serviceTitle: '搜索服务', serviceIdle: '等待中', servicePreparing: '首次准备运行环境', serviceStarting: '正在启动',
  serviceReady: '可用', serviceStopped: '已停止', serviceFailed: '失败', serviceExternal: '使用已有实例',
  activeEndpoint: '当前地址', serviceHint: '本地服务随 DSH 运行；已有实例由部署者独立管理。',
  serviceRestart: '启动 / 重试 / 重启', serviceStop: '停止', serviceTest: '测试搜索', serviceTestResult: '搜索成功，返回来源数', serviceLogs: '运行记录',
  setupUv: '正在下载安装工具', setupSource: '正在下载 SearXNG', setupPython: '正在准备 Python', setupDependencies: '正在安装依赖',
  serviceNeedsSetup: '等待首次准备确认', servicePrepare: '准备并启动',
  setupSummary: '首次使用将下载 uv、独立 Python、SearXNG 和所需依赖。',
  setupScope: '下载的程序以当前用户权限运行，文件保存在此 profile，不修改系统 Python 或 PATH。已有可用缓存时，下次自动启动。',
  setupDirectory: '运行环境目录', setupComponents: '下载内容与校验方式',
  verifyHash: '固定 SHA-256 校验', verifyTool: '由 uv 管理下载', verifyPackages: '从包索引安装；插件未统一锁定全部依赖哈希',
  runtimeDetails: '运行环境与清理', runtimeCleanup: '清理运行环境',
  cleanupHint: '停止只结束进程，保留下载文件。清理删除本插件的 Python、源码与缓存，保留设置和凭据。卸载插件会保留此运行环境目录。',
  cleanupConfirm: '删除本地运行环境与缓存', cleanupCancel: '取消',
  activityEmpty: '尚无运行记录。', activitySession: '本次 DSH 运行 · 已隐藏本机路径和凭据',
  activityDownload: '下载', activityVerify: '校验通过', activityExtract: '解压', activityCommand: '执行', activityCache: '复用缓存', activityConfigure: '配置', activityReady: '服务可用', activityStop: '进程已停止', activityCleanup: '运行环境已清理', activityTest: '测试查询', activityError: '失败',
  copyLog: '复制运行记录', copiedLog: '已复制', copyFailed: '未能复制，请选择日志文本复制。', diagnosticOutput: '进程输出',
  testReportTitle: '最近测试报告', testRunning: '测试中…', testCancel: '取消测试',
  testHint: '按已保存的引擎、语言与可选鉴权查询一次“SearXNG”，会访问上游搜索引擎；不逐个测试全部引擎，不调用官方备用。',
  testEmpty: '请求已完成，但没有返回可用来源。', testFailed: '测试搜索失败', testElapsed: '耗时', testRequest: '查询与地址', testHttp: 'HTTP 响应', testFormat: '响应格式', testAuth: '请求使用实例鉴权', testFallback: '已调用官方备用', testYes: '是', testNo: '否', testUnavailable: '未收到响应', testSourceCount: '可用来源数',
  testConfiguration: '请检查已保存的实例地址与本地服务状态。', testAuthentication: '请检查已保存的鉴权请求头、访问权限与 JSON 接口。', testConnection: '无法连接。请检查实例是否运行，以及地址、端口、网络和证书。', testHttpFailure: '实例返回了 HTTP 错误。', testResponse: '响应无法作为搜索 JSON 读取。', testCancelled: '测试已取消。', serviceBehavior: '路由与官方备用说明',
  baseUrl: '实例地址',
  baseUrlHint: '已有实例模式使用此地址，留空则使用 SEARXNG_BASE_URL；自动选择模式下，两者都未设置时自动准备本地服务。',
  authTitle: '实例鉴权（可选）',
  authEnabled: '向此实例发送鉴权请求头',
  authDefaultHint: '默认无需 API Key，本地自动托管服务不使用实例鉴权。',
  authHint: '仅当已有实例或其网关要求访问凭证时开启。此凭证用于访问实例；上游搜索引擎的 API Key 仍在 SearXNG 中配置。插件不会建立网关或管理调用额度。',
  authHeaderName: '鉴权请求头名称',
  authHeaderNameHint: '按实例提供方的要求填写，例如 X-API-Key 或 Authorization；留空使用 X-API-Key。',
  authHeaderInvalid: '请填有效的鉴权请求头名称，例如 X-API-Key 或 Authorization；不能覆盖请求路由及 JSON 格式请求头。',
  authHeaderValue: '鉴权请求头值',
  authHeaderValueHint: '填写完整值，例如令牌，或 Bearer 加空格再加令牌。保存的值不会回显，留空保留已有值。凭据绑定此实例地址和请求头名称，远端服务应使用 HTTPS。',
  authConfigured: '已为此实例保存', authNotConfigured: '未保存凭据',
  authUnavailable: '请先填写有效的实例地址和请求头名称；若已填写，可能是 DSH 凭据服务不可用或只读。',
  authClear: '移除已保存凭据', authClearFailed: '未能移除已保存凭据，请重试。',
  engines: '引擎',
  enginesHint: '可多选。这里是常用候选，并非实例的实时清单；引擎名须在你的 SearXNG 配置中存在且已启用。',
  enginesDefault: '未限制引擎：使用实例默认配置。',
  enginesSelected: '仅搜索勾选的引擎。',
  enginesWeb: '通用网页 · 网站与综合资料',
  enginesNews: '新闻资讯 · 报道与近期事件',
  enginesScience: '学术研究 · 论文与预印本',
  enginesKnowledge: '技术与百科 · 代码仓库、问答与百科资料',
  enginesCustom: '其他引擎（自定义名称）',
  enginesCustomNames: '自定义引擎名称',
  enginesCustomHint: '填写实例中的准确名称，多个名称用逗号分隔；列表中勾选的引擎会保留。',
  enginesCustomSelected: '另外已选择',
  language: '结果语言',
  languageHint: '选择偏好的结果语言；「实例默认」沿用部署配置，其他语言可填写自定义代码。',
  languageDefault: '实例默认',
  languageAll: '不限语言',
  languageZhCN: '简体中文（zh-CN）',
  languageZhTW: '繁体中文（zh-TW）',
  languageEn: '英语（en）',
  languageJa: '日语（ja）',
  languageKo: '韩语（ko）',
  languageFr: '法语（fr）',
  languageDe: '德语（de）',
  languageEs: '西班牙语（es）',
  languageRu: '俄语（ru）',
  languageCustom: '其他语言（自定义代码）',
  languageCustomCode: '自定义语言代码',
  overridden: '已覆盖',
  reset: '恢复默认',
  readOnly: '本部署的设置为只读。',
  unavailable: '该插件当前未加载，暂时无法配置。',
  save: '保存',
  saving: '保存中…',
  saveFailed: '本部署没有接受这些值，已保留供你修改。',
  invalidValue: '请填文本；留空表示使用默认值。',
  fallbackLabel: '允许官方备用（可能产生搜索费用）',
  fallbackHint: '默认关闭。DSH 0.2.1-alpha.2 没有官方备用接口：勾选后也不会发起官方搜索，失败时会明确提示此限制。支持公开 searchWithProvider 的宿主可在失败后复用已注册的官方提供方，可能产生费用。取消请求不会启动备用。',
  routeHint: '此 bundle 默认选择 SearXNG，后续 bundle、profile、home 或 CLI 配置可覆盖路由。请禁用整个 dsh-web-search-searxng bundle 来恢复其余配置决定的路由；仅禁用提供方行会留下 SearXNG 路由并导致搜索失败。已保存的实例设置会保留。',
  resetAll: '全部恢复默认',
  currentVersion: '当前版本',
  checkUpdate: '检查更新',
  checkingUpdate: '正在检查…',
  updateAvailable: '发现新版本：',
  updateReleases: '发布说明',
  updateHowTo: '更新方式：运行 dsh plugin --profile <名称> update dsh-web-search-searxng（或在插件页卸载后重装），然后重启。',
  updateLatest: '已是最新版本。',
  updateFailed: '暂时无法访问 GitHub 发布页，请稍后再试。',
}

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: SearxngSearchSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}
