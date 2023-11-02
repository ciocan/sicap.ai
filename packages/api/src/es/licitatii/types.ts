export interface RootObject {
  _source: Source;
}

export interface NoticeContractItem {
  caNoticeContractId: number;
  contractId: number | null;
  caNoticeId: number;
  noticeNo: string;
  contractNo: string;
  contractDate: string;
  contractTitle: string;
  winnerCaption: string;
  winner: {
    id: number;
    caNoticeId: number;
    name: string;
    fiscalNumber: string;
    noticeEntityAddressId: number;
    entityId: number;
    isSME: boolean | null;
    address: {
      noticeId: number;
      officialName: string;
      address: string;
      city: string;
      cityItem: unknown;
      postalCode: string;
      postalCodeItem: unknown;
      countryID: number;
      country: string;
      countryItem: {
        id: number;
        text: string;
        localeKey: string;
      };
      county: unknown;
      email: string;
      phone: string;
      fax: string;
      contactPoints: string | null;
      attentionTo: unknown;
      caMainAddressUrl: string;
      buyerProfileUrl: string | null;
      nutsCodeID: unknown;
      nutsCode: unknown;
      contactPerson: string | null;
      internetAddressesUrl: string[];
      electronicInfoAccessUrl: unknown;
      electronicDocumentsSendingUrl: unknown;
      isSME: boolean;
      sysNoticeEntityTypeID: number;
      noticeEntityAddressId: number;
      entityId: number;
      entityItem: unknown;
      isPublishingAgreed: unknown;
      nationalIDNumber: string;
    };
    source: number;
  };
  winners: Winner[];
  lotsCaption: string;
  lotsNoCaption: string;
  contractValue: number;
}

export interface Winner {
  id: number;
  caNoticeId: number;
  name: string;
  fiscalNumber: string;
  noticeEntityAddressId: number;
  entityId: number;
  isSME: boolean | null;
  address: {
    noticeId: number;
    officialName: string;
    address: string;
    city: string;
    cityItem: unknown;
    postalCode: string;
    postalCodeItem: unknown;
    countryID: number;
    country: string;
    countryItem: {
      id: number;
      text: string;
      localeKey: string;
    };
    county: unknown;
    email: string;
    phone: string;
    fax: string;
    contactPoints: string | null;
    attentionTo: unknown;
    caMainAddressUrl: string;
    buyerProfileUrl: string | null;
    nutsCodeID: unknown;
    nutsCode: unknown;
    contactPerson: string | null;
    internetAddressesUrl: string[];
    electronicInfoAccessUrl: unknown;
    electronicDocumentsSendingUrl: unknown;
    isSME: boolean;
    sysNoticeEntityTypeID: number;
    noticeEntityAddressId: number;
    entityId: number;
    entityItem: unknown;
    isPublishingAgreed: unknown;
    nationalIDNumber: string;
  };
  source: number;
}

export interface Source {
  item: {
    caNoticeId: number;
    noticeId: number;
    procedureId: number;
    noticeNo: string;
    sysNoticeTypeId: number;
    sysNoticeState: {
      id: number;
      text: string;
      localeKey: string | null;
    };
    sysProcedureState: {
      id: number;
      text: string;
      localeKey: string | null;
    };
    contractingAuthorityNameAndFN: string;
    contractTitle: string;
    sysAcquisitionContractType: {
      id: number;
      text: string;
      localeKey: string | null;
    };
    sysProcedureType: {
      id: number;
      text: string;
      localeKey: string | null;
    };
    sysContractAssigmentType: unknown;
    cpvCodeAndName: string;
    ronContractValue: number | null;
    isOnline: boolean;
    noticeStateDate: string;
    minTenderReceiptDeadline: unknown;
    maxTenderReceiptDeadline: unknown;
    errataNo: number;
    versionNo: number | null;
    sysNoticeVersionId: number;
    tenderReceiptDeadlineExport: unknown;
    estimatedValueExport: string;
    highestOfferValue: number | null;
    lowestOfferValue: number | null;
    hasSubsequentContracts: boolean;
    isUtility: boolean;
    isPPP: boolean;
    currencyCode: string;
  };
  publicNotice: {
    isUtilityContract: boolean;
    caNoticeEdit_New: {
      publicationDetailsModel: {
        caPublicationDate: string;
        publicationDate: string;
        jouePublicationNumber: string;
        noticeNo: string;
      };
      section1_New: {
        section1_1: {
          caAddress: {
            noticeId: number;
            officialName: string;
            address: string;
            city: string;
            cityItem: unknown;
            postalCode: string;
            postalCodeItem: unknown;
            countryID: number;
            country: string;
            countryItem: {
              id: number;
              text: string;
              localeKey: string;
            };
            county: unknown;
            email: string;
            phone: string;
            fax: string;
            contactPoints: string;
            attentionTo: unknown;
            caMainAddressUrl: string;
            buyerProfileUrl: string;
            nutsCodeID: unknown;
            nutsCode: unknown;
            nutsCodeItem: {
              id: number;
              text: string | null;
              localeKey: string | null;
            };
            contactPerson: string;
            internetAddressesUrl: string[];
            electronicInfoAccessUrl: unknown;
            electronicDocumentsSendingUrl: unknown;
            isSME: boolean;
            sysNoticeEntityTypeID: number;
            noticeEntityAddressId: number;
            entityId: number;
            entityItem: unknown;
            isPublishingAgreed: unknown;
            nationalIDNumber: string;
          };
          canEdit: boolean;
          caNoticeId: number;
          sectionName: unknown;
          sectionCode: unknown;
          noticePreviousPublication: unknown;
        };
        ifOthersThenSpecify: unknown;
        caNoticeId: number;
        sectionName: unknown;
        sectionCode: unknown;
        noticePreviousPublication: unknown;
      };
      section2_New: {
        section2_1_New: {
          contractTitle: string;
          referenceNumber: unknown;
          mainCPVCode: {
            id: number;
            text: string;
            localeKey: string;
          };
          sysAcquisitionContractType: {
            id: number;
            text: string;
            localeKey: string;
          };
          shortDescription: string;
          hasLots: boolean;
          numberOfLots: number | null;
          shouldShowSection217: boolean;
          totalAcquisitionValue: number;
          totalRONAcquisitionValueForPAAP: number;
          lowestOffer: number;
          highestOffer: number;
          canEdit: boolean;
          caNoticeId: number;
          sectionName: unknown;
          sectionCode: unknown;
          noticePreviousPublication: unknown;
        };
        section2_2_New: {
          showPublishingAgreedSection: boolean;
          previousPublication: boolean;
          descriptionList: {
            noticeLotID: number;
            contractTitle: string;
            lotNumber: string;
            mainCPVCodes: {
              id: number;
              text: string;
              localeKey: string | null;
            };
            secondaryCPVCodes: unknown[];
            mainLocation: string;
            shortDescription: string;
            hasOptions: boolean;
            optionsDescription: unknown;
            isEUFunded: boolean;
            euProject: unknown;
            supplementaryInformation: unknown;
            monthDuration: unknown;
            dayDuration: unknown;
            startDate: unknown;
            completionDate: unknown;
            showSysAwardCriteriaType: boolean;
            sysAwardCriteriaTypeId: number;
            sysAwardCriteriaType: {
              id: number;
              text: string;
              localeKey: string | null;
            };
            sysEuropeanFundId: unknown;
            sysEuropeanFund: {
              id: number;
              text: string;
              localeKey: string | null;
            };
            sysFinancingTypeId: unknown;
            sysFinancingType: {
              id: number;
              text: string;
              localeKey: string | null;
            };
            communityProgramReference: unknown;
            estimatedValue: number;
            minEstimatedValue: unknown;
            maxEstimatedValue: unknown;
            lotInfo: string;
          }[];
          canEdit: boolean;
          caNoticeId: number;
          sectionName: unknown;
          sectionCode: unknown;
          noticePreviousPublication: unknown;
        };
      };
    };
    caNoticeEdit_New_U: unknown;
    cNoticeId: number;
    isView: boolean;
    errorList: unknown[];
    hasErrors: boolean;
    title: string;
    caNoticeID: number;
    isPPP: boolean;
    noticeID: number;
    previousPublicationNoticeID: number;
    previousPublicationNoticeNumber: unknown;
    sysContractAssignmentTypeID: number;
    sysNoticeState: {
      id: number;
      text: string;
      localeKey: string;
    };
    sysNoticeType: {
      id: number;
      text: string;
      localeKey: string;
    };
    prevPubSysNoticeType: {
      id: number;
      text: string;
      localeKey: string;
    };
    contractingAuthorityType: {
      id: number;
      text: string;
      localeKey: string;
    };
    procedureId: number;
    isOnlineProcedure: boolean;
    isLeProcedure: boolean;
    paapSpentValue: number;
    entityId: number;
    procedureType: {
      id: number;
      text: string;
      localeKey: unknown;
    };
    parentCaNoticeId: unknown;
    parentSysNoticeVersionId: unknown;
    isCorrecting: boolean;
    isCompleting: boolean;
    isModifNotice: boolean;
    versionNumber: number | null;
    totalNotAwardedLots: number;
    ackDocs: unknown[];
    noticeNumber: string;
    createDate: string;
    isCA: boolean;
    acAssignedUser: unknown;
    procedureHasLots: boolean;
    publicationDate: string;
    sentToJOUE: boolean;
    tedNoticeNo: unknown;
    ackDocsCount: number;
    initState: unknown;
  };
  noticeContracts: {
    total: number;
    items: NoticeContractItem[];
  };
  istoric: boolean;
}
