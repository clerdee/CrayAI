CrayAI (root folder)
backend_api = npx nodemon server.js
frontend_mobile = npx expo start -c // npx expo start -c --tunnel
frontend_web = npm run dev
backend_api/python = python app.py


crayai/package.json
"mobile": "cd frontend_mobile && npx expo start -c",
"dev": "concurrently -n \"NODE,PY,MOB,WEB\" -c \"blue,yellow,magenta,green\" \"npm run server-node\" \"npm run server-python\" \"npm run mobile\" \"npm run web\""