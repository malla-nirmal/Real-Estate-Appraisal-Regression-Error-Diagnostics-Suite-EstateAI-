import json

transcript_path = r"C:\Users\tsidd\.gemini\antigravity\brain\7fa01613-dfa4-421f-ae43-1095fabe00aa\.system_generated\logs\transcript_full.jsonl"
output_path = r"c:\Real Estate Appraisal Regression & Error Diagnostics Suite\real-estate-appraisal\data\train.csv"

try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line)
            content = data.get('content', '')
            if 'Id,MSSubClass,MSZoning' in content:
                print(f"FOUND IN: {data.get('type')}")
                start = content.find('Id,MSSubClass,MSZoning')
                end = content.find('1460,20,RL,75,9937,Pave', start)
                if end != -1:
                    end_of_line = content.find('\n', end)
                    if end_of_line == -1: end_of_line = len(content)
                    csv_data = content[start:end_of_line]
                    with open(output_path, 'w', encoding='utf-8') as out:
                        out.write(csv_data.strip() + '\n')
                    print(f"Saved {len(csv_data)} bytes to {output_path}")
                else:
                    print("Could not find end of CSV.")
except Exception as e:
    print(f"Error: {e}")
