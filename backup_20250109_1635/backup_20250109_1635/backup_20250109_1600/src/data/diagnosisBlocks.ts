export interface DiagnosisBlock {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  efficiency?: number;
  completedAt?: string;
}

export const DEFAULT_BLOCKS: DiagnosisBlock[] = [
  { 
    id: 'finance', 
    title: 'Финансы и бухгалтерия', 
    description: 'Финансовые показатели и бухгалтерский учет', 
    completed: false 
  },
  { 
    id: 'concept', 
    title: 'Концепция и позиционирование', 
    description: 'Бренд, позиционирование и концепция ресторана', 
    completed: false 
  },
  { 
    id: 'management', 
    title: 'Управление и организация', 
    description: 'Управление персоналом и организационная структура', 
    completed: false 
  },
  { 
    id: 'menu', 
    title: 'Продуктовая стратегия', 
    description: 'Меню, продуктовая линейка и стратегия', 
    completed: false 
  },
  { 
    id: 'marketing', 
    title: 'Маркетинг и продажи', 
    description: 'Маркетинговые активности и продажи', 
    completed: false 
  },
  { 
    id: 'operations', 
    title: 'Операционная деятельность', 
    description: 'Операционные процессы и эффективность', 
    completed: false 
  },
  { 
    id: 'client_experience', 
    title: 'Клиентский\nопыт', 
    description: 'Качество обслуживания и опыт клиентов', 
    completed: false 
  },
  { 
    id: 'infrastructure', 
    title: 'Инфраструктура и оборудование', 
    description: 'Инфраструктура, оборудование и технологии', 
    completed: false 
  },
  { 
    id: 'risks', 
    title: 'Риски и нормы', 
    description: 'Управление рисками и соответствие требованиям', 
    completed: false 
  },
  { 
    id: 'strategy', 
    title: 'Стратегия\u00a0развития', 
    description: 'Стратегическое планирование и развитие', 
    completed: false 
  },
];

