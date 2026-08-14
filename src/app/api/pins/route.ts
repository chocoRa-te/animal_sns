import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const type = searchParams.get("type") // "image" | "video"
  const viewerId = searchParams.get("viewerId") // 閲覧者のユーザーID
  const mode = searchParams.get("mode") // "discover" のとき鍵垢は完全除外

  const pins = await prisma.pin.findMany({
    where: {
      // typeフィルター
      ...(type ? { type } : {}),
      // 検索フィルター
      ...(search ? {
        OR: [
          { title: { contains: search } },
          { category: { contains: search } },
          { user: { name: { contains: search } } },
        ],
      } : {}),
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // 閲覧者が指定されていない場合は公開投稿のみ返す（未ログイン等の安全策）
  if (!viewerId) {
    return NextResponse.json(pins.filter((p: any) => p.isPublic))
  }

  // 閲覧者がフォロー中（承認済み）のユーザーIDを取得
  const accepted = await prisma.follow.findMany({
    where: { followerId: viewerId, status: "accepted" },
    select: { followingId: true },
  })
  const acceptedIds = new Set(accepted.map((f: { followingId: string }) => f.followingId))

  const visiblePins = pins.filter((pin: any) => {
    // 自分の投稿は常に見える
    if (pin.userId === viewerId) return true

    // 鍵垢のユーザーの投稿は、承認済みフォロワー以外には見せない
    if (pin.user?.isPrivate) {
      // discoverモードでは鍵垢の投稿は一切出さない
      if (mode === "discover") return false
      if (!acceptedIds.has(pin.userId)) return false
    }

    // isPublic=falseの投稿は本人以外には見せない
    return pin.isPublic
  })

  return NextResponse.json(visiblePins)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, imageUrl, videoUrl, category, userId, type, isPublic } = body

  // isPublicが明示的に渡されなければ、ユーザーのデフォルト設定を使う
  let resolvedIsPublic = isPublic
  if (resolvedIsPublic === undefined && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { defaultPostVisibility: true },
    })
    resolvedIsPublic = user?.defaultPostVisibility ?? true
  }

  const pin = await prisma.pin.create({
    data: {
      title: title ?? "",
      description,
      imageUrl: imageUrl ?? "",
      videoUrl,
      category: category ?? "",
      userId,
      type: type ?? "image",
      isPublic: resolvedIsPublic ?? true,
    },
  })

  return NextResponse.json(pin)
}