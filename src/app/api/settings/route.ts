import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// 設定取得
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true,
            email: true,
            showLikeCount: true,
            notificationsOn: true,
            isPrivate: true,
            bio: true,
            showActivity: true,
            commentsEnabled: true,
            showReadReceipt: true,
            allowDMRequests: true,
            defaultPostVisibility: true,
        },
    })

    return NextResponse.json(user)
}

// 設定更新
export async function PATCH(request: Request) {
    const { userId, name, showLikeCount, notificationsOn, isPrivate, currentPassword, newPassword, image, bio, showActivity, commentsEnabled, showReadReceipt, allowDMRequests, defaultPostVisibility } = await request.json()

    if (!userId) {
        return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
    }

    // パスワード変更の場合
    if (currentPassword && newPassword) {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user?.password) {
            return NextResponse.json({ message: "パスワードが設定されていません" }, { status: 400 })
        }
        const isValid = await bcrypt.compare(currentPassword, user.password)
        if (!isValid) {
            return NextResponse.json({ message: "現在のパスワードが正しくありません" }, { status: 400 })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        })
        return NextResponse.json({ message: "パスワードを変更しました" })
    }

    // 通常の設定更新
    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(name !== undefined && { name }),
            ...(showLikeCount !== undefined && { showLikeCount }),
            ...(notificationsOn !== undefined && { notificationsOn }),
            ...(isPrivate !== undefined && { isPrivate }),
            ...(image !== undefined && { image }),
            ...(bio !== undefined && { bio }),
            ...(showActivity !== undefined && { showActivity }),
            ...(commentsEnabled !== undefined && { commentsEnabled }),
            ...(showReadReceipt !== undefined && { showReadReceipt }),
            ...(allowDMRequests !== undefined && { allowDMRequests }),
            ...(defaultPostVisibility !== undefined && { defaultPostVisibility }),
        },
    })

    return NextResponse.json(user)
}

// アカウント削除
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
        return NextResponse.json({ message: "userIdが必要です" }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ message: "アカウントを削除しました" })
}