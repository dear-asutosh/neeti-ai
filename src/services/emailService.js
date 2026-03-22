import emailjs from '@emailjs/browser';

/**
 * Email Service for OTP Verification
 * Uses EmailJS for real email dispatch.
 * Credentials are fetched from environment variables.
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Generates a 6-digit numeric OTP.
 * @returns {string} 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends the OTP email using EmailJS.
 * @param {string} toEmail 
 * @param {string} otp 
 * @param {string} userName 
 * @returns {Promise<boolean>}
 */
export const sendOTPEmail = async (toEmail, otp, userName) => {
  // Check if credentials are set (not using default placeholders)
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("[EMAIL SERVICE] EmailJS credentials not configured. Falling back to console mock.");
    console.log(`%c[EMAIL MOCK] Sending OTP ${otp} to ${toEmail} for ${userName}`, "color: #4f46e5; font-weight: bold;");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  }

  const templateParams = {
    to_email: toEmail,
    to_name: userName,
    otp_code: otp,
  };

  try {
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    return result.status === 200;
  } catch (error) {
    console.error("Email sending failed:", error);
    // Even if it fails, we log it to console for debugging if user is in dev
    console.log(`%c[EMAIL FAIL-SAFE] OTP: ${otp}`, "color: #ef4444; font-weight: bold;");
    return false;
  }
};
