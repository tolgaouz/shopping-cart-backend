import express, { Request, Response } from "express";
import shoesRouter from "./shoes";

const router = express.Router();

import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

router.use("/shoes", shoesRouter);

export default router;
