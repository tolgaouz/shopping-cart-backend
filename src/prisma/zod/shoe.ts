import * as z from "zod";

export const shoeModel = z.object({
  title: z.string(),
  id: z.string(),
  price: z.number().int(),
  image: z.string(),
  brand: z.string(),
  outerMaterial: z.string(),
  innerMaterial: z.string(),
  stock: z.number().int().nullish(),
});
