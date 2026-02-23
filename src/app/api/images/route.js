async function searchWikipediaImage(query, thumbSize = 1000) {
  const url =
    `https://en.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrlimit: "5",
      prop: "pageimages|pageterms",
      piprop: "thumbnail",
      pithumbsize: String(thumbSize),
      pilicense: "any",
      format: "json",
      origin: "*",
    });

  const res = await fetch(url, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(6000),
  });
  const data = await res.json();

  if (!data.query?.pages) return null;

  const pages = Object.values(data.query.pages).sort(
    (a, b) => (a.index ?? 999) - (b.index ?? 999)
  );

  for (const page of pages) {
    if (page.thumbnail?.source) {
      let src = page.thumbnail.source;
      const match = src.match(/\/(\d+)px-[^/]+$/);
      if (match && parseInt(match[1]) < thumbSize) {
        src = src.replace(/\/\d+px-/, `/${thumbSize}px-`);
      }
      return src;
    }
  }

  return null;
}

async function searchWikimediaCommons(query, thumbSize = 1000) {
  const url =
    `https://commons.wikimedia.org/w/api.php?` +
    new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: query,
      gsrnamespace: "6",
      gsrlimit: "5",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: String(thumbSize),
      format: "json",
      origin: "*",
    });

  const res = await fetch(url, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(6000),
  });
  const data = await res.json();

  if (!data.query?.pages) return null;

  const pages = Object.values(data.query.pages).sort(
    (a, b) => (a.index ?? 999) - (b.index ?? 999)
  );

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (info?.thumburl) return info.thumburl;
    if (info?.url && /\.(jpe?g|png|webp)$/i.test(info.url)) return info.url;
  }

  return null;
}

async function searchPexels(query) {
  if (!process.env.PEXELS_API_KEY) return null;

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
    {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(5000),
    }
  );
  const data = await res.json();
  return data.photos?.[0]?.src?.large || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const q = searchParams.get("q");

  if (!name && !q) {
    return Response.json(
      { error: "Provide 'name' or 'q' parameter" },
      { status: 400 }
    );
  }

  try {
    // 1. Pexels — high-quality stock photos using the descriptive query
    const searchQuery = q || name;
    const pexelsUrl = await searchPexels(searchQuery);
    if (pexelsUrl) {
      return Response.json({ url: pexelsUrl, source: "pexels" });
    }
    // 2. Wikipedia — best for named landmarks (exact match)
    if (name) {
      const wikiUrl = await searchWikipediaImage(name);
      if (wikiUrl) {
        return Response.json({ url: wikiUrl, source: "wikipedia" });
      }
    }

    // 3. Wikimedia Commons — broader coverage
    const commonsUrl = await searchWikimediaCommons(searchQuery);
    if (commonsUrl) {
      return Response.json({ url: commonsUrl, source: "wikimedia" });
    }

    // 4. Wikipedia with the broader image_query as last resort
    if (name && q && name !== q) {
      const wikiUrl2 = await searchWikipediaImage(q);
      if (wikiUrl2) {
        return Response.json({ url: wikiUrl2, source: "wikipedia" });
      }
    }
  } catch (err) {
    console.error("Image fetch error:", err);
  }

  return Response.json({ url: null, source: "none" });
}
