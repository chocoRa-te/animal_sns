import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// アルバム一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const viewerId = searchParams.get("viewerId")

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

  // 本人が閲覧している場合は全部見える
  if (viewerId && viewerId === userId) {
    return NextResponse.json(albums)
  }

  // 他人が閲覧している場合は公開アルバムのみ
  return NextResponse.json(albums.filter((a: any) => a.isPublic))
}

// アルバム作成
export async function POST(request: Request) {
  const { title, userId, pinIds, isPublic } = await request.json()

  if (!title || !userId) {
    return NextResponse.json({ message: "titleとuserIdが必要です" }, { status: 400 })
  }

  // isPublicが明示的に渡されなければ、ユーザーのデフォルト設定を使う
  let resolvedIsPublic = isPublic
  if (resolvedIsPublic === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultPostVisibility: true },
    })
    resolvedIsPublic = user?.defaultPostVisibility ?? true
  }

  const album = await prisma.album.create({
    data: {
      title,
      userId,
      isPublic: resolvedIsPublic ?? true,
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