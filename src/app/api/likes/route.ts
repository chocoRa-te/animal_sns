import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// いいねを追加・削除
export async function POST(request: Request) {
    const { pinId, userId } = await request.json()

    if (!pinId || !userId) {
        return NextResponse.json({ message: "pinIdとuserIdが必要です" }, { status: 400 })
    }

    // ピンの投稿者を取得
    const pin = await prisma.pin.findUnique({
        where: { id: pinId },
        select: { userId: true },
    })

    // すでにいいねしているか確認
    const existing = await prisma.like.findUnique({
        where: {
            userId_pinId: { userId, pinId },
        },
    })

    if (existing) {
        // いいね済みなら削除
        await prisma.like.deleteMany({
            where: {
                userId, pinId,
            },
        })
        return NextResponse.json({ liked: false })
    } else {
        // いいねしていなければ追加
        await prisma.like.create({
            data: { userId, pinId },
        })

        // 通知を作成（自分の投稿へのいいねは通知しない、重複しない）
        if (pin && pin.userId !== userId) {
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    type: "like",
                    userId: pin.userId,
                    senderId: userId,
                    pinId,
                },
            })

            if (!existingNotification) {
                await prisma.notification.create({
                    data: {
                        type: "like",
                        userId: pin.userId,
                        senderId: userId,
                        pinId,
                    },
                })
            }
        }
        return NextResponse.json({ liked: true })
    }
}

// いいね数取得 & いいねした投稿一覧取得
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const pinId = searchParams.get("pinId")
    const userId = searchParams.get("userId")

    // userIdがある場合はいいねした投稿一覧を返す
    if (userId) {
        const likes = await prisma.like.findMany({
            where: { userId },
            include: {
                pin: {
                    include: { user: true },

                }
            },
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json({ pins: likes.map((like: { pin: any }) => like.pin) })
    }
    // pinIdがある場合はいいね数を返す
    if (pinId) {

        const count = await prisma.like.count({
            where: { pinId },
        })
        return NextResponse.json({ count })
    }

    return NextResponse.json({ message: "パラメータが必要です" }, { status: 400 })
}