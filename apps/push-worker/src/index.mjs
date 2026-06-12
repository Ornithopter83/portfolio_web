import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import webPush from 'web-push';

const requiredEnv = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'WEB_PUSH_PUBLIC_KEY',
  'WEB_PUSH_PRIVATE_KEY',
  'WEB_PUSH_SUBJECT',
  'PUBLIC_SITE_URL'
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`${key} is required.`);
  }
}

const workerId = process.env.WORKER_ID || 'mini-pc-push-worker';
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS || 15000);
const runOnce = process.argv.includes('--once');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
});

webPush.setVapidDetails(
  process.env.WEB_PUSH_SUBJECT,
  process.env.WEB_PUSH_PUBLIC_KEY,
  process.env.WEB_PUSH_PRIVATE_KEY
);

async function updateHeartbeat(status = 'online', note = null) {
  await supabase.from('server_heartbeats').upsert({
    server_id: workerId,
    status,
    note,
    last_seen_at: new Date().toISOString()
  });
}

async function processPendingMessages() {
  await updateHeartbeat('online');

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id,title,body,created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    await updateHeartbeat('online', error.message);
    return;
  }

  for (const message of messages || []) {
    await processMessage(message);
  }
}

async function processMessage(message) {
  await supabase
    .from('messages')
    .update({ status: 'processing', processing_started_at: new Date().toISOString() })
    .eq('id', message.id)
    .eq('status', 'pending');

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('id,endpoint,subscription')
    .eq('is_active', true);

  if (error) {
    await markMessage(message.id, 'failed', error.message);
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (const target of subscriptions || []) {
    const payload = JSON.stringify({
      title: message.title,
      body: message.body,
      messageId: message.id,
      url: `${process.env.PUBLIC_SITE_URL}/?message=${message.id}`
    });

    try {
      await webPush.sendNotification(target.subscription, payload);
      successCount += 1;
      await supabase.from('push_deliveries').insert({
        message_id: message.id,
        push_subscription_id: target.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      });
    } catch (sendError) {
      failureCount += 1;
      const statusCode = sendError.statusCode ?? null;

      await supabase.from('push_deliveries').insert({
        message_id: message.id,
        push_subscription_id: target.id,
        status: 'failed',
        error_message: sendError.message,
        status_code: statusCode
      });

      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', target.id);
      }
    }
  }

  await markMessage(
    message.id,
    successCount > 0 ? 'sent' : 'failed',
    successCount > 0 ? null : `No successful deliveries. failures=${failureCount}`
  );
}

async function markMessage(id, status, errorMessage) {
  await supabase
    .from('messages')
    .update({
      status,
      processed_at: new Date().toISOString(),
      error_message: errorMessage
    })
    .eq('id', id);
}

async function mainLoop() {
  await processPendingMessages();

  if (runOnce) {
    return;
  }

  setInterval(() => {
    processPendingMessages().catch((error) => {
      updateHeartbeat('online', error.message).catch(() => undefined);
    });
  }, pollIntervalMs);
}

process.on('SIGINT', async () => {
  await updateHeartbeat('offline', 'SIGINT');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await updateHeartbeat('offline', 'SIGTERM');
  process.exit(0);
});

mainLoop().catch(async (error) => {
  await updateHeartbeat('offline', error.message).catch(() => undefined);
  console.error(error);
  process.exit(1);
});
