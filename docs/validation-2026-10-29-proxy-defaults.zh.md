# 代理配置回填与更新验证（2026-10-29）

本次是工作区修复，未发布。插件版本为 `0.5.0`，基于提交 `0deaff2198d1e4fac27dddcdb15f1800975651cd` 的已有未提交工作区继续修改；未提交其他维护任务的变更。

已保存的协议、主机、端口和额外直连主机会自动回填，代理开启或关闭时均可查看和编辑。未修改时继续复用有效确认；运行中修改后点击「更新代理配置」先关闭旧代理，再确认新配置。成功后保存新值，取消则保持关闭并保留旧值。操作员设置接口 `proxyDescribe` 返回回填字段，普通状态接口仍不返回地址或授权。

## 环境与结果

- 系统：macOS `27.0.1` / build `26A434`，arm64。
- 插件类型检查、测试和构建：Node `24.14.1`；现有 pnpm CLI 为 `11.7.0`。`pnpm run` 的自动依赖检查尝试联网并中止，因此直接执行已有本地工具，未重装插件依赖。
- 宿主：一次性 checkout，未打补丁的 DSH `0.2.1-alpha.2`，固定提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`。安装、标准构建后 `git status --short` 为空；宿主 pnpm `11.28.5`，构建子进程使用 Node `26.8.2`，组合测试使用 Node `24.14.1`。
- 所有组合测试使用一次性 profile、凭据文件及本地测试服务，未访问用户真实 profile 或已有外部服务。

| 检查 | 实际命令 | 结果 |
|---|---|---|
| 类型 | `node node_modules/typescript/bin/tsc --noEmit` | 通过 |
| 单元与客户端 | `node node_modules/vitest/vitest.mjs run` | 25 个文件，223 项通过，无跳过 |
| 构建 | `node_modules/.bin/tsdown`；`node node_modules/typescript/bin/tsc -p tsconfig.client.json` | 通过，包含对应 `lib/` |
| 宿主准备（在一次性 checkout） | pnpm `11.28.5`：`install --frozen-lockfile`、`run build` | 通过；首次离线安装因缓存缺失失败，联网冻结安装成功 |
| 真实宿主组合 | `npm_config_offline=true DSH_SOURCE_ROOT="$HOST" node tests/host-composition.mjs` | 17 项通过，无跳过 |
| 差异格式 | `git diff --check` | 通过 |

客户端覆盖自动回填、启停后字段仍可见、未修改直接恢复、四个字段更新、刷新回填新值、取消更新保留旧值、回调刷新保留草稿、无效端口不停止现有代理、只读页面和传输失败后的状态协调。真实宿主覆盖新接口经共享 RPC 网关返回全部字段、真实凭据保存、配置更新后 bundle 重载、显式关闭后保留默认值及卸载恢复原策略。

首次沙箱内运行涉及本地监听的测试、宿主构建时遇到 `EPERM`；允许本地测试端口／IPC 后原命令通过。客户端依赖存在上游缺失 source map 的警告，不影响通过结果。

## 未验证范围

本次未执行发布 tarball 安装、完整浏览器 Web 验收、托管环境下载／真实上游搜索、其他宿主版本、Linux、Windows 或 Node `22.19`。没有创建发布包、标签或发布；以上结果不代替发布前完整验收，也不扩大宿主兼容范围。
