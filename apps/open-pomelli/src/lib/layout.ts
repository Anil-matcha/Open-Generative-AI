export const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "middle-left",
  "middle-center",
  "middle-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const;
export type Position = (typeof POSITIONS)[number];

export const SIZES = ["small", "medium", "large", "huge"] as const;
export type Size = (typeof SIZES)[number];

export const ALIGNS = ["left", "center", "right"] as const;
export type Align = (typeof ALIGNS)[number];

export type TextBlock = {
  text: string;
  position: Position;
  size: Size;
  color: string;
  fontFamily: string;
  align: Align;
  bg?: string | null;
};

export type Layout = {
  headline: TextBlock;
  body: TextBlock;
  cta: TextBlock;
};

export function defaultLayout(
  headline: string,
  body: string,
  cta: string,
  fontFamily: string,
): Layout {
  return {
    headline: {
      text: headline,
      position: "bottom-left",
      size: "huge",
      color: "#ffffff",
      fontFamily,
      align: "left",
      bg: null,
    },
    body: {
      text: body,
      position: "bottom-left",
      size: "small",
      color: "#ffffff",
      fontFamily,
      align: "left",
      bg: null,
    },
    cta: {
      text: cta,
      position: "bottom-left",
      size: "medium",
      color: "#000000",
      fontFamily,
      align: "left",
      bg: "#ffffff",
    },
  };
}
