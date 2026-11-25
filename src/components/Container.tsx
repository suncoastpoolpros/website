import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Page content container for the dark-theme pages (St. Pete Beach and the
 * other older city pages, the pool-care guides, the tools). The tablet and
 * desktop gutter and the 1136px content width come from `.page-container`
 * in src/index.css, shared with every other page; the padding classes here
 * are the phone gutter only (below 768px).
 *
 * A narrower container keeps its Tailwind max-w class (e.g. `max-w-3xl`):
 * `.page-container` maps it to that column's desktop content width.
 */
type ContainerProps = {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>;

export const Container = ({ as: Tag = 'div', className, children, ...rest }: ContainerProps) => (
  <Tag className={cn('page-container mx-auto px-4 sm:px-6', className)} {...rest}>
    {children}
  </Tag>
);
