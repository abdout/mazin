/**
 * HS code starter seed — common Sudan import categories covering ~50 codes
 * across vehicles, electronics, food, chemicals, and construction materials.
 *
 * Duty rates are representative and should be verified against the current
 * Sudan Customs Tariff Book before use. VAT is universal at 17%.
 */
import { PrismaClient } from "@prisma/client"

const VAT = 17

type SeedRow = {
  code: string
  description: string
  descriptionAr: string
  category: string
  customsDutyRate: number
  exciseRate?: number
  developmentFee?: number
}

const HS_CODES: SeedRow[] = [
  // Vehicles
  { code: "8703.21", description: "Passenger cars, up to 1000cc", descriptionAr: "سيارات ركاب، حتى 1000 سم مكعب", category: "Vehicles", customsDutyRate: 15, exciseRate: 5 },
  { code: "8703.22", description: "Passenger cars, 1000-1500cc", descriptionAr: "سيارات ركاب، 1000-1500 سم مكعب", category: "Vehicles", customsDutyRate: 20, exciseRate: 10 },
  { code: "8703.23", description: "Passenger cars, 1500-3000cc", descriptionAr: "سيارات ركاب، 1500-3000 سم مكعب", category: "Vehicles", customsDutyRate: 25, exciseRate: 15 },
  { code: "8703.24", description: "Passenger cars, over 3000cc", descriptionAr: "سيارات ركاب، أكثر من 3000 سم مكعب", category: "Vehicles", customsDutyRate: 30, exciseRate: 25 },
  { code: "8704.21", description: "Light trucks, up to 5 tons", descriptionAr: "شاحنات خفيفة، حتى 5 طن", category: "Vehicles", customsDutyRate: 10 },
  { code: "8704.22", description: "Medium trucks, 5-20 tons", descriptionAr: "شاحنات متوسطة، 5-20 طن", category: "Vehicles", customsDutyRate: 10 },
  { code: "8711.20", description: "Motorcycles, 50-250cc", descriptionAr: "دراجات نارية، 50-250 سم مكعب", category: "Vehicles", customsDutyRate: 20 },

  // Electronics
  { code: "8471.30", description: "Laptops and portable computers", descriptionAr: "أجهزة الكمبيوتر المحمولة", category: "Electronics", customsDutyRate: 5 },
  { code: "8517.12", description: "Smartphones and mobile phones", descriptionAr: "الهواتف الذكية والمحمولة", category: "Electronics", customsDutyRate: 5 },
  { code: "8528.72", description: "Television sets, LCD/LED", descriptionAr: "أجهزة التلفزيون LCD/LED", category: "Electronics", customsDutyRate: 25 },
  { code: "8418.21", description: "Refrigerators, household", descriptionAr: "ثلاجات منزلية", category: "Electronics", customsDutyRate: 25 },
  { code: "8415.10", description: "Air conditioners, window/wall type", descriptionAr: "مكيفات هواء، نوع النافذة/الحائط", category: "Electronics", customsDutyRate: 25 },
  { code: "8450.11", description: "Washing machines, fully automatic", descriptionAr: "غسالات، أوتوماتيكية بالكامل", category: "Electronics", customsDutyRate: 25 },

  // Food & Beverage
  { code: "1006.30", description: "Rice, semi-milled or wholly milled", descriptionAr: "أرز، مقشور جزئيًا أو كليًا", category: "Food", customsDutyRate: 3 },
  { code: "1001.99", description: "Wheat (other than durum)", descriptionAr: "قمح (غير القاسي)", category: "Food", customsDutyRate: 0 },
  { code: "1701.99", description: "Refined sugar", descriptionAr: "سكر مكرر", category: "Food", customsDutyRate: 10 },
  { code: "1511.90", description: "Palm oil, refined", descriptionAr: "زيت نخيل مكرر", category: "Food", customsDutyRate: 10 },
  { code: "0402.21", description: "Milk powder, full cream", descriptionAr: "حليب مجفف كامل الدسم", category: "Food", customsDutyRate: 10 },
  { code: "2203.00", description: "Beer made from malt", descriptionAr: "جعة من الشعير", category: "Food", customsDutyRate: 40, exciseRate: 40 },
  { code: "0901.21", description: "Coffee, roasted, not decaffeinated", descriptionAr: "بن محمص غير منزوع الكافيين", category: "Food", customsDutyRate: 25 },

  // Chemicals (SSMO regulated)
  { code: "2710.19", description: "Petroleum oils, not crude", descriptionAr: "زيوت بترولية غير خام", category: "Chemicals", customsDutyRate: 3 },
  { code: "2712.10", description: "Petroleum jelly (vaseline)", descriptionAr: "هلام البترول (فازلين)", category: "Chemicals", customsDutyRate: 10 },
  { code: "2905.45", description: "Glycerol", descriptionAr: "جلسرين", category: "Chemicals", customsDutyRate: 10 },
  { code: "3808.91", description: "Insecticides", descriptionAr: "مبيدات حشرية", category: "Chemicals", customsDutyRate: 5 },
  { code: "3102.10", description: "Urea fertilizer", descriptionAr: "سماد اليوريا", category: "Chemicals", customsDutyRate: 0 },
  { code: "3004.90", description: "Pharmaceuticals, other medicaments", descriptionAr: "أدوية أخرى", category: "Chemicals", customsDutyRate: 0 },

  // Construction Materials
  { code: "2523.29", description: "Portland cement", descriptionAr: "أسمنت بورتلاند", category: "Construction", customsDutyRate: 15 },
  { code: "7214.20", description: "Iron/steel bars, reinforcing (rebar)", descriptionAr: "قضبان تسليح من الحديد/الصلب", category: "Construction", customsDutyRate: 10 },
  { code: "7308.30", description: "Doors, windows and frames, iron/steel", descriptionAr: "أبواب ونوافذ وإطارات من الحديد/الصلب", category: "Construction", customsDutyRate: 25 },
  { code: "6907.22", description: "Ceramic tiles, porcelain", descriptionAr: "بلاط سيراميك بورسلين", category: "Construction", customsDutyRate: 25 },
  { code: "3918.10", description: "PVC floor coverings", descriptionAr: "أغطية أرضيات PVC", category: "Construction", customsDutyRate: 25 },
  { code: "7324.10", description: "Stainless steel sinks/wash basins", descriptionAr: "أحواض من الفولاذ المقاوم للصدأ", category: "Construction", customsDutyRate: 25 },

  // Textiles & Apparel
  { code: "5208.31", description: "Cotton fabrics, plain weave", descriptionAr: "أقمشة قطنية منسوجة عادية", category: "Textiles", customsDutyRate: 15 },
  { code: "6109.10", description: "T-shirts, cotton", descriptionAr: "تي شيرت قطنية", category: "Textiles", customsDutyRate: 25 },
  { code: "6203.42", description: "Men's trousers, cotton", descriptionAr: "بناطيل رجالية قطنية", category: "Textiles", customsDutyRate: 25 },
  { code: "6402.99", description: "Footwear, rubber/plastic", descriptionAr: "أحذية من المطاط/البلاستيك", category: "Textiles", customsDutyRate: 25 },

  // Machinery & industrial
  { code: "8429.52", description: "Excavators, self-propelled", descriptionAr: "حفارات ذاتية الدفع", category: "Machinery", customsDutyRate: 5 },
  { code: "8427.20", description: "Forklifts, self-propelled", descriptionAr: "رافعات شوكية ذاتية الدفع", category: "Machinery", customsDutyRate: 5 },
  { code: "8501.52", description: "AC motors, 750W-75kW", descriptionAr: "محركات تيار متردد، 750 واط-75 كيلو واط", category: "Machinery", customsDutyRate: 10 },
  { code: "8481.80", description: "Valves, taps, cocks (industrial)", descriptionAr: "صمامات ومحابس صناعية", category: "Machinery", customsDutyRate: 10 },

  // Paper & printing
  { code: "4802.56", description: "Uncoated paper, writing, 40-150g/m²", descriptionAr: "ورق كتابة غير مطلي، 40-150 جم/م²", category: "Paper", customsDutyRate: 10 },
  { code: "4819.10", description: "Cartons, boxes, corrugated paperboard", descriptionAr: "كراتين وصناديق من الورق المقوى المموج", category: "Paper", customsDutyRate: 25 },

  // Misc
  { code: "9403.20", description: "Metal furniture (other than office)", descriptionAr: "أثاث معدني (غير المكتبي)", category: "Furniture", customsDutyRate: 25 },
  { code: "9401.71", description: "Upholstered seats with metal frames", descriptionAr: "مقاعد مكسية بإطارات معدنية", category: "Furniture", customsDutyRate: 25 },
  { code: "3923.30", description: "Plastic bottles/containers", descriptionAr: "زجاجات/حاويات بلاستيكية", category: "Plastics", customsDutyRate: 25 },
  { code: "3917.32", description: "Plastic tubes and hoses", descriptionAr: "أنابيب وخراطيم بلاستيكية", category: "Plastics", customsDutyRate: 15 },
]

export async function seedHsCodes(db: PrismaClient) {
  for (const row of HS_CODES) {
    await db.hsCode.upsert({
      where: { code: row.code },
      update: {
        description: row.description,
        descriptionAr: row.descriptionAr,
        customsDutyRate: row.customsDutyRate,
        vatRate: VAT,
        exciseRate: row.exciseRate ?? 0,
        developmentFee: row.developmentFee ?? 0,
        category: row.category,
        isActive: true,
      },
      create: {
        code: row.code,
        description: row.description,
        descriptionAr: row.descriptionAr,
        customsDutyRate: row.customsDutyRate,
        vatRate: VAT,
        exciseRate: row.exciseRate ?? 0,
        developmentFee: row.developmentFee ?? 0,
        category: row.category,
        isActive: true,
      },
    })
  }
  return HS_CODES.length
}
