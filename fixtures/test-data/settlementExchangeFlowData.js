const path = require("path");

const settlementExchangeFlowData = {
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
    },

    // Agent login
    email: "agent@test.com",
    password: "Test@123",
    otp: "123456",
  },

  // =====================================================
  // GENERAL USER / BUYER
  // =====================================================

  generalUser: {
    email: "buyer@test.com",

    password: "Test@123",

    otp: "123456",

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
      "buyer.solicitor@test.com",

    password:
      "Test@123",

    otp:
      "123456",

    searchText:
      "Hasan",
  },

  // =====================================================
  // SELLER SOLICITOR
  // =====================================================

  sellerSolicitor: {
    email:
      "seller.solicitor@test.com",

    password:
      "Test@123",

    otp:
      "123456",
  },

  // =====================================================
  // VENDOR
  // =====================================================

  vendor: {
    name:
      "Automation Vendor",

    email:
      "automation.vendor@example.com",

    phone:
      "0400000000",

    password:
      "Test@123",

    otp:
      "123456",
  },

  // =====================================================
  // SETTLEMENT
  // =====================================================

  settlement: {
    // Buyer Solicitor
    solicitorSearch:
      "Hasan",

    // Mortgage Broker
    brokerSearch:
      "subrato",

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
      /settlement completed|settlement complete|completed successfully/i,

    // Exchange
    readyForExchange:
      /Ready for Exchange/i,

    exchangeInitiated:
      /exchange initiated|exchange started|initiated successfully/i,

    // Buyer signing
    buyerAssigned:
      /assigned.*signing|buyer assigned|assigned successfully/i,

    buyerSigned:
      /buyer.*signed|signed.*buyer|signing completed/i,

    // Document transfer
    passedToSellerSolicitor:
      /passed.*seller solicitor|sent.*seller solicitor|successfully sent/i,

    // Vendor
    vendorAdded:
      /vendor.*added|added successfully/i,

    passedToVendor:
      /passed.*vendor|sent.*vendor|vendor.*received/i,

    vendorSigned:
      /vendor.*signed|signed.*vendor|signing completed/i,

    // Settlement date
    settlementDateProposed:
      /settlement date.*proposed|date proposed|proposed successfully/i,

    settlementDateAccepted:
      /settlement date.*accepted|date accepted|accepted successfully/i,

    // Calendar
    calendar:
      /calendar/i,
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