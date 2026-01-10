import { NextRequest } from 'next/server'
import { prisma } from './prisma'

export async function authenticateServer(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')

  if (!apiKey) {
    return { error: 'Missing API key', status: 401 }
  }

  const server = await prisma.server.findUnique({
    where: { apiKey },
  })

  if (!server) {
    return { error: 'Invalid API key', status: 401 }
  }

  return { server }
}

export function jsonResponse(data: object, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ error: message }, status)
}
