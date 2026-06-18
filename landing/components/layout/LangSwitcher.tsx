'use client';
import { Globe } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALES = [
  { code: 'fr', label: 'FR' },
  { code: 'mg', label: 'MG' },
  { code: 'en', label: 'EN' },
] as const;

export function LangSwitcher({ current }: { current: string }) {
  const pathname = usePathname();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-2 text-sm hover:bg-muted">
        <Globe className="h-4 w-4" />
        {LOCALES.find((l) => l.code === current)?.label ?? 'FR'}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l.code} asChild>
            <Link href={pathname} locale={l.code}>
              {l.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
