// Student Authentication System
// Connects to Node.js API for login and data retrieval

class StudentAuth {
    constructor() {
        this.currentStudent = null;
        this.apiBaseUrl = window.location.origin + '/api';
        this.dataLoaded = true; // API is always available
    }

    // Authenticate student using email and roll number as password
    async authenticateStudent(email, password) {
        console.log('Attempting login with email:', email);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentStudent = result.data;
                // Store in session storage
                sessionStorage.setItem('currentStudent', JSON.stringify(result.data));
                console.log('Login successful for:', result.data.name);
                
                return {
                    success: true,
                    message: 'Login successful',
                    student: result.data
                };
            } else {
                console.log('Login failed:', result.message);
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error. Please check if server is running.' };
        }
    }

    // Get current logged-in student
    getCurrentStudent() {
        if (this.currentStudent) {
            return this.currentStudent;
        }
        
        // Try to get from session storage
        const storedStudent = sessionStorage.getItem('currentStudent');
        if (storedStudent) {
            this.currentStudent = JSON.parse(storedStudent);
            return this.currentStudent;
        }
        
        return null;
    }

    // Get student marks by roll number
    async getStudentMarks(rollNo) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/marks/${rollNo}`);
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to fetch marks:', result.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching marks:', error);
            return null;
        }
    }

    // Update student marks
    async updateStudentMarks(rollNo, subjectMarks) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/marks/${rollNo}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subjects: subjectMarks })
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log('Marks updated successfully');
                return result.data;
            } else {
                console.error('Failed to update marks:', result.message);
                return null;
            }
        } catch (error) {
            console.error('Error updating marks:', error);
            return null;
        }
    }

    // Logout function
    logout() {
        this.currentStudent = null;
        sessionStorage.removeItem('currentStudent');
        return { success: true, message: 'Logged out successfully' };
    }

    // Search students by name or roll number
    async searchStudents(query) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/students`);
            const result = await response.json();
            
            if (result.success) {
                const lowerQuery = query.toLowerCase();
                return result.data.filter(student => 
                    student.name.toLowerCase().includes(lowerQuery) ||
                    student.roll_no.toLowerCase().includes(lowerQuery) ||
                    student.email.toLowerCase().includes(lowerQuery)
                );
            }
            return [];
        } catch (error) {
            console.error('Error searching students:', error);
            return [];
        }
    }

    // Get students by section
    async getStudentsBySection(section) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/students`);
            const result = await response.json();
            
            if (result.success) {
                return result.data.filter(s => s.section === section);
            }
            return [];
        } catch (error) {
            console.error('Error getting students by section:', error);
            return [];
        }
    }

    // Validate student exists
    async validateStudent(rollNo) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/students/${rollNo}`);
            const result = await response.json();
            
            if (result.success) {
                return { valid: true, student: result.data };
            } else {
                return { valid: false, message: 'Student not found' };
            }
        } catch (error) {
            console.error('Error validating student:', error);
            return { valid: false, message: 'Network error' };
        }
    }
}

// Global instance
let studentAuth;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    studentAuth = new StudentAuth();
});

// Login form handler function (to be called from HTML forms)
async function handleStudentLogin(email, password) {
    if (!studentAuth) {
        alert('System not ready. Please wait and try again.');
        return false;
    }

    try {
        const result = await studentAuth.authenticateStudent(email, password);
        
        if (result.success) {
            alert(`Welcome ${result.student.name}!\nRoll No: ${result.student.roll_no}\nSection: ${result.student.section}`);
            
            // Redirect to dashboard
            window.location.href = 'studentdashboard.html';
            return true;
        } else {
            alert(`Login Failed: ${result.message}`);
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed due to network error. Please check if server is running.');
        return false;
    }
}

// Function to get current student info (for dashboard)
function getCurrentStudentInfo() {
    if (!studentAuth) return null;
    return studentAuth.getCurrentStudent();
}

// Function to get student marks (for dashboard)
async function getStudentMarks(rollNo) {
    if (!studentAuth) return null;
    return await studentAuth.getStudentMarks(rollNo);
}

// Function to logout
function logoutStudent() {
    if (studentAuth) {
        const result = studentAuth.logout();
        if (result.success) {
            alert(result.message);
            window.location.href = 'studentlogin.html';
        }
    }
}

// Function to format marks for display
function formatMarksForDisplay(marksData) {
    if (!marksData || !marksData.Subjects) {
        return '<p>No marks available</p>';
    }

    let html = '<div class="marks-container">';
    html += '<h3>Academic Performance</h3>';
    html += '<table class="marks-table">';
    html += '<thead><tr><th>Subject</th><th>Mid 1</th><th>Mid 2</th><th>Average</th></tr></thead>';
    html += '<tbody>';

    Object.keys(marksData.Subjects).forEach(subject => {
        const marks = marksData.Subjects[subject];
        html += `<tr>
            <td>${subject}</td>
            <td>${marks["Mid 1"]}</td>
            <td>${marks["Mid 2"]}</td>
            <td>${marks.Average}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    return html;
}

// Export for use in other files if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudentAuth };
}
