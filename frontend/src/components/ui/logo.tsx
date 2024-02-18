import Image from '@/components/ui/image';
import AnchorLink from '@/components/ui/links/anchor-link';
import {useIsMounted} from '@/lib/hooks/use-is-mounted';
import {useIsDarkMode} from '@/lib/hooks/use-is-dark-mode';
import dynamic from 'next/dynamic'
import React from "react";

export const LogoIcon = dynamic(() => import('@/assets/images/logo.svg'));

export default function Logo({size, ...props}: {size: string, props?: any}) {
  const isMounted = useIsMounted();
  const {isDarkMode} = useIsDarkMode();

  return (
    <div className={`${size == 'l' ? 'w-[62px]' : 'w-[52px]'} flex flex-row items-center justify-center`}>
      <div className={`${size == 'l' ? 'h-[62px]' : 'h-[52px]'} flex-1 relative`}>
        <div
          className="absolute top-[0px] left-[0px] rounded-[50%] box-border w-full h-full border-[1px] border-solid border-darkslategray-100"/>
          <AnchorLink
            href="/"
            className={`absolute top-[5px] left-[5px] ${size == 'l' ? 'w-[52px] h-[52px]' : 'w-[42px] h-[42px]'} overflow-hidden z-[1]`}
            {...props}
          >
            <span className="relative flex overflow-hidden">
              <LogoIcon width={size == 'l' ? 52 : 42}/>
            </span>
          </AnchorLink>
      </div>
    </div>
  );
}
