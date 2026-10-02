const path = require("path");

const isStaging = (process.env.BASE_URL || "").includes("staging");

const fixedPriceTaskListFlowData = {
  // =====================================================
  // AGENT LISTING
  // =====================================================

  agent: {
    listing: {
      addressSearchText:
        process.env.FLOW8_ADDRESS ||
        process.env.DEFAULT_LISTING_ADDRESS ||
        (isStaging ? "199 William Street, Melbourne VIC, Australia" : "Chapel Street"),

      // Change if the actual Google-selected address is different.
      expectedPropertyName:
        process.env.FLOW8_EXPECTED_PROPERTY_NAME ||
        (isStaging ? "199 William Street, Melbourne" : "Chapel Street, South Yarra"),

      propertyType: "House",

      bedrooms: 3,
      bathrooms: 2,
      carSpaces: 1,

      listingType: "Fixed Price",

      priceGuide: "650000",

      headline:
        "Fixed Price Automation Property",

      propertyDescription:
        "Fixed Price property created through Playwright automation " +
        "for validating the Configure Progress Task List behaviour.",

      keyFeatures: [
        "Air Conditioning",
        "Dishwasher",
        "Built-in Wardrobes",
        "Floorboards",
        "Garden",
        "Balcony",
        "Garage",
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

      sellerSolicitorSearch:
        process.env.SELLER_SOLICITOR_SEARCH ||
        process.env.SELLER_SOLICITOR_EMAIL ||
        (isStaging ? "subratotest99.2@gmail.com" : "solicitor.c4utest@yopmail.com"),
    },
  },

  // =====================================================
  // SELLER SOLICITOR
  // =====================================================

  sellerSolicitor: {
    email:
      process.env.SELLER_SOLICITOR_EMAIL ||
      (isStaging ? "subratotest99.2@gmail.com" : "solicitor.c4utest@yopmail.com"),

    password:
      process.env.SELLER_SOLICITOR_PASSWORD ||
      "Test12345@",

    otp:
      process.env.SELLER_SOLICITOR_OTP ||
      "123456",

    name:
      isStaging ? "James Anderson Staging" : "James Anderson",

    templateName:
      "Standard Conveyancing Process",
  },

  // =====================================================
  // GENERAL USER
  // =====================================================

  generalUser: {
    email:
      process.env.GENERAL_USER_EMAIL ||
      (isStaging ? "subratotest99.3@gmail.com" : "buyer.c4utest@yopmail.com"),

    password:
      process.env.GENERAL_USER_PASSWORD ||
      "Test12345@",

    otp:
      process.env.GENERAL_USER_OTP ||
      "123456",

    // Used for GeneralUserListingsPage search
    searchText:
      process.env.FLOW8_ADDRESS ||
      (isStaging ? "199 William Street" : "Chapel Street"),

    // Buyer initial direct offer
    offerAmount: "600000",
  },

  // =====================================================
  // AGENT COUNTER OFFER
  // =====================================================

  counterOffer: {
    amount: "625000",
  },

  // =====================================================
  // SETTLEMENT
  // =====================================================

  settlement: {
    solicitorSearch:
      process.env.BUYER_SOLICITOR_SEARCH ||
      (isStaging ? "subrato" : "Maxel"),
    brokerSearch:
      process.env.BROKER_SEARCH ||
      (isStaging ? "subrato" : "Alen"),
  },

  // =====================================================
  // PAYMENT
  // =====================================================

  payment: {
    cardNumber:
      process.env.TEST_CARD_NUMBER ||
      "4242 4242 4242 4242",

    expiry:
      process.env.TEST_CARD_EXPIRY ||
      "07/28",

    cvc:
      process.env.TEST_CARD_CVC ||
      "123",
  },

  // =====================================================
  // EXPECTED RESULTS
  // =====================================================

  expected: {
    offerSubmitted:
      /Offer Submitted Successfully/i,

    counterOfferSent:
      /counter offer/i,

    offerAccepted:
      /accepted|offer accepted/i,

    paymentSuccessful:
      /Payment Successful/i,
  },
};

module.exports = {
  fixedPriceTaskListFlowData,
};
