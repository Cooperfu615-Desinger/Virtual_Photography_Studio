import os
import re
import json

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KB_DIR = os.path.join(BASE_DIR, 'knowledge_base')
OUTPUT_DIR = os.path.join(BASE_DIR, 'webapp', 'src', 'data')
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'database.json')

def parse_markdown_table(file_path):
    """Parses a markdown table into a grouped dictionary, structured for the frontend."""
    data = {}
    
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return data

    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in lines:
        line = line.strip()
        if not line or not line.startswith('|') or '---' in line:
            continue
        
        parts = [p.strip() for p in line.split('|')[1:-1]]
        if len(parts) >= 4 and parts[0] not in ('維度', '類型', '特徵維度 (Category)', '特徵維度', '類別 (Category)', '維度分類 (Dimension)', '地區風格 (Region Style)'):
            if 'regional_portrait_styles' in file_path:
                category = '區域攝影風格'
                name_zh = parts[0].strip('*')
                prompt_en = parts[0].split('(')[0].strip() + " style"
                desc = parts[3] if len(parts) > 3 else ""
            elif len(parts) >= 5:
                category = parts[1].strip('*')
                name_zh = parts[2]
                prompt_en = parts[3].strip('`')
                desc = parts[4] if len(parts) > 4 else ""
            else:
                category = parts[0].strip('*')
                name_zh = parts[1]
                prompt_en = parts[2].strip('`')
                desc = parts[3] if len(parts) > 3 else ""
            
            if category not in data:
                data[category] = []
                
            data[category].append({
                "zh": name_zh,
                "en": prompt_en,
                "desc": desc
            })
            
    return data

def main():
    print("Starting sync from MD to JSON...")
    
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    database = {}
    
    # Files to process
    files_to_sync = {
        'regional_portrait_styles.md': 'Regional',
        'wardrobe_and_styling.md': 'Wardrobe',
        'camera_and_lighting.md': 'CameraLighting',
        'locations_and_sets.md': 'Locations',
        'character_design.md': 'Character',
        'negative_prompts.md': 'Negative'
    }
    
    for filename, db_key in files_to_sync.items():
        file_path = os.path.join(KB_DIR, filename)
        print(f"Parsing {filename}...")
        parsed_data = parse_markdown_table(file_path)
        database[db_key] = parsed_data
        
    # Validation
    if not database.get('Character'):
        print("Warning: Database might be empty or parsing failed.")
        
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(database, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully synced dictionaries to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
