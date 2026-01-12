import { useState, memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Node } from "./treeUtils";

const TreeNodeItem = ({
  node,
  expanded,
  toggle,
  onAdd,
  onDelete,
  onEdit,
  level,
}: {
  node: Node;
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
  onAdd: (parentId: string | null) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newName: string) => void;
  level: number;
}) => {
  const isOpen = !!expanded[node.id];

  // sortable
  const sortable = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
  };

  //  drop zones (ids are unique and not conflicting with sortable)
  const topDrop = useDroppable({ id: `drop-top:${node.id}` });
  const centerDrop = useDroppable({ id: `drop-center:${node.id}` });
  const bottomDrop = useDroppable({ id: `drop-bottom:${node.id}` });

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(node.name);

  const save = () => {
    setEditing(false);
    if (value.trim() && value.trim() !== node.name) {
      onEdit(node.id, value.trim());
    } else {
      setValue(node.name);
    }
  };

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className={`${
        centerDrop.isOver ? "outline outline-2 outline-blue-500 outline-offset-2" : ""
      }`}
    >
      {/*  Drop Top */}
      <div
        ref={topDrop.setNodeRef}
        className={`h-2 rounded-xl opacity-50 transition duration-150 ${topDrop.isOver ? "opacity-100 bg-blue-500" : "bg-gray-200"}`}
        style={{ marginLeft: level * 32 }}
      />

      {/* Row */}
      <div className="flex items-center gap-2.5 px-2 py-1.5" style={{ marginLeft: level * 32 }}>
        {/* Drag handle */}
        <span className="cursor-grab text-lg px-1 text-gray-500 select-none" {...sortable.attributes} {...sortable.listeners}>
          ⠿
        </span>

        {/* Expand */}
        <button
          className="w-7 h-7 border-none bg-transparent cursor-pointer text-lg"
          onClick={() => toggle(node.id)}
          disabled={!node.hasChildren}
        >
          {node.hasChildren ? (isOpen ? "▾" : "▸") : "•"}
        </button>

        {/*  Drop Center (Make Child) */}
        <div ref={centerDrop.setNodeRef} className="flex items-center gap-2.5 px-1 py-0.5 rounded-xl">
          <div className={`w-9 h-9 rounded-full grid place-items-center font-bold text-white shadow-md ${level === 0 ? "bg-blue-500" : "bg-green-400"}`}>
            {node.name[0]?.toUpperCase()}
          </div>

          {!editing ? (
            <span className="min-w-32 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm cursor-pointer" onDoubleClick={() => setEditing(true)}>
              {node.name}
            </span>
          ) : (
            <input
              autoFocus
              className="min-w-32 px-2.5 py-1 rounded-xl border border-gray-400 text-sm"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
                if (e.key === "Escape") {
                  setEditing(false);
                  setValue(node.name);
                }
              }}
            />
          )}
        </div>

        {/* Actions */}
        <button className="w-7 h-7 border border-gray-300 bg-white rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onAdd(node.id)}>
          +
        </button>
        <button className="w-7 h-7 border border-gray-300 bg-white rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => setEditing(true)}>
          E
        </button>
        <button className="w-7 h-7 border border-red-300 bg-white rounded-lg cursor-pointer hover:bg-red-50 text-red-600" onClick={() => onDelete(node.id)}>
          ✕
        </button>
      </div>

      {/*  Drop Bottom */}
      <div
        ref={bottomDrop.setNodeRef}
        className={`h-2 rounded-xl opacity-50 transition duration-150 ${bottomDrop.isOver ? "opacity-100 bg-blue-500" : "bg-gray-200"}`}
        style={{ marginLeft: level * 32 }}
      />

      {/* Children */}
      {isOpen && (
        <div className="tree-children">
          {node.isLoading ? (
            <div className="text-sm px-2 py-1 text-gray-500" style={{ marginLeft: (level + 1) * 32 }}>
              Loading...
            </div>
          ) : (
            <SortableContext
              items={node.children?.map((n) => n.id) || []}
              strategy={verticalListSortingStrategy}
            >
              {node.children?.map((child) => (
                <TreeNodeItem
                  key={child.id}
                  node={child}
                  expanded={expanded}
                  toggle={toggle}
                  onAdd={onAdd}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  level={level + 1}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(TreeNodeItem);
