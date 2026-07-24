"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { useRouter } from "next/navigation"

const categories = ["自然", "料理", "インテリア", "旅行"]

export default function CategoriesPage() {
  const router = useRouter()
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/pins")
      .then((res) => res.json())
      .then((pins: any[]) => {
        const map: Record<string, string> = {}
        for (const category of categories) {
          const pin = pins.find((p) => p.category === category)
          if (pin) map[category] = pin.imageUrl
        }
        setThumbnails(map)
      })
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">カテゴリ</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <div
              key={category}
              className="relative cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              onClick={() => router.push(`/categories/${category}`)}
            >
              {thumbnails[category] && (
                <img
                  src={thumbnails[category]}
                  alt={category}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/40">
                <p className="text-white font-semibold">{category}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}