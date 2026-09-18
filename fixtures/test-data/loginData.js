require("dotenv").config();

const loginData = {
  application: {
    loginPath: "/login",
  },

  agent: {
    email: process.env.AGENT_EMAIL || "agent.c4utest@yopmail.com",
    password: process.env.AGENT_PASSWORD || "Test12345@",
    otp: process.env.AGENT_OTP || "123456",
  },

  generalUser: {
    email: process.env.GENERAL_USER_EMAIL || "buyer.c4utest@yopmail.com",
    password: process.env.GENERAL_USER_PASSWORD || "Test12345@",
    otp: process.env.GENERAL_USER_OTP || "123456",
  },

  // Second Auction bidder must be a different Realey user.
  // Set these values in .env / GitHub Actions secrets.
  auctionBuyer2: {
    email: process.env.AUCTION_BUYER_2_EMAIL || "secondbuyer.c4utest@yopmail.com",
    password: process.env.AUCTION_BUYER_2_PASSWORD || "Test12345@",
    otp: process.env.AUCTION_BUYER_2_OTP || "123456",
  },

  invalidUser: {
    email: "invalid-user@1bjhpbwd.mailosaur.net",
    password: "WrongPassword@123",
  },

  expected: {
    successUrlPattern: /dashboard|profile|home|account/i,
  },
};

module.exports = {
  loginData,
};
