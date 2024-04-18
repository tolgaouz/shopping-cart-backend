import express from "express";
import shoesRouter from "./shoes";
import checkoutRouter from "./checkout";

const router = express.Router();

import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

router.use("/shoes", ClerkExpressRequireAuth(), shoesRouter);
router.use("/checkout", ClerkExpressRequireAuth(), checkoutRouter);

export default router;
