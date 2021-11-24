-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `hashId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_hashId_key`(`hashId`),
    INDEX `User_hashId_idx`(`hashId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bookmark` (
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `db` ENUM('licitatii', 'achizitii') NOT NULL DEFAULT 'licitatii',
    `contractId` INTEGER NOT NULL,

    INDEX `Bookmark_contractId_idx`(`contractId`),
    INDEX `Bookmark_userId_idx`(`userId`),
    INDEX `Bookmark_db_idx`(`db`),
    UNIQUE INDEX `Bookmark_userId_contractId_db_key`(`userId`, `contractId`, `db`),
    PRIMARY KEY (`userId`, `contractId`, `db`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `db` ENUM('licitatii', 'achizitii') NOT NULL DEFAULT 'licitatii',
    `contractId` INTEGER NOT NULL,
    `confidence` INTEGER NOT NULL,
    `comment` VARCHAR(191) NOT NULL,

    INDEX `Report_id_userId_contractId_idx`(`id`, `userId`, `contractId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
