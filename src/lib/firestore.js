// src/lib/firestore.js
import { db } from './firebase';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

// ユーザー関連の関数
export const createUser = async (userId, userData) => {
  await setDoc(doc(db, 'users', userId), {
    ...userData,
    createdAt: serverTimestamp()
  });
  return userId;
};

export const getUserById = async (userId) => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { 
    id: docSnap.id, 
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate() || new Date()
  } : null;
};

export const updateUser = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, userData);
  return userId;
};

// ピン関連の関数
export const createPin = async (pinData) => {
  try {
    const docRef = await addDoc(collection(db, 'pins'), {
      ...pinData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating pin:', error);
    throw error;
  }
};

export const getPins = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'pins'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Firestoreのタイムスタンプを標準のDate型に変換
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting pins:', error);
    throw error;
  }
};

export const getPinById = async (pinId) => {
  try {
    const docRef = doc(db, 'pins', pinId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { 
      id: docSnap.id, 
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date()
    } : null;
  } catch (error) {
    console.error('Error getting pin:', error);
    throw error;
  }
};

export const getUserPins = async (userId) => {
  try {
    const q = query(
      collection(db, 'pins'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting user pins:', error);
    throw error;
  }
};

export const deletePin = async (pinId) => {
  try {
    await deleteDoc(doc(db, 'pins', pinId));
    return pinId;
  } catch (error) {
    console.error('Error deleting pin:', error);
    throw error;
  }
};

// ボード関連の関数
export const createBoard = async (boardData) => {
  try {
    const docRef = await addDoc(collection(db, 'boards'), {
      ...boardData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating board:', error);
    throw error;
  }
};

export const getUserBoards = async (userId) => {
  try {
    const q = query(
      collection(db, 'boards'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting user boards:', error);
    throw error;
  }
};

export const getBoardById = async (boardId) => {
  try {
    const docRef = doc(db, 'boards', boardId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { 
      id: docSnap.id, 
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date()
    } : null;
  } catch (error) {
    console.error('Error getting board:', error);
    throw error;
  }
};

export const updateBoard = async (boardId, boardData) => {
  try {
    const boardRef = doc(db, 'boards', boardId);
    await updateDoc(boardRef, boardData);
    return boardId;
  } catch (error) {
    console.error('Error updating board:', error);
    throw error;
  }
};

export const deleteBoard = async (boardId) => {
  try {
    await deleteDoc(doc(db, 'boards', boardId));
    return boardId;
  } catch (error) {
    console.error('Error deleting board:', error);
    throw error;
  }
};

// コメント関連の関数
export const addComment = async (commentData) => {
  try {
    const docRef = await addDoc(collection(db, 'comments'), {
      ...commentData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const getPinComments = async (pinId) => {
  try {
    const q = query(
      collection(db, 'comments'),
      where('pinId', '==', pinId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting pin comments:', error);
    throw error;
  }
};

// いいね関連の関数
export const toggleLike = async (userId, pinId) => {
  try {
    const likeId = `${userId}_${pinId}`;
    const likeRef = doc(db, 'likes', likeId);
    const likeDoc = await getDoc(likeRef);
    
    if (likeDoc.exists()) {
      // いいねを削除
      await deleteDoc(likeRef);
      return { action: 'unlike', likeId };
    } else {
      // いいねを追加
      await setDoc(likeRef, {
        userId,
        pinId,
        createdAt: serverTimestamp()
      });
      return { action: 'like', likeId };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

export const getLikesForPin = async (pinId) => {
  try {
    const q = query(
      collection(db, 'likes'),
      where('pinId', '==', pinId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
  } catch (error) {
    console.error('Error getting likes for pin:', error);
    throw error;
  }
};

export const checkIfUserLikedPin = async (userId, pinId) => {
  try {
    const likeId = `${userId}_${pinId}`;
    const likeRef = doc(db, 'likes', likeId);
    const likeDoc = await getDoc(likeRef);
    return likeDoc.exists();
  } catch (error) {
    console.error('Error checking if user liked pin:', error);
    throw error;
  }
};