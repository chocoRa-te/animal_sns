import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const type = searchParams.get("type") // "image" | "video"


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

  return NextResponse.json(pins)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, description, imageUrl, videoUrl, category, userId, type } = body

  const pin = await prisma.pin.create({
    data: {
      title: title ?? "",
      description,
      imageUrl: imageUrl ?? "",
      videoUrl,
      category: category ?? "",
      userId,
      type: type ?? "image",
    },
  })

  return NextResponse.json(pin)
}

