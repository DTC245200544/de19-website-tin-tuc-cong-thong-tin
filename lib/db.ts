import mysql, { type Pool } from "mysql2/promise";

declare global {
  var newsDbPool: Pool | undefined;
}

export function getDb(): Pool {
  if (!global.newsDbPool) {
    global.newsDbPool = mysql.createPool({
      host: process.env.DB_HOST ?? "mysql",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }
  return global.newsDbPool;
}
