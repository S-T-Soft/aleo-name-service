import Logo from '@/components/ui/logo';
import Button from '@/components/ui/button';
import ActiveLink from '@/components/ui/links/active-link';
import Scrollbar from '@/components/ui/scrollbar';
import { Close } from '@/components/icons/close';
import { useDrawer } from '@/components/drawer-views/context';
import routes from "@/config/routes";
import {BuildWithAleoDarkSVG, GridSVG} from "@/assets/icons";
import {Sun} from "@/components/icons/sun";
import {OptionIcon} from "@/components/icons/option";
import {MenuItem} from "@/components/ui/collapsible-menu";
import {DynamicSocialIcon} from "@/assets/social/DynamicSocialIcon";

const MenuLinks = [
  {
    name: 'My Names',
    icon: <GridSVG />,
    target: "_self",
    href: routes.account,
  },
  {
    name: 'Toolbox',
    icon: <OptionIcon />,
    target: "_self",
    href: routes.toolbox,
  },
  {
    name: 'Docs',
    icon: <Sun />,
    target: "_blank",
    href: routes.docs,
  }
]

const socialLinks = [
  {
    icon: "com.twitter",
    link: "https://x.com/aleonames"
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

export function MenuItems() {
  return (
    <div className="flex items-center mr-6">
      {MenuLinks.map((item, index) => (
        <ActiveLink
          key={index}
          href={item.href}
          target={item.target}
          className="mx-4 text-sm font-medium text-gray-600 transition first:ml-0 last:mr-0 hover:text-aquamarine dark:text-gray-300 dark:hover:text-aquamarine"
          activeClassName="!text-aquamarine"
          activeMethod={"startsWith"}
        >
          <span className="z-[1] flex items-center">
              <span className="mr-3">{item.icon}</span>
            {item.name}
          </span>
        </ActiveLink>
      ))}
    </div>
  );
}

export default function DrawerMenu() {
  const {closeDrawer} = useDrawer();
  return (
    <div className="relative w-full max-w-full bg-white dark:bg-dark xs:w-80">
      <div className="flex h-24 items-center justify-between overflow-hidden px-6 py-4">
        <Logo size="l"/>
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
            {MenuLinks.map((item, index) => (
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
    </div>
  );
}
