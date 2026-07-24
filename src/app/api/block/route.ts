import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ブロック・アンブロック
export async function POST(request: Request) {
  const { blockerId, blockedId } = await request.json()

  if (!blockerId || !blockedId) {
    return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
  }

  // すでにブロックしているか確認
  const existing = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
  })

  if (existing) {
    // ブロック済みならアンブロック
    await prisma.block.delete({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
    })
    return NextResponse.json({ blocked: false })
  }

  // ブロック作成
  await prisma.block.create({
    data: { blockerId, blockedId },
  })

  // フォロー関係を解除
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: blockerId, followingId: blockedId },
        { followerId: blockedId, followingId: blockerId },
      ],
    },
  })

  return NextResponse.json({ blocked: true })
}

// ブロック状態確認
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const blockerId = searchParams.get("blockerId")
  const blockedId = searchParams.get("blockedId")

  if (!blockerId || !blockedId) {
    return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
  }

  const existing = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: { blockerId, blockedId },
    },
  })

  return NextResponse.json({ blocked: !!existing })
}