import type { ReactNode } from 'react';
import { adminLayout } from './admin-classes';

type AdminShellProps = {
  children: ReactNode;
  className?: string;
};

const AdminShell = ({ children, className = '' }: AdminShellProps) => (
  <div className={`${adminLayout} ${className}`.trim()}>{children}</div>
);

export default AdminShell;
