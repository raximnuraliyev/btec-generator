// Mock BTEC Units Data
// In production, this would be fetched from PostgreSQL database

import { BTECUnit, BTECLevel } from '../types';

export const BTEC_UNITS: BTECUnit[] = [
  // Level 3 Units
  {
    id: 'unit-3-1',
    level: 3,
    unitNumber: 1,
    name: 'Communication and Employability Skills for IT',
    description: 'Develop communication skills and understand professional behavior in IT contexts'
  },
  {
    id: 'unit-3-2',
    level: 3,
    unitNumber: 2,
    name: 'Computer Systems',
    description: 'Understand computer hardware, software, and how systems work together'
  },
  {
    id: 'unit-3-3',
    level: 3,
    unitNumber: 3,
    name: 'Information Systems',
    description: 'Explore different types of information systems and their business applications'
  },
  {
    id: 'unit-3-6',
    level: 3,
    unitNumber: 6,
    name: 'Software Design and Development',
    description: 'Learn programming fundamentals and software development lifecycle'
  },
  {
    id: 'unit-3-9',
    level: 3,
    unitNumber: 9,
    name: 'Computer Networks',
    description: 'Understand network types, protocols, and infrastructure'
  },
  {
    id: 'unit-3-14',
    level: 3,
    unitNumber: 14,
    name: 'Event Driven Programming',
    description: 'Develop applications using event-driven programming techniques'
  },
  
  // Level 4 Units
  {
    id: 'unit-4-1',
    level: 4,
    unitNumber: 1,
    name: 'Management and Operations',
    description: 'Understand business management principles and operational processes'
  },
  {
    id: 'unit-4-2',
    level: 4,
    unitNumber: 2,
    name: 'Finance for Managers',
    description: 'Develop financial literacy and budgeting skills for managers'
  },
  {
    id: 'unit-4-4',
    level: 4,
    unitNumber: 4,
    name: 'Managing People',
    description: 'Learn human resource management and team leadership'
  },
  {
    id: 'unit-4-5',
    level: 4,
    unitNumber: 5,
    name: 'Data Modelling',
    description: 'Design and implement database systems and data models'
  },
  {
    id: 'unit-4-7',
    level: 4,
    unitNumber: 7,
    name: 'Business Law',
    description: 'Understand legal frameworks affecting business operations'
  },
  {
    id: 'unit-4-10',
    level: 4,
    unitNumber: 10,
    name: 'Project Management',
    description: 'Learn project planning, execution, and control methodologies'
  },
  
  // Level 5 Units
  {
    id: 'unit-5-1',
    level: 5,
    unitNumber: 1,
    name: 'Business Strategy',
    description: 'Develop strategic thinking and long-term planning capabilities'
  },
  {
    id: 'unit-5-3',
    level: 5,
    unitNumber: 3,
    name: 'Human Resource Management',
    description: 'Advanced HR practices including recruitment and performance management'
  },
  {
    id: 'unit-5-4',
    level: 5,
    unitNumber: 4,
    name: 'Marketing Principles',
    description: 'Understand marketing theory and contemporary marketing practices'
  },
  {
    id: 'unit-5-6',
    level: 5,
    unitNumber: 6,
    name: 'Organisational Behaviour',
    description: 'Explore individual and group dynamics in organizational contexts'
  },
  {
    id: 'unit-5-11',
    level: 5,
    unitNumber: 11,
    name: 'Research Methods',
    description: 'Develop research skills including qualitative and quantitative methods'
  },
  {
    id: 'unit-5-15',
    level: 5,
    unitNumber: 15,
    name: 'Digital Marketing',
    description: 'Learn contemporary digital marketing strategies and tools'
  },
  
  // Level 6 Units
  {
    id: 'unit-6-2',
    level: 6,
    unitNumber: 2,
    name: 'Strategic Management',
    description: 'Advanced strategic planning and competitive analysis'
  },
  {
    id: 'unit-6-4',
    level: 6,
    unitNumber: 4,
    name: 'Advanced Research Project',
    description: 'Independent research with dissertation-level academic rigor'
  },
  {
    id: 'unit-6-7',
    level: 6,
    unitNumber: 7,
    name: 'Innovation and Enterprise',
    description: 'Explore entrepreneurship and innovation management'
  },
  {
    id: 'unit-6-9',
    level: 6,
    unitNumber: 9,
    name: 'Leadership and Change Management',
    description: 'Develop leadership capabilities and change management strategies'
  },
  {
    id: 'unit-6-12',
    level: 6,
    unitNumber: 12,
    name: 'International Business',
    description: 'Understand global business environments and international trade'
  },
  {
    id: 'unit-6-16',
    level: 6,
    unitNumber: 16,
    name: 'Artificial Intelligence Applications',
    description: 'Explore AI technologies and their business applications'
  }
];

/**
 * Get all units for a specific BTEC level
 */
export function getUnitsByLevel(level: BTECLevel): BTECUnit[] {
  return BTEC_UNITS.filter(unit => unit.level === level);
}

/**
 * Get a specific unit by ID
 */
export function getUnitById(id: string): BTECUnit | undefined {
  return BTEC_UNITS.find(unit => unit.id === id);
}

/**
 * Get unit by level and unit number
 */
export function getUnitByLevelAndNumber(level: BTECLevel, unitNumber: number): BTECUnit | undefined {
  return BTEC_UNITS.find(unit => unit.level === level && unit.unitNumber === unitNumber);
}

/**
 * Search units by name or description
 */
export function searchUnits(query: string): BTECUnit[] {
  const lowerQuery = query.toLowerCase();
  return BTEC_UNITS.filter(unit => 
    unit.name.toLowerCase().includes(lowerQuery) ||
    unit.description?.toLowerCase().includes(lowerQuery)
  );
}
