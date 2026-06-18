import Image from 'next/image';
import { cn } from '@/lib/cn';

export function DeviceMockup({
  variant, src, alt, className,
}: {
  variant: 'browser' | 'phone';
  src: string;
  alt: string;
  className?: string;
}) {
  if (variant === 'phone') {
    return (
      <div className={cn('overflow-hidden rounded-[2.5rem] border-8 border-foreground/90 bg-foreground/90 shadow-2xl', className)}>
        <Image src={src} alt={alt} width={390} height={844} unoptimized className="h-auto w-full" />
      </div>
    );
  }
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card shadow-2xl', className)}>
      <div className="flex h-8 items-center gap-1.5 border-b border-border bg-muted px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-tertiary" />
        <span className="h-2.5 w-2.5 rounded-full bg-secondary" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
      </div>
      <Image src={src} alt={alt} width={1200} height={750} unoptimized className="h-auto w-full" />
    </div>
  );
}
