-- SQL DDL Migration for Real-time Chat features (MySQL Compatible)

-- 1. Create Friendships table
CREATE TABLE IF NOT EXISTS friendships (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT NOT NULL,
    addressee_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    company_id BIGINT NULL,
    created_at DATETIME NOT NULL,
    CONSTRAINT fk_friendships_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friendships_addressee FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_requester_addressee UNIQUE (requester_id, addressee_id)
);

-- 2. Create Chat Room Members table
CREATE TABLE IF NOT EXISTS chat_room_members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER',
    joined_at DATETIME NOT NULL,
    CONSTRAINT fk_crm_room FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_crm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_room_user UNIQUE (room_id, user_id)
);

-- 3. Update Chat Rooms table with new columns
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'PRIVATE';
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS project_id BIGINT NULL;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS department_id BIGINT NULL;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS company_id BIGINT NULL;

-- Add Foreign Key constraint for Project Chat Rooms
ALTER TABLE chat_rooms 
ADD CONSTRAINT fk_rooms_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Add Foreign Key constraint for Department Chat Rooms
ALTER TABLE chat_rooms 
ADD CONSTRAINT fk_rooms_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE;

-- 4. Update Chat Messages table with attachment, read state, and recall columns
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_recalled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS seen_at DATETIME NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255) NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type VARCHAR(100) NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_size BIGINT NULL;
