'use client'
import React, { useState, useEffect } from 'react';

const DataStream = () => {
    const [data, setData] = useState({
        gap_height: 0,           // ✅ Static initial value
        object_temp: '0.0',      // ✅ Static initial value
        mode: "Connecting",
        time: 0                  // ✅ Static initial value
    });

    useEffect(() => {
        const eventSource = new EventSource('/api/data');

        eventSource.onmessage = (event) => {
            try {
                // EventSource sends data with "data: " prefix, we need to parse it
                const dataStr = event.data;
                const newData = JSON.parse(dataStr);
                setData(newData);  // ✅ Update state with real data
                console.log("data received from route '/api/data':", newData);
            } catch (error) {
                console.error('Error parsing data:', error);
            }
        }
        
        eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            setData(prev => ({ ...prev, mode: "Connection Error" }));
        }

        eventSource.onopen = () => {
            console.log('EventSource connection opened');
            setData(prev => ({ ...prev, mode: "Connected" }));
        }

        return () => {
            eventSource.close();
            console.log('EventSource closed');
        }
    }, [])

    return (
        <div>
           {data.gap_height} {data.object_temp} {data.mode} {data.time}
        </div>
    )
}

export default DataStream