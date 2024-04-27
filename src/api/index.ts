import express from "express";
import shirtsRouter from "./shirts";
import checkoutRouter from "./checkout";

const router = express.Router();

import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

router.use("/shirts", ClerkExpressRequireAuth(), shirtsRouter);
router.use("/checkout", ClerkExpressRequireAuth(), checkoutRouter);

export default router;
