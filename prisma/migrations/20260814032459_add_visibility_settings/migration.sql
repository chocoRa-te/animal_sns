-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Album" ("createdAt", "id", "title", "updatedAt", "userId") SELECT "createdAt", "id", "title", "updatedAt", "userId" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE TABLE "new_Pin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT DEFAULT 'その他',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "videoUrl" TEXT,
    "type" TEXT NOT NULL DEFAULT 'image',
    "userId" TEXT NOT NULL,
    "boardId" TEXT,
    CONSTRAINT "Pin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pin_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pin" ("boardId", "category", "createdAt", "description", "id", "imageUrl", "title", "type", "updatedAt", "userId", "videoUrl") SELECT "boardId", "category", "createdAt", "description", "id", "imageUrl", "title", "type", "updatedAt", "userId", "videoUrl" FROM "Pin";
DROP TABLE "Pin";
ALTER TABLE "new_Pin" RENAME TO "Pin";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "showLikeCount" BOOLEAN NOT NULL DEFAULT false,
    "notificationsOn" BOOLEAN NOT NULL DEFAULT true,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "bio" TEXT,
    "showActivity" BOOLEAN NOT NULL DEFAULT true,
    "commentsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showReadReceipt" BOOLEAN NOT NULL DEFAULT true,
    "allowDMRequests" BOOLEAN NOT NULL DEFAULT true,
    "requireFollowApproval" BOOLEAN NOT NULL DEFAULT false,
    "defaultPostVisibility" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("allowDMRequests", "bio", "commentsEnabled", "createdAt", "email", "emailVerified", "id", "image", "isPrivate", "name", "notificationsOn", "password", "requireFollowApproval", "showActivity", "showLikeCount", "showReadReceipt", "updatedAt") SELECT "allowDMRequests", "bio", "commentsEnabled", "createdAt", "email", "emailVerified", "id", "image", "isPrivate", "name", "notificationsOn", "password", "requireFollowApproval", "showActivity", "showLikeCount", "showReadReceipt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
