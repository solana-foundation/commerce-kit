import React from 'react';

interface SolanaIconProps {
    size?: number;
    className?: string;
    'data-testid'?: string;
}

export const SolanaIcon: React.FC<SolanaIconProps> = ({ size = 24, className, 'data-testid': testId }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 90 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            role="img"
            aria-label="Solana"
            data-testid={testId}
            data-size={size}
        >
            <path
                d="M44.7352 90.0006C69.526 90.0006 89.4703 70.0563 89.4703 45.2654C89.4703 20.4746 69.526 0.530273 44.7352 0.530273C19.9443 0.530273 0 20.4746 0 45.2654C0 70.0563 19.9443 90.0006 44.7352 90.0006Z"
                fill="#FFFCFB"
            />
            <path
                d="M44.7353 1.03027C69.25 1.03037 88.9707 20.7509 88.9707 45.2656C88.9706 69.7802 69.2499 89.5009 44.7353 89.501C20.2207 89.501 0.500101 69.7803 0.5 45.2656C0.5 20.7509 20.2206 1.03027 44.7353 1.03027Z"
                stroke="url(#paint0_linear_solana)"
                strokeOpacity="0.39"
            />
            <mask
                id="mask0_solana"
                style={{ maskType: 'alpha' }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="90"
                height="91"
            >
                <path
                    d="M44.7352 90.0006C69.526 90.0006 89.4703 70.0563 89.4703 45.2654C89.4703 20.4746 69.526 0.530273 44.7352 0.530273C19.9443 0.530273 0 20.4746 0 45.2654C0 70.0563 19.9443 90.0006 44.7352 90.0006Z"
                    fill="#2775CA"
                />
            </mask>
            <g mask="url(#mask0_solana)">
                <g filter="url(#filter0_f_solana)">
                    <path
                        d="M70.9378 9.91114C21.8125 4.0161 10.8412 50.3577 11.4962 74.2653C2.81744 61.984 -8.74323 32.5088 14.4439 12.8587C37.6311 -6.79146 61.7678 2.70609 70.9378 9.91114Z"
                        fill="white"
                        fillOpacity="0.6"
                    />
                </g>
            </g>
            <path
                d="M25.9956 56.6612C26.3306 56.3263 26.7911 56.1309 27.2796 56.1309L71.5791 56.1309C72.3886 56.1309 72.7933 57.1079 72.2211 57.6801L63.4701 66.4311C63.1351 66.7661 62.6745 66.9615 62.186 66.9615H17.8866C17.0771 66.9615 16.6723 65.9845 17.2446 65.4123L25.9956 56.6612Z"
                fill="url(#paint1_linear_solana)"
            />
            <path
                d="M25.9956 23.9874C26.3445 23.6524 26.8051 23.457 27.2796 23.457L71.5791 23.457C72.3886 23.457 72.7933 24.434 72.2211 25.0063L63.4701 33.7573C63.1351 34.0922 62.6745 34.2876 62.186 34.2876H17.8866C17.0771 34.2876 16.6723 33.3106 17.2446 32.7384L25.9956 23.9874Z"
                fill="url(#paint2_linear_solana)"
            />
            <path
                d="M63.4701 40.2198C63.1351 39.8848 62.6745 39.6895 62.186 39.6895L17.8866 39.6895C17.0771 39.6895 16.6723 40.6664 17.2446 41.2387L25.9956 49.9897C26.3306 50.3247 26.7911 50.5201 27.2796 50.5201L71.5791 50.5201C72.3886 50.5201 72.7933 49.5431 72.2211 48.9708L63.4701 40.2198Z"
                fill="url(#paint3_linear_solana)"
            />
            <defs>
                <filter
                    id="filter0_f_solana"
                    x="-43.1875"
                    y="-42.8291"
                    width="158.125"
                    height="161.095"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="22" result="effect1_foregroundBlur_solana" />
                </filter>
                <linearGradient
                    id="paint0_linear_solana"
                    x1="23.1811"
                    y1="7.03724"
                    x2="71.5766"
                    y2="90.001"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#24DCB3" />
                    <stop offset="1" stopColor="#D428FC" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_solana"
                    x1="67.3472"
                    y1="18.2298"
                    x2="36.6883"
                    y2="76.9538"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_solana"
                    x1="53.9415"
                    y1="11.2305"
                    x2="23.2828"
                    y2="69.9543"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient
                    id="paint3_linear_solana"
                    x1="60.6017"
                    y1="14.7082"
                    x2="29.943"
                    y2="73.432"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
            </defs>
        </svg>
    );
};
