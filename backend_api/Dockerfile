# 1. Use a Python-specific image
FROM python:3.11-slim

# 2. Set working directory
WORKDIR /app

# 3. Install system dependencies (needed for OpenCV/AI processing)
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy ONLY the Python dependency list
COPY requirements.txt .

# 5. Install the AI libraries (PyTorch, Flask, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy your Python source code and .pt models
COPY . .

# 7. Use the Hugging Face default port
EXPOSE 7860

# 8. Start the AI server
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "app:app"]