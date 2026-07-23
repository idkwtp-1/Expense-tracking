import { supabase } from "./supabase";

export interface QueueItem {
  id: string;
  table: string;
  operation: "upsert" | "delete";
  payload: any;
  createdAt: number;
}

const QUEUE_KEY = "slplayer-sync-queue";

export const getQueue = (): QueueItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Error reading sync queue:", e);
    return [];
  }
};

export const saveQueue = (queue: QueueItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Error saving sync queue:", e);
  }
};

export const enqueue = (
  table: string,
  operation: "upsert" | "delete",
  payload: any,
  id?: string
) => {
  const queue = getQueue();
  const itemId = id || payload.id || `${table}-${Date.now()}-${Math.random()}`;
  
  // Replace duplicate pending operations for the same ID & table
  const filtered = queue.filter((item) => !(item.table === table && item.id === itemId));
  
  filtered.push({
    id: itemId,
    table,
    operation,
    payload,
    createdAt: Date.now(),
  });

  saveQueue(filtered);
};

export const flushQueue = async () => {
  if (typeof window === "undefined" || !navigator.onLine) return;
  const queue = getQueue();
  if (queue.length === 0) return;

  const remaining: QueueItem[] = [];

  for (const item of queue) {
    try {
      if (item.operation === "upsert") {
        const { error } = await supabase.from(item.table).upsert(item.payload);
        if (error) throw error;
      } else if (item.operation === "delete") {
        const keyField = item.table === "budget_limits" ? "category_id" : "id";
        const { error } = await supabase.from(item.table).delete().eq(keyField, item.id);
        if (error) throw error;
      }
    } catch (e) {
      console.warn(`Failed to flush queue item (${item.table}:${item.id}), retaining:`, e);
      remaining.push(item);
    }
  }

  saveQueue(remaining);
};

export const startOnlineWatcher = () => {
  if (typeof window === "undefined") return;
  
  window.addEventListener("online", () => {
    console.log("Device reconnected online. Flushing sync queue...");
    flushQueue();
  });

  // Also attempt an initial flush on mount if online
  if (navigator.onLine) {
    flushQueue();
  }
};
