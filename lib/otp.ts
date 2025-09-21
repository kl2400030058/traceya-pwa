export const generateOTP = (length = 6) => {
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

export const saveOTP = (key: string, otp: string) => {
  localStorage.setItem(`otp_${key}`, JSON.stringify({ otp, timestamp: Date.now() }));
};

export const validateOTP = (key: string, inputOtp: string) => {
  const data = localStorage.getItem(`otp_${key}`);
  if (!data) return false;
  const { otp, timestamp } = JSON.parse(data);
  if (Date.now() - timestamp > 5 * 60 * 1000) return false; // 5 min expiry
  return otp === inputOtp;
};

export const sendOtp = async (phoneNumber: string) => {
  // Generate a new OTP
  const newOtp = generateOTP(6);
  
  // Save the OTP with the phone number as the key
  saveOTP(phoneNumber, newOtp);
  
  // In a production environment, this would send an SMS
  if (process.env.NODE_ENV === 'production') {
    try {
      // Format the OTP message
      const message = `Your TraceYA verification code is: ${newOtp}. Valid for 5 minutes.`;
      
      // In a real implementation, this would call an SMS API service
      // For now, we'll use the SMS app opening approach similar to the SMSManager
      if (typeof window !== 'undefined') {
        const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
        window.open(smsUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      // Still continue as we've saved the OTP locally
    }
  } else {
    // For development, we'll just log it to the console
    console.log(`OTP for ${phoneNumber}: ${newOtp}`);
  }
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
};