import { notFound } from "next/navigation";
import { getJob } from "@/lib/db";
import JobDetail from "./JobDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) notFound();
  return <JobDetail initialJob={job} />;
}
