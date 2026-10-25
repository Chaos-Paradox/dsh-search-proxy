import z from "@deepseek-ai/schemastery";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { WebError } from "@deepseek-ai/dsh-web";
import { homedir } from "node:os";
import { credentialKey, credentialRef } from "@deepseek-ai/dsh-credentials";
import { join } from "node:path";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { createHash, randomBytes } from "node:crypto";
import { access, chmod, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import lockfile from "proper-lockfile";
import { x } from "tar";
import { unzipSync } from "fflate";
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
/** Fetch accepts Latin-1 header values; reject control characters without echoing a secret. */
function validAuthHeaderValue(value) {
	return value.length > 0 && value.length <= 8192 && /^[\t\x20-\x7e\x80-\xff]+$/.test(value);
}
//#endregion
//#region src/runtime-log.ts
/** Redaction for operator logs; never records the subprocess environment. */
/** Remove owned paths, common credential syntax and known inherited secrets. */
function redactRuntimeLog(text, directory, secrets = []) {
	let result = text;
	if (directory) for (const path of [
		directory,
		directory.replaceAll("\\", "/"),
		JSON.stringify(directory).slice(1, -1)
	]) result = result.replaceAll(path, "<profile>/searxng");
	const inherited = Object.entries(process.env).filter(([key, value]) => /key|token|secret|password|authorization/i.test(key) && value && value.length >= 8).map(([, value]) => value);
	for (const secret of [...secrets, ...inherited]) if (secret) for (const form of [
		secret,
		encodeURIComponent(secret),
		JSON.stringify(secret).slice(1, -1)
	]) result = result.replaceAll(form, "[redacted]");
	result = result.replace(/(https?:\/\/)[^\s/@]+:[^\s/@]*@/gi, "$1[redacted]@").replace(/([?&](?:api[-_]?key|token|access_token|secret|password)=)[^&#\s]*/gi, "$1[redacted]").replace(/((?:authorization|x-api-key|secret_key|password)\s*[:=]\s*)[^\r\n]+/gi, "$1[redacted]").replace(/\bBearer\s+[^\s"']+/gi, "Bearer [redacted]");
	for (const path of [
		homedir(),
		homedir().replaceAll("\\", "/"),
		JSON.stringify(homedir()).slice(1, -1)
	]) result = result.replaceAll(path, "~");
	return result;
}
//#endregion
//#region src/provider.ts
/**
* SearXNG metasearch through the instance's JSON API (`GET {baseURL}/search?format=json`).
* SearXNG is self-hosted, so the endpoint is deployment configuration — never a
* model-chosen value — and may legitimately be a loopback or private-network
* address. Optional instance credentials are resolved on the backend;
* redirects fail so queries and credentials never follow a Location target.
* @module dsh-search-proxy/provider
*/
/** Stable id this provider registers under. */
const SEARXNG_PROVIDER_ID = "searxng";
/** Attribution header sent on every request. Bump with the package version. */
const USER_AGENT = "dsh-search-proxy/0.5.0";
/**
* Map one SearXNG result to a normalized source, or `undefined` when the entry
* carries no usable URL. Engines disagree on which fields they return, so
* `title`, `content` (as `snippet`), and `publishedDate` (as `publishedAt`)
* attach only when present and non-blank; a URL-only source stays valid because
* the seam's citation shape permits it.
*
* @param entry - one entry of SearXNG's `results[]`.
* @returns the normalized source, or `undefined` for an entry without a usable URL.
*/
function mapSearxngResult(entry) {
	if (typeof entry.url !== "string" || entry.url.trim().length === 0) return void 0;
	return {
		url: entry.url,
		...typeof entry.title === "string" && entry.title.length > 0 ? { title: entry.title } : {},
		...typeof entry.content === "string" && entry.content.trim().length > 0 ? { snippet: entry.content } : {},
		...typeof entry.publishedDate === "string" && entry.publishedDate.length > 0 ? { publishedAt: entry.publishedDate } : {}
	};
}
/**
* Map a SearXNG response envelope to a normalized search result. SearXNG
* returns no generated answer the seam could vouch for, so `content` is
* omitted. The web service owns the final `maxResults` truncation, so
* `truncated` is always `false` here.
*
* @param response - the parsed search response body.
* @returns the normalized result with URL-less entries dropped.
* @throws {@link WebError} when a present `results` field is not an array.
*/
function mapSearxngResponse(response) {
	if (response.results !== void 0 && !Array.isArray(response.results)) throw new WebError("SearXNG returned a malformed results field", "WEB_PROVIDER_ERROR");
	return {
		sources: (response.results ?? []).map(mapSearxngResult).filter((source) => source !== void 0),
		truncated: false
	};
}
/**
* The SearXNG-backed search provider. HTTP redirects fail as `WEB_PROVIDER_ERROR`;
* 401/403 distinguish possible authentication failures from disabled JSON output.
*/
var SearxngSearchProvider = class {
	resolveOptions;
	resolveAuth;
	id = SEARXNG_PROVIDER_ID;
	/**
	* @param resolveOptions - the options for the NEXT operation, snapshotted
	* once at each operation's entry so one search never mixes two sections. A
	* thunk rather than a value because the plugin's settings section can change
	* between searches, and re-registering the provider to carry a new endpoint
	* would make the seam's selection observable to the user as a flicker.
	*/
	constructor(resolveOptions, resolveAuth) {
		this.resolveOptions = resolveOptions;
		this.resolveAuth = resolveAuth;
	}
	available() {
		const options = this.resolveOptions();
		return options.baseURL.length > 0 && URL.canParse(options.baseURL);
	}
	async search(request, signal) {
		return this.performSearch(request, signal);
	}
	/** Run one real operator query; no fallback, credential value or raw exception is returned. */
	async testReport(signal) {
		const started = Date.now();
		const secrets = [];
		const report = {
			time: new Date(started).toISOString(),
			query: "SearXNG",
			endpoint: "",
			engines: "",
			language: "",
			authUsed: false,
			officialFallbackUsed: false,
			outcome: "failed",
			failureStage: "configuration",
			httpStatus: null,
			responseFormat: "unavailable",
			elapsedMs: 0,
			sourceCount: 0,
			sources: [],
			message: ""
		};
		try {
			const result = await this.performSearch({
				query: report.query,
				maxResults: 3
			}, signal, report, secrets);
			report.failureStage = null;
			const usable = result.sources.filter((source) => URL.canParse(source.url) && ["http:", "https:"].includes(new URL(source.url).protocol));
			report.outcome = usable.length ? "success" : "empty";
			report.sourceCount = usable.length;
			report.sources = usable.slice(0, 3).map((source) => {
				const url = new URL(source.url);
				url.username = "";
				url.password = "";
				return {
					url: redactRuntimeLog(url.toString(), "", secrets),
					...source.title ? { title: redactRuntimeLog(source.title, "", secrets).slice(0, 1e3) } : {}
				};
			}).filter((source) => URL.canParse(source.url) && ["http:", "https:"].includes(new URL(source.url).protocol));
		} catch (error) {
			if (signal?.aborted || error instanceof WebError && error.code === "WEB_ABORTED") report.failureStage = "cancelled";
			report.message = report.failureStage === "connection" ? connectionFailure(error) : "";
		}
		report.elapsedMs = Math.max(0, Date.now() - started);
		for (const key of [
			"query",
			"endpoint",
			"engines",
			"language",
			"message"
		]) report[key] = redactRuntimeLog(report[key], "", secrets).slice(0, 4e3);
		return report;
	}
	async performSearch(request, signal, report, reportSecrets) {
		const options = this.resolveOptions();
		if (report) {
			const target = URL.canParse(options.baseURL) ? searchUrl(options.baseURL.trim()) : void 0;
			report.endpoint = target ? `${target.origin}${target.pathname}` : "";
			report.engines = options.engines ?? "";
			report.language = options.language ?? "";
			report.failureStage = options.authEnabled ? "authentication" : "configuration";
		}
		let headers = {
			accept: "application/json",
			"user-agent": USER_AGENT
		};
		if (options.authEnabled) try {
			if (!this.resolveAuth) throw new Error("Instance authentication is enabled but no credential resolver is available");
			const auth = await this.resolveAuth(options);
			if (!validAuthHeaderName(auth.name) || !validAuthHeaderValue(auth.value)) throw new Error("Invalid instance authentication header; correct the name and value on the plugin card");
			headers = {
				...headers,
				[auth.name.toLowerCase()]: auth.value
			};
			reportSecrets?.push(auth.value);
			if (report) report.authUsed = true;
		} catch {
			if (signal?.aborted) throw new WebError("SearXNG search aborted", "WEB_ABORTED");
			throw new WebError("SearXNG instance authentication is not ready; check the endpoint, header name and saved value on the plugin card, or disable authentication", "WEB_PROVIDER_ERROR");
		}
		if (signal?.aborted) throw new WebError("SearXNG search aborted", "WEB_ABORTED");
		const url = searchUrl(options.baseURL.trim());
		url.searchParams.set("q", request.query);
		url.searchParams.set("format", "json");
		if (options.engines !== void 0 && options.engines.trim().length > 0) url.searchParams.set("engines", options.engines);
		if (options.language !== void 0 && options.language.trim().length > 0) url.searchParams.set("language", options.language);
		let response;
		if (report) report.failureStage = "connection";
		try {
			response = await fetch(url, {
				method: "GET",
				redirect: "error",
				headers,
				...signal !== void 0 ? { signal } : {}
			});
		} catch (error) {
			if (signal?.aborted === true || isAbortError(error)) throw new WebError("SearXNG search aborted", "WEB_ABORTED", options.authEnabled ? void 0 : { cause: error });
			if (options.authEnabled) throw new WebError("SearXNG search request failed; check the instance address, connection and authentication settings", "WEB_PROVIDER_ERROR");
			throw new WebError(`SearXNG search request failed: ${connectionFailure(error) || String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
		}
		if (report) {
			report.httpStatus = response.status;
			report.failureStage = response.status === 401 || response.status === 403 ? "authentication" : "http";
		}
		if (!response.ok) {
			let message = `SearXNG error (HTTP ${response.status})`;
			if (response.status === 401) message += "; the instance requires authentication or rejected the credential — check the authentication header name and saved value";
			if (response.status === 403) message += "; the instance may deny access or refuse JSON output — check authentication/permissions and enable the \"json\" format in search.formats";
			throw new WebError(message, "WEB_PROVIDER_ERROR");
		}
		try {
			if (report) {
				report.failureStage = "response";
				report.responseFormat = "invalid";
			}
			const result = mapSearxngResponse(await response.json());
			if (report) report.responseFormat = "json";
			return result;
		} catch (error) {
			if (signal?.aborted === true || isAbortError(error)) throw new WebError("SearXNG search aborted", "WEB_ABORTED", options.authEnabled ? void 0 : { cause: error });
			if (options.authEnabled) throw new WebError("SearXNG returned an unprocessable response body", "WEB_PROVIDER_ERROR");
			const message = error instanceof WebError ? error.message : `SearXNG returned an unprocessable response body: ${String(error)}`;
			throw new WebError(message, "WEB_PROVIDER_ERROR", { cause: error });
		}
	}
};
/** Read only whitelisted connection codes, including WebError's native fetch cause. */
function connectionFailure(error) {
	const codes = /* @__PURE__ */ new Set([
		"ECONNREFUSED",
		"ENOTFOUND",
		"EAI_AGAIN",
		"ETIMEDOUT",
		"UND_ERR_CONNECT_TIMEOUT",
		"CERT_HAS_EXPIRED",
		"DEPTH_ZERO_SELF_SIGNED_CERT",
		"ERR_TLS_CERT_ALTNAME_INVALID"
	]);
	const pending = [error];
	for (let index = 0; index < pending.length && index < 8; index++) {
		const value = pending[index];
		if (typeof value !== "object" || value === null) continue;
		const code = Reflect.get(value, "code");
		if (typeof code === "string" && codes.has(code)) return code;
		pending.push(Reflect.get(value, "cause"));
		const nested = Reflect.get(value, "errors");
		if (Array.isArray(nested)) pending.push(...nested.slice(0, 3));
	}
	return "";
}
/**
* Resolve the search endpoint under the configured base, preserving a subpath
* mount (`http://host/searxng` → `http://host/searxng/search`).
*
* @param baseURL - the configured instance base; `available()` guarantees it parses.
* @returns the absolute search URL without query parameters.
*/
function searchUrl(baseURL) {
	return new URL("search", baseURL.endsWith("/") ? baseURL : `${baseURL}/`);
}
/** True for a fetch/`AbortSignal` abort, surfaced as `WEB_ABORTED`. */
function isAbortError(error) {
	return error instanceof DOMException && error.name === "AbortError";
}
//#endregion
//#region src/fallback.ts
/**
* Opt-in official-route fallback. The default posture is strict: a failed
* SearXNG search fails loudly and the official route is never called, so an
* unnoticed failure cannot silently start billing the deployment. When the
* deployment explicitly enables `allowOfficialFallback`, one failed request
* degrades to the built-in DeepSeek provider for THAT REQUEST ONLY — the
* route itself never changes — and the result carries a bilingual notice so
* the model (and the user reading the tool output) sees that the fallback
* fired, why, and that extra cost may apply. Every degradation is recorded
* through the host logger with the actual provider and the failure reason.
* @module dsh-search-proxy/fallback
*/
/** Upper bound for the failure reason embedded in the model-visible notice. */
const REASON_MAX_CHARS = 200;
function aborted$1(signal) {
	return signal?.aborted === true;
}
/**
* Build the model-visible notice prepended to a degraded result's `content`.
* Bilingual on purpose: the notice feeds the model's tool result, and the
* model relays it to a user whose UI language this package cannot know.
* @param reason - the primary failure's message, truncated.
* @returns the notice text.
*/
function fallbackNotice(reason) {
	const trimmed = reason.length > REASON_MAX_CHARS ? `${reason.slice(0, REASON_MAX_CHARS)}…` : reason;
	return `⚠️ SearXNG search failed (${trimmed}); this request fell back to the official DeepSeek search — extra cost may apply, and the route itself was NOT changed.\n⚠️ SearXNG 搜索失败（${trimmed}），本次请求已降级到 DeepSeek 官方搜索——可能产生额外费用；路由本身未被更改。`;
}
/**
* The SearXNG provider with an opt-in per-request escape hatch. Registered
* under the SearXNG id: it IS the SearXNG route — the fallback never changes
* selection, it only answers one failed request through the official route
* when the deployment explicitly allowed it. Availability stays the primary's:
* an unconfigured endpoint means "search unavailable", never "silently serve
* everything from the official route".
*/
var SearxngFallbackProvider = class {
	primary;
	fallback;
	id = SEARXNG_PROVIDER_ID;
	/**
	* @param primary - the SearXNG provider every request tries first.
	* @param fallback - the per-request collaborators.
	*/
	constructor(primary, fallback) {
		this.primary = primary;
		this.fallback = fallback;
	}
	available() {
		return this.primary.available();
	}
	async search(request, signal) {
		try {
			return await this.primary.search(request, signal);
		} catch (error) {
			if (aborted$1(signal) || error instanceof WebError && error.code === "WEB_ABORTED") throw error;
			if (!this.fallback.enabled()) throw error;
			let official;
			try {
				official = await this.fallback.official();
			} catch (resolutionError) {
				if (aborted$1(signal)) throw error;
				const detail = resolutionError instanceof Error ? resolutionError.message : String(resolutionError);
				throw new WebError(`SearXNG search failed (${error instanceof Error ? error.message : String(error)}); official fallback unavailable (${detail}); no official request was made`, "WEB_PROVIDER_ERROR", { cause: error });
			}
			if (official === void 0 || !official.available()) throw error;
			const reason = error instanceof Error ? error.message : String(error);
			if (aborted$1(signal) || !this.fallback.enabled()) throw error;
			this.fallback.onAttempt(reason);
			let result;
			try {
				result = await official.search(request, signal);
			} catch (fallbackError) {
				if (aborted$1(signal) || fallbackError instanceof WebError && fallbackError.code === "WEB_ABORTED") throw fallbackError;
				const detail = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
				throw new WebError(`SearXNG search failed (${reason}); official fallback also failed (${detail}); the official attempt may incur search fees`, "WEB_PROVIDER_ERROR", { cause: fallbackError });
			}
			this.fallback.onDegraded({
				reason,
				at: (/* @__PURE__ */ new Date()).toISOString(),
				sources: result.sources.length
			});
			return {
				...result,
				content: `${fallbackNotice(reason)}\n\n${result.content ?? ""}`.trimEnd()
			};
		}
	}
};
/** Detect the public API needed for fallback without accessing provider registries.
* @param web Host web service.
* @returns Whether explicit provider dispatch is available.
*/
function supportsOfficialFallback(web) {
	return "searchWithProvider" in web && typeof web.searchWithProvider === "function";
}
/** Resolve an adapter to the host's registered official provider, never a new credentialed instance.
* Disabled, missing, or unavailable providers fail through the host's normal selection errors.
* @param ctx Plugin context supplying the web service.
* @returns Resolver for one official request without changing the default route.
*/
function createOfficialFallbackResolver(ctx) {
	return async () => {
		const web = ctx.web;
		if (!supportsOfficialFallback(web)) throw new WebError("this host does not expose web.searchWithProvider; DSH 0.2.1-alpha.2 cannot perform official fallback", "WEB_PROVIDER_CONFIGURED_MISSING");
		const search = web.searchWithProvider.bind(web);
		return {
			id: "deepseek-official",
			available: () => true,
			search: (request, signal) => search("deepseek-official", request, signal)
		};
	};
}
//#endregion
//#region src/host-configuration.ts
function hostConfiguration(ctx, namespace, redactSecrets = true) {
	const settings = ctx.get("settings");
	const loader = ctx.get("loader");
	const value = settings?.describe({ redactSecrets }).find((row) => row.ns === namespace)?.value ?? (loader ? [...loader.entries()].find((entry) => entry.options.id === namespace)?.fiber?.config : void 0);
	if (!value || typeof value !== "object" || Array.isArray(value)) return void 0;
	return Object.fromEntries(Object.entries(value).map(([key, field]) => [key, field && typeof field === "object" && typeof Reflect.get(field, "get") === "function" ? Reflect.get(field, "get").call(field) : field]));
}
//#endregion
//#region src/official-api.ts
const DEFAULT_BASE_URL = "https://api.deepseek.com/v1/tools";
const MAX_TEXT = 1e5;
const record = (value) => !!value && typeof value === "object" && !Array.isArray(value);
function aborted(signal) {
	if (signal?.aborted) throw new WebError("Official request cancelled", "WEB_ABORTED");
}
/** Uses the rc.2 API section when present; older hosts use the documented endpoint and shared key reference. */
async function prepareOfficialApi(ctx, operation = "search") {
	const config = hostConfiguration(ctx, "web-deepseek-api", false) ?? {};
	let base;
	try {
		base = new URL(typeof config.baseURL === "string" ? config.baseURL : DEFAULT_BASE_URL);
		if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error();
	} catch {
		throw new WebError("Invalid official Search/Fetch API configuration", "WEB_PROVIDER_ERROR");
	}
	const baseURL = base.href.replace(/\/+$/, "");
	const agents = ctx.get("agents");
	const account = ctx.get("deepseekAccount");
	let headers;
	try {
		const token = agents?.currentInitiator()?.session.requestContext()?.provider === "deepseek-account" ? await account?.resolveToken(`${baseURL}/${operation}`) : void 0;
		if (token) {
			if (!validAuthHeaderValue(token)) throw new Error();
			headers = { "x-dsh-auth-token": token };
		} else {
			const ref = credentialRef(typeof config.apiKeyEnv === "string" ? config.apiKeyEnv : "DEEPSEEK_API_KEY");
			const credentials = ctx.get("credentials");
			const key = typeof config.apiKey === "string" && config.apiKey ? config.apiKey : credentials ? (await credentials.resolve(ref))?.value : launchEnvironmentOf(ctx).get(ref)?.value;
			if (!key || !validAuthHeaderValue(key)) throw new Error();
			headers = { authorization: `Bearer ${key}` };
		}
	} catch {
		throw new WebError("Official Search/Fetch API credentials are unavailable; configure the DeepSeek API key or account", "WEB_PROVIDER_CREDENTIAL_MISSING");
	}
	async function request(operation, body, signal) {
		aborted(signal);
		const timeout = AbortSignal.timeout(2e4);
		const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
		let response;
		try {
			response = await fetch(`${baseURL}/${operation}`, {
				method: "POST",
				redirect: "error",
				signal: combined,
				headers: {
					...headers,
					"content-type": "application/json",
					accept: "application/json",
					"user-agent": "dsh-search-proxy"
				},
				body: JSON.stringify(body)
			});
			aborted(signal);
			if (!response.ok) {
				await response.body?.cancel();
				throw new WebError(`Official ${operation} API failed (HTTP ${response.status})`, "WEB_PROVIDER_ERROR");
			}
			const reader = response.body?.getReader();
			if (!reader) throw new Error();
			const decoder = new TextDecoder(), chunks = [];
			let bytes = 0;
			try {
				while (true) {
					const chunk = await reader.read();
					if (chunk.done) break;
					bytes += chunk.value.byteLength;
					if (bytes > 6e6) {
						await reader.cancel();
						throw new WebError("Official API response exceeds the size limit", "WEB_PROVIDER_ERROR");
					}
					chunks.push(decoder.decode(chunk.value, { stream: true }));
				}
				chunks.push(decoder.decode());
			} finally {
				reader.releaseLock();
			}
			aborted(signal);
			return JSON.parse(chunks.join(""));
		} catch (error) {
			aborted(signal);
			if (error instanceof WebError) throw error;
			throw new WebError(timeout.aborted ? "Official API request timed out" : "Official API request or response failed", "WEB_PROVIDER_ERROR");
		}
	}
	return {
		search: {
			id: "deepseek-search-api",
			available: () => true,
			async search(input, signal) {
				if (!input.query.trim() || [...input.query].length > 128) throw new WebError("Official Search API requires a query of 1–128 characters", "WEB_PROVIDER_ERROR");
				if (input.maxResults !== void 0 && (!Number.isInteger(input.maxResults) || input.maxResults < 0)) throw new WebError("Invalid official search result limit", "WEB_PROVIDER_ERROR");
				if (input.maxResults === 0) return {
					sources: [],
					truncated: false
				};
				const configuredCount = Number.isInteger(config.count) ? Number(config.count) : 10;
				const count = Math.min(50, Math.max(1, configuredCount), Math.max(1, input.maxResults ?? 50));
				const payload = await request("search", {
					query: input.query,
					count,
					need_content: false
				}, signal);
				if (!record(payload) || !Array.isArray(payload.results)) throw new WebError("Official Search API returned invalid results", "WEB_PROVIDER_ERROR");
				const sources = [];
				for (const result of payload.results) {
					if (!record(result) || typeof result.url !== "string" || !URL.canParse(result.url)) continue;
					const url = new URL(result.url);
					if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) continue;
					sources.push({
						url: result.url,
						...typeof result.title === "string" ? { title: result.title } : {},
						...typeof result.snippet === "string" ? { snippet: result.snippet } : {},
						...typeof result.date === "string" ? { publishedAt: result.date } : {}
					});
				}
				const limit = Math.max(0, input.maxResults ?? count);
				return {
					sources: sources.slice(0, limit),
					truncated: sources.length > limit
				};
			}
		},
		fetch: {
			id: "deepseek-fetch-api",
			available: () => true,
			async fetch(input, signal) {
				if (input.url.length > 8192 || !URL.canParse(input.url)) throw new WebError("Invalid URL for the official Fetch API", "WEB_INVALID_URL");
				const url = new URL(input.url);
				if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new WebError("Invalid URL for the official Fetch API", "WEB_INVALID_URL");
				const payload = await request("fetch", { url: input.url }, signal);
				if (!record(payload) || typeof payload.content !== "string" || !payload.content.trim()) throw new WebError("Official Fetch API returned no readable content", "WEB_PROVIDER_ERROR");
				return {
					url: input.url,
					statusCode: 200,
					body: {
						kind: "text",
						content: payload.content.slice(0, MAX_TEXT)
					},
					truncated: payload.content.length > MAX_TEXT
				};
			}
		}
	};
}
//#endregion
//#region src/fetch-fallback.ts
const SEARXNG_FETCH_PROVIDER_ID = "searxng-http";
/** Bounded detection of common verification pages; ordinary article text is not scanned for keywords. */
function isVerificationPage(content) {
	const opening = content.slice(0, 8192);
	return /<title[^>]*>\s*(?:just a moment|attention required|checking your browser|verify (?:you are|you're) human)[^<]*<\/title>/i.test(opening) || /\bcf-chl-(?:widget|opt|bypass|managed|challenge)/i.test(opening) || /^\s*#{0,2}\s*(?:just a moment|checking your browser|verify (?:you are|you're) human)[.!…\s]*$/im.test(opening.slice(0, 500));
}
function fetchFallbackNotice(reason) {
	return `⚠️ Local fetch failed (${reason}); one official DeepSeek Fetch API retry was used; fees may apply.\n⚠️ 本地抓取失败（${reason}），本次已通过 DeepSeek 官方 Fetch API 重试一次，可能产生费用。`;
}
var HttpFallbackProvider = class {
	primary;
	enabled;
	official;
	onAttempt;
	id = SEARXNG_FETCH_PROVIDER_ID;
	constructor(primary, enabled, official, onAttempt) {
		this.primary = primary;
		this.enabled = enabled;
		this.official = official;
		this.onAttempt = onAttempt;
	}
	available() {
		try {
			return this.primary()?.available() === true;
		} catch {
			return false;
		}
	}
	async fetch(request, signal) {
		const primary = this.primary();
		if (!primary) throw new WebError("The public host HTTP fetch provider is unavailable", "WEB_PROVIDER_CONFIGURED_UNAVAILABLE");
		let reason, original;
		try {
			const result = await primary.fetch(request, signal);
			const retryStatus = [
				403,
				408,
				429
			].includes(result.statusCode) || result.statusCode >= 500;
			const verification = isVerificationPage(result.body.content);
			if (!this.enabled() || !retryStatus && !verification) return result;
			reason = verification ? "verification page" : `HTTP ${result.statusCode}`;
			original = new WebError(`Local fetch returned ${reason}`, "WEB_PROVIDER_ERROR");
		} catch (error) {
			const code = error && typeof error === "object" ? Reflect.get(error, "code") : void 0;
			if (signal?.aborted || !this.enabled() || !["WEB_PROVIDER_ERROR", "WEB_FETCH_TIMEOUT"].includes(code)) throw error;
			reason = code;
			original = error;
		}
		if (signal?.aborted || !this.enabled()) throw original;
		let official;
		try {
			official = await this.official();
		} catch {
			throw new WebError(`Local fetch failed (${reason}); official Fetch API credentials or configuration are unavailable; no official request was made`, "WEB_PROVIDER_ERROR", { cause: original });
		}
		if (signal?.aborted || !this.enabled()) throw original;
		this.onAttempt(reason);
		try {
			const result = await official.fetch(request, signal);
			if (isVerificationPage(result.body.content)) throw new WebError("Official Fetch API also returned a verification page", "WEB_PROVIDER_ERROR");
			const content = `${fetchFallbackNotice(reason)}\n\n${result.body.content}`;
			return {
				...result,
				body: {
					kind: "text",
					content: content.slice(0, 1e5)
				},
				truncated: result.truncated || content.length > 1e5
			};
		} catch (error) {
			if (signal?.aborted || error instanceof WebError && error.code === "WEB_ABORTED") throw error;
			const detail = error instanceof WebError ? error.message : "official request failed";
			throw new WebError(`Local fetch failed (${reason}); ${detail}; the official attempt may incur fetch fees`, "WEB_PROVIDER_ERROR", { cause: original });
		}
	}
};
/** Import the target host's public implementation so its DNS, proxy and redirect policy stays authoritative. */
async function createHttpFallbackProvider(ctx, enabled) {
	let Http;
	try {
		const module = await import("@deepseek-ai/dsh-web-fetch-http");
		if (typeof module.HttpFetchProvider === "function") Http = module.HttpFetchProvider;
	} catch {}
	return new HttpFallbackProvider(() => {
		if (!Http) return void 0;
		const config = hostConfiguration(ctx, "web-fetch-http") ?? {};
		const positive = (key, fallback) => {
			const value = config[key] ?? fallback;
			if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new WebError("Invalid host HTTP fetch limits", "WEB_PROVIDER_CONFIGURED_UNAVAILABLE");
			return value;
		};
		const maxRedirects = config.maxRedirects ?? 5;
		if (!Number.isInteger(maxRedirects) || Number(maxRedirects) < 0) throw new WebError("Invalid host redirect limit", "WEB_PROVIDER_CONFIGURED_UNAVAILABLE");
		return new Http({
			maxResponseBytes: positive("maxResponseBytes", 5e6),
			maxBodyChars: positive("maxBodyChars", 1e5),
			timeoutMs: positive("timeoutMs", 3e4),
			maxRedirects: Number(maxRedirects),
			userAgent: typeof config.userAgent === "string" ? config.userAgent : "deepseek-harness/0.0.1 (+https://github.com/deepseek-ai)"
		});
	}, enabled, async () => (await prepareOfficialApi(ctx, "fetch")).fetch, (reason) => ctx.logger.warn("web-search-searxng: local fetch failed (%s); trying one explicitly enabled DeepSeek Fetch API request; fetch fees may apply", reason));
}
//#endregion
//#region src/runtime-installer.ts
/** Pinned, verified bootstrap downloads; setup never changes system Python or PATH. */
const UV_VERSION = "0.13.0";
const SEARXNG_REVISION = "f4822b3fc46726bb259d14c6332b702c76b98f82";
const PYTHON_VERSION = "3.12.12";
const WINDOWS_COMPATIBILITY_VERSION = 1;
const SOURCE_SHA256 = "a377e229d3f05bba445894f83c0d450093174201c416441b565c772787f85ffd";
const WAITRESS_VERSION = "3.0.2";
const UV_ASSETS = {
	"darwin-arm64": {
		name: "uv-aarch64-apple-darwin.tar.gz",
		hash: "a9c1b29002cf3c83f07fa9cd8a887a3be0107d90e23189721221e7257db8e3d6"
	},
	"darwin-x64": {
		name: "uv-x86_64-apple-darwin.tar.gz",
		hash: "5f44dcbde809b632f47c36fadb241cb4d6f9af71d0c8f172b5d2026d3dde742c"
	},
	"linux-arm64": {
		name: "uv-aarch64-unknown-linux-gnu.tar.gz",
		hash: "3ccfb6af6e242433eb552f7d9676abd5412c6595c497e990d9c8cb7b5bd4d2c3"
	},
	"linux-x64": {
		name: "uv-x86_64-unknown-linux-gnu.tar.gz",
		hash: "1468ebd5a5541121837c5a2817b9972ba6090fa6caa3d142620850a47fb75154"
	},
	"win32-arm64": {
		name: "uv-aarch64-pc-windows-msvc.zip",
		hash: "cb54028b59aa87f11cf6dec293ce000420043a49a8aea522e822a671321f8932"
	},
	"win32-x64": {
		name: "uv-x86_64-pc-windows-msvc.zip",
		hash: "088962f9e7b7bd9ea740c04c650b2a21c8928c345bd99ac24350dc924dba656c"
	}
};
/** A missing cache cannot authorize a download, including after a cache race. */
var RuntimeSetupRequired = class extends Error {
	constructor() {
		super("Review the first-use summary and choose Prepare and start");
	}
};
function runtimePaths(directory) {
	const base = join(directory, `runtime-${SEARXNG_REVISION.slice(0, 12)}-${UV_VERSION}-${PYTHON_VERSION}`);
	return {
		base,
		source: join(base, "source"),
		python: join(base, "venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python"),
		marker: join(base, "ready.json")
	};
}
async function cachedRuntime(directory) {
	const { source, python, marker } = runtimePaths(directory);
	try {
		const ready = JSON.parse(await readFile(marker, "utf8"));
		if (ready.revision !== "f4822b3fc46726bb259d14c6332b702c76b98f82" || ready.python !== "3.12.12" || ready.uv !== "0.13.0" || ready.compatibility !== WINDOWS_COMPATIBILITY_VERSION) return void 0;
		await access(join(source, "searx", "webapp.py"));
		await access(python);
		return {
			python,
			source
		};
	} catch {
		return;
	}
}
/** Read only; does not create directories, run commands or use the network. */
async function runtimeIsPrepared(directory) {
	return !!await cachedRuntime(directory);
}
/** Actual pinned components and their distinct verification mechanisms. */
function runtimeSetupInfo(directory, cached) {
	const asset = UV_ASSETS[`${process.platform}-${process.arch}`];
	return {
		directory,
		cached,
		components: [
			{
				name: "uv",
				version: UV_VERSION,
				source: asset ? `https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${asset.name}` : `${process.platform}/${process.arch}`,
				verification: "sha256"
			},
			{
				name: "Python",
				version: PYTHON_VERSION,
				source: "uv / python-build-standalone",
				verification: "tool-managed"
			},
			{
				name: "SearXNG",
				version: SEARXNG_REVISION,
				source: `https://codeload.github.com/searxng/searxng/tar.gz/${SEARXNG_REVISION}`,
				verification: "sha256"
			},
			{
				name: `Python dependencies + Waitress ${WAITRESS_VERSION}`,
				version: "source/requirements.txt",
				source: "PyPI",
				verification: "package-index"
			}
		]
	};
}
/** Resolve a supported uv binary without shell commands or OS path assumptions. */
function uvAsset(platform, arch) {
	const asset = UV_ASSETS[`${platform}-${arch}`];
	if (!asset) throw new Error(`Automatic setup is unavailable on ${platform}/${arch}; use an external instance`);
	return asset;
}
/** Download with cancellation, bounded size, and a pinned SHA-256 before extraction. */
async function verifiedDownload(url, hash, target, signal) {
	const response = await fetch(url, { signal });
	if (!response.ok || !response.body) throw new Error(`Runtime download failed: HTTP ${response.status}`);
	const chunks = [];
	let size = 0;
	for await (const chunk of response.body) {
		size += chunk.byteLength;
		if (size > 134217728) throw new Error("Runtime archive exceeds size limit");
		chunks.push(chunk);
	}
	const data = Buffer.concat(chunks);
	if (createHash("sha256").update(data).digest("hex") !== hash) throw new Error("Runtime archive checksum mismatch");
	signal.throwIfAborted();
	await writeFile(target, data);
}
/** Extract a pinned archive into a private staging directory; links are excluded. */
async function extractRuntimeArchive(archive, destination, uvOnly = false) {
	await mkdir(destination, { recursive: true });
	if (archive.endsWith(".zip")) {
		const entries = unzipSync(await readFile(archive), { filter: (file) => file.name === "uv.exe" || file.name.endsWith("/uv.exe") });
		const binary = Object.values(entries);
		if (binary.length !== 1) throw new Error("uv archive contains no unique executable");
		await writeFile(join(destination, "uv.exe"), binary[0]);
		return;
	}
	await x({
		file: archive,
		cwd: destination,
		strip: 1,
		strict: true,
		preservePaths: false,
		filter: (path, entry) => ("type" in entry ? entry.type !== "SymbolicLink" && entry.type !== "Link" : !entry.isSymbolicLink()) && (!uvOnly || path.endsWith("/uv"))
	});
	if (uvOnly) await chmod(join(destination, "uv"), 448);
}
/** The pinned Valkey client imports Unix account metadata even with Valkey disabled.
* Preserve its POSIX behavior and use an account-independent error log on Windows.
*/
async function applyWindowsCompatibility(source, platform = process.platform) {
	if (platform !== "win32") return;
	const target = join(source, "searx", "valkeydb.py");
	const original = await readFile(target, "utf8");
	const accountLog = "        _pw = pwd.getpwuid(os.getuid())\n        logger.exception(\"[%s (%s)] can't connect valkey DB ...\", _pw.pw_name, _pw.pw_uid)";
	if (!original.includes("\nimport pwd\n") || !original.includes(accountLog)) throw new Error("Pinned SearXNG Windows compatibility patch no longer matches");
	const patched = original.replace("\nimport pwd\n", "\ntry:\n    import pwd\nexcept ImportError:\n    pwd = None\n").replace(accountLog, "        if pwd is None:\n            logger.exception(\"can't connect valkey DB ...\")\n        else:\n            _pw = pwd.getpwuid(os.getuid())\n            logger.exception(\"[%s (%s)] can't connect valkey DB ...\", _pw.pw_name, _pw.pw_uid)");
	await writeFile(target, patched);
}
/** Prepare a versioned, profile-owned runtime. Failed setup is retried without a ready marker. */
async function prepareRuntime(directory, command, signal, progress, record = () => {}, allowSetup = false) {
	const asset = uvAsset(process.platform, process.arch);
	const { base, source, python, marker } = runtimePaths(directory);
	const cached = await cachedRuntime(directory);
	if (cached) {
		record({
			kind: "cache",
			subject: "SearXNG",
			detail: base
		});
		return cached;
	}
	if (!allowSetup) throw new RuntimeSetupRequired();
	await mkdir(base, {
		recursive: true,
		mode: 448
	});
	const uvArchive = join(base, asset.name);
	progress("uv");
	const uvURL = `https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${asset.name}`;
	record({
		kind: "download",
		subject: `uv ${UV_VERSION}`,
		detail: uvURL
	});
	await verifiedDownload(uvURL, asset.hash, uvArchive, signal);
	record({
		kind: "verify",
		subject: `uv ${UV_VERSION}`,
		detail: `SHA-256 ${asset.hash}`
	});
	await extractRuntimeArchive(uvArchive, join(base, "bootstrap"), true);
	record({
		kind: "extract",
		subject: "uv",
		detail: join(base, "bootstrap")
	});
	const uv = join(base, "bootstrap", process.platform === "win32" ? "uv.exe" : "uv");
	progress("source");
	const sourceArchive = join(base, "source.tar.gz");
	const sourceURL = `https://codeload.github.com/searxng/searxng/tar.gz/${SEARXNG_REVISION}`;
	record({
		kind: "download",
		subject: "SearXNG",
		detail: sourceURL
	});
	await verifiedDownload(sourceURL, SOURCE_SHA256, sourceArchive, signal);
	record({
		kind: "verify",
		subject: "SearXNG",
		detail: `SHA-256 ${SOURCE_SHA256}`
	});
	await rm(source, {
		recursive: true,
		force: true
	});
	await extractRuntimeArchive(sourceArchive, source);
	record({
		kind: "extract",
		subject: "SearXNG",
		detail: source
	});
	await applyWindowsCompatibility(source);
	if (process.platform === "win32") record({
		kind: "configure",
		subject: "Windows / Valkey",
		detail: "Optional Unix account import and account-independent error logging"
	});
	const env = {
		UV_PYTHON_INSTALL_DIR: join(directory, "python"),
		UV_CACHE_DIR: join(directory, "uv-cache"),
		UV_PYTHON_INSTALL_BIN: "0",
		UV_NO_PROGRESS: "1",
		UV_PYTHON_PREFERENCE: "only-managed",
		UV_PYTHON_DOWNLOADS: "automatic",
		UV_NO_CONFIG: "1"
	};
	progress("python");
	await command([
		uv,
		"venv",
		"--python",
		PYTHON_VERSION,
		"--clear",
		join(base, "venv")
	], base, env, signal);
	progress("dependencies");
	await command([
		uv,
		"pip",
		"install",
		"--python",
		python,
		"-r",
		join(source, "requirements.txt"),
		`waitress==${WAITRESS_VERSION}`
	], source, env, signal);
	await command([
		python,
		"-c",
		"import flask, curl_cffi, lxml, waitress"
	], source, env, signal);
	await writeFile(`${marker}.tmp`, JSON.stringify({
		revision: SEARXNG_REVISION,
		python: PYTHON_VERSION,
		uv: UV_VERSION,
		compatibility: WINDOWS_COMPATIBILITY_VERSION
	}));
	await rename(`${marker}.tmp`, marker);
	await rm(uvArchive, { force: true });
	await rm(sourceArchive, { force: true });
	return {
		python,
		source
	};
}
//#endregion
//#region src/managed-runtime.ts
/** Profile-owned SearXNG lifecycle using public DSH subprocess handles. */
const SERVER = `import socket, sys, json, os
sock = socket.create_server(('127.0.0.1', int(sys.argv[1])), backlog=128)
from searx.webapp import app
from waitress import serve
print('DSH_SEARXNG_READY ' + json.dumps({'port': sock.getsockname()[1]}), flush=True)
serve(app, sockets=[sock], threads=4)
`;
/** One manager owns one profile lock, subprocess range, and bounded log. */
var ManagedRuntime = class {
	directory;
	subprocess;
	prepare;
	isPrepared;
	state = {
		phase: "idle",
		endpoint: "",
		message: "",
		logs: ""
	};
	controller;
	operation = Promise.resolve();
	child;
	release;
	disposed = false;
	options;
	attempts = 0;
	setupApproved = false;
	cached = false;
	activities = [];
	secrets = [];
	constructor(directory, subprocess, prepare = prepareRuntime, isPrepared = runtimeIsPrepared) {
		this.directory = directory;
		this.subprocess = subprocess;
		this.prepare = prepare;
		this.isPrepared = isPrepared;
	}
	/** Current immutable snapshot, including recent child output. */
	status() {
		const output = this.child ? this.output(this.child) : "";
		return {
			...this.state,
			logs: this.redact(`${this.state.logs}\n${output}`).trim().slice(-12e3),
			setup: runtimeSetupInfo(this.directory, this.cached),
			activities: [...this.activities]
		};
	}
	redact(text) {
		return redactRuntimeLog(text, this.directory, this.secrets);
	}
	/** Append safe structured events across starts and stops during this DSH run. */
	record = (event) => {
		this.activities.push({
			...event,
			subject: this.redact(event.subject).slice(0, 200),
			detail: this.redact(event.detail).slice(0, 3e3),
			time: (/* @__PURE__ */ new Date()).toISOString()
		});
		if (this.activities.length > 100) this.activities.shift();
	};
	/** Serialize configuration changes, cancelling preparation or startup already in progress. */
	start(options, approveSetup = false, reason = "service-start") {
		if (approveSetup) this.setupApproved = true;
		this.options = options;
		this.attempts = 0;
		this.controller?.abort();
		const controller = new AbortController();
		this.controller = controller;
		this.operation = this.operation.catch(() => {}).then(async () => {
			await this.stopChild(reason);
			if (this.disposed || controller.signal.aborted) return;
			try {
				await this.launch(options, controller.signal);
			} catch (error) {
				await this.stopChild("startup-failed");
				if (!controller.signal.aborted) {
					const required = error instanceof RuntimeSetupRequired;
					const message = required ? "" : this.redact(error instanceof Error ? error.message : String(error));
					this.state = {
						...this.state,
						phase: required ? "needs-setup" : "failed",
						endpoint: "",
						message
					};
					if (!required) this.record({
						kind: "error",
						subject: "SearXNG",
						detail: message
					});
				}
			}
		});
		return this.operation;
	}
	/** Stop only this manager's process; the cached runtime and preferences remain. */
	stop(reason = "service-stop") {
		this.options = void 0;
		this.controller?.abort();
		this.operation = this.operation.catch(() => {}).then(async () => {
			await this.stopChild(reason);
			this.state = {
				...this.state,
				phase: "stopped",
				endpoint: "",
				message: ""
			};
		});
		return this.operation;
	}
	/** Delete only generated runtime contents while holding the profile ownership lock. */
	cleanup() {
		this.options = void 0;
		this.setupApproved = false;
		this.controller?.abort();
		this.operation = this.operation.catch(() => {}).then(async () => {
			await this.stopChild("runtime-cleanup");
			this.state = {
				...this.state,
				phase: "stopped",
				endpoint: "",
				message: ""
			};
			try {
				let directoryInfo;
				try {
					directoryInfo = await lstat(this.directory);
				} catch (error) {
					if (error.code !== "ENOENT") throw error;
				}
				if (directoryInfo) {
					if (!directoryInfo.isDirectory() || directoryInfo.isSymbolicLink()) throw new Error("Refusing to clean a redirected runtime directory");
					const release = await lockfile.lock(this.directory, {
						realpath: false,
						stale: 6e4,
						update: 1e4
					});
					try {
						const entries = await readdir(this.directory);
						for (const entry of entries) if ([
							"python",
							"uv-cache",
							"secret",
							"settings.yml",
							"serve.py"
						].includes(entry) || /^runtime-[a-f0-9]{12}-\d+\.\d+\.\d+-\d+\.\d+\.\d+$/.test(entry)) await rm(join(this.directory, entry), {
							recursive: true,
							force: true
						});
					} finally {
						await release();
					}
				}
				this.cached = false;
				this.secrets.length = 0;
				this.state = {
					phase: "needs-setup",
					endpoint: "",
					message: "",
					logs: ""
				};
				this.record({
					kind: "cleanup",
					subject: "SearXNG",
					detail: this.directory
				});
			} catch (error) {
				const message = this.redact(error instanceof Error ? error.message : String(error));
				this.state = {
					...this.state,
					phase: "failed",
					message
				};
				this.record({
					kind: "error",
					subject: "SearXNG cleanup",
					detail: message
				});
			}
		});
		return this.operation;
	}
	/** Cancel setup and await complete subprocess teardown before releasing ownership. */
	async dispose(reason = "plugin-disposed") {
		this.disposed = true;
		await this.stop(reason);
	}
	output(child) {
		return this.redact([child.collected.stdout?.readFrom(0).text, child.collected.stderr?.readFrom(0).text].filter(Boolean).join("\n")).slice(-12e3);
	}
	spawn(argv, cwd, env, signal) {
		this.record({
			kind: "command",
			subject: "argv",
			detail: argv.map((arg) => JSON.stringify(arg)).join(" ")
		});
		return this.subprocess.spawn({
			argv,
			cwd,
			env,
			signal,
			graceMs: 3e3,
			stdio: {
				stdin: "ignore",
				stdout: { maxBytes: 16e3 },
				stderr: { maxBytes: 16e3 }
			}
		});
	}
	async launch(options, signal) {
		uvAsset(process.platform, process.arch);
		this.cached = await this.isPrepared(this.directory);
		signal.throwIfAborted();
		if (!this.cached && !this.setupApproved) {
			this.state = {
				phase: "needs-setup",
				endpoint: "",
				message: "",
				logs: ""
			};
			return;
		}
		this.state = {
			phase: "preparing",
			endpoint: "",
			instanceId: randomBytes(16).toString("hex"),
			message: "",
			logs: ""
		};
		await mkdir(this.directory, {
			recursive: true,
			mode: 448
		});
		this.release = await lockfile.lock(this.directory, {
			realpath: false,
			stale: 6e4,
			update: 1e4,
			onCompromised: (error) => {
				const message = this.redact(`SearXNG ownership lock lost: ${error.message}`);
				this.state = {
					...this.state,
					phase: "failed",
					endpoint: "",
					message
				};
				this.record({
					kind: "error",
					subject: "SearXNG",
					detail: message
				});
				this.controller?.abort();
			}
		});
		const setupSignal = AbortSignal.any([signal, AbortSignal.timeout(options.setupTimeoutMs)]);
		const command = async (argv, cwd, env, commandSignal) => {
			const child = this.spawn(argv, cwd, env, commandSignal);
			this.child = child;
			try {
				const result = await child.done;
				this.state.logs = `${this.state.logs}\n${this.output(child)}`.slice(-12e3);
				commandSignal.throwIfAborted();
				if (result.exitCode !== 0) throw new Error(`Runtime setup failed (${result.exitCode}): ${this.output(child)}`);
			} finally {
				child.terminate();
				await child.waitForExit();
				if (this.child === child) this.child = void 0;
			}
		};
		const runtime = await this.prepare(this.directory, command, setupSignal, (message) => {
			this.state.message = message;
		}, this.record, this.setupApproved);
		this.cached = true;
		signal.throwIfAborted();
		const secretPath = join(this.directory, "secret");
		let secret;
		try {
			secret = await readFile(secretPath, "utf8");
		} catch {
			secret = randomBytes(32).toString("hex");
			await writeFile(secretPath, secret, { mode: 384 });
		}
		this.secrets.push(secret.trim());
		const settings = join(this.directory, "settings.yml");
		await writeFile(settings, `use_default_settings: true\nserver:\n  secret_key: ${JSON.stringify(secret)}\n  bind_address: 127.0.0.1\n  limiter: false\nsearch:\n  formats: [html, json]\n`, { mode: 384 });
		const script = join(this.directory, "serve.py");
		await writeFile(script, SERVER);
		this.record({
			kind: "configure",
			subject: "SearXNG",
			detail: `${settings}\n${script}\n127.0.0.1 / JSON`
		});
		this.state = {
			...this.state,
			phase: "starting",
			message: ""
		};
		const child = this.spawn([
			runtime.python,
			"-u",
			script,
			String(options.port)
		], runtime.source, {
			SEARXNG_SETTINGS_PATH: settings,
			PYTHONPATH: runtime.source,
			PYTHONUNBUFFERED: "1"
		}, signal);
		this.child = child;
		let exited = false;
		let failure = "";
		const onExit = (reason) => {
			exited = true;
			failure = reason;
			if (this.child === child && this.state.phase === "ready" && !signal.aborted && !this.disposed) {
				const recover = !!this.options && this.attempts < this.options.restartLimit;
				this.record({
					kind: "error",
					subject: "SearXNG",
					detail: `${failure}\nautomaticRestart=${recover}`
				});
				this.state = {
					...this.state,
					phase: "failed",
					endpoint: "",
					message: failure
				};
				if (this.options && this.attempts++ < this.options.restartLimit) this.restartAfterExit(this.options);
			}
		};
		child.done.then((result) => {
			onExit(`SearXNG exited: exitCode=${result.exitCode ?? "none"}; signal=${result.signal ?? "none"}\n${this.output(child)}`);
		}, (error) => {
			onExit(this.redact(String(error)));
		});
		const startupSignal = AbortSignal.any([signal, AbortSignal.timeout(options.startupTimeoutMs)]);
		while (true) {
			startupSignal.throwIfAborted();
			if (exited) throw new Error(failure);
			const line = child.collected.stdout?.readFrom(0).text.match(/DSH_SEARXNG_READY (\{[^\n]+\})/);
			if (line) {
				const port = JSON.parse(line[1]).port;
				if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid managed SearXNG port");
				const endpoint = `http://127.0.0.1:${port}`;
				try {
					const health = await fetch(`${endpoint}/config`, {
						redirect: "error",
						signal: AbortSignal.any([startupSignal, AbortSignal.timeout(1500)])
					});
					const config = await health.json();
					if (health.ok && typeof config === "object" && config !== null && Array.isArray(Reflect.get(config, "engines"))) {
						this.state = {
							...this.state,
							phase: "ready",
							endpoint,
							message: ""
						};
						this.record({
							kind: "ready",
							subject: "SearXNG",
							detail: `${endpoint}/config / HTTP ${health.status}`
						});
						return;
					}
				} catch {
					startupSignal.throwIfAborted();
				}
			}
			await setTimeout(250, void 0, { signal: startupSignal });
		}
	}
	restartAfterExit(options) {
		this.operation = this.operation.catch(() => {}).then(async () => {
			await this.stopChild("unexpected-exit-recovery");
			if (this.disposed || this.options !== options) return;
			this.controller = new AbortController();
			try {
				await this.launch(options, this.controller.signal);
			} catch (error) {
				await this.stopChild("recovery-failed");
				const required = error instanceof RuntimeSetupRequired;
				this.state = {
					...this.state,
					phase: required ? "needs-setup" : "failed",
					endpoint: "",
					message: required ? "" : this.redact(String(error))
				};
				if (!required) this.record({
					kind: "error",
					subject: "SearXNG recovery",
					detail: this.state.message
				});
			}
		});
	}
	async stopChild(reason) {
		const child = this.child;
		this.child = void 0;
		if (child) {
			this.state.logs = `${this.state.logs}\n${this.output(child)}`.slice(-12e3);
			child.terminate();
			await child.waitForExit();
			this.record({
				kind: "stop",
				subject: "SearXNG",
				detail: reason
			});
		}
		const release = this.release;
		this.release = void 0;
		await release?.();
	}
};
//#endregion
//#region src/routing-status.ts
const object = (value) => !!value && typeof value === "object" && !Array.isArray(value);
const validId = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,99}$/i.test(value);
function readRoutingStatus(ctx, environment, fallback) {
	const selection = (field) => {
		try {
			const web = ctx.get("web");
			const loader = ctx.get("loader");
			const settings = ctx.get("settings");
			const value = web?.config ?? (loader ? [...loader.entries()].find((entry) => entry.options.id === "web")?.fiber?.config : void 0) ?? settings?.describe({ redactSecrets: true }).find((row) => row.ns === "web")?.value;
			if (!object(value)) return {
				provider: null,
				source: "unavailable"
			};
			const fieldValue = value[field];
			const resolved = object(fieldValue) && typeof fieldValue.get === "function" ? fieldValue.get() : fieldValue;
			if (resolved !== void 0 && resolved !== null) return validId(resolved) ? {
				provider: resolved,
				source: "configuration"
			} : {
				provider: null,
				source: "unavailable"
			};
			const candidate = environment[field];
			if (candidate !== void 0) return {
				provider: validId(candidate) ? candidate : null,
				source: "environment"
			};
			return {
				provider: null,
				source: "automatic"
			};
		} catch {
			return {
				provider: null,
				source: "unavailable"
			};
		}
	};
	const search = selection("searchProvider"), fetch = selection("fetchProvider");
	return {
		searchProvider: search.provider,
		fetchProvider: fetch.provider,
		searchSource: search.source,
		fetchSource: fetch.source,
		...fallback ? { fallback } : {}
	};
}
//#endregion
//#region src/route-restoration.ts
/** Explicit operator action through the host's public atomic configuration editor. */
function capability(ctx) {
	try {
		const settings = ctx.get("settings");
		if (settings?.writable === false) return { capability: "read-only" };
		const editor = ctx.get("configEditor");
		if (settings?.writable !== true || typeof editor?.entries !== "function" || typeof editor.edit !== "function") return { capability: "unavailable" };
		const entries = editor.entries().filter((entry) => entry.options.id === "web");
		if (entries.length !== 1) return { capability: "unavailable" };
		return {
			capability: "available",
			editor,
			entry: entries[0]
		};
	} catch {
		return { capability: "unavailable" };
	}
}
function revision(routing) {
	return createHash("sha256").update(JSON.stringify([
		routing.searchProvider,
		routing.fetchProvider,
		routing.searchSource,
		routing.fetchSource,
		routing.fallback?.searchApi,
		routing.fallback?.fetchApi,
		routing.fallback?.legacySearch
	])).digest("hex");
}
function routeRestoreStatus(ctx, routing) {
	return {
		capability: capability(ctx).capability,
		revision: revision(routing)
	};
}
async function restorePluginRoutes(ctx, expectedRevision, read) {
	const current = () => read();
	const result = (outcome) => ({
		outcome,
		routing: current()
	});
	if (!/^[a-f0-9]{64}$/.test(expectedRevision) || revision(current()) !== expectedRevision) return result("changed");
	const target = capability(ctx);
	if (target.capability !== "available") return result(target.capability);
	try {
		await target.editor.edit(target.entry, (raw) => {
			if (revision(current()) !== expectedRevision) throw new Error("SEARXNG_ROUTE_RESTORE_CHANGED");
			if (capability(ctx).capability !== "available") throw new Error("SEARXNG_ROUTE_RESTORE_READ_ONLY");
			return {
				...raw,
				searchProvider: "searxng",
				fetchProvider: "searxng-http"
			};
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "";
		if (message === "SEARXNG_ROUTE_RESTORE_CHANGED" || /entry changed|entry is no longer|plugin is no longer/i.test(message)) return result("changed");
		if (message === "SEARXNG_ROUTE_RESTORE_READ_ONLY") return result("read-only");
		if (/overridden by a home patch or command-line overlay/i.test(message)) return result("blocked");
		return result("failed");
	}
	const next = result("failed");
	if (next.routing.searchSource === "configuration" && next.routing.fetchSource === "configuration" && next.routing.searchProvider === "searxng" && next.routing.fetchProvider === "searxng-http") next.outcome = "restored";
	return next;
}
//#endregion
//#region src/instance-auth.ts
/** Optional endpoint-bound credentials using DSH's public credential store. */
function normalize(target, fallbackURL = "") {
	const headerName = target.headerName.trim() || "X-API-Key";
	if (!validAuthHeaderName(headerName)) throw new Error("Invalid authentication header name; use an authentication header such as X-API-Key or Authorization");
	const source = target.baseURL.trim() || fallbackURL.trim();
	if (!source) return {
		endpoint: "",
		headerName
	};
	let url;
	try {
		url = new URL(source);
	} catch {
		throw new Error("Authentication requires a valid HTTP or HTTPS instance endpoint");
	}
	if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Authentication requires an HTTP or HTTPS endpoint without URL credentials");
	url = new URL("search", source.endsWith("/") ? source : `${source}/`);
	url.search = "";
	url.hash = "";
	url.pathname = url.pathname.slice(0, -6);
	return {
		endpoint: url.href,
		headerName
	};
}
function keyFor(endpoint, headerName) {
	const digest = createHash("sha256").update(`${endpoint}\n${headerName.toLowerCase()}`).digest("hex");
	return credentialKey("web-search-searxng", `instance-${digest}`);
}
var InstanceAuthStore = class {
	ctx;
	fallbackURL;
	constructor(ctx, fallbackURL) {
		this.ctx = ctx;
		this.fallbackURL = fallbackURL;
	}
	async describe(target) {
		const { endpoint, headerName } = normalize(target, this.fallbackURL());
		const credentials = this.ctx.get("credentials");
		if (!credentials || !endpoint) return {
			endpoint,
			configured: false,
			writable: false
		};
		const info = await credentials.describeRecord(keyFor(endpoint, headerName));
		return {
			endpoint,
			configured: info.configured,
			writable: info.writable
		};
	}
	async set(target, value) {
		if (!validAuthHeaderValue(value)) throw new Error("Invalid authentication header value; use a single-line value of at most 8192 bytes");
		const { endpoint, headerName } = normalize(target, this.fallbackURL());
		const credentials = this.ctx.get("credentials");
		if (!credentials || !endpoint) throw new Error("Saving authentication requires an instance endpoint and the DSH credential service");
		await credentials.modifyRecord(keyFor(endpoint, headerName), async () => ({
			kind: "api-key",
			key: value
		}));
		return this.describe(target);
	}
	async clear(target) {
		const { endpoint, headerName } = normalize(target, this.fallbackURL());
		const credentials = this.ctx.get("credentials");
		if (!credentials || !endpoint) throw new Error("Removing authentication requires an instance endpoint and the DSH credential service");
		await credentials.deleteRecord(keyFor(endpoint, headerName));
		return this.describe(target);
	}
	/** Called only on the backend; this method is never exposed through RPC. */
	async resolve(target) {
		const { endpoint, headerName } = normalize(target);
		const credentials = this.ctx.get("credentials");
		if (!credentials) throw new Error("Instance authentication requires the DSH credential service; disable authentication to use a credential-free instance");
		const record = await credentials.readRecord(keyFor(endpoint, headerName));
		if (record?.kind !== "api-key" || !record.key) throw new Error("No authentication value is saved for this instance endpoint and header name; save a value on the plugin card or disable authentication");
		if (!validAuthHeaderValue(record.key)) throw new Error("The saved authentication value is invalid; replace it on the plugin card");
		return {
			name: headerName,
			value: record.key
		};
	}
};
//#endregion
//#region src/proxy-types.ts
/** Client-safe proxy contract. Saved endpoints and consent remain on the backend. */
const PROXY_RISK_REVISION = "2026-10-19-v3";
//#endregion
//#region src/process-proxy.ts
/** A process-wide proxy lease with profile-bound remembered consent. */
const OWNER = Symbol.for("dsh-web-search-searxng.process-proxy-owner");
const owners = globalThis;
const PROBE = new URL("https://proxy-policy-check.invalid/");
const PROBE_HTTP = new URL("http://proxy-policy-check.invalid/");
const PROXY_NAMES = [
	"HTTP_PROXY",
	"http_proxy",
	"HTTPS_PROXY",
	"https_proxy",
	"ALL_PROXY",
	"all_proxy"
];
const CHANGED_ENV_NAMES = [
	"HTTP_PROXY",
	"http_proxy",
	"HTTPS_PROXY",
	"https_proxy",
	"NO_PROXY",
	"no_proxy"
];
/** Operator-chosen endpoint only; no credentials, paths, default ports or automatic discovery. */
function proxyConfiguration(value) {
	if (!value || !["http", "https"].includes(value.protocol) || typeof value.host !== "string" || !value.host.trim() || /[\s/@?#\\]/.test(value.host) || !Number.isInteger(value.port) || value.port < 1 || value.port > 65535 || typeof value.noProxy !== "string" || value.noProxy.length > 4e3) throw new Error("Invalid proxy configuration");
	let endpoint;
	try {
		endpoint = new URL(`${value.protocol}://${value.host}:${value.port}`);
	} catch {
		throw new Error("Invalid proxy configuration");
	}
	if (!endpoint.hostname || endpoint.username || endpoint.password || endpoint.pathname !== "/" || endpoint.search || endpoint.hash) throw new Error("Invalid proxy configuration");
	const bypass = value.noProxy.split(/[,\s]+/).filter(Boolean);
	for (const host of bypass) if (!/^\.?[a-z0-9][a-z0-9.-]*$/i.test(host) || host.includes("..")) throw new Error("Invalid proxy bypass host");
	return {
		endpoint: endpoint.origin,
		noProxy: bypass.join(",")
	};
}
/** Approval grants are short-lived, rotating and single-use. Controls are never model tools. */
var ProcessProxy = class {
	environment;
	loadApi;
	preferences;
	api;
	loaded = false;
	disposed = false;
	tail = Promise.resolve();
	approval;
	release;
	dispatcher;
	identity = {};
	saved;
	restored = false;
	restoreFailed = false;
	constructor(environment, loadApi = () => import("@deepseek-ai/dsh-http-proxy"), preferences) {
		this.environment = environment;
		this.loadApi = loadApi;
		this.preferences = preferences;
	}
	serial(operation, cleanup = false) {
		const task = this.tail.then(() => {
			if (this.disposed && !cleanup) throw new Error("Proxy controls are no longer available");
			return operation();
		});
		this.tail = task.catch(() => {});
		return task;
	}
	async load() {
		if (!this.loaded) {
			this.loaded = true;
			try {
				const api = await this.loadApi();
				if (typeof api.installProxyFromEnvironment === "function" && typeof api.proxyRouteFor === "function") this.api = api;
			} catch {}
		}
		return this.api;
	}
	state() {
		return {
			state: this.release ? "active" : !this.api ? "unavailable" : this.inherited() ? "inherited" : "off",
			riskRevision: PROXY_RISK_REVISION,
			...this.preferences ? {
				remembered: this.saved?.revision === PROXY_RISK_REVISION,
				restoreFailed: this.restoreFailed
			} : {}
		};
	}
	inherited() {
		return PROXY_NAMES.some((name) => !!this.environment.get(name)?.value.trim()) || !!this.api?.proxyRouteFor(PROBE).proxied || !!this.api?.proxyRouteFor(PROBE_HTTP).proxied || !!owners[OWNER] && owners[OWNER] !== this.identity;
	}
	grant(step) {
		const approval = {
			step,
			token: randomBytes(32).toString("hex"),
			riskRevision: PROXY_RISK_REVISION
		};
		this.approval = {
			...approval,
			expires: Date.now() + 3e5
		};
		return approval;
	}
	take(token, step) {
		const grant = this.approval;
		this.approval = void 0;
		if (!grant || grant.step !== step || grant.token !== token || grant.expires < Date.now()) throw new Error("Proxy approval expired; review and acknowledge the risks again");
	}
	status() {
		return this.serial(async () => {
			await this.load();
			return this.state();
		});
	}
	/** Startup only: old sessions never create a new grant or silently accept a changed statement. */
	restore() {
		return this.serial(async () => {
			if (this.restored || !this.preferences?.available()) return;
			this.restored = true;
			try {
				const value = await this.preferences.read();
				if (!value || typeof value !== "object" || Reflect.get(value, "schema") !== 1 || typeof Reflect.get(value, "revision") !== "string" || typeof Reflect.get(value, "enabled") !== "boolean") return;
				const configuration = Reflect.get(value, "configuration");
				proxyConfiguration(configuration);
				this.saved = {
					schema: 1,
					revision: Reflect.get(value, "revision"),
					enabled: Reflect.get(value, "enabled"),
					configuration: { ...configuration }
				};
				await this.load();
				if (this.saved.enabled && this.saved.revision === "2026-10-19-v3" && this.state().state === "off") await this.install(configuration);
			} catch {
				this.restoreFailed = true;
			}
		});
	}
	begin() {
		return this.serial(async () => {
			await this.load();
			if (this.state().state !== "off") throw new Error("Proxy is active, inherited, or unavailable");
			return this.grant("notice");
		});
	}
	confirm(token, step, revision, accepted) {
		return this.serial(async () => {
			if (revision !== "2026-10-19-v3" || !["notice", "statement"].includes(step)) throw new Error("Invalid proxy risk confirmation");
			if (step === "statement" && accepted !== true) throw new Error("Risk acknowledgement required");
			this.take(token, step);
			return this.grant(step === "notice" ? "statement" : "approved");
		});
	}
	apply(token, configuration) {
		return this.serial(async () => {
			this.take(token, "approved");
			await this.activate(configuration);
			return this.state();
		});
	}
	resume() {
		return this.serial(async () => {
			if (!this.saved || this.saved.revision !== "2026-10-19-v3") throw new Error("Review and acknowledge the current risk statement before enabling a new proxy");
			await this.activate(this.saved.configuration);
			return this.state();
		});
	}
	async activate(configuration) {
		await this.install(configuration);
		try {
			if (this.preferences) {
				const saved = {
					schema: 1,
					revision: PROXY_RISK_REVISION,
					enabled: true,
					configuration: { ...configuration }
				};
				await this.preferences.write(saved);
				this.saved = saved;
			}
			this.restoreFailed = false;
		} catch {
			await this.clear();
			throw new Error("Could not remember the proxy configuration; no plugin proxy remains active");
		}
	}
	async install(configuration) {
		const { endpoint, noProxy } = proxyConfiguration(configuration);
		const api = await this.load();
		if (this.disposed || !api || this.release || this.inherited()) throw new Error("Proxy policy changed; resolve the existing configuration before retrying");
		owners[OWNER] = this.identity;
		const values = {
			HTTP_PROXY: endpoint,
			HTTPS_PROXY: endpoint,
			NO_PROXY: [this.environment.get("no_proxy")?.value || this.environment.get("NO_PROXY")?.value || "", noProxy].filter(Boolean).join(",")
		};
		const previous = Object.fromEntries(CHANGED_ENV_NAMES.map((name) => [name, process.env[name]]));
		try {
			this.release = await api.installProxyFromEnvironment({ get: (name) => values[name] === void 0 ? void 0 : { value: values[name] } }, () => {});
			const route = api.proxyRouteFor(PROBE);
			if (route.proxied) this.dispatcher = route.dispatcher;
			if (!route.proxied || this.disposed) {
				await this.clear();
				throw new Error("Proxy activation was cancelled");
			}
		} catch {
			if (this.release) await this.clear().catch(() => {});
			else for (const name of CHANGED_ENV_NAMES) if (previous[name] === void 0) delete process.env[name];
			else process.env[name] = previous[name];
			if (owners[OWNER] === this.identity) delete owners[OWNER];
			throw new Error("Could not activate the session proxy");
		}
		this.restoreFailed = false;
	}
	async clear() {
		this.approval = void 0;
		const release = this.release, dispatcher = this.dispatcher;
		this.release = void 0;
		this.dispatcher = void 0;
		if (!release) return;
		try {
			const destroying = dispatcher?.destroy();
			const closing = release();
			const results = await Promise.allSettled([closing, destroying]);
			const closed = results[0], destroyed = results[1];
			const alreadyDestroyed = closed.status === "rejected" && typeof closed.reason === "object" && closed.reason !== null && Reflect.get(closed.reason, "code") === "UND_ERR_DESTROYED";
			if (destroyed.status === "rejected" || closed.status === "rejected" && !alreadyDestroyed) throw new Error("Proxy cleanup failed; restart DSH");
		} finally {
			if (owners[OWNER] === this.identity) delete owners[OWNER];
		}
	}
	/** Turning off is durable; disposing the plugin only releases this process's lease. */
	remove() {
		return this.serial(async () => {
			try {
				if (this.preferences && this.saved) {
					const saved = {
						...this.saved,
						enabled: false
					};
					await this.preferences.write(saved);
					this.saved = saved;
				}
			} finally {
				await this.clear();
			}
			return this.state();
		});
	}
	forget() {
		return this.serial(async () => {
			try {
				await this.preferences?.forget();
				this.saved = void 0;
				this.restoreFailed = false;
			} finally {
				await this.clear();
			}
			return this.state();
		});
	}
	dispose() {
		this.disposed = true;
		return this.serial(() => this.clear(), true);
	}
};
//#endregion
//#region src/proxy-preferences.ts
/** Profile-bound proxy consent and configuration, stored through the public credential seam. */
var ProxyPreferenceStore = class {
	ctx;
	constructor(ctx) {
		this.ctx = ctx;
	}
	target() {
		const profile = this.ctx.get("profileContext"), credentials = this.ctx.get("credentials");
		if (!profile || !credentials) return void 0;
		const id = createHash("sha256").update(profile.dir).digest("hex");
		return {
			credentials,
			key: credentialKey("web-search-searxng", `process-proxy-${id}`)
		};
	}
	available() {
		return !!this.target();
	}
	async read() {
		const target = this.target();
		if (!target) return void 0;
		const record = await target.credentials.readRecord(target.key);
		return record?.kind === "grant" ? record.payload : void 0;
	}
	async write(value) {
		const target = this.target();
		if (!target) throw new Error("Remembering proxy configuration requires a profile and the DSH credential service");
		await target.credentials.modifyRecord(target.key, async () => ({
			kind: "grant",
			payload: value
		}));
	}
	async forget() {
		const target = this.target();
		if (!target) throw new Error("Removing remembered proxy configuration requires the DSH credential service");
		await target.credentials.deleteRecord(target.key);
	}
};
//#endregion
//#region src/runtime-service.ts
/** Authenticated card controls and profile-scoped managed service selection. */
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** Controls are operator RPCs, never model tools. External services are never stopped. */
let SearxngRuntimeService = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _authDescribe_decorators;
	let _authSet_decorators;
	let _authClear_decorators;
	let _proxyStatus_decorators;
	let _proxyBegin_decorators;
	let _proxyConfirm_decorators;
	let _proxyApply_decorators;
	let _proxyRemove_decorators;
	let _proxyResume_decorators;
	let _proxyForget_decorators;
	let _status_decorators;
	let _restoreRoutes_decorators;
	let _prepare_decorators;
	let _restart_decorators;
	let _stop_decorators;
	let _cleanup_decorators;
	let _testReport_decorators;
	let _test_decorators;
	return class SearxngRuntimeService extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_authDescribe_decorators = [Remote];
			_authSet_decorators = [Remote];
			_authClear_decorators = [Remote];
			_proxyStatus_decorators = [Remote];
			_proxyBegin_decorators = [Remote];
			_proxyConfirm_decorators = [Remote];
			_proxyApply_decorators = [Remote];
			_proxyRemove_decorators = [Remote];
			_proxyResume_decorators = [Remote];
			_proxyForget_decorators = [Remote];
			_status_decorators = [Remote];
			_restoreRoutes_decorators = [Remote];
			_prepare_decorators = [Remote];
			_restart_decorators = [Remote];
			_stop_decorators = [Remote];
			_cleanup_decorators = [Remote];
			_testReport_decorators = [Remote];
			_test_decorators = [Remote];
			__esDecorate(this, null, _authDescribe_decorators, {
				kind: "method",
				name: "authDescribe",
				static: false,
				private: false,
				access: {
					has: (obj) => "authDescribe" in obj,
					get: (obj) => obj.authDescribe
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _authSet_decorators, {
				kind: "method",
				name: "authSet",
				static: false,
				private: false,
				access: {
					has: (obj) => "authSet" in obj,
					get: (obj) => obj.authSet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _authClear_decorators, {
				kind: "method",
				name: "authClear",
				static: false,
				private: false,
				access: {
					has: (obj) => "authClear" in obj,
					get: (obj) => obj.authClear
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _proxyStatus_decorators, {
				kind: "method",
				name: "proxyStatus",
				static: false,
				private: false,
				access: {
					has: (obj) => "proxyStatus" in obj,
					get: (obj) => obj.proxyStatus
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _proxyBegin_decorators, {
				kind: "method",
				name: "proxyBegin",
				static: false,
				private: false,
				access: {
					has: (obj) => "proxyBegin" in obj,
					get: (obj) => obj.proxyBegin
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _proxyConfirm_decorators, {
				kind: "method",
				name: "proxyConfirm",
				static: false,
				private: false,
				access: {
					has: (obj) => "proxyConfirm" in obj,
					get: (obj) => obj.proxyConfirm
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _proxyApply_decorators, {
				kind: "method",
				name: "proxyApply",
				static: false,
				private: false,
				access: {
					has: (obj) => "proxyApply" in obj,
					get: (obj) => obj.proxyApply
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _proxyRemove_decorators, {
				kind: "method",
				name: "proxyRemove",
				static: false,
				private: false,
				access: {
					has: (obj) => "proxyRemove" in obj,
					get: (obj) => obj.proxyRemove
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _proxyResume_decorators, {
				kind: "method",
				name: "proxyResume",
				static: false,
				private: false,
				access: {
					has: (obj) => "proxyResume" in obj,
					get: (obj) => obj.proxyResume
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _proxyForget_decorators, {
				kind: "method",
				name: "proxyForget",
				static: false,
				private: false,
				access: {
					has: (obj) => "proxyForget" in obj,
					get: (obj) => obj.proxyForget
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _status_decorators, {
				kind: "method",
				name: "status",
				static: false,
				private: false,
				access: {
					has: (obj) => "status" in obj,
					get: (obj) => obj.status
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _restoreRoutes_decorators, {
				kind: "method",
				name: "restoreRoutes",
				static: false,
				private: false,
				access: {
					has: (obj) => "restoreRoutes" in obj,
					get: (obj) => obj.restoreRoutes
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _prepare_decorators, {
				kind: "method",
				name: "prepare",
				static: false,
				private: false,
				access: {
					has: (obj) => "prepare" in obj,
					get: (obj) => obj.prepare
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _restart_decorators, {
				kind: "method",
				name: "restart",
				static: false,
				private: false,
				access: {
					has: (obj) => "restart" in obj,
					get: (obj) => obj.restart
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _stop_decorators, {
				kind: "method",
				name: "stop",
				static: false,
				private: false,
				access: {
					has: (obj) => "stop" in obj,
					get: (obj) => obj.stop
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _cleanup_decorators, {
				kind: "method",
				name: "cleanup",
				static: false,
				private: false,
				access: {
					has: (obj) => "cleanup" in obj,
					get: (obj) => obj.cleanup
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _testReport_decorators, {
				kind: "method",
				name: "testReport",
				static: false,
				private: false,
				access: {
					has: (obj) => "testReport" in obj,
					get: (obj) => obj.testReport
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _test_decorators, {
				kind: "method",
				name: "test",
				static: false,
				private: false,
				access: {
					has: (obj) => "test" in obj,
					get: (obj) => obj.test
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		options = __runInitializers(this, _instanceExtraInitializers);
		provider;
		manager;
		key = "";
		local = false;
		error = "";
		disposed = false;
		subprocess;
		auth;
		report;
		tests = [];
		proxy;
		routeEnvironment = {
			searchProvider: process.env.DSH_WEB_SEARCH_PROVIDER,
			fetchProvider: process.env.DSH_WEB_FETCH_PROVIDER
		};
		constructor(ctx, options, provider) {
			super(ctx, "searxngRuntime");
			this.options = options;
			this.provider = provider;
			this.proxy = new ProcessProxy(launchEnvironmentOf(ctx), void 0, new ProxyPreferenceStore(ctx));
			ctx.effect(() => () => this.proxy.dispose(), "SearXNG session proxy restoration");
			ctx.inject(["credentials"], () => {
				this.proxy.restore().catch(() => {});
			});
			this.auth = new InstanceAuthStore(ctx, () => this.options().externalURL);
			ctx.effect(() => async () => {
				this.disposed = true;
				await this.manager?.dispose();
			}, "SearXNG owned process");
			ctx.inject(["subprocess"], (ctx) => {
				this.subprocess = ctx.subprocess;
				this.key = "";
				this.sync();
				ctx.effect(() => async () => {
					const manager = this.manager;
					this.manager = void 0;
					this.subprocess = void 0;
					this.key = "";
					await manager?.dispose("subprocess-service-disposed");
				}, "SearXNG subprocess dependency");
			});
		}
		/** Reconcile only service settings; engine/language writes do not restart the process. */
		sync(force = false) {
			if (this.disposed) return;
			const options = this.options();
			const local = options.mode === "local" || options.mode === "auto" && !options.externalURL.trim();
			const key = JSON.stringify({
				local,
				port: options.port,
				setupTimeoutMs: options.setupTimeoutMs,
				startupTimeoutMs: options.startupTimeoutMs,
				restartLimit: options.restartLimit
			});
			if (!force && key === this.key) return;
			this.key = key;
			this.local = local;
			this.error = "";
			if (!local) {
				this.manager?.stop("external-mode");
				return;
			}
			if (!this.manager) {
				const profile = this.ctx.get("profileContext");
				if (!profile) {
					this.error = "Local management requires a DSH profile; configure an external instance instead";
					return;
				}
				if (!this.subprocess) return;
				this.manager = new ManagedRuntime(join(profile.dir, "searxng"), this.subprocess);
			}
			const manager = this.manager;
			this.proxy.restore().then(() => {
				if (!this.disposed && this.manager === manager && this.key === key) return manager.start(options, false, force ? "operator-restart" : "configuration-change");
			}).catch(() => {});
		}
		/** Only a ready owned service may supply a managed endpoint. */
		endpoint() {
			if (!this.local) return this.options().externalURL;
			const status = this.manager?.status();
			return status?.phase === "ready" ? status.endpoint : "";
		}
		/** Backend-only resolution; owned local processes never receive external credentials. */
		async resolveAuth(options) {
			if (this.local) throw new Error("Managed local SearXNG does not use instance authentication");
			return this.auth.resolve({
				baseURL: options.baseURL,
				headerName: options.authHeaderName ?? ""
			});
		}
		async authDescribe(target) {
			try {
				return await this.auth.describe(target);
			} catch {
				throw new Error("Could not read instance authentication status; check the endpoint, header name and credential service");
			}
		}
		async authSet(target, value) {
			try {
				return await this.auth.set(target, value);
			} catch {
				throw new Error("Could not save the instance credential; check the endpoint, header name, single-line value and credential service");
			}
		}
		async authClear(target) {
			try {
				return await this.auth.clear(target);
			} catch {
				throw new Error("Could not remove the instance credential");
			}
		}
		proxyStatus() {
			return this.proxy.status();
		}
		proxyBegin() {
			return this.proxy.begin();
		}
		proxyConfirm(token, step, revision, accepted) {
			return this.proxy.confirm(token, step, revision, accepted);
		}
		proxyApply(token, configuration) {
			return this.proxy.apply(token, configuration);
		}
		proxyRemove() {
			return this.proxy.remove();
		}
		proxyResume() {
			return this.proxy.resume();
		}
		proxyForget() {
			return this.proxy.forget();
		}
		/** Return setup, readiness and bounded diagnostic output to the operator card. */
		status() {
			const routing = this.routing();
			const routes = {
				routing,
				routeRestore: routeRestoreStatus(this.ctx, routing)
			};
			if (!this.local) return {
				phase: "external",
				endpoint: this.options().externalURL,
				message: "",
				logs: "",
				activities: [...this.tests],
				...routes,
				...this.report ? { testReport: this.report } : {}
			};
			if (this.error) return {
				phase: "failed",
				endpoint: "",
				message: this.error,
				logs: "",
				...routes
			};
			const status = this.manager?.status() ?? {
				phase: "idle",
				endpoint: "",
				message: "Waiting for the DSH subprocess service",
				logs: ""
			};
			return {
				...status,
				...routes,
				activities: [...status.activities ?? [], ...this.tests].sort((a, b) => a.time.localeCompare(b.time)).slice(-100),
				...this.report ? { testReport: this.report } : {}
			};
		}
		routing() {
			return readRoutingStatus(this.ctx, this.routeEnvironment, this.options().fallback);
		}
		restoreRoutes(expectedRevision) {
			return restorePluginRoutes(this.ctx, expectedRevision, () => {
				const live = this.ctx.root.get("searxngRuntime");
				return live && live !== this ? live.status().routing ?? this.routing() : this.routing();
			});
		}
		/** Operator approval applies to this version's initial preparation during this run. */
		prepare() {
			if (!this.local || !this.manager) throw new Error("Local preparation is unavailable; save local mode and wait for the process service");
			this.manager.start(this.options(), true, "operator-prepare");
			return this.status();
		}
		/** Retry failed setup or restart this plugin's local service, preserving configuration. */
		restart() {
			this.sync(true);
			return this.status();
		}
		/** Stop this plugin's local process; external instances are unaffected. */
		async stop() {
			if (this.local) await this.manager?.stop("operator-stop");
			return this.status();
		}
		/** Remove generated local runtime files; normal settings and credential records are separate. */
		async cleanup() {
			if (!this.local || !this.manager) throw new Error("Only the managed local runtime can be cleaned");
			await this.manager.cleanup();
			return this.status();
		}
		/** Structured result of one direct SearXNG search, never the paid fallback. */
		async testReport(signal) {
			const instanceId = this.status().instanceId;
			const report = {
				...await this.provider.testReport(signal),
				...instanceId ? { instanceId } : {}
			};
			this.report = report;
			this.tests.push({
				time: report.time,
				kind: "test",
				subject: report.query,
				detail: `HTTP ${report.httpStatus ?? "-"} / ${report.responseFormat} / ${report.sourceCount} / ${report.elapsedMs} ms${report.message ? ` / ${report.message}` : ""}`
			});
			if (this.tests.length > 100) this.tests.shift();
			return report;
		}
		/** Test the selected SearXNG endpoint without invoking official fallback. */
		async test(signal) {
			return (await this.provider.search({
				query: "SearXNG",
				maxResults: 3
			}, signal)).sources.length;
		}
	};
})();
//#endregion
//#region src/index.ts
/** Cordis plugin name used by loader diagnostics. */
const name = "web-search-searxng";
/** The web seam this provider registers into. */
const inject = ["web"];
/**
* Environment variable naming the instance base URL. The deployment owns this
* endpoint: the provider sends model-chosen query text to it, so it must never
* come from model-visible input.
*/
const SEARXNG_BASE_URL_ENV = "SEARXNG_BASE_URL";
const Config = z.object({
	mode: z.union([
		"auto",
		"local",
		"external"
	]).volatile(),
	managedPort: z.natural().max(65535).default(0).volatile(),
	setupTimeoutMs: z.natural().min(1e3).max(2147483647).default(6e5).volatile(),
	startupTimeoutMs: z.natural().min(1e3).max(2147483647).default(12e4).volatile(),
	restartLimit: z.natural().max(10).default(2).volatile(),
	baseURL: z.string().volatile(),
	engines: z.string().volatile(),
	language: z.string().volatile(),
	authEnabled: z.boolean().default(false).volatile(),
	authHeaderName: z.string().volatile(),
	allowOfficialFallback: z.boolean().volatile(),
	allowOfficialApiFallback: z.boolean().default(false).volatile(),
	allowOfficialFetchFallback: z.boolean().default(false).volatile()
});
/**
* Project the currently resolved fields into the options the provider serves
* its next search with. Environment fallbacks stay here rather than in the
* provider: every value it reads is already fully resolved.
* @param ctx - plugin context supplying the launch environment.
* @param config - the volatile config fields the provider consumes.
* @returns options for one search.
*/
function resolveOptions(ctx, config) {
	return {
		baseURL: config.baseURL ?? launchEnvironmentOf(ctx).get(SEARXNG_BASE_URL_ENV)?.value ?? "",
		...config.engines !== void 0 && config.engines.trim().length > 0 ? { engines: config.engines } : {},
		...config.language !== void 0 && config.language.trim().length > 0 ? { language: config.language } : {}
	};
}
/** Register SearXNG with opt-in fallback and warn about a missing endpoint. */
async function apply(ctx, config) {
	let runtime;
	const provider = new SearxngSearchProvider(() => {
		const options = resolveOptions(ctx, {
			baseURL: config.baseURL.get(),
			engines: config.engines.get(),
			language: config.language.get()
		});
		return {
			...options,
			baseURL: runtime?.endpoint() ?? options.baseURL,
			authEnabled: config.authEnabled.get() === true && runtime?.status().phase === "external",
			authHeaderName: config.authHeaderName.get()
		};
	}, (options) => runtime.resolveAuth(options));
	runtime = new SearxngRuntimeService(ctx, () => ({
		mode: config.mode.get() ?? "auto",
		externalURL: config.baseURL.get() ?? launchEnvironmentOf(ctx).get(SEARXNG_BASE_URL_ENV)?.value ?? "",
		port: config.managedPort.get(),
		setupTimeoutMs: config.setupTimeoutMs.get(),
		startupTimeoutMs: config.startupTimeoutMs.get(),
		restartLimit: config.restartLimit.get(),
		fallback: {
			searchApi: config.allowOfficialApiFallback.get() === true,
			fetchApi: config.allowOfficialFetchFallback.get() === true,
			legacySearch: config.allowOfficialFallback.get() === true
		}
	}), provider);
	runtime.sync();
	ctx.on("loader/volatile-update", () => {
		runtime?.sync();
	});
	const legacyFallback = createOfficialFallbackResolver(ctx);
	const routed = new SearxngFallbackProvider(provider, {
		enabled: () => config.allowOfficialApiFallback.get() === true || config.allowOfficialFallback.get() === true,
		official: () => config.allowOfficialApiFallback.get() === true ? prepareOfficialApi(ctx).then((api) => api.search) : legacyFallback(),
		onAttempt: (reason) => ctx.logger.warn("web-search-searxng: SearXNG search failed (%s); trying the user-enabled official fallback; search fees may apply", reason),
		onDegraded: (record) => ctx.logger.warn("web-search-searxng: SearXNG search failed (%s); served this one request through explicitly enabled official search (%d sources) — extra cost may apply, and the route itself was not changed", record.reason, record.sources)
	});
	ctx.web.registerSearchProvider(routed);
	ctx.web.registerFetchProvider(await createHttpFallbackProvider(ctx, () => config.allowOfficialFetchFallback.get() === true));
	let warnedMissingEndpoint = false;
	const checkEndpoint = () => {
		if (!provider.available() && runtime?.status().phase === "external") {
			if (warnedMissingEndpoint) return;
			warnedMissingEndpoint = true;
			ctx.logger.warn("web-search-searxng: no instance endpoint is configured, so searches routed to SearXNG will fail with the provider unavailable. Set the endpoint on the plugin card or export SEARXNG_BASE_URL, then save the settings.");
			return;
		}
		warnedMissingEndpoint = false;
	};
	checkEndpoint();
	ctx.on("loader/volatile-update", checkEndpoint);
}
//#endregion
export { Config, SEARXNG_PROVIDER_ID, SearxngFallbackProvider, SearxngSearchProvider, apply, createOfficialFallbackResolver, fallbackNotice, inject, mapSearxngResponse, mapSearxngResult, name, supportsOfficialFallback };
