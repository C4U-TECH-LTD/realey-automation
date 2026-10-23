const fs = require("fs");
const path = require("path");

const PROD_F1_COUNTER_FILE = path.resolve(__dirname, "f1-prod-counter.json");

function getNextProdF1Counter() {
  let counter = 1;
  try {
    if (fs.existsSync(PROD_F1_COUNTER_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROD_F1_COUNTER_FILE, "utf-8").replace(/^\uFEFF/, ""));
      if (typeof data.counter === "number" && !isNaN(data.counter)) {
        counter = data.counter;
      }
    }
  } catch (_) {}

  const nextCounter = counter + 1;
  try {
    fs.writeFileSync(
      PROD_F1_COUNTER_FILE,
      JSON.stringify({ counter: nextCounter, lastUpdated: new Date().toISOString() }, null, 2),
      "utf-8"
    );
  } catch (_) {}

  return counter;
}

function getNextProdF1UniqueListing(base = "King Street") {
  const counter = getNextProdF1Counter();
  const timeOffset = (Math.floor(Date.now() / 1000) + counter * 23) % 600;
  const num = 50 + timeOffset;
  const uniqueListingNumber = `PROD-${Date.now().toString().slice(-4)}-${counter}`;

  return {
    counter,
    streetNumber: num,
    listingNumber: uniqueListingNumber,
    searchAddress: `${num} ${base}, Melbourne`,
    headline: `Prod F1 Test Property #${uniqueListingNumber}`,
  };
}

const f1ProdTestAcFlowData = {
  // =====================================================
  // DESIGNATED PROD TEST ACCOUNTS
  // Note: This is production environment, test users work separately here.
  // =====================================================
  accounts: {
    agent: {
      role: "Agent",
      email: process.env.PROD_TEST_AGENT_EMAIL || "prod.agent.c4u.tst@yopmail.com",
      password: process.env.PROD_TEST_AGENT_PASSWORD || "Test12345@",
      otp: process.env.PROD_TEST_AGENT_OTP || "123456",
    },
    buyer: {
      role: "User / Buyer",
      email: process.env.PROD_TEST_BUYER_EMAIL || "prod.user.c4u.tst@yopmail.com",
      password: process.env.PROD_TEST_BUYER_PASSWORD || "Test12345@",
      otp: process.env.PROD_TEST_BUYER_OTP || "123456",
    },
    vendor: {
      role: "2nd Buyer / Vendor",
      email: process.env.PROD_TEST_VENDOR_EMAIL || "prod.2ndbuyer.c4u.tst@yopmail.com",
      password: process.env.PROD_TEST_VENDOR_PASSWORD || "Test12345@",
      otp: process.env.PROD_TEST_VENDOR_OTP || "123456",
    },
    sellerSolicitor: {
      role: "Seller Solicitor",
      name: "Sz Sell Sol",
      email: process.env.PROD_TEST_SELLER_SOLICITOR_EMAIL || "prod.sellsol.c4u.tst@yopmail.com",
      password: process.env.PROD_TEST_SELLER_SOLICITOR_PASSWORD || "Test12345@",
      otp: process.env.PROD_TEST_SELLER_SOLICITOR_OTP || "123456",
      searchQuery: process.env.PROD_TEST_SELLER_SOLICITOR_SEARCH || "prod.sellsol.c4u.tst@yopmail.com",
    },
    buyerSolicitor: {
      role: "Buyer Solicitor",
      name: "Sz Buyer Sol",
      email: process.env.PROD_TEST_BUYER_SOLICITOR_EMAIL || "prod.bsol.c4u.tst@yopmail.com",
      password: process.env.PROD_TEST_BUYER_SOLICITOR_PASSWORD || "Test12345@",
      otp: process.env.PROD_TEST_BUYER_SOLICITOR_OTP || "123456",
      searchQuery: process.env.PROD_TEST_BUYER_SOLICITOR_SEARCH || "prod.bsol.c4u.tst@yopmail.com",
    },
    mortgageBroker: {
      role: "Mortgage Broker",
      name: "Sz Broker",
      email: process.env.PROD_TEST_BROKER_EMAIL || "prod.broker..c4u.tst@yopmail.com",
      password: process.env.PROD_TEST_BROKER_PASSWORD || "Test12345@",
      otp: process.env.PROD_TEST_BROKER_OTP || "123456",
      searchQuery: process.env.PROD_TEST_BROKER_SEARCH || "prod.broker..c4u.tst@yopmail.com",
    },
  },

  // =====================================================
  // AGENT LISTING CONFIGURATION
  // =====================================================
  agent: {
    listing: {
      addressSearchText: "King Street",
      expectedPropertyName: "King Street, Melbourne",
      propertyType: "House",
      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,
      listingType: "Fixed Price",
      priceGuide: "50000",
      headline: "Prod F1 Test AC Property",
      propertyDescription:
        "Prod F1 Test Property created for production test account isolation and automated Flow 1 direct offer settlement testing.",
      keyFeatures: [
        "Fireplace",
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Garden",
        "Balcony",
        "Garage",
        "Swimming Pool",
      ],
      propertyPhotos: [
        path.resolve(process.cwd(), "test-assets/listing/property-1.jpg"),
        path.resolve(process.cwd(), "test-assets/listing/property-2.jpg"),
      ],
      floorPlan: path.resolve(process.cwd(), "test-assets/listing/floor-plan.jpg"),
      contractDocument: path.resolve(process.cwd(), "test-assets/listing/sample-contract.pdf"),
    },
  },

  // =====================================================
  // BUYER OFFER
  // =====================================================
  generalUser: {
    offerAmount: "25000",
    initialOfferAmount: "20000",
  },

  // =====================================================
  // PAYMENT DETAILS
  // =====================================================
  payment: {
    cardNumber: process.env.TEST_CARD_NUMBER || "4242 4242 4242 4242",
    expiry: process.env.TEST_CARD_EXPIRY || "12/30",
    cvc: process.env.TEST_CARD_CVC || "123",
  },
};

module.exports = {
  f1ProdTestAcFlowData,
  getNextProdF1UniqueListing,
  getNextProdF1Counter,
};
