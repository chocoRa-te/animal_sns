import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// 通知一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    include: {
      sender: { select: { id: true, name: true } },
      pin: { select: { id: true, title: true, imageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(notifications)
}

// 通知を既読にする
export async function PATCH(request: Request) {
  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
  }

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })

  return NextResponse.json({ message: "既読にしました" })
}

// 通知を作成（内部的に使う）
export async function POST(request: Request) {
  const { type, userId, senderId, pinId } = await request.json()

  if (!type || !userId || !senderId) {
    return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
  }

  // 自分自身への通知は作らない
  if (userId === senderId) {
    return NextResponse.json({ message: "自分自身への通知はスキップ" })
  }

  const notification = await prisma.notification.create({
    data: { type, userId, senderId, pinId },
  })

  return NextResponse.json(notification)
}