module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const { phone, name, templateKey } = req.body || {};

  if (!phone) {
    return res.status(400).json({ message: 'A WhatsApp number is required.' });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v20.0';
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US';

  // Map template keys to their approved names
  const templateMapping = {
    opt_in: process.env.WHATSAPP_TEMPLATE_OPT_IN || 'pulseflow_opt_in_confirm',
    report: process.env.WHATSAPP_TEMPLATE_REPORT || 'pulseflow_report_update',
    service: process.env.WHATSAPP_TEMPLATE_SERVICE || 'pulseflow_service_update'
  };

  const selectedTemplateKey = templateKey || 'opt_in';
  const templateName = templateMapping[selectedTemplateKey];

  if (!templateName) {
    return res.status(400).json({ message: `Invalid template key: ${selectedTemplateKey}` });
  }

  if (!token || !phoneNumberId) {
    return res.json({
      mode: 'demo',
      message: `Demo mode: update preference saved. (Would trigger WhatsApp template "${templateName}" in live mode)`,
      templateUsed: templateName
    });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const displayName = name || 'PulseFlow user';
  const templatePayload = {
    name: templateName,
    language: { code: templateLanguage },
  };

  if (selectedTemplateKey === 'opt_in') {
    templatePayload.components = [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: displayName },
        ],
      },
    ];
  }

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
        type: 'template',
        template: templatePayload,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ mode: 'live', message: 'WhatsApp API request failed.', templateUsed: templateName, details: data });
    }

    return res.json({ mode: 'live', message: 'Template WhatsApp update sent.', details: data });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to contact WhatsApp API.', details: error.message });
  }
};
