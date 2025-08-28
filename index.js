const pluginId = "tmdb-watch-providers";
const { registerActionHandler } = wako; // Wako inyecta esto

function getSetting(key, fallback) {
  const settings = JSON.parse(localStorage.getItem(pluginId)) || {};
  return settings[key] || fallback;
}

async function fetchProviders(kind, tmdbId, apiKey, region) {
  const url = `https://api.themoviedb.org/3/${kind}/${tmdbId}/watch/providers?api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  const data = await res.json();
  return data.results?.[region] || null;
}

async function handleAction(ctx, kind) {
  const apiKey = getSetting("tmdbApiKey");
  const region = (getSetting("region", "ES") || "ES").toUpperCase();

  const tmdbId = ctx.ids?.tmdb || ctx.tmdbId;
  if (!apiKey || !tmdbId) return;

  const providers = await fetchProviders(kind, tmdbId, apiKey, region);
  if (!providers) return { html: `<div>Sin datos para ${region}</div>` };

  return {
    html: `<div style="padding:10px">
      <h3>Dónde ver (${region})</h3>
      ${Object.entries(providers)
        .map(([type, list]) => {
          if (!Array.isArray(list)) return "";
          return `<h4>${type}</h4><div>${list
            .map((p) => `<span>${p.provider_name}</span>`)
            .join("")}</div>`;
        })
        .join("")}
    </div>`
  };
}

registerActionHandler("movies", (ctx) => handleAction(ctx, "movie"));
registerActionHandler("shows", (ctx) => handleAction(ctx, "tv"));

console.log("TMDB Watch Providers loaded");
