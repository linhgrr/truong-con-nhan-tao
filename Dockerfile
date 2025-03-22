FROM python:3.10-slim AS backend

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/
COPY data/ ./data/
COPY models/ ./models/
COPY .env .

# Install Node.js for the frontend
FROM node:18 AS frontend-build

WORKDIR /app/frontend

# Copy and install frontend dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy frontend code and build
COPY frontend/ ./
RUN npm run build

# Final image
FROM python:3.10-slim

WORKDIR /app

# Copy Python dependencies from backend stage
COPY --from=backend /usr/local/lib/python3.10/site-packages/ /usr/local/lib/python3.10/site-packages/
COPY --from=backend /usr/local/bin/ /usr/local/bin/

# Copy backend code
COPY --from=backend /app/ ./

# Copy built frontend from frontend-build stage
COPY --from=frontend-build /app/frontend/build/ ./frontend/build/

# Set working directory to backend
WORKDIR /app/backend

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["python", "main.py"] 