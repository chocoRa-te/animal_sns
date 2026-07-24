import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { content, userId } = await request.json()

    if (!content || !userId) {
        return NextResponse.json({ message: "contentとuserIdが必要です" }, { status: 400 })
    }

    // ピンの投稿者を取得
    const pin = await prisma.pin.findUnique({
        where: { id: params.id },
        select: { userId: true },
    })

    const comment = await prisma.comment.create({
        data: {
            content,
            userId,
            pinId: params.id,
        },
        include: { user: true },
    })

    // 通知を作成（自分の投稿へのコメントは通知しない）
    if (pin && pin.userId !== userId) {
        await prisma.notification.create({
            data: {
                type: "comment",
                userId: pin.userId,
                senderId: userId,
                pinId: params.id,
            },
        })
    }

    return NextResponse.json(comment)
}

// コメント編集
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { commentId, userId, content } = await request.json()

    if (!commentId || !userId || !content) {
        return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
    }

    // 自分のコメントか確認
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
    })

    if (!comment || comment.userId !== userId) {
        return NextResponse.json({ message: "編集できません" }, { status: 403 })
    }

    const updated = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: { user: true },
    })

    return NextResponse.json(updated)
}

// コメント削除
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { commentId, userId } = await request.json()

    if (!commentId || !userId) {
        return NextResponse.json({ message: "パラメータが不足しています" }, { status: 400 })
    }

    // 自分のコメントか確認
    const comment = await prisma.comment.findUnique({
        where: { id: commentId },
    })

    if (!comment || comment.userId !== userId) {
        return NextResponse.json({ message: "削除できません" }, { status: 403 })
    }

    await prisma.comment.delete({
        where: { id: commentId },
    })

    return NextResponse.json({ message: "削除しました" })
}