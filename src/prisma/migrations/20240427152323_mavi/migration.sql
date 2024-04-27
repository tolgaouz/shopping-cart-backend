/*
  Warnings:

  - You are about to drop the `Shoe` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Shoe";

-- CreateTable
CREATE TABLE "Shirt" (
    "title" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "stock" INTEGER DEFAULT 5,

    CONSTRAINT "Shirt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shirt_title_idx" ON "Shirt"("title");

-- CreateIndex
CREATE INDEX "Shirt_material_idx" ON "Shirt"("material");

-- CreateIndex
CREATE INDEX "Shirt_color_idx" ON "Shirt"("color");
