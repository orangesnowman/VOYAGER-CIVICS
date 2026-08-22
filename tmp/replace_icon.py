import re

with open('src/components/LiveAgent.tsx', 'r') as f:
    text = f.read()

text = text.replace('<MessageSquare className={`w-[25px]', '<Bot className={`w-[25px]')

with open('src/components/LiveAgent.tsx', 'w') as f:
    f.write(text)

print('Done!')
