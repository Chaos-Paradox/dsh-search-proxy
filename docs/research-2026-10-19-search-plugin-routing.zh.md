# 同类 DSH 插件对宿主路由覆盖的处理调研

调研日期：2026-10-19（北京时间）。检查了六个公开仓库当时默认分支的最新提交，固定源码快照；表中的版本是该提交的 `package.json` 版本，不等于已验证的 npm 发布包。没有安装或运行这些第三方插件，测试文件只作实现意图的证据，不表示本次代其执行通过。

结论：**已有插件专门适配 rc.2 的路由选择变化，但这些样本没有形成统一的“被官方覆盖后一键恢复”方案。** 多数仍靠 bundle 默认选择或手动配置；一个样本通过宿主设置服务有条件接管，刻意保留官方卡片写入的显式选择。不能把插件内部的引擎切换、地址恢复或连接测试成功当作宿主正在使用该插件。

## 为什么插件开着也可能收不到请求

官方说明确认，rc.2 内置 Web API 开关同时选择 `deepseek-search-api` 和 `deepseek-fetch-api`，关闭则恢复宿主出厂组合。提供方注册与提供方选中是两件事。[官方 Web API 插件说明](https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/web/web-deepseek-api/README.md)

因此，存在两层选择：宿主 `web.searchProvider` / `web.fetchProvider` 决定进入哪个插件；进入插件后，其自己的 `provider`、`defaultProvider`、备用顺序才决定上游引擎。官方卡片在用户配置层写入选择后，仅重新启用低优先级的 bundle，或者修改插件内部引擎，不能消除这次覆盖。这一判断也与本项目对原版 alpha.2、rc.2 的组合验证一致。

## 固定样本

| 仓库／源码版本 | 固定提交 | 最后提交时间（北京时间） | 主要处理方式 | 对明确选中官方 API 的情况 |
|---|---|---|---|---|
| Mars-Sea/dsh-commandcode-provider 0.14.2 | [`4a44d876`](https://github.com/Mars-Sea/dsh-commandcode-provider/commit/4a44d8767ede6f5b072a38f5e1097b8b16ab9dea) | 10-18 19:13 | rc.2 读取设置的用户层选择；通过 `settings.update/replace` 接管或归还；旧宿主内存降级 | 尊重其他提供方的显式选择，报告已注册但未选中，不强行改回 |
| A3Boy/dsh-web-tools 0.3.7 | [`bb68082d`](https://github.com/A3Boy/dsh-web-tools/commit/bb68082d1274dc0d28ed5921bb08c7b5070fae7f) | 10-19 01:18 | bundle 同时选择自己的搜索和抓取；独立内部引擎路由编辑 | 所检查入口、配置与路由处理没有发现宿主覆盖恢复入口；内部排序不能改外层选择 |
| X-C1811/dsh-web-search-plugin 0.5.1 | [`b3d55fd3`](https://github.com/X-C1811/dsh-web-search-plugin/commit/b3d55fd3b1dcce90f98b1a2ba6d9412b15b822b6) | 10-10 18:47 | bundle 选择稳定插件 ID；内部切换引擎；文档区分整包停用与单行停用 | 明确承认用户 profile 覆盖优先，需手动处理额外覆盖 |
| DarlingC/dsh-freesearch 0.5.8 | [`9153d8ef`](https://github.com/DarlingC/dsh-freesearch/commit/9153d8ef977b279134ef72f7e6914eae86a99d91) | 10-10 18:16 | bundle 选择 `ddg/http`；运行时还尝试补写旧实例字段 | 注释意图是只补未指定路由，保留显式选择；旧字段路径另有 rc.2 风险，见下文 |
| Yinxe/dsh-tavily-search 2.0.0 | [`c3287c7e`](https://github.com/Yinxe/dsh-tavily-search/commit/c3287c7ed52e8560722d6f5185f0fe0efaae41ee) | 09-04 19:18 | 注册 Tavily，README 指导手动选 `searchProvider: tavily` | 手动修改现有 `web` 条目；未发现一键恢复 |
| haibinwang9/dsh-web-search 0.1.2 | [`1444b566`](https://github.com/haibinwang9/dsh-web-search/commit/1444b566335c5461768b1330bb27c3ed0a91a49e) | 08-16 04:02 | bundle 选 `web-access`；内部开关决定自有链或委托官方 | 开关控制内部委托，不是宿主覆盖恢复 |

这六个样本不是社区全部插件的统计，也没有据提交日期推断作者已完成 rc.2 验证。

## 最有参考价值：Command Code 的选择归属

它在 rc.2 优先读取宿主 `settings.describe()` 中 `web` 行的生效值、用户层值和组合基值。用户层若已写 `deepseek-search-api` 或其他插件 ID，就保留它，记录 `foreign` 并给出日志／界面提示。没有其他显式选择时才用 `settings.update('web', …)` 选中自身；关闭自己的搜索开关时，用 `settings.replace()` 归还组合基值，带上无关字段。写前重新读一次，避免明显的过期决定。[选择实现](https://github.com/Mars-Sea/dsh-commandcode-provider/blob/4a44d8767ede6f5b072a38f5e1097b8b16ab9dea/src/web-search.ts#L307)

需要区分它的两种退出：**关闭内部开关**可以通过设置写盘归还；`release()` 在插件卸载／进程退出时只作尽力的内存归还，不写磁盘，源码解释为生命周期与宿主锁的限制。因此不能概括成“任何禁用或卸载都会恢复磁盘配置”。此外，设置路径不可用或拒绝时，它会尝试私有配置引用／旧 `searchProviderId` 字段的内存写入。这是该插件的兼容策略，本项目不会照搬。[退出与内存降级](https://github.com/Mars-Sea/dsh-commandcode-provider/blob/4a44d8767ede6f5b072a38f5e1097b8b16ab9dea/src/web-search.ts#L341)

仓库包含 rc.2 设置原地更新、不抢官方显式选择、关闭归还组合基值等测试。本次仅阅读这些用例，没有运行其测试，也没有独立复现它对外声明的宿主矩阵。[对应测试](https://github.com/Mars-Sea/dsh-commandcode-provider/blob/4a44d8767ede6f5b072a38f5e1097b8b16ab9dea/tests/web-search.test.ts#L538)

## 其余样本的具体边界

**Web Tools：内部路由编辑不等于宿主路由编辑。** `cordis.patch.yml` 把搜索和抓取指向自己的 ID；`routing/set` 原子写入的是 `searchRoutingPolicy`、`defaultProvider`、`fallbackOrder`，进入自己的配置命名空间。它的客户端还有读请求序号与保存结果合并处理，可参考其避免旧响应覆盖新界面的思路，但不能由此声称已经解决官方卡片的外层覆盖。“恢复官方默认地址”指上游 base URL，也不是恢复宿主选择。[bundle](https://github.com/A3Boy/dsh-web-tools/blob/bb68082d1274dc0d28ed5921bb08c7b5070fae7f/cordis.patch.yml)、[内部路由处理](https://github.com/A3Boy/dsh-web-tools/blob/bb68082d1274dc0d28ed5921bb08c7b5070fae7f/src/host/routes.ts#L453)、[界面状态处理](https://github.com/A3Boy/dsh-web-tools/blob/bb68082d1274dc0d28ed5921bb08c7b5070fae7f/src/client/routing-state.ts)

**X-C1811：明确承认配置层优先级。** bundle 选择插件 ID 并禁用原官方搜索行；README 说明整包停用会移除 bundle 覆盖，但用户自己加的 profile／环境覆盖需要另外删除或修改。内部默认引擎仍是官方 Messages 搜索，非法引擎值也回到该默认；这不是“搜索请求失败后自动切其他引擎”，文档明确每次只使用选中的引擎。对我们的启示是：不能仅凭外层显示插件 ID，就认定没有付费路径。[停用与覆盖说明](https://github.com/X-C1811/dsh-web-search-plugin/blob/b3d55fd3b1dcce90f98b1a2ba6d9412b15b822b6/README.md#disable-or-uninstall)、[非法配置回到官方的实现](https://github.com/X-C1811/dsh-web-search-plugin/blob/b3d55fd3b1dcce90f98b1a2ba6d9412b15b822b6/lib/index.js#L175)

**Free Search：旧内部字段不能作为 rc.2 适配证据。** 注册后执行 `if (!ctx.web.searchProviderId) ctx.web.searchProviderId = provider.id`，注释是只补未配置、不碰明确选择。在已检查的原版 rc.2 中，实际派发读取的是 `config.searchProvider.get()`，不再读取这个字段；据此推断这段赋值不能完成 rc.2 路由接管，且可能把不存在的旧字段误判为“未配置”。这是源码对照推断，没有运行该插件，不能扩展为其所有功能均不可用。[旧字段处理](https://github.com/DarlingC/dsh-freesearch/blob/9153d8ef977b279134ef72f7e6914eae86a99d91/lib/index.js#L1770)

**Tavily：给出人工解决办法。** README 要求向现有 `web` 条目的 config 添加 `searchProvider: tavily`，并在卸载时删除旧选择。状态接口读取旧 `searchProviderId`，本次不能将其徽章视为 rc.2 已可靠核对实际派发的证据。[安装与选型说明](https://github.com/Yinxe/dsh-tavily-search/blob/c3287c7ed52e8560722d6f5185f0fe0efaae41ee/README.md)、[状态接口](https://github.com/Yinxe/dsh-tavily-search/blob/c3287c7ed52e8560722d6f5185f0fe0efaae41ee/lib/index.js#L280)

**Web Access：关闭自己的开关会委托官方。** 外层仍须先选中 `web-access`，其 `search()` 内部才检查 `PIWA_SEARCH_ENABLED`；关闭时直接调用官方 `DeepSeekSearchProvider`。因此“关闭某个插件开关”不必然表示关闭联网或关闭官方费用。这种内部委托也无法取回被官方 API 选走的外层路由。[搜索提供方实现](https://github.com/haibinwang9/dsh-web-search/blob/1444b566335c5461768b1330bb27c3ed0a91a49e/lib/index.js#L169)

## 对本项目的取舍

保留用户配置优先级，检测到覆盖时说明当前搜索／抓取分别去哪里；不在启动或轮询时强行抢回。用户主动选择“恢复插件路由”后，展示两条变更，再通过宿主公开配置编辑接口保存；在宿主锁内复核确认依据，最后重新读取生效状态。更高优先级配置阻挡、只读或接口缺失时，明确给出原因与手动恢复步骤。

恢复目标是 `searxng` / `searxng-http`，两条一起改，保留其他 Web 字段与已有付费备用许可。已开启的备用仍可能收费，恢复成功也不显示成绝对免费。路由快照不是账单，也不涵盖独立工具或模型自带联网工具。当前实现与实际包验证见[路由恢复验证记录](validation-2026-10-19-route-restore.md)。

公开源码快照及提交元数据保存在本地忽略目录 `artifacts/plugin-routing-research-2026-10-19/`，未加入发布包。没有改动用户真实 profile 或向第三方服务发送搜索／模型请求。
