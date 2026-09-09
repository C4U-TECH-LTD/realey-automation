const path = require("path");

const salesInstructionsFlowData = {
  // =====================================================
  // AGENT LISTING
  // =====================================================

  agent: {
    listing: {
      addressSearchText: "a",

      expectedPropertyName:
        "Arndale Shopping Centre Access, Kilkenny",

      propertyType: "House",

      bedrooms: 3,

      bathrooms: 2,

      carSpaces: 1,

      listingType: "Fixed Price",

      priceGuide: "50000",

      headline:
        "Sales Instructions Automation Test Property",

      propertyDescription:
        "Beautiful and spacious family home created for Sales Instructions end-to-end automation testing.",

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
      process.env.GENERAL_USER_EMAIL || "siamtest1999+3@gmail.com",

    password:
      process.env.GENERAL_USER_PASSWORD || "Test12345@",

    otp:
      process.env.GENERAL_USER_OTP || "123456",

    searchText:
      "Arndale Shopping Centre Access",

    offerAmount:
      "25000",
  },

  // =====================================================
  // SETTLEMENT
  // =====================================================

  settlement: {
    solicitorSearch:
      "Hasan",

    brokerSearch:
      "subrato",
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
      "5000",
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
      /Sales Instructions/i,

    emailSubject:
      /Sales Instructions/i,

    notification:
      /Sales Instructions/i,
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
      /settlement completed|settlement complete|completed successfully/i,

    salesInstructionsAvailable:
      /Sales Instructions/i,

    documentGenerated:
      /Sales Instructions/i,

    firmLabel:
      /Firm/i,

    agentLicenceLabel:
      /Agent Licence No/i,

    agencyLicenceLabel:
      /Agency Licence No/i,

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
    action: 15000,

    notification: 20000,

    email: 30000,
  },
};

module.exports = {
  salesInstructionsFlowData,
};