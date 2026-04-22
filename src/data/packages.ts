import scIcon from '../assets/SC.svg'
import seIcon from '../assets/SE.svg'
import spmIcon from '../assets/SPM.svg'
import spwIcon from '../assets/SPW.svg'

export type PackageId = 'fb-no-vit' | 'fb-vit' | 'men-peak' | 'women-peak'

export type HealthPackage = {
  id: PackageId
  title: string
  lines?: string[]
  subtitle: string
  price: string
  bioAi: string[]
  bloodColumns: [string[], string[]]
  iconSrc: string
}

export const PACKAGES: HealthPackage[] = [
  {
    id: 'fb-no-vit',
    title: 'Supershyft Core',
    lines: ['Supershyft', 'Core'],
    subtitle: 'Your foundation for metabolic intelligence',
    price: 'Rs. 2,999/-',
    bioAi: ['Metabolic Age Score', 'Early Detection', 'Oxidative Stress Analysis'],
    bloodColumns: [
      ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Iron Profile'],
      ['Thyroid Profile', 'Complete Haemogram', 'FBS', 'HbA1C'],
    ],
    iconSrc: scIcon,
  },
  {
    id: 'fb-vit',
    title: 'Supershyft Elite',
    lines: ['Supershyft', 'Elite'],
    subtitle: 'The ultimate blueprint for longevity.',
    price: 'Rs. 2,999/-',
    bioAi: ['Metabolic Age Score', 'Early Detection', 'Oxidative Stress Analysis'],
    bloodColumns: [
      ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Iron Profile'],
      ['Thyroid Profile', 'Complete Haemogram', 'FBS', 'HbA1C'],
    ],
    iconSrc: seIcon,
  },
  {
    id: 'men-peak',
    title: 'Supershyft Peak (Men)',
    lines: ['Supershyft Peak', '(Men)'],
    subtitle: 'Turn biomarker insights into performance optimisation.',
    price: 'Rs. 2,999/-',
    bioAi: ['Metabolic Age Score', 'Early Detection', 'Oxidative Stress Analysis'],
    bloodColumns: [
      ['Lipid Profile', 'Liver Function Test', 'Kidney Function Test', 'Iron Profile'],
      ['Thyroid Profile', 'Complete Haemogram', 'FBS', 'HbA1C'],
    ],
    iconSrc: spmIcon,
  },
  {
    id: 'women-peak',
    title: 'Supershyft Peak (Women)',
    lines: ['Supershyft Peak', '(Women)'],
    subtitle: 'Turn biomarker insights into performance optimisation.',
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
    iconSrc: spwIcon,
  },
]

export function getPackage(id: PackageId): HealthPackage {
  return PACKAGES.find((p) => p.id === id) ?? PACKAGES[0]
}
