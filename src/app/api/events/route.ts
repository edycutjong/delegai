import { eventBus } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
// Pin to single region so the in-memory eventBus singleton is shared
// between the POST /api/delegate and GET /api/events handlers
export const preferredRegion = 'iad1';

export async function GET() {
  const encoder = new TextEncoder();

  let unsub: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      unsub = eventBus.subscribe((event) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));

        if (event.type === 'chain_settled' || event.type === 'error') {
          unsub?.();
          controller.close();
        }
      });
    },
    cancel() {
      // Client disconnected before flow completed — release the event listener
      unsub?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
