# Student Marks Management System

A Node.js backend system that connects to your existing student dashboard to automatically save and fetch student marks from the `student_marks.json` file.

## Features

- 🔄 **Automatic Mark Updates**: Marks are automatically saved to `student_marks.json` and fetched for students
- 📊 **Real-time Data**: Students see their latest marks with auto-refresh functionality
- 🎯 **Simple API**: Easy-to-use REST API endpoints for mark management
- 🔐 **Student Authentication**: Secure login using email and roll number
- 📱 **Responsive**: Works with your existing student dashboard

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

### 3. Access Your Application

- **Frontend**: http://localhost:3000/
- **API Documentation**: http://localhost:3000/api/health

## API Endpoints

### Student Authentication
- `POST /api/auth/student` - Login with email and roll number

### Student Data
- `GET /api/students` - Get all students
- `GET /api/students/:rollNo` - Get specific student

### Marks Management
- `GET /api/marks` - Get all marks
- `GET /api/marks/:rollNo` - Get marks for specific student
- `PUT /api/marks/:rollNo` - Update all marks for a student
- `PATCH /api/marks/:rollNo/:subject` - Update specific subject marks

### Health Check
- `GET /api/health` - Server status

## How It Works

1. **Student Login**: Students login using their email and roll number
2. **Mark Fetching**: Dashboard automatically fetches latest marks from the server
3. **Auto-refresh**: Marks are refreshed every 30 seconds to show latest updates
4. **Data Persistence**: All marks are saved to `student_marks.json` file
5. **Real-time Updates**: When teachers update marks, students see them immediately

## File Structure

```
├── server.js              # Main Node.js server
├── package.json           # Dependencies and scripts
├── students.json          # Student data
├── student_marks.json     # Marks data (auto-updated)
├── studentdashboard.html  # Student dashboard (updated to use API)
├── auth.js               # Authentication system (updated)
└── README.md             # This file
```

## Development

### Start Development Server (with auto-restart)
```bash
npm run dev
```

### Environment Variables
- `PORT`: Server port (default: 3000)

## Usage Examples

### Login Request
```javascript
fetch('/api/auth/student', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@vaagdevi.edu.in',
    password: '23641A6601'
  })
})
```

### Get Student Marks
```javascript
fetch('/api/marks/23641A6601')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Update Marks
```javascript
fetch('/api/marks/23641A6601', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subjects: {
      'Machine Learning': {
        mid1: '85',
        mid2: '90',
        average: '87.5'
      }
    }
  })
})
```

## Troubleshooting

### Server Won't Start
- Make sure Node.js is installed (version 14 or higher)
- Run `npm install` to install dependencies
- Check if port 3000 is available

### Marks Not Updating
- Check browser console for errors
- Verify server is running on correct port
- Ensure `student_marks.json` file exists and is writable

### Authentication Issues
- Verify student email exists in `students.json`
- Check that password matches roll number exactly
- Ensure server is running before login attempts

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all files are in the correct location
3. Ensure Node.js and npm are properly installed
4. Check that the server is running on the correct port

## License

MIT License - Feel free to modify and use as needed.
