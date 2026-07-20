import type { CONDITIONS } from "@/lib/product-options"

export type ConditionGrade = {
  code: string
  label: (typeof CONDITIONS)[number]
  summary: string
  details: string[]
}

export const CONDITION_GRADES: ConditionGrade[] = [
  {
    code: "01",
    label: "Premium+",
    summary: "As close to new as thrift gets. Unworn or worn only a handful of times, with nothing to point out.",
    details: [
      "No visible creasing, scuffing, or discoloration, inside or out",
      "Sole and tread essentially full — looks straight off the shelf",
      "The rarest grade in our inventory",
    ],
  },
  {
    code: "02",
    label: "Premium",
    summary: "Lightly worn with only the faintest signs of use. A step below Premium+, still exceptional.",
    details: [
      "Barely-there creasing, visible only up close",
      "Sole and tread in excellent shape",
      "Deep-cleaned and conditioned before listing",
    ],
  },
  {
    code: "03",
    label: "Excellent",
    summary: "Looks and feels great. Only the closest inspection reveals it's pre-owned.",
    details: [
      "Minor creasing consistent with light wear",
      "Sole and tread in strong shape, freshly deep-cleaned by us before listing",
      "A reliable everyday grade with no real compromises",
    ],
  },
  {
    code: "04",
    label: "Very Good",
    summary: "Gently worn with only minor, honest signs of use. Clean and ready to wear.",
    details: [
      "Light creasing or a small cosmetic mark at most",
      "No structural issues — upper, sole, and lining all sound",
      "Sanitized and conditioned before photographing",
    ],
  },
  {
    code: "05",
    label: "Good",
    summary: "Comfortable, well-loved pairs with visible wear from regular use — priced to match.",
    details: [
      "Noticeable creasing, scuffing, or fading consistent with regular wear",
      "Still structurally solid and comfortable to wear",
      "Our best value grade for everyday rotation",
    ],
  },
]
