type DevelopmentEmailType =
  | "verification"
  | "password-reset"
  | "email-change-confirmation"
  | "organization-invitation";

export function logDevelopmentEmail(
  type: DevelopmentEmailType,
  recipient: string,
  url: string,
): void {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "A real email provider must be configured outside development.",
    );
  }

  console.info("\n======================================");
  console.info(`TENANTBOARD ${type.toUpperCase()} EMAIL`);
  console.info("======================================");
  console.info(`Recipient: ${recipient}`);
  console.info(`Action URL: ${url}`);
  console.info("======================================\n");
}
