const otpGenerator = require("otp-generator");

const generatorOTP = () => {
  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
  return otp;
};

module.exports = generatorOTP;
