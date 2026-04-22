import type { LucideIcon } from 'lucide-react'
import { Activity, Mars, UserRound, Venus } from 'lucide-react'

export type PackageId = 'fb-no-vit' | 'fb-vit' | 'men-peak' | 'women-peak'

export type HealthPackage = {
  id: PackageId
  title: string
  lines?: string[]
  subtitle: string
  price: string
  bioAi: string[]
  bloodColumns: [string[], string[]]
  Icon: LucideIcon
}

export const PACKAGES: HealthPackage[] = [
  {
    id: 'fb-no-vit',
    title: 'Full Body Without Vitamins',
    subtitle: 'Includes Bio-AI Health Insights',
    price: 'Rs. 2,999/-',
    bioAi: ['Metabolic Age Score', 'Early Detection', 'Oxidative Stress Analysis'],
    bloodColumns: [
      ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Iron Profile'],
      ['Thyroid Profile', 'Complete Haemogram', 'FBS', 'HbA1C'],
    ],
    Icon: UserRound,
  },
  {
    id: 'fb-vit',
    title: 'Full Body With Vitamins',
    lines: ['Full Body With', 'Vitamins'],
    subtitle: 'Includes Bio-AI Health Insights',
    price: 'Rs. 2,999/-',
    bioAi: ['Metabolic Age Score', 'Early Detection', 'Oxidative Stress Analysis'],
    bloodColumns: [
      ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Iron Profile'],
      ['Thyroid Profile', 'Complete Haemogram', 'FBS', 'HbA1C'],
    ],
    Icon: Activity,
  },
  {
    id: 'men-peak',
    title: 'Men Peak Performance',
    lines: ['Men Peak', 'Performance'],
    subtitle: 'Includes Bio-AI Health Insights',
    price: 'Rs. 2,999/-',
    bioAi: ['Metabolic Age Score', 'Early Detection', 'Oxidative Stress Analysis'],
    bloodColumns: [
      ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Iron Profile'],
      ['Thyroid Profile', 'Complete Haemogram', 'FBS', 'HbA1C'],
    ],
    Icon: Mars,
  },
  {
    id: 'women-peak',
    title: 'Women Peak Performance',
    lines: ['Women Peak', 'Performance'],
    subtitle: 'Includes Bio-AI Health Insights',
    price: 'Rs. 2,999/-',
    bioAi: ['Metabolic Age Score', 'Early Detection', 'Oxidative Stress Analysis'],
    bloodColumns: [
      [
        'Lipid Profile',
        'Liver Function Test',
        'Kidney Function Test',
        'Iron Profile',
        'Thyroid Profile',
        'Complete Haemogram',
        'FBS',
        'HbA1C',
        'ESR',
      ],
      [
        'HS-CRP',
        'VIT D',
        'VIT B12',
        'Homocysteine',
        'LH, FSH, Prolactin',
        'Total Testosterone level',
        'Zinc',
        'Magnesium',
      ],
    ],
    Icon: Venus,
  },
]

export function getPackage(id: PackageId): HealthPackage {
  return PACKAGES.find((p) => p.id === id) ?? PACKAGES[0]
}
