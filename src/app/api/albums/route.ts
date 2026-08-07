import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// アルバム一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  const albums = await prisma.album.findMany({
    where: { userId },
    include: {
      pins: {
        include: {
          pin: true,
        },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(albums)
}

// アルバム作成
export async function POST(request: Request) {
  const { title, userId, pinIds } = await request.json()

  if (!title || !userId) {
    return NextResponse.json({ message: "titleとuserIdが必要です" }, { status: 400 })
  }

  const album = await prisma.album.create({
    data: {
      title,
      userId,
      pins: {
        create: (pinIds ?? []).map((pinId: string) => ({ pinId })),
      },
    },
    include: {
      pins: {
        include: { pin: true },
      },
    },
  })

  return NextResponse.json(album)
}