import { cn } from '@/utils/scriptoplay/cn';
import Link from 'next/link';
import { AnchorHTMLAttributes } from 'react';
import { buttonVariants } from './Button'; // Import shared styles

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  href: string;
  className?: string;
  insideSpan?: boolean;
  variant?: "primary" | "secondary";
}

const LinkButton = ({ children, href, variant, className, insideSpan = true, ...props }: LinkButtonProps) => {
  return (
    <Link 
      href={href} 
      className={buttonVariants(variant, className)} {...props}>
      {insideSpan ? <span>{children}</span> : children}
    </Link>
  );
};

LinkButton.displayName = 'LinkButton';
export default LinkButton;
