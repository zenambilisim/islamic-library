'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';
import { SITE_LOGO_PATH } from '@/lib/site-branding';

type SiteLogoProps = {
  size?: number;
  className?: string;
  imageClassName?: string;
};

const SiteLogo = ({ size = 38, className = '', imageClassName = '' }: SiteLogoProps) => {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`grid place-items-center rounded-[11px] bg-accent-soft text-accent ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        <BookOpen size={Math.round(size * 0.45)} strokeWidth={1.75} />
      </span>
    );
  }

  return (
    <img
      src={SITE_LOGO_PATH}
      alt={t('common.logoAlt', 'Islamic Library Logo')}
      width={size}
      height={size}
      className={`object-contain dark:brightness-110 dark:contrast-[1.05] ${imageClassName} ${className}`}
      onError={() => setFailed(true)}
    />
  );
};

export default SiteLogo;
