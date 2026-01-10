'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface NewsItem {
  id: string
  title: string
  content: string
  excerpt: string | null
  category: string
  isPinned: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

const categories = [
  { value: 'announcement', label: 'Announcement', color: 'blue' },
  { value: 'update', label: 'Update', color: 'green' },
  { value: 'event', label: 'Event', color: 'purple' },
  { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
]

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('announcement')
  const [isPinned, setIsPinned] = useState(false)
  const [isPublished, setIsPublished] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  async function loadNews() {
    try {
      const res = await fetch('/api/admin/news')
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

  function resetForm() {
    setTitle('')
    setContent('')
    setExcerpt('')
    setCategory('announcement')
    setIsPinned(false)
    setIsPublished(true)
    setEditingId(null)
  }

  function startEdit(item: NewsItem) {
    setTitle(item.title)
    setContent(item.content)
    setExcerpt(item.excerpt || '')
    setCategory(item.category)
    setIsPinned(item.isPinned)
    setIsPublished(item.isPublished)
    setEditingId(item.id)
    setShowCreate(true)
  }

  async function saveNews() {
    if (!title || !content) {
      alert('Title and content are required')
      return
    }

    try {
      const url = editingId ? `/api/admin/news/${editingId}` : '/api/admin/news'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || null,
          category,
          isPinned,
          isPublished,
        }),
      })

      if (res.ok) {
        resetForm()
        setShowCreate(false)
        loadNews()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save news')
      }
    } catch (error) {
      console.error('Failed to save news:', error)
      alert('Failed to save news')
    }
  }

  async function deleteNews(id: string) {
    if (!confirm('Delete this news item?')) return

    try {
      const res = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadNews()
      } else {
        alert('Failed to delete news')
      }
    } catch (error) {
      console.error('Failed to delete news:', error)
      alert('Failed to delete news')
    }
  }

  async function togglePublish(item: NewsItem) {
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          isPublished: !item.isPublished,
        }),
      })

      if (res.ok) {
        loadNews()
      }
    } catch (error) {
      console.error('Failed to toggle publish:', error)
    }
  }

  async function togglePin(item: NewsItem) {
    try {
      const res = await fetch(`/api/admin/news/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          isPinned: !item.isPinned,
        }),
      })

      if (res.ok) {
        loadNews()
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getCategoryColor(cat: string) {
    const found = categories.find((c) => c.value === cat)
    if (!found) return 'gray'
    return found.color
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-3xl font-bold">News & Announcements</h1>
        <Button
          onClick={() => {
            if (showCreate && editingId) {
              resetForm()
            }
            setShowCreate(!showCreate)
          }}
        >
          {showCreate ? 'Cancel' : 'Create Post'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showCreate && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="font-heading text-xl font-bold mb-4">
              {editingId ? 'Edit Post' : 'Create New Post'}
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Update: New features released!"
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Excerpt (optional - shown in previews)
                </label>
                <input
                  type="text"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A brief summary of the news..."
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your news content here... (Markdown supported)"
                  rows={8}
                  className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-primary font-mono text-sm"
                />
              </div>

              {/* Category */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-ghost-bg border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-primary"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Pin to top</span>
                  </label>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Published</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button onClick={saveNews}>
                {editingId ? 'Save Changes' : 'Publish Post'}
              </Button>
              {editingId && (
                <button
                  onClick={() => {
                    resetForm()
                    setShowCreate(false)
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* News List */}
      <h2 className="font-heading text-xl font-bold mb-4">All Posts ({news.length})</h2>
      {isLoading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : news.length > 0 ? (
        <div className="space-y-4">
          {news.map((item) => (
            <Card
              key={item.id}
              className={!item.isPublished ? 'opacity-60' : ''}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {item.isPinned && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-accent-primary/20 text-accent-primary">
                          Pinned
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full bg-${getCategoryColor(
                          item.category
                        )}-500/20 text-${getCategoryColor(item.category)}-400`}
                      >
                        {categories.find((c) => c.value === item.category)?.label || item.category}
                      </span>
                      {!item.isPublished && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-500/20 text-gray-400">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-lg font-bold mb-1 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {item.excerpt || item.content.slice(0, 150)}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      {formatDate(item.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(item)}
                      className="text-blue-400 hover:bg-blue-500/20"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(item)}
                      className={
                        item.isPinned
                          ? 'text-yellow-400 hover:bg-yellow-500/20'
                          : 'text-gray-400 hover:bg-white/10'
                      }
                    >
                      {item.isPinned ? 'Unpin' : 'Pin'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePublish(item)}
                      className={
                        item.isPublished
                          ? 'text-gray-400 hover:bg-white/10'
                          : 'text-green-400 hover:bg-green-500/20'
                      }
                    >
                      {item.isPublished ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNews(item.id)}
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
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
              <polyline points="10,9 9,9 8,9" />
            </svg>
            <div className="text-gray-500">No news posts yet</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
