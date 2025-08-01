import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import logoCommerceKit from '@/app/(home)/assets/logo-commercekit.png';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <>
        <Image
          src={logoCommerceKit}
          alt="CommerceKit Logo"
          width={100}
          height={100}
          className="w-12 h-12"
        />
        <span className="text-xl font-bold text-zinc-900 -ml-2">Commerce Kit</span>
      </>
    ),
  },
  links: [
    {
      text: 'Quick Start',
      url: '/docs/quick-start',
      active: 'nested-url',
    },
    {
      text: 'API Reference',
      url: '/docs/api/headless-sdk',
      active: 'nested-url',
    },
  ],
};
