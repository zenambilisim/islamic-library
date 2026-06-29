import type { ReactNode } from 'react';

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

const AdminPageHeader = ({ title, description, children }: AdminPageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-display text-2xl font-medium tracking-tight text-ink md:text-[1.75rem]">
        {title}
      </h1>
      {description ? <p className="mt-1 text-[13px] text-ink-muted">{description}</p> : null}
    </div>
    {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
  </div>
);

export default AdminPageHeader;
