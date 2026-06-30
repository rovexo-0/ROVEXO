export function generateInvoiceNumber(orderNumber: string): string {
  return `INV-${orderNumber}`;
}

export function buildOrderReceiptUrl(orderId: string): string {
  return `/api/orders/${orderId}/receipt`;
}

export function buildReceiptHtml(input: {
  orderNumber: string;
  invoiceNumber: string;
  itemTitle: string;
  itemPrice: number;
  protectedFee: number;
  deliveryFee: number;
  platformFee: number;
  sellerPayout: number;
  total: number;
  paidAt: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${input.orderNumber}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #111; padding: 32px; }
      h1 { font-size: 24px; margin-bottom: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; }
      td, th { text-align: left; padding: 8px 0; border-bottom: 1px solid #eee; }
      .total { font-weight: 700; }
    </style>
  </head>
  <body>
    <h1>ROVEXO Receipt</h1>
    <p>Order ${input.orderNumber}</p>
    <p>Invoice ${input.invoiceNumber}</p>
    <p>Paid ${new Date(input.paidAt).toLocaleString("en-IE")}</p>
    <table>
      <tr><th>Item</th><th>Amount</th></tr>
      <tr><td>${input.itemTitle}</td><td>£${input.itemPrice.toFixed(2)}</td></tr>
      <tr><td>Buyer protection</td><td>£${input.protectedFee.toFixed(2)}</td></tr>
      <tr><td>Delivery</td><td>£${input.deliveryFee.toFixed(2)}</td></tr>
      <tr><td>Platform fee</td><td>£${input.platformFee.toFixed(2)}</td></tr>
      <tr><td>Seller payout</td><td>£${input.sellerPayout.toFixed(2)}</td></tr>
      <tr class="total"><td>Total paid</td><td>£${input.total.toFixed(2)}</td></tr>
    </table>
  </body>
</html>`;
}
