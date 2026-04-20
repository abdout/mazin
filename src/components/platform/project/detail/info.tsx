import React from 'react'
import {
  MapPin,
  Ship,
  Anchor,
  User,
  Users,
  Calendar,
  FileText,
  Info as InfoIcon,
  Package,
} from "lucide-react"

interface InfoItemProps {
  icon: React.ReactNode
  label: string
  value: string | React.ReactNode
}

const InfoItem = ({ icon, label, value }: InfoItemProps) => (
  <div className="flex items-start gap-2">
    <div className="mt-0.5 text-primary">{icon}</div>
    <div className="flex-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  </div>
)

interface ProjectLike {
  id?: string | null
  customer?: string | null
  blAwbNumber?: string | null
  portOfOrigin?: string | null
  portOfDestination?: string | null
  teamLead?: string | null
  description?: string | null
  startDate?: Date | string | null
  endDate?: Date | string | null
  shipment?: {
    vesselName?: string | null
    consignor?: string | null
    consignee?: string | null
  } | null
  client?: {
    companyName?: string | null
    contactName?: string | null
  } | null
}

interface InfoLabels {
  sectionTitle: string
  portOfOrigin: string
  portOfDestination: string
  teamLead: string
  consignee: string
  consignor: string
  vessel: string
  blAwbNumber: string
  customer: string
  description: string
  startDate: string
  endDate: string
  emptyPlaceholder: string
}

interface InfoProps {
  project?: ProjectLike | null
  labels?: Partial<InfoLabels>
}

const defaultLabels: InfoLabels = {
  sectionTitle: "Project Information",
  portOfOrigin: "Port of Origin",
  portOfDestination: "Port of Destination",
  teamLead: "Team Lead",
  consignee: "Consignee",
  consignor: "Consignor",
  vessel: "Vessel",
  blAwbNumber: "BL/AWB Number",
  customer: "Customer",
  description: "Description",
  startDate: "Start Date",
  endDate: "End Date",
  emptyPlaceholder: "—",
}

const formatDate = (value: Date | string | null | undefined): string | null => {
  if (!value) return null
  try {
    const d = value instanceof Date ? value : new Date(value)
    if (isNaN(d.getTime())) return null
    return d.toISOString().slice(0, 10)
  } catch {
    return null
  }
}

const Info = ({ project, labels }: InfoProps = {}) => {
  const l: InfoLabels = { ...defaultLabels, ...(labels ?? {}) }
  const placeholder = l.emptyPlaceholder

  const customerName =
    project?.client?.companyName ?? project?.customer ?? placeholder
  const portOfOrigin = project?.portOfOrigin ?? placeholder
  const portOfDestination = project?.portOfDestination ?? placeholder
  const teamLead = project?.teamLead ?? placeholder
  const consignee = project?.shipment?.consignee ?? placeholder
  const consignor = project?.shipment?.consignor ?? placeholder
  const vessel = project?.shipment?.vesselName ?? placeholder
  const blAwbNumber = project?.blAwbNumber ?? placeholder
  const description = project?.description ?? placeholder
  const startDate = formatDate(project?.startDate) ?? placeholder
  const endDate = formatDate(project?.endDate) ?? placeholder

  return (
    <div className="my-6">
      <div className="p-10 pt-4 bg-accent/10 rounded-lg">
        <div className="flex items-center gap-2 mb-6 px-[1px]">
          <InfoIcon size={18} className="text-primary" />
          <h3 className="font-medium text-base">{l.sectionTitle}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoItem
            icon={<Users size={18} />}
            label={l.customer}
            value={customerName}
          />
          <InfoItem
            icon={<FileText size={18} />}
            label={l.blAwbNumber}
            value={blAwbNumber}
          />
          <InfoItem
            icon={<Anchor size={18} />}
            label={l.portOfOrigin}
            value={portOfOrigin}
          />
          <InfoItem
            icon={<MapPin size={18} />}
            label={l.portOfDestination}
            value={portOfDestination}
          />
          <InfoItem
            icon={<Ship size={18} />}
            label={l.vessel}
            value={vessel}
          />
          <InfoItem
            icon={<User size={18} />}
            label={l.teamLead}
            value={teamLead}
          />
          <InfoItem
            icon={<Package size={18} />}
            label={l.consignor}
            value={consignor}
          />
          <InfoItem
            icon={<Package size={18} />}
            label={l.consignee}
            value={consignee}
          />
          <InfoItem
            icon={<Calendar size={18} />}
            label={l.startDate}
            value={startDate}
          />
          <InfoItem
            icon={<Calendar size={18} />}
            label={l.endDate}
            value={endDate}
          />
          {description && description !== placeholder && (
            <div className="md:col-span-2">
              <InfoItem
                icon={<FileText size={18} />}
                label={l.description}
                value={description}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Info
