import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Single source of truth for page content width + horizontal padding.
 * Change `CONTAINER_WIDTH` here to retune every section across the site.
 */
export const CONTAINER_WIDTH = 'max-w-6xl';

type ContainerProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export const Container = ({ as: Tag = 'div', className, children, ...rest }: ContainerProps) => (
  <Tag className={cn(CONTAINER_WIDTH, 'mx-auto px-4 sm:px-6 lg:px-8', className)} {...rest}>
    {children}
  </Tag>
);
