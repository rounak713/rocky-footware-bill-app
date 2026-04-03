const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDel() {
  const inv = await prisma.invoice.findFirst();
  if(!inv) {
    console.log("No invoices found");
    return;
  }
  console.log("Trying to delete invoice:", inv.id);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { invoiceId: inv.id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
      await tx.invoice.delete({ where: { id: inv.id } });
    });
    console.log("Delete succeeded");
  } catch (err) {
    console.log("Delete failed:", err);
  }
}
testDel();
