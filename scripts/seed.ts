import { PrismaClient } from "@prisma/client";
import { Shirt } from "../data/types";
import { Shirt as PrismaShirt } from "@prisma/client";
import { randomInt } from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Read shirts data scraped from mavi and saved into ./data/products.json
  const shirtsData: Shirt[] = require("../data/products.json");
  // Insert each shoe into the database
  const processed: Omit<PrismaShirt, "id">[] = [];
  for (const shirt of shirtsData) {
    try {
      const shirtData: Omit<PrismaShirt, "id"> = {
        title: shirt.item_name,
        price: Number(shirt.price) * 100,
        material: shirt.item_category4,
        color: shirt.color,
        stock: randomInt(5, 10),
        image: shirt.images[0],
      };
      processed.push(shirtData);
    } catch (e) {
      continue;
    }
  }

  await prisma.shirt.createMany({ data: processed });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
