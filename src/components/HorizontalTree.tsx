import type { HTMLAttributes, ReactNode } from "react";

// Generic tree node type
export type TreeNode<T = any> = {
  data: T;
  children?: TreeNode<T>[];
};

// Line styling configuration
export type LineStyle = {
  color?: string;
  thickness?: number;
  style?: "solid" | "dashed" | "dotted";
  offset?: number; // Grid columns for offset (1-25, default 5)
};

// Props for the tree component
export type HorizontalTreeProps<T = any> = {
  tree: TreeNode<T>;
  renderNode: (data: T, level: number) => ReactNode;
  maxDepth?: number;
  lineStyle?: LineStyle;
} & HTMLAttributes<HTMLDivElement>;

// Props for tree item (internal component)
type TreeItemProps = {
  top?: ReactNode;
  bottom?: ReactNode;
  lineStyle?: LineStyle;
} & HTMLAttributes<HTMLDivElement>;

// Link line component for connecting nodes
const LinkLine = ({
  direction,
  children,
  lineStyle = {},
}: {
  direction: "up" | "down";
  children?: ReactNode;
  lineStyle?: LineStyle;
}) => {
  const itemsClass = direction === "up" ? "items-end" : "items-start";
  
  const {
    color = "#d1d5db", // Default gray-300
    thickness = 2,
    style = "solid",
    offset = 5 // Default offset of 5 columns (equivalent to old 1)
  } = lineStyle;

  // Using 30-column grid for finer control
  // Calculate remaining columns for content (30 total - offset - 1 for line)
  const contentCols = 30 - offset - 1;

  const lineStyles = {
    borderLeftWidth: `${thickness}px`,
    borderLeftColor: color,
    borderLeftStyle: style,
    borderTopWidth: direction === "up" ? `${thickness}px` : "0",
    borderTopColor: direction === "up" ? color : "transparent",
    borderTopStyle: direction === "up" ? style : "solid",
    borderBottomWidth: direction === "down" ? `${thickness}px` : "0",
    borderBottomColor: direction === "down" ? color : "transparent",
    borderBottomStyle: direction === "down" ? style : "solid",
  };

  return (
    <div
      className={`w-full h-full grid gap-2 ${itemsClass}`}
      style={{ gridTemplateColumns: `repeat(30, minmax(0, 1fr))` }}
    >
      <div style={{ gridColumn: `span ${offset}` }} />
      <div
        className="w-full h-1/2 pr-4"
        style={{ 
          ...lineStyles,
          gridColumn: "span 1"
        }}
      />
      <div 
        className="w-full"
        style={{ gridColumn: `span ${contentCols}` }}
      >
        {children}
      </div>
    </div>
  );
};

// Tree item component that handles the structure
const TreeItem = ({ top, bottom, className, lineStyle, ...rest }: TreeItemProps) => {
  return (
    <div
      className={`w-full h-full flex items-start justify-start py-4 flex-col gap-2 ${className || ""}`}
      {...rest}
    >
      {top && <LinkLine direction="up" lineStyle={lineStyle}>{top}</LinkLine>}
      <div className="flex justify-start w-full">{rest.children}</div>
      {bottom && <LinkLine direction="down" lineStyle={lineStyle}>{bottom}</LinkLine>}
    </div>
  );
};

// Main horizontal tree component
const HorizontalTree = <T,>({
  tree,
  renderNode,
  maxDepth = 3,
  lineStyle,
  ...rest
}: HorizontalTreeProps<T>) => {
  const buildTreeLevel = (node: TreeNode<T>, level: number): ReactNode => {
    // Base case: render leaf node
    if (!node.children || node.children.length === 0 || level >= maxDepth) {
      return renderNode(node.data, level);
    }

    // Recursive case: render node with children
    if (node.children.length === 1) {
      // Single child - no branching needed
      const child = buildTreeLevel(node.children[0], level + 1);
      return <TreeItem top={child} lineStyle={lineStyle}>{renderNode(node.data, level)}</TreeItem>;
    }

    if (node.children.length === 2) {
      // Two children - standard binary tree structure
      const topChild = buildTreeLevel(node.children[0], level + 1);
      const bottomChild = buildTreeLevel(node.children[1], level + 1);
      return (
        <TreeItem top={topChild} bottom={bottomChild} lineStyle={lineStyle}>
          {renderNode(node.data, level)}
        </TreeItem>
      );
    }

    // More than 2 children - could be extended for n-ary trees
    // For now, take first two children
    const topChild = buildTreeLevel(node.children[0], level + 1);
    const bottomChild = buildTreeLevel(node.children[1], level + 1);
    return (
      <TreeItem top={topChild} bottom={bottomChild} lineStyle={lineStyle}>
        {renderNode(node.data, level)}
      </TreeItem>
    );
  };

  return <div {...rest}>{buildTreeLevel(tree, 0)}</div>;
};

export default HorizontalTree;
export { TreeItem, LinkLine };
export type { TreeItemProps };
