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
            voltmetrAnalyz();
            ammetrAnalyz();
            onResult(connections, elements);
        });

        return () => cancelIdleCallback(id);
    }, [elements, connections]);
    useEffect(() => {
        rezistorAnalyz();
        ledAnalyz();
    }, [elements])
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
                        if (!leftNode || !rightNode) {
                            switcher.isOn = false;
                        }
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
                    conn.start.currentVoltage.type = voltage.type;
                }
                if (conn.end.pathId === pathId) {
                    conn.end.currentVoltage = voltage;
                    conn.end.isActive = voltage.type !== null;
                    conn.end.currentVoltage.type = voltage.type;
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
        ledElements.forEach((led) => {
            const ledLeftConn = ledConnections.filter(conn =>
                (conn.start.id === led.id && conn.start.io === "left") ||
                (conn.end.id === led.id && conn.end.io === "left")
            );

            const ledRightConn = ledConnections.filter(conn =>
                (conn.start.id === led.id && conn.start.io === "right") ||
                (conn.end.id === led.id && conn.end.io === "right")
            );
            const leftSet = new Set<string | null>();
            const rightSet = new Set<string | null>();
            const leftId = new Set<number | null>();
            const rightId = new Set<number | null>();

            ledLeftConn.map(left => {
                if (left.start.id === led.id && left.start.io === "left") {
                    left.start.currentVoltage.type !== null ? leftSet.add(left.start.currentVoltage.type) : null;
                    leftId.add(left.start.currentVoltage.id)
                } else if (left.end.id === led.id && left.end.io === "left") {
                    left.end.currentVoltage.type !== null ? leftSet.add(left.end.currentVoltage.type) : null;
                    leftId.add(left.end.currentVoltage.id)
                }
            })
            ledRightConn.map(right => {
                if (right.start.id === led.id && right.start.io === "right") {
                    right.start.currentVoltage.type !== null ? rightSet.add(right.start.currentVoltage.type) : null;
                    rightId.add(right.start.currentVoltage.id)
                } else if (right.end.id === led.id && right.end.io === "right") {
                    right.end.currentVoltage.type !== null ? rightSet.add(right.end.currentVoltage.type) : null;
                    rightId.add(right.end.currentVoltage.id)
                }
            })

            const ledLeftNode = ledLeftConn.find(left => left.start.id === led.id || left.end.id === led.id);
            const ledRightNode = ledRightConn.find(right => right.start.id === led.id || right.end.id === led.id);

            if (leftSet.size === 1 && rightSet.size === 1) {
                if (leftSet.has("-") && rightSet.has("+")) {
                    if (ledLeftNode?.start.currentVoltage.id !== ledRightNode?.start.currentVoltage.id) return;
                    const voltage = Number(ledLeftNode?.start.currentVoltage.voltage);
                    // console.log(ledLeftNode, ledRightNode);
                    let allRezistance = 0.1;
                    allRezistance += Number(ledLeftNode?.start.rezistans);
                    allRezistance += Number(ledRightNode?.start.rezistans);
                    const brightness = voltage / allRezistance;
                    const brightnessRound = Math.round(brightness*1000)
                    ;
                    if (brightnessRound > 30 && voltage > 3) {
                        console.log(led.isBurned);
                        led.isBurned = true;
                        led.isOn = false;
                        led.brightness = 0;
                    } else if ((brightnessRound <= 30 && brightnessRound >= 5) || (voltage < 2.2 && voltage > 1.2)) {
                        led.isBurned = false;
                        led.isOn = true;
                        led.brightness = brightnessRound;
                        console.log(brightnessRound);
                    } else {
                        led.isBurned = false;
                        led.isOn = false;
                        led.brightness = 0;
                        console.log(brightnessRound);
                    }
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
        const rezistorElements = elements.filter(el => el.type === "rezistor" || el.type === "potentiometer");

        rezistorElements.forEach(rezistor => {
            const getConnections = (io: string) =>
                connections.filter(conn =>
                    (conn.start.id === rezistor.id && conn.start.io === io) ||
                    (conn.end.id === rezistor.id && conn.end.io === io)
                );

            const leftConnections = getConnections("left");
            const rightConnections = getConnections("right");

            const connTypes = [...leftConnections, ...rightConnections].map(conn => {
                const otherNode = conn.start.id === rezistor.id ? conn.end : conn.start;
                return otherNode.currentVoltage.type;
            }).filter(Boolean);

            const uniqueTypes = [...new Set(connTypes)];

            if (uniqueTypes.length > 1) {
                alert("Siz noto'g'ri ulanishni amalga oshirdingiz!!!");
                removeLastConnection();
            }
            // console.log(connTypes);
            leftConnections.forEach(leftConn => {
                const leftNode = leftConn.start.id === rezistor.id ? leftConn.end : leftConn.start;

                rightConnections.forEach(rightConn => {
                    const rightNode = rightConn.start.id === rezistor.id ? rightConn.end : rightConn.start;

                    if (!leftNode || !rightNode) {
                        rezistor.isOn = false;
                    }
                    if ((leftNode.isActive && rightNode.isActive) && (leftNode.currentVoltage.type !== rightNode.currentVoltage.type)) {
                        alert("❗Siz noto'g'ri ulanishni amalga oshirdingiz❗");
                        removeLastConnection();
                    } else if (leftNode.isActive && !rightNode.isActive) {
                        rezistorConnection(leftNode.currentVoltage, rezistor.resistance + leftNode.rezistans, rightNode.pathId);
                    } else if (!leftNode.isActive && rightNode.isActive) {
                        rezistorConnection(rightNode.currentVoltage, rezistor.resistance + rightNode.rezistans, leftNode.pathId);
                    }
                    if ((leftNode.isActive && rightNode.isActive) && (leftNode.currentVoltage.type !== rightNode.currentVoltage.type)) {
                        alert("❗Siz noto'g'ri ulanishni amalga oshirdingiz❗");
                        removeLastConnection();
                    } else if (leftNode.isActive && rightNode.isActive) {
                        if (leftNode.rezistans > rightNode.rezistans) {
                            if (rezistor.resistance !== leftNode.rezistans - rightNode.rezistans) {
                                rezistorConnection(rightNode.currentVoltage, rezistor.resistance + rightNode.rezistans, leftNode.pathId);
                            }
                        } else {
                            if (rezistor.resistance !== rightNode.rezistans - leftNode.rezistans) {
                                rezistorConnection(leftNode.currentVoltage, rezistor.resistance + leftNode.rezistans, rightNode.pathId);
                            }
                        }
                    }
                }
                );
            });
        });

        function rezistorConnection(voltage: { id: number | null, voltage: number, type: "+" | "-" | null }, rezistance: number, pathId: number) {
            connections.forEach(conn => {
                if (conn.start.pathId === pathId) {
                    conn.start.currentVoltage = voltage;
                    conn.start.isActive = voltage.type !== null;
                    conn.start.currentVoltage.type = voltage.type;
                    conn.start.rezistans = rezistance;
                }
                if (conn.end.pathId === pathId) {
                    conn.end.currentVoltage = voltage;
                    conn.end.isActive = voltage.type !== null;
                    conn.end.currentVoltage.type = voltage.type;
                    conn.end.rezistans = rezistance;
                }
            });
        }


    }

    const voltmetrAnalyz = () => {
        const voltmetrElem = elements.filter(elem => elem.type === "voltmetr");
        voltmetrElem.forEach(voltmetr => {
            const voltmetrConns = connections.filter(conn => conn.start.id === voltmetr.id || conn.end.id === voltmetr.id);
            const voltmetrLeftConn = voltmetrConns.filter(conn => (conn.start.id === voltmetr.id && conn.start.ct === "start" && conn.start.io === "left") || (conn.end.id === voltmetr.id && conn.end.ct === "end" && conn.end.io === "left"));
            const voltmetrRightConn = voltmetrConns.filter(conn => (conn.start.id === voltmetr.id && conn.start.ct === "start" && conn.start.io === "right") || (conn.end.id === voltmetr.id && conn.end.ct === "end" && conn.end.io === "right"));
            const voltmetrLeftPath = new Set<number>()
            const voltmetrRightPath = new Set<number>()

            voltmetrLeftConn.map(left => {
                voltmetrLeftPath.add(left.start.pathId)
            })
            voltmetrRightConn.map(right => {
                voltmetrRightPath.add(right.start.pathId)
            })

            if (voltmetrLeftPath.size > 1 || voltmetrRightPath.size > 1) removeLastConnection();
            console.log(voltmetrLeftConn, voltmetrRightConn);

            if (voltmetrLeftConn.length < 1 || voltmetrRightConn.length < 1) return;
            if (voltmetrLeftConn[0].start.currentVoltage.type === "-" && voltmetrRightConn[0].start.currentVoltage.type === "+") {
                if (voltmetrLeftConn[0].start.currentVoltage.id === voltmetrRightConn[0].start.currentVoltage.id) {
                    voltmetr.isOn = Math.max(voltmetrLeftConn[0].start.currentVoltage.voltage, voltmetrRightConn[0].start.currentVoltage.voltage);
                } else {
                    voltmetr.isOn = voltmetrLeftConn[0].start.currentVoltage.voltage + voltmetrRightConn[0].start.currentVoltage.voltage;
                }
            } else {
                voltmetr.isOn = 0;
            }
        })
    }
    const ammetrAnalyz = () => {
        const ammetrElements = elements.filter(el => el.type === "ammetr");
        ammetrElements.forEach(ammetr => {
            const ammeterLeftConnection = connections.filter(conn => (conn.start.id === ammetr.id && conn.start.ct === "start" && conn.start.io === "left") || (conn.end.id === ammetr.id && conn.end.ct === "end" && conn.end.io === "left"));
            const ammeterRightConnection = connections.filter(conn => (conn.start.id === ammetr.id && conn.start.ct === "start" && conn.start.io === "right") || (conn.end.id === ammetr.id && conn.end.ct === "end" && conn.end.io === "right"));

            if (ammeterLeftConnection.length < 1 || ammeterRightConnection.length < 1) return;

            if (ammeterLeftConnection.length > 1 || ammeterRightConnection.length > 1) removeLastConnection;

            const ammetrLeftNode = ammeterLeftConnection[0];
            const ammetrRightNode = ammeterRightConnection[0];

            if (ammetrLeftNode.start.rezistans > ammetrRightNode.start.rezistans) {
                ammetrRightNode.start.rezistans = ammetrLeftNode.start.rezistans;
                ammetrRightNode.start.currentVoltage = ammetrLeftNode.start.currentVoltage;
                ammetrRightNode.start.isActive = ammetrLeftNode.start.isActive
                ammetr.isOn = Math.round((ammetrLeftNode.start.currentVoltage.voltage - 2) / ammetrLeftNode.start.rezistans * 1000) / 1000
            } else {
                ammetrLeftNode.start.rezistans = ammetrRightNode.start.rezistans;
                ammetrLeftNode.start.currentVoltage = ammetrRightNode.start.currentVoltage;
                ammetrLeftNode.start.isActive = ammetrRightNode.start.isActive
                ammetr.isOn = Math.round((ammetrRightNode.start.currentVoltage.voltage - 2) / ammetrRightNode.start.rezistans * 1000) / 1000
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



