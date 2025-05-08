import React, { useEffect } from 'react'

interface Point {
    x: number;
    y: number;
    id: number;
    pathId: number;
    io: 'left' | 'right';
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
    }, [elements, connections, batteryElements]);
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

    function switchersAnalyz() {
        const switchers = elements.filter(el => el.type === 'switcher');

        switchers.forEach(sw => {
            // Olingan tok ma'lumotini uzatish uchun yordamchi:
            const propagateVoltage = (act: ActivePoint) => {
                connections.forEach(conn => {
                    [conn.start, conn.end].forEach(pt => {
                        if (pt.pathId === act.pathId) {
                            pt.currentVoltage = { ...act.currentVoltage };
                            pt.isActive = act.currentVoltage.type !== null;
                        }
                    });
                });
            };

            // Switcher'ga ulangan chap va o'ng tarmoqlar
            const leftConns = connections.filter(conn =>
                (conn.start.id === sw.id && conn.start.io === 'left') ||
                (conn.end.id === sw.id && conn.end.io === 'left')
            );
            const rightConns = connections.filter(conn =>
                (conn.start.id === sw.id && conn.start.io === 'right') ||
                (conn.end.id === sw.id && conn.end.io === 'right')
            );

            // Chap tomondan faollashtirilgan nuqta (point)
            const leftActive = leftConns
                .map(conn => conn.start.id === sw.id ? conn.end : conn.start)
                .find(pt => pt.isActive);

            // O'ng tomondan faollashtirilgan nuqta
            const rightActive = rightConns
                .map(conn => conn.start.id === sw.id ? conn.end : conn.start)
                .find(pt => pt.isActive);

            // Switch YOQILGAN holatda
            if (sw.isOn) {
                if (leftActive) {
                    // Chap → O'ng
                    rightConns.forEach(conn => {
                        const target = conn.start.id === sw.id ? conn.end : conn.start;
                        propagateVoltage({ currentVoltage: leftActive.currentVoltage, pathId: target.pathId });
                    });
                    sw.out = 'right';
                } else if (rightActive) {
                    // O'ng → Chap
                    leftConns.forEach(conn => {
                        const target = conn.start.id === sw.id ? conn.end : conn.start;
                        propagateVoltage({ currentVoltage: rightActive.currentVoltage, pathId: target.pathId });
                    });
                    sw.out = 'left';
                } else {
                    // Ikkala tomonda ham hech kim faollashmagan => switch o'chirilgan kabi
                    sw.isOn = false;
                }

                // Switch O‘CHIRILGAN holatda: ajratilgan simni 0V ga tushiramiz
            } else {
                if (leftActive && rightActive) {
                    // oldingi yo‘lakka qarab nol voltaj yuboramiz
                    const killPath = (pathId: number) => propagateVoltage({
                        currentVoltage: { id: null, voltage: 0, type: null }, pathId: pathId
                    });
                    sw.out === 'left'
                        ? killPath(leftActive.pathId)
                        : killPath(rightActive.pathId);
                }
            }
        });
    }

    // Improved ledAnalyz function with fixes and optimizations
    function ledAnalyz() {
        // Find all LED elements
        const ledElements = elements.filter(el => el.type === "led");
        if (!ledElements.length) return;

        ledElements.forEach((led) => {
            // Get connections for this specific LED
            const relatedConns = connections.filter(conn =>
                conn.start.id === led.id || conn.end.id === led.id
            );
            if (!relatedConns.length) return;

            // Split into left and right side connections
            const leftConns = relatedConns.filter(conn =>
                (conn.start.id === led.id && conn.start.io === "left") ||
                (conn.end.id === led.id && conn.end.io === "left")
            );
            const rightConns = relatedConns.filter(conn =>
                (conn.start.id === led.id && conn.start.io === "right") ||
                (conn.end.id === led.id && conn.end.io === "right")
            );

            // Determine active nodes
            const leftNode = leftConns.find(conn => (conn.start.id === led.id ? conn.end : conn.start).isActive);
            const rightNode = rightConns.find(conn => (conn.start.id === led.id ? conn.end : conn.start).isActive);
            if (!leftNode || !rightNode) {
                // No active path: LED is off
                led.brightness = 0;
                led.isOn = false;
                return;
            }

            // Extract voltage and resistances
            const voltage = Number((leftNode.start?.currentVoltage || leftNode.end?.currentVoltage).voltage);
            const rLeft = Number(leftNode.start?.rezistans || leftNode.end?.rezistans);
            const rRight = Number(rightNode.start?.rezistans || rightNode.end?.rezistans);
            const rLed = Number(led.resistance);

            // Total resistance in series
            const rTotal = rLeft + rLed + rRight;
            const current = voltage / rTotal;

            // LED voltage drop and brightness
            const vLed = Math.round((current * rLed) * 100) / 100;
            led.brightness = Math.round((current / 0.1) * 1000) / 500; // or other formula
            led.isOn = true;

            // Update other nodes' voltages
            [...leftConns, ...rightConns].forEach(conn => {
                // Determine the node not attached to LED
                const node = (conn.start.id === led.id) ? conn.end : conn.start;
                node.currentVoltage = { ...node.currentVoltage, voltage: vLed };
                console.log(node.currentVoltage.type);

                node.isActive = true;
                node.rezistans = node.rezistans; // unchanged
            });
        });
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

    // Improved voltmetrAnalyz function with fixes and optimizations
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

            if (voltmetrLeftConn.length < 1 || voltmetrRightConn.length < 1) {
                voltmetr.isOn = 0;
                return;
            }
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



