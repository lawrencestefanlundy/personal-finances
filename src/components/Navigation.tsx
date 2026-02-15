'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sectionLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#cash-flow', label: 'Cash Flow' },
  { href: '#assets', label: 'Assets' },
];

export default function Navigation() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link href="/" className="text-xl font-bold text-white mr-8">
            Finance Dashboard
          </Link>
          <nav className="flex space-x-1">
            {isHome ? (
              <>
                {sectionLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
                <Link
                  href="/settings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Settings
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="px-3 py-2 rounded-md text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/settings'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Settings
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
