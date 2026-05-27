import { NextResponse } from "next/server";
import { CATERING_PIPELINE } from "@/lib/data";

export async function GET() {
  const server = process.env.MSSQL_SERVER;
  const database = process.env.MSSQL_DATABASE;
  const user = process.env.MSSQL_USER;
  const password = process.env.MSSQL_PASSWORD;

  if (server && database && user && password) {
    // When running with Monkey Media DB credentials, this would
    // query the catering orders table directly.
    // Implementation requires mssql package (pymssql equivalent for Node):
    //   npm install mssql
    // Then use sql.connect() to query upcoming confirmed orders.
    //
    // SELECT TOP 20
    //   c.ClientName, c.EventDate, c.PieCount, c.TotalRevenue,
    //   c.Status, c.ContactName
    // FROM CateringOrders c
    // WHERE c.EventDate >= GETDATE()
    // ORDER BY c.EventDate ASC
    //
    // Falling back to static data until mssql package is added
  }

  return NextResponse.json({
    source: "static",
    catering: CATERING_PIPELINE,
    summary: {
      confirmed: CATERING_PIPELINE.filter((c) => c.status === "confirmed").length,
      pending: CATERING_PIPELINE.filter((c) => c.status === "pending").length,
      totalRevenue: CATERING_PIPELINE.reduce((s, c) => s + c.revenue, 0),
      totalPies: CATERING_PIPELINE.reduce((s, c) => s + c.pies, 0),
    },
  });
}
