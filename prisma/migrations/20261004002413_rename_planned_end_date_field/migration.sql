/*
  Warnings:

  - You are about to drop the column `planned_end_datetime` on the `contracts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "planned_end_datetime",
ADD COLUMN     "planned_end_date" TIMESTAMP(3);
