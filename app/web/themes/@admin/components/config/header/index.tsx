import { FC, useState } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { Field } from '@components/input';
import './style.scss';

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
    
    // FAILSAFE: Convert object-style links {"0": {...}} into a real array
    const initialLinks: HeaderLink[] = data.links 
        ? (Array.isArray(data.links) ? data.links : Object.values(data.links)) 
        : [];

    const [links, setLinks] = useState<HeaderLink[]>(initialLinks);

    const addLink = () => setLinks([...links, { to: "", label: "", icon: "" }]);
    const removeLink = (index: number) => setLinks(links.filter((_, i) => i !== index));

    return (
        <div className="cf-header-editor">
            {/* Component Persistence */}
            <input type="hidden" name={`${cfgKey}[component]`} value="Admin/Config/Header" />

            <div className="cf-header-editor__group">
                <Field
                    name={`${cfgKey}[siteTitle]`}
                    kind="input"
                    label="Site Title"
                    defaultValue={data.siteTitle}
                    required={true}
                />
            </div>

            <div className="cf-header-editor__divider" />

            <div className="cf-header-editor__links">
                <div className="cf-header-editor__links-header">
                    <label className="cf-header-editor__label">Navigation Links</label>
                    <button type="button" className="cf-header-editor__add-btn" onClick={addLink}>+ Add Link</button>
                </div>

                {links.map((link, index) => (
                    <div key={index} className="cf-header-editor__link-row">
                        {/* Use empty brackets [] to force arrayization on the backend */}
                        <div className="cf-header-editor__col">
                            <Field name={`${cfgKey}[links][${index}][to]`} kind="input" label="To" defaultValue={link.to} />
                        </div>
                        <div className="cf-header-editor__col">
                            <Field name={`${cfgKey}[links][${index}][label]`} kind="input" label="Label" defaultValue={link.label} />
                        </div>
                        <div className="cf-header-editor__col">
                            <Field name={`${cfgKey}[links][${index}][icon]`} kind="input" label="Icon" defaultValue={link.icon} />
                        </div>
                        <button type="button" className="cf-header-editor__remove-btn" onClick={() => removeLink(index)}>&times;</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

registerComponent({
    name: "Admin/Config/Header",
    defaults: { component: "Admin/Config/Header", siteTitle: "", links: [] },
    component: HeaderConfigEditor,
});