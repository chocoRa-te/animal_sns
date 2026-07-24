import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// チャットルーム一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  const unreadOnly = searchParams.get("unreadOnly")

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  // 未読メッセージ数だけ返す
  if (unreadOnly === "true") {
    const count = await prisma.message.count({
      where: {
        read: false,
        user: { id: { not: userId } }, // 自分以外が送ったメッセージ
        room: {
          members: { some: { userId } },
          isRequest: false, // 通常チャットのみ
        },
      },
    })
    return NextResponse.json({ count })
  }

  const rooms = await prisma.chatRoom.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      members: {
        include: { user: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1, // 最新メッセージだけ取得
      },
      _count: {
        select: {
          messages: {
            where: {
              read: false,
              userId: { not: userId }, // 自分以外が送ったメッセージ
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(rooms)
}

// チャットルーム作成（1対1またはグループ）
export async function POST(request: Request) {
  const { userId, targetUserId, isGroup, name, memberIds } = await request.json()

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  // 1対1の場合
  if (!isGroup && targetUserId) {
    // 既存のルームを探す
    const existing = await prisma.chatRoom.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: targetUserId } } },
        ],
      },
    })

    if (existing) {
      return NextResponse.json({ ...existing, isRequest: false })
    }

    // 相互フォローかどうか確認
    const follow1 = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: userId, followingId: targetUserId },
      },
    })
    const follow2 = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: targetUserId, followingId: userId },
      },
    })

    const isMutualFollow = follow1?.status === "accepted" && follow2?.status === "accepted"

    // 相手のDM設定を確認
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { allowDMRequests: true },
    })

    // 相互フォローでなく、DMリクエストを受け取らない場合はブロック
    if (!isMutualFollow && !targetUser?.allowDMRequests) {
      return NextResponse.json({ message: "このユーザーはDMを受け取りません" }, { status: 403 })
    }

    // ルームを作成（リクエスト扱いかどうかも判定）
    const room = await prisma.chatRoom.create({
      data: {
        name: null,
        isGroup: false,
        isRequest: !isMutualFollow, // 相互フォローでなければリクエスト
        members: {
          create: [{ userId }, { userId: targetUserId }],
        },
      },
      include: {
        members: { include: { user: true } },
      },
    })

    return NextResponse.json({ ...room, isRequest: !isMutualFollow })
  }

  // グループの場合
  const room = await prisma.chatRoom.create({
    data: {
      name: isGroup ? name : null,
      isGroup: isGroup ?? false,
      members: {
        create: memberIds.map((id: string) => ({ userId: id })),
      },
    },
    include: {
      members: { include: { user: true } },
    },
  })

  return NextResponse.json(room)
}

// トーク削除（自分側からのみ非表示）
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get("roomId")
  const userId = searchParams.get("userId")

  if (!roomId || !userId) {
    return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
  }

  // 自分をメンバーから削除（自分側からのみ非表示にする）
  await prisma.chatRoomMember.deleteMany({
    where: {
      roomId,
      userId,
    },
  })

  return NextResponse.json({ message: "トークを削除しました" })
}