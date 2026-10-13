# 0.3.1 发布验证（2026-10-13）

本记录对应 PR [#5](https://github.com/Chaos-Paradox/dsh-web-search-searxng/pull/5) 的发布候选，不引用旧构建的验收结果。后续提交仅增加本记录；发布前应确认最终提交中所有 tarball 文件与本次验收包一致。发布标签的最终提交可从 [v0.3.1](https://github.com/Chaos-Paradox/dsh-web-search-searxng/releases/tag/v0.3.1) 查看。

## 构建与环境

| 项目 | 本次值 |
|---|---|
| 插件版本 | `0.3.1` |
| 验收包对应提交 | `46cab50b3c0c96a3bff7991ce00565256546d785` |
| Tarball | `dsh-web-search-searxng-0.3.1.tgz` |
| SHA-256 | `c08f6eff0b89fdffa68e0835bb49734d94093829f6ec42222621aaece83cee5c` |
| 最低／推荐宿主 | 未打补丁的 DSH `0.2.1-alpha.2`，标签 `dsh-v0.2.1-alpha.2` |
| 宿主提交 | `d743267388641bc76f17c45ce8b4c231aed1d32c`，工作区干净，复用其已构建产物 |
| 完整本地验收 | macOS `27.0.1`（`26A434`），Darwin `arm64` |
| 本地 Node / 插件 pnpm | `v24.14.1` / `11.7.0` |
| 宿主公开 CLI 的 pnpm | `11.28.5` |

所有宿主验证都指定一次性 `DSH_HOME`。Web 验收使用干净的标准 `web` profile，通过公开 CLI 安装实际 tarball；没有使用开发目录软链接、宿主补丁、版本豁免或真实用户凭据。宿主组合测试另行使用其隔离 fixture，不能替代 tarball 安装验收。

## 执行命令与结果

下列路径变量代表本次一次性目录与固定宿主 checkout，省略本机用户名和绝对开发路径。插件命令在插件仓库执行；`pnpm dsh` 命令在固定宿主仓库根目录执行。

```sh
CI=true pnpm install --frozen-lockfile
pnpm --config.verify-deps-before-run=false run typecheck
pnpm --config.verify-deps-before-run=false test
pnpm --config.verify-deps-before-run=false run build
DSH_HOME="$RELEASE_CHECK/host-home" DSH_SOURCE_ROOT="$HOST_ROOT" \
  pnpm --config.verify-deps-before-run=false run test:host
DSH_HOME="$RELEASE_CHECK/managed-home" \
  pnpm --config.verify-deps-before-run=false run test:managed
pnpm --config.verify-deps-before-run=false pack --pack-destination artifacts
```

全部退出码为 0。类型检查、冻结依赖安装与构建通过，重建后的 `lib/` 与提交一致；插件 **127 项测试／13 个测试文件**通过，真实宿主组合 **10 项**通过。组合覆盖真实凭据服务、即时设置保存、取消、无付费默认、公开备用能力缺失、配置优先级、bundle 禁用／启用／移除及路由恢复。

托管 smoke 在空缓存中下载固定依赖、启动服务并实际查询上游，返回 **3 条来源**；HTTP 就绪、缓存重启、停止与插件退出清理全部通过，最终清理完成。此处没有设置 `SEARXNG_SMOKE_SEARCH=0`。

```sh
DSH_HOME="$RELEASE_CHECK/web-home" \
  pnpm --config.verify-deps-before-run=false dsh plugin --profile web add "$TARBALL"
env -u SEARXNG_BASE_URL -u DEEPSEEK_API_KEY -u OPENAI_API_KEY \
  DSH_HOME="$RELEASE_CHECK/web-home" \
  pnpm --config.verify-deps-before-run=false dsh web \
  --patch apps/web/tests/pin-browse-picker.overlay.yml --no-open --port 3091
# 下列命令在 Web 后端正常退出后执行。
DSH_HOME="$RELEASE_CHECK/web-home" \
  pnpm --config.verify-deps-before-run=false dsh plugin --profile web remove dsh-web-search-searxng
DSH_HOME="$RELEASE_CHECK/web-home" \
  pnpm --config.verify-deps-before-run=false dsh --profile web --dump-config
```

安装、卸载与配置导出退出码为 0。安装正常解析宿主 peer，未借用插件开发依赖。Tarball 包含客户端／服务端构建、bundle、类型声明和中英文配置、托管及兼容性文档。

## 实际发布包的 Web 验收

- 初始 profile 没有实例地址、引擎或鉴权设置。卡片显示 `v0.3.1`，自动准备本地服务并选择空闲端口，没有加载或注入错误。保存 Bing／Yahoo 与英语后，无 Key 的真实搜索返回 **10 条来源**。
- 指定占用中的测试端口后明确报告端口冲突；保存另一个空闲固定端口后自动重启。原端口关闭，新端口就绪。卡片停止后监听消失；恢复 `0` 后重新自动分配空闲端口。
- 外部无鉴权 fixture 返回 1 条来源，未收到鉴权头。受保护 fixture 在缺少凭据和错误凭据时返回 401；保存正确的自定义头名与虚构令牌后返回 1 条来源。
- 空白密钥字段下保存语言修改会保留已有凭据；实际请求携带保存的头名、引擎与语言。改头名、挂载路径或实例地址后显示未保存凭据，搜索在发请求前失败；恢复原目标后成功。fixture 请求计数证明上述切换没有转发原目标令牌。
- 保存的虚构令牌只存在一次性 `DSH_HOME` 的凭据存储，普通 `cordis.patch.yml` 不含令牌；保存后密码输入框为空，卡片仅显示保存状态。读取 RPC 不返回值的断言由本次单元／真实宿主测试覆盖。
- 带着已保存的外部凭据切换本地模式仍能完成搜索，不再访问外部 fixture。本次 Bing／Yahoo + 中文查询返回 0 条来源；这不是宿主加载失败，上游返回数量不作固定保证。本地不携带实例凭据还由本次提供方 HTTP 测试覆盖。
- 禁用整个已安装 bundle 后，卡片消失且自有端口关闭；重新启用后自动启动并保留引擎、语言与服务偏好。向本次 Web 后端发送 SIGTERM 后，后端与自有 SearXNG 的监听均消失。
- 公开 CLI 卸载后安装目录消失，配置与凭据文件逐字节保持一致。配置导出恢复标准 `deepseek-official` 搜索路由，没有 SearXNG 路由。保留的 `web-search-searxng` 设置产生非致命的 `patch: entry ... not found` 提示，命令正常完成；未为消除提示删除用户偏好，也未调用官方搜索。

## CI 与未覆盖项

候选提交的 [push CI](https://github.com/Chaos-Paradox/dsh-web-search-searxng/actions/runs/38372531427) 与 [PR CI](https://github.com/Chaos-Paradox/dsh-web-search-searxng/actions/runs/38372537773) 六个 job 全部成功。日志确认的 PR 平台为 Ubuntu 24.04 x64（Node `24.21.0`）、macOS 26 arm64（Node `24.20.0`）、Windows 2025 x64（Node `24.21.0`），均使用 pnpm `11.7.0`。这些 job 执行类型检查、127 项插件测试、构建与禁用真实上游搜索的托管生命周期 smoke；最终文档提交也必须通过现有 CI 后合并。

- Linux、Windows 没有运行本次完整宿主组合与 tarball Web 交互：**未验证**，不能把上述 CI 解释为完整发布验收。
- Node `22.19`、macOS x64、Linux／Windows arm64、其他系统架构及其他 DSH 版本：**本次未验证**。
- DSH `0.2.1-alpha.2` 没有公开 `searchWithProvider`，不能执行官方备用成功路径。显式启用时报告能力限制，默认／失败／取消均没有付费请求；未安装宿主补丁使该路径通过。
- 浏览器全流程与宿主组合目前是本地发布前检查，现有 CI 不自动执行它们。没有扩大支持范围；最低版和推荐版仍同为冻结基准 `0.2.1-alpha.2`。
- tarball、测试日志、一次性配置和凭据不提交到 Git。GitHub Release 上传上述 tarball 与校验和文件，截图与原始日志保留为本地验收产物。测试未使用真实模型或搜索 API Key。
