/** Admin panel — public site ile uyumlu utility sınıfları */

export const adminLayout = 'admin-layout';

export const adminInput =
  'w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent';

export const adminInputWithIcon =
  'w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent';

export const adminSelect =
  'w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent';

export const adminSelectCompact =
  'rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-ink outline-none focus:border-accent';

export const adminTextarea =
  'w-full resize-y rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent min-h-[120px]';

export const adminLabel = 'mb-2 block text-[12.5px] font-medium text-ink-muted';

export const adminCard = 'rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] shadow-soft';

export const adminBtnPrimary =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-cream transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

export const adminBtnSecondary =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-ink transition-colors hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-50';

export const adminBtnDanger =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/70';

export const adminBtnIcon =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-[var(--surface-2)] hover:text-accent disabled:opacity-50';

export const adminBtnIconDanger =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/40';

export const adminLinkBack =
  'inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-accent';

export const adminLinkAccent =
  'font-medium text-accent transition-colors hover:text-accent-700 hover:underline';

export const adminTableWrap = `${adminCard} overflow-hidden`;

export const adminTheadRow = 'border-b border-[var(--border)] bg-[var(--surface-2)]';

export const adminTh =
  'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-muted';

export const adminTr = 'border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-2)]/50';

export const adminTd = 'px-4 py-2.5 text-sm text-ink-muted';

export const adminTdPrimary = 'px-4 py-2.5 text-sm text-ink';

export const adminPaginationBar =
  'flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] bg-[var(--surface-2)]/50 px-4 py-3 sm:flex-row';

export const adminEmptyState = 'py-16 text-center text-sm text-ink-muted';

export const adminLoadingState = 'flex items-center justify-center py-16 text-sm text-ink-muted';

export const adminAlertError =
  'mb-4 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300';

export const adminAlertSuccess =
  'mb-4 rounded-[var(--radius-md)] border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300';

export const adminDashCard =
  'group flex flex-col rounded-editorial border border-[var(--border)] bg-[var(--bg-elev)] p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card';

export const adminDashCardIcon =
  'flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-accent-fg';
