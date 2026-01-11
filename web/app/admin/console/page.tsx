'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface QuickAction {
  id: string
  cmd: string
  description: string
  dangerous?: boolean
  category?: string
}

const CATEGORY_CONFIG: Record<string, { title: string; icon: string; color: string }> = {
  server: { title: 'Server', icon: 'server', color: 'text-green-400' },
  logs: { title: 'Logs & Info', icon: 'file', color: 'text-blue-400' },
  system: { title: 'System', icon: 'cpu', color: 'text-yellow-400' },
  plugin: { title: 'Plugins', icon: 'puzzle', color: 'text-purple-400' },
  maps: { title: 'Maps', icon: 'map', color: 'text-cyan-400' },
  game: { title: 'In-Game', icon: 'game', color: 'text-orange-400' },
}

export default function ConsolePage() {
  const [actions, setActions] = useState<QuickAction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState('')

  useEffect(() => {
    fetchActions()
  }, [])

  async function fetchActions() {
    try {
      const res = await fetch('/api/admin/console')
      if (res.ok) {
        const data = await res.json()
        setActions(data.actions || [])
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error)
    }
  }

  async function runAction(actionId: string, confirm = false) {
    setIsLoading(true)
    setOutput('')
    setPendingConfirm(null)
    setLastAction(actionId)

    try {
      const res = await fetch('/api/admin/console', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionId, confirm })
      })

      const data = await res.json()

      if (data.requireConfirm) {
        setPendingConfirm(actionId)
        setOutput(data.message)
      } else if (data.success) {
        setOutput(data.output)
      } else {
        setOutput(`Error: ${data.error}\n${data.output || ''}`)
      }
    } catch (error) {
      setOutput(`Failed to run action: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Group actions by category
  const groupedActions = actions.reduce((acc, action) => {
    const cat = action.category || 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold mb-2">Server Control</h1>
      <p className="text-gray-400 mb-8">Manage your CS2 server from the browser</p>

      {/* Output Card - Always visible at top */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Output</span>
            {output && (
              <button
                onClick={() => setOutput('')}
                className="text-xs text-gray-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {pendingConfirm ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-2">
              <p className="text-yellow-400 text-sm mb-2">{output}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => runAction(pendingConfirm, true)}
                  disabled={isLoading}
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPendingConfirm(null)
                    setOutput('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <pre className="bg-black/50 rounded-lg p-3 text-xs font-mono text-green-400 overflow-auto max-h-48 whitespace-pre-wrap min-h-[60px]">
              {isLoading ? 'Running...' : output || 'Output will appear here'}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Action Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(groupedActions).map(([category, categoryActions]) => {
          const config = CATEGORY_CONFIG[category] || { title: category, icon: 'default', color: 'text-gray-400' }

          return (
            <Card key={category}>
              <CardContent className="p-4">
                <h2 className={`font-heading text-sm font-bold mb-3 ${config.color} uppercase tracking-wider`}>
                  {config.title}
                </h2>
                <div className="space-y-1">
                  {categoryActions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => runAction(action.id)}
                      disabled={isLoading}
                      className={`w-full px-3 py-2 rounded text-left text-sm transition-all flex items-center justify-between ${
                        action.dangerous
                          ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
                          : 'bg-ghost-bg hover:bg-white/5'
                      } disabled:opacity-50`}
                    >
                      <span className="truncate">{action.description}</span>
                      {isLoading && lastAction === action.id && (
                        <svg className="w-3 h-3 animate-spin flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Help text */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Red buttons require confirmation. Server commands run via screen.</p>
        <p className="mt-1">
          Console runs on VPS at <code className="bg-ghost-bg px-1 rounded">46.224.197.229</code>
        </p>
      </div>
    </div>
  )
}
