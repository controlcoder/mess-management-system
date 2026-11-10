import { Router } from "express";
import { z } from "zod";
import { Branch, Gender, Hostel, Role } from "@prisma/client";
import { comparePassword, hashPassword, signToken } from "../utils/auth.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const BRANCHES = Object.values(Branch);

const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(3)
});

const registerSchema = z.object({
  rollNumber: z.string().trim().min(6).max(20),
  fullName: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(72),
  gender: z.nativeEnum(Gender),
  hostel: z.nativeEnum(Hostel).optional(),
  branch: z.nativeEnum(Branch).optional(),
  batchYear: z.coerce.number().int().min(2000).max(2100).optional()
});


function toPublicUser(user) {
  return {
    id: user.id,
    role: user.role,
    rollNumber: user.rollNumber,
    username: user.username,
    pointsBalance: user.pointsBalance,
    studentProfile: user.studentProfile
  };
}

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid login payload.",
      errors: parsed.error.flatten()
    });
  }

  const identifier = parsed.data.identifier.toLowerCase();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { rollNumber: identifier },
        { username: identifier }
      ]
    },
    include: {
      studentProfile: true
    }
  });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const isValidPassword = await comparePassword(parsed.data.password, user.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: toPublicUser(user)
  });
});

router.post("/register", async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid signup details. Check name, roll number, and password.",
      errors: parsed.error.flatten()
    });
  }

  const parsedRoll = parsed.data;
  const branch = parsed.data.branch || parsedRoll.branch;
  const batchYear = parsed.data.batchYear || parsedRoll.batchYear;
  const serial = parsedRoll.serial || Number(parsedRoll.rollNumber.replace(/\D/g, "").slice(-4)) || 1;
  const gender = parsed.data.gender;
  const hostel = parsed.data.hostel || (gender === Gender.FEMALE ? Hostel.GIRLS : Hostel.BOYS);

  if (!branch || !BRANCHES.includes(branch) || !batchYear) {
    return res.status(400).json({
      message: "Use a roll number like 25cse1045, or also provide branch and batch year."
    });
  }

  const existing = await prisma.user.findUnique({
    where: { rollNumber: parsedRoll.rollNumber }
  });

  if (existing) {
    return res.status(409).json({
      message: "An account with this roll number already exists. Please sign in."
    });
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        rollNumber: parsedRoll.rollNumber,
        passwordHash,
        role: Role.STUDENT,
        studentProfile: {
          create: {
            fullName: parsed.data.fullName,
            batchYear,
            branch,
            serial,
            gender,
            hostel,
            messName: hostel === Hostel.GIRLS ? "Girls Hostel Mess" : "Boys Hostel Mess"
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message: "An account with this roll number already exists. Please sign in."
      });
    }

    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { studentProfile: true }
  });

  return res.json({
    user: toPublicUser(user)
  });
});

export default router;
