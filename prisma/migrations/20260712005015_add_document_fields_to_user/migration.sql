/*
  Warnings:

  - You are about to drop the column `documentNumber` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `members` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[documentType,documentNumber]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `documentNumber` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documentType` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `members_documentType_documentNumber_key` ON `members`;

-- AlterTable
ALTER TABLE `members` DROP COLUMN `documentNumber`,
    DROP COLUMN `documentType`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `documentNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `documentType` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_documentType_documentNumber_key` ON `users`(`documentType`, `documentNumber`);
