from pathlib import Path

path = Path('auth.js')
text = path.read_text(encoding='utf-8')
old = "        setTimeout(()=>{\n\n\n            if(window.WeatherVerse){\n\n                WeatherVerse.showPermissionScreen();\n\n            }\n\n\n        },1000);\n"
new = "        setTimeout(()=>{\n\n\n            document.getElementById(\"authScreen\")?.classList.add(\"hidden\");\n\n            if(typeof showLocationPermission === \"function\"){\n\n                showLocationPermission();\n\n            }\n\n\n        },1000);\n"
text = text.replace(old, new, 1)
text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('patch complete')
