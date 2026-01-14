/*
  Warnings:

  - A unique constraint covering the columns `[parentId,path]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `path` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Category_name_key` ON `Category`;

-- AlterTable
ALTER TABLE `Category` ADD COLUMN `path` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Category_parentId_path_key` ON `Category`(`parentId`, `path`);
