module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === 'subscribe' && token && token === verifyToken) {
      return res.status(200).send(challenge);
    }

    return res.status(403).json({ message: 'Webhook verification failed.' });
  }

  if (req.method === 'POST') {
    const body = req.body;
    console.log('WhatsApp Webhook POST received:', JSON.stringify(body));

    try {
      // Check if this is a WhatsApp status update event
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (value?.statuses?.[0]) {
        const statusObj = value.statuses[0];
        const messageId = statusObj.id;
        const recipientId = statusObj.recipient_id;
        const status = statusObj.status; // sent, delivered, read, failed

        console.log(`[WhatsApp Event] Message ID: ${messageId} | Recipient: ${recipientId} | Status: ${status.toUpperCase()}`);
        if (statusObj.errors) {
          console.error('[WhatsApp Event Error]', JSON.stringify(statusObj.errors));
        }
      }

      // Check if this is an incoming message event
      if (value?.messages?.[0]) {
        const messageObj = value.messages[0];
        const from = messageObj.from;
        const text = messageObj.text?.body || '[Non-text message]';
        console.log(`[WhatsApp Message Received] From: ${from} | Message: "${text}"`);
      }
    } catch (err) {
      console.error('Error processing webhook payload:', err.message);
    }

    return res.status(200).json({ received: true });
  }

  return res.status(405).json({ message: 'Method not allowed.' });
};
