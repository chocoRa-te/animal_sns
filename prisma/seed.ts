import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.pin.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      name: "testuser",
      email: "test@example.com",
      image: null,
    },
  })

  const pins = [
    {
      title: "美しい山の風景",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600",
      category: "自然",
    },
    {
      title: "森の朝霧",
      imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600",
      category: "自然",
    },
    {
      title: "おいしい料理のレシピ",
      imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600",
      category: "料理",
    },
    {
      title: "パスタの作り方",
      imageUrl: "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600",
      category: "料理",
    },
    {
      title: "朝のコーヒー",
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
      category: "料理",
    },
    {
      title: "インテリアのアイデア",
      imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600",
      category: "インテリア",
    },
    {
      title: "ミニマルな書斎",
      imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600",
      category: "インテリア",
    },
    {
      title: "旅行の思い出",
      imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600",
      category: "旅行",
    },
    {
      title: "街並みの散歩",
      imageUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600",
      category: "旅行",
    },
    {
      title: "夕焼けのビーチ",
      imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
      category: "旅行",
    },
  ]

  for (const pin of pins) {
    await prisma.pin.create({
      data: {
        ...pin,
        userId: user.id,
      },
    })
  }

  console.log("シードデータを作成しました！")
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())