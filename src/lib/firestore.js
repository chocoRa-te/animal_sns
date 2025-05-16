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
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const updateUser = async (userId, userData) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, userData);
  return userId;
};

// ピン関連の関数
export const createPin = async (pinData) => {
  const docRef = await addDoc(collection(db, 'pins'), {
    ...pinData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getPins = async (limitCount = 20) => {
  const q = query(
    collection(db, 'pins'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getPinById = async (pinId) => {
  const docRef = doc(db, 'pins', pinId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const getUserPins = async (userId) => {
  const q = query(
    collection(db, 'pins'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const deletePin = async (pinId) => {
  await deleteDoc(doc(db, 'pins', pinId));
  return pinId;
};

// ボード関連の関数
export const createBoard = async (boardData) => {
  const docRef = await addDoc(collection(db, 'boards'), {
    ...boardData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getUserBoards = async (userId) => {
  const q = query(
    collection(db, 'boards'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getBoardById = async (boardId) => {
  const docRef = doc(db, 'boards', boardId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const updateBoard = async (boardId, boardData) => {
  const boardRef = doc(db, 'boards', boardId);
  await updateDoc(boardRef, boardData);
  return boardId;
};

export const deleteBoard = async (boardId) => {
  await deleteDoc(doc(db, 'boards', boardId));
  return boardId;
};

// コメント関連の関数
export const addComment = async (commentData) => {
  const docRef = await addDoc(collection(db, 'comments'), {
    ...commentData,
    createdAt: serverTimestamp()
  });
  return docRef.id;
};

export const getPinComments = async (pinId) => {
  const q = query(
    collection(db, 'comments'),
    where('pinId', '==', pinId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};