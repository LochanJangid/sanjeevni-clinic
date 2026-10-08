import bcrypt
from database.connection import Database

def run_migration():
    db = Database()
    print("Running production-grade migration...")

    # 1. Add doctor_key to doctors and users
    with db.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                ALTER TABLE doctors ADD COLUMN IF NOT EXISTS doctor_key VARCHAR(64) UNIQUE;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_key VARCHAR(64) UNIQUE;
                CREATE INDEX IF NOT EXISTS idx_doctors_doctor_key ON doctors(doctor_key);
                CREATE INDEX IF NOT EXISTS idx_users_doctor_key ON users(doctor_key);
            """)

            # 2. Create high-throughput indexed chat tables for lakhs of users
            cur.execute("""
                CREATE TABLE IF NOT EXISTS chat_conversations (
                    id SERIAL PRIMARY KEY,
                    user_id INT REFERENCES users(id) ON DELETE SET NULL,
                    session_id VARCHAR(100) NOT NULL,
                    title VARCHAR(255) DEFAULT 'Medical Inquiry',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON chat_conversations(user_id);
                CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON chat_conversations(session_id);

                CREATE TABLE IF NOT EXISTS chat_messages (
                    id SERIAL PRIMARY KEY,
                    conversation_id INT REFERENCES chat_conversations(id) ON DELETE CASCADE,
                    sender VARCHAR(20) NOT NULL,
                    message TEXT NOT NULL,
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_time ON chat_messages(conversation_id, timestamp);
            """)

            # 3. Create or update admin user: username='lochan', password='admin', role='admin'
            admin_pwd_hash = bcrypt.hashpw(b"admin", bcrypt.gensalt()).decode("utf-8")
            
            # Check if user 'lochan' exists
            cur.execute("SELECT id FROM users WHERE username = 'lochan'")
            existing_lochan = cur.fetchone()
            if existing_lochan:
                cur.execute("""
                    UPDATE users 
                    SET password_hash = %s, role = 'admin', email = 'lochan@sanjeevni.com'
                    WHERE username = 'lochan'
                """, (admin_pwd_hash,))
                print("Updated existing user 'lochan' to admin with password 'admin'")
            else:
                cur.execute("""
                    INSERT INTO users (username, email, password_hash, role)
                    VALUES ('lochan', 'lochan@sanjeevni.com', %s, 'admin')
                """, (admin_pwd_hash,))
                print("Created admin user 'lochan' with password 'admin'")

            # Also ensure 'admin' user has password 'admin'
            cur.execute("SELECT id FROM users WHERE username = 'admin'")
            existing_admin = cur.fetchone()
            if existing_admin:
                cur.execute("""
                    UPDATE users
                    SET password_hash = %s, role = 'admin'
                    WHERE username = 'admin'
                """, (admin_pwd_hash,))

            # 4. Assign default doctor keys to existing doctors and sync users table
            doctors = cur.execute("SELECT id, name FROM doctors ORDER BY id ASC").fetchall()
            default_keys = {
                1: "DOC-SHARMA-101",
                2: "DOC-VERMA-102",
                3: "DOC-GUPTA-103",
                4: "DOC-ROY-104",
                5: "DOC-SETHI-105",
                6: "DOC-IYER-106",
                7: "DOC-PATEL-107",
            }

            for doc in doctors:
                doc_id = doc[0]
                doc_name = doc[1]
                key = default_keys.get(doc_id, f"DOC-KEY-{doc_id + 100}")
                
                # Update doctors table
                cur.execute("UPDATE doctors SET doctor_key = %s WHERE id = %s", (key, doc_id))
                
                # Ensure doctor user exists in users table with role 'doctor', doctor_id, and doctor_key
                cur.execute("SELECT id FROM users WHERE doctor_id = %s", (doc_id,))
                doc_user = cur.fetchone()
                clean_username = "dr." + doc_name.lower().replace("dr. ", "").replace("dr.", "").replace(" ", "").strip()
                doc_email = f"{clean_username}@sanjeevni.com"
                
                if doc_user:
                    cur.execute("""
                        UPDATE users 
                        SET doctor_key = %s, role = 'doctor'
                        WHERE id = %s
                    """, (key, doc_user[0]))
                else:
                    cur.execute("""
                        INSERT INTO users (username, email, password_hash, role, doctor_id, doctor_key)
                        VALUES (%s, %s, %s, 'doctor', %s, %s)
                        ON CONFLICT (username) DO UPDATE 
                        SET doctor_key = EXCLUDED.doctor_key, doctor_id = EXCLUDED.doctor_id, role = 'doctor'
                    """, (clean_username, doc_email, admin_pwd_hash, doc_id, key))
                
                print(f"Doctor ID {doc_id} ({doc_name}) configured with Access Key: {key}")

            conn.commit()
    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
