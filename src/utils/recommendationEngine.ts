export interface Task {
  id: string;
  title: string;
  description: string;
  blockId: string;
  blockTitle: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  category: string;
}

// Маппинг неправильных ответов на задачи
const wrongAnswersMapping: Record<string, Record<string, Task[]>> = {
  economy: {
    'poor': [
      {
        id: 'economy_financial_1',
        title: 'Внедрить систему финансового планирования',
        description: 'Создать детальный бюджет и систему контроля расходов',
        blockId: 'economy',
        blockTitle: 'Экономика',
        priority: 'high',
        dueDate: '2024-02-15',
        completed: false,
        category: 'Финансы'
      }
    ],
    'no': [
      {
        id: 'economy_accounting_1',
        title: 'Настроить систему учета расходов',
        description: 'Внедрить автоматизированную систему учета всех расходов',
        blockId: 'economy',
        blockTitle: 'Экономика',
        priority: 'high',
        dueDate: '2024-02-10',
        completed: false,
        category: 'Учет'
      }
    ],
    'rarely': [
      {
        id: 'economy_analysis_1',
        title: 'Наладить регулярный анализ финансов',
        description: 'Установить еженедельный анализ финансовых показателей',
        blockId: 'economy',
        blockTitle: 'Экономика',
        priority: 'medium',
        dueDate: '2024-02-25',
        completed: false,
        category: 'Анализ'
      }
    ],
    'never': [
      {
        id: 'economy_analysis_2',
        title: 'Внедрить еженедельный анализ финансов',
        description: 'Создать систему регулярного анализа финансовых показателей',
        blockId: 'economy',
        blockTitle: 'Экономика',
        priority: 'high',
        dueDate: '2024-02-12',
        completed: false,
        category: 'Анализ'
      }
    ]
  },
  production: {
    'poor': [
      {
        id: 'production_quality_1',
        title: 'Улучшить контроль качества продукции',
        description: 'Внедрить систему контроля качества на всех этапах производства',
        blockId: 'production',
        blockTitle: 'Производство',
        priority: 'high',
        dueDate: '2024-02-12',
        completed: false,
        category: 'Качество'
      }
    ],
    'no': [
      {
        id: 'production_standards_1',
        title: 'Создать стандартизированные рецепты',
        description: 'Разработать детальные рецепты для всех блюд с точными пропорциями',
        blockId: 'production',
        blockTitle: 'Производство',
        priority: 'high',
        dueDate: '2024-02-18',
        completed: false,
        category: 'Стандарты'
      }
    ],
    'minimal': [
      {
        id: 'production_control_1',
        title: 'Усилить контроль сырья',
        description: 'Внедрить строгий контроль качества входящего сырья',
        blockId: 'production',
        blockTitle: 'Производство',
        priority: 'medium',
        dueDate: '2024-02-22',
        completed: false,
        category: 'Контроль'
      }
    ]
  },
  team: {
    'low': [
      {
        id: 'team_motivation_1',
        title: 'Разработать программу мотивации персонала',
        description: 'Создать систему поощрений и карьерного роста для сотрудников',
        blockId: 'team',
        blockTitle: 'Команда',
        priority: 'high',
        dueDate: '2024-02-14',
        completed: false,
        category: 'Мотивация'
      }
    ],
    'rarely': [
      {
        id: 'team_training_1',
        title: 'Внедрить регулярное обучение персонала',
        description: 'Организовать еженедельные тренинги для повышения квалификации',
        blockId: 'team',
        blockTitle: 'Команда',
        priority: 'medium',
        dueDate: '2024-02-28',
        completed: false,
        category: 'Обучение'
      }
    ],
    'no': [
      {
        id: 'team_rewards_1',
        title: 'Создать систему поощрений',
        description: 'Разработать систему материальных и нематериальных поощрений',
        blockId: 'team',
        blockTitle: 'Команда',
        priority: 'medium',
        dueDate: '2024-02-16',
        completed: false,
        category: 'Поощрения'
      }
    ]
  },
  delivery: {
    'poor': [
      {
        id: 'delivery_quality_1',
        title: 'Улучшить качество доставки',
        description: 'Оптимизировать процессы доставки и повысить качество сервиса',
        blockId: 'delivery',
        blockTitle: 'Доставка',
        priority: 'high',
        dueDate: '2024-02-13',
        completed: false,
        category: 'Качество'
      }
    ],
    'major_issues': [
      {
        id: 'delivery_logistics_1',
        title: 'Решить проблемы с логистикой',
        description: 'Пересмотреть маршруты доставки и оптимизировать логистические процессы',
        blockId: 'delivery',
        blockTitle: 'Доставка',
        priority: 'high',
        dueDate: '2024-02-17',
        completed: false,
        category: 'Логистика'
      }
    ],
    'slow': [
      {
        id: 'delivery_speed_1',
        title: 'Ускорить доставку заказов',
        description: 'Оптимизировать процессы для сокращения времени доставки',
        blockId: 'delivery',
        blockTitle: 'Доставка',
        priority: 'medium',
        dueDate: '2024-02-21',
        completed: false,
        category: 'Скорость'
      }
    ],
    'very_slow': [
      {
        id: 'delivery_speed_2',
        title: 'Кардинально ускорить доставку',
        description: 'Пересмотреть всю систему доставки для значительного сокращения времени',
        blockId: 'delivery',
        blockTitle: 'Доставка',
        priority: 'high',
        dueDate: '2024-02-19',
        completed: false,
        category: 'Скорость'
      }
    ]
  },
  service: {
    'poor': [
      {
        id: 'service_quality_1',
        title: 'Повысить качество обслуживания',
        description: 'Внедрить стандарты обслуживания и обучить персонал',
        blockId: 'service',
        blockTitle: 'Сервис',
        priority: 'high',
        dueDate: '2024-02-11',
        completed: false,
        category: 'Качество'
      }
    ],
    'no': [
      {
        id: 'service_standards_1',
        title: 'Создать стандарты обслуживания',
        description: 'Разработать детальные стандарты обслуживания клиентов',
        blockId: 'service',
        blockTitle: 'Сервис',
        priority: 'high',
        dueDate: '2024-02-19',
        completed: false,
        category: 'Стандарты'
      }
    ],
    'slow': [
      {
        id: 'service_complaints_1',
        title: 'Улучшить работу с жалобами',
        description: 'Создать быструю систему обработки жалоб клиентов',
        blockId: 'service',
        blockTitle: 'Сервис',
        priority: 'medium',
        dueDate: '2024-02-23',
        completed: false,
        category: 'Жалобы'
      }
    ]
  },
  sales: {
    'poor': [
      {
        id: 'sales_efficiency_1',
        title: 'Повысить эффективность продаж',
        description: 'Внедрить CRM-систему и обучить персонал техникам продаж',
        blockId: 'sales',
        blockTitle: 'Продажи',
        priority: 'high',
        dueDate: '2024-02-15',
        completed: false,
        category: 'Продажи'
      }
    ],
    'no': [
      {
        id: 'sales_marketing_1',
        title: 'Разработать маркетинговую стратегию',
        description: 'Создать комплексную маркетинговую стратегию для привлечения клиентов',
        blockId: 'sales',
        blockTitle: 'Продажи',
        priority: 'high',
        dueDate: '2024-02-24',
        completed: false,
        category: 'Маркетинг'
      }
    ],
    'minimal': [
      {
        id: 'sales_attraction_1',
        title: 'Усилить привлечение клиентов',
        description: 'Разработать программы лояльности и акции для привлечения новых клиентов',
        blockId: 'sales',
        blockTitle: 'Продажи',
        priority: 'medium',
        dueDate: '2024-02-26',
        completed: false,
        category: 'Привлечение'
      }
    ]
  }
};

export const generateTasksFromAnswers = (blockId: string, answers: Record<string, string>): Task[] => {
  const tasks: Task[] = [];
  const blockMapping = wrongAnswersMapping[blockId];
  
  if (!blockMapping) return tasks;
  
  // Проходим по всем ответам и ищем неправильные
  Object.entries(answers).forEach(([questionId, answerValue]) => {
    if (blockMapping[answerValue]) {
      // Добавляем уникальный суффикс к ID, чтобы избежать дублирования
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 5);
      const uniqueTasks = blockMapping[answerValue].map((task, index) => ({
        ...task,
        id: `${task.id}_${timestamp}_${randomSuffix}_${index}`
      }));
      tasks.push(...uniqueTasks);
    }
  });
  
  return tasks;
};

export const getTasksByBlock = (tasks: Task[]): Record<string, { tasks: Task[], completed: number, total: number }> => {
  const blocks: Record<string, { tasks: Task[], completed: number, total: number }> = {};
  
  tasks.forEach(task => {
    if (!blocks[task.blockId]) {
      blocks[task.blockId] = { tasks: [], completed: 0, total: 0 };
    }
    blocks[task.blockId].tasks.push(task);
    blocks[task.blockId].total++;
    if (task.completed) {
      blocks[task.blockId].completed++;
    }
  });
  
  return blocks;
};
