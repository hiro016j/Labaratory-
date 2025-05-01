import { useState } from 'react';
import Logo from "../../assets/IMG_20221223_175001_411.png";
import battery from "../../assets/circuit-battery.png";
import led from "../../assets/circuit-led.png";
import switcher from "../../assets/circuit-switch-of.png";
import rezistor from "../../assets/circuit-rezistor.png"
import capacitor from "../../assets/circuit-capacitor.png"
import diod from "../../assets/circuit-diod.png"
import potentiometer from "../../assets/circuit-potentiometer.png"
import voltmetr from "../../assets/circuit-voltmeter.png"
import ammetr from "../../assets/circuit-ammeter.png"

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import DraggableItem from './DraggableItem';

const elements = [
    {
        id: "drag1",
        type: "led",
        src: led,
        title: "LED",
        resistance: 0,
        voltageDrop: 2,     // Qizil LED uchun o‘rtacha qiymat
        brightness: 0,
        isBurned: false,
        isOn: false,
        current: 0
    },
    {
        id: "drag2",
        type: "battery",
        src: battery,
        title: "Batareya",
        isOn: 9,         // 9V batareya
        current: 0
    },
    {
        id: "drag3",
        type: "switcher",
        src: switcher,
        title: "Kalit",
        isOn: false,        // Boshlang‘ichda o‘chirilgan
        currentVoltage: { voltage: 0, type: null },
        resistance: 0,
        out: undefined
    },
    {
        id: "drag4",
        type: "rezistor",
        src: rezistor,
        title: "Rezistor",
        isOn: 1,    // 220 Ohm — LED bilan ishlash uchun klassik
        current: 0
    },
    {
        id: "drag5",
        type: "capacitor",
        src: capacitor,
        title: "Kondensator",
        isOn: 0.1,      // Doimiy tokda vaqtinchalik tok o‘tkazadi
        voltage: 0,         // Zaryadlangan kuchlanish
        current: 0
    },
    {
        id: "drag6",
        type: "diod",
        src: diod,
        title: "Diod",
        voltageDrop: 0.7,   // Oddiy silikon diod uchun
        resistance: 0,
        isOn: false,
        current: 0
    },
    {
        id: "drag7",
        type: "potentiometer",
        src: potentiometer,
        title: "Potensiometr",
        isOn: 10000,   // O‘zgartiriladigan qiymat (max)
        current: 0
    },
    {
        id: "drag8",
        type: "voltmetr",
        src: voltmetr,
        title: "Voltmetr",
        resistance: Infinity,  // Voltmetr tok o‘tkazmasligi kerak
        voltage: 0
    },
    {
        id: "drag9",
        type: "ammetr",
        src: ammetr,
        title: "Ampermetr",
        resistance: 0,         // Ampermetr zanjirga ulanadi, qarshiligi 0 bo‘ladi
        current: 0
    }
];


const Toolbar = () => {
    const [screen, setScreen] = useState(true);

    return (
        <div className={(screen ? 'w-100' : 'w-0 ') + 'h-screen transition-all bg-gray-900 backdrop-blur-0 absolute z-100'}>
            <div className={(screen ? 'w-100 ' : 'w-0 ') + "h-screen button-shadow transition bg-gray-900 backdrop-blur-0 overflow-hidden"}>
                <div className='p-3 text-white grid gap-2 justify-center text-center'>
                    <img src={Logo} alt="" />
                    <h1 className='text-xl'>PhysiksHub Elektoron Labaratoriya</h1>
                </div>
                <div className='w-full grid grid-cols-3 p-5 gap-3'>
                    {elements.map((el) => (
                        <DraggableItem
                            key={el.id}
                            id={el.id}
                            type={el.type}
                            src={el.src}
                            title={el.title}
                            resistance={el.resistance}
                            voltage={el.voltage}
                            brightness={el.brightness}
                            isBurned={el.isBurned}
                            isOn={el.isOn}
                            currentVoltage={el.currentVoltage}
                            current={el.current}
                            voltageDrop={el.voltageDrop}
                            out={el.out}
                        />
                    ))}
                </div>
            </div>
            <div
                className="button-shadow w-[40px] h-[50px] text-white rounded-xl cursor-pointer flex justify-center items-center bg-gray-900 absolute top-[10px] right-[-50px] z-10"
                onClick={() => setScreen(!screen)}
            >
                {screen ? <FaChevronLeft /> : <FaChevronRight />}
            </div>
        </div>
    );
};

export default Toolbar;
