/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordRequestedAt" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT,
ADD COLUMN     "resetPasswordUsedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "users"("resetPasswordToken");
