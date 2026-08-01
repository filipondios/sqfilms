import re
import requests
from config import get_tmdb_api_key

TMDB_FIND_URL = 'https://api.themoviedb.org/3/find/{imdb_id}'
TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342'
REQUEST_TIMEOUT = 5


def normalize_imdb_link(imdb_link: str | None) -> str | None:
    """Normalizes an IMDb reference to the compact identifier stored in the DB."""
    if not imdb_link:
        return None

    value = str(imdb_link).strip()
    if not value:
        return None

    match = re.search(r'tt(\d{6,9})', value, re.IGNORECASE)
    if match:
        return match.group(1)

    match = re.search(r'(\d{6,9})', value)
    return match.group(1) if match else None


def build_imdb_url(imdb_link: str | None) -> str | None:
    """Builds the public IMDb URL from a compact identifier or a legacy value."""
    imdb_id = normalize_imdb_link(imdb_link)
    if not imdb_id:
        return None
    return f"https://www.imdb.com/title/tt{imdb_id}"


def extract_imdb_id(imdb_link: str | None) -> str | None:
    """Extracts the IMDb id (e.g. 'tt0111161') from a full IMDb URL or compact id."""
    imdb_id = normalize_imdb_link(imdb_link)
    return f"tt{imdb_id}" if imdb_id else None


def normalize_poster_url(poster_url: str | None) -> str | None:
    """Normalizes a poster URL to a compact DB-safe identifier."""
    if not poster_url:
        return None

    value = str(poster_url).strip()
    if not value:
        return None

    match = re.search(r'https://image\.tmdb\.org/t/p/[^/]+/(?P<path>.+)', value)
    if match:
        path = match.group('path').lstrip('/')
        if '.' in path:
            path = path.rsplit('.', 1)[0]
        return path

    if value.startswith('/'):
        value = value[1:]
    if '.' in value:
        value = value.rsplit('.', 1)[0]
    return value


def build_poster_url(poster_url: str | None) -> str | None:
    """Rebuilds the full poster URL from the compact DB value."""
    if not poster_url:
        return None

    value = str(poster_url).strip()
    if not value:
        return None

    if value.startswith('http://') or value.startswith('https://'):
        return value

    normalized = normalize_poster_url(value)
    if not normalized:
        return None

    if '.' not in normalized:
        normalized = f"{normalized}.jpg"
    return f"{TMDB_IMAGE_BASE}/{normalized.lstrip('/')}"


def fetch_poster_url(imdb_link: str | None) -> str | None:
    """ Resolves a poster image URL for a movie/series from its IMDb link,
    using the TMDb API. Returns None if there's no API key configured,
    no valid IMDb id, no match, or the request fails for any reason.
    This never raises: a poster is a nice-to-have, not something that
    should ever break creating/editing a review. """

    tmdb_key = get_tmdb_api_key()
    if not tmdb_key:
        return None

    imdb_id = extract_imdb_id(imdb_link)
    if not imdb_id:
        return None

    try:
        response = requests.get(
            TMDB_FIND_URL.format(imdb_id=imdb_id),
            params={'api_key': tmdb_key, 'external_source': 'imdb_id'},
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        data = response.json()

        # A given IMDb id can match a movie or a tv show, never both
        for key in ('movie_results', 'tv_results'):
            results = data.get(key) or []
            if results and results[0].get('poster_path'):
                return f"{TMDB_IMAGE_BASE}{results[0]['poster_path']}"

        return None
    except requests.RequestException as e:
        print(f"[!] TMDb lookup failed for {imdb_id}: {e}")
        return None
    except (ValueError, KeyError, IndexError) as e:
        print(f"[!] TMDb response parsing failed for {imdb_id}: {e}")
        return None