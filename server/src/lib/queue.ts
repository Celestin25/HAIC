import Sentry from "./sentry";
import { registerClassifyWorker } from "./classify-ticket";
import { registerAutoResolveWorker } from "./auto-resolve-ticket";
import { registerSendEmailWorker } from "./send-email";

class MockBoss {
  private workers: Record<string, (jobs: any[]) => Promise<void>> = {};

  async start() {
    console.log("Mock Job Queue started (In-Memory)");
  }

  async stop() {
    console.log("Mock Job Queue stopped");
  }

  async createQueue(name: string) {
    console.log(`Mock Queue created: ${name}`);
  }

  async work<T>(name: string, worker: (jobs: { data: T }[]) => Promise<void>) {
    this.workers[name] = worker;
  }

  async send(name: string, data: any) {
    console.log(`Mock sending job to ${name}`);
    const worker = this.workers[name];
    if (worker) {
      // Execute immediately (mocking the queue)
      worker([{ data }]).catch((error) => {
        Sentry.captureException(error);
        console.error(`Error in mock worker ${name}:`, error);
      });
    } else {
      console.warn(`No worker registered for queue: ${name}`);
    }
  }

  on(event: string, handler: (any: any) => void) {
    // No-op for mock
  }
}

const boss = new MockBoss() as any;

export { boss };

export async function startQueue(): Promise<void> {
  await boss.start();

  await registerClassifyWorker(boss);
  await registerAutoResolveWorker(boss);
  await registerSendEmailWorker(boss);

  console.log("Job queue initialized (Mock Mode)");
}

export async function stopQueue(): Promise<void> {
  await boss.stop();
}
