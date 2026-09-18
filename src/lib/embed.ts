export interface EmbedInfo {
  provider: string
  src: string
}

export function embedInfo(url: string | undefined | null): EmbedInfo | null {
  const value = (url ?? '').trim()
  if (!value) return null

  let href = value
  if (!/^https?:\/\//i.test(href)) href = `https://${href}`
  const u = new URL(href)

  // YouTube
  const ytHosts = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com']
  if (ytHosts.includes(u.hostname)) {
    let id = u.searchParams.get('v')
    if (!id && u.hostname === 'youtu.be') id = u.pathname.slice(1).split('/')[0]
    if (!id && u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2]
    if (id) return { provider: 'YouTube', src: `https://www.youtube.com/embed/${id}` }
  }

  // Vimeo
  if (u.hostname === 'vimeo.com' || u.hostname === 'player.vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean)[0]
    if (id) return { provider: 'Vimeo', src: `https://player.vimeo.com/video/${id}` }
  }

  // Spotify
  if (u.hostname === 'open.spotify.com') {
    const parts = u.pathname.split('/').filter(Boolean)
    if ((parts[0] === 'track' || parts[0] === 'playlist' || parts[0] === 'album') && parts[1]) {
      return { provider: 'Spotify', src: `https://open.spotify.com/embed/${parts[0]}/${parts[1]}` }
    }
  }

  // SoundCloud
  if (u.hostname === 'soundcloud.com' || u.hostname === 'on.soundcloud.com') {
    return { provider: 'SoundCloud', src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(href)}&color=%23ff5500` }
  }

  // Google Maps
  if (u.hostname === 'google.com' || u.hostname === 'maps.google.com' || u.hostname === 'www.google.com') {
    if (u.pathname.includes('/maps') || u.pathname === '/') {
      const placeSearch = u.searchParams.get('q') || u.searchParams.get('ll') || u.searchParams.get('query')
      const query = placeSearch ? encodeURIComponent(placeSearch) : 'Google'
      return { provider: 'Google Maps', src: `https://www.google.com/maps?q=${query}&output=embed` }
    }
  }

  if (u.hostname.endsWith('google.com') && u.pathname.includes('/maps/embed')) {
    return { provider: 'Google Maps', src: href }
  }

  return null
}

export function isEmbeddable(url: string | undefined | null): boolean {
  return embedInfo(url) !== null
}