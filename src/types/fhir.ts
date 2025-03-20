// FHIR相关类型定义

// FHIR资源基本接口
export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: FHIRMeta;
  [key: string]: any;
}

// FHIR Meta数据
export interface FHIRMeta {
  versionId?: string;
  lastUpdated?: string;
  source?: string;
  profile?: string[];
  security?: FHIRCoding[];
  tag?: FHIRCoding[];
}

// FHIR Coding类型
export interface FHIRCoding {
  system?: string;
  version?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

// FHIR CodeableConcept类型
export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

// FHIR Quantity类型
export interface FHIRQuantity {
  value?: number;
  comparator?: string;
  unit?: string;
  system?: string;
  code?: string;
}

// FHIR Reference类型
export interface FHIRReference {
  reference?: string;
  type?: string;
  identifier?: FHIRIdentifier;
  display?: string;
}

// FHIR Identifier类型
export interface FHIRIdentifier {
  use?: string;
  type?: FHIRCodeableConcept;
  system?: string;
  value?: string;
  period?: FHIRPeriod;
  assigner?: FHIRReference;
}

// FHIR Period类型
export interface FHIRPeriod {
  start?: string;
  end?: string;
}

// FHIR Bundle类型
export interface FHIRBundle extends FHIRResource {
  resourceType: 'Bundle';
  type: 'collection' | 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset';
  total?: number;
  link?: FHIRBundleLink[];
  entry?: FHIRBundleEntry[];
}

// FHIR Bundle链接
export interface FHIRBundleLink {
  relation: string;
  url: string;
}

// FHIR Bundle条目
export interface FHIRBundleEntry {
  fullUrl?: string;
  resource?: FHIRResource;
  search?: {
    mode?: string;
    score?: number;
  };
  request?: {
    method: string;
    url: string;
    ifNoneMatch?: string;
    ifModifiedSince?: string;
    ifMatch?: string;
    ifNoneExist?: string;
  };
  response?: {
    status: string;
    location?: string;
    etag?: string;
    lastModified?: string;
    outcome?: FHIRResource;
  };
}

// FHIR Patient资源
export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: FHIRIdentifier[];
  active?: boolean;
  name?: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: FHIRAddress[];
  maritalStatus?: FHIRCodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  photo?: FHIRAttachment[];
  contact?: FHIRPatientContact[];
  communication?: {
    language: FHIRCodeableConcept;
    preferred?: boolean;
  }[];
  generalPractitioner?: FHIRReference[];
  managingOrganization?: FHIRReference;
  link?: {
    other: FHIRReference;
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }[];
}

// FHIR HumanName类型
export interface FHIRHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: FHIRPeriod;
}

// FHIR ContactPoint类型
export interface FHIRContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: FHIRPeriod;
}

// FHIR Address类型
export interface FHIRAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: FHIRPeriod;
}

// FHIR Attachment类型
export interface FHIRAttachment {
  contentType?: string;
  language?: string;
  data?: string;
  url?: string;
  size?: number;
  hash?: string;
  title?: string;
  creation?: string;
}

// FHIR PatientContact类型
export interface FHIRPatientContact {
  relationship?: FHIRCodeableConcept[];
  name?: FHIRHumanName;
  telecom?: FHIRContactPoint[];
  address?: FHIRAddress;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  organization?: FHIRReference;
  period?: FHIRPeriod;
}

// 其他FHIR资源类型可以根据需要添加 