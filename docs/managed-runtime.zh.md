# 本地自动托管

[English](managed-runtime.md) | 中文

0.4.1保留 `auto` 选择规则：沿用已有 `baseURL` 或 `SEARXNG_BASE_URL`，没有地址时选择本地托管。`local` 强制本地托管，`external` 连接已有实例。本地缓存缺失或不完整时，等待用户点击「准备并启动」；挂载插件、查询、重启和改设置都不能授予首次下载许可。已发布的 0.3.0／0.3.1 会自动准备；它们留下的可用缓存在 0.4.1 中仍可自动启动。

首次准备摘要展示下载内容、来源、校验方式和运行环境目录。下载程序以当前用户权限执行，独立目录不等于权限沙箱。无需用户安装 Docker、系统 Python、Git 或输入终端命令。确认允许本次 DSH 运行中的准备重试；重新启动后缓存仍不完整，或清理后，需要再次查看摘要并确认。新的固定运行环境没有可用缓存时，也需重新确认。

## 设置与日常使用

在卡片选择引擎、结果语言并保存；这些搜索偏好对下一次请求生效，不重启服务。高级设置的本地端口默认 `0`，由操作系统在绑定时分配空闲端口，没有固定的 8080 依赖，也无需手动开启端口。指定端口被占用时会明确报错，不停止占用者，也不自动改用其他端口。将「本地端口」改回 `0` 并保存即可恢复自动分配。修改端口并保存会停止原有托管进程，再按新端口启动，连接地址由管理器同步，不写入外部实例地址。后续启动可能分配不同端口，插件会自动跟随，无需手改地址。

之前已保存 `http://localhost:8080` 的安装，在 `auto` 模式下继续使用该外部实例。切换到「本地自动托管」（`local`），将「本地端口」保持为 `0`，即可改用插件管理；原外部服务仍由部署者独立管理。

卡片显示首次等待、准备、启动、可用、停止与失败状态。「运行记录」保留本次 DSH 运行中最近 100 个步骤，包括下载来源、通过校验的哈希、解压、实际子进程参数、生成配置、就绪与停止／清理。「进程输出」另行展开，仅保留最近输出。程序直接按参数数组执行，不提供交互式 shell。记录不包含环境变量或鉴权请求头，并隐藏已知敏感值、URL 凭据和本机 home／运行目录。复制包含脱敏后的记录，不包含单独展示的绝对运行目录。它不是跨会话永久审计日志。

「测试搜索」按已保存的引擎、语言与可选实例鉴权查询一次 `SearXNG`，访问上游搜索引擎，不调用大模型；不逐个测试全部引擎，也不使用官方备用。报告展示目标搜索地址、HTTP 状态、JSON 读取情况、耗时、可用来源数和最多三个 HTTP(S) 来源链接。区分连接、鉴权、HTTP、响应与取消失败，不返回任意异常文本或凭据值。0 条来源表示请求完成但没有可用结果，不能证明搜索质量合格。未打补丁的 DSH 0.2.1-alpha.2 没有官方备用能力。

「停止」只结束本插件的进程，保留下载内容。「清理运行环境」需要单独确认，先停止自有工作、取得 profile 文件锁，再删除 `searxng/` 中识别为插件生成的版本运行目录、独立 Python、uv 缓存、生成的设置／secret 与服务脚本。清理拒绝符号链接运行根目录和其他仍在使用的目录；保留其他文件、普通 profile 偏好和凭据。下次准备重新等待确认。「卸载插件」移除包但保留运行目录；若也要删除下载内容，先清理再卸载。不停止或清理外部实例。

## 启动日志怎么看

「进程输出」保留上游的原始日志级别；出现 `ERROR` 不一定表示整个服务退出。判断顺序是：先看卡片是否显示「可用」，再点「测试搜索」检查 HTTP、JSON 与来源数量。就绪检查成功只说明服务可连接，不证明每个上游引擎可用。

| 输出 | 原因与影响 | 处理 |
|---|---|---|
| `DSH_SEARXNG_READY {"port": …}` | 服务脚本报告实际绑定的 SearXNG 端口；管理器还会验证 `/config`。 | 正常启动通知。这不是 Clash 端口，无需复制到代理设置。 |
| `Error while getting the version` / `git URL & branch` / `not a git repository` | 固定源码来自经过哈希校验的压缩包，不包含 `.git`；上游读取 Git 元数据失败并使用回退信息。 | 不影响搜索执行；无需安装 Git 或在运行目录执行 `git init`。 |
| `ahmia` / `torch: can't register engine` | 两者属于 `onions` 分类，上游在未使用 Tor 时不注册它们。默认托管配置没有配置 Tor。 | 这两个引擎不可用，其他引擎可以继续运行；普通 HTTP / Mixed 代理不自动启用 Tor 引擎。 |
| `missing config file: …/limiter.toml` | 缺少可选本地覆盖文件时，上游使用内置默认配置。即使 limiter 关闭，客户端 IP 检测仍会初始化。 | 本地托管已设置 `server.limiter: false`；无需为消除警告开启 Valkey 或开放服务。 |
| `X-Forwarded-For nor X-Real-IP header is set!` | 插件直接访问本地 Waitress，没有反向代理添加这些头；上游仍可使用 WSGI 的 `REMOTE_ADDR`。 | 对当前仅回环监听的拓扑，这不单独表示请求失败。公开反向代理部署需要按部署拓扑配置可信代理，不能盲信任任意客户端头。 |

插件不屏蔽这些原始输出，也不为消除日志伪造转发头、放宽监听地址或修改 TLS 校验。卡片同时提供对应的简要说明。若显示「失败」、HTTP 错误或没有结果，请保留测试报告和脱敏运行记录，分别检查进程退出、上游限流、引擎配置及网络。当前输出把 stdout 与 stderr 汇总显示，不应把显示顺序当成严格的跨流时间顺序。

依据固定上游提交：[版本读取](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/version.py)、[引擎注册](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/engines/__init__.py)、[limiter 初始化](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/limiter.py)、[客户端 IP 处理](https://github.com/searxng/searxng/blob/f4822b3fc46726bb259d14c6332b702c76b98f82/searx/botdetection/trusted_proxies.py)。

## 运行环境与生命周期

本地托管使用当前 DSH profile 的 `searxng/` 目录，存放独立 Python、SearXNG 源码、虚拟环境、缓存、随机生成的服务 secret 与生成的配置。不改变系统 Python 或 PATH。安装工具 uv 0.13.0 的六个平台压缩包和 SearXNG 源码 `f4822b3fc46726bb259d14c6332b702c76b98f82` 均校验固定 SHA-256 后解压；Python 固定为 3.12.12，由 uv 管理下载；Python 依赖通过 PyPI 安装，Waitress 固定为 3.0.2。uv 与源码版本随插件发布固定，失败安装没有就绪标记，下次重试重新准备；版本目录保留以供旧插件复用。

服务只监听 DSH 后端的 `127.0.0.1`，使用 Waitress 与预先绑定的 socket 提供 HTTP 服务。就绪检查确认实际端口与 `/config` 响应后才对搜索提供地址。进程通过 DSH 的公开 `ctx.subprocess` 管理，profile 文件锁防止两个 DSH 进程同时启动同一目录的服务。进程意外退出最多自动重试 2 次；配置可调整 `restartLimit`（0–10）、`setupTimeoutMs`（默认 600000）与 `startupTimeoutMs`（默认 120000）。失败显示在卡片，可手动重试。

服务随启用的插件运行，查询之间保持运行并复用。关闭浏览器标签页不会停止 DSH 后端及其服务。手动停止、切换外部模式、禁用插件或正常退出 DSH 后端时，等待自己启动的子进程退出并释放文件锁；依赖缓存与偏好保留。重启 DSH 时自动重新启动。没有向操作系统注册开机常驻服务。外部模式不启动、停止或修改已有实例。强制终止宿主时的进程清理由 DSH 子进程提供方负责，文件锁具备过期恢复；不能保证所有操作系统强制终止方式的相同行为。

缓存启动无需重复安装运行环境；搜索公开网页仍需通过网络访问所选上游引擎。

Windows 在固定源码压缩包校验后应用一项兼容修正：Valkey 适配器将 Unix 专有的 `pwd` 用户信息模块改为可选，连接失败时使用不依赖该模块的日志。修改前匹配预期源码，就绪标记包含兼容版本；POSIX 行为保持不变。这是插件维护的修正，不代表上游承诺支持 Windows。

## 平台与验证

安装工具覆盖 macOS/Windows/Linux glibc 的 x64 与 arm64；不支持的系统显示明确错误，可使用外部实例。本机验证覆盖 macOS arm64、未打补丁的 DSH 0.2.1-alpha.2，以及从空目录下载、真实搜索、完整 Web 卡片、缓存重启、停止和插件退出清理。[Windows、macOS、Linux GitHub Actions 已于 2026-10-10 通过](https://github.com/Chaos-Paradox/dsh-web-search-searxng/actions/runs/38034853680)，包含单元测试、构建、从空目录准备服务、缓存重启与清理。CI 就绪验证不依赖上游搜索引擎结果，完整 CPU/发行版矩阵未覆盖；未测试系统的 Python 与依赖可用性仍需验证。DSH peer 范围也不等于对所有宿主版本的兼容保证，目前仅实际测试 0.2.1-alpha.2。

`pnpm run test:managed` 使用构建后的发布 JS，从临时空目录准备真实服务，检查来源、缓存重启和清理，结束后删除临时数据。设置 `SEARXNG_SMOKE_SEARCH=0` 可只验证服务准备与生命周期。详细结果见仓库中的[验证记录](https://github.com/Chaos-Paradox/dsh-web-search-searxng/blob/main/docs/validation-managed-2026-10-10.md)。

上游：[uv 的 Python 管理](https://docs.astral.sh/uv/guides/install-python/)、[SearXNG 源码](https://github.com/searxng/searxng/tree/f4822b3fc46726bb259d14c6332b702c76b98f82)、[Waitress](https://docs.pylonsproject.org/projects/waitress/en/latest/)。各项目采用其上游许可证；下载的 SearXNG 源码保留其许可证文件。
