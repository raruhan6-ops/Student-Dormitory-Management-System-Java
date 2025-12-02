-- Create Database
CREATE DATABASE IF NOT EXISTS dormitory_system;
USE dormitory_system;

-- 1. Student Table
CREATE TABLE IF NOT EXISTS Student (
    StudentID      VARCHAR(20) PRIMARY KEY,
    Name           VARCHAR(50) NOT NULL,
    Gender         VARCHAR(10),
    Major          VARCHAR(100),
    Class          VARCHAR(50),
    EnrollmentYear INT,
    Phone          VARCHAR(20),
    DormBuilding   VARCHAR(50),
    RoomNumber     VARCHAR(20),
    BedNumber      VARCHAR(20)
);

-- 2. DormBuilding Table
CREATE TABLE IF NOT EXISTS DormBuilding (
    BuildingID   INT PRIMARY KEY AUTO_INCREMENT,
    BuildingName VARCHAR(50) NOT NULL,
    Location     VARCHAR(100),
    ManagerName  VARCHAR(50),
    ManagerPhone VARCHAR(20)
);

-- 3. Room Table
CREATE TABLE IF NOT EXISTS Room (
    RoomID           INT PRIMARY KEY AUTO_INCREMENT,
    BuildingID       INT NOT NULL,
    RoomNumber       VARCHAR(20) NOT NULL,
    Capacity         INT NOT NULL,
    CurrentOccupancy INT NOT NULL DEFAULT 0,
    RoomType         VARCHAR(50),
    FOREIGN KEY (BuildingID) REFERENCES DormBuilding(BuildingID) ON DELETE CASCADE
);

-- 4. Bed Table
CREATE TABLE IF NOT EXISTS Bed (
    BedID     INT PRIMARY KEY AUTO_INCREMENT,
    RoomID    INT NOT NULL,
    BedNumber VARCHAR(10) NOT NULL,
    Status    VARCHAR(20) DEFAULT 'Available', -- Available, Occupied
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID) ON DELETE CASCADE
);

-- 5. CheckInOut Table
CREATE TABLE IF NOT EXISTS CheckInOut (
    RecordID     INT PRIMARY KEY AUTO_INCREMENT,
    StudentID    VARCHAR(20) NOT NULL,
    BedID        INT NOT NULL,
    CheckInDate  DATE NOT NULL,
    CheckOutDate DATE,
    Status       VARCHAR(20) DEFAULT 'CurrentlyLiving', -- CurrentlyLiving, CheckedOut
    FOREIGN KEY (StudentID) REFERENCES Student(StudentID),
    FOREIGN KEY (BedID) REFERENCES Bed(BedID)
);

-- 6. RepairRequest Table
CREATE TABLE IF NOT EXISTS RepairRequest (
    RepairID           INT PRIMARY KEY AUTO_INCREMENT,
    RoomID             INT NOT NULL,
    SubmitterStudentID VARCHAR(20) NOT NULL,
    Description        TEXT,
    SubmitTime         DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status             VARCHAR(20) DEFAULT 'Pending', -- Pending, Finished
    Handler            VARCHAR(50),
    FinishTime         DATETIME,
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID),
    FOREIGN KEY (SubmitterStudentID) REFERENCES Student(StudentID)
);

-- 7. UserAccount Table
CREATE TABLE IF NOT EXISTS UserAccount (
    UserID          INT PRIMARY KEY AUTO_INCREMENT,
    Username        VARCHAR(50) UNIQUE NOT NULL,
    PasswordHash    VARCHAR(255) NOT NULL,
    Role            VARCHAR(20) NOT NULL, -- Student, DormManager, Admin
    RelatedStudentID VARCHAR(20),
    FOREIGN KEY (RelatedStudentID) REFERENCES Student(StudentID)
);

-- Insert some sample data
INSERT INTO DormBuilding (BuildingName, Location, ManagerName, ManagerPhone) VALUES 
('Building A', 'North Campus', 'Mr. Zhang', '13900000001'),
('Building B', 'South Campus', 'Ms. Li', '13900000002');

INSERT INTO Room (BuildingID, RoomNumber, Capacity, RoomType) VALUES 
(1, '101', 4, 'Undergraduate'),
(1, '102', 4, 'Undergraduate'),
(2, '201', 2, 'Graduate');

INSERT INTO Bed (RoomID, BedNumber) VALUES 
(1, '1'), (1, '2'), (1, '3'), (1, '4'),
(2, '1'), (2, '2'), (2, '3'), (2, '4'),
(3, '1'), (3, '2');

INSERT INTO UserAccount (Username, PasswordHash, Role) VALUES 
('admin', 'admin123', 'Admin'),
('manager', 'manager123', 'DormManager');
