import Image from '@/components/ui/image';
import AnchorLink from '@/components/ui/links/anchor-link';
import { useIsMounted } from '@/lib/hooks/use-is-mounted';
import { useIsDarkMode } from '@/lib/hooks/use-is-dark-mode';
import logo from '@/assets/images/icon-128.png';
import {SearchIcon} from "@/components/icons/search";

const Logo: React.FC<React.SVGAttributes<{}>> = (props) => {
  const isMounted = useIsMounted();
  const { isDarkMode } = useIsDarkMode();

  return (
    <AnchorLink
      href="/"
      className="flex w-28 outline-none sm:w-32 4xl:w-36"
      {...props}
    >
      <span className="relative flex overflow-hidden">
        {isMounted && isDarkMode && (
          <Image src={logo} alt="ANS" priority />
        )}
        {isMounted && !isDarkMode && (
          <Image src={logo} alt="ANS" priority />
        )}
        <span className="h-full w-15 cursor-pointer items-center text-gray-900 ml-2 dark:text-white font-bold align-bottom">
          Names
        </span>
      </span>
    </AnchorLink>
  );
};

export default Logo;
