import { FC, useState } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { Field } from '@components/input';
import './style.scss';

export interface SocialItem {
    label: string;
    href: string;
}

export interface FooterConfigData {
    component?: string;
    copyrightName: string;
    socials: SocialItem[];
}

export const FooterConfigEditor: FC<CodefolioProps<FooterConfigData>> = ({ data }) => {
    const cfgKey = "footer";

    // FAILSAFE: Ensure we are mapping over an array even if data comes in as an object
    const initialSocials: SocialItem[] = data.socials 
        ? (Array.isArray(data.socials) ? data.socials : Object.values(data.socials)) 
        : [];

    const [socials, setSocials] = useState<SocialItem[]>(initialSocials);

    const addSocial = () => setSocials([...socials, { label: "", href: "" }]);
    const removeSocial = (index: number) => setSocials(socials.filter((_, i) => i !== index));

    return (
        <div className="cf-footer-editor">
            {/* Component Persistence */}
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

            <div className="cf-footer-editor__divider" />

            <div className="cf-footer-editor__socials">
                <div className="cf-footer-editor__socials-header">
                    <label className="cf-footer-editor__label">Social Media</label>
                    <button type="button" className="cf-footer-editor__add-btn" onClick={addSocial}>+ Add Social</button>
                </div>

                {socials.map((social, index) => (
                    <div key={index} className="cf-footer-editor__social-row">
                        {/* Empty brackets [] ensure these stay as a native array on save */}
                        <div className="cf-footer-editor__col">
                            <Field name={`${cfgKey}[socials][${index}][label]`} kind="input" label="Platform" defaultValue={social.label} />
                        </div>
                        <div className="cf-footer-editor__col">
                            <Field name={`${cfgKey}[socials][${index}][href]`} kind="input" label="URL" defaultValue={social.href} />
                        </div>
                        <button type="button" className="cf-footer-editor__remove-btn" onClick={() => removeSocial(index)}>&times;</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

registerComponent({
    name: "Admin/Config/Footer",
    defaults: { component: "Admin/Config/Footer", copyrightName: "", socials: [] },
    component: FooterConfigEditor,
});