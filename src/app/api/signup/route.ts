import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { ApiError, handle, ok, parseBody } from "@/lib/api";

export async function POST(request: Request) {
  return handle(async () => {
    const data = await parseBody(request, signupSchema);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    // First registered user becomes ADMIN; everyone else is SALES_REP unless
    // an explicit role is requested (only honored when there are no users yet).
    const userCount = await prisma.user.count();
    const role =
      userCount === 0 ? "ADMIN" : data.role ?? "SALES_REP";

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: userCount === 0 ? "ADMIN" : role === "ADMIN" ? "SALES_REP" : role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return ok(user, 201);
  });
}
