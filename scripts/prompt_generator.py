import os
import re
import random
from collections import defaultdict

KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'knowledge_base')

def load_dictionary(filename):
    """
    Parses a markdown dictionary file and returns a dictionary of dimensions and parameters.
    Returns: dict[dimension] = [{"en": "...", "zh": "..."}]
    """
    filepath = os.path.join(KNOWLEDGE_BASE_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Warning: {filename} not found.")
        return {}

    data = defaultdict(list)
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Match markdown table rows starting with |
            if line.startswith('|') and not line.startswith('| :---') and not line.startswith('| 維度分類') and not line.startswith('| 地區風格'):
                parts = [p.strip() for p in line.split('|') if p.strip()]
                if len(parts) >= 3:
                    # Clean the dimension name, remove english parentheticals and markdown bold
                    dimension = re.sub(r'\(.*?\)', '', parts[0]).replace('*', '').strip()
                    
                    # Special parsing for regional styles where column 1 is Region Style and column 4 has prompts
                    if filename == 'regional_portrait_styles.md' and len(parts) >= 5:
                         prompt_keywords = parts[4].replace('`', '').strip()
                         zh_name = parts[0].replace('`', '').strip()
                         data['Region'].append({"en": prompt_keywords, "zh": zh_name})
                    else:
                        zh_name = parts[1].replace('`', '').strip()
                        prompt_keywords = parts[2].replace('`', '').strip()
                        if prompt_keywords:
                            data[dimension].append({"en": prompt_keywords, "zh": zh_name})
    return data

def build_prompt():
    """Generates a random prompt and returns a dict of structured components."""
    
    # Load all dictionaries
    styles_data = load_dictionary('regional_portrait_styles.md')
    wardrobe_data = load_dictionary('wardrobe_and_styling.md')
    camera_data = load_dictionary('camera_and_lighting.md')
    locations_data = load_dictionary('locations_and_sets.md')
    character_data = load_dictionary('character_design.md')
    negative_data = load_dictionary('negative_prompts.md')

    # Construct the components
    base_quality = "(masterpiece, best quality, ultra-detailed:1.2), highres, raw photo"
    
    # Storage for structured output (list of objects with en/zh)
    structured = {
        "Base Quality": [{"en": base_quality, "zh": "極致畫質"}],
        "Character": [],
        "Pose & Expression": [],
        "Wardrobe": [],
        "Location": [],
        "Lighting": [],
        "Framing": [],
        "Camera & Film": [],
        "Negative Prompts": []
    }

    # Helper function with weighted sampling for hair/hair-color
    def extract_weighted(data_dict, category, target_list, natural_indices, natural_weight=0.8):
        if not data_dict or category not in data_dict:
            return None
        
        items = data_dict[category]
        if not items:
            return None
            
        # Split into natural and special
        natural_items = [items[i-1] for i in natural_indices if i-1 < len(items)]
        special_items = [item for i, item in enumerate(items) if i+1 not in natural_indices]
        
        if random.random() < natural_weight and natural_items:
            choice = random.choice(natural_items)
        elif special_items:
            choice = random.choice(special_items)
        else:
            choice = random.choice(items)
            
        target_list.append(choice)
        return choice

    # Helper function to safely extract and append
    def extract_cat(data_dict, category, target_list, prob=1.0):
        if data_dict and category in data_dict and random.random() <= prob:
            choice = random.choice(data_dict[category])
            target_list.append(choice)
            return choice
        return None

    # --- Structured Assembly ---
    # Character & Pose
    structured["Character"].append({"en": "1girl", "zh": "一名女性"})
    extract_cat(character_data, '臉型輪廓', structured["Character"])
    extract_cat(character_data, '五官特徵', structured["Character"])
    extract_cat(character_data, '膚色與膚質', structured["Character"])
    
    # Natural Hairstyles: 1,2,3,5,15,16,17,18,19,20
    extract_weighted(character_data, '髮型', structured["Character"], [1,2,3,5,15,16,17,18,19,20], natural_weight=0.85)
    
    # Natural Hair Colors: 1,2,3,12,13,15,16,17,18,19,20
    extract_weighted(character_data, '髮色', structured["Character"], [1,2,3,12,13,15,16,17,18,19,20], natural_weight=0.9)
    
    extract_cat(character_data, '年齡氣質', structured["Character"])
    
    extract_cat(character_data, '神情與眼神', structured["Pose & Expression"])
    extract_cat(character_data, '姿勢與肢體語言', structured["Pose & Expression"])

    # Wardrobe
    extract_cat(wardrobe_data, '風格基調', structured["Wardrobe"])
    extract_cat(wardrobe_data, '上身', structured["Wardrobe"])
    extract_cat(wardrobe_data, '下身', structured["Wardrobe"])
    extract_cat(wardrobe_data, '外套', structured["Wardrobe"])
    extract_cat(wardrobe_data, '鞋款', structured["Wardrobe"])
    extract_cat(wardrobe_data, '配件', structured["Wardrobe"], prob=0.6)
    extract_cat(wardrobe_data, '材質與細節', structured["Wardrobe"], prob=0.4)

    # Location
    if locations_data:
        loc_keys = list(locations_data.keys())
        if loc_keys:
            structured["Location"].append(random.choice(locations_data[random.choice(loc_keys)]))

    # Lighting
    extract_cat(camera_data, '光線類型', structured["Lighting"])
    extract_cat(camera_data, '光線方向與質感', structured["Lighting"])

    # Framing
    extract_cat(camera_data, '景別構圖', structured["Framing"])
    extract_cat(camera_data, '相機視角', structured["Framing"])

    # Camera & Film
    extract_cat(styles_data, 'Region', structured["Camera & Film"])
    extract_cat(camera_data, '鏡頭焦段', structured["Camera & Film"])
    extract_cat(camera_data, '底片與相機模擬', structured["Camera & Film"])
    extract_cat(camera_data, '特殊效果', structured["Camera & Film"], prob=0.4)

    # Negative
    if negative_data:
        for cat in negative_data.keys():
            choice = random.choice(negative_data[cat])
            # Simplified de-duplication
            if choice["en"] not in [x["en"] for x in structured["Negative Prompts"]]:
                structured["Negative Prompts"].append(choice)

    return structured

def save_prompt_to_file(structured_data):
    """Formats the structured data into markdown and saves it."""
    import datetime
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"prompt_{timestamp}.md"
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'output_prompts')
    filepath = os.path.join(output_dir, filename)

    # Extract EN/ZH strings
    def get_en(list_of_dicts): return ", ".join([d["en"] for d in list_of_dicts])
    def get_zh(list_of_dicts): return ", ".join([d["zh"] for d in list_of_dicts])

    # Build Natural Language Prompt
    natural_parts = []
    natural_parts.append(get_en(structured_data["Base Quality"]))
    if structured_data["Camera & Film"]: natural_parts.append(get_en(structured_data["Camera & Film"]))
    if structured_data["Framing"]: natural_parts.append(get_en(structured_data["Framing"]))
    
    subject_parts = []
    if structured_data["Character"]: subject_parts.append(get_en(structured_data["Character"]))
    if structured_data["Pose & Expression"]: subject_parts.append(get_en(structured_data["Pose & Expression"]))
    
    wardrobe_parts = []
    if structured_data["Wardrobe"]:
        wardrobe_parts.append("wearing")
        wardrobe_parts.append(get_en(structured_data["Wardrobe"]))
        
    if subject_parts: natural_parts.append(", ".join(subject_parts))
    if wardrobe_parts: natural_parts.append(", ".join(wardrobe_parts))
    
    if structured_data["Location"]: natural_parts.append(get_en(structured_data["Location"]))
    if structured_data["Lighting"]: natural_parts.append(get_en(structured_data["Lighting"]))

    positive_prompt_text = ", ".join(natural_parts)
    negative_prompt_text = get_en(structured_data["Negative Prompts"])

    # Build Summary (Traditional Chinese)
    summary_zh = []
    if structured_data["Camera & Film"]: summary_zh.append(f"風格：{get_zh(structured_data['Camera & Film'])}")
    if structured_data["Character"]: summary_zh.append(f"人物：{get_zh(structured_data['Character'])}")
    if structured_data["Wardrobe"]: summary_zh.append(f"服裝：{get_zh(structured_data['Wardrobe'])}")
    if structured_data["Location"]: summary_zh.append(f"場景：{get_zh(structured_data['Location'])}")
    if structured_data["Lighting"]: summary_zh.append(f"光影：{get_zh(structured_data['Lighting'])}")
    
    summary_text = " > " + " | ".join(summary_zh)

    # Build Markdown Content
    md_content = f"# Generated Prompt - {timestamp}\n"
    md_content += f"**💡 抽卡重點摘要：** {summary_text}\n\n"
    
    md_content += "## 🎙️ Natural Language Prompt (For Midjourney / SD)\n"
    md_content += "### Positive Prompt\n"
    md_content += f"```text\n{positive_prompt_text}\n```\n\n"
    md_content += "### Negative Prompt\n"
    md_content += f"```text\n{negative_prompt_text}\n```\n\n"
    md_content += "---\n\n"
    
    md_content += "## 🧩 The Scheme (Structured Format)\n"
    
    # Map the English keys to nice Markdown list items
    schema_mapping = [
        ("Character (人物外形)", structured_data["Character"]),
        ("Pose & Expression (姿態神情)", structured_data["Pose & Expression"]),
        ("Wardrobe (服裝造型)", structured_data["Wardrobe"]),
        ("Location (場景佈景)", structured_data["Location"]),
        ("Lighting (光影設計)", structured_data["Lighting"]),
        ("Framing (構圖與視角)", structured_data["Framing"]),
        ("Camera & Film (鏡頭與後期)", structured_data["Camera & Film"]),
    ]
    
    for label, items in schema_mapping:
        if items:
            md_content += f"* **{label}:** {get_en(items)} ({get_zh(items)})\n"
            
    md_content += f"* **Negative Prompts (防護指令):** {negative_prompt_text}\n"

    # Write to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(md_content)
        
    return filepath, positive_prompt_text, negative_prompt_text

if __name__ == "__main__":
    print("=" * 70)
    print("✨ Vibe Quirk Labs: AI Stylist & Photographer Pipeline ✨")
    print("=" * 70)
    
    structured_data = build_prompt()
    saved_path, pos, neg = save_prompt_to_file(structured_data)
    
    print("\n[SUCCESS] Generated new prompt!")
    print(f"Saved to: {saved_path}\n")
    print("=" * 70)

