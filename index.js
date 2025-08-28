(async () => {
  const pluginId = "tmdb-watch-providers";

  function getSetting(key, fallback) {
    try {
      const s = wako.settings.get(pluginId) || {};
      return (s[key] !== undefined && s[key] !== null && s[key] !== "") ? s[key] : fallback;
    } catch (e) {
      return fallback;
    }
  }

  async function fetchProviders(kind, tmdbId, apiKey, region) {
    const url = `https://api.themoviedb.org/3/${kind}/${tmdbId}/watch/providers?api_key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return (data.results && data.results[region]) ? data.results[region] : null;
  }

  function chip(text) {
    const el = document.createElement("span");
    el.className = "wako-chip";
    el.textContent = text;
    return el;
  }

  function logo(src, title) {
    const img = document.createElement("img");
    img.alt = title || "";
    img.title = title || "";
    img.src = `https://image.tmdb.org/t/p/w45${src}`;
    img.style.height = "24px";
    img.style.marginRight = "8px";
    img.loading = "lazy";
    return img;
  }

  function section(title) {
    const wrap = document.createElement("div");
    const h = document.createElement("div");
    h.className = "wako-title";
    h.textContent = title;
    h.style.margin = "12px 0 6px";
    wrap.appendChild(h);
    return wrap;
  }

  async function render(ctx) {
    const apiKey = getSetting("tmdbApiKey");
    const region = (getSetting("region", "ES") || "ES").toUpperCase();

    const tmdbId = (ctx.ids && ctx.ids.tmdb) || ctx.tmdbId;
    const kind = ctx.type === "show" ? "tv" : "movie";
    const title = ctx.title || ctx.name || "";
    if (!apiKey || !tmdbId) return;

    const card = document.createElement("div");
    card.className = "wako-card";
    card.style.padding = "12px";

    const header = document.createElement("div");
    header.className = "wako-title";
    header.textContent = `Dónde ver (${region})`;
    card.appendChild(header);

    let providers;
    try {
      const result = await fetchProviders(kind, tmdbId, apiKey, region);
      if (!result) {
        const empty = document.createElement("div");
        empty.textContent = "Sin datos de proveedores para esta región.";
        card.appendChild(empty);
        return wako.ui.addon.inject(card);
      }
      providers = result;
    } catch (e) {
      const err = document.createElement("div");
      err.textContent = `Error consultando TMDB: ${e.message}`;
      card.appendChild(err);
      return wako.ui.addon.inject(card);
    }

    const mapping = [
      ["flatrate", "Suscripción"],
      ["free", "Gratis"],
      ["ads", "Con anuncios"],
      ["rent", "Alquiler"],
      ["buy", "Compra"]
    ];

    mapping.forEach(([key, label]) => {
      const list = providers[key];
      if (!Array.isArray(list) || list.length === 0) return;
      const sec = section(label);
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.flexWrap = "wrap";
      row.style.alignItems = "center";

      list.forEach(p => {
        const item = document.createElement("div");
        item.style.display = "flex";
        item.style.alignItems = "center";
        item.style.marginRight = "12px";
        item.style.marginBottom = "8px";

        if (p.logo_path) item.appendChild(logo(p.logo_path, p.provider_name));
        item.appendChild(chip(p.provider_name));
        row.appendChild(item);
      });

      sec.appendChild(row);
      card.appendChild(sec);
    });

    if (providers.link) {
      const linkBtn = document.createElement("a");
      linkBtn.href = providers.link;
      linkBtn.target = "_blank";
      linkBtn.rel = "noopener";
      linkBtn.className = "wako-button";
      linkBtn.textContent = "Abrir en TMDB (Dónde ver)";
      linkBtn.style.marginTop = "8px";
      card.appendChild(linkBtn);
    }

    const search = document.createElement("a");
    search.href = `https://www.filmin.es/buscar?q=${encodeURIComponent(title)}`;
    search.target = "_blank";
    search.rel = "noopener";
    search.style.display = "inline-block";
    search.style.margin = "8px 0 0 12px";
    search.textContent = "Buscar en Filmin";
    card.appendChild(search);

    wako.ui.addon.inject(card);
  }

  wako.addon.register("movies", render);
  wako.addon.register("shows", (ctx) => render({ ...ctx, type: "show" }));
})();
