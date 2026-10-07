/**
 * AI Privacy & Data Handling
 * 
 * Defines what data is safe to send to the Cloud AI (Groq) and what must remain local.
 */

// We never send raw account numbers, passwords, or PII.
// For SpendWise, all data sent to Groq is strictly aggregated numbers, category splits, and general metadata.
// In the future, we could add a local-only LLM or proxy.

export const privacyNotice = "Your financial context is securely sent to Groq AI in an anonymized format. We never send raw transaction names, account numbers, or PII. Only aggregated summaries are shared to generate advice.";

export function getPrivacyStatus() {
  return {
    isCloudProcessing: true,
    dataShared: ["Aggregated Balances", "Category Summaries", "Goal Status"],
    dataKeptLocal: ["Merchant Names", "Exact transaction history", "PII"]
  };
}
