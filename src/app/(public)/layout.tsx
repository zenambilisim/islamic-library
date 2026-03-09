/**
 * (public) route grubu – sadece children geçirir.
 * Kök shell app/layout.tsx içinde.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
