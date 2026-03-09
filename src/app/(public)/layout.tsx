import PublicClientShell from './PublicClientShell';

/**
 * (public) route grubu – Header, Footer ve provider'lar burada.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicClientShell>{children}</PublicClientShell>;
}
