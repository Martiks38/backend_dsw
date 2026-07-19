/*
  Warnings:

  - A unique constraint covering the columns `[documentType,documentNumber]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `members_documentType_documentNumber_key` ON `members`(`documentType`, `documentNumber`);
