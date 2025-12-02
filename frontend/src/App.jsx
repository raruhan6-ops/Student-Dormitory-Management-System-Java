import { useState } from 'react'
import './App.css'
import StudentList from './components/StudentList'

function App() {
  return (
    <div className="App">
      <h1>Student Dormitory Management System</h1>
      <StudentList />
    </div>
  )
}

export default App
