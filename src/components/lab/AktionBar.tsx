import { Box, Slider, Typography } from "@mui/material";
import { FC, useState } from "react"
import { IoIosRadioButtonOff, IoIosRadioButtonOn, IoIosTrash } from "react-icons/io";
interface Element {
    id: number,
    type: string,
    x: number,
    y: number,
    src: string,
    resistance: number,
    voltage?: number,
    brightness?: number,
    isBurned?: boolean,
    isOn?: boolean | number,
    currentVoltage?: { voltage: number, type: "+" | "-" | null };
    current?: number,
    voltageDrop?: number,
    out?: string | undefined
};

interface Post {
    method: "PUT" | "DELETE";
    id: number;
    isOn: boolean | number;
}
interface Acyion {
    element: Element[],
    resElem: (res: Post) => void,
    hoverChange: (hover: number) => void
}

const AktionBar: FC<Acyion> = ({ element, resElem, hoverChange }) => {
    const [value, setValue] = useState(50);

    const handleChange = (_event: Event, newValue: number | number[]) => {
        // Agar slider range bo‘lsa, massiv bo'lishi mumkin
        if (typeof newValue === 'number') {
            setValue(newValue);
        }
    };
    return (
        <div className="grid gap-2 justify-center w-[400px] h-[500px] overflow-y-auto overflow-x-hidden absolute top-2 right-2 rounded-lg z-50">
            {
                element.length === 0 ? <div className="w-[400px] h-10 bg-gray-100 flex rounded-lg justify-center shadow-lg items-center"><h1 className="text-center text-gray-500">No element</h1></div> :
                    <div className="w-[400px] h-auto grid gap-2 p-2 justify-center absolute bg-gray-100 shadow-lg rounded-lg">
                        {
                            element.map((el) => (
                                <div key={el.id} className="w-[380px] h-10 flex justify-between items-center relative bg-gray-200 p-2 rounded-lg shadow-md cursor-pointer hover:shadow-gray-500 transition" onClick={() => { hoverChange(el.id) }}>
                                    <div className="flex justify-start gap-1.5 items-center">
                                        <img src={el.src} alt="" className="w-10 h-10 rounded-4xl" />
                                        <h1 className="text-gray-700">{el.type}</h1>
                                    </div>
                                    <div className="w-[140px] right-[70px] absolute flex justify-start gap-4 items-center">
                                        <h1 className="text-gray-700"><b>V:</b> {el.isOn}</h1>
                                        <h1 className="text-gray-700"><b>R:</b>
                                            {
                                                el.type === "rezistor" || el.type === "led" ?
                                                    <select name="rezistance" id="rezistance">
                                                        <option value="10">10 Ω</option>
                                                        <option value="100">100 Ω</option>
                                                        <option value="220">220 Ω</option>
                                                        <option value="330">330 Ω</option>
                                                        <option value="470">470 Ω</option>
                                                        <option value="1000">1k Ω</option>
                                                        <option value="4700">4.7k Ω</option>
                                                        <option value="10000">10k Ω</option>
                                                        <option value="47000">47k Ω</option>
                                                        <option value="100000">100k Ω</option>
                                                    </select> : el.type === "potentiometer" ?
                                                        <Box
                                                        sx={{
                                                          height: 300,
                                                          display: 'flex',
                                                          flexDirection: 'column',
                                                          alignItems: 'center',
                                                          justifyContent: 'center',
                                                          mt: 4,
                                                        }}
                                                      >
                                                        <Typography gutterBottom>Qiymat: {value} Ω</Typography>
                                                        <Slider
                                                          orientation="vertical"
                                                          value={value}
                                                          onChange={handleChange}
                                                          min={0}
                                                          max={1000}
                                                          step={50}
                                                          valueLabelDisplay="auto"
                                                          color="secondary"
                                                          sx={{ height: 200 }}
                                                        />
                                                      </Box> : " " + el.resistance
                                            }
                                        </h1>
                                    </div>
                                    <div className="w-[70px] flex justify-end gap-1.5 items-center">
                                        {el.type === "switcher" ? <button className="bg-green-500 text-white px-2 py-1 rounded-lg cursor-pointer hover:bg-green-600 transition duration-200">
                                            {el.isOn ? <IoIosRadioButtonOn /> : <IoIosRadioButtonOff />}
                                        </button> : null}
                                        <button
                                            className="bg-red-500 text-white px-2 py-1 rounded-lg cursor-pointer hover:bg-red-600 transition duration-200"
                                            onClick={() => resElem({ method: "DELETE", id: el.id, isOn: false })}
                                        >
                                            <IoIosTrash />
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

            }
        </div>
    )
}

export default AktionBar
