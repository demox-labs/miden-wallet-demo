import React, { useState } from 'react';
import cn from 'classnames';
import { useWindowScroll } from '@/lib/hooks/use-window-scroll';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useDrawer } from '@/components/drawer-views/context';
import Sidebar from '@/layouts/dashboard/_sidebar';
import { WalletMultiButton } from '@demox-labs/miden-wallet-adapter-reactui';
import Logo from '@/components/ui/logo';

import '@demox-labs/miden-wallet-adapter-reactui/styles.css';

function HeaderRightArea() {
  return (
    <div className="relative order-last flex shrink-0 items-center gap-3 sm:gap-6 lg:gap-8">
      <WalletMultiButton />
    </div>
  );
}

export function Header() {
  const { openDrawer } = useDrawer();
  const isMounted = useIsMounted();
  let windowScroll = useWindowScroll();
  let [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 z-30 h-[80px] w-full border-b border-gray-200 bg-white transition-all duration-300 ltr:right-0 rtl:left-0 dark:border-gray-800 dark:bg-dark`}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 3xl:px-12">
        <div className="flex items-center">
          <Logo />
          {/* <div className="block ltr:mr-1 rtl:ml-1 ltr:sm:mr-3 rtl:sm:ml-3 xl:hidden">
            <Hamburger
              isOpen={isOpen}
              onClick={() => openDrawer('DASHBOARD_SIDEBAR')}
              variant="transparent"
              className="dark:text-white"
            />
          </div> */}
        </div>

        <HeaderRightArea />
      </div>
    </nav>
  );
}

interface DashboardLayoutProps {
  contentClassName?: string;
}

export default function Layout({
  children,
  contentClassName,
}: React.PropsWithChildren<DashboardLayoutProps>) {
  return (
    <div className="ltr:xl:pl-72 rtl:xl:pr-72 ltr:2xl:pl-80 rtl:2xl:pr-80">
      <Header />
      <Sidebar />
      <main
        className={cn(
          'min-h-[100vh] px-4 pt-[80px] pb-16 sm:px-6 sm:pb-20 lg:px-8 xl:px-10 xl:pb-24 3xl:px-12',
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}
