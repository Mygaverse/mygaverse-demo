import { Icon as IconifyIcon, IconProps as IconifyProps } from '@iconify/react';
import { cn } from '@/utils/scriptoplay/cn';

interface IconProps extends Omit<IconifyProps, 'icon'> {
  icon: string;
  className?: string;
  size?: number | string;
}

export default function Icon({ icon, className, size = 20, ...props }: IconProps) {
  return (
    <IconifyIcon
      icon={icon}
      width={size}
      height={size}
      className={cn("align-middle text-current", className)}
      {...props}
    />
  );
}
