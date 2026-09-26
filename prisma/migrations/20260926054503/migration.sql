/*
  Warnings:

  - A unique constraint covering the columns `[registration_number]` on the table `boats` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "boats_registration_number_key" ON "boats"("registration_number");
