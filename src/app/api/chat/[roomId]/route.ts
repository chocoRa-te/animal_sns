import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// メッセージ一覧取得
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const messages = await prisma.message.findMany({
    where: { roomId: params.roomId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json(messages)
}

// メッセージ送信
export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const { content, userId } = await request.json()

  if (!content || !userId) {
    return NextResponse.json({ message: "contentとuserIdが必要です" }, { status: 400 })
  }

  const message = await prisma.message.create({
    data: {
      content,
      userId,
      roomId: params.roomId,
    },
    include: { user: true },
  })

  return NextResponse.json(message)
}

// 既読処理 or 通知ミュート設定
export async function PATCH(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const { userId, muteNotifications, markAsRead } = await request.json()

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  // 既読にする
  if (markAsRead) {
    await prisma.message.updateMany({
      where: {
        roomId: params.roomId,
        userId: { not: userId },
        read: false,
      },
      data: { read: true },
    })
    return NextResponse.json({ message: "既読にしました" })
  }

  // 通知ミュート設定
  if (muteNotifications !== undefined) {
    await prisma.chatRoomMember.updateMany({
      where: {
        roomId: params.roomId,
        userId,
      },
      data: { muteNotifications },
    })
    return NextResponse.json({ muteNotifications })
  }

  return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
}

// メッセージ取り消し・編集 or グループ退出
export async function DELETE(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const { messageId, userId, newContent, leave } = await request.json()

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  // グループ退出
  if (leave) {
    // メンバーから削除
    await prisma.chatRoomMember.deleteMany({
      where: { roomId: params.roomId, userId },
    })

    // 「退出しました」メッセージを自動送信
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    })

    await prisma.message.create({
      data: {
        content: `${user?.name ?? "ユーザー"} が退出しました`,
        userId,
        roomId: params.roomId,
      },
    })

    return NextResponse.json({ message: "退出しました" })
  }

  // 自分のメッセージか確認
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  })

  if (!message || message.userId !== userId) {
    return NextResponse.json({ message: "操作できません" }, { status: 403 })
  }

  // 編集の場合
  if (newContent) {
    await prisma.message.update({
      where: { id: messageId },
      data: { content: newContent },
    })
    return NextResponse.json({ message: "編集しました" })
  }

  // 取り消しの場合
  await prisma.message.update({
    where: { id: messageId },
    data: { content: "このメッセージは取り消されました" },
  })

  return NextResponse.json({ message: "取り消しました" })
}