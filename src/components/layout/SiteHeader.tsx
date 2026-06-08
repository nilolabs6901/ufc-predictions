'use client';

/**
 * SITE HEADER — UFC.com editorial navbar (ported from Manus redesign)
 * Lifted into the root layout so every page shares the same chrome.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Search, Menu, X } from 'lucide-react';

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Events', href: '/', active: pathname === '/' },
    { label: 'Rankings', href: '#', placeholder: true },
    { label: 'Athletes', href: '#', placeholder: true },
    { label: 'News', href: '#', placeholder: true },
  ];

  const rightItems = [
    { label: 'Parlay Builder', href: '/parlay' },
    { label: 'Model Accuracy', href: '/accuracy' },
  ];

  const handlePlaceholder = () => {
    toast('Feature coming soon', { description: 'This section is under development.' });
  };

  return (
    <header style={{ backgroundColor: '#FFFFFF' }} className="sticky top-0 z-50 shadow-lg">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item.placeholder ? (
                <button
                  key={item.label}
                  onClick={handlePlaceholder}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#111111',
                    background: 'none',
                    border: 'none',
                    padding: '0',
                    cursor: 'pointer',
                    transition: 'color 100ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#D20A0A')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#111111')}
                >
                  {item.label}
                </button>
              ) : (
                <Link key={item.label} href={item.href}>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: item.active ? '#D20A0A' : '#111111',
                      position: 'relative',
                      paddingBottom: '4px',
                      borderBottom: item.active ? '3px solid #D20A0A' : '3px solid transparent',
                      transition: 'color 100ms',
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            )}
          </nav>

          {/* Logo center */}
          <Link href="/">
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: '#D20A0A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                  }}
                >
                  UFC
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#111111',
                }}
              >
                Predictions
              </span>
            </div>
          </Link>

          {/* Right nav */}
          <div className="hidden md:flex items-center gap-6">
            {rightItems.map((item) => (
              <Link key={item.label} href={item.href}>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#555555',
                    transition: 'color 100ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#D20A0A')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#555555')}
                >
                  {item.label}
                </span>
              </Link>
            ))}
            <button
              onClick={handlePlaceholder}
              style={{ background: 'none', border: 'none', color: '#111111', cursor: 'pointer' }}
              aria-label="Search"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', color: '#111111', cursor: 'pointer' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid #E5E5E5' }}>
          <div className="px-4 py-4 flex flex-col gap-4">
            {[...navItems, ...rightItems].map((item) => (
              <Link key={item.label} href={'href' in item ? item.href : '/'}>
                <span
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: '1rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#111111',
                    display: 'block',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
