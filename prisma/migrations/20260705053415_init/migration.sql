-- CreateTable
CREATE TABLE `boats` (
    `hin` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `boatTypeId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `boats_publicId_key`(`publicId`),
    PRIMARY KEY (`hin`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activities` (
    `activityId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `boatTypeId` INTEGER NOT NULL,

    UNIQUE INDEX `activities_publicId_key`(`publicId`),
    PRIMARY KEY (`activityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boat_types` (
    `boatTypeId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `requiredOperation` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`boatTypeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boat_departures` (
    `exitedAt` DATETIME(3) NOT NULL,
    `boatId` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `estimatedReturnDatetime` DATETIME(3) NOT NULL,
    `realReturnDatetime` DATETIME(3) NULL,

    UNIQUE INDEX `boat_departures_publicId_key`(`publicId`),
    PRIMARY KEY (`exitedAt`, `boatId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cradles` (
    `cradleId` INTEGER NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `cradleCode` VARCHAR(191) NOT NULL,
    `sizeCategory` ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
    `isOccupied` BOOLEAN NOT NULL,
    `cradleCategoryId` INTEGER NOT NULL,

    PRIMARY KEY (`cradleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cradle_categories` (
    `cradleCategoryId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `hierarchyLevel` INTEGER NOT NULL,

    PRIMARY KEY (`cradleCategoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cradle_tariffs` (
    `cradleCategoryId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `monthlyPrice` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`startDate`, `cradleCategoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `startDatetime` DATETIME(3) NOT NULL,
    `boatId` INTEGER NOT NULL,
    `endDatetime` DATETIME(3) NULL,
    `cradleId` INTEGER NOT NULL,

    PRIMARY KEY (`startDatetime`, `boatId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `userId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isEmployee` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `users_publicId_key`(`publicId`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `userId` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `employeeNumber` INTEGER NOT NULL,
    `employeeType` VARCHAR(191) NOT NULL,
    `licenseNumber` VARCHAR(191) NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `userId` INTEGER NOT NULL,
    `documentType` VARCHAR(191) NULL,
    `documentNumber` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `businessName` VARCHAR(191) NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees_activities` (
    `employeeId` INTEGER NOT NULL,
    `activityId` INTEGER NOT NULL,

    PRIMARY KEY (`employeeId`, `activityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `courses` (
    `courseId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `activityId` INTEGER NOT NULL,
    `employeeId` INTEGER NOT NULL,

    UNIQUE INDEX `courses_publicId_key`(`publicId`),
    PRIMARY KEY (`courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_schedules` (
    `weekday` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `courseId` INTEGER NOT NULL,

    PRIMARY KEY (`weekday`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_prices` (
    `startDate` DATETIME(3) NOT NULL,
    `enrollmentPrice` DECIMAL(65, 30) NOT NULL,
    `installmentPrice` DECIMAL(65, 30) NOT NULL,
    `courseId` INTEGER NOT NULL,

    PRIMARY KEY (`startDate`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enrollments` (
    `memberId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `registered_at` DATETIME(3) NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'DROPPED') NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (`memberId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `installments` (
    `installmentId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `paymentDate` DATETIME(3) NOT NULL,
    `installmentStatus` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    `installmentType` ENUM('ENROLLMENT', 'CRADLE_RENTAL') NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `userId` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `startDatetime` DATETIME(3) NOT NULL,
    `boatId` INTEGER NOT NULL,

    UNIQUE INDEX `installments_publicId_key`(`publicId`),
    PRIMARY KEY (`installmentId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `boats` ADD CONSTRAINT `boats_boatTypeId_fkey` FOREIGN KEY (`boatTypeId`) REFERENCES `boat_types`(`boatTypeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boats` ADD CONSTRAINT `boats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `members`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activities` ADD CONSTRAINT `activities_boatTypeId_fkey` FOREIGN KEY (`boatTypeId`) REFERENCES `boat_types`(`boatTypeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boat_departures` ADD CONSTRAINT `boat_departures_boatId_fkey` FOREIGN KEY (`boatId`) REFERENCES `boats`(`hin`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cradles` ADD CONSTRAINT `cradles_cradleCategoryId_fkey` FOREIGN KEY (`cradleCategoryId`) REFERENCES `cradle_categories`(`cradleCategoryId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cradle_tariffs` ADD CONSTRAINT `cradle_tariffs_cradleCategoryId_fkey` FOREIGN KEY (`cradleCategoryId`) REFERENCES `cradle_categories`(`cradleCategoryId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_boatId_fkey` FOREIGN KEY (`boatId`) REFERENCES `boats`(`hin`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_cradleId_fkey` FOREIGN KEY (`cradleId`) REFERENCES `cradles`(`cradleId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees_activities` ADD CONSTRAINT `employees_activities_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `employees`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees_activities` ADD CONSTRAINT `employees_activities_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `activities`(`activityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `courses` ADD CONSTRAINT `courses_employeeId_activityId_fkey` FOREIGN KEY (`employeeId`, `activityId`) REFERENCES `employees_activities`(`employeeId`, `activityId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_schedules` ADD CONSTRAINT `course_schedules_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_prices` ADD CONSTRAINT `course_prices_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `members`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `installments` ADD CONSTRAINT `installments_userId_courseId_fkey` FOREIGN KEY (`userId`, `courseId`) REFERENCES `enrollments`(`memberId`, `courseId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `installments` ADD CONSTRAINT `installments_startDatetime_boatId_fkey` FOREIGN KEY (`startDatetime`, `boatId`) REFERENCES `contracts`(`startDatetime`, `boatId`) ON DELETE RESTRICT ON UPDATE CASCADE;
