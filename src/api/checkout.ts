import { prisma } from "@/prisma";
import express from "express";
import { Stripe } from "stripe";
import { ZodError, z } from "zod";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Validate payment-sheet body
export const paymentSheetBodySchema = z.object({
  products: z.array(
    z.object({
      id: z.string(),
      quantity: z.number(),
    })
  ),
});

class OutOfStockError extends Error {
  constructor(productId: string) {
    super(`Product ${productId} is out of stock`);
  }
}

// Normally these operations would be carried over in a transactional
// execution window to ensure data integrity.
// e.g. if a product is out of stock, we should not allow the user to purchase it.
// This could easily happen when multiple users are trying to buy the same product with limited stock
router.post("/payment-sheet", async (req, res) => {
  try {
    const { products } = paymentSheetBodySchema.parse(req.body);
    // Check stock availability
    const productIds = products.map((product) => product.id);
    const productStock = await prisma.shirt.findMany({
      select: { id: true, stock: true },
      where: { id: { in: productIds } },
    });
    const productStockMap = productStock.reduce((acc, product) => {
      acc[product.id] = product.stock as number;
      return acc;
    }, {} as Record<string, number>);
    // Check if all products are in stock
    for (const product of products) {
      if (productStockMap[product.id] < product.quantity) {
        throw new OutOfStockError(product.id);
      }
    }
    // Use an existing Customer ID if this is a returning customer.
    const customer = await stripe.customers.create();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-04-10" }
    );
    // Fetch each product data from database and calculate the total amount
    // Only select the price field
    const productPrices = await prisma.shirt.findMany({
      select: { price: true, id: true },
      where: {
        id: {
          in: products.map((product) => product.id),
        },
      },
    });
    const amount = productPrices.reduce((total, product) => {
      const productData = products.find((p) => p.id === product.id);
      return total + product.price * (productData?.quantity || 0);
    }, 0);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customer.id,
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter
      // is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey:
        "pk_test_51P61EmAYZ52pP8QjxoHDV3esH7WrUo4QvACwwkhYlNWyhPKbUANGAMcOchzMou1yhDfLZtNP4ciNDX0pZK30ij0A00HWekhkeU",
    });
  } catch (error) {
    if (error instanceof OutOfStockError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof ZodError) {
      res.status(400).json({ error: error.flatten().fieldErrors });
    } else {
      res.status(500).json({ error: JSON.stringify(error) });
    }
  }
});

// Subtract stock from the database after a successful checkout session
// This should ideally be done in one of two ways:
// 1-) Use webhooks to listen to successful checkout events to subtract stock data
// 2-) Pass callback urls to stripe's onSuccess events to call this API URL
router.post("/success", async (req, res) => {
  const { products } = paymentSheetBodySchema.parse(req.body);
  // Subtract stock from the database
  for (const product of products) {
    await prisma.shirt.update({
      where: { id: product.id },
      data: { stock: { decrement: product.quantity } },
    });
  }
  res.json({ success: true });
});

export default router;
