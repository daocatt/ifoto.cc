import { useEffect } from 'react'

interface SeoOptions {
  title: string
  description?: string
  keywords?: string
  path?: string
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

// 轻量 SEO：根据当前路由动态更新 <title> 与 description/keywords/OG 标签
export function useSEO({ title, description, keywords, path }: SeoOptions) {
  useEffect(() => {
    document.title = title

    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
    }
    if (keywords) {
      setMeta('name', 'keywords', keywords)
    }
    if (path) {
      setMeta('property', 'og:title', title)
      setMeta('property', 'og:url', window.location.origin + path)
      setMeta('property', 'og:type', 'website')
    }
  }, [title, description, keywords, path])
}