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
try {
  vm.runInContext(jsCode, context);
  console.log('✓ Script parsed and executed in VM context successfully!');
} catch (e) {
  console.error('✗ Execution failed:', e);
  process.exit(1);
}

// Test 1: Page Budget Algorithm
const budgetResult = context.calculatePageBudget(32);
console.log('Test 1 - Page Budget for 32 pages:', budgetResult.budget);
const totalChaptersPages = budgetResult.budget.ch1 + budgetResult.budget.ch2 + budgetResult.budget.ch3 + budgetResult.budget.ch4 + budgetResult.budget.ch5 + budgetResult.budget.ch6;
if (totalChaptersPages === 32 - budgetResult.prelimPages - 2) {
  console.log('✓ Page budget sums up correctly.');
} else {
  console.error('✗ Page budget sum error!');
  process.exit(1);
}

// Test 2: Offline data generation for chapters
const ch1Data = context.generateOfflineData('ch1');
console.log('Test 2 - Ch1 offline sections count:', ch1Data.length);
if (ch1Data.length > 0 && ch1Data[0].heading && ch1Data[0].paragraphs) {
  console.log('   Ch1 Section 1 Heading:', ch1Data[0].heading);
  console.log('   Ch1 Section 1 Paragraphs count:', ch1Data[0].paragraphs.length);
  console.log('✓ Offline Data Generation works for ch1!');
} else {
  console.error('✗ Offline Data Generation failed for ch1!');
  process.exit(1);
}

// Test 3: Abbreviations Generation
const abbrevData = context.generateOfflineData('abbreviations');
console.log('Test 3 - Abbreviations count:', abbrevData.length);
if (abbrevData.length === 0) {
  console.log('✓ Abbreviations list is empty (successfully removed).');
} else {
  console.error('✗ Abbreviations list is not empty!');
  process.exit(1);
}

// Test 4: Daily Activities Generation
const activities = context.generateOfflineActivities('AI', 'Cybersecurity', 10);
console.log('Test 4 - Generated daily activities count:', activities.length);
if (activities.length === 10 && activities[0].title && activities[0].activity) {
  console.log('✓ Daily activity logs generated correctly!');
} else {
  console.error('✗ Daily activities generation failed!');
  process.exit(1);
}

console.log('\nAll 4 Unit Tests Passed Successfully! Code is solid.');
process.exit(0);
