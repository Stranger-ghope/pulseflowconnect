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
    console.log('WhatsApp webhook event:', JSON.stringify(req.body));
    return res.status(200).json({ received: true });
  }

  return res.status(405).json({ message: 'Method not allowed.' });
};
