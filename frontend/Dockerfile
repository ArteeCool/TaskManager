FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite listens on 0.0.0.0 inside container
EXPOSE 5173

# Run dev server with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
