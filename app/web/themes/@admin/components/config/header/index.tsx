import { FC, useState } from "react";
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

    const initialLinks: HeaderLink[] = data.links 
        ? (Array.isArray(data.links) ? data.links : Object.values(data.links)) 
        : [];

    const [links, setLinks] = useState<HeaderLink[]>(initialLinks);

    const addCustomLink = () => {
        setLinks([...links, { to: "", label: "New Link", icon: "" }]);
    };

    const addPageLink = (page: { id: number, pageTitle: string }) => {
        setLinks([...links, { 
            to: `/page/${page.id}`, 
            label: page.pageTitle, 
            icon: "" 
        }]);
        setIsSearching(false);
    };

    const removeLink = (index: number) => {
        setLinks(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
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
                    <div key={Math.random()} className="cf-header-editor__link-row">
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
        links: [] 
    },
    component: HeaderConfigEditor,
});