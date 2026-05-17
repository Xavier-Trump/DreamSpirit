import { prisma } from "@/lib/prisma";
import { getRunnableJobs, markJobFailed, markJobRunning, markJobSucceeded } from "@/lib/jobs";
import { processJob } from "@/lib/jobs/processor";

async function runLoop() {
  while (true) {
    const jobs = await getRunnableJobs(5);

    if (jobs.length === 0) {
      await wait(4_000);
      continue;
    }

    for (const job of jobs) {
      try {
        await markJobRunning(job.id);
        const output = await processJob(job);
        await markJobSucceeded(job.id, output as object);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown job processing error";
        await markJobFailed(job.id, message);
      }
    }
  }
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

runLoop()
  .catch((error) => {
    console.error("Worker crashed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
