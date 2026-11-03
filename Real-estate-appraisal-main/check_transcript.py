import json

transcript_path = r"C:\Users\tsidd\.gemini\antigravity\brain\7fa01613-dfa4-421f-ae43-1095fabe00aa\.system_generated\logs\transcript_full.jsonl"

try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            data = json.loads(line)
            content = data.get('content', '')
            print(f"Type: {data.get('type')}, Length: {len(content)}")
except Exception as e:
    print(f"Error: {e}")
