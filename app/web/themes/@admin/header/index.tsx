import { useState, useEffect, useRef, useMemo } from 'react';
import './style.scss';
import { useHotKey } from '@hooks/use-hotkey';
import { VcsStatusBar } from '../components/vcs-status';
import { Link } from '@router';
import { CommandSearch } from '../components/command-search';
import { getSafeUrl } from 'app/web/thirdparty/utils/safe-url';
import { GitCommitAndPush } from '../components/git-commit-and-push';

/** Navigation Interface */
interface NavConfig {
  label: string;
  href?: string;
  icon?: string;
  children?: NavConfig[];
}

/** Individual Nav Item with local collapse state */
const NavItem = ({ item, noBack }: { item: NavConfig, noBack?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = !!item.children?.length;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <li className="nav-item-wrapper">
      <a 
        href={item.href || '#'} 
        className={`nav-link ${isOpen ? 'is-active' : ''}`} 
        onClick={handleClick}
      >
        {item.label}
        {hasChildren && <i className={`fas fa-${isOpen ? 'chevron-up' : 'chevron-down'}`}/>}
      </a>
      {hasChildren && (
        <div className={`nav-dropdown ${isOpen ? 'is-open' : ''}`}>
          <RenderNavItems items={item.children!} noBack={true} />
        </div>
      )}
    </li>
  );
};

const RenderNavItems = ({ items, noBack }: { items: NavConfig[], noBack?: boolean }) => (
  <ul className="nav-list">
    {!noBack ? (
      <li className='nav-item-wrapper'>
        <a href={getSafeUrl('/')} className="nav-link" target='_blank'>Visit Website</a>
      </li>
    ) : null}
    {items.map((item, index) => (
      <NavItem key={index} item={item} noBack={noBack} />
    ))}
  </ul>
);

export const AdminHeader = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [navigation, setNavigation] = useState<NavConfig[]>([]);
  const [navOpen, setNavOpen] = useState<boolean>(false);

  document.body.setAttribute("admin-nav-open", String(navOpen));

  // Fetch Nav Logic
  useEffect(() => {
    const fetchNav = async () => {
      try {
        const response = await fetch('/en-admin/nav.json');
        const data = await response.json();
        setNavigation(data);
      } catch (err) {
        console.error('Nav Fetch Error:', err);
      }
    };
    fetchNav();
  }, []);

  // WebSocket Sync Logic
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    ws.onmessage = (event) => {
      if (event.data === 'SAVING_START') setIsSaving(true);
      if (event.data === 'SAVING_END') setIsSaving(false);
    };
    return () => ws.close();
  }, []);

  return (
    <>
      <header className="platform-header">
        <div className="header-left">
          <button className='menu-toggle' onClick={() => setNavOpen((current) => !current)}>
            <i className='fas fa-bars'/>
          </button>
          <div className="workspace-switcher">
            <div className="logo-box">CF</div>
            <div className="label-group">
              <span className="title">CodeFolio</span>
              <span className="status">Dev Mode</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <CommandSearch navigation={navigation} />
        </div>

        <div className="header-right">
          <div className="system-indicators">
            <div className={`save-status ${isSaving ? 'is-saving' : ''}`}>
              {isSaving ? 'Syncing...' : 'Synced'}
            </div>
            <VcsStatusBar />
          </div>
          <GitCommitAndPush />
          <div className="profile-pill">
            <img src="https://api.dicebear.com/7.x/shapes/svg?seed=noir" alt="User" />
          </div>
        </div>
      </header>
      
      {navOpen && (
        <aside className='user-nav'>
          <nav className="dynamic-nav">
            <RenderNavItems items={navigation} />
          </nav>
        </aside>
      )}
    </>
  );
};