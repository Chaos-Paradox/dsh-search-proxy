# 0.3.2 本地开发验证（2026-10-13，未发布）

本记录对应首次准备确认、可展开运行记录、搜索测试报告和清理操作的开发变更。没有推送、合并或创建 0.3.2 Release；安装文档仍明确标注开发状态，稳定版链接保持 v0.3.1。

| 项目 | 本次值 |
|---|---|
| 插件实现提交 | `0b991850fb5a817829f54388abe11ae012730374` |
| 插件／包版本 | `0.3.2`，本地开发包 |
| 最终 tarball | `dsh-web-search-searxng-0.3.2.tgz` |
| SHA-256 | `d19b0be444598e735cfd51d2864a4fb346ae1a588fdf1708b88cde003c8ca05a` |
| 宿主 | 未打补丁 DSH `0.2.1-alpha.2`，提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`，已构建且工作区干净 |
| 本地环境 | macOS `27.0.1` / arm64，Node `24.14.1`，插件 pnpm `11.7.0`，宿主公开 CLI pnpm `11.28.5` |

## 命令与结果

插件命令在仓库根目录执行，公开 `pnpm dsh` 在固定宿主根目录执行。收尾时原宿主出现其他任务的修改，已完整保留；另外创建了精确基准的干净工作树，冻结安装并独立构建，再运行组合回归及全新 Web profile 验收。下列变量代称本次临时目录，省略本机用户名、私有路径和 Web 启动令牌。

```sh
CI=true pnpm install --frozen-lockfile
git -C "$HOST_REPO" worktree add --detach "$HOST_ROOT" d743267388641bc76f17c45ce8b4c231aed1d32c
pnpm --dir "$HOST_ROOT" install --frozen-lockfile
pnpm --dir "$HOST_ROOT" run build
pnpm --config.verify-deps-before-run=false run typecheck
pnpm --config.verify-deps-before-run=false test
pnpm --config.verify-deps-before-run=false run build
DSH_HOME="$CHECK/host-home" DSH_SOURCE_ROOT="$HOST_ROOT" \
  pnpm --config.verify-deps-before-run=false run test:host
DSH_HOME="$CHECK/managed-home" \
  pnpm --config.verify-deps-before-run=false run test:managed
pnpm --config.verify-deps-before-run=false pack --pack-destination "$CHECK/final-pack"
DSH_HOME="$CHECK/web-home" \
  pnpm --config.verify-deps-before-run=false dsh plugin --profile web add "$TARBALL"
env -u SEARXNG_BASE_URL -u DEEPSEEK_API_KEY -u OPENAI_API_KEY \
  DSH_HOME="$CHECK/web-home" pnpm --config.verify-deps-before-run=false dsh web \
  --patch apps/web/tests/pin-browse-picker.overlay.yml --no-open --port 3092
# 后端正常退出后卸载测试包。
DSH_HOME="$CHECK/web-home" \
  pnpm --config.verify-deps-before-run=false dsh plugin --profile web remove dsh-web-search-searxng
```

插件冻结安装、类型检查、构建、**140 项测试／15 个测试文件**和 **10 项真实宿主组合**全部通过。干净基准宿主的冻结安装、完整构建和再次运行的 10 项组合回归也通过。组合测试新增对真实凭据服务下的报告、HTTP 状态、无官方调用和敏感值缺席的检查。取消显示修正后又完成 28 项客户端测试及最终全套测试，`lib/` 已重建。依赖和 lockfile 未修改；正式发布仍需完成发布约定的相应检查。

真实托管 smoke 使用空目录，确认先等待准备批准，再下载并启动；上游搜索返回 **3 条来源**。缓存重启、新插件挂载自动复用缓存、停止、清理和退出均通过。清理后调用重启仍等待确认，没有自动重新下载。测试临时目录由脚本清理。

## 实际 tarball 的 Web 验收

通过公开 CLI 正常解析 peer 并安装 tarball，没有使用开发目录软链接、宿主补丁或版本豁免。初次包验收中，卡片等待准备确认且测试按钮禁用；确认前运行环境目录不存在。点击「准备并启动」后显示 uv／源码下载来源、通过校验的 SHA-256、解压、实际子进程参数、配置与就绪记录，路径使用 `<profile>/searxng` 代称。

保存 Bing、Yahoo 与英语后，无 Key 的真实测试报告返回 HTTP 200、JSON、**10 条来源**、耗时和三个来源链接，实例鉴权与官方备用均为否。验收发现取消后短暂显示旧报告，修正并新增回归测试后，重新打包安装最终包；实际安装后的客户端／服务端字节与最终 `lib/` 一致。

最终包重启无需再次确认，自动复用已有缓存，保留已保存的搜索偏好。最终中文和英文卡片均完成真实搜索，返回 HTTP 200、JSON 和 10 条来源。再次取消只显示取消状态，不再出现上一轮成功报告。使用本次临时空闲端口作为未运行外部实例，显示连接阶段失败、未收到 HTTP 响应、`ECONNREFUSED` 与检查服务／地址／端口的提示，没有官方调用。

在独立构建的干净基准宿主中，又用最终 tarball 安装全新的标准 Web profile，重新完成等待首次确认、实际下载、日志与可用状态的验证；保存 Bing／Yahoo 和英语后，真实搜索报告再次返回 HTTP 200、JSON 和 **10 条来源**。原宿主的并发修改不作为这次干净基准验证的输入。

卡片清理先展示删除范围与独立确认按钮；取消确认后缓存与运行中的本地服务保留。实际删除、目录锁冲突、符号链接拒绝与偏好／凭据保留由本次单元测试和真实托管 smoke 验证，未在浏览器中提交删除确认。Web 后端 SIGTERM 正常退出后，自有后端／SearXNG 的监听均消失。公开 CLI 卸载后包目录消失，profile 设置文件逐字节保留。

截图、tarball、原始日志和临时配置均作为忽略的本地验收产物，不提交到 Git。测试使用虚构凭据，没有使用真实模型或搜索 API Key，也没有修改真实用户 profile 或已有外部服务。

## 未覆盖项

- 本次未运行远端 CI；不能引用 0.3.1 或更早 CI 作为当前构建通过的证据。
- Linux、Windows、Node 22、其他 CPU 架构和其他 DSH 版本本次未验证。最低版／推荐版仍同为固定 `0.2.1-alpha.2`。
- 基准宿主没有公开 `searchWithProvider`，无法验证官方备用成功路径；默认、失败、取消与测试报告均没有调用付费提供方。
- 运行记录是本次 DSH 运行的有界记录，不持久保存跨会话历史；它不能替代永久审计系统。
