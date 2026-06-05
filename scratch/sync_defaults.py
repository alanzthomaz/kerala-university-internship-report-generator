import json
import re

json_path = "/home/alan/report generator/ai_cybersecurity_domain.json"
html_path = "/home/alan/report generator/internship_report_generator.html"

# Load the cleaned domain JSON
with open(json_path, "r", encoding="utf-8") as f:
    domain_data = json.load(f)

# Compact JSON string
compact_json = json.dumps(domain_data, separators=(',', ':'))

# Read HTML file
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Replace the defaultDomainData line
pattern = r'const defaultDomainData = \{.*?\};'
match = re.search(pattern, html_content)
if match:
    replacement = f'const defaultDomainData = {compact_json};'
    new_html = html_content[:match.start()] + replacement + html_content[match.end():]
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    print("✓ Successfully synchronized defaultDomainData in HTML!")
else:
    print("✗ Error: const defaultDomainData pattern not found in HTML!")
