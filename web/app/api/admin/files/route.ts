import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { readdir, stat, readFile, writeFile } from 'fs/promises'
import { join, dirname, basename } from 'path'

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID

// Allowed root paths (security)
const ALLOWED_ROOTS = [
  '/home/cs2/cs2-server/game/csgo/cfg',
  '/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/configs',
  '/home/cs2/cs2-server/game/csgo/addons/counterstrikesharp/plugins',
  '/var/www/ghost/web', // If running on VPS
]

// File extensions allowed to edit
const EDITABLE_EXTENSIONS = ['.cfg', '.json', '.txt', '.vdf', '.yaml', '.yml', '.md', '.cs', '.ts', '.tsx', '.env']

function isPathAllowed(path: string): boolean {
  const normalizedPath = join('/', path)
  return ALLOWED_ROOTS.some(root => normalizedPath.startsWith(root))
}

function isEditable(filename: string): boolean {
  return EDITABLE_EXTENSIONS.some(ext => filename.endsWith(ext))
}

// GET - List directory or read file
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/home/cs2/cs2-server/game/csgo/cfg'
    const action = searchParams.get('action') || 'list' // list or read

    if (!isPathAllowed(path)) {
      return NextResponse.json({
        error: 'Path not allowed',
        allowedRoots: ALLOWED_ROOTS
      }, { status: 403 })
    }

    if (action === 'read') {
      // Read file content
      try {
        const content = await readFile(path, 'utf-8')
        const filename = basename(path)

        return NextResponse.json({
          path,
          filename,
          content,
          editable: isEditable(filename),
          size: content.length
        })
      } catch (err: any) {
        return NextResponse.json({ error: `Cannot read file: ${err.message}` }, { status: 404 })
      }
    }

    // List directory
    try {
      const entries = await readdir(path, { withFileTypes: true })
      const items = await Promise.all(
        entries.map(async entry => {
          const fullPath = join(path, entry.name)
          let size = 0

          try {
            const stats = await stat(fullPath)
            size = stats.size
          } catch {}

          return {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            isFile: entry.isFile(),
            editable: entry.isFile() && isEditable(entry.name),
            size
          }
        })
      )

      // Sort: directories first, then files
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })

      return NextResponse.json({
        path,
        parent: dirname(path),
        canGoUp: isPathAllowed(dirname(path)),
        items,
        allowedRoots: ALLOWED_ROOTS
      })
    } catch (err: any) {
      return NextResponse.json({ error: `Cannot read directory: ${err.message}` }, { status: 404 })
    }
  } catch (error) {
    console.error('Files API error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST - Write/save file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { path, content } = body

    if (!path || content === undefined) {
      return NextResponse.json({ error: 'Path and content required' }, { status: 400 })
    }

    if (!isPathAllowed(path)) {
      return NextResponse.json({ error: 'Path not allowed' }, { status: 403 })
    }

    const filename = basename(path)
    if (!isEditable(filename)) {
      return NextResponse.json({ error: 'File type not editable' }, { status: 403 })
    }

    // Create backup before writing
    try {
      const existingContent = await readFile(path, 'utf-8')
      const backupPath = path + '.backup'
      await writeFile(backupPath, existingContent, 'utf-8')
    } catch {
      // File might not exist yet, that's ok
    }

    // Write new content
    await writeFile(path, content, 'utf-8')

    return NextResponse.json({
      success: true,
      path,
      message: 'File saved successfully'
    })
  } catch (error: any) {
    console.error('File write error:', error)
    return NextResponse.json({ error: `Failed to save: ${error.message}` }, { status: 500 })
  }
}
