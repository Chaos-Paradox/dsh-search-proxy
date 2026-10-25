# 改名与迁移到 0.5.0

[English](rename.md) | 中文

插件自 0.5.0 起使用 **DSH 搜索与代理 / DSH Search & Proxy**，npm 包名和 GitHub 仓库名统一为 `dsh-search-proxy`，原包名为 `dsh-web-search-searxng`。这次改名突出自托管搜索与可选进程代理两个用途，不提高宿主最低要求，也不改变默认搜索、凭据或付费备用行为。

## 新用户

在 DSH「插件 → 添加插件」填写以下发布包地址；这是直接下载的 npm tarball，无需 Git：

```text
https://github.com/Chaos-Paradox/dsh-search-proxy/releases/download/v0.5.0/dsh-search-proxy-0.5.0.tgz
```

或使用 CLI：

```sh
dsh plugin --profile <名称> add https://github.com/Chaos-Paradox/dsh-search-proxy/releases/download/v0.5.0/dsh-search-proxy-0.5.0.tgz
```

包名发生变化不等于已发布 npm 注册表。是否可以直接填 `dsh-search-proxy`，以该注册表中的实际发布为准；GitHub 发布包可以独立安装。

## 从旧包迁移

**在同一个 profile 内，先移除旧包，再安装新包。不要同时启用两个包。** 它们提供相同的搜索路由、服务和设置页，双重安装不是并行使用方式。

1. 记录当前 profile 名称，并备份该 profile 的配置与凭据。完整停止使用该 profile 的 DSH 后端。
2. 先移除旧包；将 `<名称>` 替换为原来的 profile 名称，不要另建 profile：

```sh
dsh plugin --profile <名称> remove dsh-web-search-searxng
```

3. 检查原 profile 的 `cordis.patch.yml`（通常位于 `$DSH_HOME/profiles/<名称>/`）。DSH 保存过偏好后，可能在 `id: web-search-searxng` 条目中写入旧包名。**仅将该条目的 `name: dsh-web-search-searxng` 改为 `name: dsh-search-proxy`，保留 `id` 和全部 `config`。** 没有 `name` 字段时不必添加。若 home 配置或 CLI overlay 中也显式绑定了此旧包名，同样只更新这一绑定。未经修改的旧 `name` 会使已保存配置不能应用到新包。

```yaml
- id: web-search-searxng
  name: dsh-search-proxy
  config:
    # 保留原有的地址、引擎、语言和其他配置，不要用示例替换。
```

4. 安装新包，然后完整重启 DSH、刷新页面，在「插件 → DSH 搜索与代理」核对服务、搜索偏好、宿主路由和代理状态：

```sh
dsh plugin --profile <名称> add https://github.com/Chaos-Paradox/dsh-search-proxy/releases/download/v0.5.0/dsh-search-proxy-0.5.0.tgz
```

更新包名绑定后，新包继续使用 `web-search-searxng` 设置／凭据命名空间、`searxng` 搜索路由、`searxng-http` 抓取路由和原 profile 的 `searxng/` 缓存目录。实例地址、引擎、语言、备用许可、实例凭据与代理记忆继续按同一 profile 读取，不需要手工改名这些字段。原来已经确认并开启的代理仍可能按原偏好恢复；主动关闭的代理保持关闭。完整重启用于卸载旧客户端模块和旧后端代码。

安装仍追加默认插件路由，更高优先级的用户配置继续有效。移除旧包会暂时暴露剩余配置层决定的路由；新包启用后应核对顶部路由栏，尤其是有意保留的官方搜索或自定义抓取设置。主动写入的用户层路由不会因卸载而被清除。

以后更新、禁用或卸载使用新包名 `dsh-search-proxy`。旧版 `v0.4.1` 及更早发布资产保持原名；从旧标签安装仍得到旧包，仓库改名不会改写已发布包的身份。

## 兼容性与回退

最低／推荐宿主仍为未打补丁的 DSH `0.2.1-alpha.2`。具体构建的验证范围见[宿主兼容约定](host-compatibility.zh.md)和对应发布记录，不把 peer 范围视为逐版本保证。

需要退回旧版时，停止后端、移除 `dsh-search-proxy`，将上述显式 `name` 绑定改回 `dsh-web-search-searxng`，再安装原 `v0.4.1` 包并完整重启。同一 profile 的已保存设置与凭据按原标识保留；移除和重新添加 bundle 可能改变配置层顺序，因此仍需核对宿主路由。不要为回退清理运行环境或删除凭据。
