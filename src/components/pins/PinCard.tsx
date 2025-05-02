// src/components/pins/PinCard.tsx
"use client"

import { useState } from "react"
import Image from "next/image"
import { Heart, MessageCircle, MoreHorizontal, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PinCardProps {
  imageUrl: string
  title: string
  username: string
  height: number
}

export function PinCard({ imageUrl, title, username, height }: PinCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-lg shadow-sm"
      style={{ height: `${height}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full h-full">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-200 ease-in-out"
          style={{
            transform: isHovered ? "scale(1.05)" : "scale(1)",
            filter: isHovered ? "brightness(0.9)" : "brightness(1)",
          }}
        />

        {isHovered && (
          <>
            <div className="absolute top-2 right-2 z-10">
              <Button variant="secondary" size="sm" className="rounded-full font-medium text-sm shadow-md">
                保存
              </Button>
            </div>

            <div className="absolute bottom-2 left-2 right-2 z-10 flex justify-between">
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm">
                  <Share2 className="w-4 h-4 text-gray-800" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm">
                  <MoreHorizontal className="w-4 h-4 text-gray-800" />
                </Button>
              </div>

              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm">
                  <MessageCircle className="w-4 h-4 text-gray-800" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm">
                  <Heart className="w-4 h-4 text-gray-800" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm">
        <h3 className="font-semibold text-sm line-clamp-1 text-gray-900">{title}</h3>
        <p className="text-xs text-gray-700 font-medium">@{username}</p>
      </div>
    </div>
  )
}