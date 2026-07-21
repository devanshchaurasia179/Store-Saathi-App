import React, { createContext, useContext, useState, useCallback } from "react";

export interface BillTab {
  id: string;
  items: any[];
  customerId: string;
  customerName: string;
  displayName?: string;
}

interface BillingTabsContextValue {
  tabs: BillTab[];
  setTabs: React.Dispatch<React.SetStateAction<BillTab[]>>;
  activeTabId: string;
  setActiveTabId: React.Dispatch<React.SetStateAction<string>>;
  addNewTab: () => void;
  closeTab: (id: string) => void;
  updateTabItems: (tabId: string, items: any[]) => void;
}

const BillingTabsContext = createContext<BillingTabsContextValue | null>(null);

export function BillingTabsProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<BillTab[]>([
    { id: "tab-1", items: [], customerId: "", customerName: "", displayName: "Bill 1" },
  ]);
  const [activeTabId, setActiveTabId] = useState("tab-1");

  const addNewTab = useCallback(() => {
    const newId = `tab-${Date.now()}`;
    setTabs((prev) => {
      const tabNumber = prev.length + 1;
      return [
        ...prev,
        {
          id: newId,
          items: [],
          customerId: "",
          customerName: "",
          displayName: `Bill ${tabNumber}`,
        },
      ];
    });
    setActiveTabId(newId);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      if (prev.length === 1) {
        const newId = `tab-${Date.now()}`;
        setActiveTabId(newId);
        return [{ id: newId, items: [], customerId: "", customerName: "", displayName: "Bill 1" }];
      }
      const filtered = prev.filter((t) => t.id !== id);
      setActiveTabId((currentActiveId) => {
        if (currentActiveId === id) {
          return filtered[0]?.id ?? "tab-1";
        }
        return currentActiveId;
      });
      return filtered;
    });
  }, []);

  const updateTabItems = useCallback((tabId: string, items: any[]) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, items: [...items] } : tab))
    );
  }, []);

  return (
    <BillingTabsContext.Provider
      value={{ tabs, setTabs, activeTabId, setActiveTabId, addNewTab, closeTab, updateTabItems }}
    >
      {children}
    </BillingTabsContext.Provider>
  );
}

export function useBillingTabs() {
  const ctx = useContext(BillingTabsContext);
  if (!ctx) throw new Error("useBillingTabs must be used within BillingTabsProvider");
  return ctx;
}
