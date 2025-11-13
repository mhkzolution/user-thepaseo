// scripts/weekly-cron.js
import cron from "node-cron";
import { sendWeeklySummaryToAllUsers } from "../lib/weeklyPointSummary.js";

console.log("Starting weekly cron service...");

// run every Monday 10:00 Asia/Bangkok -> ต้องหาค่าเวลา server (แปลงเป็น cron time ของ server)
// ถ้า server เป็น UTC ให้ใช้ "0 3 * * 1" (03:00 UTC = 10:00 BKK)
cron.schedule("0 3 * * 1", async () => {
  console.log("Running weekly summary job (Monday 10:00 BKK)...");
  await sendWeeklySummaryToAllUsers({ limitPerBatch: 50, delayMs: 1000 });
});
