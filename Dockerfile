
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the React app
RUN npm run build

# Expose the port
EXPOSE 3001

# Run the combined application
CMD ["npm", "start"]
