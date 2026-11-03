import json
import os

transcript_path = r"C:\Users\tsidd\.gemini\antigravity\brain\7fa01613-dfa4-421f-ae43-1095fabe00aa\.system_generated\logs\transcript_full.jsonl"
output_path = r"c:\Real Estate Appraisal Regression & Error Diagnostics Suite\real-estate-appraisal\data\train.csv"

# Make sure directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                content = data.get('content', '')
                start = content.find('Id,MSSubClass,MSZoning')
                if start != -1:
                    print(f"Found at index {start}")
                    # Find the last line that looks like a row
                    end_str = '1460,20,RL,75,9937,Pave'
                    end = content.find(end_str)
                    if end != -1:
                        print(f"Found end at {end}")
                        end_of_line = content.find('\n', end)
                        if end_of_line == -1: end_of_line = len(content)
                        csv_data = content[start:end_of_line]
                        with open(output_path, 'w', encoding='utf-8') as out:
                            out.write(csv_data.strip() + '\n')
                        print(f"Successfully extracted train.csv. Length: {len(csv_data)}")
                        break
                    else:
                        print("End string not found")
except Exception as e:
    print(f"Error: {e}")
