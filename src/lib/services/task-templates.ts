/**
 * Task Templates for Customs Clearance Stages
 * Maps clearance stages to task categories and defines default tasks
 */

import { TaskCategory, TrackingStageType } from '@prisma/client';

/**
 * Mapping of tracking stage types to task categories
 */
export const STAGE_TO_CATEGORY: Record<TrackingStageType, TaskCategory> = {
  PRE_ARRIVAL_DOCS: 'DOCUMENTATION',
  VESSEL_ARRIVAL: 'DOCUMENTATION',
  CUSTOMS_DECLARATION: 'CUSTOMS_DECLARATION',
  CUSTOMS_PAYMENT: 'PAYMENT',
  INSPECTION: 'INSPECTION',
  PORT_FEES: 'PAYMENT',
  QUALITY_STANDARDS: 'INSPECTION',
  RELEASE: 'RELEASE',
  LOADING: 'DELIVERY',
  IN_TRANSIT: 'DELIVERY',
  DELIVERED: 'DELIVERY',
};

/**
 * Map a stage name (from activities) to a TaskCategory
 */
export function mapStageToCategory(stageName: string): TaskCategory {
  const lowerStage = stageName.toLowerCase();

  // Documentation stages
  if (
    lowerStage.includes('document') ||
    lowerStage.includes('pre-arrival') ||
    lowerStage.includes('pre arrival') ||
    lowerStage.includes('bl') ||
    lowerStage.includes('invoice') ||
    lowerStage.includes('packing')
  ) {
    return 'DOCUMENTATION';
  }

  // Customs declaration stages
  if (
    lowerStage.includes('declaration') ||
    lowerStage.includes('customs') ||
    lowerStage.includes('tariff') ||
    lowerStage.includes('classification')
  ) {
    return 'CUSTOMS_DECLARATION';
  }

  // Payment stages
  if (
    lowerStage.includes('payment') ||
    lowerStage.includes('duty') ||
    lowerStage.includes('fee') ||
    lowerStage.includes('tax') ||
    lowerStage.includes('vat')
  ) {
    return 'PAYMENT';
  }

  // Inspection stages
  if (
    lowerStage.includes('inspection') ||
    lowerStage.includes('quality') ||
    lowerStage.includes('standards') ||
    lowerStage.includes('ssmo') ||
    lowerStage.includes('quarantine')
  ) {
    return 'INSPECTION';
  }

  // Release stages
  if (
    lowerStage.includes('release') ||
    lowerStage.includes('clearance') ||
    lowerStage.includes('gate')
  ) {
    return 'RELEASE';
  }

  // Delivery stages
  if (
    lowerStage.includes('delivery') ||
    lowerStage.includes('transport') ||
    lowerStage.includes('loading') ||
    lowerStage.includes('transit') ||
    lowerStage.includes('truck')
  ) {
    return 'DELIVERY';
  }

  return 'GENERAL';
}

/**
 * Default tasks for each clearance stage
 * Used when no specific activities are provided in the project
 */
export const CLEARANCE_STAGE_TASKS: Record<
  TrackingStageType,
  Array<{
    title: string;
    titleAr?: string;
    description: string;
    estimatedHours: number;
  }>
> = {
  PRE_ARRIVAL_DOCS: [
    {
      title: 'Collect Commercial Invoice',
      titleAr: 'جمع الفاتورة التجارية',
      description: 'Obtain and verify commercial invoice from client',
      estimatedHours: 2,
    },
    {
      title: 'Verify Bill of Lading',
      titleAr: 'التحقق من بوليصة الشحن',
      description: 'Check B/L details match commercial invoice',
      estimatedHours: 1,
    },
    {
      title: 'Obtain Packing List',
      titleAr: 'الحصول على قائمة التعبئة',
      description: 'Collect packing list from client',
      estimatedHours: 1,
    },
    {
      title: 'Verify Certificate of Origin',
      titleAr: 'التحقق من شهادة المنشأ',
      description: 'Check COO validity and details',
      estimatedHours: 1,
    },
  ],
  VESSEL_ARRIVAL: [
    {
      title: 'Track Vessel Arrival',
      titleAr: 'تتبع وصول السفينة',
      description: 'Monitor vessel ETA and actual arrival',
      estimatedHours: 1,
    },
    {
      title: 'Confirm Container Discharge',
      titleAr: 'تأكيد تفريغ الحاوية',
      description: 'Verify container has been discharged from vessel',
      estimatedHours: 2,
    },
  ],
  CUSTOMS_DECLARATION: [
    {
      title: 'Prepare Customs Declaration',
      titleAr: 'إعداد البيان الجمركي',
      description: 'Complete customs declaration form with all details',
      estimatedHours: 3,
    },
    {
      title: 'Submit Declaration to Customs',
      titleAr: 'تقديم البيان للجمارك',
      description: 'Submit declaration through customs system',
      estimatedHours: 1,
    },
    {
      title: 'Await Declaration Approval',
      titleAr: 'انتظار موافقة البيان',
      description: 'Monitor declaration status for approval',
      estimatedHours: 4,
    },
  ],
  CUSTOMS_PAYMENT: [
    {
      title: 'Calculate Import Duties',
      titleAr: 'حساب الرسوم الجمركية',
      description: 'Calculate total duties and taxes payable',
      estimatedHours: 1,
    },
    {
      title: 'Request Payment from Client',
      titleAr: 'طلب الدفع من العميل',
      description: 'Send payment request with duty breakdown',
      estimatedHours: 1,
    },
    {
      title: 'Process Customs Payment',
      titleAr: 'معالجة الدفع الجمركي',
      description: 'Pay duties at customs treasury',
      estimatedHours: 2,
    },
  ],
  INSPECTION: [
    {
      title: 'Schedule Customs Inspection',
      titleAr: 'جدولة الفحص الجمركي',
      description: 'Coordinate inspection appointment',
      estimatedHours: 1,
    },
    {
      title: 'Attend Physical Inspection',
      titleAr: 'حضور الفحص المادي',
      description: 'Be present during cargo inspection',
      estimatedHours: 4,
    },
    {
      title: 'Obtain Inspection Report',
      titleAr: 'الحصول على تقرير الفحص',
      description: 'Collect inspection report from customs',
      estimatedHours: 1,
    },
  ],
  PORT_FEES: [
    {
      title: 'Calculate Port Charges',
      titleAr: 'حساب رسوم الميناء',
      description: 'Get port storage and handling fees',
      estimatedHours: 1,
    },
    {
      title: 'Pay Port Fees',
      titleAr: 'دفع رسوم الميناء',
      description: 'Process payment at port authority',
      estimatedHours: 2,
    },
  ],
  QUALITY_STANDARDS: [
    {
      title: 'Submit SSMO Application',
      titleAr: 'تقديم طلب المواصفات',
      description: 'Apply for standards conformity certificate',
      estimatedHours: 2,
    },
    {
      title: 'Obtain SSMO Certificate',
      titleAr: 'الحصول على شهادة المواصفات',
      description: 'Collect quality conformity certificate',
      estimatedHours: 4,
    },
  ],
  RELEASE: [
    {
      title: 'Request Release Order',
      titleAr: 'طلب إذن الإفراج',
      description: 'Apply for cargo release authorization',
      estimatedHours: 1,
    },
    {
      title: 'Obtain Release Order',
      titleAr: 'الحصول على إذن الإفراج',
      description: 'Collect release order from customs',
      estimatedHours: 2,
    },
    {
      title: 'Process Gate Pass',
      titleAr: 'معالجة تصريح البوابة',
      description: 'Arrange gate pass for cargo exit',
      estimatedHours: 1,
    },
  ],
  LOADING: [
    {
      title: 'Arrange Transport',
      titleAr: 'ترتيب النقل',
      description: 'Book trucks for cargo transport',
      estimatedHours: 2,
    },
    {
      title: 'Supervise Loading',
      titleAr: 'الإشراف على التحميل',
      description: 'Oversee cargo loading onto trucks',
      estimatedHours: 3,
    },
  ],
  IN_TRANSIT: [
    {
      title: 'Track Cargo in Transit',
      titleAr: 'تتبع الشحنة أثناء النقل',
      description: 'Monitor cargo movement to destination',
      estimatedHours: 1,
    },
    {
      title: 'Coordinate with Driver',
      titleAr: 'التنسيق مع السائق',
      description: 'Stay in contact with transport driver',
      estimatedHours: 1,
    },
  ],
  DELIVERED: [
    {
      title: 'Confirm Delivery',
      titleAr: 'تأكيد التسليم',
      description: 'Get delivery confirmation from client',
      estimatedHours: 1,
    },
    {
      title: 'Collect Delivery Receipt',
      titleAr: 'جمع إيصال التسليم',
      description: 'Obtain signed delivery receipt',
      estimatedHours: 1,
    },
    {
      title: 'Close File',
      titleAr: 'إغلاق الملف',
      description: 'Complete final documentation and close job file',
      estimatedHours: 2,
    },
  ],
};

/**
 * Get tasks for a specific stage
 */
export function getTasksForStage(stage: TrackingStageType) {
  return CLEARANCE_STAGE_TASKS[stage] || [];
}

/**
 * Get category for a tracking stage type
 */
export function getCategoryForStage(stage: TrackingStageType): TaskCategory {
  return STAGE_TO_CATEGORY[stage] || 'GENERAL';
}

/**
 * Get all stages for a category
 */
export function getStagesForCategory(category: TaskCategory): TrackingStageType[] {
  return Object.entries(STAGE_TO_CATEGORY)
    .filter(([, cat]) => cat === category)
    .map(([stage]) => stage as TrackingStageType);
}
