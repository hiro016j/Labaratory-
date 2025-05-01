import React, { useEffect, useState } from 'react';
import { BsTrash3 } from "react-icons/bs";
import { FaCheck } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

interface Post {
    method: "PUT" | "DELETE";
    id: number;
    isOn: boolean | number;
}

type aktion = {
    type: string,
    id: number,
    isOn: boolean | number | undefined,
    objChange: (change: Post) => void,
}
const marks = [
    {
        value: 0,
        label: '0 Ω',
    },
    {
        value: 1000,
        label: '1000 Ω',
    }
];

const AktionBar: React.FC<aktion> = ({ type, id, isOn, objChange }) => {
    const batteryVoltages = [1.5, 3, 4.5, 6, 9, 12];
    const resistorValues = [10, 22, 47, 100, 220, 330, 470, 680, 1000];
    const capacitorValues = [
        { value: 0.1, unit: 'μF' },
        { value: 0.22, unit: 'μF' },
        { value: 0.47, unit: 'μF' },
        { value: 1, unit: 'μF' },
        { value: 2.2, unit: 'μF' },
        { value: 4.7, unit: 'μF' },
        { value: 10, unit: 'μF' },
        { value: 22, unit: 'μF' },
        { value: 47, unit: 'μF' },
        { value: 100, unit: 'μF' },
        { value: 220, unit: 'μF' },
        { value: 470, unit: 'μF' },
        { value: 1000, unit: 'μF' }
    ];

    const [voltage, setVoltage] = useState(9);
    const [resistance, setResistance] = useState(220);
    const [capacitance, setCapacitance] = useState({ value: 1, unit: 'μF' });
    const [resistanceP, setResistanceP] = useState(10);

    const handleVoltageChange = (value: number) => {
        setVoltage(value);
        objChange({ method: "PUT", id, isOn: value });
    }

    const handleResistanceChange = (value: number) => {
        setResistance(value);
        objChange({ method: "PUT", id, isOn: value });
    }

    const handleCapacitanceChange = (value: number) => {
        const selected = capacitorValues.find(c => c.value === value);
        if (selected) {
            setCapacitance(selected);
            objChange({ method: "PUT", id, isOn: value });
        }
    }
    const handleResistancePChange = (e: Event, newValue: number) => {
        e.preventDefault()
        setResistanceP(newValue as number); 
        objChange({ method: "PUT", id, isOn: newValue });
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Delete') {
            objChange({method:"DELETE", id, isOn: true})
          }
        };
    
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
      }, []);
    return (
        <div className='w-auto h-[100px] absolute flex justify-between items-center gap-2 top-[10px] right-[10px] z-10'>
            {
                type === "switcher" ?
                    <div
                        onClick={() => objChange({ method: "PUT", id, isOn: !isOn })}
                        className="border-hover w-[80px] h-[80px] grid gap-3 cursor-pointer justify-center items-center p-3 text-white bg-gray-800 rounded-xl text-center">
                        {isOn ? <FaXmark className='w-full text-2xl' /> : <FaCheck className='w-full text-2xl' />}
                        <p>{isOn ? "Uzish" : "Ulash"}</p>
                    </div>
                    : type === "battery" ?
                        <div
                            className="border-hover w-[100px] h-[80px] overflow-hidden cursor-pointer text-white bg-gray-800 rounded-xl text-center"
                        >
                            <select className='w-full h-[40px] p-1.5' value={voltage} onChange={(e) => handleVoltageChange(Number(e.target.value))}>
                                {batteryVoltages.map(v => (
                                    <option className='bg-gray-900' key={v} value={v}>{v} V</option>
                                ))}
                            </select>
                            <div className="type w-full h-full flex justify-center pt-1.5  bg-green-900">
                                <h1>Batareya</h1>
                            </div>
                        </div>
                        : type === "rezistor" ?
                            <div
                                className="border-hover w-[100px] h-[80px] overflow-hidden cursor-pointer text-white bg-gray-800 rounded-xl text-center"
                            >
                                <select className='w-full h-[40px] p-1.5' value={resistance} onChange={(e) => handleResistanceChange(Number(e.target.value))}>
                                    {resistorValues.map(r => (
                                        <option className='bg-gray-900' key={r} value={r}>{r} Ω</option>
                                    ))}
                                </select>
                                <div className="type w-full h-full flex justify-center pt-1.5  bg-green-900">
                                    <h1>Rezistor</h1>
                                </div>
                            </div>
                            : type === "capacitor" ?
                                <div
                                    className="border-hover w-[100px] h-[80px] overflow-hidden cursor-pointer text-white bg-gray-800 rounded-xl text-center"
                                >
                                    <select
                                        className='w-full h-[40px] p-1.5'
                                        value={capacitance.value}
                                        onChange={(e) => handleCapacitanceChange(Number(e.target.value))}
                                    >
                                        {capacitorValues.map(c => (
                                            <option className='bg-gray-900' key={c.value} value={c.value}>
                                                {c.value} {c.unit}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="type w-full h-full flex justify-center pt-1.5  bg-green-900">
                                        <h1>Kondensator</h1>
                                    </div>
                                </div> : type === "potentiometer" ?
                                    <div
                                        className="border-hover w-[400px] p-5 h-[80px] flex justify-items-center bg-gray-800 rounded-xl"
                                    >
                                        <Box sx={{ width: 350, left: 20 }}>
                                            <Slider
                                                aria-label="Custom marks"
                                                value={resistanceP}
                                                onChange={handleResistancePChange}
                                                valueLabelDisplay="auto"
                                                step={10}
                                                min={0}
                                                max={1000}
                                                marks={marks}
                                            />
                                        </Box>

                                    </div> : null
            }
            <div 
            onClick={() => {objChange({method:"DELETE", id, isOn: true})}}
            className="border-hover w-[80px] h-[80px] grid gap-3 cursor-pointer justify-center items-center p-3 text-red-600 bg-gray-800 rounded-xl text-center">
                <BsTrash3 className='w-full text-2xl' />
                <p>O'chirish</p>
            </div>
        </div>
    );
}

export default AktionBar;
