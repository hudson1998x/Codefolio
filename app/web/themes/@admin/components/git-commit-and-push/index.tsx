import React, { useState, useEffect, useRef } from 'react';
import './style.scss';

export const GitCommitAndPush = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [prefix, setPrefix] = useState('feat');
    const [isDeploying, setIsDeploying] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [status, setStatus] = useState<{ changeCount: number, branch: string } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchStatus = async () => {
        try {
            const res = await fetch('/content/en-admin/vcs/status.json');
            if (!res.ok) throw new Error('API Sync Failed');
            const data = await res.json();
            setStatus(data.status);
        } catch (e) {
            console.error("VCS Sync Error:", e);
        }
    };

    useEffect(() => {
        fetchStatus();
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setLastError(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeploy = async () => {
        if (!message.trim()) {
            setLastError("Commit message is required");
            return;
        }

        setIsDeploying(true);
        setLastError(null);
        
        try {
            const response = await fetch('/api/git/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `${prefix}: ${message.trim()}` }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage('');
                setIsOpen(false);
                location.reload(); // we do a reload, so the sibling vcs component also updates.
            } else {
                throw new Error(result.error || "Deploy failed");
            }
        } catch (error: any) {
            setLastError(error.message || "Network error occurred");
        } finally {
            setIsDeploying(false);
        }
    };

    const hasChanges = (status?.changeCount ?? 0) > 0;

    return (
        <div className="git-deploy-container" ref={dropdownRef}>
            {/* Action Trigger */}
            <button 
                className={`main-deploy-trigger ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                disabled={isDeploying || (!hasChanges && !isOpen)}
            >
                <i className={isDeploying ? "fas fa-circle-notch fa-spin" : "fas fa-rocket"}></i>
                {isDeploying ? 'Deploying...' : 'Deploy'}
            </button>

            {/* Commit Dropdown */}
            {isOpen && (
                <div className={`deploy-dropdown ${lastError ? 'has-error' : ''}`}>
                    <div className="dropdown-header">
                        <span>{status?.branch || 'master'}</span>
                        <span>{status?.changeCount} CHANGES</span>
                    </div>

                    {lastError && (
                        <div className="error-banner">
                            <i className="fas fa-exclamation-triangle"></i>
                            {lastError}
                        </div>
                    )}
                    
                    <div className="form-row">
                        <select 
                            className="prefix-select"
                            value={prefix}
                            onChange={(e) => setPrefix(e.target.value)}
                        >
                            <option value="feat">feat</option>
                            <option value="fix">fix</option>
                            <option value="refactor">ref</option>
                            <option value="chore">chore</option>
                            <option value="docs">docs</option>
                        </select>
                        
                        <input 
                            className="message-input"
                            autoFocus
                            placeholder="What's new?"
                            value={message}
                            onChange={(e) => {
                                setMessage(e.target.value);
                                if (lastError) setLastError(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
                        />
                    </div>

                    <button 
                        className="confirm-deploy-btn"
                        onClick={handleDeploy}
                        disabled={!message.trim() || isDeploying}
                    >
                        {isDeploying ? 'Running Git...' : 'Confirm & Push'}
                    </button>
                </div>
            )}
        </div>
    );
};