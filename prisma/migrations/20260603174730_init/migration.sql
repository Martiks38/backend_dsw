-- CreateTable
CREATE TABLE `Late_fee_policy` (
    `days_from` INTEGER NOT NULL,
    `percentage` INTEGER NOT NULL,

    PRIMARY KEY (`days_from`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Boat` (
    `hin` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `idBoatType` INTEGER NOT NULL,

    UNIQUE INDEX `Boat_publicId_key`(`publicId`),
    PRIMARY KEY (`hin`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Activity` (
    `id` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `idBoatType` INTEGER NOT NULL,

    UNIQUE INDEX `Activity_publicId_key`(`publicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Boat_type` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `requiredOperation` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sector` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `operationType` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Departure` (
    `idBoat` INTEGER NOT NULL,
    `departureTime` DATETIME(3) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `estimatedReturnTime` DATETIME(3) NOT NULL,
    `actualReturnTime` DATETIME(3) NULL,

    UNIQUE INDEX `Departure_publicId_key`(`publicId`),
    PRIMARY KEY (`departureTime`, `idBoat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Boat_slip` (
    `id` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,
    `state` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`, `idSector`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Boat_slip_price` (
    `startTime` DATETIME(3) NOT NULL,
    `idBoatSlip` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `quotaAmount` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`startTime`, `idBoatSlip`, `idSector`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Boat_has_boat_slip` (
    `startTime` DATETIME(3) NOT NULL,
    `idBoat` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `endDateTime` DATETIME(3) NULL,
    `idBoatSlip` INTEGER NOT NULL,
    `idSector` INTEGER NOT NULL,

    UNIQUE INDEX `Boat_has_boat_slip_publicId_key`(`publicId`),
    PRIMARY KEY (`startTime`, `idBoat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contract_quota` (
    `id` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `period` DATETIME(3) NOT NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `idBoat` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `state` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Contract_quota_publicId_key`(`publicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contract_quota_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentDate` DATETIME(3) NULL,
    `amountPaid` DECIMAL(65, 30) NULL,
    `quotaId` INTEGER NOT NULL,

    UNIQUE INDEX `Contract_quota_payment_quotaId_key`(`quotaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_publicId_key`(`publicId`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `userId` INTEGER NOT NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `employeeNumber` INTEGER NOT NULL,
    `employeeType` VARCHAR(191) NOT NULL,
    `licenseNumber` VARCHAR(191) NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `userId` INTEGER NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `documentNumber` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `businessName` VARCHAR(191) NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee_activity` (
    `idEmployee` INTEGER NOT NULL,
    `idActivity` INTEGER NOT NULL,

    PRIMARY KEY (`idEmployee`, `idActivity`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` INTEGER NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `idActivity` INTEGER NOT NULL,
    `idEmployee` INTEGER NOT NULL,

    UNIQUE INDEX `Course_publicId_key`(`publicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course_schedule` (
    `id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `idCourse` INTEGER NOT NULL,

    PRIMARY KEY (`id`, `idCourse`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course_price` (
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `enrollmentAmount` DECIMAL(65, 30) NOT NULL,
    `quotaAmount` DECIMAL(65, 30) NOT NULL,
    `idCourse` INTEGER NOT NULL,

    PRIMARY KEY (`startDate`, `idCourse`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollment` (
    `idMember` INTEGER NOT NULL,
    `idCourse` INTEGER NOT NULL,
    `enrollmentDate` DATETIME(3) NOT NULL,
    `state` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`idMember`, `idCourse`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course_quota` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `publicId` VARCHAR(191) NOT NULL,
    `period` DATETIME(3) NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `idMember` INTEGER NOT NULL,
    `idCourse` INTEGER NOT NULL,

    UNIQUE INDEX `Course_quota_publicId_key`(`publicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course_quota_payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentDate` DATETIME(3) NULL,
    `amountPaid` DECIMAL(65, 30) NULL,
    `quotaId` INTEGER NOT NULL,

    UNIQUE INDEX `Course_quota_payment_quotaId_key`(`quotaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Boat_typeToSector` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Boat_typeToSector_AB_unique`(`A`, `B`),
    INDEX `_Boat_typeToSector_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Boat` ADD CONSTRAINT `Boat_idBoatType_fkey` FOREIGN KEY (`idBoatType`) REFERENCES `Boat_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_idBoatType_fkey` FOREIGN KEY (`idBoatType`) REFERENCES `Boat_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Departure` ADD CONSTRAINT `Departure_idBoat_fkey` FOREIGN KEY (`idBoat`) REFERENCES `Boat`(`hin`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boat_slip` ADD CONSTRAINT `Boat_slip_idSector_fkey` FOREIGN KEY (`idSector`) REFERENCES `Sector`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boat_slip_price` ADD CONSTRAINT `Boat_slip_price_idBoatSlip_idSector_fkey` FOREIGN KEY (`idBoatSlip`, `idSector`) REFERENCES `Boat_slip`(`id`, `idSector`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boat_has_boat_slip` ADD CONSTRAINT `Boat_has_boat_slip_idBoat_fkey` FOREIGN KEY (`idBoat`) REFERENCES `Boat`(`hin`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Boat_has_boat_slip` ADD CONSTRAINT `Boat_has_boat_slip_idBoatSlip_idSector_fkey` FOREIGN KEY (`idBoatSlip`, `idSector`) REFERENCES `Boat_slip`(`id`, `idSector`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract_quota` ADD CONSTRAINT `Contract_quota_startDateTime_idBoat_fkey` FOREIGN KEY (`startDateTime`, `idBoat`) REFERENCES `Boat_has_boat_slip`(`startTime`, `idBoat`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contract_quota_payment` ADD CONSTRAINT `Contract_quota_payment_quotaId_fkey` FOREIGN KEY (`quotaId`) REFERENCES `Contract_quota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee_activity` ADD CONSTRAINT `Employee_activity_idEmployee_fkey` FOREIGN KEY (`idEmployee`) REFERENCES `Employee`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee_activity` ADD CONSTRAINT `Employee_activity_idActivity_fkey` FOREIGN KEY (`idActivity`) REFERENCES `Activity`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_idEmployee_idActivity_fkey` FOREIGN KEY (`idEmployee`, `idActivity`) REFERENCES `Employee_activity`(`idEmployee`, `idActivity`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course_schedule` ADD CONSTRAINT `Course_schedule_idCourse_fkey` FOREIGN KEY (`idCourse`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course_price` ADD CONSTRAINT `Course_price_idCourse_fkey` FOREIGN KEY (`idCourse`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_idCourse_fkey` FOREIGN KEY (`idCourse`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_idMember_fkey` FOREIGN KEY (`idMember`) REFERENCES `Member`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course_quota` ADD CONSTRAINT `Course_quota_idMember_idCourse_fkey` FOREIGN KEY (`idMember`, `idCourse`) REFERENCES `Enrollment`(`idMember`, `idCourse`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Course_quota_payment` ADD CONSTRAINT `Course_quota_payment_quotaId_fkey` FOREIGN KEY (`quotaId`) REFERENCES `Course_quota`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Boat_typeToSector` ADD CONSTRAINT `_Boat_typeToSector_A_fkey` FOREIGN KEY (`A`) REFERENCES `Boat_type`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Boat_typeToSector` ADD CONSTRAINT `_Boat_typeToSector_B_fkey` FOREIGN KEY (`B`) REFERENCES `Sector`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
