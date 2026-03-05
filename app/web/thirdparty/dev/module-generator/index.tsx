import { useState } from "react";
import './style.scss';
import { registerComponent } from "@components/registry";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType = 'string' | 'number' | 'boolean' | 'CanvasNode';

type ModuleField = {
    id: string;
    name: string;
    type: FieldType;
    searchable: boolean;
    required: boolean;
    default: string;
    editable: boolean;
    hasModule: boolean;
    moduleComponent: string;
    moduleData: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: FieldType[] = ['string', 'number', 'boolean', 'CanvasNode'];

const TYPE_COLORS: Record<FieldType, string> = {
    string    : '#3b82f6',
    number    : '#10b981',
    boolean   : '#f59e0b',
    CanvasNode: '#8b5cf6',
};

const defaultField = (): ModuleField => ({
    id             : crypto.randomUUID(),
    name           : '',
    type           : 'string',
    searchable     : false,
    required       : false,
    default        : '',
    editable       : true,
    hasModule      : false,
    moduleComponent: '',
    moduleData     : '{\n  "label": ""\n}',
});

// ── Component ─────────────────────────────────────────────────────────────────

export default function ModuleGeneratorPage() {
    const [moduleName, setModuleName]     = useState('');
    const [isThirdParty, setIsThirdParty] = useState(false);
    const [fields, setFields]             = useState<ModuleField[]>([defaultField()]);
    const [expandedId, setExpandedId]     = useState<string | null>(fields[0].id);
    const [payload, setPayload]           = useState<string | null>(null);
    const [nameError, setNameError]       = useState('');
    const [status, setStatus]             = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [resultPath, setResultPath]     = useState('');
    const [resultMsg, setResultMsg]       = useState('');

    // ── Field operations ──────────────────────────────────────────────────────

    const updateField = (id: string, patch: Partial<ModuleField>) =>
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));

    const addField = () => {
        const f = defaultField();
        setFields(prev => [...prev, f]);
        setExpandedId(f.id);
    };

    const removeField = (id: string) => {
        setFields(prev => {
            const next = prev.filter(f => f.id !== id);
            return next.length === 0 ? [defaultField()] : next;
        });
        if (expandedId === id) setExpandedId(null);
    };

    const moveField = (id: string, dir: 'up' | 'down') => {
        setFields(prev => {
            const idx  = prev.findIndex(f => f.id === id);
            if (idx < 0) return prev;
            const next = [...prev];
            const swap = dir === 'up' ? idx - 1 : idx + 1;
            if (swap < 0 || swap >= next.length) return prev;
            [next[idx], next[swap]] = [next[swap], next[idx]];
            return next;
        });
    };

    // ── Build fields ──────────────────────────────────────────────────────────

    const buildFields = () =>
        fields
            .filter(f => f.name.trim())
            .map(f => {
                const base: any = {
                    name      : f.name,
                    type      : f.type === 'string' ? '' : f.type === 'number' ? 0 : f.type === 'boolean' ? false : null,
                    searchable: f.searchable,
                    required  : f.required,
                    default   : f.default,
                    editable  : f.editable,
                };
                if (f.hasModule && f.moduleComponent.trim()) {
                    let data = {};
                    try { data = JSON.parse(f.moduleData); } catch {}
                    base.module = { component: f.moduleComponent, data, children: [] };
                }
                return base;
            });

    const validate = (): boolean => {
        if (!moduleName.trim()) {
            setNameError('Module name is required');
            return false;
        }
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(moduleName.trim())) {
            setNameError('Must be PascalCase (e.g. BlogPost)');
            return false;
        }
        setNameError('');
        return true;
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!validate()) return;

        const body = {
            name        : moduleName.trim(),
            fields      : buildFields(),
            isThirdParty,
        };

        setPayload(JSON.stringify(body, null, 2));

        try {
            setStatus('loading');

            const res = await fetch('/content/en-admin/dev/generator/create', {
                method : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body   : JSON.stringify(body),
            });

            const json = await res.json();

            if (!res.ok) throw new Error(json.message ?? `Server returned ${res.status}`);

            setStatus('success');
            setResultPath(json.path);
        } catch (err) {
            setStatus('error');
            setResultMsg(err instanceof Error ? err.message : String(err));
        }
    };

    const copyPayload = () => {
        if (payload) navigator.clipboard.writeText(payload);
    };

    const namedFields = fields.filter(f => f.name);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="mgp">

            {/* ── Header ── */}
            <div className="mgp__header">
                <div className="mgp__header-inner">
                    <div>
                        <div className="mgp__eyebrow">Module Generator</div>
                        <div className="mgp__title">New Module</div>
                    </div>
                    <button
                        className={`mgp__generate-btn mgp__generate-btn--${status}`}
                        onClick={handleSubmit}
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' && 'Generating...'}
                        {status === 'success' && '✓ Generated'}
                        {status === 'error'   && 'Try Again'}
                        {status === 'idle'    && 'Generate Module'}
                        <span className="mgp__generate-btn-arrow">→</span>
                    </button>
                </div>
            </div>

            {/* ── Status banner ── */}
            {status === 'success' && (
                <div className="mgp__banner mgp__banner--success">
                    Module created at <code>{resultPath}</code>
                </div>
            )}
            {status === 'error' && (
                <div className="mgp__banner mgp__banner--error">
                    {resultMsg}
                </div>
            )}

            {/* ── Body ── */}
            <div className="mgp__body">
                <div className="mgp__left">

                    {/* Module config */}
                    <div className="mgp__card">
                        <div className="mgp__card-label">Module Configuration</div>
                        <div className="mgp__config-row">

                            <div className="mgp__input-group">
                                <label className="mgp__label">
                                    Module Name <span className="mgp__required">*</span>
                                </label>
                                <input
                                    className={`mgp__input${nameError ? ' mgp__input--error' : ''}`}
                                    placeholder="e.g. BlogPost"
                                    value={moduleName}
                                    onChange={e => { setModuleName(e.target.value); setNameError(''); setStatus('idle'); }}
                                />
                                {nameError && <div className="mgp__error-msg">{nameError}</div>}
                                <div className="mgp__hint">
                                    PascalCase. Generates entity, service, controller, admincontroller, index.
                                </div>
                            </div>

                            <div className="mgp__input-group">
                                <label className="mgp__label">Target</label>
                                <div className="mgp__toggle-row">
                                    <button
                                        className={`mgp__toggle-btn${!isThirdParty ? ' mgp__toggle-btn--active' : ''}`}
                                        onClick={() => setIsThirdParty(false)}
                                    >
                                        user/
                                    </button>
                                    <button
                                        className={`mgp__toggle-btn${isThirdParty ? ' mgp__toggle-btn--active' : ''}`}
                                        onClick={() => setIsThirdParty(true)}
                                    >
                                        thirdparty/
                                    </button>
                                </div>
                                <div className="mgp__hint">
                                    Writes to <code>app/code/{isThirdParty ? 'thirdparty' : 'user'}/{moduleName || '<n>'}/</code>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Fields */}
                    <div className="mgp__card">
                        <div className="mgp__card-label-row">
                            <div className="mgp__card-label">
                                Fields <span className="mgp__field-count">{fields.length}</span>
                            </div>
                            <button className="mgp__add-btn" onClick={addField}>+ Add Field</button>
                        </div>

                        <div className="mgp__field-list">
                            {fields.map((field, idx) => (
                                <div key={field.id} className="mgp__field-item">

                                    {/* Field header */}
                                    <div
                                        className="mgp__field-header"
                                        onClick={() => setExpandedId(expandedId === field.id ? null : field.id)}
                                    >
                                        <div className="mgp__field-header-left">
                                            <div className={`mgp__type-pill mgp__type-pill--${field.type}`}>
                                                {field.type}
                                            </div>
                                            <span className="mgp__field-name">
                                                {field.name || <span className="mgp__unnamed">unnamed</span>}
                                            </span>
                                            {field.searchable && <span className="mgp__badge mgp__badge--blue">searchable</span>}
                                            {field.required   && <span className="mgp__badge mgp__badge--red">required</span>}
                                            {field.hasModule  && <span className="mgp__badge mgp__badge--purple">module</span>}
                                        </div>
                                        <div className="mgp__field-header-right">
                                            <button
                                                className="mgp__icon-btn"
                                                disabled={idx === 0}
                                                onClick={e => { e.stopPropagation(); moveField(field.id, 'up'); }}
                                            >↑</button>
                                            <button
                                                className="mgp__icon-btn"
                                                disabled={idx === fields.length - 1}
                                                onClick={e => { e.stopPropagation(); moveField(field.id, 'down'); }}
                                            >↓</button>
                                            <button
                                                className="mgp__icon-btn mgp__icon-btn--red"
                                                onClick={e => { e.stopPropagation(); removeField(field.id); }}
                                            >✕</button>
                                            <span className={`mgp__chevron${expandedId === field.id ? ' mgp__chevron--open' : ''}`}>▼</span>
                                        </div>
                                    </div>

                                    {/* Field editor */}
                                    {expandedId === field.id && (
                                        <div className="mgp__field-editor">
                                            <div className="mgp__field-editor-grid">
                                                <div className="mgp__input-group">
                                                    <label className="mgp__label">Field Name</label>
                                                    <input
                                                        className="mgp__input"
                                                        placeholder="e.g. pageTitle"
                                                        value={field.name}
                                                        onChange={e => updateField(field.id, { name: e.target.value })}
                                                    />
                                                </div>
                                                <div className="mgp__input-group">
                                                    <label className="mgp__label">Type</label>
                                                    <select
                                                        className="mgp__select"
                                                        value={field.type}
                                                        onChange={e => updateField(field.id, { type: e.target.value as FieldType })}
                                                    >
                                                        {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div className="mgp__input-group">
                                                    <label className="mgp__label">Default Value</label>
                                                    <input
                                                        className="mgp__input"
                                                        placeholder="e.g. Untitled"
                                                        value={field.default}
                                                        onChange={e => updateField(field.id, { default: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mgp__checkbox-row">
                                                {([
                                                    ['searchable', 'Searchable'],
                                                    ['required',   'Required'],
                                                    ['editable',   'Editable'],
                                                    ['hasModule',  'Has Module'],
                                                ] as [keyof ModuleField, string][]).map(([key, label]) => (
                                                    <label key={key} className="mgp__check-label">
                                                        <input
                                                            type="checkbox"
                                                            checked={field[key] as boolean}
                                                            onChange={e => updateField(field.id, { [key]: e.target.checked })}
                                                        />
                                                        {label}
                                                    </label>
                                                ))}
                                            </div>

                                            {field.hasModule && (
                                                <div className="mgp__module-section">
                                                    <div className="mgp__module-label">Module Definition</div>
                                                    <div className="mgp__input-group">
                                                        <label className="mgp__label">Component</label>
                                                        <input
                                                            className="mgp__input"
                                                            placeholder="e.g. Input, CanvasEditor"
                                                            value={field.moduleComponent}
                                                            onChange={e => updateField(field.id, { moduleComponent: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="mgp__input-group">
                                                        <label className="mgp__label">Data (JSON)</label>
                                                        <textarea
                                                            className="mgp__textarea"
                                                            rows={5}
                                                            value={field.moduleData}
                                                            onChange={e => updateField(field.id, { moduleData: e.target.value })}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right panel ── */}
                <div className="mgp__right">

                    {/* Payload */}
                    <div className="mgp__card mgp__card--dark">
                        <div className="mgp__payload-header">
                            <div className="mgp__card-label">Generated Payload</div>
                            {payload && (
                                <button className="mgp__copy-btn" onClick={copyPayload}>Copy</button>
                            )}
                        </div>
                        {payload ? (
                            <pre className="mgp__pre">{payload}</pre>
                        ) : (
                            <div className="mgp__payload-empty">
                                <div className="mgp__payload-empty-icon">{ }</div>
                                <div className="mgp__payload-empty-text">
                                    Fill in the module details and click Generate Module to see the output here.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Schema preview */}
                    <div className="mgp__card mgp__card--dark" style={{ marginTop: 16 }}>
                        <div className="mgp__card-label">Schema Preview</div>
                        <div className="mgp__schema-list">
                            {namedFields.length > 0 ? namedFields.map(f => (
                                <div key={f.id} className="mgp__schema-row">
                                    <div className="mgp__schema-left">
                                        <div
                                            className="mgp__schema-dot"
                                            style={{ background: TYPE_COLORS[f.type] }}
                                        />
                                        <span className="mgp__schema-name">{f.name}</span>
                                    </div>
                                    <div className="mgp__schema-right">
                                        <span className="mgp__schema-type" style={{ color: TYPE_COLORS[f.type] }}>
                                            {f.type}
                                        </span>
                                        {f.searchable && <span className="mgp__schema-badge mgp__schema-badge--s">S</span>}
                                        {f.required   && <span className="mgp__schema-badge mgp__schema-badge--r">R</span>}
                                        {f.hasModule  && <span className="mgp__schema-badge mgp__schema-badge--m">M</span>}
                                    </div>
                                </div>
                            )) : (
                                <div className="mgp__schema-empty">No named fields yet.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

registerComponent({
    component: ModuleGeneratorPage,
    name: 'DevModuleGenerator',
    defaults: {}
})