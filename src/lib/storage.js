// src/lib/storage.js
import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// 画像をアップロード（プログレス通知機能付き）
export const uploadImage = async (file, onProgress = null) => {
  try {
    // ファイル名から拡張子を抽出
    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : 'jpg';
    
    // ユニークなファイル名を生成
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `pins/${fileName}`;
    
    // Storageの参照を作成
    const storageRef = ref(storage, filePath);
    
    // アップロードタスクの作成
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Promise化して結果を待つ
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 進捗状況を計算（0-100%）
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload progress: ' + progress.toFixed(1) + '%');
          
          // onProgressが関数として渡されていれば呼び出す
          if (typeof onProgress === 'function') {
            onProgress(progress);
          }
        },
        (error) => {
          // エラーハンドリング
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          // アップロード完了時
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({
              url: downloadURL,
              path: filePath
            });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw error;
  }
};

// 画像の削除（必要に応じて）
export const deleteImage = async (path) => {
  if (!path) return false;
  
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};