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
    openMenu?: string
    viewAll?: string
    navigation?: string
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
    pendingDeclarations?: string
    unpaidInvoices: string
    recentShipments: string
    quickActions: string
    newShipment: string
    newDeclaration: string
    newInvoice: string
    trendingUp: string
    trendingDown: string
    completionRate?: string
    clients?: string
    shipment?: string
    charts?: {
      cashFlow?: {
        title?: string
        description?: string
        cashInflow?: string
        cashOutflow?: string
        netCashFlow?: string
        currentBalance?: string
      }
      revenue?: {
        title?: string
        description?: string
        areaChart?: string
        barChart?: string
        lineChart?: string
        revenue?: string
        expenses?: string
        profit?: string
        avgMonthlyRevenue?: string
        avgMonthlyExpenses?: string
        avgMonthlyProfit?: string
      }
      expense?: {
        title?: string
        description?: string
        pieChart?: string
        barChart?: string
        totalExpenses?: string
        topCategories?: string
        other?: string
        amount?: string
        percentage?: string
      }
    }
    transactions?: {
      title?: string
      noTransactions?: string
      viewAll?: string
      income?: string
      expenses?: string
      pending?: string
      statuses?: {
        completed?: string
        pending?: string
        failed?: string
      }
    }
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
    invoiceType?: string
    supplier?: string
    supplierName?: string
    documentReferencesTitle?: string
    documentReferencesDescription?: string
    basicInfo?: string
    quickAddFees?: string
    quickAddFeesDescription?: string
    invoiceItemsDescription?: string
    feeType?: string
    vat?: string
    editInvoiceModalDesc?: string
    newInvoiceModalDesc?: string
    noSettings?: string
    companyNameEn?: string
    companyNameAr?: string
    website?: string
    address?: string
    city?: string
    country?: string
    bank?: string
    branch?: string
    accountName?: string
    accountNumber?: string
    noBankDetails?: string
    days?: string
    failedToSendEmail?: string
    invalidEmailAddress?: string
    due?: string
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
    documentReferences?: {
      blNumber?: string
      containerNo?: string
      deliveryOrderNo?: string
      declarationNo?: string
      vesselName?: string
      voyageNumber?: string
      commodityType?: string
      supplier?: string
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
    subtitle?: string
    organization?: string
    security?: string
    team?: string
    integrations?: string
    notifications?: string
    tabs?: {
      profile: string
      organization: string
      security: string
      team: string
      integrations: string
      notifications: string
    }
    profileTab?: {
      title: string
      description: string
      nameLabel: string
      namePlaceholder: string
      emailLabel: string
      emailHelp: string
      phoneLabel: string
      phonePlaceholder: string
      imageLabel: string
      imagePlaceholder: string
      save: string
      saving: string
      saved: string
      errorInvalid: string
      errorSave: string
    }
    organizationTab?: {
      title: string
      description: string
      companyInfo: string
      companyNameLabel: string
      companyNameArLabel: string
      taxIdLabel: string
      emailLabel: string
      phoneLabel: string
      websiteLabel: string
      address: string
      address1Label: string
      address2Label: string
      cityLabel: string
      stateLabel: string
      countryLabel: string
      postalCodeLabel: string
      banking: string
      bankNameLabel: string
      bankBranchLabel: string
      accountNameLabel: string
      accountNumberLabel: string
      ibanLabel: string
      swiftCodeLabel: string
      invoiceDefaults: string
      invoicePrefixLabel: string
      defaultCurrencyLabel: string
      defaultTaxRateLabel: string
      defaultPaymentTermsLabel: string
      save: string
      saving: string
      saved: string
      errorSave: string
    }
    securityTab?: {
      title: string
      description: string
      twoFactorTitle: string
      twoFactorStatusEnabled: string
      twoFactorStatusDisabled: string
      passwordTitle: string
      passwordDescription: string
      sessionsTitle: string
      sessionsDescription: string
      comingSoon: string
    }
    teamTab?: {
      title: string
      description: string
      empty: string
    }
    integrationsTab?: {
      title: string
      description: string
      whatsapp: string
      whatsappDescription: string
      resend: string
      resendDescription: string
      oauth: string
      oauthDescription: string
      statusConfigured: string
      statusNotConfigured: string
    }
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
    revenueExpenses?: string
    lastMonths?: string
    avgRevenue?: string
    avgExpenses?: string
    avgProfit?: string
    cashFlow?: string
    currentPeriod?: string
    balance?: string
    netFlow?: string
    expenseBreakdown?: string
    byCategory?: string
    recentTransactions?: string
    latestActivities?: string
    viewAll?: string
    totalIncome?: string
    pending?: string
    noTransactions?: string
    viewDetails?: string
    retryExtraction?: string
    totalBalance?: string
    allAccounts?: string
    paid?: string
    pendingPayroll?: string
    needApproval?: string
    activeEmployees?: string
    employees?: string
    viewAccounts?: string
    viewPayroll?: string
    viewExpenses?: string
    customsFees?: string
    viewFees?: string
    addBankAccount?: string
    manageAccounts?: string
    processPayroll?: string
    monthlyPayroll?: string
    addExpense?: string
    trackExpenses?: string
    generateReport?: string
    financialReports?: string
    statuses?: {
      COMPLETED?: string
      PENDING?: string
      FAILED?: string
      PROCESSING?: string
      PROCESSED?: string
      ERROR?: string
    }
    columns?: {
      fileName?: string
      merchant?: string
      date?: string
      amount?: string
      status?: string
      uploaded?: string
    }
    dashboard?: string
    banking?: string
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
      dashboard?: string
      myBanks?: string
      paymentTransfer?: string
      transactionHistory?: string
    }
    receipt?: {
      fileName?: string
      merchant?: string
      date?: string
      amount?: string
      status?: string
      uploaded?: string
      viewDetails?: string
      retryExtraction?: string
      statuses?: {
        pending?: string
        processing?: string
        processed?: string
        error?: string
      }
      header?: {
        title?: string
        description?: string
        uploadReceipt?: string
        uploadNewReceipt?: string
        uploadDescription?: string
      }
      stats?: {
        total?: string
        processed?: string
        processing?: string
        errors?: string
      }
      view?: {
        grid?: string
        table?: string
      }
      empty?: {
        noReceipts?: string
        uploadFirst?: string
        noReceiptsFound?: string
      }
      detail?: {
        uploadedAt?: string
        receiptImage?: string
        pdfDocument?: string
        viewPdf?: string
        extractedData?: string
        merchant?: string
        contact?: string
        date?: string
        amount?: string
        summary?: string
        aiInProgress?: string
        extractionFailed?: string
        waitingExtraction?: string
        lineItems?: string
        qty?: string
        retry?: string
        backToList?: string
        delete?: string
        deleteConfirm?: string
        deleteSuccess?: string
        deleteFailed?: string
        retrySuccess?: string
        retryFailed?: string
        unexpectedError?: string
      }
      upload?: {
        receiptFile?: string
        selectedFile?: string
        invalidType?: string
        sizeExceeded?: string
        fileSelected?: string
        selectFirst?: string
        processedSuccess?: string
        processingFailed?: string
        unexpectedError?: string
        processingReceipt?: string
        processReceipt?: string
      }
      table?: {
        filterByMerchant?: string
        previous?: string
        next?: string
      }
    }
    alerts?: {
      overdueInvoices?: string
      lowCashReserve?: string
      pendingPayroll?: string
      pendingExpenses?: string
      overdueInvoicesTitle?: string
      overdueInvoicesBody?: string
      pendingExpensesTitle?: string
      pendingExpensesBody?: string
      viewInvoicesAction?: string
      reviewAction?: string
    }
    titles?: {
      accounts?: string
      banking?: string
      budget?: string
      expenses?: string
      fees?: string
      payroll?: string
      receipt?: string
      reports?: string
      salary?: string
      timesheet?: string
      wallet?: string
    }
    bankingSection?: {
      title?: string
      nav?: {
        dashboard?: string
        myBanks?: string
        paymentTransfer?: string
        transactionHistory?: string
      }
    }
    accounts?: {
      title?: string
      nav?: {
        overview?: string
        chart?: string
        journal?: string
        ledger?: string
        reconciliation?: string
        settings?: string
      }
    }
    fees?: {
      title?: string
      nav?: {
        overview?: string
        structure?: string
        collection?: string
        pending?: string
        discounts?: string
        reports?: string
      }
    }
    receiptNav?: {
      title?: string
      nav?: {
        overview?: string
        generate?: string
        history?: string
        templates?: string
        managePlan?: string
      }
    }
    salary?: {
      title?: string
      nav?: {
        overview?: string
        structure?: string
        slips?: string
        increments?: string
        advances?: string
        reports?: string
      }
    }
    timesheet?: {
      title?: string
      nav?: {
        overview?: string
        entry?: string
        approval?: string
        calendar?: string
        reports?: string
        settings?: string
      }
    }
    wallet?: {
      title?: string
      nav?: {
        overview?: string
        balance?: string
        transactions?: string
        topUp?: string
        withdraw?: string
        reports?: string
      }
    }
    expenses?: {
      title?: string
      nav?: {
        overview?: string
        submit?: string
        pending?: string
        approved?: string
        reports?: string
        categories?: string
      }
    }
    payroll?: {
      title?: string
      nav?: {
        overview?: string
        processing?: string
        history?: string
        deductions?: string
        benefits?: string
        reports?: string
      }
    }
    budget?: {
      title?: string
      nav?: {
        overview?: string
        planning?: string
        tracking?: string
        variance?: string
        forecasting?: string
        approval?: string
      }
    }
    reports?: {
      title?: string
      nav?: {
        overview?: string
        financial?: string
        cashflow?: string
        profitloss?: string
        balanceSheet?: string
        custom?: string
        schedule?: string
      }
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
    tabs?: {
      overview?: string
      docs?: string
      invoices?: string
      acd?: string
      containers?: string
      payments?: string
      duty?: string
      quote?: string
      itp?: string
      mos?: string
    }
    notFound?: string
    failedToLoad?: string
    loadError?: string
    shipmentFallback?: string
    acd?: {
      title?: string
      description?: string
      acnNumber?: string
      validationDeadline?: string
      status?: string
      pending?: string
      requiredDocuments?: string
      draftBillOfLading?: string
      commercialInvoice?: string
      freightInvoice?: string
      notUploaded?: string
      complianceTitle?: string
      complianceBody?: string
      complianceNote?: string
    }
    containers?: {
      title?: string
      description?: string
      totalContainers?: string
      freeTime?: string
      warning?: string
      demurrage?: string
      containerList?: string
      noContainers?: string
      noContainersHint?: string
      containerNumbers?: string
      demurragePrevention?: string
      demurragePreventionTitle?: string
      demurragePreventionNote?: string
      demurragePreventionBody?: string
      projectNotFound?: string
      noShipmentLinked?: string
      noShipmentHint?: string
      columns?: {
        containerNo?: string
        size?: string
        status?: string
        daysRemaining?: string
        dailyRate?: string
        arrivalDate?: string
        accrued?: string
        accruedDemurrage?: string
      }
      statuses?: {
        pending?: string
        free?: string
        warning?: string
        demurrage?: string
        released?: string
        returned?: string
      }
      units?: {
        day?: string
        daysOverdue?: string
        daysOverdueAr?: string
        daysRemaining?: string
      }
    }
    payments?: {
      title?: string
      description?: string
      totalAmount?: string
      paid?: string
      partial?: string
      pending?: string
      unpaid?: string
      paymentCount?: string
      breakdownByPayee?: string
      noPayeeBreakdown?: string
      paymentsList?: string
      noPayments?: string
      noPaymentsHint?: string
      total?: string
      payment?: string
      payments?: string
      payees?: {
        CUSTOMS?: string
        SEA_PORTS?: string
        SHIPPING_LINE?: string
        SSMO?: string
        MINISTRY_OF_TRADE?: string
        TRANSPORT?: string
        CLEARING_AGENT?: string
        OTHER?: string
      }
      statuses?: {
        PENDING?: string
        PARTIAL?: string
        PAID?: string
        CONFIRMED?: string
        CANCELLED?: string
      }
    }
    duty?: {
      title?: string
      description?: string
      hsCode?: string
      hsCodePlaceholder?: string
      cifValue?: string
      cifPlaceholder?: string
      customsDuty?: string
      dutyRate?: string
      vat?: string
      vatRate?: string
      excise?: string
      developmentFee?: string
      totalDuty?: string
      totalDue?: string
      calculate?: string
      calculationResult?: string
      inputValues?: string
      result?: string
      formula?: string
      formulaTitle?: string
      formulaText?: string
    }
    docs?: {
      title?: string
      description?: string
      checklist?: string
      validationTitle?: string
      validationNote?: string
      totalRequired?: string
      uploaded?: string
      pending?: string
      expired?: string
      documentChecklist?: string
      required?: string
      notUploaded?: string
      documentValidation?: string
      documentValidationBody?: string
      manageDescription?: string
      noShipmentLinked?: string
      noShipmentHint?: string
      ready?: string
      missing?: string
      readyForDeclaration?: string
      readyForDeclarationBody?: string
      notReady?: string
      notReadyBody?: string
      docNumber?: string
      yes?: string
      docTypes?: {
        BILL_OF_LADING?: string
        COMMERCIAL_INVOICE?: string
        PACKING_LIST?: string
        CERTIFICATE_OF_ORIGIN?: string
        INSURANCE_CERTIFICATE?: string
        IM_FORM?: string
        ACD_CERTIFICATE?: string
        SSMO_RELEASE?: string
        PROFORMA_INVOICE?: string
        DELIVERY_ORDER?: string
        CUSTOMS_DECLARATION?: string
        CUSTOMS_RECEIPT?: string
        PORT_RECEIPT?: string
        WORKING_ORDER?: string
        OTHER?: string
      }
      docStatuses?: {
        MISSING?: string
        UPLOADED?: string
        VERIFIED?: string
        REJECTED?: string
        EXPIRED?: string
      }
      docs?: {
        billOfLading?: string
        commercialInvoice?: string
        packingList?: string
        certificateOfOrigin?: string
        imForm?: string
        ssmoCertificate?: string
        insuranceCertificate?: string
        phytosanitaryCertificate?: string
      }
      requiredList?: {
        billOfLading?: string
        commercialInvoice?: string
        packingList?: string
        certificateOfOrigin?: string
        insuranceCertificate?: string
        importPermit?: string
        customsDeclaration?: string
        deliveryOrder?: string
      }
    }
    info?: {
      sectionTitle?: string
      emptyPlaceholder?: string
      portOfOrigin?: { label?: string }
      portOfDestination?: { label?: string }
      teamLead?: { label?: string }
      consignee?: { label?: string }
      consignor?: { label?: string }
      vessel?: { label?: string }
      blAwbNumber?: { label?: string }
      customer?: { label?: string }
      description?: { label?: string }
      startDate?: { label?: string }
      endDate?: { label?: string }
    }
    invoicesSection?: {
      title?: string
      description?: string
      expenseRecords?: string
      noExpenseRecords?: string
      customsDuty?: string
      vat?: string
      portCharges?: string
      total?: string
      filters?: {
        all?: string
        draft?: string
        sent?: string
        paid?: string
        overdue?: string
        cancelled?: string
      }
      columns?: {
        invoiceNumber?: string
        status?: string
        amount?: string
        createdAt?: string
      }
    }
    report?: {
      title?: string
      description?: string
      exportPdf?: string
      kpis?: {
        dutyPaid?: string
        demurrageDays?: string
        stagesCompleted?: string
        daysInPort?: string
        totalInvoiced?: string
        stageCountSuffix?: string
      }
      noShipment?: string
      generatedOn?: string
    }
    acdForm?: {
      title?: string
      description?: string
      noShipment?: string
      statusBadge?: string
      statusPending?: string
      acnNumber?: string
      consignee?: string
      consignor?: string
      hsCode?: string
      cargoDescription?: string
      estimatedWeight?: string
      quantity?: string
      vesselName?: string
      voyageNumber?: string
      portOfLoading?: string
      portOfDischarge?: string
      estimatedArrival?: string
      create?: string
      update?: string
      saving?: string
      lockedNotice?: string
      errorGeneric?: string
    }
    itp?: {
      title?: string
      documentChecklist?: string
    }
    mos?: {
      title?: string
      description?: string
      clearanceProcedures?: string
      sopDescription?: string
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
    general?: string
    date?: string
    pickDate?: string
    loadingProjects?: string
    selectProject?: string
    searchProjects?: string
    noProjectFound?: string
    assignTeamMembers?: string
    searchTeamMembers?: string
    noMemberFound?: string
    creatingTask?: string
    updatingTask?: string
    createTask?: string
    updateTask?: string
    enterTaskName?: string
    enterTaskDescription?: string
    taskDescription?: string
    selectStatus?: string
    selectPriority?: string
    taskCreatedSuccess?: string
    taskUpdatedSuccess?: string
    taskDeletedSuccess?: string
    deleteTask?: string
    deleteConfirmation?: string
    deleting?: string
    estimatedTime?: string
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
    notFound?: string
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
    servicePage?: {
      sections: {
        overview: string
        features: string
        process: string
        advantages: string
        whyChoose: string
        onThisPage: string
        otherServices: string
        readyTitle: string
        readyBody: string
        getQuote: string
        learnMore: string
      }
      catalog: Record<string, {
        title: { firstLine: string; secondLine: string }
        description: { firstLine: string; secondLine: string }
        detailedDescription: string
        features: string[]
        advantages: string[]
        advantagesDescriptions: string[]
        process: Array<{ title: string; body: string }>
      }>
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
    listening?: string
    ttsEnabled?: string
    ttsDisabled?: string
    // Marketing quick-asks (customs clearance)
    marketingDocuments?: string
    marketingDocumentsQuestion?: string
    marketingAcd?: string
    marketingAcdQuestion?: string
    marketingTimeline?: string
    marketingTimelineQuestion?: string
    marketingQuote?: string
    marketingQuoteQuestion?: string
    marketingSsmo?: string
    marketingSsmoQuestion?: string
    marketingFees?: string
    marketingFeesQuestion?: string
    // Tracking quick-asks
    trackingCurrentStage?: string
    trackingCurrentStageQuestion?: string
    trackingNext?: string
    trackingNextQuestion?: string
    trackingDocs?: string
    trackingDocsQuestion?: string
    trackingEta?: string
    trackingEtaQuestion?: string
    // Platform quick-asks
    platformAcd?: string
    platformAcdQuestion?: string
    platformDuty?: string
    platformDutyQuestion?: string
    platformInvoices?: string
    platformInvoicesQuestion?: string
    platformCompliance?: string
    platformComplianceQuestion?: string
    // Legacy (kept for compatibility)
    quickActions?: {
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
    rowsPerPage?: string
    page?: string
    noResults?: string
    asc?: string
    desc?: string
    reset?: string
    hide?: string
    toggleColumns?: string
    view?: string
    searchColumns?: string
    noColumnsFound?: string
    clearFilters?: string
    selected?: string
    noResultsFound?: string
    loadMore?: string
    loading?: string
    search?: string
    all?: string
    openMenu?: string
    goToFirstPage?: string
    goToPreviousPage?: string
    goToNextPage?: string
    goToLastPage?: string
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
    initializeSuccess?: string
    initializeFailed?: string
    advanceFailed?: string
  }
  marketplace?: {
    title?: string
    description?: string
    placeOrder?: string
    learnMore?: string
    vendor?: string
    priceFrom?: string
    priceTo?: string
    currency?: string
    orderPlaced?: string
    contactVia?: string
    whatsapp?: string
    email?: string
    phone?: string
    inStock?: string
    outOfStock?: string
    serviceArea?: string
    viewDetails?: string
    backToMarketplace?: string
    categories?: {
      [key: string]: string | undefined
      ALL?: string
      TRUCK?: string
      FORKLIFT?: string
      MANPOWER?: string
      TOOLS?: string
    }
    request?: {
      title?: string
      name?: string
      phone?: string
      email?: string
      message?: string
      quantity?: string
      preferredDate?: string
      submit?: string
      success?: string
      contactInfo?: string
    }
    vendorProfile?: {
      register?: string
      businessName?: string
      businessNameAr?: string
      contactName?: string
      description?: string
      pending?: string
      approved?: string
      rejected?: string
      suspended?: string
      myListings?: string
      myRequests?: string
      addService?: string
    }
    statuses?: {
      PENDING?: string
      CONTACTED?: string
      IN_PROGRESS?: string
      COMPLETED?: string
      CANCELLED?: string
    }
    serviceNotFound?: {
      title?: string
      description?: string
      back?: string
    }
  }
  reportIssue?: {
    link?: string
    title?: string
    categoryPlaceholder?: string
    categoryVisual?: string
    categoryBroken?: string
    categoryData?: string
    categorySlow?: string
    categoryConfusing?: string
    categoryOther?: string
    placeholder?: string
    submit?: string
    submitting?: string
    success?: string
    error?: string
  }
  errorPage: {
    title: string
    description: string
    retry: string
    goHome: string
    goDashboard: string
    globalTitle: string
    globalDescription: string
    refresh: string
  }
  notFound: {
    title: string
    description: string
    goHome: string
    goDashboard: string
    searchPlaceholder: string
  }
}
