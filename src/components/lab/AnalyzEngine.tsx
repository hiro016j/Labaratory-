import React, { useEffect } from 'react'

interface Point {
    x: number;
    y: number;
    id: number;
    pathId: number;
    io: string;
    isActive: boolean;
    currentVoltage: { id: number | null, voltage: number, type: "+" | "-" | null };
    ct: "start" | "end" | "point";
}

interface Connection {
    start: Point;
    end: Point;
}

interface Element {
    id: number,
    type: string,
    x: number,
    y: number,
    src: string,
    resistance?: number,
    voltage?: number,
    brightness?: number,
    isBurned?: boolean,
    isOn?: boolean | number,
    currentVoltage?: { voltage: number, type: "+" | "-" | null };
    current?: number,
    voltageDrop?: number,
    out?: string | undefined
};

interface AnalyzProp {
    elements: Element[],
    connections: Connection[],
    onResult: (res1: Connection[], res2:Element[]) => void,
}
interface ActivePoint {
    pathId: number;
    currentVoltage: { id: number | null, voltage: number, type: "+" | "-" | null };
}

const AnalyzEngine: React.FC<AnalyzProp> = ({ elements, connections, onResult }) => {
    useEffect(() => {
        const batteryElements = elements.filter(el => el.type === "battery");
        const id = requestIdleCallback(() => {
            batteryAnalyz(batteryElements);
            switchersAnalyz()
            onResult(connections, elements);
        });

        return () => cancelIdleCallback(id);
    }, [elements, connections]);
    const batteryAnalyz = (batteryElements: Element[]) => {
        batteryElements.forEach(battery => {
            connections.forEach(conn => {
                if (conn.start.ct === "start" && conn.start.id === battery.id && conn.start.io === "left") {
                    conn.start.currentVoltage = { id: battery.id, voltage: Number(battery.isOn), type: "-" }
                    conn.start.isActive = true
                } else if (conn.start.ct === "start" && conn.start.id === battery.id && conn.start.io === "right") {
                    conn.start.currentVoltage = { id: battery.id, voltage: Number(battery.isOn), type: "+" }
                    conn.start.isActive = true
                } else if (conn.end.ct === "end" && conn.end.id === battery.id && conn.end.io === "left") {
                    conn.end.currentVoltage = { id: battery.id, voltage: Number(battery.isOn), type: "-" }
                    conn.end.isActive = true
                } else if (conn.end.ct === "end" && conn.end.id === battery.id && conn.end.io === "right") {
                    conn.end.currentVoltage = { id: battery.id, voltage: Number(battery.isOn), type: "+" }
                    conn.end.isActive = true
                }
            })
        })
        connectionsActivity(batteryElements)
    }
    const connectionsActivity = (batteryElements: Element[]) => {
        const batteryElementsId = batteryElements.map(item => item.id)
        const activateConn = new Set<ActivePoint>()
        connections.forEach(item => {
            if (item.start.isActive && item.start.ct === "start" && batteryElementsId.find(b => b === item.start.id)) {
                activateConn.add({
                    pathId: item.start.pathId,
                    currentVoltage: item.start.currentVoltage,
                })

            } else if (item.end.isActive && item.end.ct === "end" && batteryElementsId.find(b => b === item.end.id)) {
                activateConn.add({
                    pathId: item.end.pathId,
                    currentVoltage: item.end.currentVoltage,
                })
            }
        })
        activateConn.forEach(conn => {
            connections.forEach(item => {
                if (conn.pathId === item.start.pathId) {
                    item.start.isActive = true;
                    item.start.currentVoltage = conn.currentVoltage;
                }
                if (conn.pathId === item.end.pathId) {
                    item.end.isActive = true;
                    item.end.currentVoltage = conn.currentVoltage;
                }
            })
        })
    };
    const switchersAnalyz = () => {
        const switcherElements = elements.filter(el => el.type === "switcher");

        switcherElements.forEach(switcher => {
            const getConnections = (io: string) =>
                connections.filter(conn =>
                    (conn.start.id === switcher.id && conn.start.io === io) ||
                    (conn.end.id === switcher.id && conn.end.io === io)
                );

            const leftConnections = getConnections("left");
            const rightConnections = getConnections("right");

            const connTypes = [...leftConnections, ...rightConnections].map(conn => {
                const otherNode = conn.start.id === switcher.id ? conn.end : conn.start;
                return otherNode.currentVoltage.type;
            }).filter(Boolean);

            const uniqueTypes = [...new Set(connTypes)];

            if (uniqueTypes.length > 1) {
                alert("Siz noto'g'ri ulanishni amalga oshirdingiz!!!");
                removeLastConnection();
            }

            console.log(connTypes);
            leftConnections.forEach(leftConn => {
                const leftNode = leftConn.start.id === switcher.id ? leftConn.end : leftConn.start;

                rightConnections.forEach(rightConn => {
                    const rightNode = rightConn.start.id === switcher.id ? rightConn.end : rightConn.start;

                    if (switcher.isOn) {
                        if ((leftNode.isActive && rightNode.isActive) && (leftNode.currentVoltage.type !== rightNode.currentVoltage.type)) {
                            alert("Siz noto'g'ri ulanishni amalga oshirdingiz!!!");
                            removeLastConnection();
                        } else if (leftNode.isActive && !rightNode.isActive) {
                            switchConnection(leftNode.currentVoltage, rightNode.pathId);
                            switcher.out = "right";
                        } else if (!leftNode.isActive && rightNode.isActive) {
                            switchConnection(rightNode.currentVoltage, leftNode.pathId);
                            switcher.out = "left";
                        }
                    } else if(!switcher.isOn){
                        if ((leftNode.isActive && rightNode.isActive) && (leftNode.currentVoltage.type !== rightNode.currentVoltage.type)) {
                            alert("Siz noto'g'ri ulanishni amalga oshirdingiz!!!");
                            removeLastConnection();
                        } else if (leftNode.isActive && rightNode.isActive) {
                            switcher.out === "left" ? switchConnection({ id: leftNode.currentVoltage.id, voltage: 0, type: null }, leftNode.pathId) : switchConnection({ id: rightNode.currentVoltage.id, voltage: 0, type: null }, rightNode.pathId);
                        }
                    }
                });
            });
        });

        function switchConnection(voltage: { id: number | null, voltage: number, type: "+" | "-" | null }, pathId: number) {
            connections.forEach(conn => {
                if (conn.start.pathId === pathId) {
                    conn.start.currentVoltage = voltage;
                    conn.start.isActive = voltage.type !== null;
                }
                if (conn.end.pathId === pathId) {
                    conn.end.currentVoltage = voltage;
                    conn.end.isActive = voltage.type !== null;
                }
            });
        }

        function removeLastConnection() {
            const lastConn = connections[connections.length - 1];
            const newConn = connections.filter(item =>
                item.start.pathId !== lastConn.start.pathId ||
                item.end.pathId !== lastConn.end.pathId
            );
            connections = newConn;
        }
    };
    const ledAnalyz = () => {
        const ledElements = elements.filter(el => el.type === "led");
        const ledConnections = connections.filter(conn =>
            (conn.start.id === ledElements[0].id && conn.start.ct === "start") ||
            (conn.end.id === ledElements[0].id && conn.end.ct === "end")
        );
        
    }


    return (
        <></>
    )
}

export default AnalyzEngine



