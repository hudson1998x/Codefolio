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

export const AdminHeader = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [navigation, setNavigation] = useState<NavConfig[]>([]);

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

  const RenderNavItems = ({ items, noBack }: { items: NavConfig[], noBack?: boolean }) => (
    <ul className="nav-list">
      {!noBack ? <li className='nav-item-wrapper'><a href={getSafeUrl('/')} className="nav-link">&larr; Back</a></li> : null}
      {items.map((item, index) => (
        <li key={index} className="nav-item-wrapper">
          <a href={item.href || '#'} className="nav-link">
            {item.label}
            {item.children?.length ? <span className="chevron">▾</span> : null}
          </a>
          {item.children?.length ? (
            <div className="nav-dropdown"><RenderNavItems items={item.children} noBack={true}/></div>
          ) : null}
        </li>
      ))}
    </ul>
  );

  return (
    <header className="platform-header">
      <div className="header-left">
        <div className="workspace-switcher">
          <div className="logo-box">CF</div>
          <div className="label-group">
            <span className="title">CodeFolio</span>
            <span className="status">Dev Mode</span>
          </div>
        </div>
        <nav className="dynamic-nav">
          {navigation.length > 0 ? <RenderNavItems items={navigation} /> : <div className="nav-skeleton" />}
        </nav>
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
  );
};