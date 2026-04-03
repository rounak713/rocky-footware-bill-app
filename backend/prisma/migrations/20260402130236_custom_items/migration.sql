-- DropForeignKey
ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_variant_id_fkey";

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "custom_name" TEXT,
ALTER COLUMN "variant_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
