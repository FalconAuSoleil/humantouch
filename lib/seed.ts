import type { Application, Candidate, Job, Passport, Posting } from "./types";
import { passportQuality, postingQuality } from "./quality";

// Synthetic data only (challenge requirement): fictional people and companies around Espoo,
// in everyday jobs anyone can picture: care, cafés, shops, logistics, customer service.

type E = Passport["experiences"][number];
const exp = (e: Partial<E> & Pick<E, "title" | "organization" | "context" | "achievements" | "results">): E => ({
  sector: null, start: null, end: null, kind: "job", tools: [], source: "both", ...e,
});

function candidate(id: string, firstName: string, p: Passport): Candidate {
  return {
    id, firstName, createdAt: "2026-11-10T09:00:00.000Z", status: "passport", sources: [],
    interview: { turns: [], facts: [], covered: [], done: true },
    passport: p, quality: passportQuality(p, null), visible: true, seed: true,
  };
}

export function seedCandidates(): Candidate[] {
  return [
    candidate("elena01", "Elena", {
      headline: "Café Shift Supervisor",
      summary: "Barista who runs busy morning shifts and trains new staff. Keeps the line moving and customers coming back.",
      topSkills: ["Running a busy shift", "Training new staff", "Customer care"],
      technicalSkills: ["Espresso and coffee preparation", "Cash and card handling", "Stock ordering", "Hygiene routines"],
      functionalSkills: ["Shift planning", "Calming upset customers", "Team coaching"],
      tools: ["Cash register", "Shift planning app", "Coffee machines"],
      transferableSkills: [
        { skill: "Staying calm under pressure", proof: "Ran the 7 to 10 morning rush with 3 baristas" },
        { skill: "Teaching others", proof: "Trained 8 new baristas in one year" },
      ],
      experiences: [
        exp({ title: "Shift Supervisor", organization: "Kahvila Tapiola", sector: "Café", start: "2023-03", end: null,
          context: "A busy café near the Tapiola metro serving about 400 customers a day. I run the morning shift with 3 baristas and report to the owner.",
          achievements: ["Ran the 7 to 10 morning rush with 3 baristas", "Trained 8 new baristas in one year", "Reorganised the counter so orders move faster", "Took over weekly stock ordering"],
          results: ["Morning waiting time down from 9 to 4 minutes", "Food waste cut by about a third"], tools: ["Cash register", "Shift planning app"] }),
        exp({ title: "Barista", organization: "Coffee House Lisbon", sector: "Café", start: "2019-05", end: "2022-12",
          context: "Small family café in Lisbon with a team of 5.", achievements: ["Prepared coffee and served customers at the counter"],
          results: ["Named employee of the month 4 times"] }),
      ],
      education: [{ degree: "Vocational diploma in Hospitality", school: "Escola de Hotelaria", years: "2016 - 2019" }],
      languages: [{ name: "Portuguese", level: "Native" }, { name: "English", level: "Fluent" }, { name: "Finnish", level: "Basic" }],
      certifications: ["Hygiene passport (Finland)"],
      projects: [],
      preferences: { targetRoles: ["Café Shift Lead", "Restaurant Supervisor"], location: "Espoo", remote: "On site", availability: "1 month notice" },
      toVerify: [],
      ownWords: ["When the line is out the door, I stop making coffee and start directing traffic.", "My favourite moment is when a new barista runs the rush alone for the first time."],
    }),
    candidate("joonas02", "Joonas", {
      headline: "Retail Team Leader",
      summary: "Assistant store manager in a sports shop. Leads a team of 10, plans the week and turns quiet days into good sales days.",
      topSkills: ["Leading a shop team", "Sales and service", "Weekly planning"],
      technicalSkills: ["Shift scheduling", "Stock counts", "Visual merchandising", "Cash reconciliation"],
      functionalSkills: ["Coaching sales staff", "Handling complaints", "Opening and closing the store"],
      tools: ["Cash register", "Shift planning app", "Stock system"],
      transferableSkills: [{ skill: "Motivating people", proof: "Ran a weekly sales challenge for a team of 10" }, { skill: "Problem solving", proof: "Handled customer complaints for the whole store" }],
      experiences: [
        exp({ title: "Assistant Store Manager", organization: "Urheilu Outlet Iso Omena", sector: "Retail", start: "2022-01", end: null,
          context: "A sports shop in the Iso Omena shopping centre with 10 staff and busy weekends. I plan the week, lead the floor team and stand in for the manager.",
          achievements: ["Planned weekly shifts for 10 staff", "Ran a weekly sales challenge for the team", "Handled customer complaints for the whole store", "Organised two stock counts a year"],
          results: ["Store sales up 12% in 2025", "Staff turnover down from 6 to 2 people a year"], tools: ["Cash register", "Stock system"] }),
        exp({ title: "Sales Assistant", organization: "Urheilu Outlet", sector: "Retail", start: "2019-06", end: "2021-12",
          context: "Weekend and summer job while studying.", achievements: ["Advised customers on running shoes"], results: ["Top seller of the shop in summer 2021"] }),
      ],
      education: [{ degree: "Business degree (unfinished)", school: "Haaga-Helia", years: "2019 - 2021" }],
      languages: [{ name: "Finnish", level: "Native" }, { name: "English", level: "Fluent" }, { name: "Swedish", level: "Basic" }],
      certifications: [],
      projects: [],
      preferences: { targetRoles: ["Store Manager", "Retail Team Leader"], location: "Espoo", remote: "On site", availability: "2 months notice" },
      toVerify: [],
      ownWords: ["A quiet Tuesday is the best day to coach someone.", "I learned more from one angry customer than from a year of training."],
    }),
    candidate("priya03", "Priya", {
      headline: "Ward Nurse",
      summary: "Nurse with 8 years in a busy hospital ward. Coordinates care for many patients and is the person colleagues call when things get hard.",
      topSkills: ["Patient care", "Coordinating a ward", "Calm under pressure"],
      technicalSkills: ["Medication management", "Patient monitoring", "Care planning", "First aid"],
      functionalSkills: ["Shift coordination", "Training new nurses", "Talking with families"],
      tools: ["Patient record system", "Monitoring equipment"],
      transferableSkills: [
        { skill: "Prioritising", proof: "Coordinated care for up to 6 critical patients per shift" },
        { skill: "Training others", proof: "Trained 25 new nurses on the monitoring system" },
      ],
      experiences: [
        exp({ title: "Registered Nurse", organization: "City Hospital", sector: "Healthcare", start: "2016-05", end: null,
          context: "An intensive care ward of 20 beds with 12 nurses per shift. I am often the shift coordinator, reporting to the head nurse.",
          achievements: ["Coordinated care for up to 6 critical patients per shift", "Trained 25 new nurses on the monitoring system", "Led the switch to a new medication routine on the ward"],
          results: ["Medication errors on the ward down by half after the new routine", "Ward referent for new staff since 2022"], tools: ["Patient record system"] }),
      ],
      education: [{ degree: "Bachelor of Nursing", school: "University of Pune", years: "2012 - 2016" }],
      languages: [{ name: "English", level: "Fluent" }, { name: "Hindi", level: "Native" }, { name: "Finnish", level: "Intermediate (B1)" }],
      certifications: ["Nursing licence recognised by Valvira"],
      projects: [],
      preferences: { targetRoles: ["Nurse Coordinator", "Head Nurse"], location: "Espoo", remote: "On site", availability: "Immediately" },
      toVerify: [],
      ownWords: ["In the ICU I learned to watch what people do, not what they say they do.", "The best shift is the one where nobody notices how close it came to chaos."],
    }),
    candidate("omar04", "Omar", {
      headline: "Logistics Operations Coordinator",
      summary: "Coordinator who kept 40 delivery drivers on time and customers informed. Good at plans that survive a bad morning.",
      topSkills: ["Coordinating drivers", "Customer communication", "Daily planning"],
      technicalSkills: ["Route planning", "Order follow-up", "Weekly reporting"],
      functionalSkills: ["Handling complaints", "Team scheduling", "Working with suppliers"],
      tools: ["SAP", "Excel", "Zendesk"],
      transferableSkills: [{ skill: "Working across cultures", proof: "Scheduled 40 drivers from 9 nationalities" }, { skill: "Customer care", proof: "Handled delivery complaints for 150 shops" }],
      experiences: [
        exp({ title: "Operations Coordinator", organization: "Gulf Express Logistics", sector: "Logistics", start: "2020-02", end: "2025-06",
          context: "A delivery company serving 150 shops in Dubai. Reporting to the operations manager, I planned the daily routes of 40 drivers and ran the customer desk.",
          achievements: ["Planned daily routes for 40 drivers", "Handled delivery complaints for 150 shops", "Built a weekly report for management"],
          results: ["On-time deliveries up from 82% to 95%", "Customer complaints halved within one year"], tools: ["SAP", "Zendesk"] }),
      ],
      education: [{ degree: "Bachelor in Supply Chain Management", school: "American University", years: "2015 - 2019" }],
      languages: [{ name: "Arabic", level: "Native" }, { name: "English", level: "Fluent" }, { name: "Finnish", level: "Basic" }],
      certifications: [],
      projects: [],
      preferences: { targetRoles: ["Operations Coordinator", "Customer Service Lead"], location: "Espoo / Vantaa", remote: "On site", availability: "Immediately" },
      toVerify: [],
      ownWords: ["Forty drivers, nine languages, one plan every morning: you learn to explain things simply.", "A customer who gets a call before the delay is a customer who stays."],
    }),
    candidate("amina05", "Amina", {
      headline: "Customer Service Team Lead",
      summary: "Team lead in a customer service centre. Turns angry calls into loyal customers and helps new colleagues find their feet.",
      topSkills: ["Customer service", "Leading a small team", "Solving complaints"],
      technicalSkills: ["Phone and chat support", "Complaint handling", "Quality checks"],
      functionalSkills: ["Coaching new agents", "Weekly team meetings", "Clear writing"],
      tools: ["Zendesk", "Phone system"],
      transferableSkills: [{ skill: "Patience", proof: "Handled about 60 calls a day" }, { skill: "Coaching", proof: "Onboarded 12 new agents" }],
      experiences: [
        exp({ title: "Customer Service Team Lead", organization: "Nordic Telecom (fictional)", sector: "Telecom", start: "2021-09", end: null,
          context: "A customer centre of 40 agents answering phone and chat in English. I lead a team of 6 and report to the centre manager.",
          achievements: ["Lead a team of 6 agents", "Onboarded 12 new agents", "Handle the hardest escalated complaints", "Wrote the team's answer guide"],
          results: ["Team satisfaction score up from 78% to 89%", "Time to answer a chat cut from 5 to 2 minutes"], tools: ["Zendesk"] }),
      ],
      education: [{ degree: "Bachelor in Communication", school: "University of Nairobi", years: "2014 - 2018" }],
      languages: [{ name: "Swahili", level: "Native" }, { name: "English", level: "Fluent" }, { name: "Finnish", level: "Basic" }],
      certifications: [],
      projects: [],
      preferences: { targetRoles: ["Customer Service Lead", "Operations Coordinator"], location: "Espoo", remote: "Hybrid", availability: "1 month notice" },
      toVerify: [],
      ownWords: ["Most angry customers just want someone to say: I see the problem, here is what I will do.", "I keep a list of every question a new colleague asks; it became our team guide."],
    }),
    candidate("lucas06", "Lucas", {
      headline: "Care Assistant",
      summary: "Care assistant in an elderly home, moving towards nursing. Known for patience and for noticing small changes in residents.",
      topSkills: ["Elderly care", "Daily care routines", "Talking with families"],
      technicalSkills: ["Personal care", "Medication reminders", "Activity planning"],
      functionalSkills: ["Working in shifts", "Teamwork", "Reporting changes"],
      tools: ["Care record system"],
      transferableSkills: [{ skill: "Attention to detail", proof: "Noticed early signs of illness in residents" }, { skill: "Organising", proof: "Planned weekly activities for 30 residents" }],
      experiences: [
        exp({ title: "Care Assistant", organization: "Espoo Senior Home (fictional)", sector: "Elderly care", start: "2023-01", end: null,
          context: "A care home for 30 elderly residents with a team of 8 carers per shift. I report to the head nurse.",
          achievements: ["Support 8 residents with daily care each shift", "Planned weekly activities for 30 residents", "Report changes in residents' health to the nurse"],
          results: ["Started the Friday music afternoon, now a weekly favourite"], tools: ["Care record system"] }),
      ],
      education: [{ degree: "Practical nurse studies (in progress)", school: "Omnia", years: "2024 - 2026" }],
      languages: [{ name: "French", level: "Native" }, { name: "English", level: "Fluent" }, { name: "Finnish", level: "Intermediate (B1)" }],
      certifications: ["First aid (EA1)"],
      projects: [],
      preferences: { targetRoles: ["Practical Nurse", "Care Assistant"], location: "Espoo", remote: "On site", availability: "Immediately" },
      toVerify: [],
      ownWords: ["You know a resident is unwell before the test does, if you really listen.", "The Friday music afternoon started with one guitar and two residents."],
    }),
  ];
}

function job(id: string, company: string, posting: Posting): Job {
  const draft = { title: posting.title, text: JSON.stringify(posting) };
  return {
    id, company, createdAt: "2026-11-09T09:00:00.000Z", status: "published", draft, answers: [], posting, seed: true,
    interview: { turns: [], facts: [], covered: [], done: true }, quality: postingQuality(posting, { draft, answers: [] }),
  };
}

export function seedJobs(): Job[] {
  return [
    job("cafe01", "Kahvila Aalto", {
      title: "Café Shift Lead", level: "Experienced",
      summary: "Our café next to the Aalto campus gets a huge morning rush and customers wait too long. You will lead the morning shift and keep the line moving.",
      outcomes: ["Morning rush runs smoothly with a waiting time under 5 minutes", "New staff trained and confident within their first month"],
      mustHave: [
        { skill: "Leading a busy shift", evidence: "Has run a shift with a small team at peak times" },
        { skill: "Training new staff", evidence: "Has shown new colleagues the ropes" },
        { skill: "Friendly customer service", evidence: "Has worked face to face with customers every day" },
      ],
      niceToHave: [{ skill: "Barista skills" }, { skill: "Stock ordering" }, { skill: "Basic Finnish" }],
      team: "A team of 6 baristas and the owner, Sanna, who is in the café every day.",
      tools: ["Cash register", "Shift planning app"],
      location: "Espoo, Otaniemi", remote: "On site, early mornings (6:30 to 14:30)", salary: "2,600 - 2,900 EUR / month",
      workingLanguage: "English", finnishRequired: false, languageNote: "English is fine with customers and the team; basic Finnish is a plus.",
      relocationSupport: null,
      process: ["A short call", "A trial morning in the café", "Answer within one week"],
      inclusionStatement: "Everyone is welcome to apply, whatever your background; tell us if you need any adjustment.",
      aDay: ["Opening the café at 6:30 with one barista", "Running the 8 to 10 rush", "Ordering milk and pastries for tomorrow"],
      challenges: ["Early mornings, five days a week", "Exam weeks are extremely busy"],
      growth: "You will learn to run the café on your own, including ordering and the weekly plan.",
      managerWords: ["I need someone who smiles at 7am and still smiles at 10am.", "Students come here between lectures, every minute in the line matters to them."],
    }),
    job("care02", "Tapiola Health Centre", {
      title: "Nurse Coordinator", level: "Experienced",
      summary: "Our nurses lose time every day on shift planning and patients wait too long for appointments. You will coordinate the nursing team and the daily schedule.",
      outcomes: ["A weekly nursing schedule that the team trusts", "Fewer last-minute appointment changes for patients"],
      mustHave: [
        { skill: "Nursing experience", evidence: "Licensed nurse with experience in a clinic or hospital" },
        { skill: "Coordinating a team's shifts", evidence: "Has planned or coordinated shifts for colleagues" },
        { skill: "Clear communication with patients", evidence: "Has explained care and changes to patients and families" },
      ],
      niceToHave: [{ skill: "Training new nurses" }, { skill: "Finnish for patient calls" }],
      team: "Twelve nurses and two doctors. A warm team that covers for each other.",
      tools: ["Patient record system", "Scheduling software"],
      location: "Espoo, Tapiola", remote: "On site, weekdays", salary: "3,600 - 4,200 EUR / month",
      workingLanguage: "Finnish and English", finnishRequired: true, languageNote: "Finnish is needed for patient calls; we pay for courses if you are at B1 level.",
      relocationSupport: "Help with the nursing licence recognition (Valvira).",
      process: ["Interview with the head nurse", "A visit to meet the team", "Answer within one week"],
      inclusionStatement: "We welcome nurses from every background and support you with language and licence steps.",
      aDay: ["Morning huddle with the nurses", "Building next week's rota", "Calling patients when an appointment must move"],
      challenges: ["Last-minute sick leave means plans change quickly"],
      growth: "You will grow into the head nurse's deputy, with a mentor from our team.",
      managerWords: ["We laugh a lot and we cover for each other.", "You would make the whole clinic breathe."],
    }),
    job("shop03", "Iso Omena Sports", {
      title: "Store Manager", level: "Experienced",
      summary: "Our sports shop in Iso Omena has a great team but no manager since spring. You will lead the team, plan the week and make the shop a place people like to come back to.",
      outcomes: ["A stable weekly plan for a team of 10", "Sales back to last year's level within 6 months"],
      mustHave: [
        { skill: "Leading a shop team", evidence: "Has led or stood in for a manager in a store" },
        { skill: "Sales and customer service", evidence: "Has worked on a shop floor with sales targets" },
        { skill: "Weekly planning", evidence: "Has planned shifts or weekly tasks for a team" },
      ],
      niceToHave: [{ skill: "Sports knowledge" }, { skill: "Stock management" }],
      team: "A team of 10 sales staff, many of them students, and a regional manager you meet monthly.",
      tools: ["Cash register", "Stock system"],
      location: "Espoo, Iso Omena", remote: "On site, including weekends", salary: "3,200 - 3,700 EUR / month",
      workingLanguage: "Finnish and English", finnishRequired: false, languageNote: "English works in the team; basic Finnish helps with some customers.",
      relocationSupport: null,
      process: ["Phone call", "Interview in the store", "Answer within 10 days"],
      inclusionStatement: "We value people from all backgrounds; experience from shops abroad counts fully.",
      aDay: ["Morning briefing with the team", "Being on the floor at busy hours", "Planning next week's shifts"],
      challenges: ["Weekends and Christmas season are intense"],
      growth: "You will learn to run a store's budget, with support from the regional manager.",
      managerWords: ["The team is great, they just need someone who believes in them.", "A good manager here spends more time on the floor than in the office."],
    }),
    job("ops04", "Saari Logistics", {
      title: "Customer Operations Coordinator", level: "Experienced",
      summary: "We deliver groceries to 300 shops in Uusimaa and our customers want to know where their delivery is. You will coordinate daily operations between drivers, the warehouse and shop managers.",
      outcomes: ["Daily delivery plan owned end to end within 3 months", "Customer questions answered within 2 hours"],
      mustHave: [
        { skill: "Coordinating drivers or field teams", evidence: "Has planned daily work for a team" },
        { skill: "Handling customer complaints", evidence: "Has handled complaints from business customers" },
        { skill: "Using a logistics or order system", evidence: "Daily use of a system like SAP" },
      ],
      niceToHave: [{ skill: "Weekly reporting" }, { skill: "Finnish for driver communication" }],
      team: "Operations team of 7, reporting to the Operations Manager.",
      tools: ["SAP", "Excel"],
      location: "Vantaa, near Espoo", remote: "On site", salary: "3,300 - 3,900 EUR / month",
      workingLanguage: "English and Finnish", finnishRequired: false, languageNote: "English is enough to start; we pay for Finnish courses.",
      relocationSupport: null,
      process: ["Phone call", "On-site interview with a shift visit", "Answer within 1 week"],
      inclusionStatement: "We value people from all backgrounds; logistics experience abroad counts fully.",
      aDay: ["Planning the morning routes with the warehouse", "Calling shop managers when a delivery is late", "Updating the weekly report"],
      challenges: ["Mornings start at 6:00", "Winter weather can change every plan"],
      growth: "You will learn our routing system in two weeks with a buddy.",
      managerWords: ["A shop manager who hears about a delay before it happens trusts us for years.", "Experience from another country counts fully here, logistics is logistics."],
    }),
  ];
}

// A few synthetic applications so the employer side can be reviewed right away.
export function seedApplications(): Application[] {
  const app = (id: string, candidateId: string, jobId: string, note: string): Application => ({
    id, candidateId, jobId, note, status: "applied", initiatedBy: "candidate", createdAt: "2026-11-12T10:00:00.000Z",
    log: [{ at: "2026-11-12T10:00:00.000Z", actor: "candidate", action: "Applied" }],
  });
  return [
    app("app-elena-cafe01", "elena01", "cafe01", "I run a morning rush every day and I love training new baristas."),
    app("app-joonas-cafe01", "joonas02", "cafe01", "I lead a shop team and want to try hospitality."),
    app("app-priya-care02", "priya03", "care02", "I coordinate shifts on my ward every week and I am learning Finnish."),
    app("app-lucas-care02", "lucas06", "care02", "I am studying to become a nurse and I care about patients feeling heard."),
    app("app-joonas-shop03", "joonas02", "shop03", "I already stand in for my store manager."),
    app("app-omar-ops04", "omar04", "ops04", "Forty drivers, nine languages, one plan every morning."),
    app("app-amina-ops04", "amina05", "ops04", "I solve customer complaints every day and want to move into operations."),
  ];
}
