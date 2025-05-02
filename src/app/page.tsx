// src/app/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/layout/Navbar"
import { PinCard } from "@/components/pins/PinCard"

export default function Home() {
  const [pins, setPins] = useState([])
  
  useEffect(() => {
    // テーマに合った実際の画像
    const mockPins = [
      {
        id: "1",
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        title: "美しい山の風景",
        username: "nature_lover",
        height: 350,
      },
      {
        id: "2",
        imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        title: "おいしい料理のレシピ",
        username: "food_master",
        height: 450,
      },
      {
        id: "3",
        imageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        title: "インテリアのアイデア",
        username: "home_designer", 
        height: 380,
      },
      {
        id: "4",
        imageUrl: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        title: "旅行の思い出",
        username: "travel_addict",
        height: 420,
      },
    ]
    
    setPins(mockPins)
  }, [])
  
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pins.map((pin) => (
            <PinCard
              key={pin.id}
              imageUrl={pin.imageUrl}
              title={pin.title}
              username={pin.username}
              height={pin.height}
            />
          ))}
        </div>
      </main>
    </div>
  )
}