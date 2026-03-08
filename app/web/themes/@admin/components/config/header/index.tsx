import { FC, useState, useRef, useEffect } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { Field } from '@components/input';
import { getSafeUrl } from 'app/web/thirdparty/utils/safe-url';
import './style.scss';
import { PageSearchPicker } from "../../page-picker";

export interface HeaderLink {
    to: string;
    label?: string;
    icon?: string;
}

export interface HeaderConfigData {
    component?: string;
    siteTitle: string;
    links: HeaderLink[];
}

// ── Helpers ──────────────────────────────────────────────────────

const isExternal = (url: string) =>
    /^https?:\/\//i.test(url) || url.startsWith('//');

const getSourceKey = (to: string): string | null => {
    const match = to.match(/^\/([^/]+)\//);
    return match ? match[1] : null;
};

const getTag = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

const tagColours: Record<string, string> = {
    page:      'rgba(124,58,237,0.1)',
    blog:      'rgba(37,99,235,0.1)',
    documents: 'rgba(22,163,74,0.1)',
};
const tagText: Record<string, string> = {
    page:      '#7c3aed',
    blog:      '#2563eb',
    documents: '#16a34a',
};

// ── Internal page preview pill ───────────────────────────────────

interface PagePreviewProps {
    to: string;
    label?: string;
}

const PagePreview: FC<PagePreviewProps> = ({ to, label }) => {
    const [title, setTitle] = useState<string | null>(null);
    const sourceKey = getSourceKey(to);

    useEffect(() => {
        if (!to || isExternal(to)) return;
        const parts = to.replace(/^\//, '').split('/');
        if (parts.length < 2) return;
        const [type, id] = parts;
        fetch(getSafeUrl(`/content/${type}/${id}.json`))
            .then(r => r.ok ? r.json() : null)
            .then(record => {
                if (record) setTitle(record.pageTitle || record.projectTitle || null);
            })
            .catch(() => {});
    }, [to]);

    if (!sourceKey) return null;

    return (
        <div className="cf-header-editor__page-preview">
            <span
                className="cf-header-editor__page-tag"
                style={{
                    background: tagColours[sourceKey] ?? 'rgba(0,0,0,0.06)',
                    color: tagText[sourceKey] ?? '#64748b',
                }}
            >
                {getTag(sourceKey)}
            </span>
            <span className="cf-header-editor__page-title">
                {title ?? label ?? to}
            </span>
            <a
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                className="cf-header-editor__page-open"
                title="Open page"
                onClick={e => e.stopPropagation()}
            >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
            </a>
        </div>
    );
};

// ── Main editor ──────────────────────────────────────────────────

export const HeaderConfigEditor: FC<CodefolioProps<HeaderConfigData>> = ({ data }) => {
    const cfgKey = "header";
    const [isSearching, setIsSearching] = useState(false);

    const initialised = useRef(false);
    const getInitialLinks = (): HeaderLink[] => {
        if (!data.links) return [];
        return Array.isArray(data.links) ? data.links : Object.values(data.links);
    };

    const [links, setLinks] = useState<HeaderLink[]>(getInitialLinks);

    useEffect(() => {
        if (!initialised.current) initialised.current = true;
    }, []);

    const [draggingIndex, setDraggingIndex]   = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex]   = useState<number | null>(null);
    const draggingRef  = useRef<number | null>(null);
    const dragOverRef  = useRef<number | null>(null);
    const rowRefs      = useRef<(HTMLDivElement | null)[]>([]);

    const addCustomLink = () =>
        setLinks(prev => [...prev, { to: "", label: "New Link", icon: "" }]);

    const addPageLink = (page: { id: number | string; pageTitle: string; href: string; sourceKey: string }) => {
        setLinks(prev => [...prev, { to: page.href, label: page.pageTitle, icon: "" }]);
        setIsSearching(false);
    };

    const removeLink = (index: number) =>
        setLinks(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);

    const getIndexFromY = (clientY: number): number => {
        let closest = 0, closestDist = Infinity;
        rowRefs.current.forEach((el, i) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const dist = Math.abs(clientY - (rect.top + rect.height / 2));
            if (dist < closestDist) { closestDist = dist; closest = i; }
        });
        return closest;
    };

    const handleHandleMouseDown = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        draggingRef.current = index;
        dragOverRef.current = index;
        setDraggingIndex(index);
        setDragOverIndex(index);

        const onMouseMove = (mv: MouseEvent) => {
            const over = getIndexFromY(mv.clientY);
            if (over !== dragOverRef.current) { dragOverRef.current = over; setDragOverIndex(over); }
        };

        const onMouseUp = () => {
            const from = draggingRef.current, to = dragOverRef.current;
            if (from !== null && to !== null && from !== to) {
                setLinks(prev => {
                    const u = [...prev];
                    const [moved] = u.splice(from, 1);
                    u.splice(to, 0, moved);
                    return u;
                });
            }
            draggingRef.current = null; dragOverRef.current = null;
            setDraggingIndex(null); setDragOverIndex(null);
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    return (
        <div className="cf-header-editor">
            <input type="hidden" name={`${cfgKey}[component]`} value="Admin/Config/Header" />

            <div className="cf-header-editor__group">
                <Field
                    name={`${cfgKey}[siteTitle]`}
                    kind="input"
                    label="Site Title"
                    defaultValue={data.siteTitle}
                    placeholder="My Portfolio"
                    required={true}
                />
            </div>

            <div className="cf-header-editor__divider" />

            <div className="cf-header-editor__links">
                <div className="cf-header-editor__links-header">
                    <label className="cf-header-editor__label">Navigation & Social Icons</label>
                    <div className="cf-header-editor__actions">
                        <button type="button" className="cf-header-editor__add-page-btn"
                            onClick={() => setIsSearching(!isSearching)}>
                            {isSearching ? "Cancel" : "+ Add Existing Page"}
                        </button>
                        <button type="button" className="cf-header-editor__add-btn"
                            onClick={addCustomLink}>
                            + Custom Link
                        </button>
                    </div>
                </div>

                {isSearching && (
                    <div className="cf-header-editor__search-container">
                        <PageSearchPicker onSelect={addPageLink} />
                    </div>
                )}

                {links.map((link, index) => {
                    const internal = link.to && !isExternal(link.to);
                    return (
                        <div
                            key={link.to + link.label + index}
                            ref={el => { rowRefs.current[index] = el; }}
                            className={[
                                "cf-header-editor__link-row",
                                draggingIndex === index ? "cf-header-editor__link-row--dragging" : "",
                                dragOverIndex === index && draggingIndex !== index ? "cf-header-editor__link-row--drag-over" : "",
                            ].filter(Boolean).join(" ")}
                        >
                            {/* Drag handle */}
                            <div className="cf-header-editor__drag-handle" title="Drag to reorder"
                                onMouseDown={e => handleHandleMouseDown(e, index)}>
                                <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                                    <circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/>
                                    <circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/>
                                    <circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/>
                                </svg>
                            </div>

                            <div className="cf-header-editor__link-body">
                                {/* Internal page: show preview pill above the fields */}
                                {internal && link.to && (
                                    <PagePreview to={link.to} label={link.label} />
                                )}

                                <div className="cf-header-editor__link-fields">
                                    <div className="cf-header-editor__col">
                                        <Field
                                            name={`${cfgKey}[links][${index}][to]`}
                                            kind="input"
                                            label="URL / Path"
                                            defaultValue={link.to}
                                            required={true}
                                        />
                                    </div>
                                    <div className="cf-header-editor__col">
                                        <Field
                                            name={`${cfgKey}[links][${index}][label]`}
                                            kind="input"
                                            label="Label"
                                            defaultValue={link.label || ""}
                                        />
                                    </div>
                                    <div className="cf-header-editor__col">
                                        <Field
                                            name={`${cfgKey}[links][${index}][icon]`}
                                            kind="input"
                                            label="Icon Class"
                                            defaultValue={link.icon || ""}
                                            placeholder="fab fa-github"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="button" className="cf-header-editor__remove-btn"
                                onClick={() => removeLink(index)}>
                                &times;
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

registerComponent({
    name: "Admin/Config/Header",
    defaults: {
        component: "Admin/Config/Header",
        siteTitle: "My Portfolio",
        links: [],
    },
    component: HeaderConfigEditor,
});