import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { searchComunas } from '../utils/comunaSearch';

interface ComunaComboboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 500,
  color: '#c9c4d8',
  fontSize: '13px',
};

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 12px',
  fontSize: '14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: '#f0f0f5',
  outline: 'none',
  colorScheme: 'dark',
};

// Combo box de comunas de Chile: sugiere mientras se escribe, pero el texto es
// libre (sirve también para filtrar por cualquier parte de la dirección).
export const ComunaCombobox = ({ label, value, onChange, placeholder }: ComunaComboboxProps) => {
  const uid = useId();
  const listId = `${uid}-list`;
  const optionId = (index: number) => `${uid}-option-${index}`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const activeRef = useRef<HTMLLIElement | null>(null);

  // Último texto escrito por el usuario. Si `value` ya no coincide con él, el valor
  // cambió por otra vía (se eligió una comuna o "Cerca de mí") y se ofrecen todas
  // las comunas para poder cambiarla; mientras el usuario escribe, se filtra.
  const [typed, setTyped] = useState<string | null>(null);
  const options = useMemo(
    () => searchComunas(typed === value ? value : ''),
    [typed, value]
  );

  useEffect(() => {
    activeRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex]);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open) setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (open && activeIndex >= 0 && options[activeIndex]) {
          e.preventDefault();
          select(options[activeIndex].name);
        }
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
          setActiveIndex(-1);
        }
        break;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <label htmlFor={`${uid}-input`} style={labelStyle}>{label}</label>
      <input
        id={`${uid}-input`}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setTyped(e.target.value);
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        style={inputStyle}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1100,
            margin: '4px 0 0',
            padding: '4px',
            listStyle: 'none',
            maxHeight: '240px',
            overflowY: 'auto',
            backgroundColor: '#14121f',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
        >
          {options.length === 0 ? (
            <li role="presentation" style={{ padding: '8px 10px', fontSize: '13px', color: '#9b95ad' }}>
              Sin comunas coincidentes: se buscará "{value}" en la ubicación del evento.
            </li>
          ) : (
            options.map((comuna, index) => {
              const isActive = index === activeIndex;
              return (
                <li
                  key={comuna.name}
                  id={optionId(index)}
                  ref={isActive ? activeRef : undefined}
                  role="option"
                  aria-selected={isActive}
                  // mousedown (y no click) para seleccionar antes de que el input pierda el foco
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(comuna.name);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: '#e6e6f0',
                    fontSize: '14px',
                    backgroundColor: isActive ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                  }}
                >
                  {comuna.name}
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#7c7790' }}>
                    {comuna.region}
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
};
