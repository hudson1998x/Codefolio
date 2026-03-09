import { FC } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { Field } from "@components/input";
import config from './config.json';
import { useModuleConfig } from "@config";
import { Alert } from "@components/alert";

type PersonalInformationConfig = {
    component?: string;
    [key: string]: any;
}

export const AdminPersonalInformationEditor: FC<CodefolioProps<PersonalInformationConfig>> = ({ data }) => {

    const platformConfig = useModuleConfig("platformConfig", {
        mode: 'portfolio'
    });

    if (platformConfig.mode !== 'portfolio')
    {
        return (
            // @ts-ignore TODO: Sort this out.
            <Alert data={{ variant: 'warning', title: 'This feature is only available when the platform is in portfolio mode.' }}/>
        )
    }

    return (
        <div className="cf-personal-info-editor">
            <input type="hidden" name="personalInformation[component]" value="Admin/Config/PersonalInformationEditor" />
            {Object.keys(config.config).map((key) => (
                <Field
                    key={key}
                    name={`personalInformation[${key}]`}
                    kind="input"
                    label={key}
                    defaultValue={data[key] ?? ""}
                />
            ))}
        </div>
    );
};

registerComponent({
    name: "Admin/Config/PersonalInformationEditor",
    defaults: {
        ...config.config,
    },
    component: AdminPersonalInformationEditor,
});