import { useAppStore } from "../state/AppStore";
import { formatMoney as originalFormatMoney } from "./finance";

export const useFinance = () => {
  const { preferences } = useAppStore();
  
  const formatMoney = (val: number | string | undefined | null) => {
    return originalFormatMoney(val, preferences?.isPrivacyEnabled || false);
  };

  return { formatMoney };
};
