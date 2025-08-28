(function () {
  const pluginId = "tmdb-watch-providers";
  if (!window.wako) {
    console.error("[tmdb-watch-providers] Wako SDK not found");
    return;
  }
  const { registerActionHandler } = window.wako;

  function getSetting(key, fallback) {
    try {
      if (window.wako.settings && typeof window.wako.settings.get === "function") {
        const s = window.wako.settings.get(pluginId) || {};
        const v = s[key];
        return (v !== undefined && v !== null && v !== "") ? v : fallback;
      }
    } catch (_) {}
    try {
      const s = JSON.parse(localStorage.getItem(pluginId) || "{}");
      const v = s[key];
      return (v !== undefined && v !== null && v !== "") ? v : fallback;
    } catch (_) {}
    return fallback;
  }

  async function fetchProviders(kind, tmdbId, apiKey, region) {
    const url = "https://api.themoviedb.org/3/" + kind + "/" + tmdbId + "/watch/providers?api_key=" + encodeURIComponent(apiKey);
    const res = await fetch(url);
    if (!res.ok) throw new Error("TMDB " + res.status);
    const data = await res.json();
    return (data && data.results && data.results[region]) ? data.results[region] : null;
  }

  async function handle(ctx, kind) {
    var apiKey = getSetting("tmdbApiKey");
    var region = (getSetting("region", "ES") || "ES").toUpperCase();
    var tmdbId = (ctx && ctx.ids && ctx.ids.tmdb) || (ctx && ctx.tmdbId);

    if (!apiKey) return { html: `<div style="padding:10px"><b>TMDB API Key</b> no configurada.</div>` };
    if (!tmdbId) return { html: `<div style="padding:10px">No se encontró TMDB ID.</div>` };

    var providers;
    try {
      providers = await fetchProviders(kind, tmdbId, apiKey, region);
    } catch (e) {
      return { html: `<div style="padding:10px">Error TMDB: ${e && e.message ? e.message : e}</div>` };
    }
    if (!providers) return { html: `<div style="padding:10px">Sin datos para ${region}.</div>` };

    var sections = [
      ["flatrate", "Suscripción"],
      ["free", "Gratis"],
      ["ads", "Con anuncios"],
      ["rent", "Alquiler"],
      ["buy", "Compra"]
    ].map(function ([key, label]) {
      var list = Array.isArray(providers[key]) ? providers[key] : [];
      if (!list.length) return "";
      return `<h4 style="margin:8px 0 4px">${label}</h4>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                ${list.map(p => `<span style="padding:4px 8px;border:1px solid #ccc;border-radius:12px">${p.provider_name || "?"}</span>`).join("")}
              </div>`;
    }).filter(Boolean).join("");

    var tmdbLink = providers.link ? `<div style="margin-top:8px"><a href="${providers.link}" target="_blank" rel="noopener">Abrir en TMDB (Dónde ver)</a></div>` : "";

    return { html: `<div style="padding:10px"><h3 style="margin:0 0 8px">Dónde ver (${region})</h3>${sections}${tmdbLink}</div>` };
  }

  registerActionHandler("movies", function (ctx) { return handle(ctx, "movie"); });
  registerActionHandler("shows", function (ctx) { return handle(ctx, "tv"); });

  console.log("TMDB Watch Providers loaded");
})();
