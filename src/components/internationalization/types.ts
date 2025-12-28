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
    view: string
    select: string
    createdAt: string
    email: string
    phone: string
    update: string
    export?: string
    exportAsCsv?: string
    exportAsJson?: string
    deleteSelected?: string
    rowsPerPage?: string
    page?: string
    of?: string
    rows?: string
    selected?: string
    reset?: string
    clear?: string
    columns?: string
    sync?: string
    syncing?: string
    areYouSure?: string
  }
  header: {
    services: string
    blog: string
    about: string
    platform: string
    track: string
    signUp: string
    login: string
  }
  navigation: {
    dashboard: string
    shipments: string
    customs: string
    invoices: string
    project: string
    task: string
    settings: string
    users: string
    logout: string
    help: string
    inbox: string
    userMenu: string
    notifications: string
    messages: string
    menu: string
    toggleMenu: string
    toggleSidebar: string
  }
  auth: {
    login: string
    logout: string
    email: string
    password: string
    name: string
    forgotPassword: string
    loginButton: string
    invalidCredentials: string
    welcomeBack: string
    loginDescription: string
    signUp: string
    createAccount: string
    signUpDescription: string
    dontHaveAccount: string
    alreadyHaveAccount: string
    orContinueWith: string
    confirm: string
    twoFactorCode: string
    twoFactorDescription: string
    resetPassword: string
    resetDescription: string
    newPassword: string
    newPasswordDescription: string
    confirmPassword: string
    sendResetLink: string
    backToLogin: string
    confirmEmail: string
    confirmEmailDescription: string
    emailVerified: string
    verifyingEmail: string
    enterEmail: string
    enterPassword: string
    enterName: string
    providers: {
      google: string
      facebook: string
    }
    errors: {
      emailInUseProvider: string
      somethingWrong: string
      emailNotVerified: string
      invalidCode: string
      expiredCode: string
      userNotFound: string
      invalidToken: string
      expiredToken: string
      passwordRequired: string
    }
    success: {
      emailSent: string
      passwordReset: string
      accountCreated: string
      confirmationSent: string
    }
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
    trendingUp: string
    trendingDown: string
  }
  shipments: {
    title: string
    nav?: {
      all?: string
      pending?: string
      inTransit?: string
      delivered?: string
    }
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
    nav?: {
      all?: string
      pending?: string
      cleared?: string
      held?: string
    }
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
    description: string
    nav?: {
      all: string
      invoices?: string
      settings?: string
      templates?: string
    }
    newInvoice: string
    newInvoiceDescription: string
    editInvoice: string
    editInvoiceDescription: string
    invoiceDetails: string
    details: string
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
    notes: string
    downloadPdf: string
    print: string
    sendEmail: string
    sendEmailDescription: string
    emailRecipient: string
    emailMessage: string
    emailMessagePlaceholder: string
    confirmSend: string
    sending: string
    emailSent: string
    clientInfo: string
    companyInfo: string
    taxId: string
    markAsPaid: string
    markAsSent: string
    cannotEditPaidCancelled: string
    client?: string
    amount?: string
    status?: string
    date?: string
    searchPlaceholder?: string
    actions?: string
    noInvoices?: string
    quantity?: string
    currency?: string
    createInvoice?: string
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
    settingsPage?: {
      title: string
      companyInfo: string
      branding: string
      logo: string
      signature: string
      bankDetails: string
      defaults: string
      invoicePrefix: string
      defaultCurrency: string
      taxRate: string
      paymentTerms: string
      terms: string
    }
    templatesPage?: {
      title: string
      preview: string
      downloadPdf: string
      printTemplate: string
      sampleInvoice: string
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
    theme: string
    light: string
    dark: string
    system: string
    toggleTheme: string
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
  finance?: {
    title?: string
    totalRevenue?: string
    outstanding?: string
    outstandingPayments?: string
    paidThisMonth?: string
    totalExpenses?: string
    growth?: string
    comingSoon?: string
    navigation?: {
      overview?: string
      invoice?: string
      banking?: string
      fees?: string
      salary?: string
      payroll?: string
      reports?: string
      receipt?: string
      timesheet?: string
      wallet?: string
      budget?: string
      expenses?: string
      accounts?: string
    }
  }
  project?: {
    title?: string
    newProject?: string
    editProject?: string
    customer?: string
    blAwbNumber?: string
    portOfOrigin?: string
    portOfDestination?: string
    teamLead?: string
    startDate?: string
    endDate?: string
    nav?: {
      all?: string
      active?: string
      completed?: string
      archived?: string
    }
    statuses?: {
      PENDING?: string
      IN_PROGRESS?: string
      CUSTOMS_HOLD?: string
      RELEASED?: string
      DELIVERED?: string
    }
  }
  task?: {
    title?: string
    task?: string
    project?: string
    stage?: string
    team?: string
    status?: string
    priority?: string
    remarks?: string
    hours?: string
    manual?: string
    newTask?: string
    editTask?: string
    taskName?: string
    projectRef?: string
    description?: string
    duration?: string
    assignedTo?: string
    dueDate?: string
    fetchError?: string
    syncError?: string
    syncCompleted?: string
    syncing?: string
    syncWithProjects?: string
    searchPlaceholder?: string
    filterOptions?: string
    nav?: {
      all?: string
      pending?: string
      inProgress?: string
      done?: string
    }
    statuses?: {
      PENDING?: string
      STUCK?: string
      IN_PROGRESS?: string
      DONE?: string
      CANCELLED?: string
    }
    priorities?: {
      URGENT?: string
      HIGH?: string
      MEDIUM?: string
      LOW?: string
      NEUTRAL?: string
    }
  }
  team?: {
    title?: string
    description?: string
    addMember?: string
    editMember?: string
    member?: string
    name?: string
    email?: string
    role?: string
    status?: string
    phone?: string
    department?: string
    joinedAt?: string
    active?: string
    inactive?: string
    searchPlaceholder?: string
    filterByRole?: string
    filterByStatus?: string
    noResults?: string
    actions?: string
    copyEmail?: string
    changeRole?: string
    deactivate?: string
    activate?: string
    nav?: {
      all?: string
      active?: string
      inactive?: string
    }
    columns?: {
      name?: string
      email?: string
      role?: string
      phone?: string
      status?: string
      department?: string
      joinedAt?: string
      actions?: string
    }
    statuses?: {
      ACTIVE?: string
      INACTIVE?: string
    }
    roles?: {
      ADMIN?: string
      MANAGER?: string
      CLERK?: string
      VIEWER?: string
    }
  }
  customer?: {
    title?: string
    newCustomer?: string
    companyName?: string
    contactName?: string
    isActive?: string
    active?: string
    inactive?: string
    invoiceCount?: string
    noCustomers?: string
    noCustomersDescription?: string
    addFirst?: string
    searchPlaceholder?: string
    filterStatus?: string
    columns?: {
      companyName?: string
      contactName?: string
      email?: string
      phone?: string
      status?: string
      invoiceCount?: string
      actions?: string
    }
  }
  about: {
    sections: {
      who: { subtitle: string; title: string; description: string }
      why: { subtitle: string; title: string; description: string }
      mission: { subtitle: string; title: string; description: string }
    }
    goals: Array<{ title: string; description: string }>
    boardOfDirectors: {
      subtitle: string
      title: string
      titleMobileLine1: string
      titleMobileLine2: string
      description: string
      members: Array<{ name: string; position: string }>
    }
  }
  marketing: {
    hero: {
      badge: string
      titleLine1: string
      titleLine2: string
      titleMobileLine1: string
      titleMobileLine2: string
      titleMobileLine3: string
      subtitle: string
      cta: string
      trackPlaceholder: string
      trackButton: string
    }
    partners: {
      title: string
    }
    testimonial: {
      quote: string
      author: string
      role: string
    }
    solutions: {
      badge: string
      title: string
      subtitle: string
      items: {
        realTime: { title: string; description: string }
        analytics: { title: string; description: string }
        automated: { title: string; description: string }
        multiCarrier: { title: string; description: string }
        customs: { title: string; description: string }
        warehouse: { title: string; description: string }
      }
    }
    allInOne: {
      badge: string
      title: string
      subtitle: string
      features: {
        documentation: { title: string; description: string }
        tracking: { title: string; description: string }
        invoicing: { title: string; description: string }
        access: { title: string; description: string }
      }
      tags: {
        control: string
        ops: string
        cost: string
        efficiency: string
        speed: string
        accuracy: string
      }
    }
    insights: {
      badge: string
      title: string
      viewAll: string
      articles: Record<string, { category: string; title: string; description: string; content?: string; date: string }>
    }
    services: {
      badge: string
      title: string
      subtitle: string
      items: {
        sea: { type: string; tag1: string; tag2: string; title: string; description: string }
        air: { type: string; tag1: string; tag2: string; title: string; description: string }
        ground: { type: string; tag1: string; tag2: string; title: string; description: string }
      }
    }
    faq: {
      title: string
      titleMobile: string
      subtitle: string
      items: {
        q1: { question: string; answer: string }
        q2: { question: string; answer: string }
        q3: { question: string; answer: string }
        q4: { question: string; answer: string }
        q5: { question: string; answer: string }
      }
    }
    footer: {
      description: string
      quickLinks: string
      services: string
      contact: string
      company: string
      support: string
      copyright: string
      readyToGetStarted: string
      newsletter: {
        title: string
        description: string
        placeholder: string
        button: string
      }
      links: {
        home: string
        features: string
        tracking: string
        solutions: string
        pricing: string
        import: string
        export: string
        warehouse: string
        transport: string
        about: string
        careers: string
        blog: string
        helpCenter: string
        documentation: string
        status: string
      }
      contactInfo: {
        address: string
        phone: string
        email: string
      }
    }
    numbers: {
      company: string
      inNumbers: string
      projects: string
      experts: string
      awards: string
      satisfied: string
    }
    gas: {
      subtitle: string
      title: string
      description: string
      features: {
        global: { title: string; description: string }
        smart: { title: string; description: string }
        fast: { title: string; description: string }
      }
      stats: {
        containers: string
        containersLabel: string
        delivery: string
        deliveryLabel: string
      }
      cta: string
    }
    servicesPage: {
      hero: { badge: string; title: string; subtitle: string }
      overview: { badge: string; title: string; subtitle: string }
      serviceDetails: {
        sea: { title: string; description: string; features: string[] }
        air: { title: string; description: string; features: string[] }
        ground: { title: string; description: string; features: string[] }
      }
      process: {
        badge: string
        title: string
        subtitle: string
        steps: Array<{ number: string; title: string; description: string }>
      }
      advantages: {
        badge: string
        title: string
        subtitle: string
        items: Array<{ title: string; description: string }>
      }
      stats: {
        years: string
        yearsLabel: string
        shipments: string
        shipmentsLabel: string
        clients: string
        clientsLabel: string
        rate: string
        rateLabel: string
      }
      cta: {
        title: string
        subtitle: string
        quoteButton: string
        trackButton: string
      }
    }
  }
  chatbot: {
    openChat: string
    closeChat: string
    placeholder: string
    welcomeMessage: string
    noMessages: string
    errorMessage: string
    typing: string
    send: string
    sendMessage: string
    voiceInput: string
    retry: string
    chooseQuestion: string
    speechNotSupported: string
    speechError: string
    quickActions: {
      track: string
      trackQuestion: string
      rates: string
      ratesQuestion: string
      delivery: string
      deliveryQuestion: string
      contact: string
      contactQuestion: string
    }
  }
  table: {
    of: string
    rowsSelected: string
  }
  tracking: {
    title: string
    publicTitle: string
    publicSubtitle: string
    seaTracking: string
    seaTrackingDesc: string
    landTracking: string
    landTrackingDesc: string
    liveUpdates: string
    liveUpdatesDesc: string
    demoNumbers: string
    demoNumbersDesc: string
    enterNumber: string
    trackButton: string
    notFound: string
    invalidNumber: string
    currentStatus: string
    estimatedDelivery: string
    lastUpdated: string
    progress: string
    shipmentInfo: string
    trackingNumber: string
    vesselName: string
    containerNumber: string
    consignee: string
    copyLink: string
    linkCopied: string
    stages: {
      PRE_ARRIVAL_DOCS: string
      VESSEL_ARRIVAL: string
      CUSTOMS_DECLARATION: string
      CUSTOMS_PAYMENT: string
      INSPECTION: string
      PORT_FEES: string
      QUALITY_STANDARDS: string
      RELEASE: string
      LOADING: string
      IN_TRANSIT: string
      DELIVERED: string
    }
    stageDescriptions: {
      PRE_ARRIVAL_DOCS: string
      VESSEL_ARRIVAL: string
      CUSTOMS_DECLARATION: string
      CUSTOMS_PAYMENT: string
      INSPECTION: string
      PORT_FEES: string
      QUALITY_STANDARDS: string
      RELEASE: string
      LOADING: string
      IN_TRANSIT: string
      DELIVERED: string
    }
    statuses: {
      PENDING: string
      IN_PROGRESS: string
      COMPLETED: string
      SKIPPED: string
    }
    actions: {
      advanceStage: string
      updateStage: string
      updateEta: string
      addNote: string
      markComplete: string
      skip: string
      initializeTracking: string
      generateNumber: string
    }
    eta: string
    completedAt: string
    startedAt: string
    notes: string
    noNotes: string
    addNotes: string
    stageOf: string
    // Payment tracking
    paymentRequested: string
    paymentReceived: string
    requestPayment: string
    paymentPending: string
  }
}
