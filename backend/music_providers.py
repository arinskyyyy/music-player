import asyncio
from typing import List, Dict, Any
import httpx

# 54+ public music API endpoints across JioSaavn, Piped, Invidious, Audius, Internet Archive, Deezer, and iTunes.
JIOSAAVN_APIS = [
    "https://saavn.dev/api/search/songs",
    "https://jiosaavn-api-privatecvc2.vercel.app/search/songs",
    "https://saavn.me/search/songs",
    "https://jiosaavn-api.vercel.app/search/songs",
    "https://jiosaavn-api-ts.vercel.app/api/search/songs",
    "https://saavn-api-eta.vercel.app/api/search/songs",
    "https://jiosaavn-api-2-harsh.vercel.app/api/search/songs",
    "https://music-api-jiosaavn.vercel.app/api/search/songs",
    "https://saavn-music-api.vercel.app/api/search/songs",
    "https://jiosaavn-unofficial-api.vercel.app/api/search/songs",
]

PIPED_APIS = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.moomoo.me",
    "https://pipedapi.syncpundit.io",
    "https://api.piped.yt",
    "https://pipedapi.adminforge.de",
    "https://pipedapi.drgns.space",
    "https://pipedapi.smnz.de",
    "https://pipedapi.ngn.tf",
    "https://piped-api.garudalinux.org",
    "https://pipedapi.r4fo.com",
    "https://pipedapi.leptons.xyz",
    "https://pipedapi.nosebs.ru",
    "https://pipedapi.us.projectsegfau.lt",
    "https://pipedapi.in.projectsegfau.lt",
    "https://pipedapi.qdi.fi",
]

INVIDIOUS_APIS = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://invidious.jing.rocks",
    "https://yt.artemislena.eu",
    "https://invidious.privacyredirect.com",
    "https://iv.datura.network",
    "https://invidious.protokolla.fi",
    "https://invidious.lunar.icu",
    "https://inv.tux.pizza",
    "https://invidious.perennialte.ch",
    "https://inv.us.projectsegfau.lt",
    "https://invidious.einfachzocken.eu",
    "https://invidious.drgns.space",
    "https://invidious.darkness.services",
]

AUDIUS_NODES = [
    "https://api.audius.co",
    "https://discoveryprovider.audius.co",
    "https://discoveryprovider2.audius.co",
    "https://discoveryprovider3.audius.co",
    "https://audius-discovery-1.cultur3stake.com",
    "https://audius-discovery-2.cultur3stake.com",
    "https://audius-metadata-1.figment.io",
    "https://dn1.monophonic.digital",
    "https://audius-dp.singapore.creatorseed.com",
    "https://discovery-us-01.audius.openplayer.app",
]

EXTRA_APIS = [
    "https://archive.org/advancedsearch.php",
    "https://api.deezer.com/search",
    "https://itunes.apple.com/search",
    "https://api.jamendo.com/v3.0/tracks/",
]

TOTAL_PROVIDER_COUNT = (
    len(JIOSAAVN_APIS)
    + len(PIPED_APIS)
    + len(INVIDIOUS_APIS)
    + len(AUDIUS_NODES)
    + len(EXTRA_APIS)
)


def _fmt_duration(secs: int) -> str:
    secs = max(0, int(secs or 0))
    return f"{secs // 60:02d}:{secs % 60:02d}"


async def _fetch_jiosaavn(client: httpx.AsyncClient, url: str, query: str, limit: int) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get(url, params={"query": query, "limit": min(limit, 20)})
        if resp.status_code != 200:
            return results
        payload = resp.json()
        items = payload.get("data", {}).get("results") or payload.get("results") or []
        for item in items:
            dl = item.get("downloadUrl") or []
            src = ""
            if isinstance(dl, list) and dl:
                best = dl[-1]
                src = best.get("url") or best.get("link") or ""
            elif isinstance(dl, str):
                src = dl
            if not src:
                continue
            imgs = item.get("image") or []
            cover = "/pixel-0.gif"
            if isinstance(imgs, list) and imgs:
                cover = imgs[-1].get("url") or imgs[-1].get("link") or cover
            elif isinstance(imgs, str):
                cover = imgs
            secs = int(item.get("duration") or 0)
            artist = (
                item.get("artists", {}).get("primary", [{}])[0].get("name")
                if isinstance(item.get("artists"), dict) and item.get("artists", {}).get("primary")
                else item.get("primaryArtists") or "Unknown Artist"
            )
            results.append({
                "id": f"saavn-{item.get('id')}",
                "title": item.get("name") or item.get("title") or "Unknown",
                "artist": artist,
                "duration": _fmt_duration(secs),
                "duration_secs": secs,
                "src": src,
                "cover": cover,
                "sourceLabel": "SAAVN FULL",
                "is_full_song": secs >= 45,
            })
    except Exception:
        pass
    return results


async def _fetch_piped(client: httpx.AsyncClient, base_url: str, query: str, api_base_url: str) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get(f"{base_url}/search", params={"q": query, "filter": "music_songs"})
        if resp.status_code != 200:
            return results
        items = resp.json().get("items") or []
        for item in items[:15]:
            raw_url = item.get("url") or ""
            vid = raw_url.split("v=")[-1] if "v=" in raw_url else raw_url.lstrip("/")
            if not vid:
                continue
            secs = int(item.get("duration") or 0)
            if secs < 30:
                continue
            results.append({
                "id": f"yt-{vid}",
                "title": item.get("title") or "Unknown",
                "artist": item.get("uploaderName") or "Unknown Artist",
                "duration": _fmt_duration(secs),
                "duration_secs": secs,
                "src": f"{api_base_url}/api/music/stream/yt/{vid}",
                "cover": item.get("thumbnail") or "/pixel-0.gif",
                "sourceLabel": "FULL STREAM",
                "is_full_song": secs >= 60,
            })
    except Exception:
        pass
    return results


async def _fetch_invidious(client: httpx.AsyncClient, base_url: str, query: str, api_base_url: str) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get(f"{base_url}/api/v1/search", params={"q": query, "type": "video"})
        if resp.status_code != 200:
            return results
        items = resp.json()
        if not isinstance(items, list):
            return results
        for item in items[:15]:
            vid = item.get("videoId")
            if not vid:
                continue
            secs = int(item.get("lengthSeconds") or 0)
            if secs < 30 or secs > 900:
                continue
            thumbs = item.get("videoThumbnails") or []
            cover = thumbs[0].get("url") if thumbs else "/pixel-0.gif"
            results.append({
                "id": f"yt-{vid}",
                "title": item.get("title") or "Unknown",
                "artist": item.get("author") or "Unknown Artist",
                "duration": _fmt_duration(secs),
                "duration_secs": secs,
                "src": f"{api_base_url}/api/music/stream/yt/{vid}",
                "cover": cover,
                "sourceLabel": "FULL STREAM",
                "is_full_song": secs >= 60,
            })
    except Exception:
        pass
    return results


async def _fetch_audius(client: httpx.AsyncClient, base_url: str, query: str, limit: int, offset: int) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get(
            f"{base_url}/v1/tracks/search",
            params={"query": query, "app_name": "Illusion", "limit": min(limit, 25), "offset": offset},
        )
        if resp.status_code != 200:
            return results
        for r in resp.json().get("data", []):
            if not r.get("is_streamable", False):
                continue
            secs = int(r.get("duration") or 0)
            results.append({
                "id": f"audius-{r['id']}",
                "title": r.get("title", "Unknown"),
                "artist": r.get("user", {}).get("name", "Unknown Artist"),
                "duration": _fmt_duration(secs),
                "duration_secs": secs,
                "src": f"{base_url}/v1/tracks/{r['id']}/stream?app_name=Illusion",
                "cover": (r.get("artwork") or {}).get("480x480") or "/pixel-0.gif",
                "sourceLabel": "AUDIUS FULL",
                "is_full_song": secs >= 45,
            })
    except Exception:
        pass
    return results


async def _fetch_archive(client: httpx.AsyncClient, query: str) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get(
            "https://archive.org/advancedsearch.php",
            params={
                "q": f'({query}) AND mediatype:(audio)',
                "fl[]": ["identifier", "title", "creator"],
                "rows": 8,
                "output": "json",
            },
        )
        if resp.status_code != 200:
            return results
        docs = resp.json().get("response", {}).get("docs", [])
        for doc in docs:
            ident = doc.get("identifier")
            if not ident:
                continue
            results.append({
                "id": f"archive-{ident}",
                "title": doc.get("title") or ident,
                "artist": doc.get("creator") or "Internet Archive",
                "duration": "03:30",
                "duration_secs": 210,
                "src": f"https://archive.org/download/{ident}/{ident}.mp3",
                "cover": f"https://archive.org/services/img/{ident}",
                "sourceLabel": "ARCHIVE FULL",
                "is_full_song": True,
            })
    except Exception:
        pass
    return results


async def _fetch_deezer(client: httpx.AsyncClient, query: str, limit: int, offset: int) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get("https://api.deezer.com/search", params={"q": query, "limit": min(limit, 25), "index": offset})
        if resp.status_code != 200:
            return results
        for r in resp.json().get("data", []):
            if not r.get("preview"):
                continue
            secs = int(r.get("duration") or 30)
            results.append({
                "id": f"deezer-{r['id']}",
                "title": r.get("title", "Unknown"),
                "artist": r.get("artist", {}).get("name", "Unknown Artist"),
                "duration": _fmt_duration(secs),
                "duration_secs": 30,
                "src": r.get("preview"),
                "cover": r.get("album", {}).get("cover_medium") or "/pixel-0.gif",
                "sourceLabel": "DEEZER PREVIEW",
                "is_full_song": False,
            })
    except Exception:
        pass
    return results


async def _fetch_itunes(client: httpx.AsyncClient, query: str, limit: int, offset: int) -> List[Dict[str, Any]]:
    results = []
    try:
        resp = await client.get(
            "https://itunes.apple.com/search",
            params={"term": query, "media": "music", "entity": "song", "limit": min(limit, 25), "offset": offset},
        )
        if resp.status_code != 200:
            return results
        for r in resp.json().get("results", []):
            if r.get("kind") != "song" or not r.get("previewUrl"):
                continue
            ms = int(r.get("trackTimeMillis") or 30000)
            results.append({
                "id": f"itunes-{r.get('trackId')}",
                "title": r.get("trackName", "Unknown"),
                "artist": r.get("artistName", "Unknown"),
                "duration": _fmt_duration(ms // 1000),
                "duration_secs": 30,
                "src": r.get("previewUrl"),
                "cover": r.get("artworkUrl100") or "/pixel-0.gif",
                "sourceLabel": "ITUNES PREVIEW",
                "is_full_song": False,
            })
    except Exception:
        pass
    return results


async def search_all_providers(query: str, limit: int = 50, offset: int = 0, api_base_url: str = "") -> List[Dict[str, Any]]:
    """Query 50+ music API endpoints concurrently and return deduplicated tracks."""
    timeout = httpx.Timeout(3.2, connect=1.8)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        tasks = []
        for url in JIOSAAVN_APIS:
            tasks.append(_fetch_jiosaavn(client, url, query, limit))
        for url in PIPED_APIS:
            tasks.append(_fetch_piped(client, url, query, api_base_url))
        for url in INVIDIOUS_APIS:
            tasks.append(_fetch_invidious(client, url, query, api_base_url))
        for url in AUDIUS_NODES:
            tasks.append(_fetch_audius(client, url, query, limit, offset))
        tasks.append(_fetch_archive(client, query))
        tasks.append(_fetch_deezer(client, query, limit, offset))
        tasks.append(_fetch_itunes(client, query, limit, offset))

        batches = await asyncio.gather(*tasks, return_exceptions=True)

    seen_ids = set()
    merged: List[Dict[str, Any]] = []
    for batch in batches:
        if not isinstance(batch, list):
            continue
        for item in batch:
            tid = item.get("id")
            if tid and tid not in seen_ids:
                seen_ids.add(tid)
                merged.append(item)
    return merged


async def resolve_yt_audio_stream(video_id: str) -> str:
    """Resolve a direct audio stream URL for a YouTube videoId using Piped/Invidious instances."""
    timeout = httpx.Timeout(3.5, connect=1.8)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        for base in PIPED_APIS[:8]:
            try:
                resp = await client.get(f"{base}/streams/{video_id}")
                if resp.status_code == 200:
                    audio_streams = resp.json().get("audioStreams") or []
                    if audio_streams:
                        best = max(audio_streams, key=lambda s: s.get("bitrate", 0))
                        if best.get("url"):
                            return best["url"]
            except Exception:
                continue
        for base in INVIDIOUS_APIS[:6]:
            try:
                resp = await client.get(f"{base}/api/v1/videos/{video_id}")
                if resp.status_code == 200:
                    formats = resp.json().get("adaptiveFormats") or []
                    audio_formats = [f for f in formats if (f.get("type") or "").startswith("audio/") and f.get("url")]
                    if audio_formats:
                        best = max(audio_formats, key=lambda f: int(f.get("bitrate") or 0))
                        return best["url"]
            except Exception:
                continue
    return ""
