const fs = require("fs");
const path = require("path");

const F1_COUNTER_FILE = path.resolve(__dirname, "f1-test-ac-counter.json");

function getNextF1Counter() {
  let counter = 1;
  try {
    if (fs.existsSync(F1_COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(F1_COUNTER_FILE, "utf-8").replace(/^\uFEFF/, ""));
      if (typeof data.counter === "number" && !isNaN(data.counter)) {
        counter = data.counter;
      }
    }
  } catch (_) {}

  const nextCounter = counter + 1;
  try {
    fs.writeFileSync(
      F1_COUNTER_FILE,
      JSON.stringify({ counter: nextCounter, lastUpdated: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (_) {}

  return counter;
}

function getNextF1UniqueListing(base = "King Street") {
  const counter = getNextF1Counter();
  const timeOffset = (Math.floor(Date.now() / 1000) + counter * 23) % 600;
  const num = 50 + timeOffset;
  const uniqueListingNumber = `TST-${Date.now().toString().slice(-4)}-${counter}`;

  return {
    counter,
    streetNumber: num,
    listingNumber: uniqueListingNumber,
    searchAddress: `${base} ${num}`,
    headline: `F1 TST Isolation Listing #${uniqueListingNumber}`,
  };
}

function getNextRealUniqueListing(base = "Queen Street") {
  const counter = getNextF1Counter();
  const timeOffset = (Math.floor(Date.now() / 1000) + counter * 31) % 600;
  const num = 50 + timeOffset;
  const uniqueListingNumber = `REAL-${Date.now().toString().slice(-4)}-${counter}`;

  return {
    counter,
    streetNumber: num,
    listingNumber: uniqueListingNumber,
    searchAddress: `${base} ${num}`,
    headline: `Real UAT Agent Listing #${uniqueListingNumber}`,
  };
}

function getDynamicF1TestAddress(base = "King Street") {
  return getNextF1UniqueListing(base).searchAddress;
}

function getSharedF1State() {
  try {
    if (fs.existsSync(F1_COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(F1_COUNTER_FILE, "utf-8").replace(/^\uFEFF/, ""));
      return data.sharedState || {};
    }
  } catch (_) {}
  return {};
}

function saveSharedF1State(partialState) {
  try {
    let data = {};
    if (fs.existsSync(F1_COUNTER_FILE)) {
      data = JSON.parse(fs.readFileSync(F1_COUNTER_FILE, "utf-8").replace(/^\uFEFF/, ""));
    }
    data.sharedState = { ...(data.sharedState || {}), ...partialState };
    fs.writeFileSync(F1_COUNTER_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (_) {}
}

const f1TestAcCheckFlowData = {
  // Shared cross-scenario state (persisted to disk)
  sharedState: getSharedF1State(),
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
  // REAL UAT ACCOUNTS (.c4utest@yopmail.com)
  // =====================================================
  realAccounts: {
    agent: {
      role: "Real Estate Agent",
      email: process.env.REAL_AC_AGENT_EMAIL || "agent.c4utest@yopmail.com",
      password: process.env.REAL_AC_AGENT_PASSWORD || "Test12345@",
      otp: process.env.REAL_AC_AGENT_OTP || "123456",
    },
    buyer: {
      role: "User / Buyer",
      email: process.env.REAL_AC_BUYER_EMAIL || "buyer.c4utest@yopmail.com",
      password: process.env.REAL_AC_BUYER_PASSWORD || "Test12345@",
      otp: process.env.REAL_AC_BUYER_OTP || "123456",
    },
    sellerSolicitor: {
      role: "Seller Solicitor",
      email: process.env.REAL_AC_SELLER_SOLICITOR_EMAIL || "solicitor.c4utest@yopmail.com",
      password: process.env.REAL_AC_SELLER_SOLICITOR_PASSWORD || "Test12345@",
      otp: process.env.REAL_AC_SELLER_SOLICITOR_OTP || "123456",
      searchName: "James Anderson",
      searchQuery: "James Anderson",
    },
  },

  // =====================================================
  // FORBIDDEN TST ACCOUNTS (MUST NOT APPEAR TO REAL USERS)
  // =====================================================
  forbiddenTstAccounts: [
    { role: "Agent", email: "agent.c4u.tst@yopmail.com", name: "Agent TST" },
    { role: "User / Buyer", email: "user.c4u.tst@yopmail.com", name: "User TST" },
    { role: "Second Buyer / Vendor", email: "2ndbuyer.c4u.tst@yopmail.com", name: "SecondBuyer TST" },
    { role: "Seller Solicitor", email: "sellsol.c4u.tst@yopmail.com", name: "SellSol TST" },
    { role: "Buyer Solicitor", email: "bsol.c4u.tst@yopmail.com", name: "BSol TST" },
    { role: "Mortgage Broker", email: "broker.c4u.tst@yopmail.com", name: "MRbrok TST" },
  ],

  // =====================================================
  // AGENT LISTING DATA (TST AGENT)
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
  // REAL AGENT LISTING DATA
  // =====================================================
  realAgent: {
    listing: {
      propertyType: "House",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,

      listingType: "Fixed Price",
      priceGuide: "55000",

      headline: "Real UAT Agent Listing",
      propertyDescription:
        "Property created by real UAT agent for testing cross-account isolation. " +
        "This property must NOT be visible to TST test accounts.",

      keyFeatures: [
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Garden",
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
  getNextF1UniqueListing,
  getNextRealUniqueListing,
  getSharedF1State,
  saveSharedF1State,
};
