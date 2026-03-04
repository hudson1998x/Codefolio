import { FC, useState } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { PageSearchPicker } from "../../page-picker";
import './style.scss';

export interface HomepageConfigData {
    component?: string;
    homepage: string; // Stored as "/page/1"
}

export const HomepageEditor: FC<CodefolioProps<HomepageConfigData>> = ({ data }) => {
    const cfgKey = "homepage";
    // Initialize state with the existing data
    const [selectedPage, setSelectedPage] = useState(data.homepage);

    const handlePageSelect = (page: { id: number, pageTitle: string }) => {
        // Update the state, which triggers a re-render of the hidden input's value
        setSelectedPage(`/page/${page.id}`);
    };

    return (
        <div className="cf-homepage-editor">
            {/* Persist component path */}
            <input type="hidden" name={`${cfgKey}[component]`} value="Admin/Config/HomepageEditor" />
            
            <div className="cf-homepage-editor__group">
                <label className="cf-header-editor__label">Default Homepage</label>
                <p className="cf-homepage-editor__help">
                    Select the page that visitors see when they first arrive at your site.
                </p>
                
                {/* Using 'value' instead of 'defaultValue' tied to state.
                   When the Form collects data, it reads the current value of this input.
                */}
                <input 
                    type="hidden" 
                    name={`${cfgKey}[homepage]`} 
                    value={selectedPage} 
                />

                <div className="cf-homepage-editor__picker-wrapper">
                    <PageSearchPicker onSelect={handlePageSelect} />
                </div>

                {selectedPage && (
                    <div className="cf-homepage-editor__current">
                        Currently selected: <code>{selectedPage}</code>
                    </div>
                )}
            </div>
        </div>
    );
};

registerComponent({
    name: "Admin/Config/HomepageEditor",
    defaults: { 
        component: "Admin/Config/HomepageEditor",
        homepage: "/page/1" 
    },
    component: HomepageEditor,
});