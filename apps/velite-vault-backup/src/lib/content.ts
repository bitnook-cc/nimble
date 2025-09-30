import 'server-only'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import type { ContentItem, NavigationSection, NavigationSubsection } from './content-types'

export type { ContentItem, NavigationSection, NavigationSubsection } from './content-types'

const SECTION_CONFIG = {
  rules: { name: 'Rules', emoji: '⚔️' },
  lore: { name: 'Lore', emoji: '📜' },
  bestiary: { name: 'Bestiary', emoji: '🐉' },
  adventures: { name: 'Adventures', emoji: '🗺️' },
  equipment: { name: 'Equipment', emoji: '⚒️' }
}

export function getAllContent(): NavigationSection[] {
  const contentDir = path.join(process.cwd(), 'src/content')
  
  if (!fs.existsSync(contentDir)) {
    return []
  }

  const sections: NavigationSection[] = []

  // Scan each top-level directory (section)
  const sectionDirs = fs.readdirSync(contentDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)

  for (const sectionName of sectionDirs) {
    const sectionPath = path.join(contentDir, sectionName)
    const config = SECTION_CONFIG[sectionName as keyof typeof SECTION_CONFIG]
    
    if (!config) continue

    const section: NavigationSection = {
      name: config.name,
      slug: sectionName,
      emoji: config.emoji,
      items: [],
      subsections: []
    }

    // Scan for content files and subsections
    scanDirectory(sectionPath, section, sectionName)

    // Sort items and subsections by order, then by title
    section.items.sort(sortByOrderThenTitle)
    section.subsections.forEach(sub => sub.items.sort(sortByOrderThenTitle))
    section.subsections.sort((a, b) => a.name.localeCompare(b.name))

    sections.push(section)
  }

  return sections.sort((a, b) => a.name.localeCompare(b.name))
}

function scanDirectory(dirPath: string, section: NavigationSection, sectionName: string, subsectionName?: string) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true })

  for (const item of items) {
    const itemPath = path.join(dirPath, item.name)

    if (item.isDirectory()) {
      // This is a subsection
      const subsection: NavigationSubsection = {
        name: formatName(item.name),
        slug: item.name,
        items: []
      }

      scanDirectory(itemPath, section, sectionName, item.name)
      
      // Find the subsection we just created and add it
      const existingSubsection = section.subsections.find(s => s.slug === item.name)
      if (existingSubsection) {
        // Items were added during recursion
      } else {
        section.subsections.push(subsection)
      }
    } else if (item.name.endsWith('.mdx') || item.name.endsWith('.md')) {
      // This is a content file
      const contentItem = parseContentFile(itemPath, sectionName, subsectionName)
      
      if (subsectionName) {
        // Add to subsection
        let subsection = section.subsections.find(s => s.slug === subsectionName)
        if (!subsection) {
          subsection = {
            name: formatName(subsectionName),
            slug: subsectionName,
            items: []
          }
          section.subsections.push(subsection)
        }
        subsection.items.push(contentItem)
      } else {
        // Add to main section
        section.items.push(contentItem)
      }
    }
  }
}

function parseContentFile(filePath: string, sectionName: string, subsectionName?: string): ContentItem {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data: frontmatter } = matter(fileContent)
  
  const fileName = path.basename(filePath, path.extname(filePath))
  const slug = subsectionName ? `${sectionName}/${subsectionName}/${fileName}` : `${sectionName}/${fileName}`

  return {
    title: frontmatter.title || formatName(fileName),
    description: frontmatter.description,
    order: frontmatter.order || 999,
    tags: frontmatter.tags || [],
    slug,
    fullPath: filePath,
    section: sectionName,
    subsection: subsectionName
  }
}

function formatName(str: string): string {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function sortByOrderThenTitle(a: ContentItem, b: ContentItem): number {
  if (a.order !== b.order) {
    return (a.order || 999) - (b.order || 999)
  }
  return a.title.localeCompare(b.title)
}

export function getContentBySlug(slug: string): ContentItem | null {
  const allContent = getAllContent()
  
  for (const section of allContent) {
    // Check main section items
    const found = section.items.find(item => item.slug === slug)
    if (found) return found

    // Check subsection items
    for (const subsection of section.subsections) {
      const found = subsection.items.find(item => item.slug === slug)
      if (found) return found
    }
  }

  return null
}