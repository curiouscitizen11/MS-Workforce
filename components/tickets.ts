export type TicketProvider = {
  name: string;
  rto: string;
  location: string;
  price: string;
  href: string;
  label?: string;
};

export type Ticket = {
  title: string;
  code: string;
  note?: string;
  providers: TicketProvider[];
  official?: { label: string; href: string }[];
};

// Prices as listed on each provider's course page, checked 9 October 2026.
export const PRICES_CHECKED = "October 2026";

export const tickets: Ticket[] = [
  {
    title: "White Card",
    code: "CPCWHS1001 Prepare to work safely in the construction industry",
    note: "You need this before you can start on any construction site in NSW.",
    providers: [
      {
        name: "National Courses",
        rto: "41072",
        location: "Dee Why",
        price: "$99",
        href: "https://nwcc.edu.au/white-card-nsw/northern-beaches/",
      },
      {
        name: "TCP Training",
        rto: "91118",
        location: "Dee Why",
        price: "$119 per person",
        href: "https://www.tcptraining.com/courses/white-card-course-dee-why",
      },
      {
        name: "TCP Training",
        rto: "91118",
        location: "Sydney CBD, Parramatta and other Sydney venues",
        price: "$119 per person",
        href: "https://www.tcptraining.com/courses/white-card-course-sydney",
      },
    ],
    official: [
      { label: "SafeWork NSW: White cards", href: "https://www.safework.nsw.gov.au/licences-and-registrations/white-cards" },
    ],
  },
  {
    title: "Work safely at heights",
    code: "RIIWHS204 Work safely at heights (formerly RIIWHS204E)",
    providers: [
      {
        name: "Trades School Australia",
        rto: "46565",
        location: "Artarmon",
        price: "$185",
        href: "https://tsa.nsw.edu.au/course/working-at-heights/",
      },
      {
        name: "Edway Training",
        rto: "91401",
        location: "Seven Hills",
        price: "$150",
        href: "https://www.edway.edu.au/courses/working-at-heights",
      },
    ],
  },
  {
    title: "Asbestos removal: Class B (non-friable)",
    code: "CPCCDE3028 Remove non-friable asbestos (formerly CPCCDE3014)",
    note: "For asbestos removal workers. The removal licence is held by the business you work for, not by you.",
    providers: [
      {
        name: "Pinnacle Safety and Training",
        rto: "40496",
        location: "Silverwater",
        price: "$395",
        href: "https://www.pinnaclesafety.com.au/courses/asbestos-safety/remove-non-friable-asbestos-training/greater-sydney",
      },
      {
        name: "DLI Training",
        rto: "21714",
        location: "Auburn",
        price: "$380 per person",
        href: "https://www.dlitraining.edu.au/remove-non-friable-asbestos-training-course/",
      },
    ],
    official: [
      { label: "SafeWork NSW: Class B asbestos removal licence", href: "https://www.safework.nsw.gov.au/licences-and-registrations/licences/class-b-asbestos-removal-licence" },
      { label: "SafeWork NSW: approved asbestos training providers", href: "https://www.safework.nsw.gov.au/hazards-a-z/asbestos/training2/safework-approved-rtos" },
    ],
  },
  {
    title: "Asbestos removal: Class A (friable)",
    code: "CPCCDE3029 Remove friable asbestos (formerly CPCCDE3015). Supervisors: CPCCDE4009 Supervise asbestos removal",
    note: "For asbestos removal workers. You need the non-friable unit first. The Class A licence is held by the business, not the worker.",
    providers: [
      {
        name: "DLI Training",
        rto: "21714",
        location: "Auburn",
        price: "$580 per person",
        href: "https://www.dlitraining.edu.au/remove-friable-asbestos/",
      },
      {
        name: "Pinnacle Safety and Training",
        rto: "40496",
        location: "Silverwater",
        price: "Price on enquiry",
        href: "https://www.pinnaclesafety.com.au/courses/asbestos-safety/remove-non-friable-and-friable-asbestos-class-a-and-b/greater-sydney",
        label: "Class A and B combined course",
      },
      {
        name: "DLI Training",
        rto: "21714",
        location: "Auburn",
        price: "$330 per person",
        href: "https://www.dlitraining.edu.au/supervise-asbestos-removal-training/",
        label: "Supervise asbestos removal",
      },
    ],
    official: [
      { label: "SafeWork NSW: Class A asbestos removal licence", href: "https://www.safework.nsw.gov.au/licences-and-registrations/licences/class-a-asbestos-removal-licence" },
    ],
  },
  {
    title: "Enter and work in confined spaces",
    code: "RIIWHS202 Enter and work in confined spaces (formerly RIIWHS202E)",
    providers: [
      {
        name: "Edway Training",
        rto: "91401",
        location: "Seven Hills",
        price: "$180",
        href: "https://www.edway.edu.au/courses/confined-spaces",
      },
      {
        name: "DLI Training",
        rto: "21714",
        location: "Auburn",
        price: "$250 per person",
        href: "https://www.dlitraining.edu.au/confined-space-training-sydney/",
      },
    ],
  },
  {
    title: "First aid and CPR",
    code: "HLTAID011 Provide First Aid (includes HLTAID009 CPR)",
    providers: [
      {
        name: "Northern Beaches Community College",
        rto: "90113",
        location: "Brookvale",
        price: "$160",
        href: "https://nbmc.nsw.edu.au/course/provide_first_aid/",
      },
      {
        name: "Australian Red Cross",
        rto: "3605",
        location: "Brookvale",
        price: "$205",
        href: "https://firstaid.redcross.org.au/Brookvale-course-details?course_id=108303&course_type=w",
        label: "Provide First Aid (one day)",
      },
      {
        name: "Australian Red Cross",
        rto: "3605",
        location: "Brookvale",
        price: "$90",
        href: "https://firstaid.redcross.org.au/Brookvale-course-details?course_id=94813&course_type=w",
        label: "CPR only (HLTAID009)",
      },
    ],
  },
];

export const extras: Ticket[] = [
  {
    title: "Traffic control",
    code: "RIISS00054 Traffic Controller and RIISS00055 Traffic Management Implementer",
    providers: [
      {
        name: "DLI Training",
        rto: "21714",
        location: "Auburn",
        price: "$450 per person",
        href: "https://www.dlitraining.edu.au/traffic-control-combo/",
        label: "Traffic control combo course",
      },
    ],
    official: [
      { label: "SafeWork NSW: Traffic control work training cards", href: "https://www.safework.nsw.gov.au/licences-and-registrations/licences/traffic-control-work-training-card" },
    ],
  },
  {
    title: "Forklift licence",
    code: "TLILIC0003 Licence to operate a forklift truck",
    providers: [
      {
        name: "DLI Training",
        rto: "21714",
        location: "Auburn",
        price: "$400 per person",
        href: "https://www.dlitraining.edu.au/forklift-licence-training-course/",
      },
    ],
    official: [
      { label: "SafeWork NSW: High risk work licences", href: "https://www.safework.nsw.gov.au/licences-and-registrations/licences/high-risk-work-licences" },
    ],
  },
];
