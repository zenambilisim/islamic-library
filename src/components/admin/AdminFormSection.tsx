import type { ReactNode } from 'react';
import { adminCard, adminLabel } from './admin-classes';

type AdminFormSectionProps = {
  label: string;
  children: ReactNode;
  htmlFor?: string;
};

const AdminFormSection = ({ label, children, htmlFor }: AdminFormSectionProps) => (
  <div className={`${adminCard} space-y-3 p-4`}>
    <label htmlFor={htmlFor} className={`${adminLabel} mb-0 font-medium text-ink`}>
      {label}
    </label>
    {children}
  </div>
);

export default AdminFormSection;
