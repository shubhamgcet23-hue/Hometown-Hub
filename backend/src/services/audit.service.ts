import { prisma } from "../config/db";

interface AuditInput {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

// Fire-and-forget audit trail for sensitive/administrative actions
// (user suspension, community approval, moderation, etc). Never throws
// into the request path — logging failures shouldn't break the action itself.
export async function recordAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        metadata: input.metadata as any,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log", err);
  }
}
