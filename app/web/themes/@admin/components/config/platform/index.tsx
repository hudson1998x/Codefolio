import { CodefolioProps, registerComponent } from "@components/registry"
import { FC } from "react"
import platformConfig from './config.json'
import { Field } from "@components/input"
import { useModuleConfig } from "@config"

const PlatformConfig: FC<CodefolioProps> = () => {

    const userCfg = useModuleConfig(platformConfig.key, platformConfig.config);

    return (
        <div className='platform-config'>
            <input type='hidden' name={`${platformConfig.key}[component]`} value={'Admin/Config/Platform'}/>
            <Field
                label="Platform Mode"
                kind="select"
                name={`${platformConfig.key}[mode]`}
                options={[
                    {
                        label: 'Portfolio',
                        value: 'portfolio'
                    },
                    {
                        label: 'Documentation',
                        value: 'documentation'
                    },
                    {
                        label: 'Static application',
                        value: 'static_app'
                    }
                ]}
                defaultValue={userCfg.mode}
            />
        </div>
    )
}

registerComponent({
    name: 'Admin/Config/Platform',
    component: PlatformConfig,
    defaults: platformConfig.config
})