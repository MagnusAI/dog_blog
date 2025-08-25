import type { HTMLAttributes } from "react";
import HorizontalTree, {
  type TreeNode,
  type LineStyle,
} from "./HorizontalTree";
import PedigreeCard from "./PedigreeCard";
import dogPlaceholder from "../assets/dog_placeholder_2.png";

// Pedigree-specific data type
export type PedigreeData = {
  relation: string;
  name: string;
  titles: string[]; // Changed to array to match PedigreeCard
  regnr: string; // Added registration number
  imageUrl?: string; // Optional image URL
  fallbackInitials?: string; // Optional fallback initials
};

// Render function for pedigree data using PedigreeCard
const renderPedigreeNode = (data: PedigreeData, _level: number) => {
  // Generate placeholder image URL if not provided
  const imageUrl =
    data.imageUrl ||
    dogPlaceholder;

  return (
    <PedigreeCard
      imageUrl={imageUrl}
      imageAlt={`${data.name} - ${data.relation}`}
      relation={data.relation}
      regnr={data.regnr}
      name={data.name}
      titles={data.titles}
      fallbackInitials={data.fallbackInitials || data.name.charAt(0)}
    />
  );
};

type PedigreeProps = {
  tree?: TreeNode<PedigreeData>;
  lineStyle?: LineStyle;
} & HTMLAttributes<HTMLDivElement>;

const Pedigree = ({ tree, lineStyle, ...rest }: PedigreeProps) => {
  // Default tree structure if none provided
  const defaultTree: TreeNode<PedigreeData> = {
    data: {
      relation: "Self",
      name: "Main Person",
      titles: ["Current Individual"],
      regnr: "REG-000001",
      fallbackInitials: "MP",
    },
    children: [
      {
        data: {
          relation: "Father's Line",
          name: "Paternal",
          titles: ["Father's Ancestry"],
          regnr: "REG-000002",
          fallbackInitials: "P",
        },
        children: [
          {
            data: {
              relation: "Great-Grandfather",
              name: "GGF1",
              titles: ["Paternal Great-Grandfather", "CH"],
              regnr: "REG-000003",
              fallbackInitials: "GGF1",
            },
            children: [
              {
                data: {
                  relation: "Ancestor",
                  name: "A1",
                  titles: ["Ancient Ancestor 1"],
                  regnr: "REG-000004",
                  fallbackInitials: "A1",
                },
              },
              {
                data: {
                  relation: "Ancestor",
                  name: "A2",
                  titles: ["Ancient Ancestor 2"],
                  regnr: "REG-000005",
                  fallbackInitials: "A2",
                },
              },
            ],
          },
          {
            data: {
              relation: "Great-Grandmother",
              name: "GGM1",
              titles: ["Paternal Great-Grandmother"],
              regnr: "REG-000006",
              fallbackInitials: "GGM1",
            },
            children: [
              {
                data: {
                  relation: "Ancestor",
                  name: "A3",
                  titles: ["Ancient Ancestor 3"],
                  regnr: "REG-000007",
                  fallbackInitials: "A3",
                },
              },
              {
                data: {
                  relation: "Ancestor",
                  name: "A4",
                  titles: ["Ancient Ancestor 4"],
                  regnr: "REG-000008",
                  fallbackInitials: "A4",
                },
              },
            ],
          },
        ],
      },
      {
        data: {
          relation: "Mother's Line",
          name: "Maternal",
          titles: ["Mother's Ancestry"],
          regnr: "REG-000009",
          fallbackInitials: "M",
        },
        children: [
          {
            data: {
              relation: "Great-Grandfather",
              name: "GGF2",
              titles: ["Maternal Great-Grandfather"],
              regnr: "REG-000010",
              fallbackInitials: "GGF2",
            },
            children: [
              {
                data: {
                  relation: "Ancestor",
                  name: "A5",
                  titles: ["Ancient Ancestor 5"],
                  regnr: "REG-000011",
                  fallbackInitials: "A5",
                },
              },
              {
                data: {
                  relation: "Ancestor",
                  name: "A6",
                  titles: ["Ancient Ancestor 6"],
                  regnr: "REG-000012",
                  fallbackInitials: "A6",
                },
              },
            ],
          },
          {
            data: {
              relation: "Great-Grandmother",
              name: "GGM2",
              titles: ["Maternal Great-Grandmother"],
              regnr: "REG-000013",
              fallbackInitials: "GGM2",
            },
            children: [
              {
                data: {
                  relation: "Ancestor",
                  name: "A7",
                  titles: ["Ancient Ancestor 7"],
                  regnr: "REG-000014",
                  fallbackInitials: "A7",
                },
              },
              {
                data: {
                  relation: "Ancestor",
                  name: "A8",
                  titles: ["Ancient Ancestor 8"],
                  regnr: "REG-000015",
                  fallbackInitials: "A8",
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const fatherTree: TreeNode<PedigreeData> = {
    data: {
      relation: "Father",
      name: "F1",
      titles: ["Paternal Line"],
      regnr: "REG-000001",
      fallbackInitials: "F1",
    },
    children: [
      {
        data: {
          relation: "Grandfather",
          name: "GF1",
          titles: ["Paternal Grandfather"],
          regnr: "REG-000002",
          fallbackInitials: "GF1",
        },
        children: [
          {
            data: {
              relation: "Ancestor",
              name: "A1",
              titles: ["Ancient Ancestor 1"],
              regnr: "REG-000003",
              fallbackInitials: "A1",
            },
          },
          {
            data: {
              relation: "Ancestor",
              name: "A2",
              titles: ["Ancient Ancestor 2"],
              regnr: "REG-000004",
              fallbackInitials: "A2",
            },
          },
        ],
      },
      {
        data: {
          relation: "Grandmother",
          name: "GM1",
          titles: ["Paternal Grandmother"],
          regnr: "REG-000005",
          fallbackInitials: "GM1",
        },
        children: [
          {
            data: {
              relation: "Ancestor",
              name: "A3",
              titles: ["Ancient Ancestor 3"],
              regnr: "REG-000006",
              fallbackInitials: "A3",
            },
          },
          {
            data: {
              relation: "Ancestor",
              name: "A4",
              titles: ["Ancient Ancestor 4"],
              regnr: "REG-000007",
              fallbackInitials: "A4",
            },
          },
        ],
      },
    ],
  };

  const motherTree: TreeNode<PedigreeData> = {
    data: {
      relation: "Mother",
      name: "M1",
      titles: ["Maternal Line"],
      regnr: "REG-000008",
      fallbackInitials: "M1",
    },
    children: [
      {
        data: {
          relation: "Grandmother",
          name: "GM2",
          titles: ["Maternal Grandmother"],
          regnr: "REG-000009",
          fallbackInitials: "GM2",
        },
        children: [
          {
            data: {
              relation: "Ancestor",
              name: "A5",
              titles: ["Ancient Ancestor 5"],
              regnr: "REG-000010",
              fallbackInitials: "A5",
            },
          },
          {
            data: {
              relation: "Ancestor",
              name: "A6",
              titles: ["Ancient Ancestor 6"],
              regnr: "REG-000011",
              fallbackInitials: "A6",
            },
          },
        ],
      },
      {
        data: {
          relation: "Great-Grandmother",
          name: "GGM2",
          titles: ["Maternal Great-Grandmother"],
          regnr: "REG-000012",
          fallbackInitials: "GGM2",
        },
        children: [
          {
            data: {
              relation: "Ancestor",
              name: "A7",
              titles: ["Ancient Ancestor 7"],
              regnr: "REG-000013",
              fallbackInitials: "A7",
            },
          },
          {
            data: {
              relation: "Ancestor",
              name: "A8",
              titles: ["Ancient Ancestor 8"],
              regnr: "REG-000014",
              fallbackInitials: "A8",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <HorizontalTree
        tree={fatherTree || defaultTree}
        renderNode={renderPedigreeNode}
        maxDepth={4}
        lineStyle={lineStyle}
        {...rest}
      />
      <HorizontalTree
        tree={motherTree || defaultTree}
        renderNode={renderPedigreeNode}
        maxDepth={4}
        lineStyle={lineStyle}
        {...rest}
      />
    </>
  );
};

export default Pedigree;
export { renderPedigreeNode };
export type { PedigreeProps };
