const path = require("path");

function getDynamicF1TestAddress(base = "King Street") {
  const timeOffset = (Math.floor(Date.now() / 1000) * 13) % 600;
  const num = 50 + timeOffset;
  return `${base} ${num}`;
}

const f1TestAcCheckFlowData = {
  // =====================================================
  // DESIGNATED TEST ACCOUNTS (ending in .tst@yopmail.com)
  // =====================================================
  accounts: {
    agent: {
      role: "Agent",
      email: process.env.TEST_AC_AGENT_EMAIL || "agent.c4u.tst@yopmail.com",
      password: process.env.TEST_AC_AGENT_PASSWORD || "Test12345@",
      otp: process.env.TEST_AC_AGENT_OTP || "123456",
    },
    buyer: {
      role: "User / Buyer",
      email: process.env.TEST_AC_BUYER_EMAIL || "user.c4u.tst@yopmail.com",
      password: process.env.TEST_AC_BUYER_PASSWORD || "Test12345@",
      otp: process.env.TEST_AC_BUYER_OTP || "123456",
    },
    secondBuyer: {
      role: "Second Buyer / Vendor",
      email: process.env.TEST_AC_VENDOR_EMAIL || "2ndbuyer.c4u.tst@yopmail.com",
      password: process.env.TEST_AC_VENDOR_PASSWORD || "Test12345@",
      otp: process.env.TEST_AC_VENDOR_OTP || "123456",
    },
    sellerSolicitor: {
      role: "Seller Solicitor",
      email: process.env.TEST_AC_SELLER_SOLICITOR_EMAIL || "sellsol.c4u.tst@yopmail.com",
      password: process.env.TEST_AC_SELLER_SOLICITOR_PASSWORD || "Test12345@",
      otp: process.env.TEST_AC_SELLER_SOLICITOR_OTP || "123456",
      searchName: "SellSol TST",
      searchQuery: "sellsol",
    },
    buyerSolicitor: {
      role: "Buyer Solicitor",
      email: process.env.TEST_AC_BUYER_SOLICITOR_EMAIL || "bsol.c4u.tst@yopmail.com",
      password: process.env.TEST_AC_BUYER_SOLICITOR_PASSWORD || "Test12345@",
      otp: process.env.TEST_AC_BUYER_SOLICITOR_OTP || "123456",
      searchName: "BSol TST",
      searchQuery: "bsol",
    },
    mortgageBroker: {
      role: "Mortgage Broker",
      email: process.env.TEST_AC_BROKER_EMAIL || "broker.c4u.tst@yopmail.com",
      password: process.env.TEST_AC_BROKER_PASSWORD || "Test12345@",
      otp: process.env.TEST_AC_BROKER_OTP || "123456",
      searchName: "Broker TST",
      searchQuery: "broker",
    },
  },

  // =====================================================
  // FORBIDDEN LEGACY ACCOUNTS (MUST NOT APPEAR)
  // =====================================================
  forbiddenLegacyAccounts: [
    { role: "Real Estate Agent", email: "agent.c4utest@yopmail.com", name: "Real Estate Agent" },
    { role: "User / Buyer", email: "buyer.c4utest@yopmail.com", name: "Daniel Lyeon" },
    { role: "Second Buyer / Vendor", email: "secondbuyer.c4utest@yopmail.com", name: "Sandy Bosch" },
    { role: "Seller Solicitor", email: "solicitor.c4utest@yopmail.com", name: "James Anderson" },
    { role: "Buyer Solicitor", email: "buyersolicitor.c4utest@yopmail.com", name: "Maxel Montana" },
    { role: "Mortgage Broker", email: "broker.c4utest@yopmail.com", name: "Alen Mayer" },
  ],

  // =====================================================
  // AGENT LISTING DATA
  // =====================================================
  agent: {
    listing: {
      addressSearchText: getDynamicF1TestAddress("King Street"),
      expectedPropertyName: "King Street",

      propertyType: "House",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,

      listingType: "Fixed Price",
      priceGuide: "50000",

      headline: "F1 Test Account Isolation Listing",
      propertyDescription:
        "Listing created exclusively for validating UAT test account isolation rules. " +
        "Only .tst@yopmail.com accounts should interact with this property.",

      keyFeatures: [
        "Fireplace",
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Garden",
        "Garage",
      ],

      propertyPhotos: [
        path.resolve(process.cwd(), "test-assets/listing/property-1.jpg"),
        path.resolve(process.cwd(), "test-assets/listing/property-2.jpg"),
      ],

      floorPlan: path.resolve(process.cwd(), "test-assets/listing/floor-plan.jpg"),
    },
  },

  // =====================================================
  // GENERAL USER / BUYER OFFER
  // =====================================================
  generalUser: {
    offerAmount: "25000",
  },

  // =====================================================
  // PAYMENT DETAILS
  // =====================================================
  payment: {
    cardNumber: process.env.TEST_CARD_NUMBER || "4242 4242 4242 4242",
    expiry: process.env.TEST_CARD_EXPIRY || "12/30",
    cvc: process.env.TEST_CARD_CVC || "123",
    cardholderName: "Test Buyer",
    postcode: "3000",
  },
};

module.exports = {
  f1TestAcCheckFlowData,
  getDynamicF1TestAddress,
};
