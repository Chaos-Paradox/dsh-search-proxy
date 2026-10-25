# Rename and migration to 0.5.0

English | [中文](rename.zh.md)

From 0.5.0, the plugin is **DSH Search & Proxy**, with package and GitHub repository name `dsh-search-proxy`. Its previous package name was `dsh-web-search-searxng`. The name covers self-hosted search and the optional process proxy. Host requirements, default search behavior, credentials and paid fallback permissions are unchanged.

## New installations

Paste this release archive URL into DSH's **Plugins → Add plugin**. It is a directly downloaded npm tarball and requires no Git:

```text
https://github.com/Chaos-Paradox/dsh-search-proxy/releases/download/v0.5.0/dsh-search-proxy-0.5.0.tgz
```

Or use the CLI:

```sh
dsh plugin --profile <name> add https://github.com/Chaos-Paradox/dsh-search-proxy/releases/download/v0.5.0/dsh-search-proxy-0.5.0.tgz
```

A new package name does not establish an npm registry publication. Install by name only after checking the actual registry release. The GitHub archive works independently of registry publication.

## Existing installations

**Remove the old package before adding the new one in the same profile. Do not enable both packages together.** They supply the same routes, runtime service and settings page.

1. Record the existing profile name, back up its configuration and credentials, and fully stop the DSH backend using it.
2. Remove the old package using that same profile name:

```sh
dsh plugin --profile <name> remove dsh-web-search-searxng
```

3. Check the existing profile's `cordis.patch.yml`, usually under `$DSH_HOME/profiles/<name>/`. Saving preferences may have written `name: dsh-web-search-searxng` into the `id: web-search-searxng` entry. **Change only that entry's `name` to `dsh-search-proxy`, preserving its `id` and complete `config`.** If `name` is absent, do not add it. Apply the same targeted change to any home configuration or CLI overlay explicitly binding that entry to the old package. An unchanged old binding prevents saved configuration from applying to the new package.

```yaml
- id: web-search-searxng
  name: dsh-search-proxy
  config:
    # Keep your existing endpoint, engines, language and other values.
```

4. Add the new package, fully restart DSH, refresh the page, and check **Plugins → DSH Search & Proxy** for the service, preferences, host routes and proxy state:

```sh
dsh plugin --profile <name> add https://github.com/Chaos-Paradox/dsh-search-proxy/releases/download/v0.5.0/dsh-search-proxy-0.5.0.tgz
```

After updating the package binding, the new package retains the `web-search-searxng` settings and credential namespace, `searxng` search route, `searxng-http` fetch route and profile-local `searxng/` cache directory. Saved endpoints, engines, language, fallback permissions, instance credentials and proxy memory remain readable in that profile. Do not rename these fields manually. An approved, enabled proxy may resume according to its saved preference; an explicitly disabled proxy remains off. A full restart unloads old client modules and backend code.

Installation still appends default plugin routes, and higher-priority user configuration wins. Removing the old bundle temporarily exposes the routes selected by remaining layers. Check the route panel after enabling the new package, especially when retaining official search or custom fetch settings. Explicit user-layer route choices survive removal.

Use `dsh-search-proxy` for future updates, disablement and removal. Existing `v0.4.1` and older assets retain their original package names. A repository rename does not change the identity of packages installed from old tags.

## Compatibility and rollback

The minimum and recommended host remains unpatched DSH `0.2.1-alpha.2`. See the [host policy](host-compatibility.md) and the release's validation record for exact coverage; the peer range is not a guarantee for every version.

To roll back, stop the backend, remove `dsh-search-proxy`, change any explicit `name` bindings above back to `dsh-web-search-searxng`, install the original `v0.4.1` package and fully restart. Settings and credentials retain their existing identifiers in the same profile. Removing and re-adding a bundle may change configuration order, so check host routes again. Runtime cleanup and credential deletion are unnecessary for rollback.
