/** Industry categories for the campaign brief questionnaire. */

export const INDUSTRY_GROUPS = [
  {
    id: "professional_financial",
    label: "Professional & Financial Services",
    industries: [
      "Accounting, Tax & Bookkeeping",
      "Legal & Compliance",
      "Consulting",
      "Insurance",
    ],
  },
  {
    id: "real_estate_construction",
    label: "Real Estate & Construction",
    industries: [
      "Real Estate",
      "Construction & Trades",
    ],
  },
  {
    id: "healthcare_biotech",
    label: "Healthcare, Biotech & Sciences",
    industries: [
      "Healthcare Providers",
      "Biotech & Life Sciences",
    ],
  },
  {
    id: "retail_ecommerce",
    label: "Retail & E-Commerce",
    industries: [
      "Retailers",
      "E-Commerce",
      "Food & Beverage",
    ],
  },
  {
    id: "tech_media",
    label: "Tech, Media & Telecommunications",
    industries: [
      "Information Technology",
      "Media & Publishing",
    ],
  },
  {
    id: "logistics_manufacturing",
    label: "Logistics, Transport & Manufacturing",
    industries: [
      "Logistics",
      "Manufacturing",
    ],
  },
  {
    id: "other_verticals",
    label: "Other Essential Verticals",
    industries: [
      "Agriculture (AgTech)",
      "Education (EdTech)",
      "Field Services",
    ],
  },
  {
    id: "local_services",
    label: "Consumer & Local Services",
    industries: [
      "Janitorial & Commercial Cleaning",
      "Dental Care",
      "Fitness & Wellness",
      "Beauty & Salon",
      "Automotive",
      "Hospitality & Lodging",
      "Pet Services",
      "Childcare & Daycare",
      "Events & Photography",
      "Moving & Storage",
      "Home Security",
      "Solar & Energy",
    ],
  },
]

export const ALL_INDUSTRIES = INDUSTRY_GROUPS.flatMap((g) =>
  g.industries.map((name) => ({ group: g.label, name }))
)

export function findIndustryGroup(industryName) {
  for (const g of INDUSTRY_GROUPS) {
    if (g.industries.includes(industryName)) return g.label
  }
  return "Custom"
}
