/**
 * Projects Seed
 * Creates 10+ sample clearance projects with stages and activities
 */

import type { PrismaClient } from "@prisma/client"
import type { UserRef } from "./types"

export interface ProjectRef {
  id: string
  customer: string
}

// Sample activities for IMPORT_SEA_FCL
const importSeaFclActivities = [
  { shipmentType: "IMPORT_SEA_FCL", stage: "Documentation", substage: "Bill of Lading Collection", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Documentation", substage: "Commercial Invoice Verification", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Documentation", substage: "Packing List Review", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Documentation", substage: "Certificate of Origin", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Documentation", substage: "HS Code Classification", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Pre-Clearance", substage: "Arrival Notice Processing", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Pre-Clearance", substage: "Manifest Review", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Pre-Clearance", substage: "Tariff Calculation", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Pre-Clearance", substage: "Duty Rate Assessment", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Customs Declaration", substage: "SAD Filing", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Customs Declaration", substage: "Document Verification", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Customs Declaration", substage: "Risk Assessment Review", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Payment", substage: "Duty Calculation Verification", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Payment", substage: "VAT Calculation", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Payment", substage: "Port Charges Assessment", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Payment", substage: "Payment Processing", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Release", substage: "Customs Release Order", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Release", substage: "Terminal Release", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Release", substage: "Container Pick-up", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Delivery", substage: "Empty Container Return", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Delivery", substage: "Final Delivery Confirmation", task: "" },
  { shipmentType: "IMPORT_SEA_FCL", stage: "Post-Clearance", substage: "Audit Trail Documentation", task: "" },
]

// Sample activities for IMPORT_SEA_LCL
const importSeaLclActivities = [
  { shipmentType: "IMPORT_SEA_LCL", stage: "Documentation", substage: "House Bill of Lading", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Documentation", substage: "Master Bill Verification", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Documentation", substage: "Commercial Invoice Verification", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Documentation", substage: "HS Code Classification", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Pre-Clearance", substage: "Deconsolidation Coordination", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Pre-Clearance", substage: "CFS Liaison", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Customs Declaration", substage: "SAD Filing", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Customs Declaration", substage: "Cargo Segregation", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Payment", substage: "CFS Charges", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Payment", substage: "Payment Processing", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Release", substage: "CFS Release", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Release", substage: "Cargo Collection", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Delivery", substage: "Final Delivery", task: "" },
  { shipmentType: "IMPORT_SEA_LCL", stage: "Post-Clearance", substage: "Compliance Check", task: "" },
]

// Sample activities for IMPORT_AIR
const importAirActivities = [
  { shipmentType: "IMPORT_AIR", stage: "Documentation", substage: "Air Waybill Collection", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Documentation", substage: "Commercial Invoice", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Documentation", substage: "Dangerous Goods Declaration", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Pre-Clearance", substage: "Flight Manifest Review", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Pre-Clearance", substage: "Ground Handler Liaison", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Customs Declaration", substage: "E-Declaration Submission", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Customs Declaration", substage: "X-Ray Screening Review", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Payment", substage: "Airport Handling Charges", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Payment", substage: "Terminal Charges", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Release", substage: "Airline Release", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Release", substage: "Cargo Collection", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Delivery", substage: "Final Delivery", task: "" },
  { shipmentType: "IMPORT_AIR", stage: "Post-Clearance", substage: "Audit Trail", task: "" },
]

// Sample activities for EXPORT_SEA
const exportSeaActivities = [
  { shipmentType: "EXPORT_SEA", stage: "Documentation", substage: "Commercial Invoice Preparation", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Documentation", substage: "Bill of Lading Draft", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Documentation", substage: "Certificate of Origin Application", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Documentation", substage: "Export License", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Pre-Clearance", substage: "Booking Confirmation", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Pre-Clearance", substage: "VGM Declaration", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Customs Declaration", substage: "Export Declaration (EX-1)", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Customs Declaration", substage: "Exit Summary", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Payment", substage: "Export Fees", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Payment", substage: "Terminal Charges", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Release", substage: "Gate-In Documentation", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Release", substage: "BL Issuance", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Shipping", substage: "Vessel Loading Confirmation", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Shipping", substage: "Document Dispatch", task: "" },
  { shipmentType: "EXPORT_SEA", stage: "Post-Clearance", substage: "Export Statistics", task: "" },
]

// Sample activities for TRANSIT
const transitActivities = [
  { shipmentType: "TRANSIT", stage: "Documentation", substage: "Transit Declaration (T1/T2)", task: "" },
  { shipmentType: "TRANSIT", stage: "Documentation", substage: "Guarantee/Bond", task: "" },
  { shipmentType: "TRANSIT", stage: "Documentation", substage: "TIR Carnet", task: "" },
  { shipmentType: "TRANSIT", stage: "Entry Clearance", substage: "Entry Point Declaration", task: "" },
  { shipmentType: "TRANSIT", stage: "Entry Clearance", substage: "Seal Application", task: "" },
  { shipmentType: "TRANSIT", stage: "Transit Monitoring", substage: "GPS Tracking", task: "" },
  { shipmentType: "TRANSIT", stage: "Transit Monitoring", substage: "Checkpoint Verification", task: "" },
  { shipmentType: "TRANSIT", stage: "Exit Clearance", substage: "Seal Verification", task: "" },
  { shipmentType: "TRANSIT", stage: "Exit Clearance", substage: "Guarantee Release", task: "" },
  { shipmentType: "TRANSIT", stage: "Post-Transit", substage: "Transit Completion Report", task: "" },
]

// Sample projects data with short, concise titles
const projectsData = [
  {
    customer: "Al-Faisal",
    blAwbNumber: "MSKU2024001",
    description: "Auto parts - Japan",
    systems: ["IMPORT_SEA_FCL"],
    activities: importSeaFclActivities,
    status: "IN_PROGRESS" as const,
    priority: "HIGH" as const,
    team: ["1", "2"],
    teamLead: "1",
    portOfOrigin: "Yokohama",
    portOfDestination: "Port Sudan",
  },
  {
    customer: "Gulf Electronics",
    blAwbNumber: "MSKU2024002",
    description: "Electronics - China",
    systems: ["IMPORT_SEA_FCL"],
    activities: importSeaFclActivities,
    status: "PENDING" as const,
    priority: "URGENT" as const,
    team: ["2", "3"],
    teamLead: "2",
    portOfOrigin: "Shanghai",
    portOfDestination: "Port Sudan",
  },
  {
    customer: "Sudan Pharma",
    blAwbNumber: "MSKU2024003",
    description: "Medical supplies - India",
    systems: ["IMPORT_SEA_FCL"],
    activities: importSeaFclActivities,
    status: "IN_PROGRESS" as const,
    priority: "URGENT" as const,
    team: ["1", "3"],
    teamLead: "1",
    portOfOrigin: "Mumbai",
    portOfDestination: "Port Sudan",
  },
  {
    customer: "Al-Rashid",
    blAwbNumber: "LCL2024001",
    description: "Construction - UAE",
    systems: ["IMPORT_SEA_LCL"],
    activities: importSeaLclActivities,
    status: "PENDING" as const,
    priority: "MEDIUM" as const,
    team: ["2"],
    teamLead: "2",
    portOfOrigin: "Dubai",
    portOfDestination: "Port Sudan",
  },
  {
    customer: "Nile Agri",
    blAwbNumber: "LCL2024002",
    description: "Machinery parts - NL",
    systems: ["IMPORT_SEA_LCL"],
    activities: importSeaLclActivities,
    status: "IN_PROGRESS" as const,
    priority: "MEDIUM" as const,
    team: ["1", "2"],
    teamLead: "1",
    portOfOrigin: "Rotterdam",
    portOfDestination: "Port Sudan",
  },
  {
    customer: "TechStart",
    blAwbNumber: "AWB2024001",
    description: "IT equipment - DE",
    systems: ["IMPORT_AIR"],
    activities: importAirActivities,
    status: "PENDING" as const,
    priority: "HIGH" as const,
    team: ["3"],
    teamLead: "3",
    portOfOrigin: "Frankfurt",
    portOfDestination: "Khartoum",
  },
  {
    customer: "Fashion House",
    blAwbNumber: "AWB2024002",
    description: "Textiles - Turkey",
    systems: ["IMPORT_AIR"],
    activities: importAirActivities,
    status: "IN_PROGRESS" as const,
    priority: "LOW" as const,
    team: ["1"],
    teamLead: "1",
    portOfOrigin: "Istanbul",
    portOfDestination: "Khartoum",
  },
  {
    customer: "Cotton Exports",
    blAwbNumber: "EXP2024001",
    description: "Cotton - Singapore",
    systems: ["EXPORT_SEA"],
    activities: exportSeaActivities,
    status: "RELEASED" as const,
    priority: "HIGH" as const,
    team: ["2", "3"],
    teamLead: "2",
    portOfOrigin: "Port Sudan",
    portOfDestination: "Singapore",
  },
  {
    customer: "Gum Arabic",
    blAwbNumber: "EXP2024002",
    description: "Gum arabic - Germany",
    systems: ["EXPORT_SEA"],
    activities: exportSeaActivities,
    status: "IN_PROGRESS" as const,
    priority: "MEDIUM" as const,
    team: ["1", "2"],
    teamLead: "1",
    portOfOrigin: "Port Sudan",
    portOfDestination: "Hamburg",
  },
  {
    customer: "Regional Transit",
    blAwbNumber: "TRN2024001",
    description: "Transit - Chad",
    systems: ["TRANSIT"],
    activities: transitActivities,
    status: "IN_PROGRESS" as const,
    priority: "MEDIUM" as const,
    team: ["3"],
    teamLead: "3",
    portOfOrigin: "Port Sudan",
    portOfDestination: "N'Djamena",
  },
  {
    customer: "African Logistics",
    blAwbNumber: "TRN2024002",
    description: "Transit - S. Sudan",
    systems: ["TRANSIT"],
    activities: transitActivities,
    status: "PENDING" as const,
    priority: "LOW" as const,
    team: ["2"],
    teamLead: "2",
    portOfOrigin: "Port Sudan",
    portOfDestination: "Juba",
  },
  {
    customer: "Red Sea Mining",
    blAwbNumber: "MSKU2024004",
    description: "Mining equipment - SA",
    systems: ["IMPORT_SEA_FCL"],
    activities: importSeaFclActivities,
    status: "CUSTOMS_HOLD" as const,
    priority: "HIGH" as const,
    team: ["1", "2", "3"],
    teamLead: "1",
    portOfOrigin: "Durban",
    portOfDestination: "Port Sudan",
  },
]

export async function seedProjects(
  prisma: PrismaClient,
  users: UserRef[]
): Promise<ProjectRef[]> {
  // Clear existing projects and related tasks
  await prisma.task.deleteMany({
    where: { projectId: { not: null } },
  })
  await prisma.project.deleteMany()

  const mainUser = users[0] // Use first user (mazin@abdout.org)

  const createdProjects: ProjectRef[] = []

  for (const projectData of projectsData) {
    const project = await prisma.project.create({
      data: {
        customer: projectData.customer,
        blAwbNumber: projectData.blAwbNumber,
        description: projectData.description,
        systems: projectData.systems,
        activities: projectData.activities,
        status: projectData.status,
        priority: projectData.priority,
        team: projectData.team,
        teamLead: projectData.teamLead,
        portOfOrigin: projectData.portOfOrigin,
        portOfDestination: projectData.portOfDestination,
        startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random past 30 days
        userId: mainUser.id,
      },
    })

    createdProjects.push({
      id: project.id,
      customer: project.customer,
    })

    console.log(`   ✓ Created project: ${project.customer}`)
  }

  console.log(`   ✓ Created ${createdProjects.length} projects`)

  return createdProjects
}
