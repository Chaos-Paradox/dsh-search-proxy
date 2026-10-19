# 0.4.1 候选：主动恢复插件路由验证

日期：2026-10-19。本记录对应新增恢复功能后的构建，不沿用此前 tarball 的通过结论；没有提交、打标签或发布 Release。

## 构建与宿主

- 插件版本 `0.4.1`，基于 `12ea8d00719b725138fa9a9ce8b81b7bfdf7e096` 的未提交工作区，保留原有维护修改。源码已重建为对应 `lib/`。
- tarball：`artifacts/route-restore-2026-10-19/package/dsh-web-search-searxng-0.4.1.tgz`。
- SHA-256：`bba2a59218f587c533680fe1c2c5b240e009e27f4cf17cf47e69d9aea27b4931`。
- macOS `27.0.1` / `26A434` / arm64；插件及组合测试 Node `v24.14.1`，插件 pnpm `11.7.0`；宿主安装工具 pnpm `11.28.5`。
- 最低宿主：未打补丁的 DSH `0.2.1-alpha.2`，标签 `dsh-v0.2.1-alpha.2`，提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`；复用已构建且源码干净的 checkout。
- 候选宿主：原版桌面随附 DSH `0.2.1-rc.2`，`dshBuildCommit=332895e0f7c9d4dbfb29729f5eb367fa263ff986`，`dshBuildDirty=false`。提取运行时已校验 asar 与 unpacked 文件；实际 Web 启动使用桌面随附 Node `v24.21.0`。不是对同名 GitHub 标签或全部 Electron 行为的验证。
- 没有放宽 peer、修改宿主版本、打宿主补丁或使用兼容性豁免。最低支持版和推荐版仍按现行约定为 alpha.2。

## 功能与检查

“恢复插件路由”只写 `web` 条目的 `searchProvider: searxng` 与 `fetchProvider: searxng-http`，通过公开 `configEditor.entries/edit` 执行，不读写宿主私有路由注册表。界面先展示两条变化与付费许可保留说明；取消不写入。未保存草稿、只读或缺少公开能力时不可执行，但仍提供手动步骤。

确认携带路由和已保存备用许可的摘要；写前及宿主编辑锁内重新核对，状态改变即要求刷新。保留其他字段；高优先级 home／overlay 阻挡时不持久化，宿主失败由其编辑事务回滚。保存后读回实际状态；alpha.2 的 Web 重挂载通过公开服务重新取快照。错误不返回可能含敏感配置的原始异常。此操作不发出搜索、抓取或付费探测。

| 本次执行 | 结果 | 日志目录 `artifacts/route-restore-2026-10-19/` |
|---|---|---|
| `pnpm run typecheck` | 通过 | `typecheck.log` |
| `pnpm test` | 24 个文件、211 项通过 | `unit-tests.log` |
| `pnpm run build` | 通过 | `build.log` |
| alpha.2 真实组合 | 17/17 通过，无跳过 | `host-alpha2.log` |
| rc.2 真实组合 | 17/17 通过，无跳过 | `host-rc2.log` |
| 实际 tarball 打包／隐私检查 | 33 个条目通过 | `pack.log`、`audit.log` |
| 两个全新 profile 安装和启动 | 通过 | `install-alpha2.log`、`install-rc2.log` |
| 两个宿主的真实 Web 卡片恢复 | 通过 | 下述截图 |

组合命令（路径均为上述精确宿主）：

```sh
npm_config_offline=true DSH_SOURCE_ROOT=/private/tmp/searxng-release-20261018-0jo8erd1/host-alpha2 node tests/host-composition.mjs
npm_config_offline=true DSH_RUNTIME_ROOT=/private/tmp/searxng-release-20261018-0jo8erd1/desktop-rc2/dsh DSH_EXPECTED_VERSION=0.2.1-rc.2 node tests/host-composition.mjs
pnpm pack --pack-destination artifacts/route-restore-2026-10-19/package
node scripts/audit-release.mjs artifacts/route-restore-2026-10-19/package
```

新增覆盖包括：认证 RPC 恢复、保存备用许可不变、恢复后真实 SearXNG 派发、home／overlay 阻挡且 profile 不变、确认前和编辑锁内状态改变、没有假定保存成功、客户端取消／重复提交／草稿／只读／手动说明。官方提供方均为本地模拟，无真实付费调用。上游客户端缺少部分 source map 会产生 Vite 警告，测试仍通过。

## 实际 tarball 安装与界面

一次性 `DSH_HOME` 分别为 `/private/tmp/searxng-restore-20261019-9UyepB/alpha2` 和其同级 `rc2`。各自用对应宿主原版 CLI 的 `plugin --profile web add <上述tarball绝对路径>` 安装到全新标准 Web profile，不使用开发目录软链接。安装器输出 peer 警告，但安装及宿主兼容性检查未拒绝，后续真实组合和卡片加载通过；该结果不扩大声明范围。Web 使用宿主已有的 `pin-browse-picker.overlay.yml`，不修改用户 profile、凭据或已有外部服务。

- rc.2 的测试 profile 预设为 `deepseek-search-api` / `deepseek-fetch-api`。卡片正确提示官方付费路径，两项插件备用仍关闭。先打开确认并取消，无写入；再次确认后保存为 `searxng` / `searxng-http`，界面报告两条路由已保存并核对。
- alpha.2 预设为 `deepseek-official` / `http`，经真实卡片确认后同样恢复两条插件路由。Web 重挂载后卡片仍显示读回结果与成功提示。
- 没有配置 API Key、登录账号、准备托管服务或点击搜索测试。截图：`rc2-confirm.png`、`rc2-restored.png`、`alpha2-restored.png`。
- 两个临时后端已停止，浏览器测试页已关闭；停止后端口连接均为 `ECONNREFUSED`。

本构建未重跑全新托管下载／完整生命周期、真实上游搜索、受保护外部实例完整表单、远端 CI、其他系统／架构或 Node 22.19。历史记录不替代本构建的这些检查；当前仍是候选包，不是完成全部发布检查的正式 Release。
