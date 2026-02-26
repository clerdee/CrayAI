# 1. Use Python as the base image (so we have the AI libraries)
FROM python:3.11-slim

# 2. Install Node.js (so we can run the main server)
RUN apt-get update && apt-get install -y nodejs npm

# Set working directory
WORKDIR /app

# 3. Copy dependency files first (to speed up deployment)
COPY package.json package-lock.json ./
COPY requirements.txt ./

# 4. Install dependencies
RUN npm install
# Install Python packages + Gunicorn
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy the rest of your code
COPY . .

# 6. Make a startup script to run BOTH servers
# This script starts Python in the background (&) and Node in the foreground
RUN echo '#!/bin/bash' > start.sh
# RUN echo 'gunicorn app:app --bind 0.0.0.0:5001 --timeout 120 &' >> start.sh
RUN echo 'node server.js' >> start.sh
RUN chmod +x start.sh

# 7. Start the container
CMD ["./start.sh"]