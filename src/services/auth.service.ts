import { prisma } from "../db/prisma.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { AppError } from "../utils/app.error.js";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  clinicName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput) {
  const { name, email, password, clinicName } = input;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },
  });

  if (existingUser) {
    // throw new Error("User with this email already exists");
    throw new AppError("User with this email already exists", 409);
  }

  const passwordHash = await hashPassword(password);

  const slug = createClinicSlug(clinicName);

  const result = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        name: clinicName.trim(),
        slug,
      },
    });

    const user = await tx.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    const membership = await tx.clinicMember.create({
      data: {
        userId: user.id,
        clinicId: clinic.id,
        role: "OWNER",
      },
    });

    return {
      user,
      clinic,
      membership,
    };
  });

  const token = generateToken({
    userId: result.user.id,
    clinicId: result.clinic.id,
    role: result.membership.role,
  });

  return {
    token,

    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    },

    clinic: {
      id: result.clinic.id,
      name: result.clinic.name,
      slug: result.clinic.slug,
    },

    role: result.membership.role,
  };
}

export async function loginUser(input: LoginInput) {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail,
    },

    include: {
      memberships: {
        include: {
          clinic: true,
        },
      },
    },
  });

  if (!user) {
    // throw new Error("Invalid email or password");
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await comparePassword(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    // throw new Error("Invalid email or password");
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status !== "ACTIVE") {
    // throw new Error("User account is not active");

    throw new AppError("User account is not active", 403);
  }

  if (user.memberships.length === 0) {
    // throw new Error("User is not associated with any clinic");
    throw new AppError("User is not associated with any clinic", 403);
  }

  const membership = user.memberships[0];

  const token = generateToken({
    userId: user.id,
    clinicId: membership.clinicId,
    role: membership.role,
  });

  return {
    token,

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },

    clinic: {
      id: membership.clinic.id,
      name: membership.clinic.name,
      slug: membership.clinic.slug,
    },

    role: membership.role,
  };
}

export async function getCurrentUser(userId: string, clinicId: string) {
  const membership = await prisma.clinicMember.findUnique({
    where: {
      userId_clinicId: {
        userId,
        clinicId,
      },
    },

    include: {
      user: true,
      clinic: true,
    },
  });

  if (!membership) {
    // throw new Error("Clinic membership not found");
    throw new AppError("Clinic membership not found", 403);
  }

  return {
    user: {
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      status: membership.user.status,
    },

    clinic: {
      id: membership.clinic.id,
      name: membership.clinic.name,
      slug: membership.clinic.slug,
    },

    role: membership.role,
  };
}

function createClinicSlug(clinicName: string): string {
  const baseSlug = clinicName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseSlug}-${Date.now()}`;
}
