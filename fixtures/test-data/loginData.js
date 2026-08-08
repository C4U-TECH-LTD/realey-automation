require("dotenv").config();

const loginData = {
  application: {
    loginPath: "/login",
  },

  agent: {
    email:
      process.env.AGENT_EMAIL ||
      "realey-login@1bjhpbwd.mailosaur.net",

    password:
      process.env.AGENT_PASSWORD ||
      "#Test1234",

    otp:
      process.env.AGENT_OTP ||
      "123456",
  },

  generalUser: {
    email:
      process.env.GENERAL_USER_EMAIL ||
      "siamttouch@gmail.com",

    password:
      process.env.GENERAL_USER_PASSWORD ||
      "#Test1234",

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
