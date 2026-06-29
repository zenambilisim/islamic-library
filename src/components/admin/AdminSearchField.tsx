'use client';

import { Search } from 'lucide-react';
import { adminInputWithIcon } from './admin-classes';

type AdminSearchFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
};

const AdminSearchField = ({
  id,
  value,
  onChange,
  placeholder,
  label,
  className = 'max-w-md min-w-[200px] flex-1',
}: AdminSearchFieldProps) => (
  <div className={className}>
    <label htmlFor={id} className="sr-only">
      {label}
    </label>
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        size={18}
        aria-hidden
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={adminInputWithIcon}
      />
    </div>
  </div>
);

export default AdminSearchField;
