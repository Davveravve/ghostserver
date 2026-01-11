'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthContext } from '@/components/providers/AuthProvider'
import { SoundControl } from '@/components/ui/SoundControl'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/cases', label: 'Cases' },
  { href: '/inventory', label: 'Inventory' },
  { href: '/times', label: 'Records' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/giveaways', label: 'Giveaways' },
  { href: '/news', label: 'News' },
  { href: '/premium', label: 'Premium', highlight: true },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, isLoading, isAuthenticated, souls, login, logout } = useAuthContext()

  const displaySouls = souls !== null ? souls.toLocaleString() : '...'

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Ghost Servers"
              width={40}
              height={40}
              className="rounded-lg"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  link.highlight
                    ? 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {/* Sound Control */}
            <SoundControl />

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-ghost-card animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                {/* Souls display */}
                <div className="text-sm text-gray-400">
                  <span className="text-accent-primary font-semibold">{displaySouls}</span> Souls
                </div>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 bg-ghost-card border border-white/10 hover:border-accent-primary/50 px-2 py-1.5 rounded-md transition-all"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-md"
                    />
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-ghost-card border border-white/10 rounded-lg shadow-lg z-20 py-1">
                        <div className="px-4 py-2 border-b border-white/10">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-xs text-gray-500">Steam ID: {user.steamId}</div>
                        </div>
                        <Link
                          href="/inventory"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5"
                        >
                          My Inventory
                        </Link>
                        <a
                          href={user.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5"
                        >
                          Steam Profile
                        </a>
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            logout()
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5"
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm text-gray-400">
                  <span className="text-accent-primary font-semibold">0</span> Souls
                </div>
                <button
                  onClick={login}
                  className="flex items-center gap-2 bg-ghost-card border border-white/10 hover:border-accent-primary/50 px-4 py-2 rounded-md text-sm font-medium transition-all"
                >
                  <SteamIcon className="w-5 h-5" />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            {/* User info for mobile */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-ghost-card/50 rounded-lg mx-2">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-md"
                />
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{displaySouls} Souls</div>
                </div>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'block px-4 py-2 rounded-md text-base font-medium',
                  link.highlight
                    ? 'text-accent-primary'
                    : 'text-gray-300 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false)
                  login()
                }}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-ghost-card border border-white/10 px-4 py-2 rounded-md"
              >
                <SteamIcon className="w-5 h-5" />
                <span>Sign In with Steam</span>
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function SteamIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
    </svg>
  )
}
