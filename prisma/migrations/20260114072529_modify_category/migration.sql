/*
  Warnings:

  - You are about to drop the column `colorInfo` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productCode]` on the table `ProductColor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productCode` to the `ProductColor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Category` ADD COLUMN `parentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Product` DROP COLUMN `colorInfo`;

-- AlterTable
ALTER TABLE `ProductColor` ADD COLUMN `colorInfo` VARCHAR(191) NULL,
    ADD COLUMN `productCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ProductColor_productCode_key` ON `ProductColor`(`productCode`);

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
