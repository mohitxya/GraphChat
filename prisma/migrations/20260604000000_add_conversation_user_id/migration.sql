ALTER TABLE "conversations"
ADD COLUMN "userId" TEXT NOT NULL DEFAULT 'legacy_local_user';

CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");
