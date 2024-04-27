import * as z from "zod";

export const shirtModel = z.object({
  title: z.string(),
  id: z.string(),
  price: z.number().int(),
  image: z.string(),
  material: z.string(),
  color: z.string(),
  stock: z.number().int().nullish(),
});
