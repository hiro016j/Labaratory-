// KonvaImgItem.tsx
import React from 'react';
import { Image } from 'react-konva';
import useImage from 'use-image';

interface KonvaImgItemProps {
  type:string;
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
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    stroke?: string;
    strokeWidth?: number;
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
  const [image] = useImage(type === "switcher" && isOn ? "/src/assets/circuit-switch-on.png" : src);

  return image ? (
    <Image
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      draggable={draggable}
      opacity={style.opacity ?? 1}
      shadowBlur={style.shadowBlur ?? 0}
      shadowColor={style.shadowColor ?? ''}
      rotation={style.rotation ?? 0}
      scaleX={style.scaleX ?? 1}
      scaleY={style.scaleY ?? 1}
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
    />
  ) : null;
};

export default KonvaImgItem;
