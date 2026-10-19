/** Scoped styles: host theme tokens, compact sections and a distinct opt-in risk area. */
export const settingsStyles = `
.searxng-settings{--sx-border:var(--dsw-alias-border-l2,#dfe3e8);--sx-muted:var(--dsw-alias-label-secondary,#68717d);--sx-bg:var(--dsw-alias-bg-base,#fff);--sx-soft:var(--dsw-alias-bg-layer-2,#f6f7f9);font-size:var(--dsh-content-font-size,14px);line-height:1.6;display:flex;flex-direction:column;gap:20px;max-width:840px;margin:0 auto}
.searxng-settings *{box-sizing:border-box}
.searxng-settings p{margin:0}
.searxng-settings h3{font-size:15px;font-weight:650;line-height:1.5;margin:0}
.searxng-settings input[type=checkbox]{accent-color:var(--dsw-alias-brand-primary,#4d6bfe);flex-shrink:0;width:15px;height:15px;margin:0}
.searxng-settings select,.searxng-settings .sx-input{font:inherit;color:inherit;background:var(--sx-bg);border:1px solid var(--sx-border);border-radius:8px;padding:9px 11px;min-height:40px;width:100%;min-width:0}
.searxng-settings select:focus-visible,.searxng-settings .sx-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:2px}
.searxng-settings .sx-card{border:1px solid var(--sx-border);border-radius:12px;padding:18px 20px;display:flex;flex-direction:column;gap:14px}
.searxng-settings .sx-card+.sx-card{margin-top:16px}
.searxng-settings .sx-card>button{align-self:flex-start}
.searxng-settings .sx-header,.searxng-settings .sx-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.searxng-settings .sx-actions{justify-content:flex-start}
.searxng-settings .sx-muted{color:var(--sx-muted);font-size:13px}
.searxng-settings .sx-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;padding:3px 9px;border-radius:6px;background:var(--sx-soft);color:var(--sx-muted)}
.searxng-settings .sx-badge[data-phase=ready]{color:#16804a;background:color-mix(in srgb,#16804a 10%,var(--sx-bg))}
.searxng-settings .sx-badge[data-phase=failed]{color:#c93535;background:color-mix(in srgb,#c93535 9%,var(--sx-bg))}
.searxng-settings .sx-badge:before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor}
.searxng-settings details{margin:0;min-width:0}
.searxng-settings summary{font-size:13px;font-weight:500;cursor:pointer;color:var(--sx-muted);padding:3px 0}
.searxng-settings details[open]>summary{margin-bottom:10px}
.searxng-settings details>p+*,.searxng-settings details>fieldset+*,.searxng-settings details>div+*,.searxng-settings details>button+*{margin-top:10px}
.searxng-settings .sx-diagnostics{border-top:1px solid var(--sx-border);padding-top:12px;display:grid;gap:8px}
.searxng-settings .sx-note{background:var(--sx-soft);padding:12px 14px;border-radius:8px;display:grid;gap:6px}
.searxng-settings .sx-routing{border-left-width:3px}
.searxng-settings .sx-routing[data-risk=paid]{border-left-color:light-dark(#b42318,#ff9b94)}
.searxng-settings .sx-routing[data-risk=unknown]{border-left-color:light-dark(#936000,#edc472)}
.searxng-settings .sx-route-risk{font-size:12px}
.searxng-settings .sx-routing[data-risk=paid] .sx-route-risk{color:light-dark(#b42318,#ff9b94)}
.searxng-settings .sx-route-list{margin:0;display:grid;gap:14px}
.searxng-settings .sx-route-list>div{border-top:1px solid var(--sx-border);padding-top:12px;display:grid;grid-template-columns:80px minmax(0,1fr);gap:12px}
.searxng-settings .sx-route-list dt{font-size:13px;font-weight:600}
.searxng-settings .sx-route-list dd{margin:0;display:grid;gap:5px;font-size:13px;overflow-wrap:anywhere}
.searxng-settings .sx-route-list code{font-size:13px;font-weight:600}
.searxng-settings .sx-field{display:grid;gap:7px;min-width:0}
.searxng-settings .sx-field>label{font-weight:500;font-size:13px}
.searxng-settings .sx-check{display:flex;align-items:flex-start;gap:9px;font-size:13px}
.searxng-settings .sx-check>input{margin-top:3px}
.searxng-settings .sx-plain-fieldset{border:0;margin:0;padding:0;min-width:0;display:grid;gap:12px}
.searxng-settings .sx-plain-fieldset>legend{margin-bottom:10px;font-size:13px;font-weight:600}
.searxng-settings .sx-choice{border:0;padding:0;margin:0;min-width:0}
.searxng-settings .sx-choice>legend{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;font-weight:600}
.searxng-settings .sx-choice>p,.searxng-settings .sx-choice>details{margin-top:8px}
.searxng-settings .sx-engine-group{margin-top:14px}
.searxng-settings .sx-engine-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px 8px;list-style:none;padding:0;margin:6px 0 0}
.searxng-settings .sx-engine-grid label{display:flex;align-items:center;gap:8px;border:1px solid var(--sx-border);border-radius:7px;padding:7px 9px;font-size:13px;cursor:pointer;min-height:36px}
.searxng-settings .sx-engine-grid label:has(input:checked){border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 55%,var(--sx-border));background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 6%,var(--sx-bg))}
.searxng-settings .sx-engine-grid label:has(input:disabled){cursor:default;opacity:.65}
.searxng-settings .sx-version{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12px;color:var(--sx-muted);padding:0 2px}
.searxng-settings .sx-risk{--sx-danger:light-dark(#b42318,#ff9b94);border:1px solid color-mix(in srgb,var(--sx-danger) 45%,var(--sx-border));border-left:3px solid var(--sx-danger);background:color-mix(in srgb,var(--sx-danger) 4%,var(--sx-bg));margin-top:6px}
.searxng-settings .sx-risk h3,.searxng-settings .sx-risk-label,.searxng-settings .sx-risk a{color:var(--sx-danger)}
.searxng-settings .sx-risk-label{font-size:11px;font-weight:650;border:1px solid color-mix(in srgb,var(--sx-danger) 30%,transparent);border-radius:5px;padding:2px 7px;white-space:nowrap}
.searxng-settings .sx-risk .sx-actions>button{color:var(--sx-danger);border-color:color-mix(in srgb,var(--sx-danger) 35%,var(--sx-border))}
.searxng-settings .sx-risk .sx-note{background:color-mix(in srgb,var(--sx-danger) 5%,var(--sx-bg))}
.searxng-settings .sx-risk .sx-check{border:1px solid color-mix(in srgb,var(--sx-danger) 25%,var(--sx-border));border-radius:8px;padding:12px}
.searxng-settings .sx-risk input[type=checkbox]{accent-color:var(--sx-danger)}
.searxng-settings .sx-proxy-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(110px,1fr);gap:14px}
.searxng-settings .sx-proxy-grid .sx-wide{grid-column:1/-1}
.searxng-settings .sx-statement{display:grid;gap:12px;font-size:13px}
.searxng-settings .sx-input[aria-invalid=true]{border-color:light-dark(#b42318,#ff9b94)}
.searxng-proxy-dialog{width:min(680px,100%);max-height:100%;font-size:14px}
.searxng-proxy-dialog-content{overflow-y:auto;min-height:0}
.searxng-proxy-dialog h2{color:light-dark(#b42318,#ff9b94)}
.searxng-proxy-dialog .searxng-settings{width:100%}
.searxng-settings .sx-log-hints{font-size:12px;color:var(--sx-muted);padding-left:18px;margin:10px 0}
.searxng-settings .sx-log-hints li+li{margin-top:6px}
@media(max-width:540px){.searxng-settings .sx-card{padding:15px}.searxng-settings .sx-proxy-grid{grid-template-columns:1fr}.searxng-settings .sx-engine-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`
