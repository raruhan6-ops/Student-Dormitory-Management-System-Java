import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DormitoryList = () => {
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [beds, setBeds] = useState([]);

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        try {
            const response = await axios.get('/api/dormitories');
            setBuildings(response.data);
        } catch (error) {
            console.error('Error fetching buildings:', error);
        }
    };

    const handleBuildingClick = async (building) => {
        setSelectedBuilding(building);
        setSelectedRoom(null);
        setBeds([]);
        try {
            const response = await axios.get(`/api/dormitories/${building.buildingID}/rooms`);
            setRooms(response.data);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        }
    };

    const handleRoomClick = async (room) => {
        setSelectedRoom(room);
        try {
            const response = await axios.get(`/api/dormitories/rooms/${room.roomID}/beds`);
            setBeds(response.data);
        } catch (error) {
            console.error('Error fetching beds:', error);
        }
    };

    return (
        <div className="dormitory-container">
            <h2>宿舍楼管理 (Dormitory Management)</h2>
            
            <div className="layout" style={{ display: 'flex', gap: '20px' }}>
                {/* Buildings List */}
                <div className="column" style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
                    <h3>宿舍楼 (Buildings)</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {buildings.map(building => (
                            <li 
                                key={building.buildingID} 
                                onClick={() => handleBuildingClick(building)}
                                style={{ 
                                    cursor: 'pointer', 
                                    padding: '5px', 
                                    backgroundColor: selectedBuilding?.buildingID === building.buildingID ? '#e0e0e0' : 'transparent' 
                                }}
                            >
                                {building.buildingName}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Rooms List */}
                <div className="column" style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
                    <h3>房间 (Rooms)</h3>
                    {selectedBuilding ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {rooms.map(room => (
                                <li 
                                    key={room.roomID} 
                                    onClick={() => handleRoomClick(room)}
                                    style={{ 
                                        cursor: 'pointer', 
                                        padding: '5px', 
                                        backgroundColor: selectedRoom?.roomID === room.roomID ? '#e0e0e0' : 'transparent' 
                                    }}
                                >
                                    {room.roomNumber} (Occupancy: {room.currentOccupancy}/{room.capacity})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Select a building to view rooms</p>
                    )}
                </div>

                {/* Beds List */}
                <div className="column" style={{ flex: 1, border: '1px solid #ccc', padding: '10px' }}>
                    <h3>床位 (Beds)</h3>
                    {selectedRoom ? (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {beds.map(bed => (
                                <li key={bed.bedID} style={{ padding: '5px' }}>
                                    {bed.bedNumber} - <span style={{ color: bed.status === 'Occupied' ? 'red' : 'green' }}>{bed.status}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Select a room to view beds</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DormitoryList;
