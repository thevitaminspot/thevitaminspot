-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_isActive_stock_idx" ON "Product"("isActive", "stock");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductImage_productId_position_idx" ON "ProductImage"("productId", "position");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_email_createdAt_idx" ON "Order"("email", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_deliveryZoneId_idx" ON "Order"("deliveryZoneId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_status_purpose_idx" ON "Payment"("status", "purpose");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Appointment_email_startsAt_idx" ON "Appointment"("email", "startsAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContactMessage_createdAt_idx" ON "ContactMessage"("createdAt");
