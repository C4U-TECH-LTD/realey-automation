const path = require("path");

const salesInstructionsFlowData = {
  // =====================================================
  // AGENT LISTING (ACT Address required for Sales Instructions)
  // =====================================================

  agent: {
    email:
      process.env.FLOW7_AGENT_EMAIL ||
      process.env.AGENT_EMAIL ||
      "agent.c4utest@yopmail.com",

    password:
      process.env.FLOW7_AGENT_PASSWORD ||
      process.env.AGENT_PASSWORD ||
      "Test12345@",

    otp:
      process.env.FLOW7_AGENT_OTP ||
      process.env.AGENT_OTP ||
      "123456",

    listing: {
      addressSearchText: "10 London Circuit, Canberra ACT 2601",

      expectedPropertyName:
        "10 London Circuit",

      propertyType: "House",

      bedrooms: 3,

      bathrooms: 2,

      carSpaces: 1,

      listingType: "Fixed Price",

      priceGuide: "50000",

      headline:
        "ACT Sales Instructions Automation Property",

      propertyDescription:
        "Beautiful and spacious ACT home created for Sales Instructions end-to-end automation testing.",

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
        path.resolve(
          process.cwd(),
          "test-assets/listing/property-1.jpg"
        ),
        path.resolve(
          process.cwd(),
          "test-assets/listing/property-2.jpg"
        ),
      ],

      floorPlan: path.resolve(
        process.cwd(),
        "test-assets/listing/floor-plan.jpg"
      ),
    },
  },

  // =====================================================
  // GENERAL USER / BUYER
  // =====================================================

  generalUser: {
    email:
      process.env.FLOW7_BUYER_EMAIL ||
      process.env.GENERAL_USER_EMAIL ||
      "siamtest1999+3@gmail.com",

    password:
      process.env.FLOW7_BUYER_PASSWORD ||
      process.env.GENERAL_USER_PASSWORD ||
      "Test12345@",

    otp:
      process.env.FLOW7_BUYER_OTP ||
      process.env.GENERAL_USER_OTP ||
      "123456",

    searchText:
      "10 London Circuit",

    offerAmount:
      "25000",
  },

  // =====================================================
  // BROKER
  // =====================================================

  broker: {
    email:
      process.env.FLOW7_BROKER_EMAIL ||
      "broker.c4utest@yopmail.com",

    password:
      process.env.FLOW7_BROKER_PASSWORD ||
      "Test12345@",

    otp:
      process.env.FLOW7_BROKER_OTP ||
      "123456",

    name: "Alen Mayer",
    searchText: "Alen",
  },

  // =====================================================
  // SOLICITOR
  // =====================================================

  solicitor: {
    email:
      process.env.FLOW7_SOLICITOR_EMAIL ||
      "solicitor.c4utest@yopmail.com",

    password:
      process.env.FLOW7_SOLICITOR_PASSWORD ||
      "Test12345@",

    otp:
      process.env.FLOW7_SOLICITOR_OTP ||
      "123456",

    name: "James Anderson",
    searchText: "James",
  },

  // =====================================================
  // EXCLUDED USERS (BUYER & VENDOR)
  // =====================================================

  excludedUsers: {
    buyer: {
      email:
        process.env.FLOW7_BUYER_EMAIL ||
        process.env.GENERAL_USER_EMAIL ||
        "siamtest1999+3@gmail.com",

      password:
        process.env.FLOW7_BUYER_PASSWORD ||
        process.env.GENERAL_USER_PASSWORD ||
        "Test12345@",

      otp:
        process.env.FLOW7_BUYER_OTP ||
        process.env.GENERAL_USER_OTP ||
        "123456",
    },

    vendor: {
      email:
        process.env.VENDOR_EMAIL ||
        "subratotest99.3@gmail.com",

      password:
        process.env.VENDOR_PASSWORD ||
        "Test12345@",

      otp:
        process.env.VENDOR_OTP ||
        "123456",

      name: "Daniel Carter",
    },
  },

  // =====================================================
  // SETTLEMENT PROFESSIONAL SELECTIONS
  // =====================================================

  settlement: {
    solicitorSearch:
      "James Anderson",

    brokerSearch:
      "Alen",
  },

  // =====================================================
  // CREDIT CARD / DEPOSIT PAYMENT
  // =====================================================

  payment: {
    cardNumber:
      "4242424242424242",

    expiry:
      "12/30",

    cvc:
      "123",

    cardholderName:
      "Automation Buyer",

    postcode:
      "2601",
  },

  // =====================================================
  // SALES INSTRUCTIONS
  // =====================================================

  salesInstructions: {
    buttonText:
      "Sales Instructions",

    documentTitle:
      "Sales Instructions",
  },

  // =====================================================
  // EXPECTED RECIPIENTS
  // =====================================================

  recipients: {
    broker:
      "Broker",

    sellerSolicitor:
      "Seller Solicitor",

    buyerSolicitor:
      "Buyer Solicitor",
  },

  // =====================================================
  // EXCLUDED RECIPIENTS
  // =====================================================

  excludedRecipients: {
    buyer:
      "Buyer",

    vendor:
      "Vendor",
  },

  // =====================================================
  // DELIVERY CHANNELS
  // =====================================================

  channels: {
    chatroom:
      "chatroom",

    email:
      "email",

    inApp:
      "in-app",
  },

  // =====================================================
  // SALES INSTRUCTIONS DOCUMENT DATA
  // =====================================================

  document: {
    firm:
      "Automation Real Estate",

    agentLicenceNo:
      "AGENT-LIC-001",

    agencyLicenceNo:
      "AGENCY-LIC-001",
  },

  // =====================================================
  // EXPECTED CONTENT
  // =====================================================

  expectedContent: {
    title:
      /Sales Instructions/i,

    chatroomMessage:
      /Sales Instructions|Sales Document/i,

    emailSubject:
      /Sales Instructions|Sales Document/i,

    notification:
      /Sales Instructions|Sales Document/i,
  },

  // =====================================================
  // EXPECTED RESULTS
  // =====================================================

  expected: {
    listingPublished:
      /published successfully|listing published/i,

    offerSubmitted:
      /Offer Submitted Successfully/i,

    offerAccepted:
      /accepted|offer accepted/i,

    paymentSuccessful:
      /Payment Successful/i,

    settlementCompleted:
      /settlement completed|settlement complete|settlement process initiated|congratulations|completed successfully/i,

    salesInstructionsAvailable:
      /Sales Instructions/i,

    documentGenerated:
      /Sales Instructions/i,

    firmLabel:
      /Firm/i,

    agentLicenceLabel:
      /Agent Licen[cs]e/i,

    agencyLicenceLabel:
      /Agency Licen[cs]e/i,

    errorMessage:
      /error|failed|something went wrong/i,
  },

  // =====================================================
  // DELIVERY COUNT
  // =====================================================

  deliveryCount: {
    beforeSend: 0,

    afterFirstSend: 1,

    afterSecondSend: 1,
  },

  // =====================================================
  // TIMEOUTS
  // =====================================================

  timeout: {
    action: 20000,

    notification: 25000,

    email: 45000,
  },
};

module.exports = {
  salesInstructionsFlowData,
};