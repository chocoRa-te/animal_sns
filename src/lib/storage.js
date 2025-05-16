// src/lib/storage.js
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// 画像のアップロード
export const uploadImage = async (file, folder = 'pins') => {
  try {
    // ファイル名を一意に生成
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;
    
    // Storageへの参照を作成
    const storageRef = ref(storage, filePath);
    
    // ファイルをアップロード
    await uploadBytes(storageRef, file);
    
    // ダウンロードURLを取得
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      url: downloadURL,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// 画像の削除
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