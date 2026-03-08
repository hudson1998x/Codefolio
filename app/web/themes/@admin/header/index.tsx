import { useState, useEffect } from 'react';
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

type OpenItemsMap = Record<string, boolean>;

const getNavKey = (label: string, parentKey = ''): string => `${parentKey}/${label}`;

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
};

/** Individual Nav Item — open state lives in shared openItems map */
const NavItem = ({
  item,
  noBack,
  parentKey,
  openItems,
  setOpenItems,
}: {
  item: NavConfig;
  noBack?: boolean;
  parentKey: string;
  openItems: OpenItemsMap;
  setOpenItems: React.Dispatch<React.SetStateAction<OpenItemsMap>>;
}) => {
  const hasChildren = !!item.children?.length;
  const navKey = getNavKey(item.label, parentKey);
  const isOpen = !!openItems[navKey];

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setOpenItems((prev) => ({ ...prev, [navKey]: !prev[navKey] }));
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
        {hasChildren && <i className={`fas fa-${isOpen ? 'chevron-up' : 'chevron-down'}`} />}
      </a>
      {hasChildren && (
        <div className={`nav-dropdown ${isOpen ? 'is-open' : ''}`}>
          <RenderNavItems
            items={item.children!}
            noBack={true}
            parentKey={navKey}
            openItems={openItems}
            setOpenItems={setOpenItems}
          />
        </div>
      )}
    </li>
  );
};

const RenderNavItems = ({
  items,
  noBack,
  parentKey = '',
  openItems,
  setOpenItems,
}: {
  items: NavConfig[];
  noBack?: boolean;
  parentKey?: string;
  openItems: OpenItemsMap;
  setOpenItems: React.Dispatch<React.SetStateAction<OpenItemsMap>>;
}) => (
  <ul className="nav-list">
    {!noBack && (
      <li className="nav-item-wrapper">
        <a href={getSafeUrl('/')} className="nav-link" target="_blank">Visit Website</a>
      </li>
    )}
    {items.map((item, index) => (
      <NavItem
        key={index}
        item={item}
        noBack={noBack}
        parentKey={parentKey}
        openItems={openItems}
        setOpenItems={setOpenItems}
      />
    ))}
  </ul>
);

export const AdminHeader = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [navigation, setNavigation] = useState<NavConfig[]>([]);

  const [navOpen, setNavOpen] = useState<boolean>(() =>
    readLocalStorage('admin-nav-open', false)
  );

  const [openItems, setOpenItems] = useState<OpenItemsMap>(() =>
    readLocalStorage('admin-nav-open-items', {})
  );

  useEffect(() => {
    document.body.setAttribute('admin-nav-open', String(navOpen));
    writeLocalStorage('admin-nav-open', navOpen);
  }, [navOpen]);

  useEffect(() => {
    writeLocalStorage('admin-nav-open-items', openItems);
  }, [openItems]);

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
          <button className="menu-toggle" onClick={() => setNavOpen((current) => !current)}>
            <i className="fas fa-bars" />
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
        <aside className="user-nav">
          <nav className="dynamic-nav">
            <RenderNavItems
              items={navigation}
              openItems={openItems}
              setOpenItems={setOpenItems}
            />
          </nav>
        </aside>
      )}
    </>
  );
};