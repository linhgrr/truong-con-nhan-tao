FROM python:3.10-slim AS backend

WORKDIR /app

# Tạo các thư mục cần thiết
RUN mkdir -p data models/faiss_index backend

# Copy requirements file và cài đặt dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ backend/

# Tạo file .env trống
RUN echo "GEMINI_API_KEY=" > .env

# Tạo file knowledge.txt rỗng nếu không có
RUN touch data/knowledge.txt

# Frontend build
FROM node:18 AS frontend-build

WORKDIR /app/frontend

# Copy package.json để cài đặt dependencies
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Copy frontend code và build
COPY frontend/ ./
RUN npm run build

# Final image
FROM python:3.10-slim

WORKDIR /app

# Copy Python dependencies
COPY --from=backend /usr/local/lib/python3.10/site-packages/ /usr/local/lib/python3.10/site-packages/
COPY --from=backend /usr/local/bin/ /usr/local/bin/

# Copy backend files
COPY --from=backend /app/backend/ ./backend/
COPY --from=backend /app/data/ ./data/
COPY --from=backend /app/.env ./.env
COPY --from=backend /app/models/ ./models/

# Copy frontend build
COPY --from=frontend-build /app/frontend/build/ ./frontend/build/

# Set working directory
WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Run the app
CMD ["python", "main.py"] 