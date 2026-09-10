import React from 'react';

interface PointingHandIconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PointingHandIcon: React.FC<PointingHandIconProps> = ({ className = "h-6 w-auto", style }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 180"
      className={className}
      style={style}
      fill="currentColor"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Hand Contour */}
        <path
          strokeWidth="6"
          fill="rgba(255,255,255,0.15)"
          d="
            M 30,55 
            L 90,50 
            C 105,48 120,40 140,32
            C 175,18 215,18 260,22
            C 290,25 320,26 350,28
            C 362,29 370,36 370,45
            C 370,54 362,61 350,62
            L 275,65
            C 278,68 280,72 278,77
            C 275,83 268,87 255,87
            L 260,92
            C 265,97 262,105 250,108
            C 240,110 220,110 205,115
            C 190,120 180,128 165,134
            C 145,142 110,146 88,142
            L 30,138
            Z
          "
        />

        {/* Sleeve Cuff Lines */}
        <path strokeWidth="5" d="M 30,55 L 30,138" />
        <path strokeWidth="4" d="M 80,51 C 82,80 82,110 80,141" />
        <path strokeWidth="3" d="M 88,50 C 90,80 90,110 88,142" />

        {/* Cuff Buttons */}
        <line x1="45" y1="92" x2="68" y2="92" strokeWidth="4" />
        <line x1="45" y1="102" x2="68" y2="102" strokeWidth="4" />

        {/* Index Finger */}
        <path strokeWidth="5" d="M 260,22 C 290,25 320,26 350,28 C 362,29 370,36 370,45 C 370,54 362,61 350,62 L 275,65" />
        {/* Fingernail & Joints */}
        <path strokeWidth="3" d="M 335,32 C 345,33 355,37 355,45 C 355,52 345,56 335,57" />
        <path strokeWidth="3" d="M 290,28 C 291,38 290,48 288,58" />
        <path strokeWidth="3" d="M 240,24 C 242,38 241,52 238,62" />

        {/* Folded Thumb */}
        <path
          strokeWidth="5"
          d="
            M 160,50
            C 180,45 210,48 230,55
            C 245,60 252,70 248,80
            C 242,90 225,92 200,90
            C 180,88 165,80 160,70
          "
        />
        <path strokeWidth="3" d="M 215,58 C 220,68 218,78 212,85" />

        {/* Folded Middle, Ring, Pinky Fingers */}
        <path strokeWidth="4" d="M 275,65 C 282,75 278,85 255,87 L 200,90" />
        <path strokeWidth="4" d="M 255,87 C 262,95 258,105 245,108 L 195,108" />
        <path strokeWidth="4" d="M 245,108 C 250,118 240,126 220,128 C 195,130 175,125 160,120" />

        {/* Engraving Hatching Lines */}
        <path
          strokeWidth="1.8"
          opacity="0.85"
          d="
            M 35,60 L 75,57 M 35,68 L 75,65 M 35,76 L 75,73 M 35,84 L 75,81
            M 35,110 L 75,107 M 35,118 L 75,115 M 35,126 L 75,123
            M 95,55 C 110,65 125,75 140,85
            M 105,65 C 120,75 135,85 150,95
            M 115,75 C 130,85 145,95 160,105
            M 125,85 C 140,95 155,105 170,115
            M 200,28 L 202,38 M 220,27 L 222,37
            M 250,28 L 251,40 M 270,29 L 271,41
            M 300,31 L 301,45 M 320,32 L 321,46
            M 340,33 L 341,47
          "
        />
      </g>
    </svg>
  );
};
