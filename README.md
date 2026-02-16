CrayAI (root folder)
backend_api = npx nodemon server.js
frontend_mobile = npx expo start -c // npx expo start -c --tunnel
frontend_web = npm run dev
backend_api/python = python app.py

crayai/package.json
"mobile": "cd frontend_mobile && npx expo start -c",
"dev": "concurrently -n \"NODE,PY,MOB,WEB\" -c \"blue,yellow,magenta,green\" \"npm run server-node\" \"npm run server-python\" \"npm run mobile\" \"npm run web\""

https://app.roboflow.com/join/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3b3Jrc3BhY2VJZCI6IkV4S055MDY3ejVSczhFSHp3Y3F4RjR0QkxOazIiLCJyb2xlIjoib3duZXIiLCJpbnZpdGVyIjoiY2xlcmRlZWNydXpAZ21haWwuY29tIiwiaWF0IjoxNzcxMjQ0NzE5fQ.RMjBWI3yO2kLvXwas95CvFTg9nFCcGtbnZcbBemBtkQ