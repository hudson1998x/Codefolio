import { CodefolioProps, registerComponent } from "@components/registry";
import { FC, useState, useEffect, useRef } from "react";
import './style.scss'

interface Skill {
  id: number;
  skillName: string;
  skillCategory?: string;
  skillProficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
  lastUsed?: string;
}

const PROFICIENCY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

const fetchSkill = async (id: number): Promise<Skill | null> => {
  try {
    const res = await fetch(`/content/skills/${id}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const searchSkills = async (query: string, excludeIds: number[], limit = 8): Promise<Skill[]> => {
  const results: Skill[] = [];
  const q = query.toLowerCase();

  try {
    const res = await fetch('/content/skills/index.ndjson');
    if (!res.ok || !res.body) return [];

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const record = JSON.parse(trimmed);
          if (excludeIds.includes(record.id)) continue;
          const matches = ['skillName', 'skillCategory'].some(field => {
            const val = record[field];
            return val && String(val).toLowerCase().includes(q);
          });
          if (matches) {
            results.push(record);
            if (results.length >= limit) break outer;
          }
        } catch { /* malformed line */ }
      }
    }
  } catch (e) {
    console.error('Skill search failed:', e);
  }

  return results;
};

const ProficiencyPip = ({ level }: { level?: string }) => {
  const idx = PROFICIENCY_ORDER.indexOf(level ?? '');
  return (
    <div className="skill-tag__pips" aria-label={level}>
      {PROFICIENCY_ORDER.map((_, i) => (
        <span key={i} className={`pip ${i <= idx ? 'pip--filled' : ''}`} />
      ))}
    </div>
  );
};

const SkillTag = ({ skill, onRemove }: { skill: Skill; onRemove: () => void }) => (
  <div className="skill-tag">
    <div className="skill-tag__info">
      <span className="skill-tag__name">{skill.skillName}</span>
      {skill.skillCategory && (
        <span className="skill-tag__category">{skill.skillCategory}</span>
      )}
    </div>
    <ProficiencyPip level={skill.skillProficiency} />
    {skill.yearsOfExperience && (
      <span className="skill-tag__years">{skill.yearsOfExperience}y</span>
    )}
    <button type="button" onClick={onRemove} aria-label={`Remove ${skill.skillName}`}>
      <i className="fas fa-times" />
    </button>
  </div>
);

const SkillResult = ({ skill, onAdd }: { skill: Skill; onAdd: () => void }) => (
  <li className="skill-result" onClick={onAdd}>
    <div className="skill-result__info">
      <span className="skill-result__name">{skill.skillName}</span>
      {skill.skillCategory && (
        <span className="skill-result__category">{skill.skillCategory}</span>
      )}
    </div>
    <div className="skill-result__meta">
      {skill.skillProficiency && (
        <span className={`skill-result__level skill-result__level--${skill.skillProficiency}`}>
          {skill.skillProficiency}
        </span>
      )}
      {skill.yearsOfExperience && (
        <span className="skill-result__years">{skill.yearsOfExperience}y exp</span>
      )}
    </div>
  </li>
);

const SkillSearch: FC<CodefolioProps> = (props) => {
  const { data } = props;
  const { label, name, value } = data;

  const [selectedIds, setSelectedIds] = useState<number[]>(() => value ?? []);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial skills from IDs
  useEffect(() => {
    if (!selectedIds.length) return;
    Promise.all(selectedIds.map(fetchSkill)).then(results => {
      setSelectedSkills(results.filter(Boolean) as Skill[]);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search debounce
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }
    const handler = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchSkills(query, selectedIds);
      setSearchResults(results);
      setIsSearching(false);
      setIsOpen(true);
    }, 300);
    return () => clearTimeout(handler);
  }, [query, selectedIds]);

  const handleAdd = (skill: Skill) => {
    setSelectedIds(prev => [...prev, skill.id]);
    setSelectedSkills(prev => [...prev, skill]);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemove = (id: number) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
    setSelectedSkills(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="cf-field" ref={containerRef}>
      <label>{label ?? 'Skills'}</label>

      {/* Hidden inputs to submit IDs with the form */}
      {selectedIds.map((id, idx) => (
        <input key={id} type="hidden" name={`${name}[${idx}]`} value={id} />
      ))}

      <div className="skill-search">
        <div className="skill-search__tags">
          {selectedSkills.map(skill => (
            <SkillTag key={skill.id} skill={skill} onRemove={() => handleRemove(skill.id)} />
          ))}
          <div className="skill-search__input-wrap">
            <i className={`fas fa-${isSearching ? 'spinner fa-spin' : 'search'}`} />
            <input
              ref={inputRef}
              type="text"
              placeholder={selectedSkills.length ? 'Add another skill...' : 'Search skills...'}
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {isOpen && (
          <ul className="skill-search__dropdown">
            {searchResults.length > 0 ? (
              searchResults.map(skill => (
                <SkillResult key={skill.id} skill={skill} onAdd={() => handleAdd(skill)} />
              ))
            ) : (
              !isSearching && (
                <li className="skill-search__empty">No skills found for "{query}"</li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

registerComponent({
  name: 'SkillSearch',
  component: SkillSearch,
  defaults: {}
});