import prisma from './prisma';

export const logAudit = async (userId: string | null, action: string, details: string, ipAddress?: string) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
        ipAddress: ipAddress || null
      }
    });
  } catch (error) {
    console.error('[Audit Log Error]', error);
  }
};
