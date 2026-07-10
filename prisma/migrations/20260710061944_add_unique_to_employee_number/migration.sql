/*
  Warnings:

  - A unique constraint covering the columns `[employeeNumber]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `employees_employeeNumber_key` ON `employees`(`employeeNumber`);
