import type { LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import cn from 'classnames';
import AnchorLink from '@/components/ui/links/anchor-link';

interface ActiveLinkProps extends LinkProps {
  activeClassName?: string;
  activeMethod?: 'equals' | 'startsWith';
}
const ActiveLink: React.FC<
  ActiveLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
> = ({ href, className, activeClassName = 'active', activeMethod = 'equals', ...props }) => {
  const { pathname } = useRouter();
  return (
    <AnchorLink
      href={href}
      className={cn(className, {
        [activeClassName]: activeMethod == 'equals' ? pathname === href : pathname.startsWith(href.toString()),
      })}
      {...props}
    />
  );
};

export default ActiveLink;
