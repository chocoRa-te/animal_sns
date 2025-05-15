"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Bell, MessageCircle, User, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function CreatePage() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      
      // プレビュー画像を生成
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // ドラッグ&ドロップ処理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      
      // プレビュー画像を生成
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // プレビューをクリア
  const clearPreview = () => {
    setSelectedFile(null)
    setPreview(null)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="container flex items-center h-16 px-4 mx-auto">
          <Link href="/" className="flex items-center mr-4">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
          </Link>

          <Link href="/">
            <Button variant="ghost" className="mr-2 rounded-full">
              ホーム
            </Button>
          </Link>
          <Button variant="secondary" className="mr-2 rounded-full">
            作成
          </Button>

          <div className="relative flex-1 mx-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <Input className="pl-10 bg-gray-100 border-none rounded-full" placeholder="検索" />
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6">新しいピンを作成</h1>
          
          <div className="space-y-6">
            {/* 画像アップロード */}
            {preview ? (
              <div className="relative mb-4">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="w-full h-auto rounded-lg"
                />
                <Button 
                  variant="secondary" 
                  className="absolute top-2 right-2 rounded-full"
                  onClick={clearPreview}
                >
                  変更
                </Button>
              </div>
            ) : (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  dragActive ? "border-red-500 bg-red-50" : "border-gray-300"
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">画像をドラッグ&ドロップ</p>
                <p className="text-sm text-gray-500 mb-4">または</p>
                <label className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full cursor-pointer">
                  デバイスから選択
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-4 text-xs text-gray-500">
                  推奨: 高画質の .jpg ファイル、20MB以下
                </p>
              </div>
            )}
            
            {/* タイトル */}
            <div>
              <label className="block text-sm font-medium mb-2">タイトル</label>
              <Input 
                placeholder="魅力的なタイトルを追加"
                className="w-full"
              />
            </div>
            
            {/* 説明 */}
            <div>
              <label className="block text-sm font-medium mb-2">説明</label>
              <textarea
                placeholder="ピンについて詳しく説明しましょう"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
              />
            </div>
            
            {/* 保存ボタン */}
            <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
              ピンを保存
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}