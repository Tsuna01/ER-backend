# ใช้ Node.js เป็น base image
FROM node:18-alpine

# กำหนด working directory
WORKDIR /app

# Copy package.json และ package-lock.json
COPY package*.json ./

# ติดตั้ง dependencies
RUN npm install

# Copy source code ที่เหลือ
COPY . .

# Build โปรเจกต์ NestJS
RUN npm run build

# เปิดพอร์ตที่แอปพลิเคชันรัน
EXPOSE 3000

# รันแอปพลิเคชัน
CMD ["npm", "run", "start:prod"]