export default function Logo({ size = 48, showText = false }) {
    return (
      <svg
        viewBox="0 0 200 180"
        xmlns="http://www.w3.org/2000/svg"
        style={{ height: size, width: 'auto' }}
      >
        <defs>
          <clipPath id="clip-love">
            <polygon points="0,0 115,0 85,180 0,180" />
          </clipPath>
          <clipPath id="clip-ego">
            <polygon points="115,0 200,0 200,180 85,180" />
          </clipPath>
        </defs>
       
        <path
          d="M100,160 C40,120 10,85 10,55 C10,30 30,15 55,15 C75,15 90,28 100,42 C110,28 125,15 145,15 C170,15 190,30 190,55 C190,85 160,120 100,160Z"
          fill="#5B21B6"
          clipPath="url(#clip-love)"
        />
      
        <path
          d="M100,160 C40,120 10,85 10,55 C10,30 30,15 55,15 C75,15 90,28 100,42 C110,28 125,15 145,15 C170,15 190,30 190,55 C190,85 160,120 100,160Z"
          fill="#B8860B"
          clipPath="url(#clip-ego)"
        />
       
        <polygon
          points="108,10 88,82 104,82 86,162 118,72 100,72 116,10"
          fill="#FFFFFF"
          opacity="0.95"
        />
      
        <text
          x="52" y="82"
          fontFamily="Inter,Arial,sans-serif"
          fontWeight="900"
          fontSize="22"
          fill="#FFFFFF"
          textAnchor="middle"
        >LOVE</text>
  
        <text
          x="146" y="108"
          fontFamily="Inter,Arial,sans-serif"
          fontWeight="900"
          fontSize="20"
          fill="#FFFFFF"
          textAnchor="middle"
          opacity="0.9"
        >EGO</text>
      </svg>
    );
  }
  