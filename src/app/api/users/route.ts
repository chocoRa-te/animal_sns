import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ユーザー検索（メンション用）
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")

  if (!query) {
    return NextResponse.json({ message: "queryが必要です" }, { status: 400 })
  }

  const users = await prisma.user.findMany({
    where: {
      name: {
        contains: query,
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
    take: 5, // 最大5件
  })

  return NextResponse.json(users)
}