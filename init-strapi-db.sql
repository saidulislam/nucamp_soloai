-- Create SoloAI application database (for SvelteKit app with Prisma and Better Auth)
CREATE DATABASE IF NOT EXISTS soloai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Create SoloAI user and grant privileges
CREATE USER IF NOT EXISTS 'soloai_db_user'@'%' IDENTIFIED BY 'superSecretUserPwd';
GRANT ALL PRIVILEGES ON soloai_db.* TO 'soloai_db_user'@'%';
FLUSH PRIVILEGES;

-- Create Strapi database
CREATE DATABASE IF NOT EXISTS strapi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Create Strapi user and grant privileges
CREATE USER IF NOT EXISTS 'strapi_db_user'@'%' IDENTIFIED BY 'superSecretUserPwd';
GRANT ALL PRIVILEGES ON strapi_db.* TO 'strapi_db_user'@'%';
FLUSH PRIVILEGES;

