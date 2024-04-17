-- CreateTable
CREATE TABLE "Shoe" (
    "title" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "outerMaterial" TEXT NOT NULL,
    "innerMaterial" TEXT NOT NULL,

    CONSTRAINT "Shoe_pkey" PRIMARY KEY ("id")
);
