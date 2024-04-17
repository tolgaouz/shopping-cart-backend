import { PrismaClient, Shoe } from "@prisma/client";

const prisma = new PrismaClient();

const getMaterial = (materialText: string) => {
  const words = materialText.split(" ");
  if (words.length > 1) return null;
  return words[0];
};

async function main() {
  // Read shoes data from ./data/shoes.json
  const shoesData = require("./data/shoes.json");
  // Insert each shoe into the database
  const processed: Shoe[] = [];
  for (const shoe of shoesData) {
    try {
      if (processed.length === 5000) break;
      const outerMaterial = getMaterial(
        shoe.features.find((f: Record<string, string>) => f["Outer Material"])[
          "Outer Material"
        ]
      );
      const innerMaterial = getMaterial(
        shoe.features.find((f: Record<string, string>) => f["Inner Material"])[
          "Inner Material"
        ]
      );
      const brand = shoe.brand;
      const image = shoe.images_list[0];
      const price = Math.floor(
        Number(shoe.price.split(" - ")[0].replace("£", "")) * 100
      );
      if (isNaN(price) || !outerMaterial || !innerMaterial || !image || !brand)
        continue;
      const shoeData: Shoe = {
        title: shoe.title,
        id: shoe.asin,
        price,
        outerMaterial,
        innerMaterial,
        brand,
        stock: null,
        image: shoe.images_list[0],
      };
      processed.push(shoeData);
    } catch (e) {
      continue;
    }
  }

  await prisma.shoe.createMany({ data: processed });
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
