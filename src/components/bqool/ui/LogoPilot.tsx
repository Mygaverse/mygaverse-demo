import React from 'react';

export const LogoPilot = ({ className }: { className?: string }) => {
    return (
        <div className={`relative ${className}`}>
            <svg
                viewBox="0 0 173 172"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
            >
                <g filter="url(#filter0_f_24265_3027)">
                    <path
                        d="M168.321 86.119C168.321 103.495 162.605 119.919 153.318 133.01L166.892 168L129.741 154.671C116.881 162.763 102.116 167.524 86.1604 167.524C40.6745 167.524 4 131.106 4 85.881C4 40.656 40.6745 4 86.1604 4C131.646 4 168.321 40.656 168.321 86.119Z"
                        fill="url(#paint0_linear_24265_3027)"
                    />
                </g>
                <path
                    d="M87.7348 55.9237C83.4482 55.9237 79.6378 56.3997 76.5419 57.8279V40.452H49.6314V92.8177C49.6314 93.2938 49.6314 93.2938 49.6314 93.2938C49.6314 114.002 66.5398 130.902 87.2585 130.902C89.64 130.902 92.0214 130.426 94.4029 130.426C111.788 127.331 125.362 111.622 125.362 93.2938C125.124 72.8235 108.215 55.9237 87.7348 55.9237ZM87.7348 105.195C81.0667 105.195 76.0656 99.9585 76.0656 93.5318C76.0656 86.8671 81.3048 81.8685 87.7348 81.8685C94.4029 81.8685 99.4039 87.1051 99.4039 93.5318C99.4039 99.9585 94.1647 105.195 87.7348 105.195Z"
                    fill="white"
                />
                <defs>
                    <filter
                        id="filter0_f_24265_3027"
                        x="0"
                        y="0"
                        width="172.321"
                        height="172"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="BackgroundImageFix"
                            result="shape"
                        />
                        <feGaussianBlur
                            stdDeviation="2"
                            result="effect1_foregroundBlur_24265_3027"
                        />
                    </filter>
                    <linearGradient
                        id="paint0_linear_24265_3027"
                        x1="172.317"
                        y1="-6.26511"
                        x2="43.2155"
                        y2="172.171"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop offset="0.1587" stopColor="#182987" />
                        <stop offset="1" stopColor="#036EB7" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
};
