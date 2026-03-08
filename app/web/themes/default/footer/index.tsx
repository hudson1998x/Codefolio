import React from "react";
import { registerComponent } from '@components/registry';
import { useModuleConfig } from '@config';
import './style.scss';

import footerDefaults from './config.json'

interface FooterConfig {
  copyrightName: string;
  socialOrder: string[];
}

type SocialLinksConfig = Record<string, string | null>;

export const Footer: React.FC = () => {
  const config      = useModuleConfig<FooterConfig>(footerDefaults.key, footerDefaults.config);
  const socialLinks = useModuleConfig<SocialLinksConfig>("social-links", {});

  // All keys except the internal "component" field that have a non-null href
  const visibleSocials = Object.keys(socialLinks)
    .filter(key => key !== "component" && !!socialLinks[key]?.trim());

  // Respect socialOrder where specified, append any remaining unordered ones after
  const orderedSocials = [
    ...(config.socialOrder ?? []).filter(key => visibleSocials.includes(key)),
    ...visibleSocials.filter(key => !(config.socialOrder ?? []).includes(key)),
  ];

  return (
    <footer className="theme-footer border-top mt-auto py-4 bg-light">
      <div className="container">
        <div className="footer-content d-flex flex-column flex-md-row justify-content-between align-items-center">
          <p className="mb-0 text-muted">
            &copy; {new Date().getFullYear()} —{" "}
            <span className="fw-semibold">{config.copyrightName}</span>
          </p>

          {orderedSocials.length > 0 && (
            <div className="footer-socials d-flex gap-3 mt-3 mt-md-0">
              {orderedSocials.map(key => (
                <a
                  key={key}
                  href={socialLinks[key]!}
                  className="text-decoration-none text-secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

registerComponent({
  name: "footer",
  defaults: footerDefaults,
  component: Footer as React.FC<any>,
});