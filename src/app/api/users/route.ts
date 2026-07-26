import { prisma } from "@/lib/prisma";
import { handle, ok, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

// Lightweight list of users for owner-assignment dropdowns. Any authenticated
// user may read this minimal projection (id, name, role).
export async function GET() {
  return handle(async () => {
    await requireUser();
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    });
    return ok({ items: users });
  });
}
