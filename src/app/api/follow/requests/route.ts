import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// フォローリクエスト一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  const requests = await prisma.follow.findMany({
    where: {
      followingId: userId,
      status: "pending",
    },
    include: {
      follower: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(requests)
}

// フォローリクエストを承認・拒否
export async function PATCH(request: Request) {
  const { followerId, followingId, action } = await request.json()

  if (!followerId || !followingId || !action) {
    return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
  }

  if (action === "accept") {
    // 承認
    await prisma.follow.update({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      data: { status: "accepted" },
    })

    // フォロー通知を作成
    await prisma.notification.create({
      data: {
        type: "follow",
        userId: followerId,
        senderId: followingId,
      },
    })

    return NextResponse.json({ message: "承認しました" })
  } else {
    // 拒否
    await prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    })

    return NextResponse.json({ message: "拒否しました" })
  }
}