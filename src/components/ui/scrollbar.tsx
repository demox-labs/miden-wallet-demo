import cn from 'classnames';
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentProps,
} from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';

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
          theme: 'os-theme-thin',
          autoHide: 'scroll',
        },
        ...options,
      }}
      style={style}
      className={cn(className)}
      {...props}
    />
  );
}
