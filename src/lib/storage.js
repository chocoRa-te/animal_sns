// src/lib/storage.js
// import { v4 as uuidv4 } from 'uuid';

// 画像をCloudinaryにアップロード（プログレス通知機能付き）
export const uploadImage = async (file, onProgress) => {
  try {
    // プログレス開始
    if (typeof onProgress === 'function') {
      onProgress(0);
    }

    const uploadPreset = 'ml_default';
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    console.log('Cloud Name:', cloudName);
    console.log('Upload Preset:', uploadPreset);

    // FormDataを作成
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    // プログレス更新
    if (typeof onProgress === 'function') {
      onProgress(25);
    }

    // Cloudinaryにアップロード
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    // プログレス更新
    if (typeof onProgress === 'function') {
      onProgress(75);
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary エラー詳細:', errorData)
      throw new Error(`アップロードに失敗しました: ${response.status} - ${errorData}`);
    }

    const result = await response.json();

    // プログレス完了
    if (typeof onProgress === 'function') {
      onProgress(100);
    }

    return {
      url: result.secure_url,
      path: result.public_id
    };
  } catch (error) {
    console.error('Cloudinaryアップロードエラー:', error);
    throw error;
  }
};

// 画像の削除（必要に応じて）
export const deleteImage = async (publicId) => {
  if (!publicId) return false;

  try {
    // サーバーサイドでの削除が必要（API secretが必要なため）
    const response = await fetch('/api/delete-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    return response.ok;
  } catch (error) {
    console.error('画像削除エラー:', error);
    return false;
  }
};