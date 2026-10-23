'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Phone/tablet navigation: a <details> dropdown that closes after navigating or clicking outside */
export function MobileMenu({ label, links, signIn }: { label: string; links: { href: string; label: string }[]; signIn: string }) {
  const ref = React.useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  React.useEffect(() => { ref.current?.removeAttribute('open'); }, [pathname]);
  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current?.open && !ref.current.contains(e.target as Node)) ref.current.removeAttribute('open');
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <details className="mk-menu" ref={ref}>
      <summary aria-label={label}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </summary>
      <nav className="mk-menu-panel" aria-label={label}>
        {links.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
        <hr />
        <Link href="/auth?tab=signin">{signIn}</Link>
      </nav>
    </details>
  );
}
