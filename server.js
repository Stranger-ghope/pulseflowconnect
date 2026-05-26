const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.post('/api/whatsapp/notify', async (req, res) => {
  const { phone, name } = req.body || {};

  if (!phone) {
    return res.status(400).json({ message: 'A WhatsApp number is required.' });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';

  if (!token || !phoneNumberId) {
    return res.json({
      mode: 'demo',
      message: 'Demo mode: update preference saved. Add Meta credentials on the server to send a real WhatsApp message.',
    });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const text = `Hello ${name || 'there'}, your PulseFlow Connect updates are active. Open the app for local service information.`;

  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: false, body: text },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ message: 'WhatsApp API request failed.', details: data });
    }

    return res.json({ mode: 'live', message: 'Test WhatsApp update sent.', details: data });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to contact WhatsApp API.', details: error.message });
  }
});

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`PulseFlow Connect running on port ${port}`);
});
