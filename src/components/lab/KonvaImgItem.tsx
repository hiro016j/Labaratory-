// KonvaImgItem.tsx
import Konva from 'konva';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Text, Rect, Group, Circle } from 'react-konva';
import useImage from 'use-image';

interface KonvaImgItemProps {
  type: string;
  isOn: boolean | number | undefined;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  draggable?: boolean;
  style?: {
    opacity?: number;
    shadowBlur?: number;
    shadowColor?: string;
    shadowOpacity?: number,
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    stroke?: string;
    strokeWidth?: number;
    brightness?: number;
    isBurned?: boolean
  };
}

const KonvaImgItem: React.FC<KonvaImgItemProps> = ({
  type,
  isOn,
  src,
  x,
  y,
  width,
  height,
  draggable,
  style = {},
}) => {
  const [image] = useImage(
    type === "switcher" && isOn
      ? "/src/assets/circuit-switch-on.png"
      : type === "led" && isOn
        ? "/src/assets/circuit-led-on.png"
        : src
  );

  const textRef = useRef<Konva.Text>(null);
  const [textWidth, setTextWidth] = useState(0);
  const value = type === 'voltmetr' ? Number(isOn) : Number(isOn);
  const fontSize = value.toString().length > 3 ? 16 : 20;
  const unit = type === 'voltmetr' ? 'V' : type === "ammetr" ? "A" : null;
  const displayText = `${value} ${unit}`;
  const ledBr = isOn ? "#white" : "black";
  const ledSh = style.isBurned ? 10 : style.brightness;

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.getTextWidth());
    }
  }, [displayText]);

  if (image && type !== "voltmetr" && type !== "ammetr") {
    return (
      <Group x={x} y={y} draggable={draggable}>
        {type === "led" && isOn &&
          <Circle
            x={width / 2}
            y={height / 2}
            radius={30}
            fill='white'
            shadowColor='white'
            shadowBlur={ledSh}
            shadowOpacity={0.8}
            filters={[Konva.Filters.Blur]}
            blurRadius={50}
          />
        }
        <Image
          image={image}
          x={x}
          y={y}
          width={width}
          height={height}
          draggable={draggable}
          opacity={style.opacity ?? 1}
          shadowBlur={type === "led" ? ledSh : style.shadowBlur ?? 0}
          shadowColor={type === "led" ? ledBr : style.shadowColor ?? "black"}
          shadowOpacity={style.shadowOpacity ?? 1}  // Yangi qo‘shildi
          rotation={style.rotation ?? 0}
          scaleX={style.scaleX ?? 1}
          scaleY={style.scaleY ?? 1}
          stroke={style.stroke}
          strokeWidth={style.strokeWidth}
        />
      </Group>
    );
  }

  // Voltmetr va ammetr uchun raqamli panel ko‘rinishi
  if (type === "voltmetr" || type === "ammetr") {
    return (
      <Group x={x} y={y + 25}>
        <Rect
          width={width}
          height={height / 2}
          fill="#222"
          cornerRadius={12}
          shadowColor="black"
          shadowBlur={8}
          shadowOffset={{ x: 4, y: 4 }}
          shadowOpacity={0.3}
          stroke="lime"
          strokeWidth={3}
        />
        <Text
          ref={textRef}
          x={width / 2}
          y={height / 2 - 25}
          offsetX={textWidth / 2}
          offsetY={fontSize / 2}
          text={displayText}
          fontSize={fontSize}
          fill="lime"
          fontFamily="Courier New"
        />
      </Group>
    );
  }

  return null;
};

export default KonvaImgItem;
