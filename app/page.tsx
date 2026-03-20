import HomeClient from "@/components/HomeClient";
import { listJobs } from "@/lib/db";
import { initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getJobs() {
  try {
    await initDb();
    return await listJobs(20);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const jobs = await getJobs();

  return (
    <HomeClient jobs={jobs} />
  );
}
