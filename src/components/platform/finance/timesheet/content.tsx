"use client"

/**
 * Timesheet Content - Stubbed Implementation
 */

import {
  Calendar,
  CircleAlert,
  CircleCheck,
  Clock,
  FileText,
  Users,
} from "lucide-react"

import type { Locale } from "@/components/internationalization/config"

import {
  DashboardGrid,
  FeatureCard,
  StatsCard,
} from "../lib/dashboard-components"

interface Props {
  dictionary?: unknown
  lang: Locale
}

export default function TimesheetContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const periodsCount = 0
  const entriesCount = 0
  const pendingEntriesCount = 0
  const approvedEntriesCount = 0
  const totalHours = 0

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <DashboardGrid type="stats">
        <StatsCard
          title={isRTL ? "إجمالي الساعات" : "Total Hours"}
          value={totalHours.toLocaleString()}
          description={isRTL ? "الساعات المعتمدة" : "Approved hours"}
          icon={Clock}
        />
        <StatsCard
          title={isRTL ? "إدخالات الجدول" : "Timesheet Entries"}
          value={entriesCount}
          description={`${approvedEntriesCount} ${isRTL ? "معتمدة" : "approved"}`}
          icon={FileText}
        />
        <StatsCard
          title={isRTL ? "في انتظار الموافقة" : "Pending Approval"}
          value={pendingEntriesCount}
          description={isRTL ? "تتطلب المراجعة" : "Requires review"}
          icon={CircleAlert}
        />
        <StatsCard
          title={isRTL ? "الفترات النشطة" : "Active Periods"}
          value={periodsCount}
          description={isRTL ? "الفترات المكونة" : "Configured periods"}
          icon={Calendar}
        />
      </DashboardGrid>

      {/* Feature Cards Grid */}
      <DashboardGrid type="features">
        <FeatureCard
          title={isRTL ? "فترات الجدول" : "Timesheet Periods"}
          description={isRTL ? "تحديد وإدارة فترات الجدول الزمني" : "Define and manage timesheet periods"}
          icon={Calendar}
          isPrimary
          primaryAction={{
            label: isRTL ? "عرض الفترات" : "View Periods",
            href: `/${lang}/finance/timesheet/periods`,
            count: periodsCount,
          }}
          secondaryAction={{
            label: isRTL ? "إنشاء فترة" : "Create Period",
            href: `/${lang}/finance/timesheet/periods/new`,
          }}
        />
        <FeatureCard
          title={isRTL ? "إدخالات الوقت" : "Time Entries"}
          description={isRTL ? "تسجيل وتتبع ساعات عمل الموظفين" : "Record and track staff working hours"}
          icon={Clock}
          primaryAction={{
            label: isRTL ? "عرض الإدخالات" : "View Entries",
            href: `/${lang}/finance/timesheet/entries`,
            count: entriesCount,
          }}
          secondaryAction={{
            label: isRTL ? "تسجيل الوقت" : "Record Time",
            href: `/${lang}/finance/timesheet/entries/new`,
          }}
        />
        <FeatureCard
          title={isRTL ? "قائمة الموافقات" : "Approval Queue"}
          description={isRTL ? "مراجعة والموافقة على إدخالات الجدول" : "Review and approve timesheet entries"}
          icon={CircleCheck}
          primaryAction={{
            label: isRTL ? "الموافقة على الإدخالات" : "Approve Entries",
            href: `/${lang}/finance/timesheet/approve`,
            count: pendingEntriesCount,
          }}
          secondaryAction={{
            label: isRTL ? "موافقة جماعية" : "Bulk Approve",
            href: `/${lang}/finance/timesheet/approve/bulk`,
          }}
        />
        <FeatureCard
          title={isRTL ? "جداول الموظفين" : "Staff Timesheets"}
          description={isRTL ? "عرض الجداول الزمنية حسب الموظف" : "View timesheets by staff member"}
          icon={Users}
          primaryAction={{
            label: isRTL ? "عرض حسب الموظف" : "View By Staff",
            href: `/${lang}/finance/timesheet/staff`,
          }}
          secondaryAction={{
            label: isRTL ? "ملخص الموظفين" : "Staff Summary",
            href: `/${lang}/finance/timesheet/staff/summary`,
          }}
        />
        <FeatureCard
          title={isRTL ? "تقارير الجدول الزمني" : "Timesheet Reports"}
          description={isRTL ? "إنشاء تقارير وتحليلات الجدول الزمني" : "Generate timesheet reports and analytics"}
          icon={FileText}
          primaryAction={{
            label: isRTL ? "عرض التقارير" : "View Reports",
            href: `/${lang}/finance/timesheet/reports`,
          }}
          secondaryAction={{
            label: isRTL ? "تقرير الساعات" : "Hours Report",
            href: `/${lang}/finance/timesheet/reports/hours`,
          }}
        />
        <FeatureCard
          title={isRTL ? "عرض التقويم" : "Calendar View"}
          description={isRTL ? "تقويم مرئي لإدخالات الجدول الزمني" : "Visual calendar of timesheet entries"}
          icon={Calendar}
          primaryAction={{
            label: isRTL ? "عرض التقويم" : "View Calendar",
            href: `/${lang}/finance/timesheet/calendar`,
          }}
          secondaryAction={{
            label: isRTL ? "عرض الشهر" : "Month View",
            href: `/${lang}/finance/timesheet/calendar/month`,
          }}
        />
      </DashboardGrid>
    </div>
  )
}
