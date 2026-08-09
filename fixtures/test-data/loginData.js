require("dotenv").config();

const loginData = {
  application: {
    loginPath: "/login",
  },

  agent: {
    email:
      process.env.AGENT_EMAIL ||
      "sztest0099+1@gmail.com",

    password:
      process.env.AGENT_PASSWORD ||
      "Realey123@",

    otp:
      process.env.AGENT_OTP ||
      "123456",
  },

  generalUser: {
    email:
      process.env.GENERAL_USER_EMAIL ||
      "sztest0099+1111@gmail.com",

    password:
      process.env.GENERAL_USER_PASSWORD ||
      "Realey123@",

    otp:
      process.env.GENERAL_USER_OTP ||
      "123456",
  },

  invalidUser: {
    email:
      "invalid-user@1bjhpbwd.mailosaur.net",

    password:
      "WrongPassword@123",
  },

  expected: {
    successUrlPattern:
      /dashboard|profile|home|account/i,
  },
};

module.exports = {
  loginData,
};
