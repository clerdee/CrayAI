# 1. Use Python 3.11
FROM python:3.11-slim

# 2. Set working directory
WORKDIR /app

# 3. Install modern system dependencies for OpenCV/AI models
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglx-mesa0 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. Copy ONLY Python requirements
COPY requirements.txt .

# 5. Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copy all Python source files
COPY . .

# 7. Expose the default Hugging Face port
EXPOSE 7860

# 8. Start the server using Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "app:app"]