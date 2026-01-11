'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface NewsItem {
  id: string
  title: string
  content: string
  excerpt: string | null
  category: string
  isPinned: boolean
  createdAt: string
}

const categoryStyles: Record<string, { bg: string; text: string; label: string }> = {
  announcement: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Announcement' },
  update: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Update' },
  event: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Event' },
  maintenance: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Maintenance' },
}

const ITEMS_PER_PAGE = 10

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    try {
      const res = await fetch('/api/news')
      if (res.ok) {
        const data = await res.json()
        setNews(data.news)
      }
    } catch (error) {
      console.error('Failed to load news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function getCategoryStyle(category: string) {
    return categoryStyles[category] || categoryStyles.announcement
  }

  const displayedNews = news.slice(0, displayCount)
  const hasMore = news.length > displayCount

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ghost-bg pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center text-gray-500">Loading news...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ghost-bg pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            News & Updates
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Stay up to date with the latest announcements, updates, and events
            from Ghost Servers.
          </p>
        </motion.div>

        {/* News List - Stacked */}
        {news.length > 0 ? (
          <div className="space-y-4">
            {displayedNews.map((item, index) => {
              const style = getCategoryStyle(item.category)
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="cursor-pointer hover:border-accent-primary/40 transition-all hover:bg-white/[0.02]"
                    onClick={() => setSelectedNews(item)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Date column */}
                        <div className="hidden sm:block text-center min-w-[60px]">
                          <div className="text-2xl font-bold text-accent-primary">
                            {new Date(item.createdAt).getDate()}
                          </div>
                          <div className="text-xs text-gray-500 uppercase">
                            {new Date(item.createdAt).toLocaleDateString('sv-SE', { month: 'short' })}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {item.isPinned && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-accent-primary/20 text-accent-primary">
                                Pinned
                              </span>
                            )}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${style.bg} ${style.text}`}>
                              {style.label}
                            </span>
                            <span className="text-xs text-gray-500 sm:hidden">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-heading text-lg font-bold mb-1 truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {item.excerpt || item.content.slice(0, 150)}
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-500 self-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}

            {/* Load More Button */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center pt-6"
              >
                <Button
                  variant="secondary"
                  onClick={() => setDisplayCount(prev => prev + ITEMS_PER_PAGE)}
                >
                  Load More ({news.length - displayCount} remaining)
                </Button>
              </motion.div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-12 text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-600 mb-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <h2 className="font-heading text-2xl font-bold mb-2">No News Yet</h2>
                <p className="text-gray-400">
                  Check back later for the latest updates and announcements.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Modal for full article */}
        {selectedNews && (
          <>
            <div
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setSelectedNews(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-4 md:inset-10 lg:inset-20 bg-ghost-card border border-white/10 rounded-xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedNews.isPinned && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-accent-primary/20 text-accent-primary">
                        Pinned
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        getCategoryStyle(selectedNews.category).bg
                      } ${getCategoryStyle(selectedNews.category).text}`}
                    >
                      {getCategoryStyle(selectedNews.category).label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(selectedNews.createdAt)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedNews(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <h2 className="font-heading text-2xl font-bold mt-4">
                  {selectedNews.title}
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-invert prose-sm max-w-none">
                  {selectedNews.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-300 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  )
}
