-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "requireFollowApproval" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("allowDMRequests", "bio", "commentsEnabled", "createdAt", "email", "emailVerified", "id", "image", "isPrivate", "name", "notificationsOn", "password", "showActivity", "showLikeCount", "showReadReceipt", "updatedAt") SELECT "allowDMRequests", "bio", "commentsEnabled", "createdAt", "email", "emailVerified", "id", "image", "isPrivate", "name", "notificationsOn", "password", "showActivity", "showLikeCount", "showReadReceipt", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
