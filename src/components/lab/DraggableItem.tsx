import React from 'react';
import { useDrag } from 'react-dnd';

interface DraggableItemProps {
    id: string;
    type: string;
    src: string;
    title: string;
    resistance?: number;
    voltage?: number;
    brightness?: number;
    isBurned?: boolean;
    isOn?: boolean | number;
    currentVoltage?: {voltage: number, type: "+" | "-" | null};
    current?: number;
    voltageDrop?: number;
    out?: string | undefined;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ id, type, src, title, resistance, voltage, brightness, isBurned, isOn, out, currentVoltage, current, voltageDrop}) => {
    const [, dragRef] = useDrag(() => ({
        type: 'element',
        item: { id, type, src, resistance, voltage, brightness, isBurned, isOn, out, currentVoltage, current, voltageDrop},
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }));

    return (
        <div
            ref={dragRef}
            className="border-hover toolbar-item text-indigo-100 p-2 cursor-pointer bg-gray-800 rounded-xl text-center"
        >
            <div className='bg-indigo-100 overflow-hidden rounded-lg w-full'>
                <img src={src} className="w-full" alt={title} />
            </div>
            <p>{title}</p>
        </div>
    );
};

export default DraggableItem
