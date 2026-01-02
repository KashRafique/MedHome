# MongoDB Collection Import Guide

## 📋 Available Collections (18 total)

1. `blogs`
2. `categories`
3. `courses`
4. `enrollments`
5. `loginhistories`
6. `payments`
7. `paypalorders`
8. `publicaichatconversations`
9. `questions`
10. `quizattempts`
11. `quizzes`
12. `tags`
13. `users`
14. `vouchers`
15. `voucherusages`
16. `whatsappconversations`

## 🚀 Import Methods

### Method 1: Using mongorestore (Command Line) - Recommended

**Prerequisites:**
- MongoDB must be installed and running
- `mongorestore` tool must be available in your PATH
- Know your MongoDB connection string (e.g., `mongodb://localhost:27017/medhome`)

**Basic Command Format:**
```bash
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=<collection_name> --db=medhome "C:\Users\lenovo\Downloads\lms_backup"
```

**Import Each Collection One by One:**

```bash
# 1. Blogs
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=blogs --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 2. Categories
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=categories --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 3. Courses
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=courses --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 4. Enrollments
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=enrollments --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 5. Login Histories
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=loginhistories --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 6. Payments
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=payments --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 7. PayPal Orders
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=paypalorders --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 8. Public AI Chat Conversations
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=publicaichatconversations --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 9. Questions
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=questions --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 10. Quiz Attempts
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=quizattempts --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 11. Quizzes
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=quizzes --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 12. Tags
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=tags --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 13. Users
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=users --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 14. Vouchers
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=vouchers --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 15. Voucher Usages
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=voucherusages --db=medhome "C:\Users\lenovo\Downloads\lms_backup"

# 16. WhatsApp Conversations
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=whatsappconversations --db=medhome "C:\Users\lenovo\Downloads\lms_backup"
```

**If you need authentication:**
```bash
mongorestore --uri="mongodb://username:password@localhost:27017/medhome" --collection=<collection_name> --db=medhome "C:\Users\lenovo\Downloads\lms_backup"
```

**If you want to drop existing collections before importing:**
```bash
mongorestore --uri="mongodb://localhost:27017/medhome" --collection=<collection_name> --db=medhome --drop "C:\Users\lenovo\Downloads\lms_backup"
```

### Method 2: Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to your database
3. Select the target database (e.g., `medhome`)
4. Click on the database name
5. Click "Import Data" or "Add Data" → "Import File"
6. Select the `.bson` file for the collection (e.g., `blogs.bson`)
7. Choose "BSON" as the file type
8. Click "Import"
9. Repeat for each collection

### Method 3: Import All Collections at Once

If you want to import everything at once:

```bash
mongorestore --uri="mongodb://localhost:27017/medhome" --db=medhome "C:\Users\lenovo\Downloads\lms_backup"
```

This will import all collections from the backup folder.

## ⚠️ Important Notes

1. **Database Name**: Replace `medhome` with your actual database name if different
2. **Connection String**: Adjust the URI if your MongoDB is on a different host/port
3. **Existing Data**: By default, `mongorestore` will merge with existing data. Use `--drop` to replace existing collections
4. **Order Matters**: Some collections may have dependencies (e.g., `users` before `enrollments`). Import in this order:
   - Users, Categories, Tags (base data)
   - Courses, Quizzes, Questions (content)
   - Enrollments, Payments, PayPal Orders (transactions)
   - Login Histories, Voucher Usages (activity logs)
   - Blogs, WhatsApp Conversations, Public AI Chat Conversations (communications)
   - Vouchers (can be imported anytime)

## 🔍 Verify Import

After importing, verify in MongoDB Compass or shell:

```javascript
// Check collection count
db.blogs.countDocuments()
db.courses.countDocuments()
db.users.countDocuments()
// etc.
```

## 📝 Troubleshooting

- **"mongorestore is not recognized"**: Add MongoDB bin directory to your PATH or use full path
- **"Authentication failed"**: Check your username/password in the connection string
- **"Connection refused"**: Ensure MongoDB is running
- **"Database not found"**: MongoDB will create the database automatically if it doesn't exist














