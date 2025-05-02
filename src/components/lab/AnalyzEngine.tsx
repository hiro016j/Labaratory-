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
    rezistans: number;
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

interface AnalyzProp {
    elements: Element[],
    connections: Connection[],
    onResult: (res1: Connection[], res2: Element[]) => void,
}
interface ActivePoint {
    pathId: number;
    currentVoltage: { id: number | null, voltage: number, type: "+" | "-" | null };
}

const AnalyzEngine: React.FC<AnalyzProp> = ({ elements, connections, onResult }) => {
    const batteryElements = elements.filter(el => el.type === "battery");
    useEffect(() => {
        const id = requestIdleCallback(() => {
            batteryAnalyz();
            switchersAnalyz();
            ledAnalyz();
            rezistorAnalyz();
            onResult(connections, elements);
        });

        return () => cancelIdleCallback(id);
    }, [elements, connections]);
    const batteryAnalyz = () => {
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

            // console.log(connTypes);
            leftConnections.forEach(leftConn => {
                const leftNode = leftConn.start.id === switcher.id ? leftConn.end : leftConn.start;

                rightConnections.forEach(rightConn => {
                    const rightNode = rightConn.start.id === switcher.id ? rightConn.end : rightConn.start;

                    if (switcher.isOn) {
                        if ((leftNode.isActive && rightNode.isActive) && (leftNode.currentVoltage.type !== rightNode.currentVoltage.type)) {
                            alert("❗Siz noto'g'ri ulanishni amalga oshirdingiz❗");
                            removeLastConnection();
                        } else if (leftNode.isActive && !rightNode.isActive) {
                            switchConnection(leftNode.currentVoltage, rightNode.pathId);
                            switcher.out = "right";
                        } else if (!leftNode.isActive && rightNode.isActive) {
                            switchConnection(rightNode.currentVoltage, leftNode.pathId);
                            switcher.out = "left";
                        }
                    } else if (!switcher.isOn) {
                        if ((leftNode.isActive && rightNode.isActive) && (leftNode.currentVoltage.type !== rightNode.currentVoltage.type)) {
                            alert("❗Siz noto'g'ri ulanishni amalga oshirdingiz❗");
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


    };
    const ledAnalyz = () => {
        const ledElements = elements.filter(el => el.type === "led");
        if (ledElements.length === 0) return;
        const ledConnections = connections.filter(conn =>
            (conn.start.id === ledElements[0].id && conn.start.ct === "start") ||
            (conn.end.id === ledElements[0].id && conn.end.ct === "end")
        );
        ledElements.forEach(led => {
            const ledLeftNode = ledConnections.filter(conn =>
                (conn.start.id === led.id && conn.start.io === "left") ||
                (conn.end.id === led.id && conn.end.io === "left")
            );

            const ledRightNode = ledConnections.filter(conn =>
                (conn.start.id === led.id && conn.start.io === "right") ||
                (conn.end.id === led.id && conn.end.io === "right")
            );
            const leftSet = new Set<string | null>();
            const rightSet = new Set<string | null>();
            const leftId = new Set<number | null>();
            const rightId = new Set<number | null>();

            ledLeftNode.map(left => {
                if (left.start.id === led.id && left.start.io === "left") {
                    left.start.currentVoltage.type !== null ? leftSet.add(left.start.currentVoltage.type) : null;
                    leftId.add(left.start.currentVoltage.id)
                } else if (left.end.id === led.id && left.end.io === "left") {
                    left.end.currentVoltage.type !== null ? leftSet.add(left.end.currentVoltage.type) : null;
                    leftId.add(left.end.currentVoltage.id)
                }
            })
            ledRightNode.map(right => {
                if (right.start.id === led.id && right.start.io === "right") {
                    right.start.currentVoltage.type !== null ? rightSet.add(right.start.currentVoltage.type) : null;
                    rightId.add(right.start.currentVoltage.id)
                } else if (right.end.id === led.id && right.end.io === "right") {
                    right.end.currentVoltage.type !== null ? rightSet.add(right.end.currentVoltage.type) : null;
                    rightId.add(right.end.currentVoltage.id)
                }
            })

            if (leftSet.size === 1 && rightSet.size === 1) {
                if (leftSet.has("-") && rightSet.has("+")) {
                    console.log(ledLeftNode, ledRightNode);

                } else {
                    led.isOn = false;
                }

            } else if (leftSet.size > 1 || rightSet.size > 1) {
                alert("Siz noto'g'ri ulanishni amalga oshirdingiz!!!");
                removeLastConnection();
            } else {
                led.isOn = false;
            }

        })
    }

    const rezistorAnalyz = () => {
        const rezistorElements = elements.filter(elem => elem.type === "rezistor");
        rezistorElements.forEach(rezistor => {
            const rezistorLeftConnection = connections.filter(conn =>
                (conn.start.ct === "start" && conn.start.io === "left" && conn.start.id === rezistor.id) ||
                (conn.end.ct === "end" && conn.end.io === "left" && conn.end.id === rezistor.id));
            const rezistorRightConnection = connections.filter(conn =>
                (conn.start.ct === "start" && conn.start.io === "right" && conn.start.id === rezistor.id) ||
                (conn.end.ct === "end" && conn.end.io === "right" && conn.end.id === rezistor.id));
            // console.log(rezistorLeftConnection, rezistorRightConnection);
            if (rezistorLeftConnection.length === 1 && rezistorRightConnection.length === 1) {
                const leftConn = rezistorLeftConnection[0].start.id === rezistor.id ? rezistorLeftConnection[0].start : rezistorLeftConnection[0].end;
                const rightConn = rezistorRightConnection[0].start.id === rezistor.id ? rezistorRightConnection[0].start : rezistorRightConnection[0].end;
                let rezistance = 0;
                if (leftConn.isActive && !rightConn.isActive) {
                    rezistance = (leftConn.rezistans + rezistor.resistance);
                    rightConn.rezistans = rezistance;
                    rightConn.isActive = true;
                    rightConn.currentVoltage = leftConn.currentVoltage;
                } else if (!leftConn.isActive && rightConn.isActive) {
                    rezistance = (rightConn.rezistans + rezistor.resistance);
                    leftConn.rezistans = rezistance;
                    leftConn.isActive = true;
                    leftConn.currentVoltage = rightConn.currentVoltage
                }
            } else if (rezistorLeftConnection.length > 1 || rezistorRightConnection.length > 1) {
                alert("❗Kechirasiz noto'g'ri ulanishni amalga oshirdingiz❗. ⚠ Rezistordan faqat bitta sim yunalishida qullashingiz mumkin ⚠")
                removeLastConnection()
            }

        })

    }
    useEffect(() => {
        connections.forEach(conn => {
            if (conn.start.isActive && conn.start.ct === "start") {
                connections.forEach(item => {
                    if (item.start.pathId === conn.start.pathId) {
                        item.start.rezistans = conn.start.rezistans;
                        item.start.isActive = true;
                        item.start.currentVoltage = conn.start.currentVoltage;
                    }
                    if (item.end.pathId === conn.start.pathId) {
                        item.end.rezistans = conn.start.rezistans;
                        item.end.isActive = true;
                        item.end.currentVoltage = conn.start.currentVoltage;
                    }
                })
            } else if (conn.end.isActive && conn.end.ct === "end") {
                connections.forEach(item => {
                    if (item.start.pathId === conn.end.pathId) {
                        item.start.rezistans = conn.end.rezistans;
                        item.start.isActive = true;
                        item.start.currentVoltage = conn.end.currentVoltage;
                    }
                    if (item.end.pathId === conn.end.pathId) {
                        item.end.rezistans = conn.end.rezistans;
                        item.end.isActive = true;
                        item.end.currentVoltage = conn.end.currentVoltage;
                    }
                })
            }
        })
    }, [connections])

    function removeLastConnection() {
        const lastConn = connections[connections.length - 1];
        const newConn = connections.filter(item =>
            item.start.pathId !== lastConn.start.pathId ||
            item.end.pathId !== lastConn.end.pathId
        );
        connections = newConn;
    }

    return (
        <></>
    )
}

export default AnalyzEngine



