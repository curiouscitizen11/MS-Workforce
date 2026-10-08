export const SITE_URL = "https://www.msworkforce.au";
export const SITE_NAME = "MS Workforce";
export const EMAIL = "smoranc.marek@gmail.com";
export const EMAIL_HREF = "mailto:" + EMAIL;

const requestBody = [
  "Hi MS Workforce,",
  "",
  "Site address / suburb:",
  "Start date and time:",
  "Role(s) and number of workers:",
  "Expected duration (day, week, ongoing):",
  "Site contact name and phone:",
  "PPE and site requirements:",
  "Parking or access notes:",
  "",
  "Thanks,",
].join("\n");

export const REQUEST_LABOUR_HREF =
  EMAIL_HREF +
  "?subject=" +
  encodeURIComponent("Labour request") +
  "&body=" +
  encodeURIComponent(requestBody);

export const WORK_ENQUIRY_HREF =
  EMAIL_HREF + "?subject=" + encodeURIComponent("Looking for construction work");

export const GENERAL_ENQUIRY_HREF =
  EMAIL_HREF + "?subject=" + encodeURIComponent("Enquiry");
