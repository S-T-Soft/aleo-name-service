import { useWindowScroll } from '@/lib/hooks/use-window-scroll';
import Logo from '@/components/ui/logo';
import SearchButton from '@/components/search/button';
import { useBreakpoint } from '@/lib/hooks/use-breakpoint';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useDrawer } from '@/components/drawer-views/context';
import Hamburger from '@/components/ui/hamburger';
import { MenuItems } from '@/layouts/_layout-menu';
import React, {useEffect} from 'react';
import {WalletMultiButton} from "@/components/WalletMultiButton";
import {useWallet} from "@demox-labs/aleo-wallet-adapter-react";
import toast from "@/components/ui/toast";


require('@demox-labs/aleo-wallet-adapter-reactui/dist/styles.css');

function HeaderRightArea() {
  const isMounted = useIsMounted();
  const breakpoint = useBreakpoint();
  const { openDrawer, isOpen } = useDrawer();
  const { wallet } = useWallet();

  useEffect(() => {
    if (wallet) {
      wallet.adapter.off('connect').on('connect', (address) => {
        (typeof gtag === 'function') && gtag('event', 'wallet_connected', {
            'event_category': 'User Interaction',
            'event_label': wallet.adapter.name,
            'value': 1
        });
        console.log('Connect wallet('+wallet.adapter.name+'): ', address);
      });
      wallet.adapter.off('error').on('error', (error) => {
        toast({type: 'error', message: 'Wallet error: ' + error.message});
      })
    }
  }, [wallet]);

  return (
    <div className="order-last flex shrink-0 items-center">
      {isMounted && (
        <div>
          <SearchButton variant="transparent" className="dark:text-aquamarine mr-6" />
        </div>
      )}
      {isMounted && ['xs', 'sm', 'md'].indexOf(breakpoint) == -1 && (
          <MenuItems />
        )}
      <WalletMultiButton/>

      <div className="lg:hidden">
        <Hamburger
          isOpen={isOpen}
          onClick={() => openDrawer('DRAWER_MENU')}
          variant="transparent"
          className="ml-3 shadow-main dark:border dark:border-solid dark:border-gray-700 dark:bg-light-dark dark:text-white hover:text-aquamarine"
        />
      </div>
    </div>
  );
}

export function Header() {
  const windowScroll = useWindowScroll();
  const breakpoint = useBreakpoint();
  const isMounted = useIsMounted();

  return (
    <nav
      className={`top-0 z-30 flex w-full items-center justify-between px-4 transition-all duration-300 ltr:right-0 rtl:left-0 sm:px-6 lg:px-8 xl:px-10 3xl:px-12 ${
        isMounted && windowScroll.y > 10
          ? 'fixed h-20 from-white to-white/80 shadow-card backdrop-blur dark:from-dark dark:to-dark/80'
          : 'h-24'
      }`}
    >
      <div className="flex items-center">
        <Logo size='l'/>
      </div>

      <HeaderRightArea />
    </nav>
  );
}

interface LayoutProps {}

export default function Layout({
  children,
}: React.PropsWithChildren<LayoutProps>) {
  const isMounted = useIsMounted();
  let windowScroll = useWindowScroll();

  return (
    <div className="[background:linear-gradient(180deg,_#1d1a18,_#100e0d_7%,_#100e0d_20.5%,_#080707_50%,_#201b18_79.15%)] flex min-h-screen flex-col">
      <Header />
      <main className={`mt-0 sm:mt-6 mb-12 flex flex-grow flex-col w-[1000px] max-w-full mx-auto px-8 ${isMounted && windowScroll.y > 10 ? 'pt-16' : ''}`}>
        {children}
      </main>
    </div>
  );
}
