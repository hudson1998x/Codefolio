import React, { useState, useEffect } from "react";
import { registerComponent } from '@components/registry';
import { useModuleConfig } from '@config';
import { useRouter } from "@router";
import { getSafeUrl } from "app/web/thirdparty/utils/safe-url";
import { HeaderSearch } from './search';
import headerDefaults from './config.json';
import './style.scss';

interface Link {
  to: string;
  label?: string;
  icon?: string;
}

interface HeaderConfig {
  siteTitle: string;
  links: Link[];
}

export const Header: React.FC = () => {
  const { path } = useRouter();
  const config = useModuleConfig<HeaderConfig>(headerDefaults.key, headerDefaults.config);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isExternal = (to: string) => to.startsWith("http");
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Prevent body scroll when mobile menu is active
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);

  const renderLink = (item: Link, isMobile: boolean) => {
    const isActive = path === item.to || path === item.to + '/';
    const navClass = [
      isMobile ? "mobile-nav-link" : "nav-link",
      isActive ? "active" : "",
      item.icon && item.label ? "iconised-label" : ""
    ].join(" ");

    return (
      <a
        key={item.to}
        href={isExternal(item.to) ? item.to : getSafeUrl(item.to)}
        className={navClass}
        target={isExternal(item.to) ? "_blank" : undefined}
        rel="noopener noreferrer"
        onClick={() => setIsMenuOpen(false)}
      >
        {item.icon && <i className={`${item.icon} ${item.label ? 'me-2' : ''}`} />}
        {item.label && <span>{item.label}</span>}
      </a>
    );
  };

  return (
    <header className="theme-header">
      <div className="container header-container">

        {/* Logo */}
        <div className="nav-logo">
          <a href={getSafeUrl('/')}>{config.siteTitle}</a>
        </div>

        {/* Desktop Navigation + Search (Hidden on Mobile) */}
        <nav className="nav-desktop d-none d-lg-flex">
          {config?.links?.map((item) => renderLink(item, false))}
          <HeaderSearch />
        </nav>

        {/* Hamburger Toggle (Visible on Mobile) */}
        <button
          className={`menu-toggle d-lg-none ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle Menu"
        >
          <span className="hamburger-box">
            <span className="hamburger-inner"></span>
          </span>
        </button>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-backdrop d-lg-none ${isMenuOpen ? 'show' : ''}`} onClick={toggleMenu} />
        <aside className={`mobile-menu-panel d-lg-none ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-search-wrap">
            <HeaderSearch onNavigate={() => setIsMenuOpen(false)} />
          </div>
          <nav className="mobile-nav-list">
            {config?.links?.map((item) => renderLink(item, true))}
          </nav>
        </aside>

      </div>
    </header>
  );
};

registerComponent({
  name: "header",
  defaults: headerDefaults,
  component: Header as React.FC<any>,
});