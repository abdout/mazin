// Dictionary type definition (client-safe)
// This mirrors the structure of ar.json/en.json

export interface Dictionary {
  common: {
    appName: string
    save: string
    cancel: string
    delete: string
    edit: string
    create: string
    search: string
    filter: string
    loading: string
    noResults: string
    actions: string
    confirm: string
    back: string
    next: string
    previous: string
    yes: string
    no: string
    all: string
    none: string
    required: string
    optional: string
    success: string
    error: string
    warning: string
  }
  navigation: {
    dashboard: string
    shipments: string
    customs: string
    invoices: string
    settings: string
    users: string
    logout: string
  }
  auth: {
    login: string
    logout: string
    email: string
    password: string
    forgotPassword: string
    loginButton: string
    invalidCredentials: string
    welcomeBack: string
  }
  dashboard: {
    title: string
    totalShipments: string
    inTransit: string
    pendingCustoms: string
    unpaidInvoices: string
    recentShipments: string
    quickActions: string
    newShipment: string
    newDeclaration: string
    newInvoice: string
  }
  shipments: {
    title: string
    newShipment: string
    editShipment: string
    shipmentDetails: string
    shipmentNumber: string
    type: string
    status: string
    description: string
    weight: string
    quantity: string
    containerNumber: string
    vesselName: string
    consignor: string
    consignee: string
    arrivalDate: string
    departureDate: string
    types: {
      IMPORT: string
      EXPORT: string
    }
    statuses: {
      PENDING: string
      IN_TRANSIT: string
      ARRIVED: string
      CLEARED: string
      DELIVERED: string
    }
    createSuccess: string
    updateSuccess: string
    deleteSuccess: string
  }
  customs: {
    title: string
    newDeclaration: string
    editDeclaration: string
    declarationDetails: string
    declarationNumber: string
    hsCode: string
    dutyAmount: string
    taxAmount: string
    currency: string
    documents: string
    uploadDocument: string
    approve: string
    reject: string
    submit: string
    statuses: {
      DRAFT: string
      SUBMITTED: string
      UNDER_REVIEW: string
      APPROVED: string
      REJECTED: string
    }
    documentTypes: {
      BILL_OF_LADING: string
      COMMERCIAL_INVOICE: string
      PACKING_LIST: string
      CERTIFICATE_OF_ORIGIN: string
      INSURANCE_CERTIFICATE: string
      OTHER: string
    }
  }
  invoices: {
    title: string
    newInvoice: string
    editInvoice: string
    invoiceDetails: string
    invoiceNumber: string
    subtotal: string
    tax: string
    total: string
    dueDate: string
    paidAt: string
    lineItems: string
    addItem: string
    itemDescription: string
    unitPrice: string
    downloadPdf: string
    markAsPaid: string
    markAsSent: string
    statuses: {
      DRAFT: string
      SENT: string
      PAID: string
      OVERDUE: string
      CANCELLED: string
    }
    currencies: {
      SDG: string
      USD: string
      SAR: string
    }
  }
  settings: {
    title: string
    profile: string
    language: string
    changePassword: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
  users: {
    title: string
    newUser: string
    editUser: string
    name: string
    email: string
    role: string
    roles: {
      ADMIN: string
      MANAGER: string
      CLERK: string
      VIEWER: string
    }
  }
  validation: {
    required: string
    invalidEmail: string
    minLength: string
    maxLength: string
    invalidNumber: string
    positiveNumber: string
  }
  marketing: {
    hero: {
      title: string
      subtitle: string
      cta: string
      contact: string
    }
    stats: {
      years: string
      yearsValue: string
      shipments: string
      shipmentsValue: string
      clients: string
      clientsValue: string
      clearanceTime: string
      clearanceTimeValue: string
    }
    services: {
      title: string
      subtitle: string
      import: { title: string; description: string }
      export: { title: string; description: string }
      warehouse: { title: string; description: string }
      transport: { title: string; description: string }
    }
    process: {
      title: string
      subtitle: string
      step1: { title: string; description: string }
      step2: { title: string; description: string }
      step3: { title: string; description: string }
      step4: { title: string; description: string }
    }
    features: {
      title: string
      subtitle: string
      tracking: { title: string; description: string }
      invoicing: { title: string; description: string }
      documents: { title: string; description: string }
      access: { title: string; description: string }
    }
    cta: {
      title: string
      subtitle: string
      button: string
    }
    contact: {
      title: string
      subtitle: string
      name: string
      email: string
      phone: string
      message: string
      submit: string
      success: string
    }
  }
}
