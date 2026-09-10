
def check_match(msg, keywords):
    return any(k in msg for k in keywords)

msg1 = "hii"
msg2 = "🍔 i'm hungry"
msg3 = "🚪 find best gate"
msg4 = "📍 venue map"

keywords_greeting = ["hi", "hello", "hey", "greet", "yo"]
keywords_food = ["hungry", "food", "eat", "snack"]
keywords_gate = ["gate", "exit", "entry", "door"]

print(f"Input: {msg1}")
print(f"  Matches Greeting: {check_match(msg1, keywords_greeting)}")
print(f"  Matches Food: {check_match(msg1, keywords_food)}")

print(f"\nInput: {msg2}")
print(f"  Matches Greeting: {check_match(msg2, keywords_greeting)}")
print(f"  Matches Food: {check_match(msg2, keywords_food)}")

print(f"\nInput: {msg3}")
print(f"  Matches Greeting: {check_match(msg3, keywords_greeting)}")
print(f"  Matches Gate: {check_match(msg3, keywords_gate)}")

print(f"\nInput: {msg4}")
print(f"  Matches Greeting: {check_match(msg4, keywords_greeting)}")
