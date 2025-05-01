import React from 'react'
import { Line } from 'react-konva'

interface pos {
    l: number,
    ct: string,
}

const SnapObj: React.FC<pos> = ({ l, ct }) => {
    const points =
        ct === "X"
            ? [l, 0, l, window.innerHeight]
            : [0, l, window.innerWidth, l];

    return (
        <Line
            points={points}
            stroke="dodgerblue"
            dash={[4,4]}
            strokeWidth={2}
        />
    );
};


export default SnapObj