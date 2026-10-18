with open("/tmp/apps.js", "r") as f:
    apps = f.read()
with open("/tmp/shared.js", "r") as f:
    shared = f.read()
import re
print("apps endpoints:", sorted(list(set(re.findall(r'makeRequest\([`"\']([^`"\']+)[`"\']', apps)))))
print("shared endpoints:", sorted(list(set(re.findall(r'makeRequest\([`"\']([^`"\']+)[`"\']', shared)))))
