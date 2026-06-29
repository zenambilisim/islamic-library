'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { BookOpen, FolderTree, Globe, Users } from 'lucide-react';
import AdminShell from '@/components/admin/AdminShell';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { adminDashCard, adminDashCardIcon } from '@/components/admin/admin-classes';

const DashboardPage = () => {
  const { t } = useTranslation();

  const cards = [
    {
      href: '/admin/traffic',
      icon: Globe,
      title: t('admin.dashboard.trafficCard'),
      desc: t('admin.dashboard.trafficDesc'),
      cta: t('admin.dashboard.goToTraffic'),
    },
    {
      href: '/admin/books',
      icon: BookOpen,
      title: t('admin.dashboard.myBooksCard'),
      desc: t('admin.dashboard.myBooksDesc'),
      cta: t('admin.dashboard.goToBooks'),
    },
    {
      href: '/admin/authors',
      icon: Users,
      title: t('admin.nav.authors'),
      desc: t('admin.dashboard.authorsDesc'),
      cta: t('admin.dashboard.goToAuthors'),
    },
    {
      href: '/admin/categories',
      icon: FolderTree,
      title: t('admin.nav.categories'),
      desc: t('admin.dashboard.categoriesDesc'),
      cta: t('admin.dashboard.goToCategories'),
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        title={t('admin.dashboard.title')}
        description={`${t('admin.dashboard.welcome')}. ${t('admin.dashboard.welcomeDesc')}`}
      />

      <div className="grid gap-[18px] sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, title, desc, cta }) => (
          <Link key={href} href={href} className={adminDashCard}>
            <div className="mb-3 flex items-center gap-3">
              <span className={adminDashCardIcon}>
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <h2 className="font-display text-lg font-medium tracking-tight text-ink">{title}</h2>
            </div>
            <p className="flex-1 text-[13px] leading-relaxed text-ink-muted">{desc}</p>
            <span className="mt-4 text-[12.5px] font-medium text-accent group-hover:underline">
              {cta} →
            </span>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
};

export default DashboardPage;
