import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// アルバム詳細取得
export async function GET(
    request: Request,
    { params }: { params: { albumId: string } }
) {
    const { searchParams } = new URL(request.url)
    const viewerId = searchParams.get("viewerId")

    const album = await prisma.album.findUnique({
        where: { id: params.albumId },
        include: {
            pins: {
                include: { pin: true },
                orderBy: { createdAt: "asc" },
            },
        },
    })

    if (!album) {
        return NextResponse.json({ message: "アルバムが見つかりません" }, { status: 404 })
    }

    // 非公開アルバムは本人以外アクセス不可
    if (!album.isPublic && viewerId !== album.userId) {
        return NextResponse.json({ message: "このアルバムは非公開です" }, { status: 403 })
    }

    return NextResponse.json(album)
}

// アルバム更新（写真追加・削除）
export async function PATCH(
    request: Request,
    { params }: { params: { albumId: string } }
) {
    const { addPinIds, removePinIds, title } = await request.json()

    if (title) {
        await prisma.album.update({
            where: { id: params.albumId },
            data: { title },
        })
    }

    if (addPinIds?.length) {
        await prisma.albumPin.createMany({
            data: addPinIds.map((pinId: string) => ({
                albumId: params.albumId,
                pinId,
            })),
        })
    }

    if (removePinIds?.length) {
        await prisma.albumPin.deleteMany({
            where: {
                albumId: params.albumId,
                pinId: { in: removePinIds },
            },
        })
    }

    const album = await prisma.album.findUnique({
        where: { id: params.albumId },
        include: {
            pins: {
                include: { pin: true },
                orderBy: { createdAt: "asc" },
            },
        },
    })

    return NextResponse.json(album)
}

// アルバム削除
export async function DELETE(
    request: Request,
    { params }: { params: { albumId: string } }
) {
    await prisma.album.delete({
        where: { id: params.albumId },
    })

    return NextResponse.json({ message: "削除しました" })
}