import cn from 'classnames';
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentProps,
} from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

interface ScrollbarProps extends OverlayScrollbarsComponentProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function Scrollbar({
  options,
  style,
  className,
  ...props
}: React.PropsWithChildren<ScrollbarProps>) {
  return (
    <OverlayScrollbarsComponent
      options={{
        scrollbars: {
          autoHide: 'scroll',
        },
        ...options,
      }}
      className={cn('os-theme-thin', className)}
      style={style}
      {...props}
    />
  );
}
