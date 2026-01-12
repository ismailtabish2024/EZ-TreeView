// src/components/TreeView/mockApi.ts

import { Node } from "./treeUtils";

const db: Record<string, Node[]> = {
  root: [
    { id: "A", name: "A", parentId: null, hasChildren: true },
    { id: "B1", name: "B", parentId: null, hasChildren: true },
  ],

  A: [
    { id: "A-B", name: "B", parentId: "A", hasChildren: true },
    { id: "A-B2", name: "B", parentId: "A", hasChildren: false },
  ],

  "A-B": [
    { id: "A-B-C1", name: "C", parentId: "A-B", hasChildren: true },
    { id: "A-B-C2", name: "C", parentId: "A-B", hasChildren: false },
  ],

  "A-B-C1": [
    { id: "A-B-C1-D", name: "D", parentId: "A-B-C1", hasChildren: false },
  ],

  B1: [
    { id: "B1-C1", name: "C", parentId: "B1", hasChildren: false },
    { id: "B1-C2", name: "C", parentId: "B1", hasChildren: false },
  ],
};

export const fetchChildren = async (parentId: string): Promise<Node[]> => {
  await new Promise((r) => setTimeout(r, 700)); // simulate delay
  return db[parentId] ? db[parentId].map((n) => ({ ...n })) : [];
};

// Test function to verify API
export const testApi = async () => {
  console.log("Testing fetchChildren API...");
  try {
    const rootData = await fetchChildren("root");
    console.log("Root data:", rootData);
    if (rootData.length > 0) {
      const childData = await fetchChildren(rootData[0].id);
      console.log("Child data for", rootData[0].id, ":", childData);
    }
    console.log("API is working!");
  } catch (error) {
    console.error("API test failed:", error);
  }
};
