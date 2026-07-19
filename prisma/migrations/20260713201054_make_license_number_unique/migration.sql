/*
  Warnings:

  - A unique constraint covering the columns `[licenseNumber]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `employees_licenseNumber_key` ON `employees`(`licenseNumber`);
