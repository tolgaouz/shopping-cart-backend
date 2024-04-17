import express, { Response } from "express";
import { PrismaClient, Shoe } from "@prisma/client";
import { z } from "zod";
import { shoeModel } from "@/prisma/zod/shoe";

const prisma = new PrismaClient();

const router = express.Router();

export interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  isLastPage: boolean;
}

export interface GetShoesResponse {
  shoes: Shoe[];
  pagination: Pagination;
}

export interface GetShoesErrorResponse {
  message: string;
}

router.get(
  "/",
  async (req, res: Response<GetShoesResponse | GetShoesErrorResponse>) => {
    const {
      page = 1,
      limit = 10,
      outerMaterial,
      innerMaterial,
      brand,
      minPrice,
      maxPrice,
      search,
    } = req.query;

    let queryOptions: any = {
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      where: {},
      orderBy: {
        id: "asc",
      },
    };

    if (outerMaterial) {
      queryOptions.where.outerMaterial = outerMaterial;
    }

    if (innerMaterial) {
      queryOptions.where.innerMaterial = innerMaterial;
    }

    if (brand) {
      queryOptions.where.brand = brand;
    }

    if (minPrice && maxPrice) {
      queryOptions.where.price = {
        gte: parseInt(minPrice as string),
        lte: parseInt(maxPrice as string),
      };
    } else if (minPrice) {
      queryOptions.where.price = {
        gte: parseInt(minPrice as string),
      };
    } else if (maxPrice) {
      queryOptions.where.price = {
        lte: parseInt(maxPrice as string),
      };
    }

    if (search) {
      queryOptions.where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    try {
      const [shoes, totalShoes] = await Promise.all([
        prisma.shoe.findMany(queryOptions),
        prisma.shoe.count({ where: queryOptions.where }),
      ]);
      const totalPages = Math.ceil(totalShoes / parseInt(limit as string));
      const isLastPage = parseInt(page as string) === totalPages;

      res.json({
        shoes,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages,
          isLastPage,
        },
      });
    } catch (error) {
      console.error("Failed to fetch shoes:", error);
      res.status(500).json({ message: "Failed to fetch shoes" });
    }
  }
);

router.get("/filters", async (req, res) => {
  try {
    const [brands, outerMaterials, innerMaterials] = await Promise.all([
      prisma.shoe.findMany({
        select: {
          brand: true,
        },
        distinct: ["brand"],
      }),
      prisma.shoe.findMany({
        select: {
          outerMaterial: true,
        },
        distinct: ["outerMaterial"],
      }),
      prisma.shoe.findMany({
        select: {
          innerMaterial: true,
        },
        distinct: ["innerMaterial"],
      }),
    ]);

    res.json({
      brands: brands.map((b) => b.brand),
      outerMaterials: outerMaterials.map((om) => om.outerMaterial),
      innerMaterials: innerMaterials.map((im) => im.innerMaterial),
    });
  } catch (error) {
    console.error("Failed to fetch filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// Route for creating a new shoe
router.post("/", async (req, res) => {
  try {
    // Validate shoe data using shoeModel zod schema
    const parsedShoeData = shoeModel.parse({
      title: req.body.title,
      price: parseInt(req.body.price),
      image: req.body.image,
      brand: req.body.brand,
      outerMaterial: req.body.outerMaterial,
      innerMaterial: req.body.innerMaterial,
    });

    const newShoe = await prisma.shoe.create({
      data: parsedShoeData,
    });
    res.json(newShoe);
  } catch (error) {
    console.error("Failed to create shoe:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid shoe data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create shoe" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.shoe.delete({
      where: { id },
    });
    res.json({ message: "Shoe deleted successfully" });
  } catch (error) {
    console.error("Failed to delete shoe:", error);
    res.status(500).json({ message: "Failed to delete shoe" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const partialShoeData = shoeModel.partial().parse({
      title: req.body.title,
      price: req.body.price ? parseInt(req.body.price) : undefined,
      image: req.body.image,
      brand: req.body.brand,
      outerMaterial: req.body.outerMaterial,
      innerMaterial: req.body.innerMaterial,
    });

    const updatedShoe = await prisma.shoe.update({
      where: { id },
      data: partialShoeData,
    });
    res.json(updatedShoe);
  } catch (error) {
    console.error("Failed to update shoe:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Invalid shoe data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to update shoe" });
  }
});

export default router;
