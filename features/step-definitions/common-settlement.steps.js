const { Then, When } = require("@cucumber/cucumber");
const { listingData } = require("../../fixtures/test-data/listingData");
const { offerPriceFlowData } = require("../../fixtures/test-data/offerPriceFlowData");
const { auctionFlowData } = require("../../fixtures/test-data/auctionFlowData");
const { auctionReserveNotMetFlowData } = require("../../fixtures/test-data/auctionReserveNotMetFlowData");
const { salesInstructionsFlowData } = require("../../fixtures/test-data/salesInstructionsFlowData");
const { settlementExchangeFlowData } = require("../../fixtures/test-data/settlementExchangeFlowData");

Then(
  /^the Agent verifies the settlement shows (?:5\/5|all) steps completed$/,
  async function () {
    const propertyTitle =
      this.createdListingTitle ||
      listingData?.fixedPriceFlow?.agent?.listing?.title ||
      offerPriceFlowData?.agent?.listing?.title ||
      auctionFlowData?.agent?.listing?.title ||
      auctionReserveNotMetFlowData?.agent?.listing?.title ||
      salesInstructionsFlowData?.agent?.listing?.expectedPropertyName ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      null;

    await this.settlementPage.verifyAgentSettlementSetupComplete(propertyTitle);
  }
);
