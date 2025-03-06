
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the React app
RUN npm install --only=development && \
    npm run build && \
    npm prune --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Create volume for database persistence
VOLUME ["/app/data"]
ENV DB_PATH=/app/data/lynxier.db

# Run the application
CMD ["node", "start.js"]
