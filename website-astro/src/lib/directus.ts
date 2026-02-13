type DirectusPost = {
  id: string | number
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  category?: string | null
  version?: string | null
  published_at?: string | null
}

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL as string | undefined
const DIRECTUS_TOKEN = import.meta.env.DIRECTUS_TOKEN as string | undefined

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set. Define it in website-astro/.env before building.`)
  }
  return value
}

function buildHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (DIRECTUS_TOKEN) headers.Authorization = `Bearer ${DIRECTUS_TOKEN}`
  return headers
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function fetchPosts(): Promise<(DirectusPost & { formatted_date: string })[]> {
  const base = requireEnv('DIRECTUS_URL', DIRECTUS_URL)
  const url = new URL(`${base}/items/posts`)
  url.searchParams.set('filter[status][_eq]', 'published')
  url.searchParams.set('sort', '-published_at')
  url.searchParams.set('limit', '200')
  url.searchParams.set('fields', 'id,title,slug,excerpt,content,category,version,published_at')

  const res = await fetch(url.toString(), { headers: buildHeaders() })
  if (!res.ok) throw new Error(`Directus fetchPosts failed: ${res.status}`)
  const data = await res.json()
  const posts: DirectusPost[] = data?.data || []
  return posts.map((p) => ({ ...p, formatted_date: formatDate(p.published_at) }))
}

export async function fetchPostBySlug(slug: string): Promise<(DirectusPost & { formatted_date: string }) | null> {
  const base = requireEnv('DIRECTUS_URL', DIRECTUS_URL)
  const url = new URL(`${base}/items/posts`)
  url.searchParams.set('filter[status][_eq]', 'published')
  url.searchParams.set('filter[slug][_eq]', slug)
  url.searchParams.set('limit', '1')
  url.searchParams.set('fields', 'id,title,slug,excerpt,content,category,version,published_at')

  const res = await fetch(url.toString(), { headers: buildHeaders() })
  if (!res.ok) throw new Error(`Directus fetchPostBySlug failed: ${res.status}`)
  const data = await res.json()
  const post: DirectusPost | undefined = data?.data?.[0]
  if (!post) return null
  return { ...post, formatted_date: formatDate(post.published_at) }
}
