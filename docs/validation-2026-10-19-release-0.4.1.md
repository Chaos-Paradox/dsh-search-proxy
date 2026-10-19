# v0.4.1 发布验证（2026-10-19）

插件版本 `0.4.1`。发布提交由不可变标签 `v0.4.1` 固定；精确 SHA 与三系统 CI 运行链接在 [Release](https://github.com/Chaos-Paradox/dsh-web-search-searxng/releases/tag/v0.4.1) 中记录。本次发布包含首次准备确认与运行记录、代理记忆、独立的官方 API 备用、路由费用状态及主动恢复；不混入本地历史验证草稿。

## 最终安装包与环境

- 文件：`dsh-web-search-searxng-0.4.1.tgz`，随 Release 提供。
- SHA-256：`073b336379d276e8106a5b0d9866ebabaee9d7837a4e58cfebe76fe4be4a86e5`。
- macOS `27.0.1`、构建 `26A434`、arm64；插件与组合测试 Node `v24.14.1`、pnpm `11.7.0`。
- 最低／推荐宿主：原版 DSH `0.2.1-alpha.2`，标签 `dsh-v0.2.1-alpha.2`，提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`，源码 checkout 干净且已构建。宿主工具链 pnpm `11.28.5`。
- 额外候选：原版桌面随附 DSH `0.2.1-rc.2` 运行时，`dshBuildCommit=332895e0f7c9d4dbfb29729f5eb367fa263ff986`、`dshBuildDirty=false`，提取时校验 asar 与 unpacked 文件。实际 Web 与安装使用随附 Node `v24.21.0`。不等于同名 GitHub 标签或全部 Electron 行为已经验证，不晋升推荐宿主。
- 不改宿主、不放宽 peer、不使用版本替换或兼容性豁免。所有 profile、凭据与本地 fixture 均为一次性测试数据，未访问用户真实配置。

## 本地发布检查

| 检查 | 本次结果 |
|---|---|
| `pnpm run typecheck` | 通过 |
| `pnpm test` | 24 个文件、211 项通过 |
| `pnpm run build` | 通过，包含对应 `lib/` |
| alpha.2 真实宿主组合 | 17/17 通过，无跳过 |
| rc.2 真实宿主组合 | 17/17 通过，无跳过 |
| `pnpm run test:managed`（真实联网） | 全新环境准备、HTTP 就绪、真实搜索 3 条来源、缓存重启／重新挂载、停止、清理与退出全部通过 |
| 最终 tarball 审计 | 33 个条目通过，无测试 fixture、开发主目录或固定代理地址 |
| 两套最终包全新 profile 安装 | 通过；33 个包内文件逐字节匹配两套安装结果 |
| 两套最终包标准 Web 启动与认证 RPC | 通过；默认 `searxng` / `searxng-http`，所有付费备用关闭，首次准备等待确认，公开恢复能力可用 |
| 实际包 Web 设置卡／服务／搜索 | 两个宿主均通过，下述范围 |

真实组合命令：

```sh
npm_config_offline=true DSH_SOURCE_ROOT="$HOST_ALPHA" node tests/host-composition.mjs
npm_config_offline=true DSH_RUNTIME_ROOT="$HOST_RC2" DSH_EXPECTED_VERSION=0.2.1-rc.2 node tests/host-composition.mjs
pnpm run test:managed
pnpm pack --pack-destination artifacts/release-0.4.1-final/package
node scripts/audit-release.mjs artifacts/release-0.4.1-final/package
```

`HOST_ALPHA` 为上述精确 checkout，`HOST_RC2` 为上述桌面随附运行时。组合用例覆盖真实配置层、设置／凭据、认证 RPC、搜索／抓取路由、代理启停与记忆、取消、备用权限独立及默认不收费、主动恢复、home／overlay 阻挡、禁用与卸载。官方响应使用本地模拟，**没有真实付费 API 调用**。

测试中上游客户端包缺少部分 source map，Vite 提示相关警告但测试通过。隔离 profile 的 pnpm peer 检查报告缺少五个由 DSH 提供的宿主 peer；其依赖解析由原版宿主运行时完成，真实兼容性检查、启动和 RPC 均通过。没有向 profile 复制宿主包或绕过宿主检查。

## 实际包安装与 Web 验收

每个宿主使用全新的 `DSH_HOME`，执行原版 CLI：

```sh
DSH_HOME="$CHECK/alpha2" node "$HOST_ALPHA/apps/cli/lib/bin.js" plugin --profile web add "$TARBALL"
DSH_HOME="$CHECK/rc2" "$DESKTOP_NODE" "$HOST_RC2/node_modules/@deepseek-ai/dsh/lib/bin.js" plugin --profile web add "$TARBALL"
# 各自以原版 CLI 启动标准 Web；不启用账号或模型：
DSH_HOME="$CHECK/alpha2" node "$HOST_ALPHA/apps/cli/lib/bin.js" web --patch "$BROWSE_PICKER_OVERLAY" --no-open --port 0
```

rc.2 使用相同 Web 参数和其随附 Node／CLI。`BROWSE_PICKER_OVERLAY` 为宿主自带的 `apps/web/tests/pin-browse-picker.overlay.yml`，只固定目录选择器，无宿主 API 或版本补丁。

- 两套卡片均完成从空缓存准备到可用、保存 `bing,yahoo` 引擎并执行真实查询，各返回 12 条来源，报告未调用官方备用。alpha.2 同时保存并验证 `zh-CN`。
- alpha.2 修改本地端口后自动停止旧服务，在指定空闲端口重新就绪；外部模式切换停止自有服务。无鉴权 fixture 成功；受保护 fixture 的缺少／错误请求头均返回 401，正确请求头返回 200。秘密未进入普通 profile 配置，也未在卡片中回显。
- 修改实例挂载路径后显示没有该目标凭据，测试在发送前拒绝，fixture 未收到任何对新路径的请求。切回本地后真实搜索仍返回 12 条来源，报告实例鉴权和官方备用均未使用。地址／头名绑定的其余分支另由单元与真实组合用例覆盖。
- rc.2 验证停止后端口不可达、缓存重新启动、整包停用／再次启用后缓存服务恢复。打开官方内置 API 开关并保存后，插件显示两个官方 API 路由与费用提示，已保存的插件备用仍关闭；主动确认恢复后，两条插件路由保存并读回成功。该用户选择在再次启用后保留。
- 两套测试后端均已停止，测试包从功能验收 profile 正常卸载，已保存偏好按设计保留。主动恢复的用户层路由仍保留，符合文档说明，不静默代选付费后端。所有自有监听和 fixture 已关闭。

完整卡片验收包 SHA 为 `c2c9db81756a5e2817000a5a6763d0807f198cf3d83fe881ae775b003d90c7cb`。随后只修订两份 README 的当前版本／平台说明，形成上述最终 SHA；逐条比较确认所有可执行文件、声明、manifest 和 bundle 完全相同。最终包又在另外两套全新 profile 安装，逐文件核对后实际启动，并通过认证状态 RPC。因此本记录没有将旧源码或旧候选包的测试当作当前代码通过。

本地日志、截图与逐文件核对保存在忽略目录 `artifacts/release-0.4.1-final/`，不加入发布包。实际发布资产以 SHA-256 与 Release 说明为准。

## CI 与边界

发布前另核对发布提交的 Linux、macOS、Windows / Node 24 CI，运行冻结锁文件安装、类型、211 项测试、构建、tarball 审计和空缓存托管生命周期。精确执行结果与运行 URL 写入 Release；它不替代上述本地真实搜索和宿主组合证据。

未验证 Node `22.19` 的实际执行、全部 CPU 架构／Linux 发行版、其他 DSH 版本、完整 Electron 功能、真实收费及真实账号授权。官方 Fetch 备用不能保证绕过反爬；代理后的目的地限制由代理承担，风险与操作说明见对应文档。费用面板是当前 profile 的路由配置快照，不是账单或费用拦截。
