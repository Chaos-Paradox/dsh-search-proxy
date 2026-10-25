# DSH Search & Proxy 0.5.0 发布验证（2026-10-25）

本次将包与仓库从 `dsh-web-search-searxng` 改为 `dsh-search-proxy`，界面显示 **DSH 搜索与代理 / DSH Search & Proxy**。发布提交由 `v0.5.0` 固定，精确提交与对应 CI 链接写入 Release。没有混入原工作区未提交的网络预检等维护修改。

## 最终安装包与环境

- 安装包：`dsh-search-proxy-0.5.0.tgz`；SHA-256：`dcc23f6be8207e49d978e796c6843fa6582d8af5befcef07c7826c2d096d6848`。
- macOS `27.0.1` / arm64；插件类型、构建、单元、真实组合、托管服务和实际 Web 使用 Node `24.14.1`。打包使用 pnpm `11.7.0`（Node `26.8.2`）。
- 最低／推荐宿主：未打补丁的 DSH `0.2.1-alpha.2`，标签 `dsh-v0.2.1-alpha.2`，提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`。复用本会话干净源码、pnpm `11.28.5` / Node `26.8.2` 构建的标准 base/Web 宿主；没有版本替换、宿主补丁或 peer 豁免。
- 验证均使用一次性 checkout、profile、凭据与本地 fixture；不访问用户真实 profile、凭据或已有外部服务。

## 本次改动与检查

| 检查 | 本次结果 |
|---|---|
| 类型检查 | `node node_modules/typescript/bin/tsc --noEmit` 通过 |
| 插件回归 | `node node_modules/vitest/vitest.mjs run`：24 文件、211 项通过，无跳过 |
| 构建 | `node_modules/.bin/tsdown` 与 `node node_modules/typescript/bin/tsc -p tsconfig.client.json` 通过，包含对应 `lib/` |
| 真实宿主组合 | `npm_config_offline=true DSH_SOURCE_ROOT="$HOST" node tests/host-composition.mjs`：17/17 通过，无跳过 |
| 托管服务 | `node tests/managed-smoke.mjs`：空目录准备、真实搜索 3 条来源、缓存重启／重新挂载、同一固定端口立即重启、停止、清理及退出通过 |
| 发布包审计 | `node scripts/audit-release.mjs "$PACKAGE_DIR"`：35 条目通过，包括双语改名说明，无 fixture、开发主目录或固定测试代理值 |
| 最终包干净安装 | 在另一套全新标准 Web profile 安装最终 tarball 并通过认证 RPC：默认 `searxng` / `searxng-http`，付费备用与代理关闭，首次准备等待确认 |
| 旧包到最终新包 | 真实旧 `0.4.1` tarball 安装、保存、卸载，更新显式包名绑定，再安装最终新包；偏好、实例凭据和已关闭的代理记忆可继续读取 |
| 实际 Web | 中英文新名称与模块正常加载；保存语言后真实搜索返回 10 条来源；不携带旧实例鉴权，不使用官方备用；端口变更、停止和固定端口缓存重启通过 |

安装和 Web 验收使用原版 CLI：

```sh
DSH_HOME="$CHECK/migration-home" node "$HOST/apps/cli/lib/bin.js" plugin --profile web add "$OLD_TARBALL"
DSH_HOME="$CHECK/migration-home" node "$HOST/apps/cli/lib/bin.js" web \
  --patch "$HOST/apps/web/tests/pin-browse-picker.overlay.yml" --no-open --port 0
# 保存一次性测试数据，正常停止后端；按改名说明更新 name 绑定。
DSH_HOME="$CHECK/migration-home" node "$HOST/apps/cli/lib/bin.js" plugin --profile web remove dsh-web-search-searxng
DSH_HOME="$CHECK/migration-home" node "$HOST/apps/cli/lib/bin.js" plugin --profile web add "$FINAL_TARBALL"
```

`OLD_TARBALL` 为原 `v0.4.1` Release 包，SHA-256 为 `073b336379d276e8106a5b0d9866ebabaee9d7837a4e58cfebe76fe4be4a86e5`。新包使用本记录开头的最终 SHA。认证 RPC 通过正常 Web token 交换 cookie 调用，未绕过宿主认证。

## 迁移中发现的必要步骤

DSH 保存设置时会在 profile 的 `cordis.patch.yml` 中保留条目的 `name: dsh-web-search-searxng`。只卸载重装而保留这个绑定时，旧配置不会应用到新包；本次确实复现，未描述成自动迁移成功。

按[迁移说明](rename.zh.md)只把 `id: web-search-searxng` 条目的包名绑定改为 `dsh-search-proxy` 后，原 `bing,yahoo`、`zh-CN`、外部实例地址、鉴权请求头、实例凭据与关闭的代理记忆均验证成功。设置／凭据命名空间、路由、缓存目录及进程代理所有权标识保持原值。两个包不能同时启用；回退时同样要更新显式绑定。

## 固定端口重启修复

本轮验收复现原实现停止后立即重启固定端口时的 `Address already in use`。原始 Python 监听套接字没有处理 POSIX `TIME_WAIT` 复用；改用标准库 `socket.create_server`，保持回环地址、指定／自动端口与 backlog 128。该函数在 POSIX 上设置端口复用，不使用允许多个监听者的 `SO_REUSEPORT`，平台处理遵循 [Python 文档](https://docs.python.org/3/library/socket.html#socket.create_server)。

`test:managed` 增加将刚关闭服务的同一端口用于重新挂载、停止后立即重启的真实回归。修复后重新执行类型、构建、211 项测试、17 项真实组合和空缓存真实搜索；最终 tarball 又执行实际安装、真实搜索及固定端口启停验证，没有引用修复前的通过结果代替本次代码证据。

四张新名称截图来自本轮实际安装的 0.5.0 Web 界面。之后的监听修复仅改变后端，最终包的客户端构建与截图时逐字节相同。双语 README、改名文档、图片和当前版本链接均检查。

## CI、警告与未覆盖项

发布前核对发布提交的 Linux、macOS、Windows / Node 24 CI，包括新增固定端口回归；具体运行链接与结果见 Release。本地通过不等于三个平台已经通过。

本地安装报告宿主提供的 peer 提示，原版兼容检查、启动与 RPC 成功；未修改 peer 或宿主来消除提示。单元测试保留上游缺失 sourcemap 的警告。

本次未验证 rc.2 候选、Node 22.19、全部 CPU 架构／Linux 发行版、完整 Electron 行为、真实付费 API 或真实用户代理。官方调用用本地探针覆盖，无真实付费请求。GitHub 仓库改名不等于 npm 注册表发布；本次不将候选包名未占用视为已发布或已预留。
