const path = require("path");

const settlementExchangeFlowData = {
  // =====================================================
  // AGENT LISTING
  // =====================================================

  agent: {
    listing: {
      addressSearchText: "Arndale Shopping Centre Access",

      expectedPropertyName:
        "Arndale Shopping Centre Access, Kilkenny",

      propertyType: "House",

      bedrooms: 3,

      bathrooms: 2,

      carSpaces: 1,

      listingType: "Fixed Price",

      priceGuide: "50000",

      headline:
        "Settlement Exchange Automation Test Property",

      propertyDescription:
        "Beautiful and spacious family home created for settlement, exchange, document signing, and settlement date automation testing.",

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

      sellerSolicitorSearch: "solicitor.c4utest@yopmail.com",
    },

    // Agent login
    email:
      process.env.AGENT_EMAIL || "agent.c4utest@yopmail.com",
    password:
      process.env.AGENT_PASSWORD || "Test12345@",
    otp:
      process.env.AGENT_OTP || "123456",
  },

  // =====================================================
  // GENERAL USER / BUYER
  // =====================================================

  generalUser: {
    email:
      process.env.GENERAL_USER_EMAIL || "buyer.c4utest@yopmail.com",

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
  // BUYER SOLICITOR
  // =====================================================

  buyerSolicitor: {
    email:
      process.env.BUYER_SOLICITOR_EMAIL || "buyersolicitor.c4utest@yopmail.com",

    password:
      process.env.BUYER_SOLICITOR_PASSWORD || "Test12345@",

    otp:
      process.env.BUYER_SOLICITOR_OTP || "123456",

    name:
      "Maxel Montana",

    searchText:
      "Maxel",
  },

  // =====================================================
  // SELLER SOLICITOR
  // =====================================================

  sellerSolicitor: {
    email:
      process.env.SELLER_SOLICITOR_EMAIL || "solicitor.c4utest@yopmail.com",

    password:
      process.env.SELLER_SOLICITOR_PASSWORD || "Test12345@",

    otp:
      process.env.SELLER_SOLICITOR_OTP || "123456",

    name:
      "James Anderson",

    searchText:
      "James",
  },

  // =====================================================
  // VENDOR
  // =====================================================

  vendor: {
    name:
      "Sandy Bosch",

    email:
      process.env.VENDOR_EMAIL || "secondbuyer.c4utest@yopmail.com",

    phone:
      "0400000000",

    password:
      process.env.VENDOR_PASSWORD || "Test12345@",

    otp:
      process.env.VENDOR_OTP || "123456",
  },

  // =====================================================
  // SETTLEMENT
  // =====================================================

  settlement: {
    // Buyer Solicitor
    solicitorSearch:
      "Maxel",

    // Mortgage Broker
    brokerSearch:
      "Alen",

    // Fixed settlement date
    date:
      "30/09/2026",

    statusReadyForExchange:
      "Ready for Exchange",

    exchangeStatus:
      "Exchange Initiated",

    buyerSignedStatus:
      "Signed",

    vendorSignedStatus:
      "Signed",
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
  // DOCUMENT SIGNING
  // =====================================================

  documentSigning: {
    buyer: {
      expectedStatus:
        "Signed",
    },

    vendor: {
      expectedStatus:
        "Signed",
    },
  },

  // =====================================================
  // EXCHANGE
  // =====================================================

  exchange: {
    readyForExchange:
      "Ready for Exchange",

    initiated:
      "Exchange Initiated",

    buyerAssigned:
      "Assigned for Signing",

    passedToSellerSolicitor:
      "Passed to Seller Solicitor",

    passedToVendor:
      "Passed to Vendor",
  },

  // =====================================================
  // SETTLEMENT DATE
  // =====================================================

  settlementDate: {
    proposedDate:
      "30/09/2026",

    proposedStatus:
      "Proposed",

    acceptedStatus:
      "Accepted",

    calendarDate:
      "30/09/2026",
  },

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  notifications: {
    settlementDate: {
      expectedText:
        "Settlement date",

      proposed:
        /settlement date.*proposed|date proposed/i,

      accepted:
        /settlement date.*accepted|date accepted/i,
    },
  },

  // =====================================================
  // EXPECTED RESULTS
  // =====================================================

  expected: {
    // Listing
    listingPublished:
      /published successfully|listing published/i,

    // Offer
    offerSubmitted:
      /Offer Submitted Successfully/i,

    offerAccepted:
      /accepted|offer accepted/i,

    // Payment
    paymentSuccessful:
      /Payment Successful/i,

    // Settlement
    settlementCompleted:
      /settlement completed|settlement complete|settlement process initiated|congratulations|completed successfully/i,

    // Exchange
    readyForExchange:
      /Ready for Exchange/i,

    exchangeInitiated:
      /exchange initiated|exchange started|initiated successfully|exchange pending|pending exchange/i,

    // Buyer signing
    buyerAssigned:
      /assigned.*signing|buyer assigned|assigned successfully|assigned|ready for signing|signing|sent for signing/i,

    buyerSigned:
      /buyer.*signed|signed.*buyer|signing completed|\bSigned\b|Buyer Signed|Documents Signed/i,

    // Document transfer
    passedToSellerSolicitor:
      /passed.*seller solicitor|sent.*seller solicitor|successfully sent|passed/i,

    // Vendor
    vendorAdded:
      /vendor.*added|added successfully|Automation Vendor/i,

    passedToVendor:
      /passed.*vendor|sent.*vendor|vendor.*received|passed/i,

    vendorSigned:
      /vendor.*signed|signed.*vendor|signing completed|\bSigned\b|Vendor Signed|Documents Signed/i,

    // Settlement date
    settlementDateProposed:
      /1\/2 confirmed|confirmed \(1\/2\)|settlement date.*proposed|date proposed|proposed successfully|settlement date/i,

    settlementDateAccepted:
      /completed|exchange completed|confirmed \(2\/2\)|2\/2 confirmed|settlement date.*accepted|date accepted|accepted successfully|settlement date/i,

    // Calendar
    calendar:
      /calendar|schedule/i,
  },

  // =====================================================
  // TIMEOUTS
  // =====================================================

  timeouts: {
    navigation:
      30000,

    action:
      15000,

    notification:
      20000,

    documentSigning:
      30000,

    calendar:
      20000,
  },
};

module.exports = {
  settlementExchangeFlowData,
};