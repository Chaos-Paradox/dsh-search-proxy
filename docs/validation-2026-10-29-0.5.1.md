# 0.5.1 版本准备检查（2026-10-29）

状态：候选版本，尚未发布。基于 `34a3b8d22d44905c7bc8820b8a4822e76be8e251`，将包版本、设置页 `CURRENT_VERSION` 和请求 User-Agent 从 `0.5.0` 一致调整为 `0.5.1`，工作分支为 `codex/release-0.5.1`。历史验证记录继续描述当时检查的版本，不回写为新版本的证据。

已发布 `v0.5.0` 保持原样：标签提交 `76bc532e7867ca3266a1785e409928b48708d809`；安装包 SHA-256 为 `dcc23f6be8207e49d978e796c6843fa6582d8af5befcef07c7826c2d096d6848`。本次不移动旧标签、不替换旧 Release 资产；README 安装地址仍指向实际存在的 `v0.5.0`。

## 当前候选构建

- 插件版本：`0.5.1`；实际 tarball：`dsh-search-proxy-0.5.1.tgz`。
- tarball SHA-256：`4c255bdef334dc872cd7ca7f83bbb1de9509ed83fc133fc10810cc807ed0f62d`。
- 系统：macOS `27.0.1` / build `26A434` / arm64。
- 插件检查、构建和真实组合：Node `24.14.1`；打包：pnpm `11.7.0`。
- 最低／推荐宿主：未打补丁的 DSH `0.2.1-alpha.2`，提交 `d743267388641bc76f17c45ce8b4c231aed1d32c`，复用已构建、Git 状态干净的一次性 checkout；宿主构建工具链见此前记录。本次不修改宿主、peer 范围或依赖版本。

| 检查 | 本次命令与结果 |
|---|---|
| 类型 | `node node_modules/typescript/bin/tsc --noEmit`，通过 |
| 回归 | `node node_modules/vitest/vitest.mjs run`，26 文件、234 项通过，无跳过 |
| 构建 | `node_modules/.bin/tsdown` 与 `node node_modules/typescript/bin/tsc -p tsconfig.client.json`，通过并包含 `lib/` |
| 真实宿主 | `npm_config_offline=true DSH_SOURCE_ROOT="$HOST" node tests/host-composition.mjs`，19 项通过，无跳过 |
| 实际打包 | `pnpm pack --pack-destination "$PACKAGE_DIR"`，生成上述 `0.5.1` tarball |
| 包审计 | `node scripts/audit-release.mjs "$TARBALL"`，35 条目通过 |
| 差异格式 | `git diff --check`，通过 |

组合验证使用一次性 profile、凭据文件和本地服务，未触碰用户真实 profile。客户端保留上游缺失 source map 的警告。

## 待完成的发布验收

本次是版本准备，不表示已经完成发布。当前 `0.5.1` tarball 的干净 profile 安装、完整浏览器 Web 操作、空缓存托管生命周期、真实上游搜索及其他宿主／平台验收未在本地执行；本次版本提交的三平台 CI 结果需核对该提交自己的运行，不能沿用 `34a3b8d` 的通过结果。Node `22.19`、矩阵外系统／架构、完整 Electron 和真实付费 API 未验证。

发布步骤与改动摘要见 [0.5.1 发布说明草案](release-0.5.1-draft.zh.md)。正式发布时补齐最终提交、实际发布包校验和和 CI 链接，再更新安装链接；`v0.5.0` 始终作为独立历史版本保留。
