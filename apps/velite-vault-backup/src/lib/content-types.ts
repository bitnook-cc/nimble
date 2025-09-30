export interface ContentItem {
  title: string
  description?: string
  order?: number
  tags?: string[]
  slug: string
  fullPath: string
  section: string
  subsection?: string
}

export interface NavigationSection {
  name: string
  slug: string
  emoji: string
  items: ContentItem[]
  subsections: NavigationSubsection[]
}

export interface NavigationSubsection {
  name: string
  slug: string
  items: ContentItem[]
}