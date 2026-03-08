import { FC, useState, useRef } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { Field } from '@components/input';
import { useModuleConfig } from '@config';
import './style.scss';

export interface FooterConfigData {
    component?: string;
    copyrightName: string;
    socialOrder: string[];
}

type SocialLinksConfig = Record<string, string | null>;

const SOCIAL_LABELS: Record<string, string> = {
    github:        'GitHub',
    stackoverflow: 'Stack Overflow',
    reddit:        'Reddit',
    linkedin:      'LinkedIn',
    discord:       'Discord',
    dev:           'Dev.to',
    hackernews:    'Hacker News',
};

const SOCIAL_ICONS: Record<string, string> = {
    github:        'fab fa-github',
    stackoverflow: 'fab fa-stack-overflow',
    reddit:        'fab fa-reddit',
    linkedin:      'fab fa-linkedin',
    discord:       'fab fa-discord',
    dev:           'fab fa-dev',
    hackernews:    'fab fa-y-combinator',
};

export const FooterConfigEditor: FC<CodefolioProps<FooterConfigData>> = ({ data }) => {
    const cfgKey = "footer";

    const socialLinks = useModuleConfig<SocialLinksConfig>("social-links", {});

    // All social keys except the internal "component" field
    const allKeys = Object.keys(socialLinks).filter(k => k !== "component");

    // Initialise order: saved order first, then any keys not yet in the saved order
    const getInitialOrder = (): string[] => {
        const saved = Array.isArray(data.socialOrder) ? data.socialOrder : [];
        const rest  = allKeys.filter(k => !saved.includes(k));
        return [...saved.filter(k => allKeys.includes(k)), ...rest];
    };

    const [order, setOrder] = useState<string[]>(getInitialOrder);

    const draggingRef  = useRef<number | null>(null);
    const dragOverRef  = useRef<number | null>(null);
    const [draggingIndex, setDraggingIndex]  = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex]  = useState<number | null>(null);
    const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

    const getIndexFromY = (clientY: number): number => {
        let closest = 0;
        let closestDist = Infinity;
        rowRefs.current.forEach((el, i) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            const dist = Math.abs(clientY - midY);
            if (dist < closestDist) { closestDist = dist; closest = i; }
        });
        return closest;
    };

    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        e.preventDefault();
        draggingRef.current = index;
        dragOverRef.current = index;
        setDraggingIndex(index);
        setDragOverIndex(index);

        const onMouseMove = (ev: MouseEvent) => {
            const over = getIndexFromY(ev.clientY);
            if (over !== dragOverRef.current) {
                dragOverRef.current = over;
                setDragOverIndex(over);
            }
        };

        const onMouseUp = () => {
            const from = draggingRef.current;
            const to   = dragOverRef.current;
            if (from !== null && to !== null && from !== to) {
                setOrder(prev => {
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
        <div className="cf-footer-editor">
            <input type="hidden" name={`${cfgKey}[component]`} value="Admin/Config/Footer" />

            <div className="cf-footer-editor__group">
                <Field
                    name={`${cfgKey}[copyrightName]`}
                    kind="input"
                    label="Copyright Name"
                    defaultValue={data.copyrightName}
                    required={true}
                />
            </div>

            {allKeys.length > 0 && (
                <>
                    <div className="cf-footer-editor__divider" />

                    <div className="cf-footer-editor__socials">
                        <div className="cf-footer-editor__socials-header">
                            <label className="cf-footer-editor__label">Social Link Order</label>
                            <span className="cf-footer-editor__hint">Drag to reorder — links without a URL will not appear</span>
                        </div>

                        {/* Persist order as hidden inputs */}
                        {order.map((key, i) => (
                            <input key={key} type="hidden" name={`${cfgKey}[socialOrder][${i}]`} value={key} />
                        ))}

                        {order.map((key, index) => {
                            const hasValue = !!socialLinks[key]?.trim();
                            return (
                                <div
                                    key={key}
                                    ref={el => { rowRefs.current[index] = el; }}
                                    className={[
                                        "cf-footer-editor__social-row",
                                        !hasValue                                            ? "cf-footer-editor__social-row--null"      : "",
                                        draggingIndex === index                              ? "cf-footer-editor__social-row--dragging"  : "",
                                        dragOverIndex === index && draggingIndex !== index   ? "cf-footer-editor__social-row--drag-over" : "",
                                    ].filter(Boolean).join(" ")}
                                >
                                    <div
                                        className="cf-footer-editor__drag-handle"
                                        onMouseDown={e => handleMouseDown(e, index)}
                                        title="Drag to reorder"
                                    >
                                        <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                                            <circle cx="3" cy="3"  r="1.5" />
                                            <circle cx="9" cy="3"  r="1.5" />
                                            <circle cx="3" cy="9"  r="1.5" />
                                            <circle cx="9" cy="9"  r="1.5" />
                                            <circle cx="3" cy="15" r="1.5" />
                                            <circle cx="9" cy="15" r="1.5" />
                                        </svg>
                                    </div>

                                    <i className={`cf-footer-editor__social-icon ${SOCIAL_ICONS[key] ?? 'fas fa-link'}`} />

                                    <span className="cf-footer-editor__social-label">
                                        {SOCIAL_LABELS[key] ?? key}
                                    </span>

                                    {!hasValue && (
                                        <span className="cf-footer-editor__social-null">
                                            <i className="fas fa-eye-slash" /> No URL set
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

registerComponent({
    name: "Admin/Config/Footer",
    defaults: { component: "Admin/Config/Footer", copyrightName: "", socialOrder: [] },
    component: FooterConfigEditor,
});