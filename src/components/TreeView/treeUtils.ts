// src/components/TreeView/treeUtils.ts

export interface Node {
  id: string;
  name: string;
  parentId: string | null;
  hasChildren: boolean;
  children?: Node[];
  isLoading?: boolean;
}

export function updateNode(nodes: Node[], nodeId: string, updater: (node: Node) => Node): Node[] {
  return nodes.map((n) => {
    if (n.id === nodeId) return updater(n);

    if (n.children) {
      return { ...n, children: updateNode(n.children, nodeId, updater) };
    }
    return n;
  });
}

export function deleteNode(nodes: Node[], nodeId: string): Node[] {
  return nodes
    .filter((n) => n.id !== nodeId)
    .map((n) =>
      n.children ? { ...n, children: deleteNode(n.children, nodeId) } : n
    );
}

export function addChild(nodes: Node[], parentId: string, child: Node): Node[] {
  return updateNode(nodes, parentId, (node) => ({
    ...node,
    children: node.children ? [...node.children, child] : [child],
    hasChildren: true,
  }));
}

export function findNode(nodes: Node[], id: string): Node | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function isDescendant(tree: Node[], parentId: string, childId: string): boolean {
  const parent = findNode(tree, parentId);
  if (!parent?.children?.length) return false;

  const stack = [...parent.children];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;
    if (cur.id === childId) return true;
    if (cur.children?.length) stack.push(...cur.children);
  }
  return false;
}

export function detachNode(nodes: Node[], nodeId: string): { removed: Node | null; tree: Node[] } {
  let removed: Node | null = null;

  const dfs = (arr: Node[]): Node[] => {
    return arr
      .filter((n) => {
        if (n.id === nodeId) {
          removed = n;
          return false;
        }
        return true;
      })
      .map((n) => ({
        ...n,
        children: n.children ? dfs(n.children) : n.children,
      }));
  };

  return { removed, tree: dfs(nodes) };
}

export function attachNode(nodes: Node[], parentId: string | null, node: Node, index: number): Node[] {
  if (parentId === null) {
    const root = [...nodes];
    root.splice(index, 0, node);
    return root;
  }

  return nodes.map((n) => {
    if (n.id === parentId) {
      const children = n.children ? [...n.children] : [];
      children.splice(index, 0, node);
      return { ...n, children, hasChildren: true };
    }

    return {
      ...n,
      children: n.children
        ? attachNode(n.children, parentId, node, index)
        : n.children,
    };
  });
}

export function getSiblings(nodes: Node[], parentId: string | null): Node[] {
  if (parentId === null) return nodes;
  const parent = findNode(nodes, parentId);
  return parent?.children || [];
}
