const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('internship_report_generator.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("No script tag found!");
  process.exit(1);
}

const jsCode = scriptMatch[1];

// Mock the DOM and Browser environment
const mockDOM = {
  elements: {},
  document: {
    getElementById(id) {
      if (!mockDOM.elements[id]) {
        mockDOM.elements[id] = {
          value: '',
          style: { display: '' },
          checked: false,
          classList: {
            remove() {},
            add() {}
          },
          querySelectorAll() { return []; },
          appendChild() {}
        };
      }
      return mockDOM.elements[id];
    },
    querySelectorAll() { return []; },
    createElement(tag) { return { classList: { add() {} }, style: {}, appendChild() {} }; },
    body: { appendChild() {}, removeChild() {} }
  },
  window: {
    onload: null
  },
  localStorage: {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, value) { this.store[key] = String(value); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
  },
  console: console
};

mockDOM.window.docx = {
  Document: class {},
  Packer: { toBase64String() { return Promise.resolve('mockBase64'); } },
  Paragraph: class {},
  TextRun: class {},
  Table: class {},
  TableRow: class {},
  TableCell: class {},
  AlignmentType: {},
  BorderStyle: {},
  WidthType: {},
  ShadingType: {},
  HeadingLevel: {},
  LevelFormat: {},
  Header: class {},
  Footer: class {},
  PageNumber: {}
};

const context = vm.createContext(mockDOM);
vm.runInContext(jsCode, context);

// Set default appState in the context
const appState = vm.runInContext("appState", context);
const domainDatabase = vm.runInContext("domainDatabase", context);
const domainData = domainDatabase[appState.selectedDomain];

const certBullets = (domainData.certBullets || []).map(b => context.fillPlaceholders(b, appState));
const references = (domainData.references || []).map(r => context.fillPlaceholders(r, appState));
const dailyActivities = context.generateOfflineActivities(appState.internshipDomain, appState.internshipTopic, appState.numDays);

const chapters = {};
const chaptersSource = domainData.chapters || {};
Object.keys(chaptersSource).forEach(chKey => {
  chapters[chKey] = (chaptersSource[chKey] || []).map(sec => {
    const heading = context.fillPlaceholders(sec.heading, appState);
    let paragraphs = (sec.paragraphs || []).map(p => context.fillPlaceholders(p, appState));
    let bullets = (sec.bullets || []).map(b => context.fillPlaceholders(b, appState));
    return { heading, paragraphs, bullets };
  });
});

const startPages = {};
startPages.cover = 1;
startPages.bonafide = 2;
startPages.companyCert = 3;
startPages.declaration = 4;
startPages.acknowledgement = 5;
startPages.toc = 6;

let currentPage = 7;

startPages.ch1 = currentPage;
currentPage += context.estimateChapterPages(chapters.ch1, { isCh1: true });

startPages.ch2 = currentPage;
currentPage += context.estimateChapterPages(chapters.ch2);

startPages.ch3 = currentPage;
currentPage += context.estimateChapterPages(chapters.ch3, { isCh3: true, dailyActivities: dailyActivities });

startPages.ch4 = currentPage;
currentPage += context.estimateChapterPages(chapters.ch4);

startPages.ch5 = currentPage;
currentPage += context.estimateChapterPages(chapters.ch5);

startPages.ch6 = currentPage;
currentPage += context.estimateChapterPages(chapters.ch6);

startPages.references = currentPage;
const refCount = references.length;
const refLines = 2 + refCount * 1.5;
currentPage += Math.max(1, Math.ceil(refLines / 36));

startPages.appendices = currentPage;

console.log("Calculated Starting Pages:");
console.log(JSON.stringify(startPages, null, 2));
