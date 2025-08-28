import { registerActionHandler } from "@wako-app/mobile-sdk";

const pluginId = "tmdb-watch-providers";

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

registerActionHandler("movies", async (ctx) => {
  const apiKey = getSetting("tmdbApiKey");
  const region = (getSetting("region", "ES") || "ES").toUpperCase();

  const tmdbId = ctx.ids?.tmdb || ctx.tmdbId;
  const kind = "movie";
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
});
