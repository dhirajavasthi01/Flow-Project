import env from "./env";
export const BASE_URL_IDENTITY = env.VITE_BASEURL_IDENTITY;
export const BASE_URL_API = env.VITE_BASEURL_API;
export const BASE_URL_AFSDK = env.VITE_BASEURL_AFSDK;
export const ADFP_APPMONITORING = env.VITE_ADFP_APPMONITORING
export const SERVICE = {
  CONFIG_URL: `${BASE_URL_API}/Config`,
  AUTH_URL: `${BASE_URL_IDENTITY}/Auth`,
  ACCOUNT_URL: `${BASE_URL_IDENTITY}/Account`,
  CURRENT_URL: `${BASE_URL_API}/Current`,
  FAVORITE_URL: `${BASE_URL_API}/Favorites`,
  AFSDK_URL: `${BASE_URL_AFSDK}/amh-afsdk`,
  SECURITY_GROUP_URL: `${BASE_URL_IDENTITY}/SecurityGroup`,
  ADMIN_URL: `${BASE_URL_API}/Admin`,
  LOGGING_URL: `${BASE_URL_API}/Logging`,
  ASSET_URL: `${BASE_URL_API}/Asset`,
  BENCHMARK_URL: `${BASE_URL_API}/Benchmark`,
  PERFORMANCE_SUMMARY_URL: `${BASE_URL_API}/PerformanceSummary`,
  KPI_DETAILS_URL: `${BASE_URL_API}/KpiDetails`,
  ASSET_DISTRIBUTION_URL: `${BASE_URL_API}/AssetDistribution`,
  FLOW_URL:`${BASE_URL_API}/Network`,
  FAILURE_URL : `${BASE_URL_API}/Failure`,
  HISTORICAL_URL : `${BASE_URL_API}/Historical`,
  FEATURE_URL:`${BASE_URL_IDENTITY}/Feature`,
  ECM_URL: `${BASE_URL_API}/Ecm`,
  CONFIGURATION_URL : `${BASE_URL_API}/Ccp`,
};
export const APP_CONFIG = {
  VERSION_URLS: env.VITE_VERSION_URLS
    ? JSON.parse(env.VITE_VERSION_URLS?.replaceAll("'", '"'))
    : null,
  TOOLTIP_SUBSTR_LIMIT: 80,
  RECORDS_PER_PAGE: 20,
  VITE_APPLICATION_NAME: env.VITE_APPLICATION_NAME,
};
export const CURRENCY = {
  USD: "USD",
  SAR: "SAR",
};
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  CORPORATE: "corporate",
  AFFILIATE: "affiliate_user",
  PLANT: "plant_user",
};
export const WORKFLOW_ROLE = {
  PROCESS_MANAGER: "1",
  PROCESS_ENGINEER: "2",
  OPERATION_MANAGER: "3",
  OPERATION_ENGINEER: "4",
  MAILING_LIST_ESCALATION: "5",
  MAILING_LIST_BUSINESS_USERS: "6",
  WORKFLOW_MANAGER: "7",
};
export const ERRORTITLE = {
  CLIENT_ERROR: "UNAUTHORIZED",
  UNAUTHORIZED_ERROR: "UNAUTHORIZED",
  UNKNOWN_ERROR: "ERROR",
  APPLICATION_ERROR: "SOMETHING WENT WRONG",
  UNAUTHORIZED_CASE_ERROR: "UNAUTHORIZED FOR THIS CASE",
};
export const ERRORMSG = {
  APPLICATION_ERROR: "Invalid Application Data, Unable to process.",
  UNKNOWN_ERROR:
    "Please try again later.\nIf error persists, kindly contact system administrator",
  UNAUTHENTICATED_ERROR:
    "Resource not available for anonymous access.\n Client authentication failed, Kindly contact system administrator.",
  INVALID_RESOURCE: "The requested resource does not exists.",
  UNAUTHORIZED_ERROR:
    "You're not authorized to view the requested resource, kindly contact system administrator",
  ANONYMOUS_ACCESS_ERROR:
    "Resource not available for anonymous access. Client authentication required.",
  CASE_TIME_NULL_ERROR:
    "Unable to load system information, please try again later",
  TIMEOUT_ERROR: "Resuest timed out, please try again later.",
  SERVER_ERROR: "Server error, please try again later.",
  UNAUTHORIZED_CASE_ERROR_MSG: "You're not authorized to view the requested case, plant or affiliate, kindly contact system administrator",
};
export const TOKEN = {
  AUTH_TOKEN_VAR: "AMH_AUTH_TOKEN",
  AUTH_TOKEN_EXPIRY_CHECK_INTERVAL: parseInt(
    env.VITE_AUTH_TOKEN_EXPIRY_CHECK_INTERVAL
  ),
  AUTH_TOKEN_EXPIRY_BUFFER: parseInt(env.VITE_AUTH_TOKEN_EXPIRY_BUFFER),
  TOKEN_KEY_CCP: "ccp",
  TOKEN_KEY_ODS: "ods",
  TOKEN_KEY_READ: "read",
  TOKEN_KEY_FIRSTNAME: "family_name",
  TOKEN_KEY_LASTNAME: "given_name",
  TOKEN_KEY_ROLES: "roles",
};
export const noAffiliateSelectedCode = "-1";
export const ACTIVE_TAB = {
  DAILYVIEW: "Daily view",
  MONTHLYVIEW: "Monthly view",
  YEARLYVIEW: "Yearly view",
  PLANTVIEW: "Plant view",
  ENPI_GJ: "ENPI(GJ)",
  EnpiDollar: "ENPI($)",
  Energy: "ENERGY(GJ)",
  Efficiency: "EFFICIENCY(%)",
  CATEGORYVIEW: "Category view",
};
export const DEFAULT_MANUAL_ENTRY_URL =
  "https://ss-jsd-dtvi-d1/PIManualEntry/Home/BulkUpload";
export const DEFAULT_TIMEZONE = "Asia/Riyadh";
export const DATE_TIME_FORMAT = "DD-MMM-YY hh:mm A";
export const DATE_FORMAT = "DD-MMM-YYYY";
export const LegendData = [
  {
    colorClass: "bg-primary_blue",
    label: "target achieved",
  },
  {
    colorClass: "bg-primary_yellow",
    label: "target not achieved",
  },
  {
    colorClass: "bg-primary_gray_18",
    label: "target",
  },
];
export const LegendDataLayer = {
  global: [
    {
      colorClass: "bg-primary_gray",
      label: "TARGET PERFORMANCE",
    },
    {
      colorClass: "bg-primary_blue",
      label: "AVERAGE",
    },
    {
      colorClass: "bg-primary_black",
      label: "BEST AFFILIATE",
    },
  ],
  affiliate: [
    {
      colorClass: "bg-primary_gray_18",
      label: "TARGET PERFORMANCE",
    },
    {
      colorClass: "bg-primary_blue",
      label: "CURRENT AFFILIATE",
    },
    {
      colorClass: "bg-primary_black",
      label: "BEST AFFILIATE",
    },
  ],
  plant: [
    {
      colorClass: "bg-primary_gray_18",
      label: "TARGET PERFORMANCE",
    },
    {
      colorClass: "bg-primary_blue",
      label: "CURRENT PLANT",
    },
    {
      colorClass: "bg-primary_black",
      label: "BEST PLANT",
    },
  ],
};
export const SEARCHUSERCONSTANTS = {
  NOAFFILIATEWARNING: "Kindly select an affiliate first to proceed.",
  MINCHARWARNING: "Please Type Atleast 4 Characters.",
  USERACCESSWARNING: "Please select a user associated with the chosen affiliate.",
}
 