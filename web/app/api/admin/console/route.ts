import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const OWNER_STEAM_ID = process.env.OWNER_STEAM_ID
const VPS_USER = 'cs2'
const CS2_PATH = '/home/cs2/cs2-server'

// Allowed commands (security whitelist)
const ALLOWED_COMMANDS = [
  'screen -ls',
  'ps aux | grep cs2',
  'df -h',
  'free -m',
  'uptime',
  'cat',
  'ls',
  'tail',
  'head',
  'grep',
]

// Quick actions
const QUICK_ACTIONS: Record<string, { cmd: string; description: string; dangerous?: boolean; category?: string }> = {
  // Server management
  'server-status': {
    cmd: 'screen -ls && echo "\\n=== CS2 Process ===" && ps aux | grep cs2 | grep -v grep || echo "Not running"',
    description: 'Check server status',
    category: 'server'
  },
  'server-start': {
    cmd: `su - ${VPS_USER} -c "cd ${CS2_PATH} && screen -dmS cs2 ./start-cs2.sh && sleep 2 && screen -ls"`,
    description: 'Start CS2 server',
    dangerous: true,
    category: 'server'
  },
  'server-restart': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -X quit 2>/dev/null; sleep 2; cd ${CS2_PATH} && screen -dmS cs2 ./start-cs2.sh && sleep 2 && screen -ls"`,
    description: 'Restart CS2 server',
    dangerous: true,
    category: 'server'
  },
  'server-stop': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -X quit"`,
    description: 'Stop CS2 server',
    dangerous: true,
    category: 'server'
  },

  // Logs & Info
  'view-logs': {
    cmd: `tail -100 ${CS2_PATH}/game/csgo/addons/counterstrikesharp/logs/*.txt 2>/dev/null | tail -50`,
    description: 'View plugin logs (last 50 lines)',
    category: 'logs'
  },
  'view-console': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X hardcopy /tmp/cs2_console.txt; cat /tmp/cs2_console.txt | tail -30"`,
    description: 'View server console',
    category: 'logs'
  },
  'view-server-cfg': {
    cmd: `cat ${CS2_PATH}/game/csgo/cfg/server.cfg`,
    description: 'View server.cfg',
    category: 'logs'
  },

  // System
  'system-info': {
    cmd: 'echo "=== DISK ===" && df -h / && echo "\\n=== MEMORY ===" && free -m && echo "\\n=== UPTIME ===" && uptime && echo "\\n=== SCREENS ===" && screen -ls',
    description: 'System info',
    category: 'system'
  },
  'list-plugins': {
    cmd: `ls -la ${CS2_PATH}/game/csgo/addons/counterstrikesharp/plugins/`,
    description: 'List installed plugins',
    category: 'system'
  },

  // Plugin management
  'reload-plugin': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'css_plugins reload GhostSouls\\n'"`,
    description: 'Reload GhostSouls',
    dangerous: true,
    category: 'plugin'
  },
  'reload-weaponpaints': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'css_plugins reload WeaponPaints\\n'"`,
    description: 'Reload WeaponPaints',
    dangerous: true,
    category: 'plugin'
  },

  // Map changes
  'map-surf-utopia': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'host_workshop_map 3070321829\\n'"`,
    description: 'surf_utopia (T1)',
    category: 'maps'
  },
  'map-surf-beginner': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'host_workshop_map 3073866847\\n'"`,
    description: 'surf_beginner (T1)',
    category: 'maps'
  },
  'map-surf-mesa': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'host_workshop_map 3082756590\\n'"`,
    description: 'surf_mesa (T2)',
    category: 'maps'
  },
  'map-bhop-badges': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'host_workshop_map 3104517802\\n'"`,
    description: 'bhop_badges (T1)',
    category: 'maps'
  },
  'map-bhop-eazy': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'host_workshop_map 3076439901\\n'"`,
    description: 'bhop_eazy (T1)',
    category: 'maps'
  },
  'map-dust2': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'map de_dust2\\n'"`,
    description: 'de_dust2',
    category: 'maps'
  },

  // In-game commands
  'say-hello': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'say Welcome to Ghost Gaming!\\n'"`,
    description: 'Send welcome message',
    category: 'game'
  },
  'kick-bots': {
    cmd: `su - ${VPS_USER} -c "screen -S cs2 -p 0 -X stuff 'bot_kick\\n'"`,
    description: 'Kick all bots',
    category: 'game'
  },
}

// POST - Execute command or quick action
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, command, confirm } = body

    let cmdToRun = ''

    // Quick action
    if (action && QUICK_ACTIONS[action]) {
      const quickAction = QUICK_ACTIONS[action]

      // Require confirmation for dangerous actions
      if (quickAction.dangerous && !confirm) {
        return NextResponse.json({
          requireConfirm: true,
          message: `This action (${quickAction.description}) may affect the server. Confirm?`
        })
      }

      cmdToRun = quickAction.cmd
    }
    // Custom command (with security checks)
    else if (command) {
      // Security: Check if command starts with allowed prefix
      const isAllowed = ALLOWED_COMMANDS.some(allowed =>
        command.trim().startsWith(allowed) ||
        command.trim().match(/^(cat|ls|tail|head|grep)\s/)
      )

      if (!isAllowed) {
        return NextResponse.json({
          error: 'Command not allowed. Use quick actions or allowed commands only.',
          allowedCommands: ALLOWED_COMMANDS
        }, { status: 403 })
      }

      cmdToRun = command
    } else {
      return NextResponse.json({ error: 'No action or command specified' }, { status: 400 })
    }

    // Execute command
    const startTime = Date.now()

    try {
      const { stdout, stderr } = await execAsync(cmdToRun, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      })

      return NextResponse.json({
        success: true,
        output: stdout || stderr || '(no output)',
        command: cmdToRun,
        executionTime: Date.now() - startTime
      })
    } catch (execError: any) {
      return NextResponse.json({
        success: false,
        error: execError.message,
        output: execError.stdout || execError.stderr || '',
        command: cmdToRun,
        executionTime: Date.now() - startTime
      })
    }
  } catch (error) {
    console.error('Console error:', error)
    return NextResponse.json({ error: 'Console error' }, { status: 500 })
  }
}

// GET - List available quick actions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.steamId || session.user.steamId !== OWNER_STEAM_ID) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const actions = Object.entries(QUICK_ACTIONS).map(([id, action]) => ({
      id,
      ...action
    }))

    return NextResponse.json({ actions, allowedCommands: ALLOWED_COMMANDS })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get actions' }, { status: 500 })
  }
}
