import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

# Reconfigure stdout to handle emojis on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from services.gemini_service import chat

print("--- Testing AI Assistant Mock Logic ---")
print("\nQuestion: 'I am hungry, where is the food?'")
print("Response:", chat("I am hungry, where is the food?"))

print("\nQuestion: 'How is the gate status?'")
print("Response:", chat("How is the gate status?"))

print("\nQuestion: 'General info about the match?'")
print("Response:", chat("General info about the match?"))
