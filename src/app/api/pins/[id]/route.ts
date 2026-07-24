import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const pin = await prisma.pin.findUnique({
    where: { id: params.id },
    include: { user: true },
  })

  if (!pin) {
    return NextResponse.json({ message: "ピンが見つかりません" }, { status: 404 })
  }

  const comments = await prisma.comment.findMany({
    where: { pinId: params.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({ pin, comments })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
){
  const pin = await prisma.pin.findUnique({
    where: { id: params.id },
  })

  if(!pin){
    return NextResponse.json({ message: "ピンが見つかりません"}, {status: 404})
  }

  await prisma.pin.delete({
    where: {id: params.id},
  })

  return NextResponse.json({message:"削除しました"})
}

// 投稿編集
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { title, description, category, userId } = await request.json()

  // 自分の投稿か確認
  const pin = await prisma.pin.findUnique({
    where: { id: params.id },
  })

  if (!pin) {
    return NextResponse.json({ message: "ピンが見つかりません" }, { status: 404 })
  }

  if (pin.userId !== userId) {
    return NextResponse.json({ message: "編集できません" }, { status: 403 })
  }

  const updated = await prisma.pin.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
    },
  })

  return NextResponse.json(updated)
}