import { FC } from "react";
import { registerComponent, CodefolioProps } from "@components/registry";
import { Field } from "@components/input";
import './style.scss';

type SocialLinkConfig = {
    component?: string;
    github?: string | null;
    stackoverflow?: string | null;
    reddit?: string | null;
    linkedin?: string | null;
    discord?: string | null;
    dev?: string | null;
    hackernews?: string | null;
}

const SOCIAL_META: Record<keyof Omit<SocialLinkConfig, 'component'>, { label: string; placeholder: string; icon: string }> = {
    github:        { label: 'GitHub',         placeholder: 'https://github.com/yourprofile',                   icon: 'fab fa-github' },
    stackoverflow: { label: 'Stack Overflow', placeholder: 'https://stackoverflow.com/users/yourprofile',      icon: 'fab fa-stack-overflow' },
    reddit:        { label: 'Reddit',         placeholder: 'https://reddit.com/u/yourprofile',                 icon: 'fab fa-reddit' },
    linkedin:      { label: 'LinkedIn',       placeholder: 'https://linkedin.com/in/yourprofile',              icon: 'fab fa-linkedin' },
    discord:       { label: 'Discord',        placeholder: 'https://discord.com/invite/yourserver',            icon: 'fab fa-discord' },
    dev:           { label: 'Dev.to',         placeholder: 'https://dev.to/yourprofile',                       icon: 'fab fa-dev' },
    hackernews:    { label: 'Hacker News',    placeholder: 'https://news.ycombinator.com/user?id=yourprofile', icon: 'fab fa-y-combinator' },
}

export const AdminSocialLinkEditor: FC<CodefolioProps<SocialLinkConfig>> = ({ data }) => {
    const cfgKey = "social-links";

    return (
        <div className="cf-social-link-editor">
            <input type="hidden" name={`${cfgKey}[component]`} value="Admin/Config/SocialLinkEditor" />

            <div className="cf-social-link-editor__fields">
                {(Object.keys(SOCIAL_META) as Array<keyof typeof SOCIAL_META>).map((key) => {
                    const meta = SOCIAL_META[key];

                    return (
                        <div key={key} className="cf-social-link-editor__row">
                            <div className="cf-social-link-editor__icon">
                                <i className={meta.icon} />
                            </div>
                            <div className="cf-social-link-editor__field">
                                <Field
                                    name={`${cfgKey}[${key}]`}
                                    kind="input"
                                    label={meta.label}
                                    defaultValue={data[key] ?? ""}
                                    placeholder={meta.placeholder}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

registerComponent({
    name: "Admin/Config/SocialLinkEditor",
    defaults: {
        component: "Admin/Config/SocialLinkEditor",
        github: null,
        stackoverflow: null,
        reddit: null,
        linkedin: null,
        discord: null,
        dev: null,
        hackernews: null,
    },
    component: AdminSocialLinkEditor,
});