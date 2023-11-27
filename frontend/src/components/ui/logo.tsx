import Image from '@/components/ui/image';
import AnchorLink from '@/components/ui/links/anchor-link';
import {useIsMounted} from '@/lib/hooks/use-is-mounted';
import {useIsDarkMode} from '@/lib/hooks/use-is-dark-mode';
import dynamic from 'next/dynamic'

export const LogoIcon = dynamic(() => import('@/assets/images/logo.svg'));

const Logo: React.FC<React.SVGAttributes<{}>> = (props) => {
  const isMounted = useIsMounted();
  const {isDarkMode} = useIsDarkMode();

  return (
    <AnchorLink
      href="/"
      className="flex w-12 outline-none"
      {...props}
    >
  <span className="relative flex overflow-hidden">
    {isMounted && (isDarkMode ? <LogoIcon width="48"/> : <LogoIcon width="48"/>)}
  </span>
    </AnchorLink>
  );
};

export default Logo;
