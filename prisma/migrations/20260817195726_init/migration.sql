-- CreateTable
CREATE TABLE `boats` (
    `boatId` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `boatTypeId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `boats_publicId_key`(`publicId`),
    PRIMARY KEY (`boatId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boat_types` (
    `boatTypeId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `requiredOperation` ENUM('MANUAL', 'AUTOMATIC') NOT NULL,

    PRIMARY KEY (`boatTypeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boat_departures` (
    `exitedAt` DATETIME(3) NOT NULL,
    `boatId` INTEGER NOT NULL,
    `estimatedReturnDatetime` DATETIME(3) NOT NULL,
    `realReturnDatetime` DATETIME(3) NULL,
    `serviceRequestId` INTEGER NOT NULL,

    UNIQUE INDEX `boat_departures_serviceRequestId_key`(`serviceRequestId`),
    PRIMARY KEY (`exitedAt`, `boatId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cradles` (
    `cradleId` INTEGER NOT NULL AUTO_INCREMENT,
    `state` VARCHAR(191) NOT NULL,
    `cradleCode` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`cradleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `contractId` INTEGER NOT NULL AUTO_INCREMENT,
    `startDatetime` DATETIME(3) NOT NULL,
    `boatId` INTEGER NOT NULL,
    `endDatetime` DATETIME(3) NULL,
    `cradleId` INTEGER NOT NULL,

    PRIMARY KEY (`contractId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `userId` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `documentNumber` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isEmployee` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `users_publicId_key`(`publicId`),
    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_documentType_documentNumber_key`(`documentType`, `documentNumber`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employees` (
    `userId` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `employeeNumber` VARCHAR(191) NOT NULL,
    `employeeType` ENUM('ADMIN', 'OPERATOR') NOT NULL,

    UNIQUE INDEX `employees_employeeNumber_key`(`employeeNumber`),
    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `userId` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `businessName` VARCHAR(191) NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `password_reset_token_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(191) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    PRIMARY KEY (`password_reset_token_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_requests` (
    `serviceRequestId` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `requestedDatetime` DATETIME(3) NOT NULL,
    `observations` VARCHAR(191) NULL,
    `internalComment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `service_type_id` INTEGER NOT NULL,
    `requested_by_user_id` INTEGER NOT NULL,
    `assigned_employee_id` INTEGER NOT NULL,
    `boatId` INTEGER NOT NULL,

    PRIMARY KEY (`serviceRequestId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_types` (
    `serviceTypeId` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`serviceTypeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `boats` ADD CONSTRAINT `boats_boatTypeId_fkey` FOREIGN KEY (`boatTypeId`) REFERENCES `boat_types`(`boatTypeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boats` ADD CONSTRAINT `boats_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `members`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boat_departures` ADD CONSTRAINT `boat_departures_boatId_fkey` FOREIGN KEY (`boatId`) REFERENCES `boats`(`boatId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boat_departures` ADD CONSTRAINT `boat_departures_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `service_requests`(`serviceRequestId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_boatId_fkey` FOREIGN KEY (`boatId`) REFERENCES `boats`(`boatId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_cradleId_fkey` FOREIGN KEY (`cradleId`) REFERENCES `cradles`(`cradleId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employees` ADD CONSTRAINT `employees_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_service_type_id_fkey` FOREIGN KEY (`service_type_id`) REFERENCES `service_types`(`serviceTypeId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_requested_by_user_id_fkey` FOREIGN KEY (`requested_by_user_id`) REFERENCES `members`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_assigned_employee_id_fkey` FOREIGN KEY (`assigned_employee_id`) REFERENCES `employees`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_requests` ADD CONSTRAINT `service_requests_boatId_fkey` FOREIGN KEY (`boatId`) REFERENCES `boats`(`boatId`) ON DELETE RESTRICT ON UPDATE CASCADE;
