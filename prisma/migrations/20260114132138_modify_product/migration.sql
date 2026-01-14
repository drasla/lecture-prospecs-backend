/*
  Warnings:

  - Added the required column `gender` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `style` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Product` ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'COMMON') NOT NULL,
    ADD COLUMN `style` ENUM('RACING', 'LIGHTWEIGHT_RACING', 'STABILITY', 'CUSHION', 'TRAIL_RUNNING', 'LONG_PANTS', 'LONG_SLEEVE', 'DOWN', 'DOWN_VEST', 'LEGGINGS', 'SLEEVELESS', 'SHORT_PANTS', 'SHORT_SLEEVE', 'VEST', 'UNDERWEAR_TOP', 'JACKET', 'ZIPUP_LONG', 'TRAINING_TOP', 'TRAINING_BOTTOM', 'HOODIE', 'UNIFORM', 'BASEBALL_SHOE', 'AUTHENTIC_CAP') NOT NULL;
