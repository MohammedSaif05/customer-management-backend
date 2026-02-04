# Postman API Reference – Employee Management Backend

**Base URL:** `http://localhost:5000`

**Auth (protected routes):** Add header:
```
Authorization: Bearer <accessToken>
```

Get `accessToken` from `POST /api/auth/login` response.

---

## Health

| Method | URL | Auth | Body |
|--------|-----|------|------|
| GET | `http://localhost:5000/health` | No | — |

---

## Auth

| Method | URL | Auth | Body |
|--------|-----|------|------|
| POST | `http://localhost:5000/api/auth/login` | No | See below |
| POST | `http://localhost:5000/api/auth/refresh` | No | See below |
| POST | `http://localhost:5000/api/auth/forgot-password` | No | See below |
| POST | `http://localhost:5000/api/auth/reset-password` | No | See below |
| POST | `http://localhost:5000/api/auth/logout` | No | Optional body below |

### POST /api/auth/login
```json
{
  "email": "admin@company.com",
  "password": "Admin@123"
}
```

### POST /api/auth/refresh
```json
{
  "refreshToken": "paste_refresh_token_here"
}
```
Or header: `x-refresh-token: <refreshToken>`

### POST /api/auth/forgot-password
```json
{
  "email": "user@company.com"
}
```

### POST /api/auth/reset-password
```json
{
  "token": "reset_token_from_email_link",
  "password": "NewSecurePass@123"
}
```

### POST /api/auth/logout (optional body)
```json
{
  "refreshToken": "paste_refresh_token_here"
}
```
Or header: `x-refresh-token: <refreshToken>`

---

## Users

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| GET | `http://localhost:5000/api/users/employees` | Yes | **Employees only** (no ADMIN/MANAGER). Query: `page`, `limit`, `search` – use for dropdowns. |
| GET | `http://localhost:5000/api/users` | Yes | Query: `page`, `limit`, `search`, `role`, `active` |
| POST | `http://localhost:5000/api/users` | Yes (ADMIN) | See below |
| GET | `http://localhost:5000/api/users/:id` | Yes | — |
| PATCH | `http://localhost:5000/api/users/:id` | Yes | See below |
| POST | `http://localhost:5000/api/users/:id/deactivate` | Yes (ADMIN/MANAGER) | — |
| POST | `http://localhost:5000/api/users/:id/set-password` | Yes (ADMIN/MANAGER) | See below – assign/reset password, optionally email it |
| GET | `http://localhost:5000/api/users/:userId/profile` | Yes | — |
| PATCH | `http://localhost:5000/api/users/:userId/profile` | Yes | See below |

### GET /api/users (query params)
- `page` (number, optional)
- `limit` (number, optional, max 100)
- `search` (string, optional) – search name, email, employeeId, department, designation
- `role` – `ADMIN` | `MANAGER` | `EMPLOYEE`
- `active` – `false` to include inactive users

Example (all users): `http://localhost:5000/api/users?limit=500`  
Example (employees only, for dropdown): `http://localhost:5000/api/users/employees?limit=500`

### POST /api/users
```json
{
  "name": "New Employee",
  "email": "new@company.com",
  "password": "TempPass@123",
  "role": "EMPLOYEE",
  "employeeId": "EMP010",
  "department": "Engineering",
  "designation": "Developer",
  "sendEmail": true
}
```
- **password** optional: if omitted, a random one is generated.
- **sendEmail** optional: if `true`, the user receives an email with their password.
- **Response 201** includes `initialPassword` (the plain password used) so you can show/copy it. Use it to log in as that user.

### POST /api/users/:id/set-password (assign or reset password)
```json
{
  "newPassword": "NewSecurePass@123",
  "sendEmail": true
}
```
- **newPassword** required, min 6 characters.
- **sendEmail** optional: if `true`, the user receives an email with the new password.
- Response returns `newPassword` so you can share it if email is not configured.

### PATCH /api/users/:id
```json
{
  "name": "Updated Name",
  "email": "updated@company.com",
  "role": "EMPLOYEE",
  "employeeId": "EMP010",
  "department": "IT",
  "designation": "Senior Dev",
  "isActive": true
}
```

### PATCH /api/users/:userId/profile
```json
{
  "dateOfBirth": "1990-01-15",
  "gender": "Male",
  "phone": "+919876543210",
  "address": "City, Country",
  "bloodGroup": "O+",
  "maritalStatus": "Single",
  "nationality": "Indian",
  "emergencyContacts": [
    { "name": "Jane", "relationship": "Spouse", "phone": "+919876543211" }
  ],
  "skills": ["JavaScript", "Node.js"],
  "qualifications": [
    { "institution": "ABC University", "degree": "B.Tech", "year": 2012 }
  ]
}
```

---

## Tasks

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| GET | `http://localhost:5000/api/tasks` | Yes | Query: `page`, `limit`, `sort`, `assignedTo`, `project`, `status`, `priority` |
| POST | `http://localhost:5000/api/tasks` | Yes | See below |
| GET | `http://localhost:5000/api/tasks/:id` | Yes | — |
| PATCH | `http://localhost:5000/api/tasks/:id` | Yes | See below |
| PATCH | `http://localhost:5000/api/tasks/:id/status` | Yes | See below |
| DELETE | `http://localhost:5000/api/tasks/:id` | Yes | — |
| POST | `http://localhost:5000/api/tasks/bulk/status` | Yes | See below |
| POST | `http://localhost:5000/api/tasks/:id/comments` | Yes | See below |
| POST | `http://localhost:5000/api/tasks/:id/attachments` | Yes | multipart: field `files`, max 5 files |

### POST /api/tasks
```json
{
  "title": "New task",
  "description": "Optional description",
  "priority": "Medium",
  "deadline": "2025-03-01T10:00:00.000Z",
  "assignedTo": "69817d4dec5a38004d995945",
  "assignToAll": false,
  "project": null
}
```
Only `title` is required. Others can be omitted or `null`.

### PATCH /api/tasks/:id
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "assignedTo": "69817d4dec5a38004d995945",
  "priority": "High",
  "status": "InProgress",
  "deadline": "2025-03-15T00:00:00.000Z",
  "project": null,
  "progressPercent": 50
}
```

### PATCH /api/tasks/:id/status
```json
{
  "status": "Done"
}
```
`status`: `ToDo` | `InProgress` | `Done`

### POST /api/tasks/bulk/status
```json
{
  "taskIds": ["6981c8b076d0529dd38ca540", "69817d4eec5a38004d995947"],
  "status": "Done"
}
```

### POST /api/tasks/:id/comments
```json
{
  "text": "Comment text here"
}
```

### POST /api/tasks/:id/attachments
- **Content-Type:** `multipart/form-data`
- **Body:** form field `files` – select 1–5 files (max 10MB each)

---

## Projects

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| GET | `http://localhost:5000/api/projects` | Yes | Query: `page`, `limit`, `search`, `active` |
| POST | `http://localhost:5000/api/projects` | Yes (ADMIN/MANAGER) | See below |
| GET | `http://localhost:5000/api/projects/:id` | Yes | — |
| GET | `http://localhost:5000/api/projects/:id/gantt` | Yes | — |
| PATCH | `http://localhost:5000/api/projects/:id` | Yes | See below |
| DELETE | `http://localhost:5000/api/projects/:id` | Yes | — (soft delete) |

### POST /api/projects
```json
{
  "name": "New Project",
  "description": "Project description",
  "department": "Engineering",
  "startDate": "2025-02-01",
  "endDate": "2025-06-30",
  "dependencies": [],
  "ganttMetadata": {}
}
```

### PATCH /api/projects/:id
```json
{
  "name": "Updated name",
  "description": "Updated",
  "department": "Engineering",
  "startDate": "2025-02-01",
  "endDate": "2025-07-31",
  "dependencies": [],
  "ganttMetadata": {},
  "isActive": true
}
```

---

## Leave

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| POST | `http://localhost:5000/api/leaves` | Yes | See below |
| GET | `http://localhost:5000/api/leaves` | Yes | Query: `page`, `limit`, `status`, `employee` |
| GET | `http://localhost:5000/api/leaves/balance` | Yes | Query: `year` (optional) |
| GET | `http://localhost:5000/api/leaves/balance/:userId` | Yes | Query: `year` (optional) |
| GET | `http://localhost:5000/api/leaves/:id` | Yes | — |
| PATCH | `http://localhost:5000/api/leaves/:id/approve` | Yes (ADMIN/MANAGER) | See below |

### POST /api/leaves
```json
{
  "leaveType": "Casual",
  "fromDate": "2025-02-10",
  "toDate": "2025-02-12",
  "reason": "Personal",
  "employeeId": "69817d4dec5a38004d995945"
}
```
`employeeId` optional for Admin/Manager; omit for self.  
`leaveType`: Sick | Casual | Earned | Maternity | Paternity | Unpaid | Other

### PATCH /api/leaves/:id/approve
```json
{
  "action": "approve"
}
```
Or reject:
```json
{
  "action": "reject",
  "rejectionReason": "Not enough balance"
}
```

---

## Payroll

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| GET | `http://localhost:5000/api/payroll` | Yes | Query: `page`, `limit`, `employee`, `month`, `year` |
| POST | `http://localhost:5000/api/payroll/generate` | Yes (ADMIN/MANAGER) | See below |
| GET | `http://localhost:5000/api/payroll/ytd` | Yes | Query: `year` (optional) |
| GET | `http://localhost:5000/api/payroll/ytd/:employeeId` | Yes | Query: `year` (optional) |
| GET | `http://localhost:5000/api/payroll/:id` | Yes | — |
| GET | `http://localhost:5000/api/payroll/:id/download` | Yes | — (returns PDF file) |

### POST /api/payroll/generate
```json
{
  "employeeId": "69817d4dec5a38004d995945",
  "month": 1,
  "year": 2025,
  "basicSalary": 50000,
  "allowances": { "HRA": 10000, "Transport": 2000 },
  "deductions": { "Tax": 5000, "PF": 3000 }
}
```

---

## Attendance

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| POST | `http://localhost:5000/api/attendance/clock-in` | Yes | See below |
| POST | `http://localhost:5000/api/attendance/clock-out` | Yes | — |
| GET | `http://localhost:5000/api/attendance` | Yes | Query: `page`, `limit`, `employee`, `from`, `to` |
| GET | `http://localhost:5000/api/attendance/:id` | Yes | — |
| POST | `http://localhost:5000/api/attendance/:id/approve` | Yes (ADMIN/MANAGER) | — |

### POST /api/attendance/clock-in
```json
{
  "location": "Office"
}
```
Body optional.

---

## Reimbursements

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| POST | `http://localhost:5000/api/reimbursements` | Yes | See below |
| GET | `http://localhost:5000/api/reimbursements` | Yes | Query: `page`, `limit`, `status`, `employee` |
| GET | `http://localhost:5000/api/reimbursements/:id` | Yes | — |
| PATCH | `http://localhost:5000/api/reimbursements/:id/action` | Yes (ADMIN/MANAGER) | See below |

### POST /api/reimbursements
**Option A – JSON:**
```json
{
  "amount": 5000,
  "description": "Travel expense"
}
```

**Option B – multipart/form-data:**  
Same fields + file field `receipts` (max 5 files, 10MB each).

### PATCH /api/reimbursements/:id/action
```json
{
  "action": "approve"
}
```
Or:
```json
{
  "action": "reject",
  "rejectionReason": "Missing receipts"
}
```
Or:
```json
{
  "action": "paid"
}
```

---

## Announcements

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| GET | `http://localhost:5000/api/announcements` | Yes | Query: `page`, `limit`, `pinned`, `expired` |
| POST | `http://localhost:5000/api/announcements` | Yes (ADMIN/MANAGER) | See below |
| GET | `http://localhost:5000/api/announcements/:id` | Yes | — |
| PATCH | `http://localhost:5000/api/announcements/:id` | Yes (ADMIN/MANAGER) | See below |
| DELETE | `http://localhost:5000/api/announcements/:id` | Yes (ADMIN/MANAGER) | — |

### POST /api/announcements
```json
{
  "title": "Holiday notice",
  "message": "Office closed on 26 Jan.",
  "visibleTo": ["ALL"],
  "isPinned": true,
  "expiresAt": "2025-02-28T00:00:00.000Z"
}
```
`visibleTo`: array of `ADMIN` | `MANAGER` | `EMPLOYEE` | `ALL`. Default `["ALL"]`.

### PATCH /api/announcements/:id
```json
{
  "title": "Updated title",
  "message": "Updated message",
  "visibleTo": ["ADMIN", "MANAGER", "EMPLOYEE"],
  "isPinned": false,
  "expiresAt": "2025-03-31T00:00:00.000Z"
}
```

---

## Reports

| Method | URL | Auth | Body / Query |
|--------|-----|------|--------------|
| GET | `http://localhost:5000/api/reports/attendance` | Yes | Query: `from`, `to`, `employeeId` |
| GET | `http://localhost:5000/api/reports/payroll` | Yes | Query: `year`, `month`, `employeeId` |
| GET | `http://localhost:5000/api/reports/leave` | Yes | Query: `from`, `to`, `employeeId`, `status` |

Example:  
`http://localhost:5000/api/reports/attendance?from=2025-01-01&to=2025-01-31`

---

## Quick copy – login then use token

1. **Login (get token)**  
   - **POST** `http://localhost:5000/api/auth/login`  
   - **Body (raw JSON):**
   ```json
   {
     "email": "admin@company.com",
     "password": "Admin@123"
   }
   ```
   - Copy `accessToken` from the response.

2. **Use token in other requests**  
   - **Headers:**  
   - Key: `Authorization`  
   - Value: `Bearer <paste_accessToken_here>`

3. **Example – list users**  
   - **GET** `http://localhost:5000/api/users?limit=500`  
   - Add header: `Authorization: Bearer <accessToken>`

4. **Example – create task**  
   - **POST** `http://localhost:5000/api/tasks`  
   - **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`  
   - **Body (raw JSON):**
   ```json
   {
     "title": "Test task from Postman",
     "description": "Optional",
     "priority": "Medium",
     "assignedTo": "69817d4dec5a38004d995945"
   }
   ```

Replace IDs like `69817d4dec5a38004d995945` with real `_id` values from your GET /api/users or GET /api/tasks response.
