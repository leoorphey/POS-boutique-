import { prisma } from "@/config/prisma";
import { Prisma } from "@prisma/client";

interface AuditLogInput {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ipAddress?: string;
}

// Ne doit jamais faire échouer l'opération principale : l'audit est best-effort.
export async function logAudit(input: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        meta: input.meta as Prisma.InputJsonValue,
        ipAddress: input.ipAddress,
      },
    });
  } catch (err) {
    console.error("Échec de l'écriture de l'audit log:", err);
  }
}
