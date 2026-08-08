const MailosaurClient = require("mailosaur");

class MailosaurHelper {
  /**
   * @param {{
   *   apiKey: string;
   *   serverId: string;
   *   timeout?: number;
   * }} options
   */
  constructor({
    apiKey,
    serverId,
    timeout = 110_000,
  }) {
    if (
      !apiKey ||
      apiKey ===
        "PASTE_YOUR_MAILOSAUR_API_KEY_HERE"
    ) {
      throw new Error(
        [
          "Mailosaur API key is missing.",
          "Open fixtures/test-data/mailosaurSecrets.js",
          "and add your revealed Mailosaur API key.",
        ].join("\n")
      );
    }

    if (!serverId) {
      throw new Error(
        "Mailosaur server ID is missing."
      );
    }

    this.serverId = serverId;
    this.timeout = timeout;
    this.client = new MailosaurClient(apiKey);
  }

  /**
   * Wait for a new email from Mailosaur.
   *
   * @param {{
   *   sentTo: string;
   *   subject?: string;
   *   receivedAfter?: Date;
   *   timeout?: number;
   * }} options
   */
  async waitForEmail({
    sentTo,
    subject = "",
    receivedAfter,
    timeout = this.timeout,
  }) {
    if (!sentTo) {
      throw new Error(
        "Mailosaur recipient address is missing."
      );
    }

    const safeReceivedAfter =
      receivedAfter instanceof Date
        ? receivedAfter
        : new Date(Date.now() - 60_000);

    const criteria = {
      sentTo: String(sentTo).trim(),
    };

    if (
      typeof subject === "string" &&
      subject.trim()
    ) {
      criteria.subject = subject.trim();
    }

    console.log(
      "Waiting for Mailosaur email:",
      {
        serverId: this.serverId,
        criteria,
        receivedAfter:
          safeReceivedAfter.toISOString(),
        timeout,
      }
    );

    try {
      const message =
        await this.client.messages.get(
          this.serverId,
          criteria,
          {
            timeout,
            receivedAfter:
              safeReceivedAfter,
          }
        );

      if (!message) {
        throw new Error(
          "Mailosaur returned an empty message."
        );
      }

      console.log(
        "Mailosaur email found:",
        {
          id: message.id,
          subject: message.subject,
          received: message.received,
          to: message.to,
        }
      );

      return message;
    } catch (error) {
      throw new Error(
        [
          "OTP email was not received from Mailosaur.",
          `Server ID: ${this.serverId}`,
          `Recipient: ${sentTo}`,
          `Subject: ${
            subject || "No subject filter"
          }`,
          `Received after: ${safeReceivedAfter.toISOString()}`,
          `Timeout: ${timeout / 1000} seconds`,
          `Original error: ${error.message}`,
        ].join("\n")
      );
    }
  }

  /**
   * Get readable email content.
   *
   * @param {any} message
   */
  getEmailContent(message) {
    if (!message) {
      throw new Error(
        "Mailosaur message is missing."
      );
    }

    const subject =
      message.subject || "";

    const plainText =
      message.text?.body || "";

    const htmlText =
      message.html?.body || "";

    const content = [
      subject,
      plainText,
      htmlText,
    ]
      .filter(Boolean)
      .join("\n");

    if (!content.trim()) {
      throw new Error(
        "Mailosaur email has no readable content."
      );
    }

    return content;
  }

  /**
   * Extract a 6-digit OTP from the email.
   *
   * @param {any} message
   * @param {RegExp} otpPattern
   */
  extractOtp(
    message,
    otpPattern =
      /Your login code[\s\S]*?(\d{6})/i
  ) {
    const detectedTextCode =
      message.text?.codes?.find(
        (code) =>
          /^\d{6}$/.test(
            String(
              code.value || ""
            ).trim()
          )
      )?.value;

    const detectedHtmlCode =
      message.html?.codes?.find(
        (code) =>
          /^\d{6}$/.test(
            String(
              code.value || ""
            ).trim()
          )
      )?.value;

    const detectedCode =
      detectedTextCode ||
      detectedHtmlCode;

    if (detectedCode) {
      return String(
        detectedCode
      ).trim();
    }

    const content =
      this.getEmailContent(message);

    const match =
      content.match(otpPattern);

    if (!match) {
      /*
       * Final fallback:
       * find any standalone 6-digit number.
       */
      const fallbackMatch =
        content.match(/\b\d{6}\b/);

      if (fallbackMatch) {
        return fallbackMatch[0];
      }

      throw new Error(
        [
          "Unable to find the six-digit login OTP.",
          `Pattern used: ${otpPattern}`,
          `Email subject: ${
            message.subject ||
            "No subject"
          }`,
          "",
          "Email content:",
          content,
        ].join("\n")
      );
    }

    const otp = String(
      match[1] || match[0]
    ).trim();

    if (!/^\d{6}$/.test(otp)) {
      throw new Error(
        `Extracted OTP is invalid: "${otp}"`
      );
    }

    return otp;
  }

  /**
   * Get the login OTP.
   *
   * First tries recipient + subject.
   * If that fails, retries using recipient only.
   *
   * @param {{
   *   sentTo: string;
   *   subject?: string;
   *   receivedAfter?: Date;
   *   otpPattern?: RegExp;
   *   timeout?: number;
   * }} options
   */
  async getLoginOtp({
    sentTo,
    subject = "",
    receivedAfter,
    otpPattern =
      /Your login code[\s\S]*?(\d{6})/i,
    timeout = this.timeout,
  }) {
    let message;

    try {
      message =
        await this.waitForEmail({
          sentTo,
          subject,
          receivedAfter,
          timeout,
        });
    } catch (firstError) {
      if (!subject) {
        throw firstError;
      }

      console.warn(
        "Mailosaur subject search failed. Retrying with recipient only."
      );

      message =
        await this.waitForEmail({
          sentTo,
          subject: "",
          receivedAfter,
          timeout: Math.min(
            timeout,
            60_000
          ),
        });
    }

    const otp = this.extractOtp(
      message,
      otpPattern
    );

    return {
      otp,
      messageId:
        message.id || "",
      subject:
        message.subject || "",
      receivedAt:
        message.received || null,
    };
  }

  /**
   * List recent Mailosaur messages for debugging.
   */
  async listMessages() {
    try {
      const result =
        await this.client.messages.list(
          this.serverId
        );

      const messages =
        result.items || [];

      console.log(
        `Mailosaur messages found: ${messages.length}`
      );

      for (const message of messages) {
        console.log({
          id: message.id,
          subject:
            message.subject,
          received:
            message.received,
          to: message.to,
        });
      }

      return messages;
    } catch (error) {
      throw new Error(
        `Unable to list Mailosaur messages: ${error.message}`
      );
    }
  }
}

module.exports = {
  MailosaurHelper,
};