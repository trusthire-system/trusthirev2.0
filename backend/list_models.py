import google.generativeai as genai
import os

# Try to find .env in frontend
base_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(base_dir, "..", "frontend", ".env")
if os.path.exists(env_path):
    with open(env_path, 'r') as f:
        for line in f:
            if "GEMINI_API_KEY" in line and "=" in line:
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
                os.environ["GEMINI_API_KEY"] = key
                print(f"Loaded key from {env_path}")

key = os.environ.get("GEMINI_API_KEY")
if not key:
    print("No API key found")
    exit(1)

genai.configure(api_key=key)
print("Available models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error listing models: {e}")
