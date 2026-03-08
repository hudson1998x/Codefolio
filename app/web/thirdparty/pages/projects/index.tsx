import { CodefolioProps, registerComponent } from "@components/registry"
import { FC, useEffect, useState } from "react"
import { getSafeUrl } from 'app/web/thirdparty/utils/safe-url'
import './style.scss'

// ── Types ────────────────────────────────────────────────────────

interface Project {
    id: number
    projectTitle: string
    projectDescription: string
    repositoryUrl?: string
    publishedUrl?: string
    documentationUrl?: number | string
    tags?: string
    category: string
    created?: string
    updated?: string
}

// ── Content sources (same as picker/header-search) ───────────────

const contentSources = [
    { path: getSafeUrl('/content/page/index.ndjson'),      viewBase: '/page/' },
    { path: getSafeUrl('/content/blog/index.ndjson'),      viewBase: '/blog/' },
    { path: getSafeUrl('/content/documents/index.ndjson'), viewBase: '/documents/' },
]

/** documentationUrl is stored as a full href e.g. "/documents/1", "/page/3"
 *  Split into type + id, fetch /content/{type}/{id}.json directly. */
const resolveDocUrl = async (href: number | string): Promise<string | null> => {
    if (!href || href === '' || href === '0' || href === 0) return null
    const parts = String(href).replace(/^\//, '').split('/')
    if (parts.length < 2) return null
    const [type, id] = parts
    try {
        const res = await fetch(getSafeUrl(`/content/${type}/${id}.json`))
        if (!res.ok) return null
        return getSafeUrl(`/${type}/${id}`)
    } catch {
        return null
    }
}

// ── Load all projects from NDJSON ────────────────────────────────

const loadProjects = async (): Promise<Project[]> => {
    const results: Project[] = []
    try {
        const res = await fetch(getSafeUrl('/content/projects/index.ndjson'))
        if (!res.ok || !res.body) return []
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''
            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed) continue
                try { results.push(JSON.parse(trimmed)) } catch { /* skip */ }
            }
        }
        if (buffer.trim()) {
            try { results.push(JSON.parse(buffer.trim())) } catch { /* skip */ }
        }
    } catch (e) {
        console.error('Failed to load projects:', e)
    }
    return results
}

// ── Helpers ──────────────────────────────────────────────────────

const parseTags = (tags?: string): string[] =>
    tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

const getCategories = (projects: Project[]): string[] =>
    ['All', ...Array.from(new Set(projects.map(p => p.category).filter(Boolean)))]

// ── Icons ────────────────────────────────────────────────────────

const GithubIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`
const ExternalIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`
const DocsIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`

// ── Sub-components ───────────────────────────────────────────────

const ExternalLink: FC<{ href: string; label: string; icon: string }> = ({ href, label, icon }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="project-card__link" title={label}>
        <span className="project-card__link-icon" dangerouslySetInnerHTML={{ __html: icon }} />
        <span>{label}</span>
    </a>
)

// ── Project Card ─────────────────────────────────────────────────

const ProjectCard: FC<{ project: Project; index: number }> = ({ project, index }) => {
    const tags = parseTags(project.tags)
    const [docsHref, setDocsHref] = useState<string | null>(null)

    useEffect(() => {
        if (!project.documentationUrl) return
        resolveDocUrl(project.documentationUrl).then(setDocsHref)
    }, [project.documentationUrl])

    return (
        <article className="project-card" style={{ animationDelay: `${index * 60}ms` }}>
            <div className="project-card__header">
                <div className="project-card__meta">
                    <span className="project-card__category">{project.category}</span>
                    {project.updated && (
                        <span className="project-card__date">
                            {new Date(project.updated).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </span>
                    )}
                </div>
                <h3 className="project-card__title">{project.projectTitle}</h3>
            </div>

            <p className="project-card__description">{project.projectDescription}</p>

            {tags.length > 0 && (
                <div className="project-card__tags">
                    {tags.map(tag => (
                        <span key={tag} className="project-card__tag">{tag}</span>
                    ))}
                </div>
            )}

            <div className="project-card__footer">
                {project.repositoryUrl && (
                    <ExternalLink href={getSafeUrl(project.repositoryUrl)} label="Repository" icon={GithubIcon} />
                )}
                {project.publishedUrl && (
                    <ExternalLink href={getSafeUrl(project.publishedUrl)} label="Live" icon={ExternalIcon} />
                )}
                {docsHref && (
                    <ExternalLink href={docsHref} label="Docs" icon={DocsIcon} />
                )}
            </div>
        </article>
    )
}

// ── Main Component ───────────────────────────────────────────────

const PresetProjectPage: FC<CodefolioProps> = () => {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState('All')
    const [search, setSearch] = useState('')

    useEffect(() => {
        loadProjects().then(p => {
            setProjects(p)
            setLoading(false)
        })
    }, [])

    const categories = getCategories(projects)

    const filtered = projects.filter(p => {
        const matchesCategory = activeCategory === 'All' || p.category === activeCategory
        const q = search.toLowerCase()
        const matchesSearch = !q
            || p.projectTitle?.toLowerCase().includes(q)
            || p.projectDescription?.toLowerCase().includes(q)
            || p.tags?.toLowerCase().includes(q)
            || p.category?.toLowerCase().includes(q)
        return matchesCategory && matchesSearch
    })

    return (
        <div className="projects-page">
            <header className="projects-page__header">
                <h1 className="projects-page__heading">Projects</h1>
                <p className="projects-page__subheading">
                    {projects.length} project{projects.length !== 1 ? 's' : ''}
                </p>
            </header>

            <div className="projects-page__controls">
                <div className="projects-page__search-wrap">
                    <svg className="projects-page__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        className="projects-page__search"
                        type="text"
                        placeholder="Search projects…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button className="projects-page__search-clear" onClick={() => setSearch('')}>✕</button>
                    )}
                </div>

                {categories.length > 2 && (
                    <div className="projects-page__filters">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`projects-page__filter${activeCategory === cat ? ' projects-page__filter--active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading && (
                <div className="projects-page__loading">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="project-card project-card--skeleton" />
                    ))}
                </div>
            )}

            {!loading && filtered.length === 0 && (
                <div className="projects-page__empty">
                    <p>No projects found{search ? ` for "${search}"` : ''}.</p>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className="projects-page__grid">
                    {filtered.map((project, i) => (
                        <ProjectCard key={project.id} project={project} index={i} />
                    ))}
                </div>
            )}
        </div>
    )
}

registerComponent({
    name: 'Presets/ProjectPage',
    component: PresetProjectPage as FC<CodefolioProps>,
    defaults: {}
})