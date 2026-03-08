import { FC, useState, useEffect } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { PageSearchPicker, addPickerSource } from "../../page-picker";
import { getSafeUrl } from 'app/web/thirdparty/utils/safe-url';
import './style.scss';

export interface HomepageConfigData {
    component?: string;
    homepage: string; // stored as "/page/1", "/documents/2" etc.
}

interface ResolvedPage {
    pageTitle: string;
    sourceKey: string;
    href: string;
}

const resolveHref = async (href: string): Promise<ResolvedPage | null> => {
    if (!href || href === '') return null;
    const parts = href.replace(/^\//, '').split('/');
    if (parts.length < 2) return null;
    const [type, id] = parts;
    try {
        const res = await fetch(getSafeUrl(`/content/${type}/${id}.json`));
        if (!res.ok) return null;
        const record = await res.json();
        return {
            pageTitle: record.pageTitle || record.projectTitle || id,
            sourceKey: type,
            href: getSafeUrl(`/${type}/${id}`),
        };
    } catch {
        return null;
    }
};

const getTag = (sourceKey: string) =>
    sourceKey.charAt(0).toUpperCase() + sourceKey.slice(1);

export const HomepageEditor: FC<CodefolioProps<HomepageConfigData>> = ({ data }) => {
    const cfgKey = "homepage";

    const [currentValue, setCurrentValue] = useState(data.homepage ?? '');
    const [selected, setSelected] = useState<ResolvedPage | null>(null);
    const [resolving, setResolving] = useState(false);

    useEffect(() => {
        if (!data.homepage || data.homepage === '') return;
        setResolving(true);
        resolveHref(data.homepage).then(result => {
            if (result) {
                setSelected(result);
                setCurrentValue(result.href);
            }
            setResolving(false);
        });
    }, [data.homepage]);

    return (
        <div className="cf-homepage-editor">
            <input type="hidden" name={`${cfgKey}[component]`} value="Admin/Config/HomepageEditor" />
            <input type="hidden" name={`${cfgKey}[homepage]`} value={currentValue} />

            <div className="cf-homepage-editor__group">
                <label className="cf-header-editor__label">Default Homepage</label>
                <p className="cf-homepage-editor__help">
                    Select the page that visitors see when they first arrive at your site.
                </p>

                <div className="cf-homepage-editor__picker-wrapper">
                    {resolving && (
                        <div className="cf-page-picker-input__selected">
                            <div className="cf-page-picker__spinner" />
                            <span className="cf-page-picker-input__selected-label">Loading…</span>
                        </div>
                    )}

                    {!resolving && selected && (
                        <div className="cf-page-picker-input__selected">
                            <span className={`cf-page-picker__tag cf-page-picker__tag--${selected.sourceKey}`}>
                                {getTag(selected.sourceKey)}
                            </span>
                            <span className="cf-page-picker-input__selected-label">{selected.pageTitle}</span>
                            <button
                                type="button"
                                className="cf-page-picker-input__clear"
                                onClick={() => { setCurrentValue(''); setSelected(null); }}
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {!resolving && !selected && (
                        <PageSearchPicker
                            onSelect={(page) => {
                                setCurrentValue(page.href);
                                setSelected({
                                    pageTitle: page.pageTitle,
                                    sourceKey: page.sourceKey,
                                    href: page.href,
                                });
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

registerComponent({
    name: "Admin/Config/HomepageEditor",
    defaults: {
        component: "Admin/Config/HomepageEditor",
        homepage: "",
    },
    component: HomepageEditor,
});