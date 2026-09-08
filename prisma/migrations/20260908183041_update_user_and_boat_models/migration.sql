/*
  Warnings:

  - You are about to drop the column `createdAt` on the `boats` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `boats` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - Added the required column `model` to the `boats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registration_number` to the `boats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
CREATE SEQUENCE boats_boat_id_seq;
ALTER TABLE "boats" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "registration_number" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "boat_id" SET DEFAULT nextval('boats_boat_id_seq');
ALTER SEQUENCE boats_boat_id_seq OWNED BY "boats"."boat_id";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
