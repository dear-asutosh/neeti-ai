/**
 * Checks the strength of a password and returns a score from 0 to 4.
 * @param {string} password 
 * @returns {object} { score: number, feedback: string[], isStrong: boolean }
 */
export const checkPasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  if (!password) return { score: 0, feedback: [], isStrong: false };

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("At least 8 characters");
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("At least one uppercase letter");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("At least one lowercase letter");
  }

  // Number or Special character check
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("At least one number or special character");
  }

  // Additional "Strong" criteria for score 4
  if (score === 4 && password.length < 10) {
      // Keep it at 3 if it's too short but has all types
      // Actually let's just use the basic 4 criteria for now.
  }

  return {
    score,
    feedback,
    isStrong: score >= 4 && password.length >= 8
  };
};

/**
 * Generates a strong random password.
 * @returns {string}
 */
export const generateStrongPassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let retVal = "";
  
  // Ensure at least one of each type
  retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  retVal += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  retVal += "0123456789"[Math.floor(Math.random() * 10)];
  retVal += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];

  for (let i = 4; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return retVal.split('').sort(() => 0.5 - Math.random()).join('');
};
