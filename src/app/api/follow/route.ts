import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// フォロー・アンフォロー
export async function POST(request: Request) {
  const { followerId, followingId } = await request.json()

  if (!followerId || !followingId) {
    return NextResponse.json({ message: "followerIdとfollowingIdが必要です" }, { status: 400 })
  }

  // すでにフォローしているか確認
  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  })

  if (existing) {
    // フォロー済みならアンフォロー
    await prisma.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    })
    return NextResponse.json({ following: false, status: null })
  }

  // 相手が鍵垢かどうか確認
  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
    select: { isPrivate: true },
  })

  const status = targetUser?.isPrivate ? "pending" : "accepted"

  // フォロー作成
  await prisma.follow.create({
    data: { followerId, followingId, status },
  })

  // 通知を作成（承認済みの場合のみ）
  if (status === "accepted") {
    await prisma.notification.create({
      data: {
        type: "follow",
        userId: followingId,
        senderId: followerId,
      },
    })
  } else {
    // フォローリクエストの通知（重複しない）
    const existingNotification = await prisma.notification.findFirst({
      where: {
        type: "follow_request",
        userId: followingId,
        senderId: followerId,
      },
    })

    if (!existingNotification) {
      await prisma.notification.create({
        data: {
          type: "follow_request",
          userId: followingId,
          senderId: followerId,
        },
      })
    }
  }
  return NextResponse.json({ following: status === "accepted", status })
}

// フォロー状態確認 & フォロー中のIDリスト取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const followerId = searchParams.get("followerId")
  const followingId = searchParams.get("followingId")
  const userId = searchParams.get("userId")

  // フォロー状態確認（followerIdとfollowingIdが両方ある場合）
  if (followerId && followingId) {
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    })
    return NextResponse.json({
      following: existing?.status === "accepted",
      status: existing?.status ?? "none"
    })
  }

  // フォロー中のユーザーIDリスト取得（userIdがある場合）
  if (userId) {
    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    })
    return NextResponse.json({
      followingIds: follows.map((f: { followingId: string }) => f.followingId),
    })
  }

  return NextResponse.json({ message: "パラメータが必要です" }, { status: 400 })
}