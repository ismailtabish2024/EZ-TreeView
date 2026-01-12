import TreeView from "./components/TreeView/TreeView.tsx";
import { testApi } from "./components/TreeView/mockApi.ts";

// Run API test on app load
testApi();

export default function App() {
  return <TreeView />;
}