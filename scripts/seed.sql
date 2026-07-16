-- Lumen LMS — minimal demo seed (run AFTER scripts/schema.sql or migrate deploy).
-- All three accounts use the password: Password123!
-- Safe to re-run: ON CONFLICT DO NOTHING.

INSERT INTO "User" ("id","email","name","role","status","passwordHash","createdAt","updatedAt")
VALUES
  ('usr_admin_seed','admin@example.com','Alex Diaz','ADMIN','ACTIVE','$2a$10$pEmMQi58K9NzaQ.ijLhyCeV3cHK3HSsODAocCoezCwuspMgpgwywK',NOW(),NOW()),
  ('usr_instr_seed','instructor@example.com','Maya Reyes','INSTRUCTOR','ACTIVE','$2a$10$pEmMQi58K9NzaQ.ijLhyCeV3cHK3HSsODAocCoezCwuspMgpgwywK',NOW(),NOW()),
  ('usr_stud_seed','student@example.com','Jordan Tan','STUDENT','ACTIVE','$2a$10$pEmMQi58K9NzaQ.ijLhyCeV3cHK3HSsODAocCoezCwuspMgpgwywK',NOW(),NOW())
ON CONFLICT ("email") DO NOTHING;

INSERT INTO "Category" ("id","name","slug","description","createdAt")
VALUES ('cat_data_seed','Data & Analytics','data-analytics','Learn to turn data into decisions.',NOW())
ON CONFLICT ("slug") DO NOTHING;
