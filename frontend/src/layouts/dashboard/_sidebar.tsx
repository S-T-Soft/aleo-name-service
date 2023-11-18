import cn from 'classnames';
import Logo from '@/components/ui/logo';
import { MenuItem } from '@/components/ui/collapsible-menu';
import Scrollbar from '@/components/ui/scrollbar';
import Button from '@/components/ui/button';
import routes from '@/config/routes';
import { useDrawer } from '@/components/drawer-views/context';
import { HomeIcon } from '@/components/icons/home';
import { Close } from '@/components/icons/close';
import { Sun } from '@/components/icons/sun';
import {OptionIcon} from "@/components/icons/option";
import {GridSVG} from "@/assets/icons";
import {DynamicSocialIcon} from "@/assets/social/DynamicSocialIcon";
import {BuildWithAleoDarkSVG} from "@/assets/icons";

const menuItems = [
  {
    name: 'Getting Started',
    icon: <HomeIcon />,
    href: routes.gettingStarted,
  },
  {
    name: 'My Names',
    icon: <GridSVG />,
    href: routes.account,
  },
  {
    name: 'Docs',
    icon: <Sun />,
    href: routes.docs,
  },
  {
    name: 'Toolbox',
    icon: <OptionIcon />,
    href: routes.toolbox,
  }
];

const socialLinks = [
  {
    icon: "com.twitter",
    link: "https://twitter.com/aleonames"
  },
  {
    icon: "com.discord",
    link: "https://discord.gg/uvWJehUmyK"
  },
  {
    icon: "com.youtube",
    link: "https://www.youtube.com/@aleonames"
  }
];

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { closeDrawer } = useDrawer();
  return (
    <aside
      className={cn(
        'top-0 z-40 h-full w-full max-w-full border-dashed border-gray-200 bg-body ltr:left-0 ltr:border-r rtl:right-0 rtl:border-l dark:border-gray-700 dark:bg-dark xs:w-80 xl:fixed  xl:w-72 2xl:w-80',
        className
      )}
    >
      <div className="relative flex flex-col items-center justify-between px-6 py-4 2xl:px-8">
        <Logo />
        <div className="md:hidden">
          <Button
            title="Close"
            color="white"
            shape="circle"
            variant="transparent"
            size="small"
            onClick={closeDrawer}
          >
            <Close className="h-auto w-2.5" />
          </Button>
        </div>
      </div>

      <Scrollbar style={{ height: 'calc(100% - 96px)' }}>
        <div className="px-6 pb-5 2xl:px-8 flex flex-col h-full">
          <div className="mt-2">
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                name={item.name}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>

          <div className="flex-grow"></div>

          <div className="social-links flex flex-row justify-between items-center mb-4 w-full">
            {socialLinks.map((item, index) => (
              <a href={item.link} target="_blank" rel="noopener noreferrer" key={index} className="px-2">
                <DynamicSocialIcon name={item.icon} fill="rgb(107 114 128 / var(--tw-text-opacity))" className="h-8"/>
              </a>
            ))}
            <a href="https://aleo.org" target="_blank" rel="noopener noreferrer">
                <BuildWithAleoDarkSVG fill="rgb(107 114 128 / var(--tw-text-opacity))" className="h-8"/>
              </a>
          </div>
        </div>
      </Scrollbar>
    </aside>
  );
}
