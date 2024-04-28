import express, { Response } from "express";
import { Prisma, PrismaClient, Shirt } from "@prisma/client";
import { z } from "zod";
import { shirtModel } from "@/prisma/zod/shirt";
import { prisma } from "@/prisma";

const router = express.Router();

export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  isLastPage: boolean;
}

export interface GetShirtsResponse {
  shirts: Shirt[];
  pagination: Pagination;
}

export interface GetShirtsErrorResponse {
  message: string;
}

router.get(
  "/",
  async (req, res: Response<GetShirtsResponse | GetShirtsErrorResponse>) => {
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      search,
      color,
      material,
      sortBy = "title",
      sortOrder = "asc",
    } = req.query;

    const where: Prisma.ShirtWhereInput = {};

    if (material) {
      where.material = material as string;
    }

    if (color) {
      where.color = color as string;
    }

    if (minPrice && maxPrice) {
      where.price = {
        gte: parseInt(minPrice as string),
        lte: parseInt(maxPrice as string),
      };
    } else if (minPrice) {
      where.price = {
        gte: parseInt(minPrice as string),
      };
    } else if (maxPrice) {
      where.price = {
        lte: parseInt(maxPrice as string),
      };
    }

    if (search) {
      where.title = {
        contains: search as string,
        mode: "insensitive",
      };
    }

    const queryOptions: Prisma.ShirtFindManyArgs = {
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      where,
      orderBy: {
        [sortBy as keyof Shirt]: sortOrder as Prisma.SortOrder,
      },
    };

    try {
      const [shirts, totalShirts] = await Promise.all([
        prisma.shirt.findMany(queryOptions),
        prisma.shirt.count({ where: queryOptions.where }),
      ]);
      const totalPages = Math.ceil(totalShirts / parseInt(limit as string));
      const isLastPage =
        totalPages !== 0
          ? Math.max(1, parseInt(page as string)) === totalPages
          : true;

      res.json({
        shirts,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages,
          isLastPage,
        },
      });
    } catch (error) {
      console.error("Failed to fetch shirts:", error);
      res.status(500).json({ message: "Failed to fetch shirts" });
    }
  }
);

router.get("/filters", async (req, res) => {
  try {
    const [colors, materials] = await Promise.all([
      prisma.shirt.findMany({
        select: {
          color: true,
        },
        distinct: ["color"],
      }),
      prisma.shirt.findMany({
        select: {
          material: true,
        },
        distinct: ["material"],
      }),
    ]);

    res.json({
      colors: colors.map((b) => b.color),
      materials: materials.map((m) => m.material),
    });
  } catch (error) {
    console.error("Failed to fetch filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// Route for creating a new shoe
router.post("/", async (req, res) => {
  try {
    // Validate shoe data using shirtModel zod schema
    const parsedData = shirtModel.parse({
      title: req.body.title,
      price: parseInt(req.body.price),
      image: req.body.image,
      color: req.body.color,
      material: req.body.material,
      stock: req.body.stock,
    });

    const newShoe = await prisma.shirt.create({
      data: parsedData,
    });
    res.json(newShoe);
  } catch (error) {
    console.error("Failed to create shoe:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid shirt data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create shirt" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.shirt.delete({
      where: { id },
    });
    res.json({ message: "Shirt deleted successfully" });
  } catch (error) {
    console.error("Failed to delete shirt:", error);
    res.status(500).json({ message: "Failed to delete shirt" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const partialData = shirtModel.partial().parse({
      title: req.body.title,
      price: req.body.price ? parseInt(req.body.price) : undefined,
      image: req.body.image,
      color: req.body.color,
      material: req.body.material,
      stock: req.body.stock,
    });

    const updatedShoe = await prisma.shirt.update({
      where: { id },
      data: partialData,
    });
    res.json(updatedShoe);
  } catch (error) {
    console.error("Failed to update shirt:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid shirt data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update shirt" });
  }
});

export default router;
