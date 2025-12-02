import { useState } from 'react'
import './App.css'
import StudentList from './components/StudentList'
import DormitoryList from './components/DormitoryList'

function App() {
  const [view, setView] = useState('students');

  return (
    <div className="App">
      <h1>Student Dormitory Management System</h1>
      
      <div className="navigation" style={{ marginBottom: '20px' }}>
        <button onClick={() => setView('students')} disabled={view === 'students'}>
          学生列表 (Student List)
        </button>
        <button onClick={() => setView('dormitories')} disabled={view === 'dormitories'} style={{ marginLeft: '10px' }}>
          宿舍管理 (Dormitory Management)
        </button>
      </div>

      {view === 'students' ? <StudentList /> : <DormitoryList />}
    </div>
  )
}

export default App
