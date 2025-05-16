"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Bell, MessageCircle, User, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { uploadImage } from "@/lib/storage"
import { createPin } from "@/lib/firestore"
import { auth } from "@/lib/firebase"

export default function CreatePage() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const router = useRouter()

  // ファイル選択処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      // ファイルサイズチェック (10MB以下に制限)
      if (file.size > 10 * 1024 * 1024) {
        setError("ファイルサイズは10MB以下にしてください")
        return
      }
      
      setSelectedFile(file)
      setError(null)
      
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
      
      // ファイルサイズチェック (10MB以下に制限)
      if (file.size > 10 * 1024 * 1024) {
        setError("ファイルサイズは10MB以下にしてください")
        return
      }
      
      setSelectedFile(file)
      setError(null)
      
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
    setUploadProgress(0)
  }
  
  // ピンを保存
  const handleSavePin = async () => {
    // 入力検証
    if (!selectedFile) {
      setError("画像を選択してください")
      return
    }
    
    if (!title.trim()) {
      setError("タイトルを入力してください")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      setUploadProgress(0)
      
      // 認証確認（オプション - ログインしていなければ匿名ユーザーとして扱う）
      const user = auth.currentUser
      const userId = user?.uid || 'anonymous'
      const username = user?.displayName || user?.email?.split('@')[0] || 'ゲストユーザー'
      
      // 画像をFirebase Storageにアップロード
      const onProgress = (progress: number) => {
        setUploadProgress(progress);
      };
      
      // 最大3回まで再試行するロジック
      let imageData;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          imageData = await uploadImage(selectedFile, onProgress);
          break; // 成功したらループを抜ける
        } catch (uploadError) {
          retryCount++;
          console.log(`アップロード試行 ${retryCount}/${maxRetries} 失敗`);
          
          if (retryCount >= maxRetries) {
            throw uploadError; // 最大試行回数を超えたらエラーをスロー
          }
          
          // 少し待ってから再試行
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // ランダムな高さ（300〜450px）- Pinterest風のマスリーレイアウト用
      const height = Math.floor(Math.random() * 150) + 300
      
      // Firestoreにピンデータを保存
      const pinData = {
        title,
        description,
        imageUrl: imageData.url,
        imagePath: imageData.path,
        userId,
        username,
        height,
        createdAt: new Date()
      }
      
      await createPin(pinData)
      
      // 保存成功後、ホームページにリダイレクト
      router.push('/')
      router.refresh() // データを再取得するためにページを更新
      
    } catch (err: any) {
      console.error('Error saving pin:', err)
      
      // エラーメッセージをより具体的に
      if (err.code === 'storage/retry-limit-exceeded') {
        setError("画像のアップロードに失敗しました。インターネット接続を確認して、もう一度お試しください。")
      } else if (err.code?.includes('storage/')) {
        setError(`ストレージエラー: ${err.message || 'ファイルのアップロードに失敗しました。'}`)
      } else {
        setError("エラーが発生しました。もう一度お試しください。")
      }
    } finally {
      setLoading(false)
    }
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
            <Button variant="ghost" className="mr-2 rounded-full font-medium text-gray-800">
              ホーム
            </Button>
          </Link>
          <Button variant="secondary" className="mr-2 rounded-full font-medium">
            作成
          </Button>

          <div className="relative flex-1 mx-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <Input className="pl-10 bg-gray-100 border-none rounded-full" placeholder="検索" />
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5 text-gray-700" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageCircle className="w-5 h-5 text-gray-700" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5 text-gray-700" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 mx-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">新しいピンを作成</h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md font-medium">
              {error}
            </div>
          )}
          
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
                  className="absolute top-2 right-2 rounded-full font-medium"
                  onClick={clearPreview}
                >
                  変更
                </Button>
                
                {/* アップロード中のプログレスバー */}
                {loading && uploadProgress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-200 rounded-b-lg overflow-hidden">
                    <div 
                      className="bg-red-600 h-1 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
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
                <Upload className="w-10 h-10 mx-auto mb-4 text-gray-500" />
                <p className="mb-2 text-gray-800 font-medium">画像をドラッグ&ドロップ</p>
                <p className="text-sm text-gray-700 font-medium mb-4">または</p>
                <label className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full cursor-pointer font-medium">
                  デバイスから選択
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-4 text-xs text-gray-700 font-medium">
                  推奨: 高画質の .jpg ファイル、10MB以下
                </p>
              </div>
            )}
            
            {/* タイトル */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">タイトル</label>
              <Input 
                placeholder="魅力的なタイトルを追加"
                className="w-full"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            {/* 説明 */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-800">説明</label>
              <textarea
                placeholder="ピンについて詳しく説明しましょう"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            {/* 保存ボタン */}
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium"
              onClick={handleSavePin}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  保存中...
                </span>
              ) : "ピンを保存"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}