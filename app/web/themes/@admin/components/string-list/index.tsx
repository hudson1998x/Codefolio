import { CodefolioProps, registerComponent } from "@components/registry";
import { FC, useState } from "react";
import './style.scss'

const StringList: FC<CodefolioProps> = (props) => {
  const { data } = props;
  const { label, value, name } = data;

  const [listItems, setListItems] = useState<string[]>(() => value ?? []);

  const handleChange = (idx: number, val: string) => {
    setListItems((prev) => prev.map((item, i) => (i === idx ? val : item)));
  };

  const handleAdd = () => {
    setListItems((prev) => [...prev, '']);
  };

  const handleRemove = (idx: number) => {
    setListItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleReorder = (idx: number, direction: 'up' | 'down') => {
    setListItems((prev) => {
      const next = [...prev];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  return (
    <div className="cf-field">
      <label>{label ?? 'Unlabelled'}</label>
      <ul className="cf-string-list">
        {listItems.map((item: string, idx: number) => (
          <li key={idx} className="cf-string-list__item">
            <input
              type="text"
              name={`${name}[${idx}]`}
              value={item}
              onChange={(e) => handleChange(idx, e.target.value)}
              placeholder="Enter value..."
            />
            <div className="cf-string-list__actions">
              <button
                type="button"
                onClick={() => handleReorder(idx, 'up')}
                disabled={idx === 0}
                aria-label="Move up"
              >
                &uarr;
              </button>
              <button
                type="button"
                onClick={() => handleReorder(idx, 'down')}
                disabled={idx === listItems.length - 1}
                aria-label="Move down"
              >
                &darr;
              </button>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label="Remove item"
                className="cf-string-list__remove"
              >
                X
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={handleAdd} className="cf-string-list__add">
        <i className="fas fa-plus" /> Add item
      </button>
    </div>
  );
};

registerComponent({
  name: 'StringList',
  component: StringList,
  defaults: {}
});