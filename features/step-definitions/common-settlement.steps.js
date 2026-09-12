const { Then, When } = require("@cucumber/cucumber");
const { listingData } = require("../../fixtures/test-data/listingData");
const { offerPriceFlowData } = require("../../fixtures/test-data/offerPriceFlowData");
const { auctionFlowData } = require("../../fixtures/test-data/auctionFlowData");
const { auctionReserveNotMetFlowData } = require("../../fixtures/test-data/auctionReserveNotMetFlowData");
const { salesInstructionsFlowData } = require("../../fixtures/test-data/salesInstructionsFlowData");
const { settlementExchangeFlowData } = require("../../fixtures/test-data/settlementExchangeFlowData");

function getPropertyTitleForWorld(world) {
  if (world?.createdListingTitle) {
    return world.createdListingTitle;
  }

  const tags = (world?.pickle?.tags || []).map((t) => t.name);

  if (tags.includes("@flow-2")) {
    return offerPriceFlowData?.agent?.listing?.expectedPropertyName || "Bourke Street, Melbourne";
  }
  if (tags.includes("@flow-3")) {
    return auctionFlowData?.agent?.listing?.expectedPropertyName || "Chapel Street, South Yarra";
  }
  if (tags.includes("@flow-4")) {
    return auctionReserveNotMetFlowData?.agent?.listing?.expectedPropertyName || "Degraves Street, Melbourne";
  }
  if (tags.includes("@flow-6")) {
    return settlementExchangeFlowData?.agent?.listing?.expectedPropertyName || "10 London Circuit";
  }
  if (tags.includes("@flow-7")) {
    return salesInstructionsFlowData?.agent?.listing?.expectedPropertyName || "10 London Circuit";
  }
  if (tags.includes("@flow-1")) {
    return listingData?.location?.expectedPropertyName || "Arndale Shopping Centre Access, Kilkenny";
  }

  return (
    world?.createdListingTitle ||
    offerPriceFlowData?.agent?.listing?.expectedPropertyName ||
    auctionFlowData?.agent?.listing?.expectedPropertyName ||
    auctionReserveNotMetFlowData?.agent?.listing?.expectedPropertyName ||
    listingData?.location?.expectedPropertyName ||
    null
  );
}

Then(
  /^the Agent verifies the settlement shows (?:5\/5|all) steps completed$/,
  async function () {
    const propertyTitle = getPropertyTitleForWorld(this);
    await this.settlementPage.verifyAgentSettlementSetupComplete(propertyTitle);
  }
);
