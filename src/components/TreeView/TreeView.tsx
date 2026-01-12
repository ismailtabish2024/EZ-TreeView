// src/components/TreeView/TreeView.tsx

import { useEffect, useState, memo, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import TreeNodeItem from "./TreeNodeItem";
import { fetchChildren } from "./mockApi";

import {
  addChild,
  attachNode,
  deleteNode,
  detachNode,
  findNode,
  getSiblings,
  isDescendant,
  updateNode,
  Node,
} from "./treeUtils";

const TreeView = () => {
  const [tree, setTree] = useState<Node[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchChildren("root").then(setTree);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const toggle = useCallback(async (id: string) => {
    const isOpen = !!expanded[id];
    setExpanded((p) => ({ ...p, [id]: !isOpen }));

    if (!isOpen) {
      const node = findNode(tree, id);

      if (node?.hasChildren && (!node.children || node.children.length === 0)) {
        setTree((prev) =>
          updateNode(prev, id, (n) => ({
            ...n,
            isLoading: true,
          }))
        );

        const children = await fetchChildren(id);

        setTree((prev) =>
          updateNode(prev, id, (n) => ({
            ...n,
            children,
            isLoading: false,
          }))
        );
      }
    }
  }, [tree, expanded]);

  const onAdd = useCallback((parentId: string | null) => {
    const name = prompt("Enter node name:");
    if (!name) return;

    const newNode: Node = {
      id: crypto.randomUUID(),
      name,
      parentId,
      hasChildren: false,
    };

    if (parentId === null) {
      setTree((prev) => [...prev, newNode]);
    } else {
      setTree((prev) => addChild(prev, parentId, newNode));
      setExpanded((p) => ({ ...p, [parentId]: true }));
    }
  }, []);

  const onDelete = useCallback((id: string) => {
    const ok = confirm("Delete this node and all children?");
    if (!ok) return;
    setTree((prev) => deleteNode(prev, id));
  }, []);

  const onEdit = useCallback((id: string, newName: string) => {
    setTree((prev) => updateNode(prev, id, (n) => ({ ...n, name: newName })));
  }, []);

  //  parse droppable id: "nodeId__top" | "__center" | "__bottom"
  const parseDropId = useCallback((dropId: string) => {
  const str = String(dropId);

  // drop-top:nodeId | drop-center:nodeId | drop-bottom:nodeId
  const [type, targetId] = str.split(":");
  return { type, targetId };
}, []);

 const onDragEnd = useCallback((event: any) => {
  const { active, over, collisions } = event;
  if (!over) return;

  const draggedId = String(active.id);

  // Find the drop zone collision
  const dropCollision = collisions?.find((c: any) => String(c.id).startsWith("drop-"));
  const overId = dropCollision ? String(dropCollision.id) : String(over.id);

  const { type, targetId } = parseDropId(overId);

  if (draggedId === targetId) return;

  const draggedNode = findNode(tree, draggedId);
  const targetNode = findNode(tree, targetId);

  if (!draggedNode || !targetNode) return;

  //  invalid drop into own subtree
  if (isDescendant(tree, draggedId, targetId)) return;

  const { removed, tree: removedTree } = detachNode(tree, draggedId);
  if (!removed) return;

  //  CENTER => make child
  if (type === "drop-center") {
    const moved = { ...removed, parentId: targetId };

    // if children not loaded yet, create empty children array
    const parent = findNode(removedTree, targetId);
    const count = parent?.children?.length || 0;

    const next = attachNode(removedTree, targetId, moved, count);

    setExpanded((p) => ({ ...p, [targetId]: true }));
    setTree(next);
    return;
  }

  // ✅ TOP/BOTTOM => reorder siblings under target parent
  const targetParentId = targetNode.parentId;

  const siblings = getSiblings(removedTree, targetParentId);
  const targetIndex = siblings.findIndex((n) => n.id === targetId);

  let insertIndex = targetIndex;
  if (type === "drop-bottom") insertIndex = targetIndex + 1;

  const moved = { ...removed, parentId: targetParentId };
  const next = attachNode(removedTree, targetParentId, moved, insertIndex);

  setTree(next);
}, [tree, expanded, parseDropId]);

  return (
    <div className="p-5 font-sans">
      <button
        className="mb-2.5 px-3 py-2 border border-gray-300 bg-white rounded-lg cursor-pointer hover:bg-gray-50"
        onClick={() => onAdd(null)}
      >
        Add Root
      </button>
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext
          items={tree.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          {tree.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              expanded={expanded}
              toggle={toggle}
              onAdd={onAdd}
              onDelete={onDelete}
              onEdit={onEdit}
              level={0}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default memo(TreeView);
