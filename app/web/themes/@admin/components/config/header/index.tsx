import { FC, useState, useRef, useEffect } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { Field } from '@components/input';
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

export const HeaderConfigEditor: FC<CodefolioProps<HeaderConfigData>> = ({ data }) => {
    const cfgKey = "header";
    const [isSearching, setIsSearching] = useState(false);

    // Use a ref to track if we've initialised — ignore parent re-renders resetting links
    const initialised = useRef(false);
    const getInitialLinks = (): HeaderLink[] => {
        if (!data.links) return [];
        return Array.isArray(data.links) ? data.links : Object.values(data.links);
    };

    const [links, setLinks] = useState<HeaderLink[]>(getInitialLinks);

    // Only re-init from props if we haven't mounted yet (guard against parent re-renders)
    useEffect(() => {
        if (!initialised.current) {
            initialised.current = true;
        }
    }, []);

    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const draggingRef = useRef<number | null>(null);
    const dragOverRef = useRef<number | null>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

    const addCustomLink = () => {
        setLinks(prev => [...prev, { to: "", label: "New Link", icon: "" }]);
    };

    const addPageLink = (page: { id: number; pageTitle: string }) => {
        setLinks(prev => [...prev, { to: `/page/${page.id}`, label: page.pageTitle, icon: "" }]);
        setIsSearching(false);
    };

    const removeLink = (index: number) => {
        setLinks(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    };

    const getIndexFromY = (clientY: number): number => {
        let closest = 0;
        let closestDist = Infinity;
        rowRefs.current.forEach((el, i) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const dist = Math.abs(clientY - midY);
            if (dist < closestDist) {
                closestDist = dist;
                closest = i;
            }
        });
        return closest;
    };

    const handleHandleMouseDown = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        draggingRef.current = index;
        dragOverRef.current = index;
        setDraggingIndex(index);
        setDragOverIndex(index);

        const onMouseMove = (moveEvent: MouseEvent) => {
            const overIndex = getIndexFromY(moveEvent.clientY);
            if (overIndex !== dragOverRef.current) {
                dragOverRef.current = overIndex;
                setDragOverIndex(overIndex);
            }
        };

        const onMouseUp = () => {
            const from = draggingRef.current;
            const to = dragOverRef.current;

            if (from !== null && to !== null && from !== to) {
                setLinks(prev => {
                    const updated = [...prev];
                    const [moved] = updated.splice(from, 1);
                    updated.splice(to, 0, moved);
                    return updated;
                });
            }

            draggingRef.current = null;
            dragOverRef.current = null;
            setDraggingIndex(null);
            setDragOverIndex(null);

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
                        <button
                            type="button"
                            className="cf-header-editor__add-page-btn"
                            onClick={() => setIsSearching(!isSearching)}
                        >
                            {isSearching ? "Cancel" : "+ Add Existing Page"}
                        </button>
                        <button
                            type="button"
                            className="cf-header-editor__add-btn"
                            onClick={addCustomLink}
                        >
                            + Custom Link
                        </button>
                    </div>
                </div>

                {isSearching && (
                    <div className="cf-header-editor__search-container">
                        <PageSearchPicker onSelect={addPageLink} />
                    </div>
                )}

                {links.map((link, index) => (
                    <div
                        key={link.to + link.label + index}
                        ref={el => { rowRefs.current[index] = el; }}
                        className={[
                            "cf-header-editor__link-row",
                            draggingIndex === index ? "cf-header-editor__link-row--dragging" : "",
                            dragOverIndex === index && draggingIndex !== index ? "cf-header-editor__link-row--drag-over" : "",
                        ].filter(Boolean).join(" ")}
                    >
                        <div
                            className="cf-header-editor__drag-handle"
                            title="Drag to reorder"
                            onMouseDown={(e) => handleHandleMouseDown(e, index)}
                        >
                            <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                                <circle cx="3" cy="3" r="1.5" />
                                <circle cx="9" cy="3" r="1.5" />
                                <circle cx="3" cy="9" r="1.5" />
                                <circle cx="9" cy="9" r="1.5" />
                                <circle cx="3" cy="15" r="1.5" />
                                <circle cx="9" cy="15" r="1.5" />
                            </svg>
                        </div>

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

                        <button
                            type="button"
                            className="cf-header-editor__remove-btn"
                            onClick={() => removeLink(index)}
                        >
                            &times;
                        </button>
                    </div>
                ))}
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