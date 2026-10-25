# 0.4.1 日常维护与截图核验（2026-10-25）

本次基于 GitHub main `c9bc004cb5b2a29234d78247ad977cc0ee411f9d` 检查已发布的插件 `0.4.1`。只更新双语 README、截图与仓库简介，不发布新版本，不改代码、依赖或宿主支持范围。原工作区的未提交功能与安装说明修改没有混入本次提交。

## 检查与改进

- 检查搜索与官方备用、实例凭据、进程代理、托管下载和子进程生命周期；现有回归未发现需要立即修复的失败。
- README 仍展示 0.3.0 界面，替换为本次真实安装的 0.4.1 中英文截图，另加入代理区截图。截图均为默认关闭代理、无个人凭据的状态。
- 标题、首屏说明和功能列表突出可选进程代理，并说明保留官方搜索时也可使用。安装仍追加默认插件路由，更高优先级的用户选择继续生效；代理用途说明没有改写路由规则。
- 下载提速只描述为可能效果，未进行速度基准测试。已运行子进程不会自动重启，不承诺全部工具或 SearXNG 上游请求采用代理；链接保留完整的风险、记忆与移除说明。

## 本次环境与结果

| 项目 | 本次事实 |
|---|---|
| 系统 | macOS 27.0.1 / arm64 |
| 宿主 | 未打补丁 DSH `0.2.1-alpha.2`，提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`；一次性 checkout，源码干净 |
| 工具链 | 插件类型／单元／组合检查固定 Node `24.14.1`；构建、打包、宿主构建与 Web 截图使用 Node `26.8.2`；插件 pnpm `11.7.0`，宿主 pnpm `11.28.5` |
| 类型检查 | `node node_modules/typescript/bin/tsc --noEmit` 通过 |
| 插件回归 | `node node_modules/vitest/vitest.mjs run`：24 文件、211 项通过，无跳过 |
| 构建 | `node_modules/.bin/tsdown` 与 `node node_modules/typescript/bin/tsc -p tsconfig.client.json` 通过，`lib/` 无差异 |
| 真实宿主组合 | `npm_config_offline=true DSH_SOURCE_ROOT="$HOST" node tests/host-composition.mjs`：17/17 通过，无跳过 |
| 安装包审计 | `node scripts/audit-release.mjs "$PACKAGE_DIR"`：33 条目通过 |
| 实际安装与 Web | 原版 CLI 将实际 tarball 安装到全新 `DSH_HOME` 的标准 Web profile，正常加载卡片；中英文首次准备、搜索偏好、默认关闭的付费备用和代理字段均可见 |
| 文档 | 本地图片、链接目标、章节锚点与双语表述核对通过 |

用于截图的 tarball 为 `dsh-web-search-searxng-0.4.1.tgz`，SHA-256 为 `9483f4652b250ada2a5e7fe28a0a0357bb6f6a525d77ea90d9d165ac2954360e`，由修改 README 前的 main 打包；与本次文档更新的可执行文件相同。此包仅用于一次性验收，不替换已有 Release 资产。

安装与启动命令，其中 `$CHECK`、`$HOST`、`$TARBALL` 均为一次性路径：

```sh
DSH_HOME="$CHECK/web-home" node "$HOST/apps/cli/lib/bin.js" plugin --profile web add "$TARBALL"
DSH_HOME="$CHECK/web-home" node "$HOST/apps/cli/lib/bin.js" web \
  --patch "$HOST/apps/web/tests/pin-browse-picker.overlay.yml" --no-open --port 0
DSH_HOME="$CHECK/web-home" node "$HOST/apps/cli/lib/bin.js" plugin --profile web remove dsh-web-search-searxng
```

截图前跳过模型凭据配置，不调用模型或真实付费 API，不启用实际代理。检查后正常停止测试后端并卸载测试包；未访问用户真实 profile、凭据或已有服务。

## 限制与后续改进

此次是文档维护，未重新执行托管服务下载／真实上游搜索、候选宿主、Linux、Windows 或 Node 22.19 验证；不引用历史记录充当本次通过证据。安装报告宿主 peer 提示，但原版宿主加载与真实组合均通过；客户端测试存在上游缺失 sourcemap 的警告。

后续 CI 可按[宿主兼容约定](host-compatibility.zh.md#ci-扩展建议与当前边界)加入固定最低宿主的真实组合和 tarball 安装，以及 Node 22.19 检查。本次未改变这些验证边界。
