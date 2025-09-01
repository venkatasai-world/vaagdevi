const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// File paths
const STUDENTS_FILE = path.join(__dirname, 'students.json');
const MARKS_FILE = path.join(__dirname, 'student_marks.json');

// Helper function to read JSON file
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
}

// Helper function to write JSON file
async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// API Routes

// Get all students
app.get('/api/students', async (req, res) => {
    try {
        const students = await readJsonFile(STUDENTS_FILE);
        if (students) {
            res.json({ success: true, data: students });
        } else {
            res.status(500).json({ success: false, message: 'Failed to read students data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get student by roll number
app.get('/api/students/:rollNo', async (req, res) => {
    try {
        const students = await readJsonFile(STUDENTS_FILE);
        if (!students) {
            return res.status(500).json({ success: false, message: 'Failed to read students data' });
        }

        const student = students.find(s => s.roll_no === req.params.rollNo);
        if (student) {
            res.json({ success: true, data: student });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get all marks
app.get('/api/marks', async (req, res) => {
    try {
        const marks = await readJsonFile(MARKS_FILE);
        if (marks) {
            res.json({ success: true, data: marks });
        } else {
            res.status(500).json({ success: false, message: 'Failed to read marks data' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get marks for specific student
app.get('/api/marks/:rollNo', async (req, res) => {
    try {
        const marks = await readJsonFile(MARKS_FILE);
        if (!marks) {
            return res.status(500).json({ success: false, message: 'Failed to read marks data' });
        }

        const studentMarks = marks.find(m => m["Roll No"] === req.params.rollNo);
        if (studentMarks) {
            res.json({ success: true, data: studentMarks });
        } else {
            res.status(404).json({ success: false, message: 'Marks not found for this student' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update marks for a student
app.put('/api/marks/:rollNo', async (req, res) => {
    try {
        const { subjects } = req.body;
        
        if (!subjects || typeof subjects !== 'object') {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid request. Please provide subjects data.' 
            });
        }

        console.log(`PUT Update marks for ${req.params.rollNo}`, subjects);

        // Read current marks
        let marks = await readJsonFile(MARKS_FILE);
        if (!marks) {
            return res.status(500).json({ success: false, message: 'Failed to read marks data' });
        }

        // Find existing student marks or create new entry
        const existingIndex = marks.findIndex(m => m["Roll No"] === req.params.rollNo);
        
        let marksEntry;
        
        if (existingIndex !== -1) {
            // Student exists - MERGE with existing subjects instead of replacing
            marksEntry = marks[existingIndex];
            if (!marksEntry.Subjects) {
                marksEntry.Subjects = {};
            }
        } else {
            // New student - create fresh entry
            marksEntry = {
                "Roll No": req.params.rollNo,
                "Subjects": {}
            };
        }

        // Process and MERGE subjects data (don't replace existing subjects)
        Object.keys(subjects).forEach(subject => {
            const subjectData = subjects[subject];
            
            // Get existing subject data or create new
            const existingSubject = marksEntry.Subjects[subject] || {
                "Mid 1": "NA",
                "Mid 2": "NA",
                "Average": "NA"
            };
            
            // Merge new data with existing data
            marksEntry.Subjects[subject] = {
                "Mid 1": subjectData.mid1 || subjectData["Mid 1"] || existingSubject["Mid 1"],
                "Mid 2": subjectData.mid2 || subjectData["Mid 2"] || existingSubject["Mid 2"],
                "Average": subjectData.average || subjectData["Average"] || existingSubject["Average"]
            };
        });

        // Update or add marks
        if (existingIndex !== -1) {
            marks[existingIndex] = marksEntry;
        } else {
            marks.push(marksEntry);
        }

        // Write back to file
        const writeSuccess = await writeJsonFile(MARKS_FILE, marks);
        if (writeSuccess) {
            res.json({ 
                success: true, 
                message: 'Marks updated successfully',
                data: marksEntry,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save marks' });
        }
    } catch (error) {
        console.error('Error in PUT /api/marks:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Update specific subject marks for a student
app.patch('/api/marks/:rollNo/:subject', async (req, res) => {
    try {
        const { mid1, mid2, average } = req.body;
        const rollNo = req.params.rollNo;
        const subject = decodeURIComponent(req.params.subject);

        console.log(`Updating marks for ${rollNo}, subject: ${subject}`, { mid1, mid2, average });

        // Read current marks
        let marks = await readJsonFile(MARKS_FILE);
        if (!marks) {
            return res.status(500).json({ success: false, message: 'Failed to read marks data' });
        }

        // Find existing student marks index
        const studentIndex = marks.findIndex(m => m["Roll No"] === rollNo);
        
        if (studentIndex === -1) {
            // Create new student entry if not found
            const newStudent = {
                "Roll No": rollNo,
                "Subjects": {
                    [subject]: {
                        "Mid 1": mid1 !== undefined ? String(mid1) : "NA",
                        "Mid 2": mid2 !== undefined ? String(mid2) : "NA",
                        "Average": average !== undefined ? String(average) : "NA"
                    }
                }
            };
            marks.push(newStudent);
        } else {
            // Update existing student
            if (!marks[studentIndex].Subjects) {
                marks[studentIndex].Subjects = {};
            }
            
            // Get existing subject data or create new
            const existingSubject = marks[studentIndex].Subjects[subject] || {
                "Mid 1": "NA",
                "Mid 2": "NA", 
                "Average": "NA"
            };

            // Update only provided fields
            marks[studentIndex].Subjects[subject] = {
                "Mid 1": mid1 !== undefined ? String(mid1) : existingSubject["Mid 1"],
                "Mid 2": mid2 !== undefined ? String(mid2) : existingSubject["Mid 2"],
                "Average": average !== undefined ? String(average) : existingSubject["Average"]
            };
        }

        // Write back to file
        const writeSuccess = await writeJsonFile(MARKS_FILE, marks);
        if (writeSuccess) {
            const updatedStudent = marks.find(m => m["Roll No"] === rollNo);
            res.json({ 
                success: true, 
                message: `${subject} marks updated successfully for ${rollNo}`,
                data: updatedStudent.Subjects[subject],
                rollNo: rollNo,
                subject: subject,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save marks' });
        }
    } catch (error) {
        console.error('Error updating subject marks:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Simple endpoint to update single subject marks (POST method)
app.post('/api/marks/:rollNo/update', async (req, res) => {
    try {
        const { subject, mid1, mid2, average } = req.body;
        const rollNo = req.params.rollNo;

        if (!subject) {
            return res.status(400).json({ success: false, message: 'Subject name is required' });
        }

        console.log(`POST Update marks for ${rollNo}, subject: ${subject}`, { mid1, mid2, average });

        // Read current marks
        let marks = await readJsonFile(MARKS_FILE);
        if (!marks) {
            return res.status(500).json({ success: false, message: 'Failed to read marks data' });
        }

        // Find existing student marks index
        const studentIndex = marks.findIndex(m => m["Roll No"] === rollNo);
        
        if (studentIndex === -1) {
            // Create new student entry if not found
            const newStudent = {
                "Roll No": rollNo,
                "Subjects": {
                    [subject]: {
                        "Mid 1": mid1 !== undefined ? String(mid1) : "NA",
                        "Mid 2": mid2 !== undefined ? String(mid2) : "NA",
                        "Average": average !== undefined ? String(average) : "NA"
                    }
                }
            };
            marks.push(newStudent);
        } else {
            // Update existing student
            if (!marks[studentIndex].Subjects) {
                marks[studentIndex].Subjects = {};
            }
            
            // Get existing subject data or create new
            const existingSubject = marks[studentIndex].Subjects[subject] || {
                "Mid 1": "NA",
                "Mid 2": "NA", 
                "Average": "NA"
            };

            // Update only provided fields
            marks[studentIndex].Subjects[subject] = {
                "Mid 1": mid1 !== undefined ? String(mid1) : existingSubject["Mid 1"],
                "Mid 2": mid2 !== undefined ? String(mid2) : existingSubject["Mid 2"],
                "Average": average !== undefined ? String(average) : existingSubject["Average"]
            };
        }

        // Write back to file
        const writeSuccess = await writeJsonFile(MARKS_FILE, marks);
        if (writeSuccess) {
            const updatedStudent = marks.find(m => m["Roll No"] === rollNo);
            res.json({ 
                success: true, 
                message: `${subject} marks updated successfully for ${rollNo}`,
                data: updatedStudent.Subjects[subject],
                rollNo: rollNo,
                subject: subject,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to save marks' });
        }
    } catch (error) {
        console.error('Error updating subject marks:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Student authentication endpoint
app.post('/api/auth/student', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        const students = await readJsonFile(STUDENTS_FILE);
        if (!students) {
            return res.status(500).json({ success: false, message: 'Failed to read students data' });
        }

        // Find student by email
        const student = students.find(s => s.email && s.email.toLowerCase() === email.toLowerCase());
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'Student not found with this email' 
            });
        }

        // Check if password matches roll number
        if (student.roll_no === password) {
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    roll_no: student.roll_no,
                    name: student.name,
                    email: student.email,
                    section: student.section,
                    gender: student.gender
                }
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid password. Use your roll number as password.' 
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Student Marks Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
    console.log(`🌐 Frontend available at http://localhost:${PORT}/`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    process.exit(0);
});
