const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('internship_report_generator.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("No script tag found!");
  process.exit(1);
}

const jsCode = scriptMatch[1];
const mockDOM = {
  elements: {},
  document: {
    getElementById(id) {
      return { value: '', style: {}, classList: { remove() {}, add() {} }, querySelectorAll() { return []; } };
    },
    querySelectorAll() { return []; },
    createElement() { return { classList: { add() {} } }; }
  },
  window: {},
  localStorage: {
    store: {},
    getItem() { return null; },
    setItem() {}
  },
  console: console
};

const context = vm.createContext(mockDOM);
const data = vm.runInContext(jsCode + "; defaultDomainData;", context);

const S = {
  internshipDomain: data.domainName,
  internshipTopic: data.metadata.internshipTopic,
  companyName: "Test Company",
  companyAddress: "Test Address",
  internshipDuration: "26 days",
  mentorName: "Test Mentor",
  projectTitle: "Test Project",
  problemStatement: "Test Problem",
  projectObjective: "Test Objective",
  projectDescription: "Test Description",
  technologiesUsed: "Test Tech",
  programmingLanguages: "Python",
  toolsUsed: "Wireshark",
  datasetUsed: "NSL-KDD",
  methodology: "Deep Learning",
  studentName: "Alan Thomas",
  registerNumber: "12345",
  apaarId: "9999",
  courseCode: "UK4INTCSC200",
  course: "BSc Computer Science",
  semester: "S4",
  collegeName: "Naipunnya College",
  collegeLocation: "Cherthala",
  universityName: "Kerala University",
  facultyGuideName: "Mr. Vivek S Varma",
  facultyGuideDesignation: "Assistant Professor",
  department: "Department of Computer Science & Applications",
  academicYear: "2025–2026",
  noProject: false
};

// Mock fillPlaceholders
function fill(text) {
  if (!text) return '';
  return text
    .replace(/{companyName}/g, S.companyName)
    .replace(/{companyAddress}/g, S.companyAddress)
    .replace(/{internshipDuration}/g, S.internshipDuration)
    .replace(/{mentorName}/g, S.mentorName)
    .replace(/{projectTitle}/g, S.projectTitle)
    .replace(/{problemStatement}/g, S.problemStatement)
    .replace(/{projectObjective}/g, S.projectObjective)
    .replace(/{projectDescription}/g, S.projectDescription)
    .replace(/{technologiesUsed}/g, S.technologiesUsed)
    .replace(/{programmingLanguages}/g, S.programmingLanguages)
    .replace(/{toolsUsed}/g, S.toolsUsed)
    .replace(/{datasetUsed}/g, S.datasetUsed)
    .replace(/{methodology}/g, S.methodology)
    .replace(/{studentName}/g, S.studentName)
    .replace(/{registerNumber}/g, S.registerNumber)
    .replace(/{apaarId}/g, S.apaarId)
    .replace(/{courseCode}/g, S.courseCode)
    .replace(/{course}/g, S.course)
    .replace(/{semester}/g, S.semester)
    .replace(/{collegeName}/g, S.collegeName)
    .replace(/{collegeLocation}/g, S.collegeLocation)
    .replace(/{universityName}/g, S.universityName)
    .replace(/{facultyGuideName}/g, S.facultyGuideName)
    .replace(/{facultyGuideDesignation}/g, S.facultyGuideDesignation)
    .replace(/{department}/g, S.department)
    .replace(/{academicYear}/g, S.academicYear)
    .replace(/{internshipDomain}/g, S.internshipDomain)
    .replace(/{internshipTopic}/g, S.internshipTopic);
}

const chapters = {};
Object.keys(data.chapters).forEach(chKey => {
  chapters[chKey] = data.chapters[chKey].map(sec => {
    return {
      heading: fill(sec.heading),
      paragraphs: (sec.paragraphs || []).map(fill),
      bullets: (sec.bullets || []).map(fill)
    };
  });
});

const dailyActivities = context.generateOfflineActivities(S.internshipDomain, S.internshipTopic, 26);

function runSweep(linesPerPage, charsPerLinePara, charsPerLineBullet, H2Lines, paraPaddingLines, bulletPaddingLines) {
  function testEstimate(sections, options = {}) {
    let lines = 0;
    lines += 1.5; // H1 spacing
    
    (sections || []).forEach(sec => {
      lines += H2Lines;
      (sec.paragraphs || []).forEach(p => {
        lines += Math.ceil(p.length / charsPerLinePara) + paraPaddingLines;
      });
      (sec.bullets || []).forEach(b => {
        lines += Math.ceil(b.length / charsPerLineBullet) + bulletPaddingLines;
      });
      if (options.isCh1 && sec.heading.includes("1.4")) {
        lines += 10; // parameters table
      }
    });

    if (options.isCh3 && options.dailyActivities && options.dailyActivities.length) {
      const narrativePages = Math.ceil(lines / linesPerPage);
      let tableLines = 2; // header row
      options.dailyActivities.forEach(act => {
        const titleLines = Math.ceil((act.title || '').length / 28);
        const activityLines = Math.ceil((act.activity || '').length / 64);
        tableLines += Math.max(1, titleLines, activityLines) + 0.2;
      });
      const tablePages = Math.ceil(tableLines / linesPerPage);
      return narrativePages + tablePages;
    }
    
    return Math.ceil(lines / linesPerPage);
  }

  let currentPage = 7;
  const ch1 = testEstimate(chapters.ch1, { isCh1: true });
  currentPage += ch1;
  const ch2 = testEstimate(chapters.ch2);
  currentPage += ch2;
  const ch3 = testEstimate(chapters.ch3, { isCh3: true, dailyActivities: dailyActivities });
  currentPage += ch3;
  const ch4 = testEstimate(chapters.ch4);
  currentPage += ch4;
  const ch5 = testEstimate(chapters.ch5);
  currentPage += ch5;
  const ch6 = testEstimate(chapters.ch6);
  currentPage += ch6;
  
  const refCount = data.references.length;
  const refLines = 2 + refCount * 1.5;
  const refPages = Math.max(1, Math.ceil(refLines / linesPerPage));
  const refStart = currentPage;
  currentPage += refPages;
  const appStart = currentPage;

  return { refStart, appStart, breakdown: [ch1, ch2, ch3, ch4, ch5, ch6] };
}

// Sweep linesPerPage from 34 to 40 and charsPerLinePara from 85 to 105
for (let lpp = 34; lpp <= 40; lpp++) {
  for (let cpp = 85; cpp <= 100; cpp += 5) {
    const res = runSweep(lpp, cpp, cpp - 10, 1.2, 0.44, 0.33);
    if (res.refStart === 27 && res.appStart === 28) {
      console.log(`MATCH: lpp=${lpp}, cpp=${cpp}, refStart=${res.refStart}, appStart=${res.appStart}, breakdown=[${res.breakdown.join(', ')}]`);
    }
  }
}
