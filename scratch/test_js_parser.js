const fs = require('fs');
const vm = require('vm');

// 1. Load HTML and extract JS
const html = fs.readFileSync('internship_report_generator.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error("No script tag found!");
  process.exit(1);
}
const jsCode = scriptMatch[1];

// 2. Mock environment
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
  console: {
    log(...args) { console.log(...args); },
    error(...args) { console.error(...args); },
    warn(...args) { console.warn(...args); }
  }
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

// 3. Execute script in VM context
const context = vm.createContext(mockDOM);
try {
  vm.runInContext(jsCode, context);
  console.log('✓ Script parsed and executed in VM context.');
} catch (e) {
  console.error('✗ Execution failed:', e);
  process.exit(1);
}

// 4. Load extracted text
const extractedText = JSON.parse(fs.readFileSync('scratch/extracted_text.json', 'utf8'));

// 5. Run parser
console.log('Running parseReferencePDFText...');
const parsedData = context.parseReferencePDFText(extractedText);

// 6. Save output
fs.writeFileSync('scratch/parsed_output.json', JSON.stringify(parsedData, null, 2));
console.log('✓ Saved parsed output to scratch/parsed_output.json');

// 7. Verify fields
console.log('=== VERIFICATION ===');
console.log('Domain Name:', parsedData.domainName);
if (parsedData.domainName && parsedData.domainName !== 'Custom Domain') {
  console.log('✓ Domain name parsed correctly:', parsedData.domainName);
} else {
  console.error('✗ Failed to parse domain name, got:', parsedData.domainName);
  process.exit(1);
}

console.log('Abbreviations count:', parsedData.abbreviations.length);
if (parsedData.abbreviations.length >= 10) {
  console.log('✓ Abbreviations list parsed correctly.');
} else {
  console.error('✗ Abbreviations count too low:', parsedData.abbreviations.length);
  process.exit(1);
}

console.log('Daily activities count:', parsedData.dailyActivities.length);
if (parsedData.dailyActivities.length >= 26) {
  console.log('✓ Daily activities list parsed correctly.');
} else {
  console.error('✗ Daily activities count too low:', parsedData.dailyActivities.length);
  process.exit(1);
}

for (let c = 1; c <= 6; c++) {
  const chKey = `ch${c}`;
  const sections = parsedData.chapters[chKey];
  console.log(`Chapter ${c} sections count:`, sections.length);
  if (sections.length > 0) {
    console.log(`   First section heading:`, sections[0].heading);
    console.log(`   First section paragraphs count:`, sections[0].paragraphs.length);
    if (sections[0].paragraphs.length > 0) {
      console.log(`   First paragraph snippet:`, sections[0].paragraphs[0].substring(0, 100) + '...');
    }
  } else {
    console.error(`✗ Chapter ${c} has no sections!`);
    process.exit(1);
  }
}

console.log('\nAll PDF Heuristic Parser Integration Tests Passed Successfully!');
process.exit(0);
