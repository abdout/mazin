/**
 * Marketplace Seed Data
 *
 * Seeds realistic data for the customs clearance marketplace:
 * - 4 Service Categories (Truck, Forklift, Manpower, Tools)
 * - 6 Vendors (approved service providers)
 * - 15+ Service Listings across all categories
 * - Sample Service Requests
 */

import type { PrismaClient, User } from "@prisma/client"

// ============================================================================
// SERVICE CATEGORIES
// ============================================================================

const CATEGORIES = [
  {
    type: "TRUCK" as const,
    name: "Trucking Services",
    nameAr: "خدمات النقل بالشاحنات",
    description: "Container transport and cargo delivery services",
    descriptionAr: "خدمات نقل الحاويات وتوصيل البضائع",
    icon: "truck",
    sortOrder: 1,
  },
  {
    type: "FORKLIFT" as const,
    name: "Forklift Services",
    nameAr: "خدمات الرافعات الشوكية",
    description: "Loading, unloading, and cargo handling equipment",
    descriptionAr: "معدات التحميل والتفريغ ومناولة البضائع",
    icon: "forklift",
    sortOrder: 2,
  },
  {
    type: "MANPOWER" as const,
    name: "Manpower Services",
    nameAr: "خدمات العمالة",
    description: "Skilled labor for cargo handling and port operations",
    descriptionAr: "عمالة ماهرة لمناولة البضائع وعمليات الميناء",
    icon: "users",
    sortOrder: 3,
  },
  {
    type: "TOOLS" as const,
    name: "Tools & Equipment",
    nameAr: "الأدوات والمعدات",
    description: "Equipment rental for cargo and clearance operations",
    descriptionAr: "تأجير المعدات لعمليات الشحن والتخليص",
    icon: "wrench",
    sortOrder: 4,
  },
]

// ============================================================================
// VENDORS
// ============================================================================

const VENDORS = [
  {
    businessName: "Red Sea Transport Co.",
    businessNameAr: "شركة البحر الأحمر للنقل",
    description: "Leading trucking company in Port Sudan with 20+ years experience. Fleet of 50+ trucks for container and bulk cargo transport.",
    descriptionAr: "شركة نقل رائدة في بورتسودان بخبرة تزيد عن 20 عاماً. أسطول من أكثر من 50 شاحنة لنقل الحاويات والبضائع السائبة.",
    contactName: "Ahmed Hassan",
    email: "contact@redseaport.sd",
    phone: "+249912345001",
    whatsappNumber: "+249912345001",
    city: "Port Sudan",
    address: "Industrial Area, Block 5",
    taxId: "SD-TAX-2001-001",
    status: "APPROVED" as const,
  },
  {
    businessName: "Sudan Logistics Solutions",
    businessNameAr: "حلول السودان اللوجستية",
    description: "Full-service logistics provider offering trucking, warehousing, and equipment rental. ISO certified operations.",
    descriptionAr: "مزود خدمات لوجستية متكامل يقدم النقل بالشاحنات والتخزين وتأجير المعدات. عمليات معتمدة بشهادة ISO.",
    contactName: "Mohamed Ali",
    email: "info@sudanlogistics.sd",
    phone: "+249912345002",
    whatsappNumber: "+249912345002",
    city: "Port Sudan",
    address: "Port Road, Building 12",
    taxId: "SD-TAX-2005-042",
    status: "APPROVED" as const,
  },
  {
    businessName: "Al-Amal Equipment Rental",
    businessNameAr: "الأمل لتأجير المعدات",
    description: "Specialized in forklift and heavy equipment rental. 24/7 service with trained operators available.",
    descriptionAr: "متخصصون في تأجير الرافعات الشوكية والمعدات الثقيلة. خدمة على مدار الساعة مع مشغلين مدربين.",
    contactName: "Ibrahim Osman",
    email: "rental@alamal-equip.sd",
    phone: "+249912345003",
    whatsappNumber: "+249912345003",
    city: "Port Sudan",
    address: "Near Container Terminal",
    status: "APPROVED" as const,
  },
  {
    businessName: "Port Workers Union",
    businessNameAr: "اتحاد عمال الميناء",
    description: "Official labor provider for port operations. Experienced stevedores, cargo handlers, and warehouse workers.",
    descriptionAr: "مزود العمالة الرسمي لعمليات الميناء. عمال شحن وتفريغ ذوو خبرة ومناولو بضائع وعمال مستودعات.",
    contactName: "Khalid Mahmoud",
    email: "workers@portunion.sd",
    phone: "+249912345004",
    whatsappNumber: "+249912345004",
    city: "Port Sudan",
    address: "Port Sudan Workers Building",
    status: "APPROVED" as const,
  },
  {
    businessName: "Nile Valley Tools",
    businessNameAr: "أدوات وادي النيل",
    description: "Complete range of cargo handling tools and safety equipment. Rental and sales available.",
    descriptionAr: "مجموعة كاملة من أدوات مناولة البضائع ومعدات السلامة. التأجير والبيع متاح.",
    contactName: "Fatima Ahmed",
    email: "tools@nilevalley.sd",
    phone: "+249912345005",
    whatsappNumber: "+249912345005",
    city: "Port Sudan",
    address: "Commercial District, Shop 7",
    status: "APPROVED" as const,
  },
  {
    businessName: "Express Cargo Movers",
    businessNameAr: "إكسبريس لنقل البضائع",
    description: "Fast and reliable cargo transport. Specializing in time-sensitive shipments and refrigerated containers.",
    descriptionAr: "نقل بضائع سريع وموثوق. متخصصون في الشحنات الحساسة للوقت والحاويات المبردة.",
    contactName: "Youssef Omar",
    email: "express@cargomove.sd",
    phone: "+249912345006",
    whatsappNumber: "+249912345006",
    city: "Port Sudan",
    address: "Highway 1, KM 5",
    status: "APPROVED" as const,
  },
]

// ============================================================================
// SERVICE LISTINGS
// ============================================================================

interface ServiceListingData {
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  details: string
  detailsAr: string
  priceMin: number
  priceMax?: number
  currency: string
  priceNote?: string
  priceNoteAr?: string
  categoryType: "TRUCK" | "FORKLIFT" | "MANPOWER" | "TOOLS"
  vendorIndex: number // Index in VENDORS array
  serviceArea: string
  capacity?: string
}

const SERVICES: ServiceListingData[] = [
  // TRUCK Services
  {
    title: "20ft Container Transport",
    titleAr: "نقل حاوية 20 قدم",
    description: "Transport of 20ft containers from port to destination within Port Sudan area.",
    descriptionAr: "نقل حاويات 20 قدم من الميناء إلى الوجهة داخل منطقة بورتسودان.",
    details: "Includes loading at port, secure transport, and unloading at destination. GPS tracking available. Insurance coverage included. Average delivery time: 2-4 hours within city limits.",
    detailsAr: "يشمل التحميل في الميناء والنقل الآمن والتفريغ في الوجهة. تتبع GPS متاح. تغطية تأمينية مشمولة. متوسط وقت التسليم: 2-4 ساعات داخل حدود المدينة.",
    priceMin: 15000,
    priceMax: 25000,
    currency: "SDG",
    priceNote: "Price varies by distance",
    priceNoteAr: "السعر يختلف حسب المسافة",
    categoryType: "TRUCK",
    vendorIndex: 0,
    serviceArea: "Port Sudan",
    capacity: "20ft Container",
  },
  {
    title: "40ft Container Transport",
    titleAr: "نقل حاوية 40 قدم",
    description: "Transport of 40ft containers from port to any location in Red Sea State.",
    descriptionAr: "نقل حاويات 40 قدم من الميناء إلى أي موقع في ولاية البحر الأحمر.",
    details: "Professional handling of full-size containers. Includes all necessary permits and experienced drivers. Real-time tracking and 24/7 support.",
    detailsAr: "مناولة احترافية للحاويات كاملة الحجم. يشمل جميع التصاريح اللازمة وسائقين ذوي خبرة. تتبع فوري ودعم على مدار الساعة.",
    priceMin: 25000,
    priceMax: 45000,
    currency: "SDG",
    priceNote: "Price varies by distance",
    priceNoteAr: "السعر يختلف حسب المسافة",
    categoryType: "TRUCK",
    vendorIndex: 0,
    serviceArea: "Red Sea State",
    capacity: "40ft Container",
  },
  {
    title: "Refrigerated Container Transport",
    titleAr: "نقل حاوية مبردة",
    description: "Temperature-controlled transport for perishable goods and cold chain logistics.",
    descriptionAr: "نقل بدرجة حرارة مضبوطة للبضائع القابلة للتلف ولوجستيات سلسلة التبريد.",
    details: "Reefer trucks with temperature monitoring. Suitable for food, pharmaceuticals, and other temperature-sensitive cargo. Temperature logs provided.",
    detailsAr: "شاحنات مبردة مع مراقبة درجة الحرارة. مناسبة للأغذية والأدوية والبضائع الأخرى الحساسة للحرارة. يتم توفير سجلات درجة الحرارة.",
    priceMin: 35000,
    priceMax: 60000,
    currency: "SDG",
    categoryType: "TRUCK",
    vendorIndex: 5,
    serviceArea: "Port Sudan",
    capacity: "Reefer 20ft/40ft",
  },
  {
    title: "Bulk Cargo Transport",
    titleAr: "نقل البضائع السائبة",
    description: "Transport of bulk cargo, construction materials, and loose goods.",
    descriptionAr: "نقل البضائع السائبة ومواد البناء والبضائع غير المعبأة.",
    details: "Flatbed and tipper trucks available. Suitable for grain, cement, steel, and other bulk materials. Weight capacity up to 30 tons.",
    detailsAr: "شاحنات مسطحة وقلابة متاحة. مناسبة للحبوب والأسمنت والصلب والمواد السائبة الأخرى. سعة حمولة تصل إلى 30 طن.",
    priceMin: 12000,
    priceMax: 30000,
    currency: "SDG",
    priceNote: "Per trip",
    priceNoteAr: "لكل رحلة",
    categoryType: "TRUCK",
    vendorIndex: 1,
    serviceArea: "Port Sudan",
    capacity: "Up to 30 tons",
  },

  // FORKLIFT Services
  {
    title: "3-Ton Forklift with Operator",
    titleAr: "رافعة شوكية 3 طن مع مشغل",
    description: "3-ton capacity forklift rental with trained operator for warehouse and port operations.",
    descriptionAr: "تأجير رافعة شوكية بسعة 3 طن مع مشغل مدرب لعمليات المستودعات والموانئ.",
    details: "Includes diesel forklift, trained operator, and basic maintenance. Minimum rental: 4 hours. Available for daily, weekly, or monthly rental.",
    detailsAr: "يشمل رافعة شوكية ديزل ومشغل مدرب وصيانة أساسية. الحد الأدنى للإيجار: 4 ساعات. متاح للإيجار اليومي أو الأسبوعي أو الشهري.",
    priceMin: 2500,
    currency: "SDG",
    priceNote: "Per hour",
    priceNoteAr: "بالساعة",
    categoryType: "FORKLIFT",
    vendorIndex: 2,
    serviceArea: "Port Sudan",
    capacity: "3 Ton",
  },
  {
    title: "5-Ton Forklift with Operator",
    titleAr: "رافعة شوكية 5 طن مع مشغل",
    description: "Heavy-duty 5-ton forklift for container stuffing and heavy cargo handling.",
    descriptionAr: "رافعة شوكية ثقيلة 5 طن لتعبئة الحاويات ومناولة البضائع الثقيلة.",
    details: "Powerful forklift suitable for heavy pallets and container loading. Certified operators with port access clearance.",
    detailsAr: "رافعة شوكية قوية مناسبة للمنصات الثقيلة وتحميل الحاويات. مشغلون معتمدون مع تصريح دخول الميناء.",
    priceMin: 3500,
    currency: "SDG",
    priceNote: "Per hour",
    priceNoteAr: "بالساعة",
    categoryType: "FORKLIFT",
    vendorIndex: 2,
    serviceArea: "Port Sudan",
    capacity: "5 Ton",
  },
  {
    title: "Reach Stacker Rental",
    titleAr: "تأجير رافعة حاويات",
    description: "Container reach stacker for stacking and moving containers in yards.",
    descriptionAr: "رافعة حاويات لتكديس ونقل الحاويات في الساحات.",
    details: "Ideal for container yards and warehouses. Can stack containers up to 5 high. Includes operator and fuel.",
    detailsAr: "مثالية لساحات الحاويات والمستودعات. يمكن تكديس الحاويات حتى 5 طوابق. يشمل المشغل والوقود.",
    priceMin: 8000,
    currency: "SDG",
    priceNote: "Per hour",
    priceNoteAr: "بالساعة",
    categoryType: "FORKLIFT",
    vendorIndex: 1,
    serviceArea: "Port Sudan",
    capacity: "45 Ton (containers)",
  },

  // MANPOWER Services
  {
    title: "Stevedore Team (10 Workers)",
    titleAr: "فريق شحن وتفريغ (10 عمال)",
    description: "Professional stevedore team for vessel loading/unloading operations.",
    descriptionAr: "فريق شحن وتفريغ محترف لعمليات تحميل وتفريغ السفن.",
    details: "Experienced port workers trained in safe cargo handling. Includes team leader, safety equipment, and coordination. 8-hour shift minimum.",
    detailsAr: "عمال ميناء ذوو خبرة مدربون على مناولة البضائع بأمان. يشمل قائد الفريق ومعدات السلامة والتنسيق. الحد الأدنى 8 ساعات.",
    priceMin: 8000,
    currency: "SDG",
    priceNote: "Per shift (8 hours)",
    priceNoteAr: "لكل وردية (8 ساعات)",
    categoryType: "MANPOWER",
    vendorIndex: 3,
    serviceArea: "Port Sudan",
    capacity: "10 Workers",
  },
  {
    title: "Warehouse Workers (5 Workers)",
    titleAr: "عمال مستودع (5 عمال)",
    description: "Warehouse staff for inventory handling, packing, and organization.",
    descriptionAr: "موظفو مستودع لمناولة المخزون والتعبئة والتنظيم.",
    details: "Trained warehouse workers for sorting, packing, labeling, and inventory management. Flexible scheduling available.",
    detailsAr: "عمال مستودع مدربون للفرز والتعبئة والتوسيم وإدارة المخزون. جدولة مرنة متاحة.",
    priceMin: 4000,
    currency: "SDG",
    priceNote: "Per shift (8 hours)",
    priceNoteAr: "لكل وردية (8 ساعات)",
    categoryType: "MANPOWER",
    vendorIndex: 3,
    serviceArea: "Port Sudan",
    capacity: "5 Workers",
  },
  {
    title: "Container Stuffing Crew",
    titleAr: "طاقم تعبئة الحاويات",
    description: "Specialized team for efficient container loading and stuffing.",
    descriptionAr: "فريق متخصص لتحميل وتعبئة الحاويات بكفاءة.",
    details: "Expert team for maximizing container space utilization. Includes lashing and securing cargo. Per container pricing.",
    detailsAr: "فريق خبير لتعظيم استخدام مساحة الحاوية. يشمل ربط وتأمين البضائع. تسعير لكل حاوية.",
    priceMin: 3000,
    priceMax: 5000,
    currency: "SDG",
    priceNote: "Per container",
    priceNoteAr: "لكل حاوية",
    categoryType: "MANPOWER",
    vendorIndex: 3,
    serviceArea: "Port Sudan",
    capacity: "Per Container",
  },
  {
    title: "Security Guards (Night Shift)",
    titleAr: "حراس أمن (وردية ليلية)",
    description: "Trained security personnel for cargo and warehouse protection.",
    descriptionAr: "موظفو أمن مدربون لحماية البضائع والمستودعات.",
    details: "Licensed security guards for cargo protection. 12-hour night shifts. Includes patrol and incident reporting.",
    detailsAr: "حراس أمن مرخصون لحماية البضائع. ورديات ليلية 12 ساعة. يشمل الدوريات والإبلاغ عن الحوادث.",
    priceMin: 1500,
    currency: "SDG",
    priceNote: "Per guard per shift",
    priceNoteAr: "لكل حارس لكل وردية",
    categoryType: "MANPOWER",
    vendorIndex: 1,
    serviceArea: "Port Sudan",
    capacity: "1 Guard",
  },

  // TOOLS & EQUIPMENT Services
  {
    title: "Cargo Straps & Lashing Kit",
    titleAr: "أحزمة ربط ومعدات تثبيت البضائع",
    description: "Complete lashing equipment set for securing cargo in containers.",
    descriptionAr: "مجموعة كاملة من معدات الربط لتأمين البضائع في الحاويات.",
    details: "Includes ratchet straps, corner protectors, and lashing bars. Rental per day or purchase available.",
    detailsAr: "يشمل أحزمة السقاطة وحماة الزوايا وقضبان الربط. الإيجار باليوم أو الشراء متاح.",
    priceMin: 500,
    currency: "SDG",
    priceNote: "Per day rental",
    priceNoteAr: "إيجار يومي",
    categoryType: "TOOLS",
    vendorIndex: 4,
    serviceArea: "Port Sudan",
  },
  {
    title: "Pallet Jack Rental",
    titleAr: "تأجير رافعة منصات يدوية",
    description: "Manual pallet jack for warehouse and container operations.",
    descriptionAr: "رافعة منصات يدوية لعمليات المستودعات والحاويات.",
    details: "2.5-ton capacity hand pallet truck. Easy to operate, no special training required. Daily and weekly rates available.",
    detailsAr: "رافعة منصات يدوية بسعة 2.5 طن. سهلة التشغيل، لا تتطلب تدريباً خاصاً. أسعار يومية وأسبوعية متاحة.",
    priceMin: 300,
    currency: "SDG",
    priceNote: "Per day",
    priceNoteAr: "باليوم",
    categoryType: "TOOLS",
    vendorIndex: 4,
    serviceArea: "Port Sudan",
    capacity: "2.5 Ton",
  },
  {
    title: "Weighing Scale (Platform)",
    titleAr: "ميزان منصة",
    description: "Industrial platform scale for cargo weighing up to 3 tons.",
    descriptionAr: "ميزان منصة صناعي لوزن البضائع حتى 3 طن.",
    details: "Digital display, certified calibration. Includes delivery and setup within Port Sudan.",
    detailsAr: "شاشة رقمية، معايرة معتمدة. يشمل التوصيل والتركيب داخل بورتسودان.",
    priceMin: 800,
    currency: "SDG",
    priceNote: "Per day",
    priceNoteAr: "باليوم",
    categoryType: "TOOLS",
    vendorIndex: 4,
    serviceArea: "Port Sudan",
    capacity: "3 Ton",
  },
  {
    title: "Safety Equipment Kit",
    titleAr: "مجموعة معدات السلامة",
    description: "Complete PPE kit for port and warehouse workers.",
    descriptionAr: "مجموعة معدات حماية شخصية كاملة لعمال الموانئ والمستودعات.",
    details: "Includes hard hats, safety vests, gloves, and steel-toe boots. Set of 10 kits. Rental or purchase.",
    detailsAr: "يشمل خوذات صلبة وسترات سلامة وقفازات وأحذية بمقدمة فولاذية. مجموعة من 10 أطقم. إيجار أو شراء.",
    priceMin: 2000,
    currency: "SDG",
    priceNote: "Per set of 10",
    priceNoteAr: "لكل مجموعة من 10",
    categoryType: "TOOLS",
    vendorIndex: 4,
    serviceArea: "Port Sudan",
    capacity: "10 Sets",
  },
  {
    title: "Container Inspection Light Kit",
    titleAr: "مجموعة إضاءة فحص الحاويات",
    description: "Portable LED lights for container inspection and night operations.",
    descriptionAr: "أضواء LED محمولة لفحص الحاويات والعمليات الليلية.",
    details: "Rechargeable LED work lights with magnetic mounts. Set of 4 lights with charger. 12-hour battery life.",
    detailsAr: "أضواء عمل LED قابلة للشحن مع حوامل مغناطيسية. مجموعة من 4 أضواء مع شاحن. عمر البطارية 12 ساعة.",
    priceMin: 400,
    currency: "SDG",
    priceNote: "Per day",
    priceNoteAr: "باليوم",
    categoryType: "TOOLS",
    vendorIndex: 4,
    serviceArea: "Port Sudan",
  },
]

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

export async function seedMarketplace(prisma: PrismaClient, users: User[]) {
  console.log("   🏪 Seeding marketplace categories...")

  // Seed categories
  const categories = await Promise.all(
    CATEGORIES.map((cat) =>
      prisma.serviceCategory.upsert({
        where: { type: cat.type },
        update: cat,
        create: cat,
      })
    )
  )
  console.log(`      ✓ Created ${categories.length} service categories`)

  // Create category lookup map
  const categoryMap = new Map(categories.map((c) => [c.type, c.id]))

  console.log("   👥 Seeding vendors...")

  // Seed vendors (link to admin user for management)
  const adminUser = users.find((u) => u.role === "ADMIN")

  const vendors = await Promise.all(
    VENDORS.map((vendor, index) =>
      prisma.vendor.upsert({
        where: { email: vendor.email },
        update: {
          ...vendor,
          approvedAt: new Date(),
          approvedBy: adminUser?.id,
        },
        create: {
          ...vendor,
          approvedAt: new Date(),
          approvedBy: adminUser?.id,
          // Link first vendor to admin user for testing vendor dashboard
          userId: index === 0 ? adminUser?.id : undefined,
        },
      })
    )
  )
  console.log(`      ✓ Created ${vendors.length} vendors`)

  console.log("   📦 Seeding service listings...")

  // Seed service listings
  const listings = await Promise.all(
    SERVICES.map((service) => {
      const categoryId = categoryMap.get(service.categoryType)
      const vendor = vendors[service.vendorIndex]

      if (!categoryId || !vendor) {
        throw new Error(`Invalid category or vendor for service: ${service.title}`)
      }

      return prisma.serviceListing.create({
        data: {
          title: service.title,
          titleAr: service.titleAr,
          description: service.description,
          descriptionAr: service.descriptionAr,
          details: service.details,
          detailsAr: service.detailsAr,
          priceMin: service.priceMin,
          priceMax: service.priceMax,
          currency: service.currency,
          priceNote: service.priceNote,
          priceNoteAr: service.priceNoteAr,
          serviceArea: service.serviceArea,
          capacity: service.capacity,
          isActive: true,
          vendorId: vendor.id,
          categoryId: categoryId,
        },
      })
    })
  )
  console.log(`      ✓ Created ${listings.length} service listings`)

  console.log("   📝 Seeding sample service requests...")

  // Create a few sample requests
  const sampleRequests = [
    {
      requesterName: "Ibrahim Trading Co.",
      requesterPhone: "+249912000001",
      requesterEmail: "ibrahim@trading.sd",
      message: "Need transport for 2x40ft containers from port to warehouse. Urgent delivery required.",
      quantity: 2,
      serviceIndex: 1, // 40ft Container Transport
      status: "PENDING" as const,
    },
    {
      requesterName: "Al-Noor Imports",
      requesterPhone: "+249912000002",
      requesterEmail: "orders@alnoor.sd",
      message: "Require forklift service for unloading shipment tomorrow morning.",
      quantity: 1,
      serviceIndex: 4, // 3-Ton Forklift
      status: "CONTACTED" as const,
    },
    {
      requesterName: "Sudan Agricultural Corp",
      requesterPhone: "+249912000003",
      message: "Need 20 workers for container stuffing. 5 containers over 2 days.",
      quantity: 5,
      serviceIndex: 9, // Container Stuffing Crew
      status: "IN_PROGRESS" as const,
    },
  ]

  let requestCounter = 1
  const requests = await Promise.all(
    sampleRequests.map(async (req) => {
      const service = listings[req.serviceIndex]
      const vendor = vendors.find((v) => v.id === service.vendorId)

      if (!vendor) throw new Error("Vendor not found")

      return prisma.serviceRequest.create({
        data: {
          requestNumber: `SR-${String(requestCounter++).padStart(6, "0")}`,
          requesterName: req.requesterName,
          requesterPhone: req.requesterPhone,
          requesterEmail: req.requesterEmail,
          message: req.message,
          quantity: req.quantity,
          status: req.status,
          contactViewedAt: req.status !== "PENDING" ? new Date() : undefined,
          contactMethod: req.status !== "PENDING" ? "whatsapp" : undefined,
          serviceId: service.id,
          vendorId: vendor.id,
        },
      })
    })
  )
  console.log(`      ✓ Created ${requests.length} sample requests`)

  return {
    categories,
    vendors,
    listings,
    requests,
  }
}
