# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
