import React, { useEffect, useState } from "react";
import { useDrop } from "react-dnd";
import { Stage, Layer, Circle, Group, Line } from "react-konva";
import KonvaImgItem from "./KonvaImgItem";
import SnapObj from "./SnapObj";
import Konva from "konva";
import AnalyzEngine from "./AnalyzEngine";
import AktionBar from "./AktionBar";

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
interface Post {
  method: "PUT" | "DELETE";
  id: number;
  isOn: boolean | number;
}

const Canvas: React.FC = () => {
  const [isHoveredL, setIsHoveredL] = useState<number | null>(null);
  const [isHoveredR, setIsHoveredR] = useState<number | null>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [drawingLine, setDrawingLine] = useState<Connection | null>(null);
  const [drawingSnapX, setDrawingSnapX] = useState<number | null>(null);
  const [drawingSnapY, setDrawingSnapY] = useState<number | null>(null);
  const [markObj, setMarkObj] = useState<number | null>(null)
  const snapCompare = 5;
  const lineCreation = (start: Point, end: Point) => {
    setConnections((prevConnections) => [...prevConnections, { start, end }]);
  };

  const mouseDown = (start: Point) => {
    setDrawingLine({ start, end: start });
  };

  useEffect(() => {
    if (!drawingLine) {
      setDrawingSnapX(null);
      setDrawingSnapY(null);

      return;
    }
    const { start, end } = drawingLine;
    if (Math.abs(start.x - end.x) <= snapCompare) {
      setDrawingSnapX(start.x);
    } else {
      setDrawingSnapX(null);
    }

    if (Math.abs(start.y - end.y) <= snapCompare) {
      setDrawingSnapY(start.y);
    } else {
      setDrawingSnapY(null);
    }
  }, [drawingLine, snapCompare]);


  const mouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!drawingLine) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    setDrawingLine(prev => {
      if (!prev) return prev;
      let newX = pos.x;
      let newY = pos.y;
      if (Math.abs(prev.start.x - pos.x) <= snapCompare) {
        newX = prev.start.x;
        setDrawingSnapX(prev.start.x);
      } else {
        setDrawingSnapX(null);
      }
      if (Math.abs(prev.start.y - pos.y) <= snapCompare) {
        newY = prev.start.y;
        setDrawingSnapY(prev.start.y);
      } else {
        setDrawingSnapY(null);
      }

      return {
        ...prev,
        end: { ...prev.end, x: newX, y: newY }
      };
    });
  };



  const mouseUp = (
    id: number,
    endPos: { x: number; y: number },
    tr: "left" | "right",
    ct: "start" | "end" | "point"
  ) => {
    if (drawingLine && drawingLine.start.id !== id) {
      lineCreation(drawingLine.start, {
        x: endPos.x,
        y: endPos.y,
        id: id,
        pathId: drawingLine.start.pathId,
        io: tr,
        ct: ct,
        isActive: false,
        currentVoltage: { id: null, voltage: 0, type: null },
        rezistans: 0
      });
      setDrawingLine(null);
    }
  };
  const [, drop] = useDrop(() => ({
    accept: "element",
    drop: (item: Element, monitor) => {
      const offset = monitor.getClientOffset();
      if (offset) {
        const { x, y } = offset;
        const newElement: Element = {
          id: Date.now(),
          type: item.type,
          x,
          y,
          src: item.src,
          resistance: item.resistance,
          voltage: item.voltage,
          brightness: item.brightness,
          isBurned: item.isBurned,
          isOn: item.isOn,
          currentVoltage: item.currentVoltage,
          current: item.current,
          voltageDrop: item.voltage,
          out: item.out

        };
        setElements((prev) => [...prev, newElement]);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const width = window.innerWidth;
  const height = window.innerHeight;

  const handleLogicResult = (conn: Connection[], elem: Element[]) => {
    setConnections([...conn]);
    setElements([...elem]);
  }
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        
        if(!markObj) return;
        handleObjChange({ method: "DELETE", id: markObj, isOn: true })
      }
      if(e.key === 'Escape' && drawingLine) {
        handleObjChange({ method: "DELETE", id: drawingLine.start.pathId, isOn: true })
        setDrawingLine(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [markObj, drawingLine]);
  const handleObjChange = (change: Post) => {
    if (change.method === "DELETE") {
      setElements(prev => prev.filter(el => el.id !== change.id));
      connections.map(e => {
        if (e.start.pathId === change.id || e.start.pathId === change.id) {
          setConnections(prev => prev.filter(c => c.start.pathId !== change.id && c.end.pathId !== change.id))
        } else if (e.start.id === change.id) {
          setConnections(prev => prev.filter(c => c.start.pathId !== e.start.pathId));
        } else if (e.end.id === change.id) {
          setConnections(prev => prev.filter(c => c.end.pathId !== e.end.pathId));
        }
      })
    } else if (change.method === "PUT") {
      setElements(prev => prev.map(el => {
        if (el.id === change.id && (el.type === "rezistor" || el.type === "potentiometer")) {
          return { ...el, resistance: Number(change.isOn) }

        } else if (el.id === change.id) {
          return { ...el, isOn: change.isOn }
        }
        return el
      }))
    }

  }

  // useEffect(() => {
  //   console.log(elements);
  //   console.log(connections);
  // }, [elements, connections])

  return (
    <div ref={drop} className="w-full h-screen bg-gray-900">
      <Stage
        width={width}
        height={height}
        onMouseMove={mouseMove}
        onClick={() => setMarkObj(null)}
        onMouseUp={(e: Konva.KonvaEventObject<MouseEvent>) => {
          if (drawingLine) {
            const stage = e.target.getStage();
            const pos = stage?.getPointerPosition();

            if (pos) {
              const position: Point = {
                x: drawingLine.end.x,
                y: drawingLine.end.y,
                id: drawingLine.start.id,
                pathId: drawingLine.start.pathId,
                io: drawingLine.start.io,
                ct: "point",
                isActive: false,
                currentVoltage: { id: null, voltage: 0, type: null },
                rezistans: 0
              };
              lineCreation(drawingLine.start, position);
              setDrawingLine({
                start: position,
                end: {
                  x: pos.x,
                  y: pos.y,
                  id: drawingLine.start.id,
                  pathId: drawingLine.start.pathId,
                  io: drawingLine.start.io,
                  ct: "point",
                  isActive: false,
                  currentVoltage: drawingLine.start.currentVoltage,
                  rezistans: 0
                },
              });
            } else {
              setDrawingLine(null);
            }
          }
        }}
      >
        <Layer>
          {drawingLine && (
            <Line
              points={[
                drawingLine.start.x,
                drawingLine.start.y,
                drawingLine.end.x,
                drawingLine.end.y,
              ]}
              stroke="#3c4a55"
              strokeWidth={5}
              lineCap="round"
              lineJoin="round"
              tension={1}

            />
          )}
          {connections.map((conn, i) => (
            <Line
              key={i}
              points={[conn.start.x, conn.start.y, conn.end.x, conn.end.y]}
              stroke={markObj === conn.start.pathId ? "#405668" : (conn.start.isActive === true || conn.end.isActive === true) ? "#ffa600" : "#3c4a55"}
              strokeWidth={markObj === conn.start.pathId ? 6 : 5}
              lineCap="round"
              lineJoin="round"
              tension={1}
              onClick={(e) => {
                e.cancelBubble = true;
                setMarkObj(conn.start.pathId)
                
              }}
              onMouseEnter={(e) => {
                e.cancelBubble = true;
                document.body.style.cursor = "pointer";
              }}
              onMouseLeave={(e) => {
                e.cancelBubble = true;
                document.body.style.cursor = "default";
              }}
            />
          ))}
          {elements.map((el, i) => (
            <Group
              key={el.id}
              x={el.x}
              y={el.y}
              draggable
              onClick={(e) => {
                e.cancelBubble = true;
                setMarkObj(el.id)
              }}
              onDragMove={(e) => {
                const newX = e.target.x();
                const newY = e.target.y();
                setConnections((prevConnections) =>
                  prevConnections.map((line) => {
                    if (line.start.id === el.id && line.start.ct === "start") {
                      return {
                        ...line,
                        start:
                          line.start.io === "left"
                            ? { ...line.start, x: newX, y: newY + 50 }
                            : { ...line.start, x: newX + 100, y: newY + 50 },
                      };
                    } else if (line.end.id === el.id && line.end.ct === "end") {
                      return {
                        ...line,
                        end:
                          line.end.io === "left"
                            ? { ...line.end, x: newX, y: newY + 50 }
                            : { ...line.end, x: newX + 100, y: newY + 50 },
                      };
                    }
                    return line;
                  })
                );
              }}
            >
              <KonvaImgItem
                type={el.type}
                isOn={el.isOn}
                src={el.src}
                x={0}
                y={0}
                width={100}
                height={100}
                style={{ shadowBlur: 2, brightness: el.brightness, isBurned: el.isBurned, shadowColor: el.id === markObj ? "white" : "#5050506e", shadowOpacity: 1 }}
              />
              <Circle
                x={0}
                y={50}
                radius={5}
                fill={isHoveredL === i ? "red" : "#3c4a55"}
                stroke="black"
                strokeWidth={isHoveredL === i ? 5 : 0}
                draggable={false}
                onClick={(e) => {
                  e.cancelBubble = true;
                }}
                onMouseEnter={(e) => {
                  e.cancelBubble = true;
                  setIsHoveredL(i);
                  document.body.style.cursor = "pointer";
                }}
                onMouseLeave={(e) => {
                  e.cancelBubble = true;
                  setIsHoveredL(null);
                  document.body.style.cursor = "default";
                }}
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  const group = e.target.getParent();
                  if (group && !drawingLine) {
                    const currentPos = { x: group.x(), y: group.y() };
                    const start: Point = {
                      x: currentPos.x,
                      y: currentPos.y + 50,
                      id: el.id,
                      pathId: Date.now(),
                      io: "left",
                      ct: "start",
                      isActive: false,
                      currentVoltage: { id: null, voltage: 0, type: null },
                      rezistans: 0
                    };
                    mouseDown(start);
                  } else if (drawingLine) {
                    const endPos = e.target.getAbsolutePosition();
                    lineCreation(drawingLine.start, {
                      x: endPos.x,
                      y: endPos.y,
                      id: el.id,
                      pathId: drawingLine.start.pathId,
                      io: "left",
                      ct: "end",
                      isActive: false,
                      currentVoltage: { id: null, voltage: 0, type: null },
                      rezistans: 0
                    });
                    setDrawingLine(null);
                  }
                }}
                onMouseUp={(e) => {
                  e.cancelBubble = true;
                  mouseUp(el.id, e.target.getAbsolutePosition(), "left", "end");
                }}
              />
              <Circle
                x={100}
                y={50}
                radius={5}
                fill={isHoveredR === i ? "red" : "#3c4a55"}
                stroke="black"
                strokeWidth={isHoveredR === i ? 5 : 0}
                draggable={false}
                onClick={(e) => {
                  e.cancelBubble = true;
                }}
                onMouseEnter={(e) => {
                  e.cancelBubble = true;
                  setIsHoveredR(i);
                  document.body.style.cursor = "pointer";
                }}
                onMouseLeave={(e) => {
                  e.cancelBubble = true;
                  setIsHoveredR(null);
                  document.body.style.cursor = "default";
                }}
                onMouseDown={(e) => {
                  e.cancelBubble = true;
                  const group = e.target.getParent();
                  if (group && !drawingLine) {
                    const currentPos = { x: group.x(), y: group.y() };
                    const start: Point = {
                      x: currentPos.x + 100,
                      y: currentPos.y + 50,
                      id: el.id,
                      pathId: Date.now(),
                      io: "right",
                      ct: "start",
                      isActive: false,
                      currentVoltage: { id: null, voltage: 0, type: null },
                      rezistans: 0
                    };
                    mouseDown(start);
                  } else if (drawingLine) {
                    const endPos = e.target.getAbsolutePosition();
                    lineCreation(drawingLine.start, {
                      x: endPos.x,
                      y: endPos.y,
                      id: el.id,
                      pathId: drawingLine.start.pathId,
                      io: "right",
                      ct: "end",
                      isActive: false,
                      currentVoltage: { id: null, voltage: 0, type: null },
                      rezistans: 0
                    });
                    setDrawingLine(null);
                  }
                }}
                onMouseUp={(e) => {
                  e.cancelBubble = true;
                  mouseUp(el.id, e.target.getAbsolutePosition(), "right", "end");
                }}
              />
            </Group>
          ))}
        </Layer>
        <Layer>
          {drawingSnapX !== null && <SnapObj l={drawingSnapX} ct="X" />}
          {drawingSnapY !== null && <SnapObj l={drawingSnapY} ct="Y" />}
        </Layer>
        <AnalyzEngine elements={elements} connections={connections} onResult={handleLogicResult} />

      </Stage>
          
      <AktionBar element={elements} resElem={elements}/>
    </div>
  );
};

export default Canvas;
