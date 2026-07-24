import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ルーム情報取得
export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: params.roomId },
    include: {
      members: {
        include: { user: true },
      },
    },
  })

  if (!room) {
    return NextResponse.json({ message: "ルームが見つかりません" }, { status: 404 })
  }

  return NextResponse.json(room)
}