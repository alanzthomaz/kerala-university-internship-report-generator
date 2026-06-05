import pypdf
import json

pdf_path = "/home/alan/report generator/Alan_Thomas_Internship_Report (1).pdf"
reader = pypdf.PdfReader(pdf_path)
full_text = ""
for page in reader.pages:
    full_text += "\n" + page.extract_text()

output_path = "/home/alan/report generator/scratch/extracted_text.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(full_text, f, ensure_ascii=False, indent=2)

print("Text extracted successfully to " + output_path)
