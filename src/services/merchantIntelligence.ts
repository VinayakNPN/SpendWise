import { getMerchantMappings } from "./database";
import type { MerchantMapping } from "../state/types";

export const suggestForMerchant = (merchantInput: string): { category?: string, accountId?: string, confidence: number } => {
  if (!merchantInput) return { confidence: 0 };
  
  const mappings = getMerchantMappings();
  if (mappings.length === 0) return { confidence: 0 };
  
  const inputLower = merchantInput.toLowerCase().trim();
  
  // Find best exact or partial match
  let bestMatch: MerchantMapping | null = null;
  
  for (const m of mappings) {
    const nameLower = m.merchant_name.toLowerCase();
    
    if (nameLower === inputLower) {
      bestMatch = m;
      break; // exact match
    } else if (nameLower.includes(inputLower) || inputLower.includes(nameLower)) {
      if (!bestMatch || m.usage_count > bestMatch.usage_count) {
        bestMatch = m;
      }
    }
  }
  
  if (bestMatch) {
    return {
      category: bestMatch.category || undefined,
      accountId: bestMatch.account_id || undefined,
      confidence: bestMatch.usage_count > 5 ? 0.9 : 0.6,
    };
  }
  
  return { confidence: 0 };
};
