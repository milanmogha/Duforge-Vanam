import axios from "axios";

export const sendSMS = async (phone, message) => {
  // Development bypass: when `SMS_DEV_MODE=true` in .env, skip provider and log OTP
  if (String(process.env.SMS_DEV_MODE).toLowerCase() === 'true') {
    console.warn('SMS_DEV_MODE enabled — skipping SMS send. Phone:', phone);
    console.log('Mock SMS message:', message);
    return { success: true, dev: true, mock: true };
  }
  try {
    const number = phone.replace("+91", "");

    const url = "https://www.fast2sms.com/dev/bulkV2";
    const payload = { route: "q", message, numbers: number, sender_id: process.env.FAST2SMS_SENDER_ID };
    const headers = { authorization: process.env.FAST2SMS_API_KEY, "Content-Type": "application/json" };

    // Never log the message body (contains the OTP) or the API key.
    console.debug('Fast2SMS request', { url, route: 'q', hasSenderId: !!process.env.FAST2SMS_SENDER_ID });

    // Primary attempt: JSON body
    let res = await axios.post(url, payload, { headers });

    // If provider returns non-200 but no throw, normalize
    if (res && res.data && res.data.return === false) {
      // continue to retry below
      console.warn('Fast2SMS responded with failure body', res.data);
    } else {
      return { success: true, provider: res.data || null };
    }

    // Fallback attempt: some accounts expect form-urlencoded payload
    try {
      const form = new URLSearchParams();
      form.append('route', 'q');
      form.append('message', message);
      form.append('numbers', number);
      if (process.env.FAST2SMS_SENDER_ID) form.append('sender_id', process.env.FAST2SMS_SENDER_ID);

      console.debug('Fast2SMS fallback (form) request to', url);
      const res2 = await axios.post(url, form.toString(), {
        headers: { authorization: process.env.FAST2SMS_API_KEY, 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (res2 && res2.data && res2.data.return === false) {
        console.warn('Fast2SMS fallback responded with failure', res2.data);
        throw { response: { data: res2.data, status: res2.status } };
      }

      return { success: true, provider: res2.data || null, fallback: true };
    } catch (fallbackErr) {
      // throw original error below to be caught by outer catch
      throw fallbackErr;
    }
  } catch (err) {
    const details = err.response?.data || err.message;
    console.error("Fast2SMS Error:", details);
    // Normalize provider error shape for callers
    const normalized = {
      success: false,
      error: details,
      status_code: err.response?.data?.status_code || err.response?.status || null,
    };
    return normalized;
  }
};

export const sendOrderConfirmationSMS = async (phone, { orderId, customerName }) => {
  const message = `Hi ${customerName || ''}, your order ${orderId} has been placed. Thank you for shopping with us.`;
  return sendSMS(phone, message);
};

export const sendOrderStatusSMS = async (phone, { orderId, customerName }, status) => {
  const message = `Hi ${customerName || ''}, your order ${orderId} status: ${status}.`;
  return sendSMS(phone, message);
};
